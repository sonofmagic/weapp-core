import type { EscapeOptions } from './types'
import { MAX_ASCII_CHAR_CODE } from './constants'
import { ESCAPE_PREFIX, HYPHEN } from './internal-constants'
import {
  createEscapeMapping,
  DEFAULT_ESCAPE_MAPPING,
  hasOwnKey,
} from './mapping'
import { isAsciiNumber } from './predicates'

const MAX_SINGLE_UNIT_CODE_POINT = 0xFFFF

const DEFAULT_ESCAPE_TABLE = (() => {
  const table: Array<string | undefined> = Array.from({ length: MAX_ASCII_CHAR_CODE + 1 })

  for (const [char, token] of Object.entries(DEFAULT_ESCAPE_MAPPING)) {
    table[char.codePointAt(0)!] = token
  }

  return table
})()

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
  const length = selectors.length

  if (length === 0) {
    return ''
  }

  const map = createEscapeMapping(options?.map)
  const ignoreHead = options?.ignoreHead ?? false
  const usingDefaultMap = map === DEFAULT_ESCAPE_MAPPING

  const sb: string[] = []

  let cursor = 0
  const firstCode = selectors.codePointAt(0)!
  const firstSize = firstCode > MAX_SINGLE_UNIT_CODE_POINT ? 2 : 1
  cursor = firstSize

  const firstChar = firstSize === 1 ? selectors[0] : selectors.slice(0, firstSize)

  const nextCode = cursor < length ? selectors.codePointAt(cursor)! : undefined
  const nextSize = nextCode !== undefined && nextCode > MAX_SINGLE_UNIT_CODE_POINT ? 2 : 1
  const nextChar = nextCode === undefined
    ? undefined
    : selectors.slice(cursor, cursor + nextSize)

  if (usingDefaultMap) {
    if (firstCode > MAX_ASCII_CHAR_CODE) {
      sb.push(`u${firstCode.toString(16)}`)
    }
    else {
      const mapped = DEFAULT_ESCAPE_TABLE[firstCode]

      if (mapped !== undefined) {
        sb.push(mapped)
      }
      else {
        sb.push(escapeLeadingCharacter(firstChar, nextChar, ignoreHead))
      }
    }

    while (cursor < length) {
      const code = selectors.codePointAt(cursor)!
      const size = code > MAX_SINGLE_UNIT_CODE_POINT ? 2 : 1
      const char = size === 1
        ? selectors[cursor]
        : selectors.slice(cursor, cursor + size)

      cursor += size

      if (code > MAX_ASCII_CHAR_CODE) {
        sb.push(`u${code.toString(16)}`)
        continue
      }

      const mapped = DEFAULT_ESCAPE_TABLE[code]

      if (mapped !== undefined) {
        sb.push(mapped)
        continue
      }

      sb.push(char)
    }

    return sb.join('')
  }

  if (firstCode > MAX_ASCII_CHAR_CODE) {
    sb.push(`u${firstCode.toString(16)}`)
  }
  else if (hasOwnKey(map, firstChar)) {
    sb.push(map[firstChar])
  }
  else {
    sb.push(escapeLeadingCharacter(firstChar, nextChar, ignoreHead))
  }

  while (cursor < length) {
    const code = selectors.codePointAt(cursor)!
    const size = code > MAX_SINGLE_UNIT_CODE_POINT ? 2 : 1
    const char = size === 1
      ? selectors[cursor]
      : selectors.slice(cursor, cursor + size)

    cursor += size

    if (code > MAX_ASCII_CHAR_CODE) {
      sb.push(`u${code.toString(16)}`)
      continue
    }

    if (hasOwnKey(map, char)) {
      sb.push(map[char])
      continue
    }

    sb.push(char)
  }

  return sb.join('')
}
