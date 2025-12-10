# escape 基准对比

比较当前工作区版本与 npm 发布版 `@weapp-core/escape@5.0.1` 的性能。

## 运行

```bash
pnpm --dir benchmark/escape install
pnpm --dir benchmark/escape bench
```

`pnpm install` 会拉取发布版别名 `escape-5-0-1`；`vitest bench` 输出两版的对比报告。
