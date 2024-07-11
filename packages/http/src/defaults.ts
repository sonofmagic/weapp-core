function noop() {}

let wxRef: WechatMiniprogram.Wx = {
  // @ts-ignore
  connectSocket: noop,
  // @ts-ignore
  request: noop,
}
try {
  if (wx) {
    wxRef = wx
  }
}
catch {}

export const refs = {
  wx: wxRef,
}
