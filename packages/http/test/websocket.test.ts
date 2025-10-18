import type {
  WebSocketCloseEvent,
  WebSocketErrorEvent,
  WebSocketMessageEvent,
} from '@/index'
import { beforeEach, describe, expect, vi } from 'vitest'
import {
  MiniProgramWebSocket,
  setWxAdapter,
} from '@/index'

type Listener<T> = (arg: T) => void

interface SocketHandlers {
  open: Listener<WechatMiniprogram.OnOpenListenerResult>[]
  close: Listener<WechatMiniprogram.SocketTaskOnCloseListenerResult>[]
  error: Listener<WechatMiniprogram.GeneralCallbackResult>[]
  message: Listener<WechatMiniprogram.SocketTaskOnMessageListenerResult>[]
}

function createSocketStub() {
  const handlers: SocketHandlers = {
    open: [],
    close: [],
    error: [],
    message: [],
  }

  const task = {
    close: vi.fn(),
    send: vi.fn(),
    onOpen(cb: Listener<WechatMiniprogram.OnOpenListenerResult>) {
      handlers.open.push(cb)
    },
    onClose(cb: Listener<WechatMiniprogram.SocketTaskOnCloseListenerResult>) {
      handlers.close.push(cb)
    },
    onError(cb: Listener<WechatMiniprogram.GeneralCallbackResult>) {
      handlers.error.push(cb)
    },
    onMessage(cb: Listener<WechatMiniprogram.SocketTaskOnMessageListenerResult>) {
      handlers.message.push(cb)
    },
  } as unknown as WechatMiniprogram.SocketTask

  const connectSocket = vi.fn(() => task)

  return { handlers, task, connectSocket }
}

describe('MiniProgramWebSocket', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('transitions to OPEN on successful connection', () => {
    const { handlers, connectSocket } = createSocketStub()

    setWxAdapter({
      connectSocket,
      request: vi.fn(),
    })

    const ws = new MiniProgramWebSocket('wss://example.com')

    expect(ws.readyState).toBe(MiniProgramWebSocket.CONNECTING)
    handlers.open.forEach(handler => handler({ header: {} } as any))
    expect(ws.readyState).toBe(MiniProgramWebSocket.OPEN)
  })

  it('dispatches message events', () => {
    const { handlers, connectSocket } = createSocketStub()
    setWxAdapter({
      connectSocket,
      request: vi.fn(),
    })

    const ws = new MiniProgramWebSocket('wss://example.com/socket')
    const messageSpy = vi.fn()
    ws.addEventListener('message', (event: WebSocketMessageEvent) => {
      messageSpy(event.data)
    })

    handlers.open.forEach(handler => handler({ header: {} } as any))
    handlers.message.forEach(handler => handler({ data: 'ping' } as any))

    expect(messageSpy).toHaveBeenCalledWith('ping')
  })

  it('throws when sending before open', () => {
    const { connectSocket } = createSocketStub()
    setWxAdapter({
      connectSocket,
      request: vi.fn(),
    })

    const ws = new MiniProgramWebSocket('wss://example.com')
    expect(() => ws.send('data')).toThrow()
  })

  it('invokes underlying send once open', () => {
    const { handlers, task, connectSocket } = createSocketStub()
    setWxAdapter({
      connectSocket,
      request: vi.fn(),
    })

    const ws = new MiniProgramWebSocket('wss://example.com')
    handlers.open.forEach(handler => handler({ header: {} } as any))

    ws.send('payload')
    expect(task.send).toHaveBeenCalledWith(
      expect.objectContaining({ data: 'payload' }),
    )
  })

  it('emits close event and transitions to CLOSED', () => {
    const { handlers, task, connectSocket } = createSocketStub()
    setWxAdapter({
      connectSocket,
      request: vi.fn(),
    })

    const ws = new MiniProgramWebSocket('wss://example.com')
    const closeSpy = vi.fn()
    ws.addEventListener('close', (event: WebSocketCloseEvent) => {
      closeSpy(event.code, event.reason)
    })

    handlers.open.forEach(handler => handler({ header: {} } as any))
    ws.close(1000, 'done')

    expect(task.close).toHaveBeenCalledWith(expect.objectContaining({ code: 1000, reason: 'done' }))

    handlers.close.forEach(handler => handler({ code: 1000, reason: 'done' } as any))
    expect(ws.readyState).toBe(MiniProgramWebSocket.CLOSED)
    expect(closeSpy).toHaveBeenCalledWith(1000, 'done')
  })

  it('dispatches error events', () => {
    const { handlers, connectSocket } = createSocketStub()
    setWxAdapter({
      connectSocket,
      request: vi.fn(),
    })

    const ws = new MiniProgramWebSocket('wss://example.com')
    const errorSpy = vi.fn()
    ws.addEventListener('error', (event: WebSocketErrorEvent) => {
      errorSpy(event.message)
    })

    handlers.error.forEach(handler => handler({ errMsg: 'fail' }))
    expect(errorSpy).toHaveBeenCalledWith('fail')
  })
})
