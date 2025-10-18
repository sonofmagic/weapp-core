import {
  fetch as coreFetch,
  getWxAdapter,
  Headers,
  Request,
  Response,
  setWxAdapter,
  WebSocket,
  WebSocketCloseEvent,
  WebSocketErrorEvent,
  WebSocketMessageEvent,
  XMLHttpRequest,
  XMLHttpRequestErrorEvent,
  XMLHttpRequestEvent,
  type BodyInit,
  type HeaderInit,
  type WeappFetchOptions,
  type WeappRequestOptions,
  type WxAdapter,
} from '@weapp-core/http'

export interface RuntimeInjectionOptions {
  target?: Record<string, any>
  adapter?: Partial<WxAdapter>
}

export function injectRuntime(options: RuntimeInjectionOptions = {}) {
  const target = options.target ?? (globalThis as Record<string, any>)

  if (options.adapter) {
    setWxAdapter(options.adapter)
  }

  target.fetch = coreFetch
  target.Headers = Headers
  target.Request = Request
  target.Response = Response
  target.WebSocket = WebSocket
  target.WebSocketCloseEvent = WebSocketCloseEvent
  target.WebSocketErrorEvent = WebSocketErrorEvent
  target.WebSocketMessageEvent = WebSocketMessageEvent
  target.XMLHttpRequest = XMLHttpRequest
  target.XMLHttpRequestEvent = XMLHttpRequestEvent
  target.XMLHttpRequestErrorEvent = XMLHttpRequestErrorEvent

  return target
}

export const fetch = coreFetch

export {
  Headers,
  Request,
  Response,
  WebSocket,
  WebSocketCloseEvent,
  WebSocketErrorEvent,
  WebSocketMessageEvent,
  XMLHttpRequest,
  XMLHttpRequestErrorEvent,
  XMLHttpRequestEvent,
  getWxAdapter,
  setWxAdapter,
}

export type {
  BodyInit,
  HeaderInit,
  WeappFetchOptions,
  WeappRequestOptions,
  WxAdapter,
}
