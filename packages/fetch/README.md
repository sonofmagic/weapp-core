# weapp-fetch

> 这是一个在小程序中实现 fetch 标准 api 的 npm 包
>
## 为什么需要它？

我想在 `weapp` 环境下，使用现代的 `graphql` 客户端，主要是 `graphql-request` 和 `@apollo/client`

然而，它们都依赖于 `fetch` 这个 api，同时因为含义上传文件部分，它们也都需要 `FormData` 这样的对象

这显然在小程序这个环境下是没有的，所以，我就想着 `fork` 一下 `graphql-request` 做一个阉割版本的，在小程序环境里使用，就这样。

## Usage

```js
const { createFetch } = require('weapp-fetch')
// cjs or esm
import { createFetch } from 'weapp-fetch'
// maybe you need @ts-ignore
const weappFetch = createFetch(wx.request)
const uniFetch = createFetch(uni.request)
const taroFetch = createFetch(taro.request)

weappFetch(resource)
weappFetch(resource, options)
```
