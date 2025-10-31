# @weapp-core/escape

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
