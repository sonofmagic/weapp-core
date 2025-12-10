import { escape as escape501, unescape as unescape501 } from 'escape-5-0-1'

import { bench, describe } from 'vitest'
import { unescape as unescapeLocal } from '../../packages/escape/src'
import { MappingChars2String } from '../../packages/escape/src/constants'

const plainSelector = 'plain-text'
const unicodeEncoded = escape501('你好')
const leadingDigitEncoded = escape501('_1abc')
const leadingHyphenEncoded = escape501('_-1')
const defaultMapToken = '_b'

const customMap = { _: 'x', a: '_a', b: '_b' }
const customEncoded = escape501('_ab', { map: customMap })

describe('@weapp-core/escape unescape additional cases', () => {
  bench('unescape plain selector (local, early return)', () => {
    unescapeLocal(plainSelector)
  })

  bench('unescape plain selector (5.0.1, early return)', () => {
    unescape501(plainSelector)
  })

  bench('unescape unicode encoded selector (local)', () => {
    unescapeLocal(unicodeEncoded)
  })

  bench('unescape unicode encoded selector (5.0.1)', () => {
    unescape501(unicodeEncoded)
  })

  bench('unescape leading digit encoded (local)', () => {
    unescapeLocal(leadingDigitEncoded)
  })

  bench('unescape leading digit encoded (5.0.1)', () => {
    unescape501(leadingDigitEncoded)
  })

  bench('unescape leading hyphen encoded (local)', () => {
    unescapeLocal(leadingHyphenEncoded)
  })

  bench('unescape leading hyphen encoded (5.0.1)', () => {
    unescape501(leadingHyphenEncoded)
  })

  bench('unescape default token with explicit map (local)', () => {
    unescapeLocal(defaultMapToken, { map: MappingChars2String })
  })

  bench('unescape default token with explicit map (5.0.1)', () => {
    unescape501(defaultMapToken, { map: MappingChars2String })
  })

  bench('unescape custom map tokens (local)', () => {
    unescapeLocal(customEncoded, { map: customMap })
  })

  bench('unescape custom map tokens (5.0.1)', () => {
    unescape501(customEncoded, { map: customMap })
  })
})
