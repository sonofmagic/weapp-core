import { describe, expect, it } from 'vitest'

import {
  ComplexMappingChars2String as ComplexMap,
  MAX_ASCII_CHAR_CODE,
} from '../src/constants'
import { escape } from '../src/escape'

const testCase = `1234567890-=\b~!@#$%^&*()_+qwertyuiop[]\\QWERTYUIOP{}|asdfghjkl;'ASDFGHJKL:"zxcvbnm,./ZXCVBNM<>?`

describe('escape', () => {
  it('should match snapshot for default mapping', () => {
    expect(escape(testCase)).toMatchSnapshot()
  })

  it('should match snapshot for complex mapping', () => {
    expect(escape(testCase, { map: ComplexMap })).toMatchSnapshot()
  })

  it('should handle empty input', () => {
    expect(escape('')).toBe('')
  })

  it('should escape leading hyphen when needed', () => {
    expect(escape('-')).toBe('_-')
    expect(escape('-', { ignoreHead: true })).toBe('-')
  })

  it('should escape leading hyphen followed by digits', () => {
    expect(escape('-12345')).toBe('_-12345')
    expect(escape('-12345', { ignoreHead: true })).toBe('-12345')
  })

  it('should leave hyphen followed by letters untouched', () => {
    expect(escape('-plmkoi')).toBe('-plmkoi')
    expect(escape('-plmkoi', { ignoreHead: true })).toBe('-plmkoi')
  })

  it('should escape mapped characters using custom map', () => {
    expect(escape('abc', { map: { a: 'A', b: 'B' } })).toBe('ABc')
  })

  it('should return unicode escape sequences for non-ascii characters', () => {
    expect(escape('我爱你')).toBe('u6211u7231u4f60')
    expect(escape('😊')).toBe('u1f60a')
  })

  it('should escape contiguous mapped symbols', () => {
    expect(escape('[](){}')).toBe('_b_B_p_P_k_K')
  })

  it('should keep default tokens untouched when already escaped', () => {
    const token = '_b'
    expect(escape(token)).toBe(token)
  })

  it('should encode character immediately above ascii boundary', () => {
    const boundaryChar = String.fromCodePoint(MAX_ASCII_CHAR_CODE + 1)
    expect(escape(boundaryChar)).toBe(`u${(MAX_ASCII_CHAR_CODE + 1).toString(16)}`)
  })

  it('should allow custom map entries to override defaults', () => {
    const map = { '[': 'customL', '!': 'customBang' }
    expect(escape('[!', { map })).toBe('customLcustomBang')
  })

  it('should respect custom mapping for leading hyphen', () => {
    const map = { '-': 'dash' }
    expect(escape('-1', { map })).toBe('dash1')
  })

  it('should reuse cached merged map', () => {
    const map = { '[': 'cachedL' }
    expect(escape('[', { map })).toBe('cachedL')
    expect(escape('[', { map })).toBe('cachedL')
  })

  it('should treat empty custom map as default mapping', () => {
    const empty: Record<string, string> = {}
    const source = '![#'
    expect(escape(source, { map: empty })).toBe(escape(source))
  })

  it('should keep default options when none provided', () => {
    expect(escape('abc')).toBe('abc')
  })

  it('should handle Tailwind arbitrary value syntax', () => {
    const source = 'bg-[var(--xx)]'
    const escaped = escape(source)
    expect(escaped).toBe('bg-_bvar_p--xx_P_B')
  })

  it('should handle Tailwind syntax with complex mapping', () => {
    const source = 'bg-[var(--xx)]'
    const escaped = escape(source, { map: ComplexMap })
    expect(escaped).toBe('bg-_cbvar_cp--xx_cP_cB')
  })
})
