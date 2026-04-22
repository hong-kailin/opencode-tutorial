# OpenCode 项目总览

## 1. 项目定位

OpenCode 是一个开源的 **AI Coding Agent**（AI 编程助手），支持：
- **CLI 终端交互**（主入口）
- **Web 界面**（基于 SolidJS）
- **Desktop 桌面端**（Electron）
- **SDK 集成**（JS/TS 调用）

核心价值：通过自然语言与 AI 交互，让 AI 能够读取、编辑、执行代码，辅助开发者完成编程任务。

## 2. 技术栈总览

| 层级 | 技术 | 用途 |
|------|------|------|
| **运行时** | Bun 1.3.11 | 包管理、构建、运行 |
| **语言** | TypeScript 5.8 | 类型安全 |
| **类型检查** | tsgo (TypeScript Go) | 替代 tsc，更快 |
| **Monorepo** | Bun Workspaces + Turbo | 多包管理 |
| **核心框架** | Effect 4.0 (beta) | 函数式编程、错误处理、依赖注入 |
| **UI 框架** | SolidJS 1.9 + OpenTUI | 响应式 UI |
| **Web 服务端** | Hono 4.10 | API 路由 |
| **数据库** | SQLite + Drizzle ORM | 本地数据持久化 |
| **LLM 调用** | ai SDK (Vercel) | 统一调用多厂商 LLM |
| **部署** | SST 3.18 + AWS | 云部署 |
| **样式** | TailwindCSS 4.1 | CSS 工具 |
| **构建** | Vite 7.1 | 前端构建 |

## 3. 项目规模

- **18+ packages**（Monorepo）
- **核心代码**主要在 `packages/opencode/src/`（~50 个顶级目录）
- **多语言 README**（20+ 种语言）

## 4. 关键设计模式

### 4.1 Effect 服务架构
所有核心功能都封装为 Effect Service：
```typescript
export class Service extends Context.Service<Service, Interface>()("@opencode/Agent") {}
export const layer = Layer.effect(Service, Effect.gen(function* () { ... }))
```

### 4.2 模块自导出模式
每个模块文件底部使用命名空间自导出：
```typescript
export * as Agent from "./agent"
```
消费者使用：`import { Agent } from "@/agent/agent"`

### 4.3 InstanceState 模式
用于管理"每项目状态"（按目录隔离），自动清理：
```typescript
const state = yield* InstanceState.make<State>(Effect.fn(...))
```

### 4.4 Bus 事件系统
基于 Event Bus 的模块间通信，支持全局和实例级别事件。

### 4.5 工具注册表模式
所有工具统一注册到 `ToolRegistry`，通过 schema 定义参数和权限。

## 5. 入口点

| 入口 | 位置 | 说明 |
|------|------|------|
| CLI 主入口 | `packages/opencode/src/index.ts` | yargs 命令路由 |
| CLI 运行命令 | `packages/opencode/src/cli/cmd/run.ts` | 核心对话循环 |
| Web App | `packages/app/src/entry.tsx` | SolidJS 应用入口 |
| SDK Client | `packages/sdk/js/src/client.ts` | HTTP 客户端封装 |
| SDK Server | `packages/sdk/js/src/server.ts` | 子进程启动封装 |

## 6. 数据流概览

```
用户输入 → CLI (yargs) → RunCommand → Session → Agent → LLM API
                                      ↓
                                  Tool 调用 ←→ 文件系统/命令执行
                                      ↓
                                  结果 → Session 持久化 → SQLite
```

## 7. 核心模块速查

| 模块 | 职责 | 对应目录 |
|------|------|----------|
| **Agent** | AI Agent 配置、选择、生成 | `src/agent/` |
| **Tool** | 工具定义、注册、执行 | `src/tool/` |
| **Session** | 对话会话管理、持久化 | `src/session/` |
| **Project** | 项目发现、Git 集成 | `src/project/` |
| **Provider** | LLM 提供商管理 | `src/provider/` |
| **CLI** | 命令行界面、交互 | `src/cli/` |
| **Server** | Hono HTTP 服务 | `src/server/` |
| **Bus** | 事件总线 | `src/bus/` |
| **Config** | 配置管理 | `src/config/` |
| **Auth** | 认证授权 | `src/auth/` |

## 8. 代码风格（关键约定）

- **不使用 `export namespace`**，使用顶层导出 + 自导出
- **Effect.gen** 替代 async/await
- **Effect.fn** 用于命名/追踪函数
- **避免 try/catch**，使用 Effect 的错误处理
- **Bun APIs** 优先（`Bun.file()` 等）
- **snake_case** 数据库字段名
- **无 barrel index.ts**（多同级目录时）
