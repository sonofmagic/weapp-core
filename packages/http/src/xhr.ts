import { Event, EventTarget } from 'event-target-shim'
import { isFunction, isString } from './shared'

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

export interface XMLHttpRequestEvent extends Event {
  target: XMLHttpRequest
  currentTarget: XMLHttpRequest
  loaded: number
  total: number
}

export function createXMLHttpRequestEvent(event: string, target: XMLHttpRequest, loaded: number): XMLHttpRequestEvent {
  const e = new Event(event) as XMLHttpRequestEvent
  try {
    Object.defineProperties(e, {
      currentTarget: {
        enumerable: true,
        value: target
      },
      target: {
        enumerable: true,
        value: target
      },
      loaded: {
        enumerable: true,
        value: loaded || 0
      },
      // 读 Content-Range 字段，目前来说作用不大,先和 loaded 保持一致
      total: {
        enumerable: true,
        value: loaded || 0
      }
    })
  } catch {
    // no handler
  }
  return e
}

// https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest
export class XMLHttpRequest extends EventTarget {
  static readonly UNSENT = 0
  static readonly OPENED = 1
  static readonly HEADERS_RECEIVED = 2
  static readonly LOADING = 3
  static readonly DONE = 4

  // 欺骗一些库让其认为是原生的xhr
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
  #requestTask: null | any

  // 事件正常流转： loadstart => progress（可能多次） => load => loadend
  // error 流转： loadstart => error => loadend
  // abort 流转： loadstart => abort => loadend
  // web在线测试： https://developer.mozilla.org/zh-CN/play

  /** 当 request 被停止时触发，例如当程序调用 XMLHttpRequest.abort() 时 */
  onabort: ((e: XMLHttpRequestEvent) => void) | null = null

  /** 当 request 遭遇错误时触发 */
  onerror: ((e: XMLHttpRequestEvent) => void) | null = null

  /** 接收到响应数据时触发 */
  onloadstart: ((e: XMLHttpRequestEvent) => void) | null = null

  /** 请求成功完成时触发 */
  onload: ((e: XMLHttpRequestEvent) => void) | null = null

  /** 当请求结束时触发，无论请求成功 ( load) 还是失败 (abort 或 error)。 */
  onloadend: ((e: XMLHttpRequestEvent) => void) | null = null

  /** 在预设时间内没有接收到响应时触发 */
  ontimeout: ((e: XMLHttpRequestEvent) => void) | null = null

  /** 当 readyState 属性发生变化时，调用的事件处理器 */
  onreadystatechange: ((e: XMLHttpRequestEvent) => void) | null = null

  constructor() {
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
  }

  addEventListener(event: string, callback: (arg: any) => void) {
    if (!isString(event)) return
    super.addEventListener(event, callback)
  }

  removeEventListener(event: string, callback: (arg: any) => void) {
    if (!isString(event)) return
    super.removeEventListener(event, callback)
  }

  /**
   * readyState 变化
   */
  #callReadyStateChange(readyState: any) {
    const hasChange = readyState !== this.#readyState
    this.#readyState = readyState

    if (hasChange) {
      const readystatechangeEvent = createXMLHttpRequestEvent('readystatechange', this, 0)
      this.dispatchEvent(readystatechangeEvent)

      isFunction(this.onreadystatechange) && this.onreadystatechange(readystatechangeEvent)
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
          const timeoutEvent = createXMLHttpRequestEvent('timeout', this, 0)
          this.dispatchEvent(timeoutEvent)
          isFunction(this.ontimeout) && this.ontimeout(timeoutEvent)
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
    this.#requestTask = wx.request({
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
      const loadstartEvent = createXMLHttpRequestEvent('loadstart', this, header['Content-Length'])
      this.dispatchEvent(loadstartEvent)
      isFunction(this.onloadstart) && this.onloadstart(loadstartEvent)
      this.#response = data

      const loadEvent = createXMLHttpRequestEvent('load', this, header['Content-Length'])
      this.dispatchEvent(loadEvent)
      isFunction(this.onload) && this.onload(loadEvent)
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
    const errorEvent = createXMLHttpRequestEvent('error', this, 0)
    this.dispatchEvent(errorEvent)
    isFunction(this.onerror) && this.onerror(errorEvent)
  }

  /**
   * 请求完成
   */
  #requestComplete() {
    this.#requestTask = null
    this.#callReadyStateChange(XMLHttpRequest.DONE)

    if (this.#status) {
      const loadendEvent = createXMLHttpRequestEvent('loadend', this, this.#header['Content-Length'])
      this.dispatchEvent(loadendEvent)
      isFunction(this.onloadend) && this.onloadend(loadendEvent)
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
      const abortEvent = createXMLHttpRequestEvent('abort', this, 0)
      this.dispatchEvent(abortEvent)
      isFunction(this.onabort) && this.onabort(abortEvent)
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

  send(data: any) {
    if (this.#readyState !== XMLHttpRequest.OPENED) return

    this.#data = data
    this.#callRequest()
  }
}
