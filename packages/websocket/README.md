# weapp-websocket

为小程序环境提供浏览器 API 兼容的 `WebSocket` 实现，内部直接使用 [`@weapp-core/http`](../http) 的核心逻辑，保持版本同步。

## 安装

```bash
pnpm add weapp-websocket
```

## 使用示例

```ts
import {
  WebSocket,
  WebSocketMessageEvent,
  setWxAdapter,
} from 'weapp-websocket'

setWxAdapter({ connectSocket: wx.connectSocket })

const socket = new WebSocket('wss://example.com/graphql', ['graphql-ws'])

socket.addEventListener('open', () => {
  socket.send(JSON.stringify({ type: 'ping' }))
})

socket.addEventListener('message', (event: WebSocketMessageEvent) => {
  console.log(event.data)
})
```

## 导出

- `WebSocket` 以及相应的事件对象：`WebSocketMessageEvent`、`WebSocketCloseEvent`、`WebSocketErrorEvent`
- `setWxAdapter` / `getWxAdapter`：覆写使用的 `connectSocket`
- `WeappWebSocketOptions`、`WxAdapter` 类型定义
