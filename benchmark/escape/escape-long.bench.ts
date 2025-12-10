import { escape as escape501 } from 'escape-5-0-1'

import { bench, describe } from 'vitest'
import { escape as escapeLocal } from '../../packages/escape/src'

const shortSelector = 'btn-primary/active#icon[data-state=open]'
const repeatedSelector = Array.from({ length: 32 }, () => shortSelector).join(' ')

describe('@weapp-core/escape escape long compare local vs 5.0.1', () => {
  bench('escape long selector (local)', () => {
    escapeLocal(repeatedSelector)
  })

  bench('escape long selector (5.0.1)', () => {
    escape501(repeatedSelector)
  })
})
