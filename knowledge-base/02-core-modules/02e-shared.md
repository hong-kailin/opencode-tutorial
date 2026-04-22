# Core Package: packages/shared (Shared Utilities)

## 1. 定位

**共享工具库**，被多个包依赖，提供：
- 文件系统抽象
- 通用工具函数
- 类型定义
- 平台适配

## 2. 技术栈

| 技术 | 用途 |
|------|------|
| Effect | 函数式工具 |
| @effect/platform-node | Node 平台适配 |
| @npmcli/arborist | npm 依赖树分析 |
| glob | 文件匹配 |
| minimatch | 模式匹配 |
| semver | 语义化版本 |
| zod | 类型校验 |

## 3. 目录结构

```
src/
├── util/               # 通用工具
│   ├── error.ts        # 错误类型
│   ├── slug.ts         # URL slug 生成
│   ├── hash.ts         # 哈希函数
│   └── glob.ts         # Glob 工具
├── filesystem.ts       # 文件系统抽象
└── ...                 # 其他工具模块
```

## 4. 核心模块

### 4.1 文件系统 (filesystem.ts)

**AppFileSystem**：Effect 风格的文件系统服务

```typescript
export class Service extends Context.Service<Service, Interface>()("@opencode/AppFileSystem") {}

interface Interface {
  readonly read: (path: string) => Effect.Effect<string>
  readonly write: (path: string, content: string) => Effect.Effect<void>
  readonly exists: (path: string) => Effect.Effect<boolean>
  readonly mkdir: (path: string) => Effect.Effect<void>
  // ...
}
```

**实现**：基于 `@effect/platform-node` 的 `FileSystem.FileSystem`

**使用**：
```typescript
const fs = yield* AppFileSystem.Service
const content = yield* fs.read("/path/to/file")
```

### 4.2 错误处理 (util/error.ts)

**NamedError**：带名称的结构化错误

```typescript
export class NamedError extends Error {
  constructor(
    name: string,
    message: string,
    public data?: Record<string, any>
  )
}
```

**使用场景**：
- 区分不同类型的错误
- 传递结构化错误数据
- CLI 错误格式化

### 4.3 Slug 生成 (util/slug.ts)

**Slug.generate**：生成 URL 友好的标识符

```typescript
const slug = Slug.generate("Hello World!") // "hello-world"
```

### 4.4 哈希 (util/hash.ts)

**Hash.create**：内容哈希

```typescript
const hash = Hash.create(content) // 用于缓存键、去重等
```

### 4.5 Glob (util/glob.ts)

**Glob.match**：文件模式匹配

```typescript
const matches = Glob.match("src/**/*.ts", "src/index.ts") // true
```

## 5. 被依赖情况

| 包 | 用途 |
|----|------|
| `packages/opencode` | 文件系统、错误处理、工具函数 |
| `packages/app` | 工具函数（部分） |
| `packages/plugin` | 类型定义（间接） |

## 6. 设计原则

- **纯函数优先**：无副作用的工具函数
- **Effect 风格**：异步操作返回 Effect
- **平台无关**：抽象平台差异（Node/Bun）
- **零外部依赖**（除 Effect 等基础库）

## 7. 使用示例

```typescript
import { AppFileSystem } from "@opencode-ai/shared/filesystem"
import { NamedError } from "@opencode-ai/shared/util/error"
import { Slug } from "@opencode-ai/shared/util/slug"

// 文件操作
const content = yield* AppFileSystem.Service.use(
  (fs) => fs.read("config.json")
)

// 错误处理
throw new NamedError("ConfigError", "Invalid configuration", { path })

// Slug 生成
const id = Slug.generate(session.title)
```
