import { Event, EventTarget, getEventAttributeValue, setEventAttributeValue } from 'event-target-shim'
import { getWxAdapter } from './defaults'

type BinaryType = 'arraybuffer'

const CONNECTING = 0 as const
const OPEN = 1 as const
const CLOSING = 2 as const
const CLOSED = 3 as const

export interface WeappWebSocketOptions
  extends Partial<Omit<WechatMiniprogram.ConnectSocketOption, 'url' | 'protocols' | 'success' | 'fail' | 'complete'>> {}

function normaliseProtocols(protocols?: string | string[]): string[] | undefined {
  if (!protocols) {
    return undefined
  }
  return Array.isArray(protocols) ? protocols : [protocols]
}

function toSendPayload(data: string | ArrayBufferLike | ArrayBufferView): string | ArrayBuffer {
  if (typeof data === 'string') {
    return data
  }
  if (data instanceof ArrayBuffer) {
    return data
  }
  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  }
  const view = new Uint8Array(data as ArrayBufferLike)
  return view.slice().buffer
}

export class WebSocketMessageEvent<TData = any> extends Event<'message'> {
  readonly data: TData

  constructor(data: TData) {
    super('message')
    this.data = data
  }
}

export class WebSocketCloseEvent extends Event<'close'> {
  readonly code: number
  readonly reason: string
  readonly wasClean: boolean

  constructor(code: number, reason: string) {
    super('close')
    this.code = code
    this.reason = reason
    this.wasClean = code === 1000
  }
}

export class WebSocketErrorEvent extends Event<'error'> {
  readonly message: string
  readonly error: WechatMiniprogram.GeneralCallbackResult

  constructor(result: WechatMiniprogram.GeneralCallbackResult) {
    super('error')
    this.message = result?.errMsg ?? 'WebSocket error'
    this.error = result
  }
}

export class MiniProgramWebSocket extends EventTarget<
  {
    close: WebSocketCloseEvent
    error: WebSocketErrorEvent
    message: WebSocketMessageEvent
    open: Event<'open'>
  },
  'strict'
> {
  static readonly CONNECTING = CONNECTING
  static readonly OPEN = OPEN
  static readonly CLOSING = CLOSING
  static readonly CLOSED = CLOSED

  readonly CONNECTING = CONNECTING
  readonly OPEN = OPEN
  readonly CLOSING = CLOSING
  readonly CLOSED = CLOSED

  readonly binaryType: BinaryType = 'arraybuffer'
  readonly bufferedAmount = 0
  readonly extensions = ''
  readonly url: string

  private task: WechatMiniprogram.SocketTask | null
  private readyStateInternal: 0 | 1 | 2 | 3 = CONNECTING
  private protocolInternal = ''

  get readyState(): 0 | 1 | 2 | 3 {
    return this.readyStateInternal
  }

  get protocol(): string {
    return this.protocolInternal
  }

  constructor(
    url: string | URL,
    protocols?: string | string[],
    options?: WeappWebSocketOptions,
  ) {
    super()

    this.url = typeof url === 'string' ? url : url.toString()

    const protocolList = normaliseProtocols(protocols)
    this.protocolInternal = ''

    const { connectSocket } = getWxAdapter()
    const task = connectSocket({
      url: this.url,
      protocols: protocolList,
      ...options,
    })

    this.task = task
    this.readyStateInternal = CONNECTING

    task.onOpen((result) => {
      this.readyStateInternal = OPEN
      const selectedProtocol = (result as any)?.protocol ?? (protocolList?.[0] ?? '')
      this.protocolInternal = typeof selectedProtocol === 'string' ? selectedProtocol : ''
      this.dispatchEvent(new Event('open') as Event<'open'>)
    })

    task.onMessage((result) => {
      this.dispatchEvent(new WebSocketMessageEvent(result.data) as WebSocketMessageEvent)
    })

    task.onError((result) => {
      if (this.readyStateInternal === CONNECTING) {
        this.readyStateInternal = CLOSED
      }
      this.dispatchEvent(new WebSocketErrorEvent(result) as WebSocketErrorEvent)
    })

    task.onClose((result) => {
      this.readyStateInternal = CLOSED
      this.dispatchEvent(new WebSocketCloseEvent(result.code, result.reason ?? '') as WebSocketCloseEvent)
    })
  }

  get onopen() {
    return getEventAttributeValue(this as unknown as EventTarget, 'open') as ((event: Event<'open'>) => void) | null
  }

  set onopen(listener) {
    setEventAttributeValue(this as unknown as EventTarget, 'open', listener as any)
  }

  get onerror() {
    return getEventAttributeValue(this as unknown as EventTarget, 'error') as ((event: WebSocketErrorEvent) => void) | null
  }

  set onerror(listener) {
    setEventAttributeValue(this as unknown as EventTarget, 'error', listener as any)
  }

  get onmessage() {
    return getEventAttributeValue(this as unknown as EventTarget, 'message') as ((event: WebSocketMessageEvent) => void) | null
  }

  set onmessage(listener) {
    setEventAttributeValue(this as unknown as EventTarget, 'message', listener as any)
  }

  get onclose() {
    return getEventAttributeValue(this as unknown as EventTarget, 'close') as ((event: WebSocketCloseEvent) => void) | null
  }

  set onclose(listener) {
    setEventAttributeValue(this as unknown as EventTarget, 'close', listener as any)
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyStateInternal !== OPEN) {
      throw new Error('WebSocket is not open.')
    }

    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      throw new TypeError('Mini-program WebSocket does not support Blob payloads.')
    }

    const payload = toSendPayload(data as string | ArrayBufferLike | ArrayBufferView)
    this.task?.send({
      data: payload,
      fail: (result) => {
        this.dispatchEvent(new WebSocketErrorEvent(result) as WebSocketErrorEvent)
      },
    })
  }

  close(code?: number, reason?: string): void {
    if (!this.task || this.readyStateInternal === CLOSED || this.readyStateInternal === CLOSING) {
      return
    }

    this.readyStateInternal = CLOSING
    this.task.close({
      code,
      reason,
      fail: (result) => {
        this.dispatchEvent(new WebSocketErrorEvent(result) as WebSocketErrorEvent)
      },
    })
  }

  static toString() {
    return 'function WebSocket() { [native code] }'
  }

  toString() {
    return '[object WebSocket]'
  }
}
