/* eslint-disable no-new */
/* eslint-disable no-prototype-builtins */
import type { IHeaders, IRequest, IResponse } from './type'
const g =
  (typeof globalThis !== 'undefined' && globalThis) ||
  (typeof self !== 'undefined' && self) ||
  // eslint-disable-next-line no-undef
  (typeof global !== 'undefined' && global) ||
  {}

export const support = {
  searchParams: 'URLSearchParams' in g,
  iterable: 'Symbol' in g && 'iterator' in Symbol,
  blob:
    'FileReader' in g &&
    'Blob' in g &&
    (function () {
      try {
        new Blob()
        return true
      } catch {
        return false
      }
    })(),
  formData: 'FormData' in g,
  arrayBuffer: 'ArrayBuffer' in g
}

function isDataView(obj) {
  return obj && DataView.prototype.isPrototypeOf(obj)
}

if (support.arrayBuffer) {
  const viewClasses = new Set([
    '[object Int8Array]',
    '[object Uint8Array]',
    '[object Uint8ClampedArray]',
    '[object Int16Array]',
    '[object Uint16Array]',
    '[object Int32Array]',
    '[object Uint32Array]',
    '[object Float32Array]',
    '[object Float64Array]'
  ])

  var isArrayBufferView =
    ArrayBuffer.isView ||
    function (obj) {
      return obj && viewClasses.has(Object.prototype.toString.call(obj))
    }
}

export function normalizeName(name) {
  if (typeof name !== 'string') {
    name = String(name)
  }
  if (/[^\w!#$%&'*+.^`|~\-]/i.test(name) || name === '') {
    throw new TypeError('Invalid character in header field name: "' + name + '"')
  }
  return name.toLowerCase()
}

export function normalizeValue(value) {
  if (typeof value !== 'string') {
    value = String(value)
  }
  return value
}

// Build a destructive iterator for the value list
function iteratorFor(items) {
  const iterator = {
    next: function () {
      const value = items.shift()
      return { done: value === undefined, value }
    }
  }

  if (support.iterable) {
    iterator[Symbol.iterator] = function () {
      return iterator
    }
  }

  return iterator
}

export function Headers(this: IHeaders, headers) {
  this.map = {}

  if (headers instanceof Headers) {
    headers.forEach(function (value, name) {
      this.append(name, value)
    }, this)
  } else if (Array.isArray(headers)) {
    headers.forEach(function (header) {
      if (header.length != 2) {
        throw new TypeError('Headers constructor: expected name/value pair to be length 2, found' + header.length)
      }
      this.append(header[0], header[1])
    }, this)
  } else if (headers) {
    Object.getOwnPropertyNames(headers).forEach(function (name) {
      this.append(name, headers[name])
    }, this)
  }
}

Headers.prototype.append = function (name, value) {
  name = normalizeName(name)
  value = normalizeValue(value)
  const oldValue = this.map[name]
  this.map[name] = oldValue ? oldValue + ', ' + value : value
}

Headers.prototype.delete = function (name) {
  delete this.map[normalizeName(name)]
}

Headers.prototype.get = function (name) {
  name = normalizeName(name)
  return this.has(name) ? this.map[name] : null
}

Headers.prototype.has = function (name) {
  return this.map.hasOwnProperty(normalizeName(name))
}

Headers.prototype.set = function (name, value) {
  this.map[normalizeName(name)] = normalizeValue(value)
}

Headers.prototype.forEach = function (callback, thisArg) {
  for (const name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(thisArg, this.map[name], name, this)
    }
  }
}

Headers.prototype.keys = function () {
  const items = []
  for (const [name, value] of this.entries()) {
    items.push(name)
  }
  return iteratorFor(items)
}

Headers.prototype.values = function () {
  const items = []
  for (const value of this) {
    items.push(value)
  }
  return iteratorFor(items)
}

Headers.prototype.entries = function () {
  const items = []
  for (const [name, value] of this.entries()) {
    items.push([name, value])
  }
  return iteratorFor(items)
}

if (support.iterable) {
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries
}

function consumed(body) {
  if (body._noBody) return
  if (body.bodyUsed) {
    return Promise.reject(new TypeError('Already read'))
  }
  body.bodyUsed = true
}

function fileReaderReady(reader) {
  return new Promise(function (resolve, reject) {
    reader.addEventListener('load', function () {
      resolve(reader.result)
    })
    reader.onerror = function () {
      reject(reader.error)
    }
  })
}

function readBlobAsArrayBuffer(blob) {
  const reader = new FileReader()
  const promise = fileReaderReady(reader)
  reader.readAsArrayBuffer(blob)
  return promise
}

function readBlobAsText(blob) {
  const reader = new FileReader()
  const promise = fileReaderReady(reader)
  const match = /charset=([\w-]+)/.exec(blob.type)
  const encoding = match ? match[1] : 'utf-8'
  reader.readAsText(blob, encoding)
  return promise
}

function readArrayBufferAsText(buf) {
  const view = new Uint8Array(buf)
  const chars = Array.from({ length: view.length })

  for (const [i, element] of view.entries()) {
    chars[i] = String.fromCharCode(element)
  }
  return chars.join('')
}

function bufferClone(buf) {
  if (buf.slice) {
    return [...buf]
  } else {
    const view = new Uint8Array(buf.byteLength)
    view.set(new Uint8Array(buf))
    return view.buffer
  }
}

function Body() {
  this.bodyUsed = false

  this._initBody = function (body) {
    /*
      fetch-mock wraps the Response object in an ES6 Proxy to
      provide useful test harness features such as flush. However, on
      ES5 browsers without fetch or Proxy support pollyfills must be used;
      the proxy-pollyfill is unable to proxy an attribute unless it exists
      on the object before the Proxy is created. This change ensures
      Response.bodyUsed exists on the instance, while maintaining the
      semantic of setting Request.bodyUsed in the constructor before
      _initBody is called.
    */
    // eslint-disable-next-line no-self-assign
    this.bodyUsed = this.bodyUsed
    this._bodyInit = body
    if (!body) {
      this._noBody = true
      this._bodyText = ''
    } else if (typeof body === 'string') {
      this._bodyText = body
    } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
      this._bodyBlob = body
    } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
      this._bodyFormData = body
    } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
      this._bodyText = body.toString()
    } else if (support.arrayBuffer && support.blob && isDataView(body)) {
      this._bodyArrayBuffer = bufferClone(body.buffer)
      // IE 10-11 can't handle a DataView body.
      this._bodyInit = new Blob([this._bodyArrayBuffer])
    } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
      this._bodyArrayBuffer = bufferClone(body)
    } else {
      this._bodyText = body = Object.prototype.toString.call(body)
    }

    if (!this.headers.get('content-type')) {
      if (typeof body === 'string') {
        this.headers.set('content-type', 'text/plain;charset=UTF-8')
      } else if (this._bodyBlob && this._bodyBlob.type) {
        this.headers.set('content-type', this._bodyBlob.type)
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
      }
    }
  }

  if (support.blob) {
    this.blob = function () {
      const rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return Promise.resolve(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(new Blob([this._bodyArrayBuffer]))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as blob')
      } else {
        return Promise.resolve(new Blob([this._bodyText]))
      }
    }
  }

  this.arrayBuffer = function () {
    if (this._bodyArrayBuffer) {
      const isConsumed = consumed(this)
      if (isConsumed) {
        return isConsumed
      } else if (ArrayBuffer.isView(this._bodyArrayBuffer)) {
        return Promise.resolve(this._bodyArrayBuffer.buffer.slice(this._bodyArrayBuffer.byteOffset, this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength))
      } else {
        return Promise.resolve(this._bodyArrayBuffer)
      }
    } else if (support.blob) {
      return this.blob().then(readBlobAsArrayBuffer)
    } else {
      throw new Error('could not read as ArrayBuffer')
    }
  }

  this.text = function () {
    const rejected = consumed(this)
    if (rejected) {
      return rejected
    }

    if (this._bodyBlob) {
      return readBlobAsText(this._bodyBlob)
    } else if (this._bodyArrayBuffer) {
      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
    } else if (this._bodyFormData) {
      throw new Error('could not read FormData body as text')
    } else {
      return Promise.resolve(this._bodyText)
    }
  }

  if (support.formData) {
    this.formData = function () {
      return this.text().then(decode)
    }
  }

  this.json = function () {
    return this.text().then(JSON.parse)
  }

  return this
}

// HTTP methods whose capitalization should be normalized
const methods = new Set(['CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE'])

function normalizeMethod(method) {
  const upcased = method.toUpperCase()
  return methods.has(upcased) ? upcased : method
}

export function Request(input, options) {
  if (!(this instanceof Request)) {
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')
  }

  options = options || {}
  let body = options.body

  if (input instanceof Request) {
    if (input.bodyUsed) {
      throw new TypeError('Already read')
    }
    this.url = input.url
    this.credentials = input.credentials
    if (!options.headers) {
      this.headers = new Headers(input.headers)
    }
    this.method = input.method
    this.mode = input.mode
    this.signal = input.signal
    if (!body && input._bodyInit != null) {
      body = input._bodyInit
      input.bodyUsed = true
    }
  } else {
    this.url = String(input)
  }

  this.credentials = options.credentials || this.credentials || 'same-origin'
  if (options.headers || !this.headers) {
    this.headers = new Headers(options.headers)
  }
  this.method = normalizeMethod(options.method || this.method || 'GET')
  this.mode = options.mode || this.mode || null
  this.signal =
    options.signal ||
    this.signal ||
    (function () {
      if ('AbortController' in g) {
        const ctrl = new AbortController()
        return ctrl.signal
      }
    })()
  this.referrer = null

  if ((this.method === 'GET' || this.method === 'HEAD') && body) {
    throw new TypeError('Body not allowed for GET or HEAD requests')
  }
  this._initBody(body)

  if ((this.method === 'GET' || this.method === 'HEAD') && (options.cache === 'no-store' || options.cache === 'no-cache')) {
    // Search for a '_' parameter in the query string
    const reParamSearch = /([&?])_=[^&]*/
    if (reParamSearch.test(this.url)) {
      // If it already exists then set the value with the current time
      this.url = this.url.replace(reParamSearch, '$1_=' + Date.now())
    } else {
      // Otherwise add a new '_' parameter to the end with the current time
      const reQueryString = /\?/
      this.url += (reQueryString.test(this.url) ? '&' : '?') + '_=' + Date.now()
    }
  }
}

Request.prototype.clone = function () {
  return new Request(this, { body: this._bodyInit })
}

function decode(body) {
  const form = new FormData()
  for (const bytes of body.trim().split('&')) {
    if (bytes) {
      const split = bytes.split('=')
      const name = split.shift().replaceAll('+', ' ')
      const value = split.join('=').replaceAll('+', ' ')
      form.append(decodeURIComponent(name), decodeURIComponent(value))
    }
  }
  return form
}

export function parseHeaders(rawHeaders) {
  const headers = new Headers()
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  const preProcessedHeaders = rawHeaders.replaceAll(/\r?\n[\t ]+/g, ' ')
  // Avoiding split via regex to work around a common IE11 bug with the core-js 3.6.0 regex polyfill
  // https://github.com/github/fetch/issues/748
  // https://github.com/zloirock/core-js/issues/751
  for (const line of preProcessedHeaders.split('\r').map(function (header) {
    return header.indexOf('\n') === 0 ? header.slice(1, 1 + header.length) : header
  })) {
    const parts = line.split(':')
    const key = parts.shift().trim()
    if (key) {
      const value = parts.join(':').trim()
      try {
        headers.append(key, value)
      } catch (error) {
        console.warn('Response ' + error.message)
      }
    }
  }
  return headers
}

Body.call(Request.prototype)

export function Response(bodyInit, options) {
  if (!(this instanceof Response)) {
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')
  }
  if (!options) {
    options = {}
  }

  this.type = 'default'
  this.status = options.status === undefined ? 200 : options.status
  if (this.status < 200 || this.status > 599) {
    throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].")
  }
  this.ok = this.status >= 200 && this.status < 300
  this.statusText = options.statusText === undefined ? '' : '' + options.statusText
  this.headers = new Headers(options.headers)
  this.url = options.url || ''
  this._initBody(bodyInit)
}

Body.call(Response.prototype)

Response.prototype.clone = function () {
  return new Response(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers(this.headers),
    url: this.url
  })
}

Response.error = function () {
  const response = new Response(null, { status: 200, statusText: '' })
  response.status = 0
  response.type = 'error'
  return response
}

const redirectStatuses = new Set([301, 302, 303, 307, 308])

Response.redirect = function (url, status) {
  if (!redirectStatuses.has(status)) {
    throw new RangeError('Invalid status code')
  }

  return new Response(null, { status, headers: { location: url } })
}

export var DOMException = g.DOMException
try {
  new DOMException()
} catch {
  DOMException = function (message, name) {
    this.message = message
    this.name = name
    const error = new Error(message)
    this.stack = error.stack
  }
  DOMException.prototype = Object.create(Error.prototype)
  DOMException.prototype.constructor = DOMException
}

export function fetch(input, init) {
  return new Promise(function (resolve, reject) {
    const request = new Request(input, init)

    if (request.signal && request.signal.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'))
    }

    const xhr = new XMLHttpRequest()

    function abortXhr() {
      xhr.abort()
    }

    xhr.addEventListener('load', function () {
      const options = {
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || '')
      }
      // This check if specifically for when a user fetches a file locally from the file system
      // Only if the status is out of a normal range
      options.status = request.url.startsWith('file://') && (xhr.status < 200 || xhr.status > 599) ? 200 : xhr.status
      options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
      const body = 'response' in xhr ? xhr.response : xhr.responseText
      setTimeout(function () {
        resolve(new Response(body, options))
      }, 0)
    })

    xhr.onerror = function () {
      setTimeout(function () {
        reject(new TypeError('Network request failed'))
      }, 0)
    }

    xhr.ontimeout = function () {
      setTimeout(function () {
        reject(new TypeError('Network request timed out'))
      }, 0)
    }

    xhr.addEventListener('abort', function () {
      setTimeout(function () {
        reject(new DOMException('Aborted', 'AbortError'))
      }, 0)
    })

    function fixUrl(url) {
      try {
        return url === '' && g.location.href ? g.location.href : url
      } catch {
        return url
      }
    }

    xhr.open(request.method, fixUrl(request.url), true)

    if (request.credentials === 'include') {
      xhr.withCredentials = true
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false
    }

    if ('responseType' in xhr) {
      if (support.blob) {
        xhr.responseType = 'blob'
      } else if (support.arrayBuffer) {
        xhr.responseType = 'arraybuffer'
      }
    }

    if (init && typeof init.headers === 'object' && !(init.headers instanceof Headers || (g.Headers && init.headers instanceof g.Headers))) {
      const names = []
      for (const name of Object.getOwnPropertyNames(init.headers)) {
        names.push(normalizeName(name))
        xhr.setRequestHeader(name, normalizeValue(init.headers[name]))
      }
      for (const [name, value] of request.headers.entries()) {
        if (!names.includes(name)) {
          xhr.setRequestHeader(name, value)
        }
      }
    } else {
      for (const [name, value] of request.headers.entries()) {
        xhr.setRequestHeader(name, value)
      }
    }

    if (request.signal) {
      request.signal.addEventListener('abort', abortXhr)

      xhr.addEventListener('readystatechange', function () {
        // DONE (success or failure)
        if (xhr.readyState === 4) {
          request.signal.removeEventListener('abort', abortXhr)
        }
      })
    }

    xhr.send(request._bodyInit === undefined ? null : request._bodyInit)
  })
}

fetch.polyfill = true

// if (!g.fetch) {
//   g.fetch = fetch
//   g.Headers = Headers
//   g.Request = Request
//   g.Response = Response
// }
