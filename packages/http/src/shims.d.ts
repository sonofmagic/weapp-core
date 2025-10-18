/// <reference types="miniprogram-api-typings" />

declare module 'event-target-shim' {
  class Event<TType extends string = string> {
    constructor(type: TType, eventInitDict?: Event.EventInit)
    readonly type: TType
  }

  namespace Event {
    interface EventInit {
      bubbles?: boolean
      cancelable?: boolean
    }
  }

  class EventTarget<EventMap = Record<string, Event<any>>, _Mode extends 'strict' | 'loose' = 'strict'> {
    addEventListener<K extends keyof EventMap>(type: K, listener: (event: EventMap[K]) => void): void
    removeEventListener<K extends keyof EventMap>(type: K, listener: (event: EventMap[K]) => void): void
    dispatchEvent(event: EventMap[keyof EventMap]): boolean
  }

  function getEventAttributeValue<EventMap, K extends keyof EventMap>(
    target: EventTarget<EventMap>,
    type: K,
  ): ((event: EventMap[K]) => void) | null

  function setEventAttributeValue<EventMap, K extends keyof EventMap>(
    target: EventTarget<EventMap>,
    type: K,
    value: ((event: EventMap[K]) => void) | null,
  ): void

  export { Event, EventTarget, getEventAttributeValue, setEventAttributeValue }
}
