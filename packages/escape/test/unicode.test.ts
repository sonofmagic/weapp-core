import { describe, expect, it } from 'vitest'

import { decodeUnicodeSequence } from '../src/unicode'

describe('unicode helpers', () => {
  it('should decode unicode sequences beyond ASCII range', () => {
    expect(decodeUnicodeSequence('u4f60', 0)).toEqual({ char: '你', length: 5 })
  })

  it('should ignore invalid prefixes or ascii code points', () => {
    expect(decodeUnicodeSequence('foo', 0)).toBeUndefined()
    expect(decodeUnicodeSequence('u41', 0)).toBeUndefined()
  })

  it('should decode uppercase hex digits', () => {
    expect(decodeUnicodeSequence('u00AF', 0)).toEqual({ char: '\u00AF', length: 5 })
  })
})
