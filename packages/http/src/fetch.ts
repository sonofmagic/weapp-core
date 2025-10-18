import { getWxAdapter } from './defaults'
import { resolveStatusText } from './shared'

function normalizeName(name: string): string {
  const value = `${name}`
  if (!/^[!#$%&'*+\-.^`|~\w]+$/.test(value)) {
    throw new TypeError(`Invalid character in header field name: "${name}"`)
  }
  return value.toLowerCase()
}

function normalizeValue(value: unknown): string {
  return value === undefined ? '' : `${value}`
}

export type HeaderInit
  = | Headers
    | Array<readonly [string, string]>
    | Record<string, string | number | boolean>

export class Headers {
  private readonly map = new Map<string, string>()

  constructor(init?: HeaderInit) {
    if (!init) {
      return
    }

    if (init instanceof Headers) {
      init.forEach((value, name) => {
        this.append(name, value)
      })
    }
    else if (Array.isArray(init)) {
      for (const pair of init) {
        if (pair.length !== 2) {
          throw new TypeError('Headers constructor requires tuples of length 2.')
        }
        this.append(pair[0], pair[1])
      }
    }
    else {
      for (const [name, value] of Object.entries(init)) {
        this.append(name, normalizeValue(value))
      }
    }
  }

  append(name: string, value: unknown): void {
    const key = normalizeName(name)
    const normalizedValue = normalizeValue(value)
    const existing = this.map.get(key)
    const nextValue = existing ? `${existing}, ${normalizedValue}` : normalizedValue
    this.map.set(key, nextValue)
  }

  set(name: string, value: unknown): void {
    const key = normalizeName(name)
    this.map.set(key, normalizeValue(value))
  }

  get(name: string): string | null {
    const key = normalizeName(name)
    return this.map.has(key) ? this.map.get(key)! : null
  }

  has(name: string): boolean {
    const key = normalizeName(name)
    return this.map.has(key)
  }

  delete(name: string): void {
    const key = normalizeName(name)
    this.map.delete(key)
  }

  forEach(callback: (value: string, name: string, parent: Headers) => void, thisArg?: any): void {
    for (const [name, value] of this.map.entries()) {
      callback.call(thisArg, value, name, this)
    }
  }

  keys(): IterableIterator<string> {
    return this.map.keys()
  }

  values(): IterableIterator<string> {
    return this.map.values()
  }

  entries(): IterableIterator<[string, string]> {
    return this.map.entries()
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries()
  }

  toJSON(): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [name, value] of this.map.entries()) {
      result[name] = value
    }
    return result
  }
}

export type BodyInit
  = | ArrayBuffer
    | ArrayBufferView
    | Blob
    | FormData
    | URLSearchParams
    | string
    | Record<string, any>

export interface WeappRequestOptions
  extends Partial<Omit<WechatMiniprogram.RequestOption, 'url' | 'method' | 'data' | 'header' | 'success' | 'fail' | 'complete'>> {}

export type RequestCredentialsOption = 'omit' | 'same-origin' | 'include'

export interface WeappFetchOptions {
  body?: BodyInit | null
  credentials?: RequestCredentialsOption
  headers?: HeaderInit
  method?: string
  signal?: AbortSignal | null
  wx?: WeappRequestOptions
}

function isAbortSignal(value: unknown): value is AbortSignal {
  return typeof value === 'object' && value !== null && 'aborted' in value
}

function isArrayBufferView(value: unknown): value is ArrayBufferView {
  return value != null && typeof value === 'object' && ArrayBuffer.isView(value as any)
}

function cloneBuffer(buffer: ArrayBuffer): ArrayBuffer {
  return buffer.slice(0)
}

function toArrayBuffer(value: ArrayBufferView): ArrayBuffer {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer
}

function copyBody(body: BodyInit | null | undefined): BodyInit | null | undefined {
  if (body instanceof ArrayBuffer) {
    return cloneBuffer(body)
  }
  if (isArrayBufferView(body)) {
    return toArrayBuffer(body)
  }
  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return body
  }
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return body
  }
  return body
}

function serialiseBody(body: BodyInit | null | undefined, headers: Headers): any {
  if (body == null) {
    return undefined
  }

  if (typeof body === 'string') {
    return body
  }

  if (body instanceof URLSearchParams) {
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
    }
    return body.toString()
  }

  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return body
  }

  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return body
  }

  if (body instanceof ArrayBuffer) {
    return cloneBuffer(body)
  }

  if (isArrayBufferView(body)) {
    return toArrayBuffer(body)
  }

  if (typeof body === 'object') {
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json;charset=UTF-8')
    }
    return JSON.stringify(body)
  }

  return `${body}`
}

export class Request {
  readonly url: string
  readonly method: string
  readonly headers: Headers
  readonly credentials: RequestCredentialsOption
  readonly signal: AbortSignal | null
  readonly wx?: WeappRequestOptions

  private readonly bodyInit: BodyInit | null | undefined
  bodyUsed = false

  constructor(input: string | URL | Request, init: WeappFetchOptions = {}) {
    const original = input instanceof Request ? input : null
    if (input instanceof Request) {
      this.url = input.url
    }
    else if (typeof input === 'string') {
      this.url = input
    }
    else if (input instanceof URL) {
      this.url = input.toString()
    }
    else {
      this.url = String(input)
    }
    this.method = (init.method ?? original?.method ?? 'GET').toUpperCase()
    this.headers = new Headers(init.headers ?? original?.headers)
    this.credentials = init.credentials ?? original?.credentials ?? 'same-origin'
    this.signal = init.signal ?? original?.signal ?? null
    this.wx = init.wx ?? original?.wx

    const body = init.body ?? original?.body ?? null
    this.bodyInit = body

    if ((this.method === 'GET' || this.method === 'HEAD') && this.bodyInit != null) {
      throw new TypeError('Request with GET/HEAD method cannot have body.')
    }

    if (original?.bodyUsed) {
      throw new TypeError('Cannot construct a Request with a used body.')
    }
  }

  get body(): BodyInit | null | undefined {
    return this.bodyInit
  }

  clone(): Request {
    if (this.bodyUsed) {
      throw new TypeError('Cannot clone a Request with a used body.')
    }

    return new Request(this, {
      method: this.method,
      headers: new Headers(this.headers),
      body: copyBody(this.bodyInit),
      signal: this.signal ?? undefined,
      credentials: this.credentials,
      wx: this.wx,
    })
  }
}

export type RequestInfo = string | URL | Request

export interface ResponseInit {
  status?: number
  statusText?: string
  headers?: HeaderInit
  url?: string
}

class BodyReader {
  protected consumed = false

  protected consume<T>(value: T, transformer: (value: T) => T | Promise<T>): Promise<T> {
    if (this.consumed) {
      return Promise.reject(new TypeError('Body already used.'))
    }
    this.consumed = true
    try {
      return Promise.resolve(transformer(value))
    }
    catch (error) {
      return Promise.reject(error)
    }
  }
}

export class Response extends BodyReader {
  readonly status: number
  readonly statusText: string
  readonly headers: Headers
  readonly url: string
  readonly ok: boolean
  readonly type = 'default' as const
  readonly redirected: boolean

  private readonly bodyInit: any

  constructor(bodyInit?: any, init: ResponseInit = {}) {
    super()
    const status = init.status ?? 200

    this.status = status
    this.statusText = init.statusText ?? resolveStatusText(status)
    this.headers = new Headers(init.headers)
    this.bodyInit = copyBody(bodyInit)
    this.url = init.url ?? ''
    this.ok = status >= 200 && status < 300
    this.redirected = status >= 300 && status < 400
  }

  get bodyUsed(): boolean {
    return this.consumed
  }

  clone(): Response {
    if (this.bodyUsed) {
      throw new TypeError('Cannot clone a Response with a used body.')
    }
    return new Response(copyBody(this.bodyInit), {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url,
    })
  }

  text(): Promise<string> {
    return this.consume(this.bodyInit, (value) => {
      if (typeof value === 'string') {
        return value
      }
      if (value instanceof ArrayBuffer) {
        return new TextDecoder().decode(value)
      }
      if (isArrayBufferView(value)) {
        return new TextDecoder().decode(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
      }
      if (value == null) {
        return ''
      }
      return JSON.stringify(value)
    })
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return this.consume(this.bodyInit, (value) => {
      if (value instanceof ArrayBuffer) {
        return cloneBuffer(value)
      }
      if (isArrayBufferView(value)) {
        return toArrayBuffer(value)
      }
      if (typeof value === 'string') {
        const encoder = new TextEncoder()
        return encoder.encode(value).buffer
      }
      return cloneBuffer(new TextEncoder().encode(JSON.stringify(value)).buffer)
    })
  }

  json(): Promise<any> {
    return this.consume(this.bodyInit, async (value) => {
      if (typeof value === 'string') {
        return value.length ? JSON.parse(value) : null
      }
      if (value == null) {
        return null
      }
      return value
    })
  }
}

function createAbortError(): Error {
  try {
    return new DOMException('Aborted', 'AbortError')
  }
  catch {
    const error = new Error('Aborted')
    error.name = 'AbortError'
    return error
  }
}

function handleRequestFailure(err: WechatMiniprogram.GeneralCallbackResult): Error {
  const message = err?.errMsg ?? 'Network request failed'
  const error = new Error(message)
  error.name = 'NetworkError'
  return error
}

function buildRequestOptions(request: Request, init: WeappFetchOptions): WechatMiniprogram.RequestOption {
  const headers = new Headers(request.headers)
  const data = serialiseBody(request.body, headers)
  const wxOverrides = request.wx ?? init.wx ?? {}

  const options: WechatMiniprogram.RequestOption = {
    url: request.url,
    method: request.method as WechatMiniprogram.RequestOption['method'],
    header: headers.toJSON(),
    data,
    success: () => {},
    fail: () => {},
    complete: () => {},
  }

  request.bodyUsed = true

  if (wxOverrides.responseType) {
    options.responseType = wxOverrides.responseType
  }

  if (wxOverrides.dataType) {
    options.dataType = wxOverrides.dataType
  }

  if (wxOverrides.timeout != null) {
    options.timeout = wxOverrides.timeout
  }
  else if (typeof (init as any).timeout === 'number') {
    options.timeout = Number((init as any).timeout)
  }

  if (request.credentials === 'include') {
    // enableCookie defaults to false; align with web's `credentials: 'include'`
    (options as any).enableCookie = true
  }
  else if (request.credentials === 'omit') {
    (options as any).enableCookie = false
  }

  const passthrough = options as unknown as Record<string, unknown>
  for (const [key, value] of Object.entries(wxOverrides)) {
    const reserved = key === 'dataType' || key === 'responseType' || key === 'timeout'
    if (reserved) {
      continue
    }
    passthrough[key] = value
  }

  return options
}

export function fetch(input: RequestInfo, init: WeappFetchOptions = {}): Promise<Response> {
  const request = new Request(input, init)

  if (request.signal?.aborted) {
    return Promise.reject(createAbortError())
  }

  const { request: requestAdapter } = getWxAdapter()

  return new Promise<Response>((resolve, reject) => {
    let settled = false

    const options = buildRequestOptions(request, init)
    let task: WechatMiniprogram.RequestTask | null = null

    function abortListener() {
      if (settled) {
        return
      }
      settled = true
      try {
        task?.abort()
      }
      catch { }
      reject(createAbortError())
    }

    options.success = (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
      settled = true
      const headers = new Headers(res.header as Record<string, string> | undefined)
      const response = new Response(res.data, {
        status: res.statusCode,
        statusText: resolveStatusText(res.statusCode, res.errMsg),
        headers,
        url: options.url,
      })
      if (request.signal && isAbortSignal(request.signal)) {
        request.signal.removeEventListener('abort', abortListener)
      }
      resolve(response)
    }

    options.fail = (err: WechatMiniprogram.GeneralCallbackResult) => {
      if (settled) {
        return
      }
      settled = true
      if (typeof err?.errMsg === 'string' && err.errMsg.includes('abort')) {
        if (request.signal && isAbortSignal(request.signal)) {
          request.signal.removeEventListener('abort', abortListener)
        }
        reject(createAbortError())
        return
      }
      if (request.signal && isAbortSignal(request.signal)) {
        request.signal.removeEventListener('abort', abortListener)
      }
      reject(handleRequestFailure(err))
    }

    options.complete = () => {
      if (request.signal && isAbortSignal(request.signal)) {
        request.signal.removeEventListener('abort', abortListener)
      }
    }

    task = requestAdapter(options)

    if (request.signal && isAbortSignal(request.signal)) {
      request.signal.addEventListener('abort', abortListener)
    }
  })
}
