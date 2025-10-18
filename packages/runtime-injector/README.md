# @weapp-core/runtime-injector

为小程序环境注入浏览器风格网络 API 的辅助工具。基于 [`@weapp-core/http`](../http)，一次性把 `fetch`、`WebSocket`、`XMLHttpRequest` 及其事件对象挂载到指定目标（默认 `globalThis`）。

## 安装

```bash
pnpm add @weapp-core/runtime-injector
```

## 快速上手

```ts
import { injectRuntime } from '@weapp-core/runtime-injector'

injectRuntime({
  adapter: {
    request: wx.request,
    connectSocket: wx.connectSocket,
  },
})

// 现在可以直接使用 fetch / WebSocket / XMLHttpRequest
const res = await fetch('https://example.com/api/ping')
```

## 主要导出

- `injectRuntime(options)`：把 API 注入到 `options.target`（默认 `globalThis`）
  - `adapter`：可选，覆写 `wx.request` / `wx.connectSocket`
- 透传的核心导出：`fetch`、`Headers`、`Request`、`Response`、`WebSocket`、`XMLHttpRequest` 等
- `setWxAdapter` / `getWxAdapter`：手动管理适配器

## 适用场景

- 在小程序项目入口（如 `app.ts`）中一次性注入全局 API
- 在基于 SSR/多环境的框架中（如 `next-taro`），对运行时上下文进行兜底补丁
