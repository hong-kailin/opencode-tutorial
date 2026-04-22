# Core Package: packages/opencode

## 1. 定位

整个 OpenCode 的**核心引擎**，包含：
- CLI 命令入口
- Agent 循环逻辑
- Tool 执行系统
- Session 管理
- LLM Provider 管理
- 本地 HTTP 服务器
- 项目感知与文件系统操作

## 2. 目录结构

```
src/
├── index.ts              # CLI 入口（yargs 路由）
├── cli/                  # 命令行界面
│   ├── cmd/              # 各命令实现
│   │   ├── run.ts        # ⭐ 核心对话命令
│   │   ├── serve.ts      # 启动 HTTP 服务
│   │   ├── agent.ts      # Agent 管理
│   │   └── ...           # 其他命令
│   ├── ui.ts             # 终端 UI 渲染
│   └── bootstrap.ts      # CLI 启动初始化
├── agent/                # Agent 管理
│   └── agent.ts          # Agent 配置、选择、生成
├── tool/                 # 工具系统
│   ├── tool.ts           # 工具基础类型
│   ├── registry.ts       # 工具注册表
│   ├── bash.ts           # 执行 shell 命令
│   ├── read.ts           # 读取文件
│   ├── write.ts          # 写入文件
│   ├── edit.ts           # 编辑文件
│   ├── grep.ts           # 文本搜索
│   ├── glob.ts           # 文件匹配
│   └── *.txt             # 工具提示词模板
├── session/              # 会话管理
│   ├── session.ts        # 会话 CRUD
│   ├── message-v2.ts     # 消息模型（V2）
│   └── session.sql.ts    # 数据库表定义
├── project/              # 项目管理
│   ├── project.ts        # 项目 CRUD
│   ├── bootstrap.ts      # 实例启动初始化
│   └── instance.ts       # 实例管理
├── provider/             # LLM 提供商
│   └── provider.ts       # 提供商管理、模型调用
├── server/               # HTTP 服务
│   └── server.ts         # Hono 路由
├── bus/                  # 事件总线
├── config/               # 配置管理
├── storage/              # 数据存储（SQLite）
├── effect/               # Effect 框架扩展
└── util/                 # 工具函数
```

## 3. 核心模块详解

### 3.1 CLI 入口 (src/index.ts)

**职责**：命令行参数解析、全局初始化、错误处理

**关键逻辑**：
1. 使用 `yargs` 解析命令行参数
2. 初始化日志系统 (`Log.init`)
3. 数据库迁移（首次运行时）
4. 注册所有子命令
5. 全局错误捕获（unhandledRejection / uncaughtException）

**注册的命令**：
- `run` - 运行对话（最常用）
- `serve` - 启动 HTTP 服务
- `agent` - Agent 管理
- `session` - 会话管理
- `models` - 模型管理
- `mcp` - MCP 协议
- ... 共 20+ 命令

### 3.2 RunCommand (src/cli/cmd/run.ts)

**职责**：处理 `opencode run` 命令，核心对话循环

**流程**：
1. 解析参数（message, model, agent, session 等）
2. 创建/恢复 Session
3. 初始化 SDK Client
4. 发送消息到服务器
5. 处理流式响应
6. 渲染 Tool 调用结果
7. 保存会话

**关键参数**：
- `--continue / -c` - 继续上次会话
- `--session / -s` - 指定会话 ID
- `--model / -m` - 指定模型
- `--agent` - 指定 Agent
- `--file / -f` - 附加文件
- `--attach` - 连接到远程服务器

### 3.3 Agent (src/agent/agent.ts)

**职责**：管理 AI Agent 的定义、配置、权限

**核心类型**：
```typescript
interface Info {
  name: string
  description?: string
  mode: "subagent" | "primary" | "all"
  permission: Permission.Ruleset
  model?: { modelID: ModelID; providerID: ProviderID }
  prompt?: string
  temperature?: number
}
```

**内置 Agents**：
| Agent | 模式 | 说明 |
|-------|------|------|
| **build** | primary | 默认 Agent，执行工具 |
| **plan** | primary | 计划模式，禁用编辑工具 |
| **general** | subagent | 通用研究 Agent |
| **explore** | subagent | 代码库探索 Agent |
| **compaction** | primary | 会话压缩（隐藏） |
| **title** | primary | 生成标题（隐藏） |
| **summary** | primary | 生成摘要（隐藏） |

**权限系统**：
- 基于规则的权限控制（allow/deny/ask）
- 支持通配符匹配
- 默认规则 + 用户配置合并

### 3.4 Tool 系统 (src/tool/)

**职责**：定义、注册、执行 AI 可调用的工具

**核心类型** (src/tool/tool.ts)：
```typescript
interface Def<Parameters extends z.ZodType, M extends Metadata> {
  id: string
  description: string
  parameters: Parameters
  execute(args: z.infer<Parameters>, ctx: Context): Effect.Effect<ExecuteResult<M>>
}
```

**内置工具列表**：
| 工具 | ID | 功能 |
|------|-----|------|
| BashTool | bash | 执行 shell 命令 |
| ReadTool | read | 读取文件内容 |
| WriteTool | write | 写入文件 |
| EditTool | edit | 编辑文件 |
| GlobTool | glob | 文件模式匹配 |
| GrepTool | grep | 文本搜索 |
| TaskTool | task | 创建子任务 |
| TodoWriteTool | todowrite | 管理待办 |
| WebFetchTool | webfetch | 获取网页 |
| WebSearchTool | websearch | 网页搜索 |
| CodeSearchTool | codesearch | 代码搜索 |
| SkillTool | skill | 技能调用 |
| QuestionTool | question | 向用户提问 |
| PlanExitTool | plan_exit | 退出计划模式 |

**注册流程**：
1. `ToolRegistry` 收集所有内置工具
2. 插件可注册自定义工具
3. 根据 Agent 权限过滤可用工具
4. 组装为 LLM 可用的 schema

### 3.5 Session (src/session/session.ts)

**职责**：会话生命周期管理、消息持久化

**核心类型**：
```typescript
interface Info {
  id: SessionID
  slug: string
  projectID: ProjectID
  directory: string
  title: string
  version: string
  summary?: { additions, deletions, files, diffs }
  time: { created, updated, compacting?, archived? }
}
```

**关键操作**：
- `create` - 创建会话
- `fork` - 分叉会话
- `get` / `list` - 查询
- `messages` - 获取消息历史
- `append` - 追加消息
- `share` - 分享会话

**数据库**：SQLite (Drizzle ORM)，表包括 session、part、message 等

### 3.6 Project (src/project/)

**职责**：项目发现、工作区管理、Git 集成

**核心类型** (src/project/project.ts)：
```typescript
interface Info {
  id: ProjectID
  worktree: string        # 工作区路径
  vcs?: "git"
  name?: string
  icon?: { url?, override?, color? }
  commands?: { start? }
  time: { created, updated, initialized? }
  sandboxes: string[]
}
```

**Instance 管理** (src/project/instance.ts)：
- 每个打开的目录对应一个 Instance
- 包含目录、项目 ID、工作区信息
- 通过 AsyncLocalStorage 传递上下文

**启动流程** (src/project/bootstrap.ts)：
1. 加载配置
2. 初始化插件
3. fork 初始化各服务（LSP、FileWatcher、Vcs 等）
4. 订阅命令执行事件

### 3.7 Provider (src/provider/provider.ts)

**职责**：管理 LLM 提供商、创建模型实例、调用 API

**支持的提供商**（部分）：
- OpenAI / Azure
- Anthropic
- Google / Vertex
- Groq
- Mistral
- Cohere
- Together AI
- Perplexity
- 本地模型（Ollama 等）

**核心方法**：
```typescript
interface Interface {
  readonly model: (input: { providerID; modelID }) => Effect.Effect<LanguageModelV3>
  readonly models: () => Effect.Effect<ModelInfo[]>
  readonly parseModel: (input: string) => { providerID; modelID }
}
```

**调用链**：
```
Agent 选择模型 → Provider.model() → ai SDK → LLM API
```

### 3.8 Server (src/server/)

**职责**：提供 HTTP API 供 Web UI 和 SDK 调用

**框架**：Hono

**关键路由**：
- `/v1/session` - 会话管理
- `/v1/message` - 消息操作
- `/v1/tool` - 工具调用
- `/v1/config` - 配置获取
- `/v1/provider` - 提供商信息
- WebSocket - 流式响应

**适配器**：
- `adapter.bun.ts` - Bun 运行时
- `adapter.node.ts` - Node 运行时

## 4. 核心数据流

### 4.1 一次对话的完整流程

```
1. 用户输入：opencode run "帮我写个函数"
   ↓
2. CLI 解析 → RunCommand.handler()
   ↓
3. 创建/恢复 Session（SQLite 查询）
   ↓
4. 组装消息（用户输入 + 附件）
   ↓
5. 选择 Agent（默认 build）
   ↓
6. 获取可用 Tools（根据 Agent 权限过滤）
   ↓
7. 调用 LLM（ai SDK streamObject）
   ↓
8. 流式接收响应
   ├─ 文本内容 → 实时输出到终端
   └─ Tool 调用 → 执行 Tool → 结果返回 LLM
   ↓
9. 保存消息到 SQLite
   ↓
10. 输出最终结果
```

### 4.2 服务初始化流程

```
CLI 启动
  ↓
加载配置 (Config)
  ↓
初始化插件 (Plugin)
  ↓
创建 Effect Layer（组装所有 Service）
  ↓
InstanceState.make（按目录隔离）
  ↓
各 Service init()（非阻塞 forkDetach）
  ├─ LSP
  ├─ FileWatcher
  ├─ Vcs
  └─ Snapshot
  ↓
进入命令处理
```

## 5. 关键技术细节

### 5.1 Effect Service 定义模式

```typescript
// 1. 定义接口
export interface Interface {
  readonly method: () => Effect.Effect<Result>
}

// 2. 创建 Service
export class Service extends Context.Service<Service, Interface>()("<scope>/Name") {}

// 3. 创建 Layer
export const layer = Layer.effect(Service, Effect.gen(function* () {
  // 依赖注入
  const dep = yield* Other.Service
  
  return {
    method: Effect.fn("Name.method")(function* () {
      // 实现
    })
  }
}))

// 4. 使用
yield* Service.use((svc) => svc.method())
// 或
const result = yield* SomeService.method()
```

### 5.2 工具定义模式

```typescript
export const MyTool = Tool.define(
  "my_tool",
  {
    description: "工具描述",
    parameters: z.object({
      path: z.string().describe("文件路径")
    }),
    execute: (args, ctx) => Effect.gen(function* () {
      // 执行逻辑
      return {
        title: "操作标题",
        metadata: { ... },
        output: "结果文本"
      }
    })
  }
)
```

### 5.3 消息流处理

使用 `ai` SDK 的 `streamObject` 进行流式调用：
```typescript
const result = yield* Effect.tryPromise(() =>
  streamObject({
    model,
    system: agentPrompt,
    messages: history,
    tools: availableTools,
    // ...
  })
)

// 消费流
for await (const chunk of result.partialObjectStream) {
  // 实时输出
}
```

## 6. 与外部包的交互

| 本包模块 | 调用外部包 | 用途 |
|----------|-----------|------|
| `src/tool/` | `@opencode-ai/plugin` | 加载插件工具 |
| `src/cli/cmd/run.ts` | `@opencode-ai/sdk/v2` | HTTP 客户端 |
| `src/project/` | `@opencode-ai/shared` | 文件系统工具 |
| `src/server/` | `packages/app` | 为 Web UI 提供 API |

## 7. 调试与开发

```bash
# 启动 CLI 开发模式
cd packages/opencode
bun run dev

# 带参数运行
bun run dev -- run "hello"

# 启动服务器
bun run dev -- serve --port 4096

# 数据库操作
bun run db generate --name <migration>
```

**关键日志**：
- 日志文件位置：`~/.local/share/opencode/log/`
- 使用 `--print-logs` 输出到 stderr
- 使用 `--log-level=DEBUG` 查看详细日志
