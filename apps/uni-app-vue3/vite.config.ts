import path from 'node:path'
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import inject from '@rollup/plugin-inject'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni()
    // @ts-ignore
    // resolve(),
    // @ts-ignore
    // replace({
    //   values: {
    //     window: 'globalThis' // JSON.stringify('globalThis')
    //   },
    //   include: [/socket\.io-client/, /engine\.io-client/],
    //   preventAssignment: true
    // }),
    // @ts-ignore
    // inject({
    //   // include: ['engine.io-client'], // , '**/*.{vue,js,ts}'
    //   modules: {
    //     XMLHttpRequest: ['@weapp-core/http', 'XMLHttpRequest'],
    //     WebSocket: ['@weapp-core/http', 'WebSocket'],
    //     window: [path.resolve('src/shims.js'), 'window'],
    //     self: [path.resolve('src/shims.js'), 'self']
    //     // window:'globalThis'
    //   }
    // })
  ]
  // build: {
  //   rollupOptions: {
  //     external: ['@weapp-core/http']
  //   }
  // }
})
