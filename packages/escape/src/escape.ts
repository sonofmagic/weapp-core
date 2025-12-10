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

const HIGH_SURROGATE_MIN = 0xD800
const HIGH_SURROGATE_MAX = 0xDBFF
const LOW_SURROGATE_MIN = 0xDC00
const LOW_SURROGATE_MAX = 0xDFFF
const SURROGATE_OFFSET = 0x10000

interface CodePointView {
  code: number
  size: number
  char: string
}

function readCodePoint(value: string, index: number, length: number): CodePointView {
  const firstUnit = value.charCodeAt(index)

  if (firstUnit >= HIGH_SURROGATE_MIN && firstUnit <= HIGH_SURROGATE_MAX && index + 1 < length) {
    const secondUnit = value.charCodeAt(index + 1)

    if (secondUnit >= LOW_SURROGATE_MIN && secondUnit <= LOW_SURROGATE_MAX) {
      return {
        code: ((firstUnit - HIGH_SURROGATE_MIN) << 10) + (secondUnit - LOW_SURROGATE_MIN) + SURROGATE_OFFSET,
        size: 2,
        char: value.slice(index, index + 2),
      }
    }
  }

  return {
    code: firstUnit,
    size: 1,
    char: value[index],
  }
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

  const firstView = readCodePoint(selectors, 0, length)
  let cursor = firstView.size
  const nextChar = cursor < length
    ? readCodePoint(selectors, cursor, length).char
    : undefined

  if (usingDefaultMap) {
    if (firstView.code > MAX_ASCII_CHAR_CODE) {
      sb.push(`u${firstView.code.toString(16)}`)
    }
    else if (DEFAULT_ESCAPE_KEYS.has(firstView.char)) {
      sb.push(DEFAULT_ESCAPE_MAPPING[firstView.char])
    }
    else {
      sb.push(escapeLeadingCharacter(firstView.char, nextChar, ignoreHead))
    }

    while (cursor < length) {
      const view = readCodePoint(selectors, cursor, length)
      cursor += view.size

      if (view.code > MAX_ASCII_CHAR_CODE) {
        sb.push(`u${view.code.toString(16)}`)
        continue
      }

      if (DEFAULT_ESCAPE_KEYS.has(view.char)) {
        sb.push(DEFAULT_ESCAPE_MAPPING[view.char])
        continue
      }

      sb.push(view.char)
    }

    return sb.join('')
  }

  if (firstView.code > MAX_ASCII_CHAR_CODE) {
    sb.push(`u${firstView.code.toString(16)}`)
  }
  else if (hasOwnKey(map, firstView.char)) {
    sb.push(map[firstView.char])
  }
  else {
    sb.push(escapeLeadingCharacter(firstView.char, nextChar, ignoreHead))
  }

  while (cursor < length) {
    const view = readCodePoint(selectors, cursor, length)
    cursor += view.size

    if (view.code > MAX_ASCII_CHAR_CODE) {
      sb.push(`u${view.code.toString(16)}`)
      continue
    }

    if (hasOwnKey(map, view.char)) {
      sb.push(map[view.char])
      continue
    }

    sb.push(view.char)
  }

  return sb.join('')
}
