import { escape as escape501, unescape as unescape501 } from 'escape-5-0-1'

import { bench, describe } from 'vitest'
import { escape as escapeLocal, unescape as unescapeLocal } from '../../packages/escape/src'

const shortSelector = 'btn-primary/active#icon[data-state=open]'
const repeatedSelector = Array.from({ length: 32 }, () => shortSelector).join(' ')

const escapedRepeatedLocal = escapeLocal(repeatedSelector)
const escapedRepeated501 = escape501(repeatedSelector)
const BENCH_CONFIG = {
  time: 5000,
  warmupTime: 500,
}

describe('@weapp-core/escape unescape compare local vs 5.0.1', () => {
  bench('unescape long selector (local)', () => {
    unescapeLocal(escapedRepeatedLocal)
  }, BENCH_CONFIG)

  bench('unescape long selector (5.0.1)', () => {
    unescape501(escapedRepeated501)
  }, BENCH_CONFIG)
})
