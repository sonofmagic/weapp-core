import { EventSourceEventMap, XMLHttpRequestEvent, XMLHttpRequest, createXMLHttpRequestEvent } from '@/xhr'

function createMockRequest(): WechatMiniprogram.Wx['request'] {
  return (options) => {
    return {
      abort() {},
      offChunkReceived(listener) {},
      offHeadersReceived(listener) {},
      onChunkReceived(listener) {},
      onHeadersReceived(listener) {}
    }
  }
}

describe('xhr', () => {
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
})
