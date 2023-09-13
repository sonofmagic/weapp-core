import type { PlainObject } from './type'
export function isObject(o: any): boolean {
  return Object.prototype.toString.call(o) === '[object Object]'
}

export function getType(payload: any): string {
  return Object.prototype.toString.call(payload).slice(8, -1)
}

export function isPlainObject(payload: any): payload is PlainObject {
  if (getType(payload) !== 'Object') return false
  const prototype = Object.getPrototypeOf(payload)
  return !!prototype && prototype.constructor === Object && prototype === Object.prototype
}

export function fixUrl(url: string) {
  try {
    return url === '' && global.location.href ? global.location.href : url
  } catch {
    return url
  }
}
