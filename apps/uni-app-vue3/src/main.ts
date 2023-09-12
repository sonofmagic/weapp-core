// import { WebSocket, XMLHttpRequest } from '@weapp-core/http'
import { createSSRApp } from 'vue'
import App from './App.vue'
// globalThis.WebSocket = WebSocket
// globalThis.XMLHttpRequest = XMLHttpRequest
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
