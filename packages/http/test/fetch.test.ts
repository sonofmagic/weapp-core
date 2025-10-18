import { beforeEach, describe, expect, vi } from 'vitest'
import { fetch, Headers, setWxAdapter } from '@/index'

const noopSocket = vi.fn(() => ({
  close: vi.fn(),
  onClose: vi.fn(),
  onError: vi.fn(),
  onMessage: vi.fn(),
  onOpen: vi.fn(),
  send: vi.fn(),
}))

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetch', () => {
  it('resolves with text response', async () => {
    const requestMock = vi.fn((options: WechatMiniprogram.RequestOption) => {
      options.success?.({
        data: 'pong',
        statusCode: 200,
        errMsg: 'request:ok',
        header: {
          'content-type': 'text/plain',
        },
        cookies: [],
        profile: {} as WechatMiniprogram.RequestProfile,
        exception: {} as WechatMiniprogram.RequestException,
        useHttpDNS: false,
      } as WechatMiniprogram.RequestSuccessCallbackResult)
      options.complete?.({ errMsg: 'request:ok' })
      return { abort: vi.fn() } as unknown as WechatMiniprogram.RequestTask
    })

    setWxAdapter({
      request: requestMock,
      connectSocket: noopSocket,
    })

    const response = await fetch('https://example.com/api/ping')
    expect(requestMock).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('pong')
  })

  it('serialises JSON request body and headers', async () => {
    let capturedHeaders: Record<string, string> = {}
    let capturedBody: any

    const requestMock = vi.fn((options: WechatMiniprogram.RequestOption) => {
      capturedHeaders = options.header ?? {}
      capturedBody = options.data
      options.success?.({
        data: { ok: true },
        statusCode: 201,
        errMsg: 'request:ok',
        header: {
          'content-type': 'application/json',
        },
        cookies: [],
        profile: {} as WechatMiniprogram.RequestProfile,
        exception: {} as WechatMiniprogram.RequestException,
        useHttpDNS: false,
      } as WechatMiniprogram.RequestSuccessCallbackResult)
      options.complete?.({ errMsg: 'request:ok' })
      return { abort: vi.fn() } as unknown as WechatMiniprogram.RequestTask
    })

    setWxAdapter({
      request: requestMock,
      connectSocket: noopSocket,
    })

    const response = await fetch('https://example.com/api/items', {
      method: 'POST',
      body: { name: 'mini-app' },
      headers: new Headers({
        Accept: 'application/json',
      }),
    })

    expect(capturedHeaders.accept).toBe('application/json')
    expect(capturedHeaders['content-type']).toBe('application/json;charset=UTF-8')
    expect(typeof capturedBody).toBe('string')
    expect(JSON.parse(capturedBody)).toEqual({ name: 'mini-app' })

    const payload = await response.json()
    expect(payload).toEqual({ ok: true })
  })

  it('rejects with AbortError when aborted', async () => {
    const abortMock = vi.fn()
    const requestMock = vi.fn((_options: WechatMiniprogram.RequestOption) => {
      return {
        abort: abortMock,
      } as unknown as WechatMiniprogram.RequestTask
    })

    setWxAdapter({
      request: requestMock,
      connectSocket: noopSocket,
    })

    const controller = new AbortController()
    const promise = fetch('https://example.com/api/slow', {
      signal: controller.signal,
    })

    controller.abort()

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    expect(abortMock).toHaveBeenCalledTimes(1)
  })
})
