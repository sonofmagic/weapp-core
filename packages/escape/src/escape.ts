import type { EscapeOptions } from './types'
import { defu } from 'defu'
import { MappingChars2String, MAX_ASCII_CHAR_CODE } from './constants'

export function isAsciiNumber(code: number) {
  return code >= 48 && code <= 57
}

export function isAllowedClassName(className: string) {
  return /^[\w-]+$/.test(className)
}

function handleFirstCharacter(char: string, nextChar: string | undefined, ignoreHead: boolean): string {
  if (!ignoreHead) {
    const code = char.codePointAt(0)!
    if (isAsciiNumber(code)) {
      return `_${char}`
    }
    if (char === '-' && nextChar && isAsciiNumber(nextChar.codePointAt(0)!)) {
      return `_${char}`
    }
    if (char === '-' && nextChar === undefined) {
      return `_${char}`
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

  const { map, ignoreHead } = defu<Required<EscapeOptions>, EscapeOptions[]>(options, {
    map: MappingChars2String,
    ignoreHead: false,
  })

  const sb: string[] = []
  for (let i = 0; i < selectors.length; i++) {
    const char = selectors[i]
    const code = char.codePointAt(0)
    if (code !== undefined) {
      if (code > MAX_ASCII_CHAR_CODE) {
        sb.push(`u${code.toString(16)}`)
      }
      else {
        const hit = map[char]
        if (hit) {
          sb.push(hit)
        }
        else if (i === 0) {
          sb.push(handleFirstCharacter(char, selectors[i + 1], ignoreHead))
        }
        else {
          sb.push(char)
        }
      }
    }
  }

  return sb.join('')
}
