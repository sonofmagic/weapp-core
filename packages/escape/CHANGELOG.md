# @weapp-core/escape

## 7.0.0

### Major Changes

- 🚀 **调整 Unicode 转义格式为 `u_x<hex>_`，避免普通单词被误解码，并补充边界与类型测试。** [`18267dd`](https://github.com/sonofmagic/weapp-core/commit/18267ddf6713651f4a77a97e78b49b59e317774c) by @sonofmagic

## 6.0.1

### Patch Changes

- [`be1b192`](https://github.com/sonofmagic/weapp-core/commit/be1b1920a05e3b9e2e9efc1d970330633eeb2648) Thanks [@sonofmagic](https://github.com/sonofmagic)! - 优化 escape/unescape 性能对齐分组基准，修复解码逻辑并保持行为一致。

## 6.0.0

### Major Changes

- [`0b5bd36`](https://github.com/sonofmagic/weapp-core/commit/0b5bd36cc87930a4ca9eba92c105d830b0471759) Thanks [@sonofmagic](https://github.com/sonofmagic)! - 提升 escape 代码点解析性能，补充基准用例与对比数据文档，方便后续跟踪优化收益；新增根目录 benchmark 基准脚本，可直接对比当前实现与 npm 5.0.1 版性能。

## 5.0.1

### Patch Changes

- [`5898439`](https://github.com/sonofmagic/weapp-core/commit/58984396955c280378d084d39cd77f53cbd49846) Thanks [@sonofmagic](https://github.com/sonofmagic)! - 缩短默认转义标记并补充更多边界值用例，提升可读性与覆盖面。

## 5.0.0

### Major Changes

- [`2cac589`](https://github.com/sonofmagic/weapp-core/commit/2cac5892249f829fd35f0ec295bbd022e3c6b4db) Thanks [@sonofmagic](https://github.com/sonofmagic)! - 为 `escape`/`unescape` 增补多种边缘条件的单元测试，覆盖自定义映射、重叠 token 解析与最大 Unicode 解码等场景；同时缓存默认映射及其反向索引，避免重复拷贝与排序，提升热路径性能。

## 4.0.1

### Patch Changes

- [`3c0056e`](https://github.com/sonofmagic/weapp-core/commit/3c0056e0cd433f84abb32c6d8da10ec5594e1de6) Thanks [@sonofmagic](https://github.com/sonofmagic)! - feat: add isAllowedClassName function export

## 4.0.0

### Major Changes

- [`d291730`](https://github.com/sonofmagic/weapp-core/commit/d291730fe279b0945546e4376738996441e04240) Thanks [@sonofmagic](https://github.com/sonofmagic)! - rename `SimpleMappingChars2String` -> `MappingChars2String`

## 3.0.1

### Patch Changes

- [`ecc84d5`](https://github.com/sonofmagic/weapp-core/commit/ecc84d543dcf8035896805d1787eba241a231ba8) Thanks [@sonofmagic](https://github.com/sonofmagic)! - chore: revert unique separator

## 3.0.0

### Major Changes

- [`b9e3e2c`](https://github.com/sonofmagic/weapp-core/commit/b9e3e2c47c046bad901baaa32825e8e849225a3f) Thanks [@sonofmagic](https://github.com/sonofmagic)! - feat: unique separator
