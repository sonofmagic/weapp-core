import type { EscapeOptions } from './types'
import { MAX_ASCII_CHAR_CODE } from './constants'
import { ESCAPE_PREFIX, HYPHEN } from './internal-constants'
import {
  createEscapeMapping,
  DEFAULT_ESCAPE_KEYS,
  DEFAULT_ESCAPE_MAPPING,
  hasOwnKey,
} from './mapping'
import { isAsciiNumber } from './predicates'

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
