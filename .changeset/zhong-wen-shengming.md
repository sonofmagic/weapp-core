---
"@weapp-core/http": major
"@weapp-core/runtime-injector": minor
"weapp-websocket": minor
"weapp-xmlhttprequest": minor
---

- 重写小程序环境的 `fetch`、`WebSocket`、`XMLHttpRequest` 适配层，统一由 `wx` 适配器驱动并提供更完整的事件、超时与中断处理。
- 运行时注入器与独立 `websocket`、`xmlhttprequest` 包同步指向核心实现，避免重复维护并保持行为一致。
