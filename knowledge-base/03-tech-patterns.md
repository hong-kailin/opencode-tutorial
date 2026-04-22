# 关键技术在 OpenCode 中的落地模式

## 1. Effect 框架

### 1.1 为什么用 Effect？

OpenCode 选择 Effect 作为核心框架，因为：
- **类型安全的错误处理**：不用 try/catch，错误在类型中显式声明
- **依赖注入**：通过 Layer 和 Context 管理复杂依赖关系
- **可组合性**：Effect 可以像函数一样组合、map、flatMap
- **可追踪性**：自动的 OpenTelemetry 追踪
- **并发控制**：Fiber、Scope、Semaphore 等原语

### 1.2 核心模式

**Service 定义三件套**：
```typescript
// 1. 接口
export interface Interface {
  readonly method: () => Effect.Effect<Result, Error, Dependencies>
}

// 2. Service Tag
export class Service extends Context.Service<Service, Interface>()("<scope>/Name") {}

// 3. Layer 实现
export const layer = Layer.effect(Service, Effect.gen(function* () {
  const dep = yield* Other.Service
  return { method: () => Effect.succeed(result) }
}))
```

**使用 Service**：
```typescript
// 方式1：在 Effect.gen 中 yield*
const result = yield* Service.use((svc) => svc.method())

// 方式2：直接 yield*（如果 method 返回 Effect）
const result = yield* SomeService.method()
```

**组合多个 Effect**：
```typescript
const program = Effect.gen(function* () {
  const a = yield* effectA
  const b = yield* effectB
  const c = yield* effectC
  return { a, b, c }
})

// 并行执行
const parallel = Effect.all([effectA, effectB, effectC], { concurrency: "unbounded" })
```

### 1.3 错误处理

**不用 try/catch**：
```typescript
// ❌ 不推荐
try {
  const result = riskyOperation()
} catch (e) {
  handleError(e)
}

// ✅ 推荐
const result = yield* Effect.try({
  try: () => riskyOperation(),
  catch: (error) => new MyError({ cause: error })
})

// 或
const result = yield* Effect.tryPromise({
  try: () => fetchData(),
  catch: (error) => new NetworkError({ cause: error })
})
```

**Schema 定义错误**：
```typescript
export class MyError extends Schema.TaggedErrorClass("MyError")("MyError", {
  message: Schema.String,
  code: Schema.Number,
}) {}

// 使用
yield* new MyError({ message: "fail", code: 500 })
```

### 1.4 实例状态管理 (InstanceState)

**场景**：每个打开的项目目录需要独立的状态

**实现** (src/effect/instance-state.ts)：
```typescript
const state = yield* InstanceState.make<State>(
  Effect.fn("Service.state")(function* (_ctx) {
    // 初始化状态
    const data = yield* loadData()
    
    // 注册清理逻辑
    yield* Effect.addFinalizer(() => Effect.sync(() => cleanup()))
    
    return { data }
  })
)
```

**特性**：
- 按目录键控缓存
- 自动生命周期管理（Scope）
- 并发安全（多个调用者共享同一实例）

### 1.5 运行时封装 (makeRuntime)

**目的**：为每个服务创建独立的 Effect 运行时

**实现** (src/effect/run-service.ts)：
```typescript
const runtime = makeRuntime(Layer.mergeAll(
  Layer.succeed(Config.Service, config),
  Layer.succeed(Logger, logger),
  // ...
))

// 使用
runtime.runPromise(effect)
runtime.runFork(effect)
```

## 2. AI SDK (Vercel)

### 2.1 统一 LLM 调用

使用 `ai` SDK 统一调用不同厂商的 LLM：

```typescript
import { generateObject, streamObject } from "ai"

// 生成结构化对象
const result = yield* Effect.tryPromise(() =>
  generateObject({
    model: providerModel,
    schema: z.object({ ... }),
    prompt: "..."
  })
)

// 流式生成
const stream = yield* Effect.tryPromise(() =>
  streamObject({
    model: providerModel,
    schema: z.object({ ... }),
    messages: history,
    tools: availableTools,
  })
)

// 消费流
for await (const chunk of stream.partialObjectStream) {
  // 处理增量数据
}
```

### 2.2 多提供商支持

**动态加载提供商 SDK**：
```typescript
const BUNDLED_PROVIDERS: Record<string, () => Promise<... > = {
  "@ai-sdk/anthropic": () => import("@ai-sdk/anthropic").then(m => m.createAnthropic),
  "@ai-sdk/openai": () => import("@ai-sdk/openai").then(m => m.createOpenAI),
  // ...
}
```

**Provider 服务**：
```typescript
// 根据 providerID 创建对应的 SDK 实例
const sdk = yield* loadProviderSDK(providerID)
const model = sdk.languageModel(modelID)
```

### 2.3 Tool Calling

**定义工具**：
```typescript
const tools = {
  read_file: {
    description: "Read a file",
    parameters: z.object({ path: z.string() }),
    execute: async ({ path }) => {
      return await fs.readFile(path, "utf-8")
    }
  }
}
```

**流式调用**：
```typescript
const result = streamObject({
  model,
  tools,
  // AI 会自动决定何时调用工具
})
```

## 3. Drizzle ORM

### 3.1 Schema 定义

**命名约定**：snake_case

```typescript
// src/session/session.sql.ts
export const SessionTable = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  title: text().notNull(),
  time_created: integer().notNull(),
  time_updated: integer().notNull(),
})
```

### 3.2 查询

```typescript
import { eq, and, desc } from "drizzle-orm"

// 查询
const rows = yield* Effect.tryPromise(() =>
  db.select().from(SessionTable)
    .where(eq(SessionTable.project_id, projectID))
    .orderBy(desc(SessionTable.time_created))
)

// 插入
yield* Effect.tryPromise(() =>
  db.insert(SessionTable).values({ id, project_id, title })
)
```

### 3.3 迁移

```bash
# 生成迁移
bun run db generate --name add_user_table

# 输出
migration/
└── <timestamp>_add_user_table/
    ├── migration.sql
    └── snapshot.json
```

## 4. Hono HTTP 服务

### 4.1 路由定义

```typescript
import { Hono } from "hono"

const app = new Hono()

app.get("/v1/session", async (c) => {
  const sessions = await getSessions()
  return c.json({ data: sessions })
})

app.post("/v1/session", async (c) => {
  const body = await c.req.json()
  const session = await createSession(body)
  return c.json({ data: session })
})
```

### 4.2 OpenAPI 生成

使用 `hono-openapi` 自动生成 OpenAPI Schema：

```typescript
import { openAPISpecs } from "hono-openapi"

app.get("/openapi", openAPISpecs(app, {
  documentation: { ... }
}))
```

### 4.3 适配器

**Bun**：
```typescript
// src/server/adapter.bun.ts
export default {
  fetch: app.fetch,
  port: 4096,
}
```

**Node**：
```typescript
// src/server/adapter.node.ts
import { serve } from "@hono/node-server"
serve({ fetch: app.fetch, port: 4096 })
```

## 5. SolidJS 响应式

### 5.1 Store vs Signal

**推荐 Store**（AGENTS.md 规定）：
```typescript
// ✅ 推荐
const [state, setState] = createStore({
  count: 0,
  items: [],
  user: { name: "", age: 0 }
})

// 修改
setState("count", c => c + 1)
setState("user", "name", "John")

// ❌ 避免多个 Signal
const [count, setCount] = createSignal(0)
const [items, setItems] = createSignal([])
```

### 5.2 响应式模式

```typescript
// 计算属性
const doubled = createMemo(() => state.count * 2)

// 副作用
createEffect(() => {
  console.log("count changed:", state.count)
})

// 资源加载
const data = createResource(fetcher, (source) => loadData(source))
```

## 6. 事件总线 (Bus)

### 6.1 定义事件

```typescript
// src/bus/bus-event.ts
export const MyEvent = BusEvent.define("my.event", z.object({
  id: z.string(),
  data: z.any()
}))
```

### 6.2 发布订阅

```typescript
// 订阅
yield* Bus.Service.use((bus) =>
  bus.subscribe(MyEvent, (payload) => {
    console.log("received:", payload)
  })
)

// 发布
yield* Bus.Service.use((bus) =>
  bus.publish(MyEvent, { id: "123", data: {} })
)
```

### 6.3 全局事件

```typescript
// 全局总线（跨实例）
GlobalBus.publish(MyEvent, payload)

// 实例总线（按目录隔离）
Bus.Service.use((bus) => bus.publish(MyEvent, payload))
```

## 7. 配置系统

### 7.1 配置结构

```typescript
// src/config/config.ts
interface Config {
  default_agent?: string
  model?: string
  share?: "auto" | "manual" | "disabled"
  permission?: Permission.Config
  agent?: Record<string, Agent.Config>
}
```

### 7.2 加载顺序

1. 默认配置
2. 全局配置（`~/.config/opencode/config.json`）
3. 项目配置（`.opencode/config.json`）
4. 环境变量
5. 命令行参数

### 7.3 使用

```typescript
const config = yield* Config.Service
const cfg = yield* config.get()
console.log(cfg.default_agent)
```

## 8. 文件系统抽象

### 8.1 平台适配

**Bun**：
```typescript
import { BunFileSystem } from "@effect/platform-node"
```

**Node**：
```typescript
import { NodeFileSystem } from "@effect/platform-node"
```

### 8.2 使用

```typescript
const fs = yield* FileSystem.FileSystem
const content = yield* fs.readFile("path", "utf8")
const exists = yield* fs.exists("path")
```

## 9. 关键设计决策

### 9.1 为什么不用 barrel exports？

```typescript
// ❌ 避免
// src/foo/index.ts
export * from "./a"
export * from "./b"

// ✅ 推荐
// src/foo/a.ts
export * as FooA from "./a"
// src/foo/b.ts
export * as FooB from "./b"

// 消费者
import { FooA } from "@/foo/a"
import { FooB } from "@/foo/b"
```

**原因**：避免强制加载所有模块，支持 tree-shaking。

### 9.2 为什么不用 async/await？

```typescript
// ❌ 避免
async function fetchData() {
  const result = await api.call()
  return result
}

// ✅ 推荐
const fetchData = Effect.gen(function* () {
  const result = yield* Effect.tryPromise(() => api.call())
  return result
})
```

**原因**：Effect 提供更好的错误处理、可追踪性、可组合性。

### 9.3 为什么 snake_case 数据库字段？

```typescript
// ✅ 推荐
const table = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  created_at: integer().notNull(),
})

// ❌ 避免
const table = sqliteTable("session", {
  id: text("id").primaryKey(),
  projectID: text("project_id").notNull(),
})
```

**原因**：减少重复定义列名字符串。

## 10. 性能优化模式

### 10.1 Effect.cached

缓存重复计算：
```typescript
const expensive = Effect.cached(Effect.gen(function* () {
  yield* Effect.sleep("1 second")
  return 42
}))

// 多次调用只执行一次
const a = yield* expensive
const b = yield* expensive
```

### 10.2 虚拟滚动

长列表使用 `virtua`：
```typescript
import { VirtualList } from "virtua"

<VirtualList data={messages}>
  {(item) => <MessageItem message={item} />}
</VirtualList>
```

### 10.3 增量渲染

流式响应增量更新：
```typescript
createEffect(() => {
  const chunk = streamChunk()
  setState("content", (prev) => prev + chunk)
})
```
