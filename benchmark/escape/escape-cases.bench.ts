import { escape as escape501 } from 'escape-5-0-1'

import { bench, describe } from 'vitest'
import { escape as escapeLocal } from '../../packages/escape/src'

const customMap = {
  '_': 'x',
  '[': 'L',
  '!': 'bang',
}

const unicodeSelector = '按钮😊漢字'
const leadingHyphenDigits = '-123abc'
const customSelector = '[_!a'

describe('@weapp-core/escape escape additional cases', () => {
  bench('escape unicode selector (local)', () => {
    escapeLocal(unicodeSelector)
  })

  bench('escape unicode selector (5.0.1)', () => {
    escape501(unicodeSelector)
  })

  bench('escape leading hyphen digits (local, ignoreHead)', () => {
    escapeLocal(leadingHyphenDigits, { ignoreHead: true })
  })

  bench('escape leading hyphen digits (5.0.1, ignoreHead)', () => {
    escape501(leadingHyphenDigits, { ignoreHead: true })
  })

  bench('escape with custom map overrides (local)', () => {
    escapeLocal(customSelector, { map: customMap })
  })

  bench('escape with custom map overrides (5.0.1)', () => {
    escape501(customSelector, { map: customMap })
  })
})
