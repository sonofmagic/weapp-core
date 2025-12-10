import { escape as escape501, unescape as unescape501 } from 'escape-5-0-1'

import { bench, describe } from 'vitest'
import { escape as escapeLocal, unescape as unescapeLocal } from '../../packages/escape/src'

const shortSelector = 'btn-primary/active#icon[data-state=open]'

const escapedShortLocal = escapeLocal(shortSelector)
const escapedShort501 = escape501(shortSelector)

describe('@weapp-core/escape unescape short compare local vs 5.0.1', () => {
  bench('unescape short selector (local)', () => {
    unescapeLocal(escapedShortLocal)
  })

  bench('unescape short selector (5.0.1)', () => {
    unescape501(escapedShort501)
  })
})
