// import { defu } from 'defu'
import { XMLHttpRequest } from '@weapp-core/http'
import { Headers, Request, Response, normalizeValue, normalizeName, parseHeaders, support } from './fetch'
import { UserDefinedOptions } from './type'
// https://github.com/github/fetch
// , defaults?: UserDefinedOptions
function createFetch(requestMethod: typeof wx.request) {
  return function fetch(
    input: string, // RequestInfo | URL,
    init?: UserDefinedOptions
  ): Promise<Response> {
    return new Promise(function (resolve, reject) {
      // @ts-ignore
      const request = new Request(input, init)

      if (request.signal && request.signal.aborted) {
        return reject(new DOMException('Aborted', 'AbortError'))
      }

      const xhr = new XMLHttpRequest(requestMethod)

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

      // eslint-disable-next-line unicorn/consistent-function-scoping
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
}

export { createFetch }

export { Headers, Response, Request } from './fetch'

export type { UserDefinedOptions } from './type'
