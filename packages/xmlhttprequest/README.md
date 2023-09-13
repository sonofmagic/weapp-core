# weapp-xmlhttprequest

use new Websocket(url,protocols) in weapp

- [weapp-xmlhttprequest](#weapp-xmlhttprequest)
  - [Quick Start](#quick-start)
  - [Options](#options)
  - [Graphql usage](#graphql-usage)
    - [subscriptions-transport-ws](#subscriptions-transport-ws)
    - [graphql-ws](#graphql-ws)

## Quick Start

```sh
npm i weapp-websocket
# or
yarn add weapp-websocket
# or
pnpm add weapp-websocket
```

```js
import { WeappWebSocket } from 'weapp-websocket'
const ws = new WeappWebSocket('ws://127.0.0.1:3000/graphql',['graphql-ws'])

ws.close()
ws.close(code)
ws.close(code, reason)
ws.send(data)
ws.addEventListener('close', (event) => { })
ws.onclose = (event) => { }
addEventListener('error', (event) => { })

onerror = (event) => { }
addEventListener('message', (event) => { })

onmessage = (event) => { }
```

## Options

```js
constructor(
    url: string | URL,
    protocols?: string | string[],
    options?: Partial<
      Omit<WechatMiniprogram.ConnectSocketOption, 'url' | 'protocols'>
    >,
    connectSocket = wx.connectSocket
)
// so you can use 
uni.connectSocket
Taro.connectSocket 
// etc... to create custom websockets
```

API refers link: <https://developer.mozilla.org/en-US/docs/Web/API/WebSocket>

Options refers link: <https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.connectSocket.html>

## Graphql usage

This package is useful for creating clients in weapp environment.

### subscriptions-transport-ws

protocol: `graphql-ws`

you maybe create a client in this way:

```js
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { WeappWebSocket } from 'weapp-websocket'

const wsClient = new SubscriptionClient('ws://127.0.0.1:3000/graphql', {
  connectionParams: {
    // your params
  }
  // other options
}, // pass WeappWebSocket to webSocketImpl 
WeappWebSocket)

wsClient.request({
  query: `
subscription {
   something{
     id
     value
   }
 }
`
}).subscribe({
  next (res) {
    console.log(res)
  },
  error (err) {
    console.log(err)
  }
})
```

### graphql-ws

protocol: `graphql-transport-ws`

```js
import { createClient } from 'graphql-ws'
import { WeappWebSocket } from 'weapp-websocket'

const wsClient = createClient({
  url: 'ws://localhost:3000/graphql',
  webSocketImpl: WeappWebSocket
})

wsClient.subscribe({
        query: `
             subscription {
         something{
           id
           value
         }
       }
        `
      }, {
        next (res) {
          console.log(res)
        },
        error (err) {
          console.log(err)
        },
        complete () {

        }
      })
```
