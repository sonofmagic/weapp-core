export const SYMBOL_TABLE = {
  BACKQUOTE: '`',
  TILDE: '~',
  EXCLAM: '!',
  AT: '@',
  NUMBERSIGN: '#',
  DOLLAR: '$',
  PERCENT: '%',
  CARET: '^',
  AMPERSAND: '&',
  ASTERISK: '*',
  PARENLEFT: '(',
  PARENRIGHT: ')',
  MINUS: '-',
  UNDERSCORE: '_',
  EQUAL: '=',
  PLUS: '+',
  BRACKETLEFT: '[',
  BRACELEFT: '{',
  BRACKETRIGHT: ']',
  BRACERIGHT: '}',
  SEMICOLON: ';',
  COLON: ':',
  QUOTE: '\'',
  DOUBLEQUOTE: '"',
  BACKSLASH: '\\',
  BAR: '|',
  COMMA: ',',
  LESS: '<',
  PERIOD: '.',
  GREATER: '>',
  SLASH: '/',
  QUESTION: '?',
  SPACE: ' ',
  DOT: '.',
  HASH: '#',
} as const

export type SYMBOL_TABLE_TYPE = typeof SYMBOL_TABLE

export type SYMBOL_TABLE_TYPE_VALUES = SYMBOL_TABLE_TYPE[keyof SYMBOL_TABLE_TYPE]

export type MappingStringDictionary = Record<Exclude<SYMBOL_TABLE_TYPE_VALUES, '-' | '_' | ' '>, string>

// ASCII slices we escape: 32–47, 58–64, 91–96, 123–126 (minus '-', '_' and space).
// These cover punctuation that breaks class/id selectors while keeping selector casing intact.
const ESCAPE_CHARACTERS = [
  '[',
  ']',
  '(',
  ')',
  '#',
  '!',
  '/',
  '\\',
  '.',
  ':',
  '%',
  ',',
  '\'',
  '"',
  '*',
  '&',
  '@',
  '{',
  '}',
  '+',
  ';',
  '<',
  '~',
  '=',
  '>',
  '?',
  '^',
  '`',
  '|',
  '$',
] as const

function createUniqueToken(char: string, prefix: string) {
  const code = char.codePointAt(0)!
  // Prefix + base36(code) + prefix keeps tokens short, unique, and reversible.
  return `${prefix}${code.toString(36).padStart(2, '0')}${prefix}`
}

function buildMapping(prefix: string) {
  // We build both simple ('s') and complex ('c') maps from same char list to keep parity.
  return ESCAPE_CHARACTERS.reduce<Record<string, string>>((acc, char) => {
    acc[char] = createUniqueToken(char, prefix)
    return acc
  }, {})
}

// Complex map keeps longer, collision-free tokens so external systems can safely reverse them.
export const ComplexMappingChars2String: MappingStringDictionary = buildMapping('c') as MappingStringDictionary

export const ComplexMappingChars2StringEntries = Object.entries(ComplexMappingChars2String)

// Simple map prioritises shorter tokens when size matters (e.g. Tailwind-compatible classnames).
export const MappingChars2String: MappingStringDictionary = buildMapping('s') as MappingStringDictionary

export const MappingChars2StringEntries = Object.entries(MappingChars2String)

export const MAX_ASCII_CHAR_CODE = 127
