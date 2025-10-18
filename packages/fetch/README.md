# weapp-fetch

Mini 程序环境下的 `fetch` 轻量封装，直接复用 [`@weapp-core/http`](../http) 的实现，默认同时导出 `Headers`、`Request`、`Response` 等工具。

## 安装

```bash
pnpm add weapp-fetch
# 或 npm / yarn
```

## 使用

```ts
import { fetch, createFetch, setWxAdapter } from 'weapp-fetch'

// 可选：显式指定适配器
setWxAdapter({
  request: wx.request,
})

const res = await fetch('https://example.com/api/todos')
const data = await res.json()

// 如果你需要基于其他 request 实现（如 Taro、uni-app）
const taroFetch = createFetch(Taro.request)
```

## 导出内容

- `fetch`：与浏览器一致的 `fetch` API
- `Headers`、`Request`、`Response`：与 Web 平台保持一致的数据结构
- `setWxAdapter` / `getWxAdapter`：管理小程序请求/连接适配器
- `createFetch(request)`：返回绑定自定义 request 方法的 `fetch`
