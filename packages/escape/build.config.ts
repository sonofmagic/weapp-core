import path from 'node:path'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  // 可按需指定入口，例如 ['./src/index', './src/cli']
  // 默认仅构建入口示例 ['./src/index']
  rollup: {
    // 内联，相当于 nodeResolve
    inlineDependencies: true,
    // cjs
    emitCJS: true,
    // 添加 cjs 注入
    cjsBridge: true,
    dts: {
      // 相关问题记录：https://github.com/unjs/unbuild/issues/135
      respectExternal: false,
    },
  },
  alias: {
    // 别名
    '@': path.resolve(__dirname, './src'),
  },
  // dts
  declaration: true,
})
