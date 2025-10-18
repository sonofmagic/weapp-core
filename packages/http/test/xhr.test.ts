import type {
  XMLHttpRequestErrorEvent,
  XMLHttpRequestProgressEvent,
} from '@/index'
import { beforeEach, describe, expect, vi } from 'vitest'
import {
  MiniProgramXMLHttpRequest,
  setWxAdapter,
} from '@/index'

type RequestOptions = WechatMiniprogram.RequestOption

function createRequestStub() {
  const requestMock = vi.fn((_options: RequestOptions) => {
    return {
      abort: vi.fn(),
    } as unknown as WechatMiniprogram.RequestTask
  })

  setWxAdapter({
    request: requestMock,
    connectSocket: vi.fn(),
  })

  return requestMock
}

describe('MiniProgramXMLHttpRequest', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('performs GET request and resolves response', () => {
    const requestMock = createRequestStub()
    let successHandler: ((result: WechatMiniprogram.RequestSuccessCallbackResult) => void) | undefined

    requestMock.mockImplementation((options: RequestOptions) => {
      successHandler = options.success
      return { abort: vi.fn() } as unknown as WechatMiniprogram.RequestTask
    })

    const xhr = new MiniProgramXMLHttpRequest()
    const states: number[] = []
    xhr.addEventListener('readystatechange', () => {
      states.push(xhr.readyState)
    })

    xhr.open('GET', 'https://example.com/data')
    xhr.send()

    expect(states).toEqual([MiniProgramXMLHttpRequest.OPENED])

    successHandler?.({
      data: 'payload',
      statusCode: 200,
      errMsg: 'request:ok',
      header: { 'content-length': '7' },
    } as any)

    expect(xhr.status).toBe(200)
    expect(xhr.responseText).toBe('payload')
    expect(states).toContain(MiniProgramXMLHttpRequest.DONE)
  })

  it('sets custom headers and request body', () => {
    const requestMock = createRequestStub()
    let capturedOptions: RequestOptions | undefined

    requestMock.mockImplementation((options: RequestOptions) => {
      capturedOptions = options
      options.success?.({
        data: { ok: true },
        statusCode: 201,
        errMsg: 'request:ok',
        header: {},
      } as any)
      return { abort: vi.fn() } as unknown as WechatMiniprogram.RequestTask
    })

    const xhr = new MiniProgramXMLHttpRequest()
    xhr.open('POST', 'https://example.com/items')
    xhr.responseType = 'json'
    xhr.setRequestHeader('X-Test', 'value')
    xhr.send({ name: 'demo' })

    expect(capturedOptions?.header?.['x-test']).toBe('value')
    expect(JSON.parse(String(capturedOptions?.data))).toEqual({ name: 'demo' })
    expect(xhr.status).toBe(201)
    expect(xhr.response).toEqual({ ok: true })
  })

  it('fires timeout event when request exceeds timeout', () => {
    vi.useFakeTimers()
    const requestMock = createRequestStub()
    let capturedOptions: RequestOptions | undefined

    const abortSpy = vi.fn()

    requestMock.mockImplementation((options: RequestOptions) => {
      capturedOptions = options
      return {
        abort: abortSpy,
      } as unknown as WechatMiniprogram.RequestTask
    })

    const xhr = new MiniProgramXMLHttpRequest()
    const timeoutSpy = vi.fn()
    xhr.addEventListener('timeout', (event: XMLHttpRequestProgressEvent<'timeout'>) => {
      timeoutSpy(event.type)
    })

    xhr.timeout = 500
    xhr.open('GET', 'https://example.com/slow')
    xhr.send()

    expect(capturedOptions?.timeout).toBe(500)
    vi.advanceTimersByTime(600)

    expect(abortSpy).toHaveBeenCalled()
    expect(timeoutSpy).toHaveBeenCalledWith('timeout')
  })

  it('emits error event on failure', () => {
    const requestMock = createRequestStub()
    let failHandler: WechatMiniprogram.RequestFailCallback | undefined

    requestMock.mockImplementation((options: RequestOptions) => {
      failHandler = options.fail
      return { abort: vi.fn() } as unknown as WechatMiniprogram.RequestTask
    })

    const xhr = new MiniProgramXMLHttpRequest()
    const errorSpy = vi.fn()
    xhr.addEventListener('error', (event: XMLHttpRequestErrorEvent) => {
      errorSpy(event.message)
    })

    xhr.open('GET', 'https://example.com/error')
    xhr.send()

    failHandler?.({ errMsg: 'network error', errno: 0 })

    expect(errorSpy).toHaveBeenCalledWith('network error')
    expect(xhr.status).toBe(0)
  })
})
