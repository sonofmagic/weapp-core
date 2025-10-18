import { afterEach, describe, expect, it } from 'vitest'
import {
  fetch,
  injectRuntime,
  WebSocket,
  XMLHttpRequest,
} from '../src'

afterEach(() => {
  // reset adapter overrides between tests
  delete (globalThis as any).fetch
  delete (globalThis as any).Headers
  delete (globalThis as any).Request
  delete (globalThis as any).Response
  delete (globalThis as any).WebSocket
  delete (globalThis as any).WebSocketCloseEvent
  delete (globalThis as any).WebSocketErrorEvent
  delete (globalThis as any).WebSocketMessageEvent
  delete (globalThis as any).XMLHttpRequest
  delete (globalThis as any).XMLHttpRequestEvent
  delete (globalThis as any).XMLHttpRequestErrorEvent
})

describe('runtime injector', () => {
  it('injects http polyfills onto target', () => {
    const target: Record<string, unknown> = {}
    injectRuntime({ target })

    expect(target.fetch).toBe(fetch)
    expect(target.WebSocket).toBe(WebSocket)
    expect(target.XMLHttpRequest).toBe(XMLHttpRequest)
  })

  it('injects into globalThis by default', () => {
    injectRuntime()
    expect(globalThis.fetch).toBe(fetch)
  })
})
