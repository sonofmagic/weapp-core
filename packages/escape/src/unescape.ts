import type { UnescapeOptions } from './types'
import { ESCAPE_PREFIX, HYPHEN } from './internal-constants'
import {
  createInverseMapping,
  createUnescapeMapping,
} from './mapping'
import { isAsciiNumber } from './predicates'
import { decodeUnicodeSequence } from './unicode'

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
