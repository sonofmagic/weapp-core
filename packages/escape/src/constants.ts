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

// 需要转义的 ASCII 区间：32–47、58–64、91–96、123–126（排除 '-'、'_' 与空格）。
// 这些符号会干扰类名或 ID，统一处理可以兼顾大小写敏感的选择器。
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
  // 用前缀 + base36 编码 + 前缀的方式，保证标记短小且可逆。
  return `${prefix}${code.toString(36).padStart(2, '0')}${prefix}`
}

function buildMapping(prefix: string) {
  // 同一批符号生成两套表（'s' 与 'c'），方便不同场景保持一致。
  return ESCAPE_CHARACTERS.reduce<Record<string, string>>((acc, char) => {
    acc[char] = createUniqueToken(char, prefix)
    return acc
  }, {})
}

// 复杂映射采用更长的标记，确保在外部系统中也能安全反解。
export const ComplexMappingChars2String: MappingStringDictionary = buildMapping('c') as MappingStringDictionary

export const ComplexMappingChars2StringEntries = Object.entries(ComplexMappingChars2String)

// 简单映射追求更短的标记，适合对体积敏感的类名（如 Tailwind 用例）。
export const MappingChars2String: MappingStringDictionary = buildMapping('s') as MappingStringDictionary

export const MappingChars2StringEntries = Object.entries(MappingChars2String)

export const MAX_ASCII_CHAR_CODE = 127
