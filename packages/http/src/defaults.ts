type RequestAdapter = WechatMiniprogram.Wx['request']
type ConnectSocketAdapter = WechatMiniprogram.Wx['connectSocket']

export interface WxAdapter {
  request: RequestAdapter
  connectSocket: ConnectSocketAdapter
}

function missingRequest(): never {
  throw new Error('`wx.request` is not available. Provide a WeChat adapter via `setWxAdapter`.')
}

function missingConnectSocket(): never {
  throw new Error('`wx.connectSocket` is not available. Provide a WeChat adapter via `setWxAdapter`.')
}

const defaultAdapter: WxAdapter = {
  request: (() => missingRequest()) as unknown as RequestAdapter,
  connectSocket: (() => missingConnectSocket()) as unknown as ConnectSocketAdapter,
}

function resolveGlobalWx(): Partial<WxAdapter> | undefined {
  const globalObject = (typeof globalThis === 'object' ? globalThis : undefined) as
    | Record<string, any>
    | undefined

  if (globalObject && typeof globalObject.wx === 'object' && globalObject.wx) {
    const wxGlobal = globalObject.wx as WechatMiniprogram.Wx
    return {
      request: wxGlobal.request.bind(wxGlobal),
      connectSocket: wxGlobal.connectSocket.bind(wxGlobal),
    }
  }
}

let currentAdapter: WxAdapter = {
  ...defaultAdapter,
  ...resolveGlobalWx(),
}

export function getWxAdapter(): WxAdapter {
  return currentAdapter
}

export function setWxAdapter(adapter: Partial<WxAdapter>): void {
  currentAdapter = {
    ...currentAdapter,
    ...adapter,
  }
}
