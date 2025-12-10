import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // keep this project out of the regular test run
    include: [],
    benchmark: {
      include: ['*.bench.ts'],
    },
  },
})
