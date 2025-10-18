export { getWxAdapter, setWxAdapter, type WxAdapter } from './defaults'
export {
  type BodyInit,
  fetch,
  type HeaderInit,
  Headers,
  Request,
  Response,
  type WeappFetchOptions,
  type WeappRequestOptions,
} from './fetch'
export {
  MiniProgramWebSocket,
  type WeappWebSocketOptions,
  MiniProgramWebSocket as WebSocket,
  WebSocketCloseEvent,
  WebSocketErrorEvent,
  WebSocketMessageEvent as WebSocketEvent,
  WebSocketMessageEvent,
} from './ws'
export {
  MiniProgramXMLHttpRequest,
  MiniProgramXMLHttpRequest as XMLHttpRequest,
  XMLHttpRequestErrorEvent,
  XMLHttpRequestProgressEvent as XMLHttpRequestEvent,
  type XMLHttpRequestEventMap,
  XMLHttpRequestProgressEvent,
} from './xhr'
