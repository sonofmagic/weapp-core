---
'@weapp-core/escape': major
---

为 `escape`/`unescape` 增补多种边缘条件的单元测试，覆盖自定义映射、重叠 token 解析与最大 Unicode 解码等场景；同时缓存默认映射及其反向索引，避免重复拷贝与排序，提升热路径性能。
