import { Event, EventTarget, getEventAttributeValue, setEventAttributeValue } from 'event-target-shim'

const SUPPORT_METHOD = new Set(['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'TRACE', 'CONNECT'])
const STATUS_TEXT_MAP: Record<string, string> = {
  100: 'Continue',
  101: 'Switching protocols',

  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',

  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',

  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Request Entity Too Large',
  414: 'Request-URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Requested Range Not Suitable',
  417: 'Expectation Failed',

  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported'
}
// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#events
export type EventSourceEventMap = {
  abort: XMLHttpRequestEvent<'abort'>
  error: XMLHttpRequestEvent<'error'>
  load: XMLHttpRequestEvent<'load'>
  loadend: XMLHttpRequestEvent<'loadend'>
  loadstart: XMLHttpRequestEvent<'loadstart'>
  progress: XMLHttpRequestEvent<'progress'>
  readystatechange: XMLHttpRequestEvent<'readystatechange'>
  timeout: XMLHttpRequestEvent<'timeout'>
}

export class XMLHttpRequestEvent<TEventType extends keyof EventSourceEventMap> extends Event<TEventType> {
  loaded: number
  total: number
  constructor(type: TEventType, eventInitDict?: Event.EventInit | undefined) {
    super(type, eventInitDict)
    this.loaded = 0
    this.total = 0
  }
}

export function createXMLHttpRequestEvent(event: keyof EventSourceEventMap, loaded: number) {
  const e = new XMLHttpRequestEvent(event)
  e.loaded = loaded
  return e
}
// https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest
export class XMLHttpRequest extends EventTarget<EventSourceEventMap, 'strict'> {
  static readonly UNSENT = 0
  static readonly OPENED = 1
  static readonly HEADERS_RECEIVED = 2
  static readonly LOADING = 3
  static readonly DONE = 4
  readonly UNSENT = 0
  readonly OPENED = 1
  readonly HEADERS_RECEIVED = 2
  readonly LOADING = 3
  readonly DONE = 4

  static toString() {
    return 'function XMLHttpRequest() { [native code] }'
  }

  toString() {
    return '[object XMLHttpRequest]'
  }

  #method: string
  #url: string
  #data: null
  #status: number
  #statusText: string
  #readyState: number
  #header: Record<string, any>
  #responseType: string
  #resHeader: null | Record<string, any>
  #response: null
  #timeout: number
  #withCredentials: boolean
  #requestTask: null | WechatMiniprogram.RequestTask
  #requestMethod: WechatMiniprogram.Wx['request']

  get onabort() {
    return getEventAttributeValue<XMLHttpRequest, EventSourceEventMap['abort']>(this, 'abort')
  }

  set onabort(value) {
    setEventAttributeValue(this, 'abort', value)
  }

  get onerror() {
    return getEventAttributeValue<XMLHttpRequest, EventSourceEventMap['error']>(this, 'error')
  }

  set onerror(value) {
    setEventAttributeValue(this, 'error', value)
  }

  get onload() {
    return getEventAttributeValue<XMLHttpRequest, EventSourceEventMap['load']>(this, 'load')
  }

  set onload(value) {
    setEventAttributeValue(this, 'load', value)
  }

  get onloadend() {
    return getEventAttributeValue<XMLHttpRequest, EventSourceEventMap['loadend']>(this, 'loadend')
  }

  set onloadend(value) {
    setEventAttributeValue(this, 'loadend', value)
  }

  get onloadstart() {
    return getEventAttributeValue<XMLHttpRequest, EventSourceEventMap['loadstart']>(this, 'loadstart')
  }

  set onloadstart(value) {
    setEventAttributeValue(this, 'loadstart', value)
  }

  get onprogress() {
    return getEventAttributeValue<XMLHttpRequest, EventSourceEventMap['progress']>(this, 'progress')
  }

  set onprogress(value) {
    setEventAttributeValue(this, 'progress', value)
  }

  get onreadystatechange() {
    return getEventAttributeValue<XMLHttpRequest, EventSourceEventMap['readystatechange']>(this, 'readystatechange')
  }

  set onreadystatechange(value) {
    setEventAttributeValue(this, 'readystatechange', value)
  }

  get ontimeout() {
    return getEventAttributeValue<XMLHttpRequest, EventSourceEventMap['timeout']>(this, 'timeout')
  }

  set ontimeout(value) {
    setEventAttributeValue(this, 'timeout', value)
  }

  constructor(requestMethod = wx.request) {
    super()

    this.#method = ''
    this.#url = ''
    this.#data = null
    this.#status = 0
    this.#statusText = ''
    this.#readyState = XMLHttpRequest.UNSENT
    this.#header = {
      Accept: '*/*'
    }
    this.#responseType = ''
    this.#resHeader = null
    this.#response = null
    this.#timeout = 0
    /** 向前兼容，默认为 true */
    this.#withCredentials = true

    this.#requestTask = null
    this.#requestMethod = requestMethod
  }

  /**
   * readyState 变化
   */
  #callReadyStateChange(readyState: any) {
    const hasChange = readyState !== this.#readyState
    this.#readyState = readyState

    if (hasChange) {
      const readystatechangeEvent = createXMLHttpRequestEvent('readystatechange', 0)
      this.dispatchEvent(readystatechangeEvent)
    }
  }

  /**
   * 执行请求
   */
  #callRequest() {
    // if (!window || !window.document) {
    //   console.warn(
    //     'this page has been unloaded, so this request will be canceled.'
    //   )
    //   return
    // }

    if (this.#timeout) {
      setTimeout(() => {
        if (!this.#status && this.#readyState !== XMLHttpRequest.DONE) {
          // 超时
          if (this.#requestTask) this.#requestTask.abort()
          this.#callReadyStateChange(XMLHttpRequest.DONE)
          const timeoutEvent = createXMLHttpRequestEvent('timeout', 0)
          this.dispatchEvent(timeoutEvent)
        }
      }, this.#timeout)
    }

    // 重置各种状态
    this.#status = 0
    this.#statusText = ''
    this.#readyState = XMLHttpRequest.OPENED
    this.#resHeader = null
    this.#response = null

    // 补完 url
    const url = this.#url
    // url = url.includes('//') ? url : window.location.origin + url

    // 头信息
    const header = Object.assign({}, this.#header)
    // https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies
    // header.cookie = window.document.$$cookie
    // if (!this.withCredentials) {
    //   // 不同源，要求 withCredentials 为 true 才携带 cookie
    //   const { origin } = parseUrl(url)
    //   if (origin !== window.location.origin) delete header.cookie
    // }
    this.#requestTask = this.#requestMethod({
      url,
      data: this.#data || {},
      header,
      // @ts-ignore
      method: this.#method,
      // @ts-ignore
      dataType: this.#responseType === 'json' ? 'json' : 'text',
      responseType: this.#responseType === 'arraybuffer' ? 'arraybuffer' : 'text',
      success: this.#requestSuccess.bind(this),
      fail: this.#requestFail.bind(this),
      complete: this.#requestComplete.bind(this)
    })
  }

  /**
   * 请求成功
   */
  #requestSuccess({ data, statusCode, header }: any) {
    // if (!window || !window.document) {
    //   console.warn(
    //     'this page has been unloaded, so this request will be canceled.'
    //   )
    //   return
    // }

    this.#status = statusCode
    this.#resHeader = header

    this.#callReadyStateChange(XMLHttpRequest.HEADERS_RECEIVED)

    // 处理返回数据
    if (data) {
      this.#callReadyStateChange(XMLHttpRequest.LOADING)
      const loadstartEvent = createXMLHttpRequestEvent('loadstart', header['Content-Length'])
      this.dispatchEvent(loadstartEvent)

      this.#response = data

      const loadEvent = createXMLHttpRequestEvent('load', header['Content-Length'])
      this.dispatchEvent(loadEvent)
    }
  }

  /**
   * 请求失败
   */
  #requestFail(err: any) {
    if (err.status) {
      this.#requestSuccess({
        data: err,
        statusCode: err.status,
        header: err.headers
      })
      return
    }
    this.#status = 0
    this.#statusText = err.errMsg || err.errorMessage
    const errorEvent = createXMLHttpRequestEvent('error', 0)
    this.dispatchEvent(errorEvent)
  }

  /**
   * 请求完成
   */
  #requestComplete() {
    this.#requestTask = null
    this.#callReadyStateChange(XMLHttpRequest.DONE)

    if (this.#status) {
      const loadendEvent = createXMLHttpRequestEvent('loadend', this.#header['Content-Length'])
      this.dispatchEvent(loadendEvent)
    }
  }

  /**
   * 对外属性和方法
   */
  get timeout() {
    return this.#timeout
  }

  set timeout(timeout) {
    if (typeof timeout !== 'number' || !Number.isFinite(timeout) || timeout <= 0) return

    this.#timeout = timeout
  }

  get status() {
    return this.#status
  }

  get statusText() {
    if (this.#readyState === XMLHttpRequest.UNSENT || this.#readyState === XMLHttpRequest.OPENED) return ''

    return STATUS_TEXT_MAP[this.#status + ''] || this.#statusText || ''
  }

  get readyState() {
    return this.#readyState
  }

  get responseType() {
    return this.#responseType
  }

  set responseType(value) {
    if (typeof value !== 'string') return

    this.#responseType = value
  }

  get responseText() {
    if (!this.#responseType || this.#responseType === 'text') {
      return this.#response
    }

    return null
  }

  get response() {
    return this.#response
  }

  get withCredentials() {
    return this.#withCredentials
  }

  set withCredentials(value) {
    this.#withCredentials = !!value
  }

  abort() {
    if (this.#requestTask) {
      this.#requestTask.abort()
      const abortEvent = createXMLHttpRequestEvent('abort', 0)
      this.dispatchEvent(abortEvent)
    }
  }

  getAllResponseHeaders() {
    if (this.#readyState === XMLHttpRequest.UNSENT || this.#readyState === XMLHttpRequest.OPENED || !this.#resHeader) return ''

    return Object.keys(this.#resHeader)
      .map((key) => `${key}: ${this.#resHeader![key]}`)
      .join('\r\n')
  }

  getResponseHeader(name: any) {
    if (this.#readyState === XMLHttpRequest.UNSENT || this.#readyState === XMLHttpRequest.OPENED || !this.#resHeader) return null

    // 处理大小写不敏感
    const key = Object.keys(this.#resHeader).find((item) => item.toLowerCase() === name.toLowerCase())
    const value = key ? this.#resHeader[key] : null

    return typeof value === 'string' ? value : null
  }

  open(method: any, url: any) {
    if (typeof method === 'string') method = method.toUpperCase()

    if (!SUPPORT_METHOD.has(method)) return
    if (!url || typeof url !== 'string') return

    this.#method = method
    this.#url = url

    this.#callReadyStateChange(XMLHttpRequest.OPENED)
  }

  setRequestHeader(header: any, value: any) {
    if (typeof header === 'string' && typeof value === 'string') {
      this.#header[header] = value
    }
  }

  send(data?: any) {
    if (this.#readyState !== XMLHttpRequest.OPENED) return

    this.#data = data
    this.#callRequest()
  }
}
