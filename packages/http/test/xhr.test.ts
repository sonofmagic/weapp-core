import http from 'node:http'
import axios from 'axios'
import { XMLHttpRequest, createXMLHttpRequestEvent } from '@/xhr'
function createMockRequest(): WechatMiniprogram.Wx['request'] {
  return (options) => {
    axios({
      url: options.url,
      method: options.method,
      headers: options.header
    })
      .then((res) => {
        options?.success?.({
          data: res.data,
          cookies: [], // res.headers,
          header: res.headers,
          errMsg: '1111',
          exception: {
            reasons: {
              errMsg: '112',
              errno: '23'
            },
            retryCount: 1
          },
          // @ts-ignore
          profile: {},
          statusCode: 200
        })
      })
      .catch((error) => {
        options?.fail?.({
          errMsg: 'xxx',
          errno: 1111
        })
        throw error
      })
    return {
      abort() {},
      offChunkReceived(listener) {},
      offHeadersReceived(listener) {},
      onChunkReceived(listener) {},
      onHeadersReceived(listener) {}
    }
  }
}

describe.skip('xhr', () => {
  it('common usage', () => {
    const req = new XMLHttpRequest(createMockRequest())
    const reqListener = vi.fn().mockImplementation(function (this: XMLHttpRequest) {
      expect(this === req).toBe(true)
    })

    req.addEventListener('load', reqListener)
    req.open('GET', 'http://www.example.org/example.txt')
    req.send()

    req.dispatchEvent(createXMLHttpRequestEvent('load', 0))

    expect(reqListener).toBeCalled()
  })

  it('constants', () => {
    const xhr = new XMLHttpRequest(createMockRequest())
    assert.equal(0, xhr.UNSENT)
    assert.equal(1, xhr.OPENED)
    assert.equal(2, xhr.HEADERS_RECEIVED)
    assert.equal(3, xhr.LOADING)
    assert.equal(4, xhr.DONE)
  })

  it('events', () => {
    const xhr = new XMLHttpRequest(createMockRequest())

    const server = http
      .createServer(function (req, res) {
        const body = req.method === 'HEAD' ? '' : 'Hello World'
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(body)
        })
        // HEAD has no body
        if (req.method !== 'HEAD') {
          res.write(body)
        }
        res.end()
        assert.equal(onreadystatechange, true)
        assert.equal(readystatechange, true)
        assert.equal(removed, true)
        // sys.puts('done')
        server.close()
      })
      .listen(8000)
    let onreadystatechange = false
    let readystatechange = false
    let removed = true
    const removedEvent = function () {
      removed = false
    }

    xhr.addEventListener('readystatechange', function () {
      onreadystatechange = true
    })

    xhr.addEventListener('readystatechange', function () {
      readystatechange = true
    })

    // This isn't perfect, won't guarantee it was added in the first place
    xhr.addEventListener('readystatechange', removedEvent)
    xhr.removeEventListener('readystatechange', removedEvent)

    xhr.open('GET', 'http://localhost:8000')
    xhr.send()
  })

  it('exceptions', () => {
    const xhr = new XMLHttpRequest(createMockRequest())
    try {
      xhr.open('TRACK', 'http://localhost:8000/')
      console.log('ERROR: TRACK should have thrown exception')
    } catch {}
    try {
      xhr.open('TRACE', 'http://localhost:8000/')
      console.log('ERROR: TRACE should have thrown exception')
    } catch {}
    try {
      xhr.open('CONNECT', 'http://localhost:8000/')
      console.log('ERROR: CONNECT should have thrown exception')
    } catch {}
    // Test valid request method
    try {
      xhr.open('GET', 'http://localhost:8000/')
    } catch (error) {
      console.log('ERROR: Invalid exception for GET', error)
    }

    // Test forbidden headers
    const forbiddenRequestHeaders = [
      'accept-charset',
      'accept-encoding',
      'access-control-request-headers',
      'access-control-request-method',
      'connection',
      'content-length',
      'content-transfer-encoding',
      'cookie',
      'cookie2',
      'date',
      'expect',
      'host',
      'keep-alive',
      'origin',
      'referer',
      'te',
      'trailer',
      'transfer-encoding',
      'upgrade',
      'user-agent',
      'via'
    ]

    for (const i in forbiddenRequestHeaders) {
      try {
        xhr.setRequestHeader(forbiddenRequestHeaders[i], 'Test')
        console.log('ERROR: ' + forbiddenRequestHeaders[i] + ' should have thrown exception')
      } catch {}
    }

    // Try valid header
    xhr.setRequestHeader('X-Foobar', 'Test')
  })

  it('headers', () => {
    const xhr = new XMLHttpRequest(createMockRequest())
    const server = http
      .createServer(function (req, res) {
        // Test setRequestHeader
        assert.equal('Foobar', req.headers['x-test'])
        // Test non-conforming allowed header
        assert.equal('node-XMLHttpRequest-test', req.headers['user-agent'])
        // Test header set with blacklist disabled
        assert.equal('http://github.com', req.headers.referer)

        const body = 'Hello World'
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(body),
          // Set cookie headers to see if they're correctly suppressed
          // Actual values don't matter
          'Set-Cookie': 'foo=bar',
          'Set-Cookie2': 'bar=baz',
          Date: 'Thu, 30 Aug 2012 18:17:53 GMT',
          Connection: 'close'
        })
        res.write('Hello World')
        res.end()

        server.close()
      })
      .listen(8001)

    xhr.addEventListener('readystatechange', function () {
      if (this.readyState === 4) {
        // Test getAllResponseHeaders()
        const headers = 'content-type: text/plain\r\ncontent-length: 11\r\ndate: Thu, 30 Aug 2012 18:17:53 GMT\r\nconnection: close'
        assert.equal(headers, this.getAllResponseHeaders())

        // Test case insensitivity
        assert.equal('text/plain', this.getResponseHeader('Content-Type'))
        assert.equal('text/plain', this.getResponseHeader('Content-type'))
        assert.equal('text/plain', this.getResponseHeader('content-Type'))
        assert.equal('text/plain', this.getResponseHeader('content-type'))

        // Test aborted getAllResponseHeaders
        this.abort()
        assert.equal('', this.getAllResponseHeaders())
        assert.equal(null, this.getResponseHeader('Connection'))

        // sys.puts('done')
      }
    })

    assert.equal(null, xhr.getResponseHeader('Content-Type'))
    try {
      xhr.open('GET', 'http://localhost:8001/')
      // Valid header
      xhr.setRequestHeader('X-Test', 'Foobar')
      xhr.setRequestHeader('X-Test2', 'Foobar1')
      xhr.setRequestHeader('X-Test2', 'Foobar2')
      // Invalid header
      xhr.setRequestHeader('Content-Length', 0)
      // Allowed header outside of specs
      xhr.setRequestHeader('user-agent', 'node-XMLHttpRequest-test')
      // Test getRequestHeader
      // assert.equal('Foobar', xhr.getRequestHeader('X-Test'))
      // assert.equal('Foobar', xhr.getRequestHeader('x-tEST'))
      // assert.equal('Foobar1, Foobar2', xhr.getRequestHeader('x-test2'))
      // Test invalid header
      // assert.equal('', xhr.getRequestHeader('Content-Length'))

      // Test allowing all headers
      // xhr.setDisableHeaderCheck(true)
      xhr.setRequestHeader('Referer', 'http://github.com')
      // assert.equal('http://github.com', xhr.getRequestHeader('Referer'))

      xhr.send()
    } catch (error) {
      console.log('ERROR: Exception raised', error)
    }
  })

  it('request-methods', () => {
    const server = http
      .createServer(function (req, res) {
        // Check request method and URL
        assert.equal(methods[curMethod], req.method)
        assert.equal('/' + methods[curMethod], req.url)

        const body = req.method === 'HEAD' ? '' : 'Hello World'

        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(body)
        })
        // HEAD has no body
        if (req.method !== 'HEAD') {
          res.write(body)
        }
        res.end()

        if (curMethod === methods.length - 1) {
          server.close()
          // sys.puts('done')
        }
      })
      .listen(8002)

    // Test standard methods
    const methods = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE']
    let curMethod = 0

    function start(method: string) {
      // Reset each time
      const xhr = new XMLHttpRequest(createMockRequest())

      xhr.addEventListener('readystatechange', function () {
        if (this.readyState === 4) {
          if (method === 'HEAD') {
            assert.equal('', this.responseText)
          } else {
            assert.equal('Hello World', this.responseText)
          }

          curMethod++

          if (curMethod < methods.length) {
            // sys.puts('Testing ' + methods[curMethod])
            start(methods[curMethod])
          }
        }
      })

      const url = 'http://localhost:8002/' + method
      xhr.open(method, url)
      xhr.send()
    }

    // sys.puts('Testing ' + methods[curMethod])
    start(methods[curMethod])
  })
})
