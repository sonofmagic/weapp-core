# weapp-xmlhttprequest

基于 [`@weapp-core/http`](../http) 的 `XMLHttpRequest` 封装，提供与浏览器一致的 API，在微信小程序及其他基于 `wx.request` 的运行时中可直接替换使用。

## 安装

```bash
pnpm add weapp-xmlhttprequest
```

## 使用

```ts
import {
  XMLHttpRequest,
  setWxAdapter,
} from 'weapp-xmlhttprequest'

setWxAdapter({ request: wx.request })

const xhr = new XMLHttpRequest()
xhr.open('POST', 'https://example.com/api/todo')
xhr.setRequestHeader('Content-Type', 'application/json')
xhr.onload = () => console.log(xhr.status, xhr.responseText)
xhr.onerror = () => console.error('network error')
xhr.send(JSON.stringify({ title: 'mini app' }))
```

## 特性

- 支持 `responseType`（`text` / `json` / `arraybuffer`）以及超时、中断处理
- 自动处理大小写不敏感的请求/响应头
- 与浏览器事件模型一致（`load`, `error`, `timeout`, `readystatechange` 等）
- 可通过 `setWxAdapter` 替换底层 `request` 实现（Taro、uni-app 等）
