# @weapp-core/http

一套在微信小程序环境中复刻浏览器网络 API 的核心实现，包括 `fetch`、`WebSocket`、`XMLHttpRequest` 以及对应的事件类型。

- 适配微信小程序的 `wx.request`、`wx.connectSocket`
- 内置 `Headers`、`Request`、`Response` 等工具，行为与 Web 平台保持一致
- 支持自定义适配器，便于在各类跨端框架（Taro、uni-app 等）中复用

## 安装

```bash
pnpm add @weapp-core/http
# 或 npm / yarn
```

## 快速开始

```ts
import {
  fetch,
  Headers,
  Request,
  Response,
  WebSocket,
  XMLHttpRequest,
  setWxAdapter,
} from '@weapp-core/http'

// 可选：手动注入小程序适配器（默认会尝试从 globalThis.wx 读取）
setWxAdapter({
  request: wx.request,
  connectSocket: wx.connectSocket,
})

const response = await fetch('https://example.com/api/todos')
const data = await response.json()

const socket = new WebSocket('wss://example.com/graphql')
socket.onmessage = (event) => {
  console.log('ws message', event.data)
}

const xhr = new XMLHttpRequest()
xhr.open('GET', 'https://example.com/status')
xhr.onload = () => console.log(xhr.statusText)
xhr.send()
```

## 适配器

通过 `setWxAdapter` 可以替换默认的 `wx.request`/`wx.connectSocket`，例如在 Taro 中：

```ts
import Taro from '@tarojs/taro'
import { setWxAdapter } from '@weapp-core/http'

setWxAdapter({
  request: Taro.request,
  connectSocket: Taro.connectSocket,
})
```

## 相关包

- [`weapp-fetch`](../fetch)：简单导出 `@weapp-core/http` 的 `fetch`
- [`weapp-websocket`](../websocket)：单独分发的 WebSocket 包
- [`weapp-xmlhttprequest`](../xmlhttprequest)：单独分发的 XMLHttpRequest 包
- [`@weapp-core/runtime-injector`](../runtime-injector)：一键注入全局 API 的辅助工具
