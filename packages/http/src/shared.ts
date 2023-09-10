export function isString(o: unknown): o is string {
  return typeof o === 'string'
}

export function isFunction(o: unknown): o is (...args: any[]) => any {
  return typeof o === 'function'
}
