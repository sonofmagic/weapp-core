import path from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src')
      },
      {
        find: '@weapp-core/http',
        replacement: path.resolve(__dirname, '../http/src')
      }
    ],
    globals: true,
    testTimeout: 60_000,
    setupFiles: ['./vitest.setup.ts']
  }
})
