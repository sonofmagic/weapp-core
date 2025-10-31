import {
  escape,
  isAllowedClassName,
  isAsciiNumber,
  ComplexMappingChars2String as MappingChars2String,
  ComplexMappingChars2StringEntries as MappingChars2StringEntries,
  MappingChars2String as SimpleMappingChars2String,
  MappingChars2StringEntries as SimpleMappingChars2StringEntries,
  unescape,
} from '@/index'

const testCase = `1234567890-=\b~!@#$%^&*()_+qwertyuiop[]\\QWERTYUIOP{}|asdfghjkl;'ASDFGHJKL:"zxcvbnm,./ZXCVBNM<>?`

describe('index', () => {
  it('map count eq', () => {
    expect(MappingChars2StringEntries.length).toBe(SimpleMappingChars2StringEntries.length)
    expect(Object.keys(MappingChars2String).sort()).toEqual(Object.keys(SimpleMappingChars2String).sort())
  })

  it('isAsciiNumber', () => {
    for (const char of '1234567890') {
      const num = char.codePointAt(0)
      if (num) {
        const res = isAsciiNumber(num)
        // 如果出现 false，可在此输出字符调试
        expect(res).toBe(true)
      }
    }
  })

  it('not AsciiNumber', () => {
    for (const char of 'qwertyuiop[]asdfghjkl;\'zxcvbnm,./=-') {
      const num = char.codePointAt(0)
      if (num) {
        const res = isAsciiNumber(num)

        expect(res).toBe(false)
      }
    }
  })

  it('escape', () => {
    const res = escape(testCase)
    expect(res).toMatchSnapshot()
  })

  it('escape with map', () => {
    const res = escape(testCase, { map: MappingChars2String })
    expect(res).toMatchSnapshot()
  })

  it('mAX_ASCII_CHAR_CODE', () => {
    const res = escape('我爱你')
    expect(res).toBe('u6211u7231u4f60')
  })

  it('-', () => {
    const res = escape('-')
    expect(res).toBe('_-')
  })

  it('- ignoreHead', () => {
    const res = escape('-', { ignoreHead: true })
    expect(res).toBe('-')
  })

  it('-number', () => {
    const res = escape('-12345')
    expect(res).toBe('_-12345')
  })

  it('-number ignoreHead', () => {
    const res = escape('-12345', { ignoreHead: true })
    expect(res).toBe('-12345')
  })

  it('-string', () => {
    const res = escape('-plmkoi')
    expect(res).toBe('-plmkoi')
  })

  it('-string ignoreHead', () => {
    const res = escape('-plmkoi', { ignoreHead: true })
    expect(res).toBe('-plmkoi')
  })

  it('-string 0', () => {
    const res = escape('-aplmkoi')
    expect(res).toBe('-aplmkoi')
  })

  it('-string 0 ignoreHead', () => {
    const res = escape('-aplmkoi', { ignoreHead: true })
    expect(res).toBe('-aplmkoi')
  })

  it('should return an empty string when input is empty', () => {
    expect(escape('')).toBe('')
  })

  it('should escape characters based on the mapping', () => {
    expect(escape('abc', { map: { a: 'A', b: 'B' } })).toBe('ABc')
  })

  it('should handle Unicode characters', () => {
    expect(escape('😊')).toBe('u1f60a')
  })

  it('should handle Tailwind arbitrary value syntax', () => {
    const source = 'bg-[var(--xx)]'
    const escaped = escape(source)
    expect(escaped).toBe('bg-s2jsvars14s--xxs15ss2ls')
    expect(unescape(escaped)).toBe(escaped)
  })

  it('should handle Tailwind arbitrary value syntax with complex mapping', () => {
    const source = 'bg-[var(--xx)]'
    const escaped = escape(source, { map: MappingChars2String })
    expect(escaped).toBe('bg-c2jcvarc14c--xxc15cc2lc')
    expect(unescape(escaped, { map: MappingChars2String })).toBe(source)
  })

  it('should handle the first character correctly', () => {
    expect(escape('1abc', { ignoreHead: false })).toBe('_1abc')
    expect(escape('1abc', { ignoreHead: true })).toBe('1abc')
  })

  it('should allow custom map entries to override defaults', () => {
    const map = { '[': 'customL', '!': 'customBang' }
    const escaped = escape('[!', { map })
    expect(escaped).toBe('customLcustomBang')
    expect(unescape(escaped, { map })).toBe('[!')
  })

  it('should respect custom mapping for leading hyphen', () => {
    const map = { '-': 'dash' }
    const escaped = escape('-1', { map })
    expect(escaped).toBe('dash1')
    expect(unescape(escaped, { map })).toBe('-1')
  })

  it('should reuse cached merged map for repeated escape calls', () => {
    const map = { '[': 'cachedL' }
    expect(escape('[', { map })).toBe('cachedL')
    expect(escape('[', { map })).toBe('cachedL')
  })

  it('should treat empty custom map as default mapping', () => {
    const emptyMap: Record<string, string> = {}
    const source = '![#'
    expect(escape(source, { map: emptyMap })).toBe(escape(source))
  })

  it('should use default options when none are provided', () => {
    expect(escape('abc')).toBe('abc')
  })

  describe('isAllowedClassName', () => {
    it('case 0', () => {
      expect(isAllowedClassName('abc')).toBe(true)
      expect(isAllowedClassName('-abc')).toBe(true)
      expect(isAllowedClassName('_abc')).toBe(true)
      expect(isAllowedClassName('abc-')).toBe(true)
      expect(isAllowedClassName('abc_')).toBe(true)
      expect(isAllowedClassName('abc-_')).toBe(true)
      expect(isAllowedClassName('abc-_1')).toBe(true)
      expect(isAllowedClassName('abc-_1a')).toBe(true)
      expect(isAllowedClassName('abc-_1a-')).toBe(true)
      expect(isAllowedClassName('abc-_1a-1')).toBe(true)
      expect(isAllowedClassName('abc-_1a-1a')).toBe(true)
      expect(isAllowedClassName('abc-_1a-1a-')).toBe(true)
    })

    it('case 1', () => {
      expect(isAllowedClassName('p-1')).toBe(true)
      expect(isAllowedClassName('p-[2px]')).toBe(false)
      expect(isAllowedClassName('p-(--xx)')).toBe(false)
    })
  })

  describe('unescape', () => {
    it('should return an empty string when input is empty', () => {
      expect(unescape('')).toBe('')
    })

    it('should restore unicode sequences', () => {
      const escaped = escape('我爱你😊')
      expect(unescape(escaped)).toBe('我爱你😊')
    })

    it('should restore mapped characters with the same map', () => {
      const map = MappingChars2String
      const source = 'p-[2px]'
      const escaped = escape(source, { map })
      expect(unescape(escaped, { map })).toBe(source)
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
})
