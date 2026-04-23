# 知识点 01：Effect（函数式编程框架）

## 为什么 OpenCode 要使用 Effect？

### 1. 项目面临的挑战

OpenCode 是一个复杂的 AI Coding Agent，它面临以下问题：

**（1）错误处理复杂**
- 需要调用 LLM API、文件系统、数据库、子进程等多种外部系统
- 每个调用都可能失败，错误类型各不相同
- 传统 try/catch 容易遗漏，导致未捕获异常

**（2）依赖关系复杂**
- 有 Agent、Session、Tool、Provider、Project 等 20+ 个核心模块
- 模块之间互相依赖（如 Session 依赖 Project，Tool 依赖 Config）
- 需要管理这些依赖的初始化和生命周期

**（3）需要可追踪性**
- Agent 执行流程很长（接收输入 → 加载上下文 → 调用 LLM → 执行工具 → 保存结果）
- 出问题时要能快速定位是哪个环节出错
- 需要支持 OpenTelemetry 分布式追踪

**（4）并发控制**
- 需要同时处理多个任务（文件监听、LSP、LLM 流式响应）
- 需要优雅地取消和清理资源
- 需要管理 Fiber（轻量级线程）

### 2. Effect 如何解决这些问题

| 问题 | 传统方式 | Effect 方式 |
|------|---------|------------|
| 错误处理 | try/catch（运行时） | 类型系统（编译时） |
| 依赖注入 | 手动传参 / 全局变量 | Layer + Context（声明式） |
| 可追踪性 | 手动打日志 | 自动 OpenTelemetry 追踪 |
| 并发控制 | Promise / Worker | Fiber + Scope |
| 资源管理 | try/finally | Effect.acquireRelease |

### 3. 在 OpenCode 中的实际应用

**Service 定义**（OpenCode 的核心模式）：
```typescript
// packages/opencode/src/agent/agent.ts
export class Service extends Context.Service<Service, Interface>()("@opencode/Agent") {}
export const layer = Layer.effect(Service, Effect.gen(function* () {
  const config = yield* Config.Service
  const provider = yield* Provider.Service
  // ...
}))
```

**错误处理**（所有 API 调用都包装为 Effect）：
```typescript
const result = yield* Effect.tryPromise({
  try: () => llmApi.call(),
  catch: (error) => new LLMError({ cause: error })
})
```

**资源管理**（自动清理）：
```typescript
yield* Effect.acquireRelease(
  Effect.sync(() => openFile()),
  (file) => Effect.sync(() => file.close())
)
```

## 核心概念

### 1. Effect<Success, Error, Requirements>

Effect 是一个**值**，描述了一个可能有副作用的计算：

- **Success**：成功时返回的类型
- **Error**：失败时返回的错误类型
- **Requirements**：执行所需的依赖（如 Service）

```typescript
// 一个 Effect：成功返回 string，可能失败（Error），不需要额外依赖
const myEffect: Effect.Effect<string, Error, never> = ...

// 一个 Effect：成功返回 User，可能失败 NotFoundError，需要 Database Service
const getUser: Effect.Effect<User, NotFoundError, Database.Service> = ...
```

### 2. Effect.gen（生成器语法）

用生成器语法组合多个 Effect，类似 async/await：

```typescript
const program = Effect.gen(function* () {
  // yield* 类似 await，但用于 Effect
  const user = yield* getUser(1)      // 如果失败，整个程序停止
  const posts = yield* getPosts(user) // 上一步成功才执行
  return { user, posts }
})
```

**与 async/await 的区别**：
- async/await：错误通过 try/catch 捕获（运行时）
- Effect.gen：错误通过类型系统追踪（编译时）

### 3. Effect.runPromise（执行 Effect）

Effect 只是描述，需要**运行**才能执行：

```typescript
// 将 Effect 转为 Promise
const result = await Effect.runPromise(program)

// 处理错误
const result = await Effect.runPromise(Effect.orElse(program, fallback))
```

### 4. Service 和 Layer（依赖注入）

**定义 Service**：
```typescript
// 1. 定义接口
interface LoggerInterface {
  readonly log: (message: string) => Effect.Effect<void>
}

// 2. 创建 Service Tag
class LoggerService extends Context.Tag("Logger")<LoggerService, LoggerInterface>() {}
```

**提供实现（Layer）**：
```typescript
// 3. 创建 Layer（依赖的实现）
const loggerLayer = Layer.succeed(
  LoggerService,
  { log: (message) => Effect.sync(() => console.log(message)) }
)
```

**使用 Service**：
```typescript
// 4. 在 Effect 中使用
const program = Effect.gen(function* () {
  const logger = yield* LoggerService
  yield* logger.log("Hello")
})

// 5. 运行时需要提供 Layer
const runnable = Effect.provide(program, loggerLayer)
await Effect.runPromise(runnable)
```

### 5. 错误处理

**创建错误**：
```typescript
class NotFoundError extends Schema.TaggedErrorClass("NotFoundError")(
  "NotFoundError",
  { id: Schema.Number }
) {}

// 使用
yield* new NotFoundError({ id: 1 })
```

**捕获错误**：
```typescript
const safeProgram = program.pipe(
  Effect.catchTag("NotFoundError", (error) =>
    Effect.succeed({ id: error.id, name: "Unknown" })
  )
)
```

### 6. Effect.tryPromise（包装 Promise）

将不安全的 Promise 包装为类型安全的 Effect：

```typescript
const fetchData = (url: string) => Effect.tryPromise({
  try: () => fetch(url).then(r => r.json()),
  catch: (error) => new NetworkError({ cause: error })
})
```

## 学习路径

1. **理解 Effect 类型** — 明白 Effect 是"描述"不是"执行"
2. **掌握 Effect.gen** — 学会组合多个 Effect
3. **学会运行 Effect** — Effect.runPromise、Effect.runSync
4. **理解 Service/Layer** — 依赖注入和可测试性
5. **掌握错误处理** — 类型安全的错误捕获

## 相关文件

- `example.ts` — 可运行的示例程序
- OpenCode 源码对应：`packages/opencode/src/effect/`、`packages/opencode/src/agent/agent.ts`

## 扩展阅读

- [Effect 官方文档](https://effect.website/)
- OpenCode 源码中搜索 `Effect.gen`、`Context.Service`、`Layer.effect`
