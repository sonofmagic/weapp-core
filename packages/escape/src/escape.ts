import type { EscapeOptions, UnescapeOptions } from './types'
import {
  ComplexMappingChars2String,
  MappingChars2String,
  MAX_ASCII_CHAR_CODE,
} from './constants'

const DIGIT_MIN_CODE = 48
const DIGIT_MAX_CODE = 57
const HYPHEN = '-'
const ESCAPE_PREFIX = '_'
const UNICODE_PREFIX = 'u'
const HEX_RADIX = 16
const DEFAULT_ESCAPE_MAPPING: Record<string, string> = MappingChars2String
const COMPLEX_ESCAPE_MAPPING: Record<string, string> = ComplexMappingChars2String
const DEFAULT_ESCAPE_KEYS = new Set(Object.keys(DEFAULT_ESCAPE_MAPPING))
const escapeMappingCache = new WeakMap<Record<string, string>, Record<string, string>>()

interface InverseMappingResult {
  inverse: Record<string, string>
  tokens: string[]
}

const inverseMappingCache = new WeakMap<Record<string, string>, InverseMappingResult>()

export function isAsciiNumber(code: number) {
  return code >= DIGIT_MIN_CODE && code <= DIGIT_MAX_CODE
}

export function isAllowedClassName(className: string) {
  return /^[\w-]+$/.test(className)
}

function createEscapeMapping(customMap?: Record<string, string>): Record<string, string> {
  if (!customMap) {
    return DEFAULT_ESCAPE_MAPPING
  }

  if (customMap === DEFAULT_ESCAPE_MAPPING || customMap === COMPLEX_ESCAPE_MAPPING) {
    return customMap
  }

  const cached = escapeMappingCache.get(customMap)
  if (cached) {
    return cached
  }

  if (Object.keys(customMap).length === 0) {
    escapeMappingCache.set(customMap, DEFAULT_ESCAPE_MAPPING)
    return DEFAULT_ESCAPE_MAPPING
  }

  const merged = { ...DEFAULT_ESCAPE_MAPPING, ...customMap }
  escapeMappingCache.set(customMap, merged)

  return merged
}

function createUnescapeMapping(customMap?: Record<string, string>) {
  return customMap
}

function hasOwnKey(object: Record<string, string>, key: string) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function buildInverseMapping(mapping: Record<string, string>): InverseMappingResult {
  const inverse: Record<string, string> = {}
  const tokens = new Set<string>()

  for (const [key, value] of Object.entries(mapping)) {
    inverse[value] = key
    tokens.add(value)
  }

  const sortedTokens = Array.from(tokens).sort((a, b) => b.length - a.length)

  return { inverse, tokens: sortedTokens }
}

function createInverseMapping(mapping: Record<string, string>) {
  const cached = inverseMappingCache.get(mapping)

  if (cached) {
    return cached
  }

  const built = buildInverseMapping(mapping)
  inverseMappingCache.set(mapping, built)

  return built
}

function primeInverseCache(mapping: Record<string, string>) {
  inverseMappingCache.set(mapping, buildInverseMapping(mapping))
}

function isHexDigit(char: string) {
  const code = char.codePointAt(0)!

  return (
    (code >= 48 && code <= 57) // 0-9 数字
    || (code >= 65 && code <= 70) // A-F 大写十六进制
    || (code >= 97 && code <= 102) // a-f 小写十六进制
  )
}

function escapeLeadingCharacter(char: string, nextChar: string | undefined, ignoreHead: boolean) {
  if (ignoreHead) {
    return char
  }

  const code = char.codePointAt(0)!

  if (isAsciiNumber(code)) {
    return `${ESCAPE_PREFIX}${char}`
  }

  if (char === HYPHEN) {
    if (!nextChar) {
      return `${ESCAPE_PREFIX}${char}`
    }
    if (isAsciiNumber(nextChar.codePointAt(0)!)) {
      return `${ESCAPE_PREFIX}${char}`
    }
  }

  return char
}

function decodeUnicodeSequence(value: string, index: number) {
  if (value[index] !== UNICODE_PREFIX) {
    return undefined
  }

  let cursor = index + 1
  while (cursor < value.length) {
    const nextChar = value[cursor]
    if (!nextChar || !isHexDigit(nextChar)) {
      break
    }
    cursor += 1
  }

  if (cursor === index + 1) {
    return undefined
  }

  const hex = value.slice(index + 1, cursor)
  const codePoint = Number.parseInt(hex, HEX_RADIX)

  if (Number.isNaN(codePoint) || codePoint <= MAX_ASCII_CHAR_CODE) {
    return undefined
  }

  return {
    char: String.fromCodePoint(codePoint),
    length: cursor - index,
  }
}

export function escape(
  selectors: string,
  options?: EscapeOptions,
) {
  if (selectors.length === 0) {
    return ''
  }

  const map = createEscapeMapping(options?.map)
  const ignoreHead = options?.ignoreHead ?? false
  const usingDefaultMap = map === DEFAULT_ESCAPE_MAPPING

  const sb: string[] = []
  const characters = Array.from(selectors)

  for (let index = 0; index < characters.length; index++) {
    const char = characters[index]
    const code = char.codePointAt(0)!

    if (code > MAX_ASCII_CHAR_CODE) {
      sb.push(`u${code.toString(16)}`)
      continue
    }

    if (usingDefaultMap) {
      if (DEFAULT_ESCAPE_KEYS.has(char)) {
        sb.push(DEFAULT_ESCAPE_MAPPING[char])
        continue
      }
    }
    else if (hasOwnKey(map, char)) {
      sb.push(map[char])
      continue
    }

    if (index === 0) {
      sb.push(escapeLeadingCharacter(char, characters[index + 1], ignoreHead))
      continue
    }

    sb.push(char)
  }

  return sb.join('')
}

export function unescape(
  value: string,
  options?: UnescapeOptions,
) {
  if (value.length === 0) {
    return ''
  }

  const map = createUnescapeMapping(options?.map)
  const ignoreHead = options?.ignoreHead ?? false
  const { inverse, tokens } = map
    ? createInverseMapping(map)
    : { inverse: {} as Record<string, string>, tokens: [] as string[] }

  let cursor = 0
  let result = ''

  while (cursor < value.length) {
    if (!ignoreHead && cursor === 0 && value[cursor] === ESCAPE_PREFIX) {
      const nextChar = value[cursor + 1]

      if (nextChar && isAsciiNumber(nextChar.codePointAt(0)!)) {
        result += nextChar
        cursor += 2
        continue
      }

      if (nextChar === HYPHEN) {
        const thirdChar = value[cursor + 2]
        if (!thirdChar || isAsciiNumber(thirdChar.codePointAt(0)!)) {
          result += HYPHEN
          cursor += 2
          continue
        }
      }
    }

    const decodedUnicode = decodeUnicodeSequence(value, cursor)

    if (decodedUnicode) {
      result += decodedUnicode.char
      cursor += decodedUnicode.length
      continue
    }

    let matchedToken = false

    for (const token of tokens) {
      if (token.length === 0) {
        continue
      }

      if (value.startsWith(token, cursor)) {
        result += inverse[token]
        cursor += token.length
        matchedToken = true
        break
      }
    }

    if (matchedToken) {
      continue
    }

    result += value[cursor]
    cursor++
  }

  if (ignoreHead || result.length === 0 || !result.startsWith(ESCAPE_PREFIX)) {
    return result
  }

  const nextChar = result[1]
  if (!nextChar) {
    return result.slice(1)
  }

  let shouldStrip = isAsciiNumber(nextChar.codePointAt(0)!)

  if (!shouldStrip && nextChar === HYPHEN) {
    const thirdChar = result[2]
    shouldStrip = !thirdChar || isAsciiNumber(thirdChar.codePointAt(0)!)
  }

  return shouldStrip ? result.slice(1) : result
}

primeInverseCache(DEFAULT_ESCAPE_MAPPING)
primeInverseCache(COMPLEX_ESCAPE_MAPPING)
