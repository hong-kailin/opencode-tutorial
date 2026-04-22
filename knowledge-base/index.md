# OpenCode 知识库索引

## 快速导航

| 文档 | 内容 | 适合场景 |
|------|------|----------|
| [00-overview](00-overview.md) | 项目定位、技术栈总览、设计模式 | 首次了解项目 |
| [01-architecture](01-architecture.md) | Monorepo 结构、模块依赖、数据流 | 理解整体架构 |
| [02a-opencode](02-core-modules/02a-opencode.md) | CLI 核心包详解 | 学习 Agent、Tool、Session |
| [02b-app](02-core-modules/02b-app.md) | Web UI 包详解 | 学习前端架构 |
| [02c-sdk](02-core-modules/02c-sdk.md) | SDK 包详解 | 学习 API 封装 |
| [02d-plugin](02-core-modules/02d-plugin.md) | 插件系统详解 | 学习扩展机制 |
| [02e-shared](02-core-modules/02e-shared.md) | 共享工具包 | 学习工具函数 |
| [03-tech-patterns](03-tech-patterns.md) | 关键技术落地模式 | 学习 Effect、AI SDK、Drizzle 等 |

## 课程对应关系

| 课程 | 涉及知识库内容 |
|------|---------------|
| **第1课：最小 Agent 循环** | 00-overview (Effect 基础), 02a-opencode (Agent 循环), 03-tech-patterns (Effect 模式、AI SDK) |
| **第2课：Tool Use** | 02a-opencode (Tool 系统), 03-tech-patterns (Schema 定义) |
| **第3课：状态管理** | 02a-opencode (Session), 03-tech-patterns (InstanceState) |
| **第4课：项目感知** | 02a-opencode (Project), 02e-shared (FileSystem) |
| **第5课：Web UI** | 02b-app (App 架构), 02c-sdk (Client) |

## 源码位置速查

| 功能 | 文件路径 |
|------|----------|
| CLI 入口 | `packages/opencode/src/index.ts` |
| 核心对话命令 | `packages/opencode/src/cli/cmd/run.ts` |
| Agent 定义 | `packages/opencode/src/agent/agent.ts` |
| 工具注册表 | `packages/opencode/src/tool/registry.ts` |
| 工具基础类型 | `packages/opencode/src/tool/tool.ts` |
| 会话管理 | `packages/opencode/src/session/session.ts` |
| 项目管理 | `packages/opencode/src/project/project.ts` |
| LLM 提供商 | `packages/opencode/src/provider/provider.ts` |
| HTTP 服务 | `packages/opencode/src/server/server.ts` |
| Effect 扩展 | `packages/opencode/src/effect/` |
| Web 入口 | `packages/app/src/entry.tsx` |
| SDK 客户端 | `packages/sdk/js/src/client.ts` |
| SDK 服务器 | `packages/sdk/js/src/server.ts` |
| 插件接口 | `packages/plugin/src/index.ts` |
| 共享文件系统 | `packages/shared/src/filesystem.ts` |

## 技术栈速查

| 技术 | 版本 | 用途 | 关键文件 |
|------|------|------|----------|
| Bun | 1.3.11 | 运行时 | `package.json` |
| TypeScript | 5.8 | 语言 | `tsconfig.json` |
| Effect | 4.0-beta | 核心框架 | `src/effect/`, 各处 Service |
| SolidJS | 1.9 | UI | `packages/app/src/` |
| Hono | 4.10 | HTTP | `src/server/` |
| Drizzle ORM | 1.0-beta | 数据库 | `src/**/*.sql.ts` |
| ai SDK | 6.0 | LLM 调用 | `src/provider/` |
| Vite | 7.1 | 构建 | `packages/app/vite.config.ts` |
| TailwindCSS | 4.1 | 样式 | `packages/app/src/index.css` |

## 开发命令速查

```bash
# 根目录
bun dev              # CLI dev 模式
bun dev:web          # Web dev 模式
bun typecheck        # 类型检查
bun lint             # 代码检查

# packages/opencode
bun run dev          # 启动 CLI
bun run typecheck    # 类型检查
bun test             # 测试
bun run db           # 数据库操作

# packages/app
bun dev              # 启动 Web（需配合后端）
bun run build        # 构建
```

## 常用缩写

| 缩写 | 全称 | 含义 |
|------|------|------|
| TUI | Terminal User Interface | 终端用户界面 |
| CLI | Command Line Interface | 命令行界面 |
| SDK | Software Development Kit | 软件开发工具包 |
| LLM | Large Language Model | 大语言模型 |
| API | Application Programming Interface | 应用程序接口 |
| ORM | Object-Relational Mapping | 对象关系映射 |
| SSE | Server-Sent Events | 服务器发送事件 |
| MCP | Model Context Protocol | 模型上下文协议 |
| LSP | Language Server Protocol | 语言服务器协议 |
| ALS | AsyncLocalStorage | 异步本地存储 |
| PTY | Pseudo Terminal | 伪终端 |
| VCS | Version Control System | 版本控制系统 |
