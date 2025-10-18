import { Event, EventTarget, getEventAttributeValue, setEventAttributeValue } from 'event-target-shim'
import { getWxAdapter } from './defaults'
import { getHeaderValue, normaliseResponseHeaders, resolveStatusText } from './shared'

type ReadyState = 0 | 1 | 2 | 3 | 4

const UNSENT = 0 as const
const OPENED = 1 as const
const HEADERS_RECEIVED = 2 as const
const LOADING = 3 as const
const DONE = 4 as const

const SAFE_METHODS = new Set(['GET', 'HEAD'])
const SUPPORTED_METHODS = new Set(['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'TRACE', 'CONNECT'])

function normalizeHeaderName(name: string): string {
  const value = `${name}`
  if (!/^[!#$%&'*+\-.^`|~\w]+$/.test(value)) {
    throw new TypeError(`Invalid character in header field name: "${name}"`)
  }
  return value
}

function normalizeHeaderValue(value: unknown): string {
  return value === undefined ? '' : `${value}`
}

function toArrayBuffer(view: ArrayBufferView): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer
}

function createDomException(message: string, name: string): Error {
  try {
    return new DOMException(message, name)
  }
  catch {
    const error = new Error(message)
    error.name = name
    return error
  }
}

function prepareRequestBody(body: any, headers: Record<string, string>): any {
  if (body == null) {
    return undefined
  }
  if (typeof body === 'string') {
    return body
  }
  if (body instanceof ArrayBuffer) {
    return body
  }
  if (ArrayBuffer.isView(body)) {
    return toArrayBuffer(body)
  }
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    if (!headers['content-type']) {
      headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
    }
    return body.toString()
  }
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return body
  }
  if (typeof body === 'object') {
    if (!headers['content-type']) {
      headers['content-type'] = 'application/json;charset=UTF-8'
    }
    return JSON.stringify(body)
  }
  return `${body}`
}

export class XMLHttpRequestProgressEvent<TType extends string> extends Event<TType> {
  readonly loaded: number
  readonly total: number
  readonly lengthComputable: boolean

  constructor(type: TType, loaded = 0, total = 0) {
    super(type)
    this.loaded = loaded
    this.total = total
    this.lengthComputable = Number.isFinite(total)
  }
}

export class XMLHttpRequestErrorEvent extends Event<'error'> {
  readonly message: string
  constructor(message: string) {
    super('error')
    this.message = message
  }
}

export interface XMLHttpRequestEventMap {
  abort: XMLHttpRequestProgressEvent<'abort'>
  error: XMLHttpRequestErrorEvent
  load: XMLHttpRequestProgressEvent<'load'>
  loadend: XMLHttpRequestProgressEvent<'loadend'>
  loadstart: XMLHttpRequestProgressEvent<'loadstart'>
  progress: XMLHttpRequestProgressEvent<'progress'>
  readystatechange: Event<'readystatechange'>
  timeout: XMLHttpRequestProgressEvent<'timeout'>
}

function isAllowedResponseType(value: string): boolean {
  return value === '' || value === 'text' || value === 'json' || value === 'arraybuffer'
}

export class MiniProgramXMLHttpRequest extends EventTarget<XMLHttpRequestEventMap, 'strict'> {
  static readonly UNSENT: ReadyState = UNSENT
  static readonly OPENED: ReadyState = OPENED
  static readonly HEADERS_RECEIVED: ReadyState = HEADERS_RECEIVED
  static readonly LOADING: ReadyState = LOADING
  static readonly DONE: ReadyState = DONE

  readonly UNSENT = UNSENT
  readonly OPENED = OPENED
  readonly HEADERS_RECEIVED = HEADERS_RECEIVED
  readonly LOADING = LOADING
  readonly DONE = DONE

  timeout = 0
  withCredentials = true

  private method = 'GET'
  private requestUrl = ''
  private requestHeaders: Record<string, string> = {}
  private responseHeaders: Record<string, string> | null = null
  private requestTask: WechatMiniprogram.RequestTask | null = null
  private readyStateInternal: ReadyState = UNSENT
  private statusInternal = 0
  private statusTextInternal = ''
  private responseTypeInternal = ''
  private responseData: any = null
  private sendInvoked = false
  private aborted = false
  private timeoutId: ReturnType<typeof setTimeout> | null = null

  get readyState(): ReadyState {
    return this.readyStateInternal
  }

  get status(): number {
    return this.statusInternal
  }

  get statusText(): string {
    if (this.readyStateInternal === UNSENT || this.readyStateInternal === OPENED) {
      return ''
    }
    return this.statusTextInternal
  }

  get responseType(): string {
    return this.responseTypeInternal
  }

  set responseType(value: string) {
    if (!isAllowedResponseType(value)) {
      throw createDomException('Unsupported responseType', 'InvalidAccessError')
    }
    if (this.readyStateInternal !== OPENED || this.sendInvoked) {
      throw createDomException('Failed to set responseType', 'InvalidStateError')
    }
    this.responseTypeInternal = value
  }

  get response(): any {
    switch (this.responseTypeInternal) {
      case 'arraybuffer':
        return this.responseData instanceof ArrayBuffer
          ? this.responseData
          : this.responseData == null
            ? null
            : toArrayBuffer(new Uint8Array(new TextEncoder().encode(String(this.responseData))))
      case 'json':
        return this.responseData
      case '':
      case 'text':
      default:
        return this.responseText
    }
  }

  get responseText(): string {
    if (this.responseTypeInternal && this.responseTypeInternal !== 'text') {
      return ''
    }
    if (typeof this.responseData === 'string') {
      return this.responseData
    }
    if (this.responseData == null) {
      return ''
    }
    return typeof this.responseData === 'object' ? JSON.stringify(this.responseData) : String(this.responseData)
  }

  get onreadystatechange() {
    return getEventAttributeValue(this as unknown as EventTarget, 'readystatechange') as ((event: Event<'readystatechange'>) => void) | null
  }

  set onreadystatechange(listener) {
    setEventAttributeValue(this as unknown as EventTarget, 'readystatechange', listener as any)
  }

  get onabort() {
    return getEventAttributeValue(this as unknown as EventTarget, 'abort') as ((event: XMLHttpRequestProgressEvent<'abort'>) => void) | null
  }

  set onabort(listener) {
    setEventAttributeValue(this as unknown as EventTarget, 'abort', listener as any)
  }

  get onerror() {
    return getEventAttributeValue(this as unknown as EventTarget, 'error') as ((event: XMLHttpRequestErrorEvent) => void) | null
  }

  set onerror(listener) {
    setEventAttributeValue(this as unknown as EventTarget, 'error', listener as any)
  }

  get onload() {
    return getEventAttributeValue(this as unknown as EventTarget, 'load') as ((event: XMLHttpRequestProgressEvent<'load'>) => void) | null
  }

  set onload(listener) {
    setEventAttributeValue(this as unknown as EventTarget, 'load', listener as any)
  }

  get onloadend() {
    return getEventAttributeValue(this as unknown as EventTarget, 'loadend') as ((event: XMLHttpRequestProgressEvent<'loadend'>) => void) | null
  }

  set onloadend(listener) {
    setEventAttributeValue(this as unknown as EventTarget, 'loadend', listener as any)
  }

  get onloadstart() {
    return getEventAttributeValue(this as unknown as EventTarget, 'loadstart') as ((event: XMLHttpRequestProgressEvent<'loadstart'>) => void) | null
  }

  set onloadstart(listener) {
    setEventAttributeValue(this as unknown as EventTarget, 'loadstart', listener as any)
  }

  get onprogress() {
    return getEventAttributeValue(this as unknown as EventTarget, 'progress') as ((event: XMLHttpRequestProgressEvent<'progress'>) => void) | null
  }

  set onprogress(listener) {
    setEventAttributeValue(this as unknown as EventTarget, 'progress', listener as any)
  }

  get ontimeout() {
    return getEventAttributeValue(this as unknown as EventTarget, 'timeout') as ((event: XMLHttpRequestProgressEvent<'timeout'>) => void) | null
  }

  set ontimeout(listener) {
    setEventAttributeValue(this as unknown as EventTarget, 'timeout', listener as any)
  }

  open(method: string, url: string, async = true): void {
    if (!async) {
      throw new Error('Synchronous XMLHttpRequest is not supported in mini-program environment.')
    }

    const upperMethod = method?.toUpperCase?.() ?? 'GET'
    if (!SUPPORTED_METHODS.has(upperMethod)) {
      throw new TypeError(`Unsupported HTTP method: ${method}`)
    }

    this.method = upperMethod
    this.requestUrl = url
    this.requestHeaders = {}
    this.responseHeaders = null
    this.responseData = null
    this.statusInternal = 0
    this.statusTextInternal = ''
    this.responseTypeInternal = ''
    this.sendInvoked = false
    this.aborted = false

    this.updateReadyState(OPENED)
  }

  setRequestHeader(name: string, value: string): void {
    if (this.readyStateInternal !== OPENED || this.sendInvoked) {
      throw createDomException('Cannot set request header at this time.', 'InvalidStateError')
    }
    const normalizedName = normalizeHeaderName(name)
    const key = normalizedName.toLowerCase()
    const nextValue = normalizeHeaderValue(value)
    this.requestHeaders[key] = this.requestHeaders[key] ? `${this.requestHeaders[key]}, ${nextValue}` : nextValue
  }

  send(body?: any): void {
    if (this.readyStateInternal !== OPENED) {
      throw createDomException('Failed to execute send on XMLHttpRequest.', 'InvalidStateError')
    }
    if (this.sendInvoked) {
      throw createDomException('Send has already been called.', 'InvalidStateError')
    }

    this.sendInvoked = true
    const headers = { ...this.requestHeaders }
    const payload = SAFE_METHODS.has(this.method) ? undefined : prepareRequestBody(body, headers)
    const { request: requestAdapter } = getWxAdapter()

    this.dispatchEvent(new XMLHttpRequestProgressEvent('loadstart', 0, 0) as XMLHttpRequestEventMap['loadstart'])

    const options: WechatMiniprogram.RequestOption = {
      url: this.requestUrl,
      method: this.method as WechatMiniprogram.RequestOption['method'],
      header: headers,
      data: payload,
      responseType: this.responseTypeInternal === 'arraybuffer' ? 'arraybuffer' : 'text',
      success: res => this.handleSuccess(res),
      fail: err => this.handleFailure(err),
      complete: () => this.clearTimeout(),
    }

    if (this.responseTypeInternal === 'json') {
      options.dataType = 'json'
    }

    if (this.timeout > 0) {
      options.timeout = this.timeout
      this.timeoutId = setTimeout(() => this.handleTimeout(), this.timeout)
    }

    (options as any).enableCookie = this.withCredentials

    this.requestTask = requestAdapter(options)
  }

  abort(): void {
    this.aborted = true
    this.clearTimeout()
    if (this.requestTask) {
      try {
        this.requestTask.abort()
      }
      catch { }
    }

    if (this.readyStateInternal === UNSENT || (this.readyStateInternal === DONE && this.statusInternal === 0)) {
      this.dispatchEvent(new XMLHttpRequestProgressEvent('abort', 0, 0) as XMLHttpRequestEventMap['abort'])
      this.dispatchEvent(new XMLHttpRequestProgressEvent('loadend', 0, 0) as XMLHttpRequestEventMap['loadend'])
      return
    }

    this.statusInternal = 0
    this.statusTextInternal = ''
    this.responseHeaders = null
    this.responseData = null
    this.updateReadyState(DONE)
    this.dispatchEvent(new XMLHttpRequestProgressEvent('abort', 0, 0) as XMLHttpRequestEventMap['abort'])
    this.dispatchEvent(new XMLHttpRequestProgressEvent('loadend', 0, 0) as XMLHttpRequestEventMap['loadend'])
  }

  getAllResponseHeaders(): string {
    if (this.readyStateInternal < HEADERS_RECEIVED || !this.responseHeaders) {
      return ''
    }
    return Object.entries(this.responseHeaders)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n')
  }

  getResponseHeader(name: string): string | null {
    if (this.readyStateInternal < HEADERS_RECEIVED) {
      return null
    }
    const value = getHeaderValue(this.responseHeaders, name)
    return value ?? null
  }

  private updateReadyState(state: ReadyState): void {
    if (state === this.readyStateInternal) {
      return
    }
    this.readyStateInternal = state
    this.dispatchEvent(new Event('readystatechange') as XMLHttpRequestEventMap['readystatechange'])
  }

  private handleSuccess(res: WechatMiniprogram.RequestSuccessCallbackResult<string | WechatMiniprogram.IAnyObject | ArrayBuffer>) {
    if (this.aborted) {
      return
    }
    this.clearTimeout()

    this.statusInternal = res.statusCode
    this.statusTextInternal = resolveStatusText(res.statusCode, res.errMsg)
    this.responseHeaders = normaliseResponseHeaders(res.header as Record<string, any> | undefined)

    this.updateReadyState(HEADERS_RECEIVED)

    this.responseData = this.parseResponseData(res.data)

    this.updateReadyState(LOADING)
    const total = Number(getHeaderValue(this.responseHeaders, 'content-length')) || 0
    this.dispatchEvent(new XMLHttpRequestProgressEvent('progress', total, total) as XMLHttpRequestEventMap['progress'])

    this.updateReadyState(DONE)
    this.dispatchEvent(new XMLHttpRequestProgressEvent('load', total, total) as XMLHttpRequestEventMap['load'])
    this.dispatchEvent(new XMLHttpRequestProgressEvent('loadend', total, total) as XMLHttpRequestEventMap['loadend'])
    this.requestTask = null
  }

  private handleFailure(err: WechatMiniprogram.GeneralCallbackResult) {
    if (this.aborted) {
      return
    }
    this.clearTimeout()
    this.statusInternal = 0
    this.statusTextInternal = err?.errMsg ?? 'Network Error'
    this.updateReadyState(DONE)
    this.dispatchEvent(new XMLHttpRequestErrorEvent(this.statusTextInternal) as XMLHttpRequestEventMap['error'])
    this.dispatchEvent(new XMLHttpRequestProgressEvent('loadend', 0, 0) as XMLHttpRequestEventMap['loadend'])
    this.requestTask = null
  }

  private handleTimeout() {
    if (this.readyStateInternal === DONE) {
      return
    }
    this.aborted = true
    if (this.requestTask) {
      try {
        this.requestTask.abort()
      }
      catch { }
    }
    this.statusInternal = 0
    this.statusTextInternal = 'timeout'
    this.updateReadyState(DONE)
    this.dispatchEvent(new XMLHttpRequestProgressEvent('timeout', 0, 0) as XMLHttpRequestEventMap['timeout'])
    this.dispatchEvent(new XMLHttpRequestProgressEvent('loadend', 0, 0) as XMLHttpRequestEventMap['loadend'])
    this.requestTask = null
  }

  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  private parseResponseData(data: any): any {
    switch (this.responseTypeInternal) {
      case 'arraybuffer':
        if (data instanceof ArrayBuffer) {
          return data
        }
        if (ArrayBuffer.isView(data)) {
          return toArrayBuffer(data)
        }
        return new TextEncoder().encode(typeof data === 'string' ? data : JSON.stringify(data ?? '')).buffer
      case 'json':
        if (typeof data === 'string') {
          try {
            return data ? JSON.parse(data) : null
          }
          catch {
            return null
          }
        }
        return data
      case '':
      case 'text':
      default:
        if (typeof data === 'string') {
          return data
        }
        if (data == null) {
          return ''
        }
        return typeof data === 'object' ? JSON.stringify(data) : String(data)
    }
  }

  static toString() {
    return 'function XMLHttpRequest() { [native code] }'
  }

  toString() {
    return '[object XMLHttpRequest]'
  }
}

export const XMLHttpRequest = MiniProgramXMLHttpRequest
