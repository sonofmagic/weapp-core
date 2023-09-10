/* eslint-disable unicorn/prefer-add-event-listener */

import { WeappWebSocket, WeappWebSocketEvent } from '@/index'
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
): WechatMiniprogram.SocketTask {
  return {
    close(opt) {
      opt.success?.({
        errMsg: 'ok'
      })
    },
    send(opt) {
      opt.success?.({
        errMsg: 'ok'
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
    ws.addEventListener('message', function () {
      result.push(1)
    })

    ws.addEventListener('message', () => {
      result.push(2)
    })

    ws.addEventListener('message', () => {
      result.push(3)
    })

    ws.onmessage = () => {
      result.push(4)
    }

    ws.dispatchEvent(
      new WeappWebSocketEvent('message', {
        data: '1234'
      })
    )

    expect(result).toEqual([1, 2, 3, 4])
  })
})
