import { escape as escape501 } from 'escape-5-0-1'

import { bench, describe } from 'vitest'
import { escape as escapeLocal } from '../../packages/escape/src'

const shortSelector = 'btn-primary/active#icon[data-state=open]'
const BENCH_CONFIG = {
  time: 5000,
  warmupTime: 500,
}

describe('@weapp-core/escape escape short compare local vs 5.0.1', () => {
  bench('escape short selector (local)', () => {
    escapeLocal(shortSelector)
  }, BENCH_CONFIG)

  bench('escape short selector (5.0.1)', () => {
    escape501(shortSelector)
  }, BENCH_CONFIG)
})
