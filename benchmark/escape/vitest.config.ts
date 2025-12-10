import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['escape.compare.bench.ts'],
    benchmark: {
      time: 1,
    },
  },
})
