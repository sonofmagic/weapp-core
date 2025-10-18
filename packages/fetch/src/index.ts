import {
  fetch as coreFetch,
  getWxAdapter,
  Headers,
  Request,
  Response,
  setWxAdapter,
  type BodyInit,
  type HeaderInit,
  type WeappFetchOptions,
  type WeappRequestOptions,
  type WxAdapter,
} from '@weapp-core/http'

export const fetch = coreFetch

export default coreFetch

export { Headers, Request, Response, getWxAdapter, setWxAdapter }

export type {
  BodyInit,
  HeaderInit,
  WeappFetchOptions,
  WeappRequestOptions,
  WxAdapter,
}

export function createFetch(requestMethod?: WechatMiniprogram.Wx['request']) {
  if (requestMethod) {
    setWxAdapter({ request: requestMethod })
  }
  return coreFetch
}
