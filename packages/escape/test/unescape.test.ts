import { describe, expect, it } from 'vitest'

import { MappingChars2String as ComplexMap } from '../src/constants'
import { escape } from '../src/escape'
import { unescape } from '../src/unescape'

describe('unescape', () => {
  it('should return an empty string when input is empty', () => {
    expect(unescape('')).toBe('')
  })

  it('should restore unicode sequences', () => {
    const escaped = escape('我爱你😊')
    expect(unescape(escaped)).toBe('我爱你😊')
  })

  it('should restore mapped characters with the same map', () => {
    const source = 'p-[2px]'
    const escaped = escape(source, { map: ComplexMap })
    expect(unescape(escaped, { map: ComplexMap })).toBe(source)
  })

  it('should restore leading digits', () => {
    const escaped = escape('1abc')
    expect(unescape(escaped)).toBe('1abc')
  })

  it('should handle dangling leading underscore', () => {
    expect(unescape('_')).toBe('')
  })

  it('should keep non-hex unicode markers untouched', () => {
    expect(unescape('u-')).toBe('u-')
  })

  it('should ignore ascii unicode escapes', () => {
    expect(unescape('u61')).toBe('u61')
  })

  it('should decode uppercase unicode sequences', () => {
    expect(unescape('u00AF')).toBe('\u00AF')
  })

  it('should restore leading hyphen cases', () => {
    expect(unescape(escape('-'))).toBe('-')
    expect(unescape(escape('-123'))).toBe('-123')
  })

  it('should respect ignoreHead option', () => {
    const source = '-123'
    const escaped = escape(source, { ignoreHead: true })
    expect(unescape(escaped, { ignoreHead: true })).toBe(source)
  })

  it('should preserve genuine leading underscores', () => {
    expect(unescape('_abc')).toBe('_abc')
  })

  it('should strip artificial underscore before digits when provided via map', () => {
    const map = { _: 'x' }
    const escaped = escape('_1abc', { map })
    expect(escaped).toBe('x1abc')
    expect(unescape(escaped, { map })).toBe('1abc')
  })

  it('should strip artificial underscore before hyphen sequences from map output', () => {
    const map = { _: 'x' }
    const escaped = escape('_-1', { map })
    expect(escaped).toBe('x-1')
    expect(unescape(escaped, { map })).toBe('-1')
  })

  it('should retain artificial underscore when hyphen is followed by letters', () => {
    const map = { _: 'x' }
    const escaped = escape('_-ab', { map })
    expect(escaped).toBe('x-ab')
    expect(unescape(escaped, { map })).toBe('_-ab')
  })

  it('should keep encoded hyphen sequences without map when followed by letters', () => {
    expect(unescape('_-ab')).toBe('_-ab')
  })

  it('should decode default mapping tokens when map is provided explicitly', () => {
    expect(unescape('_b', { map: ComplexMap })).toBe('[')
  })

  it('should prefer longer tokens when decoding overlapping map outputs', () => {
    const map = {
      a: '_',
      b: '__',
    }
    expect(unescape('__', { map })).toBe('b')
    expect(unescape('___', { map })).toBe('ba')
  })

  it('should decode the maximum unicode code point sequence', () => {
    const maxCodePointChar = String.fromCodePoint(0x10FFFF)
    expect(unescape('u10ffff')).toBe(maxCodePointChar)
  })

  it('should keep leading underscores when ignoreHead is true', () => {
    expect(unescape('_1', { ignoreHead: true })).toBe('_1')
  })

  it('should skip empty tokens when decoding', () => {
    const map = {
      a: '',
      b: '_b',
    }
    const escaped = escape('ba', { map })
    expect(escaped).toBe('_b')
    expect(unescape(escaped, { map })).toBe('b')
  })

  it('should continue past empty tokens when no match exists', () => {
    const map = {
      a: '',
      b: '_b',
    }
    expect(unescape('_', { map })).toBe('')
  })
})
