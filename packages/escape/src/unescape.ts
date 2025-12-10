import type { UnescapeOptions } from './types'
import { ESCAPE_PREFIX, HYPHEN } from './internal-constants'
import {
  createInverseMapping,
  createUnescapeMapping,
  DEFAULT_ESCAPE_MAPPING,
} from './mapping'
import { isAsciiNumber } from './predicates'
import { decodeUnicodeSequence } from './unicode'

const DEFAULT_UNESCAPE_TABLE = (() => {
  const inverse: Record<string, string> = {}

  for (const [char, token] of Object.entries(DEFAULT_ESCAPE_MAPPING)) {
    inverse[token] = char
  }

  return inverse
})()

function unescapeDefault(value: string, ignoreHead: boolean) {
  const length = value.length

  if (length === 0) {
    return ''
  }

  let cursor = 0
  let result = ''

  while (cursor < length) {
    const currentChar = value[cursor]

    if (!ignoreHead && cursor === 0 && currentChar === ESCAPE_PREFIX) {
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

    if (currentChar === 'u') {
      const decodedUnicode = decodeUnicodeSequence(value, cursor)

      if (decodedUnicode) {
        result += decodedUnicode.char
        cursor += decodedUnicode.length
        continue
      }
    }

    result += currentChar
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

export function unescape(
  value: string,
  options?: UnescapeOptions,
) {
  const length = value.length

  if (length === 0) {
    return ''
  }

  const map = createUnescapeMapping(options?.map)
  const ignoreHead = options?.ignoreHead ?? false

  if (!map) {
    return unescapeDefault(value, ignoreHead)
  }

  const usingDefaultMap = map === DEFAULT_ESCAPE_MAPPING
  const mappingForInverse = map || (usingDefaultMap
    ? DEFAULT_ESCAPE_MAPPING
    : undefined)
  const { inverse, tokens } = mappingForInverse
    ? createInverseMapping(mappingForInverse)
    : { inverse: {} as Record<string, string>, tokens: [] as string[] }

  const tokenBuckets = usingDefaultMap || tokens.length === 0
    ? undefined
    : tokens.reduce<Record<string, string[]>>((acc, token) => {
        if (!token) {
          return acc
        }

        const first = token[0]
        const bucket = acc[first]

        if (bucket) {
          bucket.push(token)
        }
        else {
          acc[first] = [token]
        }

        return acc
      }, {})

  let cursor = 0
  let result = ''

  while (cursor < length) {
    const currentChar = value[cursor]

    if (!ignoreHead && cursor === 0 && currentChar === ESCAPE_PREFIX) {
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

    if (currentChar === 'u') {
      const decodedUnicode = decodeUnicodeSequence(value, cursor)

      if (decodedUnicode) {
        result += decodedUnicode.char
        cursor += decodedUnicode.length
        continue
      }
    }

    if (usingDefaultMap && currentChar === ESCAPE_PREFIX) {
      const token = value.slice(cursor, cursor + 2)
      const mapped = DEFAULT_UNESCAPE_TABLE[token]

      if (mapped !== undefined) {
        result += mapped
        cursor += 2
        continue
      }
    }
    else if (tokenBuckets) {
      const bucket = tokenBuckets[currentChar]

      if (bucket) {
        let matchedToken = false

        for (const token of bucket) {
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
      }
    }

    result += currentChar
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
