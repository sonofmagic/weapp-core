// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
import { EventTarget, Event, getEventAttributeValue, setEventAttributeValue } from 'event-target-shim'

type BinaryType = 'blob' | 'arraybuffer'

const CONNECTING = 0 as const
const OPEN = 1 as const
const CLOSING = 2 as const
const CLOSED = 3 as const

export type WeappWebSocketTask = WechatMiniprogram.SocketTask & {
  readyState: 0 | 1 | 2 | 3
  CONNECTING: 0
  OPEN: 1
  CLOSING: 2
  CLOSED: 3
}

export class WeappWebSocketEvent<TEventType extends string, TRes> extends Event<TEventType> {
  public value: TRes

  constructor(type: TEventType, value: TRes, eventInitDict?: Event.EventInit | undefined) {
    super(type, eventInitDict)
    this.value = value
  }
}

// https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/SocketTask.html
export type EventSourceEventMap = {
  close: WeappWebSocketEvent<'close', WechatMiniprogram.SocketTaskOnCloseListenerResult>
  error: WeappWebSocketEvent<'error', WechatMiniprogram.GeneralCallbackResult>
  message: WeappWebSocketEvent<'message', WechatMiniprogram.SocketTaskOnMessageListenerResult>
  open: WeappWebSocketEvent<'open', WechatMiniprogram.OnOpenListenerResult>
}

export class WeappWebSocket extends EventTarget<EventSourceEventMap, 'strict'> {
  static CONNECTING: number = CONNECTING
  static OPEN: number = OPEN
  static CLOSING: number = CLOSING
  static CLOSED: number = CLOSED
  private task: WeappWebSocketTask

  CONNECTING = CONNECTING
  OPEN = OPEN
  CLOSING = CLOSING
  CLOSED = CLOSED
  // 微信小程序只有这一种类型
  // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/binaryType
  binaryType: BinaryType = 'arraybuffer'
  // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/bufferedAmount
  // unsigned long
  readonly bufferedAmount: number = 0
  // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/extensions
  readonly extensions: string = ''
  // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/protocol
  readonly protocol: string = ''
  // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
  get readyState() {
    return this.task.readyState
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/url
  readonly url: string
  readonly params: WechatMiniprogram.ConnectSocketOption
  constructor(
    url: string | URL,
    protocols?: string | string[],
    options?: Partial<Omit<WechatMiniprogram.ConnectSocketOption, 'url' | 'protocols'>>,
    connectSocket = wx.connectSocket
  ) {
    super()
    this.url = typeof url === 'string' ? url : url.toString()

    const params = {
      url: this.url,
      protocols: typeof protocols === 'string' ? [protocols] : protocols
    }
    if (typeof options === 'object') {
      for (const k of Object.keys(options)) {
        // @ts-ignore
        params[k] = options[k]
      }
    }
    this.params = params
    this.task = connectSocket(this.params) as WeappWebSocketTask

    this.task.onOpen((result: WechatMiniprogram.OnOpenListenerResult) => {
      const e = new WeappWebSocketEvent('open', result)

      this.dispatchEvent(e)
      this.task.readyState = OPEN
    })

    this.task.onError((result: WechatMiniprogram.GeneralCallbackResult) => {
      const e = new WeappWebSocketEvent('error', result)

      this.dispatchEvent(e)
      //  this.task.readyState = this.task.OPEN
    })

    this.task.onMessage((result: WechatMiniprogram.SocketTaskOnMessageListenerResult) => {
      const e = new WeappWebSocketEvent('message', result)

      this.dispatchEvent(e)
    })

    this.task.onClose((result: WechatMiniprogram.SocketTaskOnCloseListenerResult) => {
      const e = new WeappWebSocketEvent('close', result)

      this.dispatchEvent(e)
      this.task.readyState = CLOSED
    })
  }

  get onclose() {
    return getEventAttributeValue<WeappWebSocket, EventSourceEventMap['close']>(this, 'close')
  }

  set onclose(value) {
    setEventAttributeValue(this, 'close', value)
  }

  get onerror() {
    return getEventAttributeValue<WeappWebSocket, EventSourceEventMap['error']>(this, 'error')
  }

  set onerror(value) {
    setEventAttributeValue(this, 'error', value)
  }

  get onmessage() {
    return getEventAttributeValue<WeappWebSocket, EventSourceEventMap['message']>(this, 'message')
  }

  set onmessage(value) {
    setEventAttributeValue(this, 'message', value)
  }

  get onopen() {
    return getEventAttributeValue<WeappWebSocket, EventSourceEventMap['open']>(this, 'open')
  }

  set onopen(value) {
    setEventAttributeValue(this, 'open', value)
  }

  // #endregion
  // change return type from void to promise
  close(code?: number | undefined, reason?: string | undefined): Promise<WechatMiniprogram.GeneralCallbackResult> {
    return new Promise((resolve, reject) => {
      this.task.close({
        code,
        reason,
        success(res) {
          resolve(res)
        },
        fail(err) {
          reject(err)
        }
      })
    })
  }

  // change return type from void to promise
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): Promise<WechatMiniprogram.GeneralCallbackResult> {
    return new Promise((resolve, reject) => {
      this.task.send({
        data: data as string | ArrayBuffer,
        success(res) {
          resolve(res)
        },
        fail(err) {
          reject(err)
        }
      })
    })
  }
}
