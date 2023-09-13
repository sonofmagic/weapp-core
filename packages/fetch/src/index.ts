import { defu } from 'defu'
import { Headers, Request, Response, normalizeValue } from './fetch'
import { fixUrl, isPlainObject } from './util'
import { UserDefinedOptions } from './type'
// https://github.com/github/fetch

function createFetch(requestFn: typeof wx.request, defaults?: UserDefinedOptions) {
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
      const url = fixUrl(input)
      const options = defu<WechatMiniprogram.RequestOption, any>(
        {
          url,
          data: request._bodyInit === undefined ? null : request._bodyInit,
          success(result) {
            const options = {
              status: result.statusCode,
              statusText: result.errMsg,
              headers: result.header, // parseHeaders(result.header || '')
              url: undefined
            }
            options.url = result.header['X-Request-URL'] || url

            let body = result.data

            if (isPlainObject(result.data)) {
              body = JSON.stringify(result.data)
            }

            setTimeout(function () {
              // @ts-ignore
              resolve(new Response(body, options))
            }, 0)
          },
          method: request.method || 'GET',
          fail(err) {
            setTimeout(function () {
              reject(err)
            }, 0)
          },
          dataType: init?.dataType,
          enableCache: init?.enableCache,
          enableChunked: init?.enableChunked,
          enableHttp2: init?.enableHttp2,
          enableHttpDNS: init?.enableHttpDNS,
          enableQuic: init?.enableQuic,
          forceCellularNetwork: init?.forceCellularNetwork,
          header: init?.header,
          httpDNSServiceId: init?.httpDNSServiceId,
          responseType: init?.responseType,
          timeout: init?.timeout
        },
        defaults
      )
      if (!options.header) {
        options.header = {}
      }

      if (init && typeof init.headers === 'object' && !(init.headers instanceof Headers)) {
        for (const name of Object.getOwnPropertyNames(init.headers)) {
          // @ts-ignore
          options.header![name] = normalizeValue(init.headers[name])
        }
      } else {
        request.headers.forEach(function (value: string, name: string) {
          // @ts-ignore
          options.header![name] = value
        })
      }
      const task = requestFn(options)
      init?.getTask?.(task, options)
    })
  }
}

export { createFetch }

export { Headers, Response, Request } from './fetch'

export type { UserDefinedOptions } from './type'
