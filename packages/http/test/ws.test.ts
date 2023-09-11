/* eslint-disable unicorn/prefer-add-event-listener */

import { WeappWebSocket, WeappWebSocketEvent } from '@/index'
import { WeappWebSocketTask } from '@/ws'
const defaultMockOptions = {
  message: 'onMessage',
  errMsg: 'onError',
  code: 1000,
  reason: 'mockReason'
}

function createMockTask(
  options?: WechatMiniprogram.ConnectSocketOption,
  mockOptions: {
    message: string
    errMsg: string
    code: number
    reason: string
  } = defaultMockOptions
): WeappWebSocketTask {
  return {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
    readyState: 0,
    close(opt) {
      opt.success?.({
        errMsg: 'ok'
      })
    },
    send(opt) {
      opt.success?.({
        errMsg: opt.data.toString()
      })
    },
    onClose(fn) {
      fn?.({
        code: mockOptions.code,
        reason: mockOptions.reason
      })
    },
    onError(fn) {
      fn?.({
        errMsg: mockOptions.errMsg
      })
    },
    onMessage(fn) {
      fn?.({
        data: mockOptions.message
      })
    },
    onOpen(fn) {
      fn?.({
        header: {},
        profile: {
          connectEnd: 0,
          connectStart: 0,
          cost: 0,
          domainLookupEnd: 0,
          domainLookupStart: 0,
          fetchStart: 0,
          handshakeCost: 0,
          rtt: 0
        }
      })
    }
  }
}

describe('[Default]', () => {
  test('should be defined', () => {
    expect(WeappWebSocket).toBeDefined()
  })

  test('common usage', () => {
    const ws = new WeappWebSocket('ws://127.0.0.1:3000/graphql', ['graphql-ws'], {}, createMockTask)
    ws.addEventListener('open', function (e) {
      expect(this).toBe(ws)
      expect(e.value.header).toBeDefined()
      expect(e.value.profile).toBeDefined()
    })

    ws.onerror = function (e) {
      expect(this).toBe(ws)
      expect(e.value.errMsg).toBeDefined()
      expect(e.value.errMsg).toBe(defaultMockOptions.errMsg)
    }

    ws.onmessage = function (e) {
      expect(this).toBe(ws)
      expect(e.value.data).toBeDefined()
    }

    ws.addEventListener('close', function (e) {
      expect(this).toBe(ws)
      expect(e.value.code).toBeDefined()
      expect(e.value.reason).toBeDefined()
    })
  })

  test('open invoke sequnce', () => {
    const result: number[] = []
    const ws = new WeappWebSocket('ws://127.0.0.1:3000/graphql', ['graphql-ws'], {}, createMockTask)
    ws.addEventListener('open', function () {
      result.push(1)
    })

    ws.addEventListener('open', () => {
      result.push(2)
    })

    ws.addEventListener('open', () => {
      result.push(3)
    })

    ws.onopen = () => {
      result.push(4)
    }
    expect(ws.onopen).toBeDefined()
    expect(typeof ws.onopen === 'function').toBe(true)

    ws.dispatchEvent(
      new WeappWebSocketEvent('open', {
        header: {},
        profile: {
          connectEnd: 0,
          connectStart: 0,
          cost: 0,
          domainLookupEnd: 0,
          domainLookupStart: 0,
          fetchStart: 0,
          handshakeCost: 0,
          rtt: 0
        }
      })
    )

    expect(result).toEqual([1, 2, 3, 4])
  })

  test('close invoke sequnce', () => {
    const result: number[] = []
    const ws = new WeappWebSocket('ws://127.0.0.1:3000/graphql', ['graphql-ws'], {}, createMockTask)
    ws.addEventListener('close', function () {
      result.push(1)
    })

    ws.addEventListener('close', () => {
      result.push(2)
    })

    ws.addEventListener('close', () => {
      result.push(3)
    })

    ws.onclose = () => {
      result.push(4)
    }
    expect(ws.onclose).toBeDefined()
    expect(typeof ws.onclose === 'function').toBe(true)
    ws.dispatchEvent(
      new WeappWebSocketEvent('close', {
        code: 1,
        reason: 'aaa'
      })
    )

    expect(result).toEqual([1, 2, 3, 4])
  })

  test('error invoke sequnce', () => {
    const result: number[] = []
    const ws = new WeappWebSocket('ws://127.0.0.1:3000/graphql', ['graphql-ws'], {}, createMockTask)
    ws.addEventListener('error', function () {
      result.push(1)
    })

    ws.addEventListener('error', () => {
      result.push(2)
    })

    ws.addEventListener('error', () => {
      result.push(3)
    })

    ws.onerror = () => {
      result.push(4)
    }
    expect(ws.onerror).toBeDefined()
    expect(typeof ws.onerror === 'function').toBe(true)
    ws.dispatchEvent(
      new WeappWebSocketEvent('error', {
        errMsg: '1234'
      })
    )

    expect(result).toEqual([1, 2, 3, 4])
  })

  test('message invoke sequnce', () => {
    const result: number[] = []
    const ws = new WeappWebSocket('ws://127.0.0.1:3000/graphql', ['graphql-ws'], {}, createMockTask)
    let d: string
    ws.addEventListener('message', function () {
      result.push(1)
    })

    ws.addEventListener('message', () => {
      result.push(2)
    })

    ws.addEventListener('message', () => {
      result.push(3)
    })

    ws.onmessage = (e) => {
      result.push(4)
      d = e.value.data as string
    }
    expect(ws.onmessage).toBeDefined()
    expect(typeof ws.onmessage === 'function').toBe(true)

    ws.dispatchEvent(
      new WeappWebSocketEvent('message', {
        data: '1234'
      })
    )

    expect(result).toEqual([1, 2, 3, 4])
    // @ts-ignore
    expect(d).toBe('1234')
  })

  it('send msg', async () => {
    const ws = new WeappWebSocket('ws://127.0.0.1:3000/graphql', [], {}, createMockTask)
    const sendText = '1111'
    const res = await ws.send(sendText)
    expect(res.errMsg).toBe(sendText)
  })

  it('readyState init get CONNECTING(0)', () => {
    const ws = new WeappWebSocket('ws://127.0.0.1:3000/graphql', [], {}, createMockTask)
    // mock task run all fn
    expect(ws.readyState).toBe(3)
  })

  it('WeappWebSocket options case 0', () => {
    const opt = { timeout: 1 }
    const ws = new WeappWebSocket('ws://127.0.0.1:3000/graphql', [], opt, createMockTask)
    // mock task run all fn
    expect(ws.params).toEqual({
      ...opt,
      url: 'ws://127.0.0.1:3000/graphql',
      protocols: []
    })
  })

  it('close method', async () => {
    const ws = new WeappWebSocket('ws://127.0.0.1:3000/graphql', [], {}, createMockTask)
    const { errMsg } = await ws.close()
    expect(errMsg).toBe('ok')
  })
})
