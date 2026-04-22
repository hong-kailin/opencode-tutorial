# OpenCode 源码学习项目

> 🎓 循序渐进学习 OpenCode —— 一个开源 AI Coding Agent

## 项目简介

本项目通过**构建知识库 + 实战课程**的方式，带你逐步深入理解 [OpenCode](https://github.com/anomalyco/opencode) 的完整源码。

**核心理念**：学习开源的最高效方式不是读代码，而是跟着写一遍。

## 目录结构

```
opencode-tutorial/
├── opencode/                    # 📦 OpenCode 源码（子仓库）
│   ├── packages/
│   │   ├── opencode/           # CLI 核心引擎
│   │   ├── app/                # Web UI（SolidJS）
│   │   ├── sdk/js/             # JS/TS SDK
│   │   ├── plugin/             # 插件系统
│   │   ├── shared/             # 共享工具库
│   │   └── ...                 # 其他模块
│   └── ...
│
├── knowledge-base/              # 📚 知识库（给 AI 用的参考资料）
│   ├── 00-overview.md          # 项目总览、技术栈
│   ├── 01-architecture.md      # 架构设计、模块依赖
│   ├── 02-core-modules/        # 核心模块详解
│   │   ├── 02a-opencode.md    # CLI 核心
│   │   ├── 02b-app.md         # Web UI
│   │   ├── 02c-sdk.md         # SDK
│   │   ├── 02d-plugin.md      # 插件系统
│   │   └── 02e-shared.md      # 共享工具
│   ├── 03-tech-patterns.md     # 关键技术落地模式
│   └── index.md                # 索引与速查
│
├── lesson-01/                   # 🎓 第一课：最小 Agent 循环
│   ├── src/
│   │   ├── index.ts           # 入口：交互式输入
│   │   ├── agent.ts           # Agent 循环
│   │   └── llm.ts             # LLM 调用
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
│
├── LEARNING_PLAN.md            # 📋 学习方案总设计
└── README.md                   # 📖 本文件
```

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **运行时** | Node.js / Bun | TypeScript 执行 |
| **核心框架** | Effect | 函数式编程、错误处理 |
| **LLM 调用** | ai SDK | 多厂商统一接口 |
| **UI 框架** | SolidJS | 响应式前端 |
| **Web 服务** | Hono | HTTP API |
| **数据库** | SQLite + Drizzle | 本地持久化 |
| **构建** | Vite / tsx | 开发构建 |

## 课程大纲

| 课次 | 主题 | 核心产出 | 涉及源码 |
|------|------|----------|----------|
| **第1课** | 最小 Agent 循环 | 可对话的 CLI | `packages/opencode/src/agent/` |
| 第2课 | Tool Use | Agent 执行命令 | `packages/opencode/src/tool/` |
| 第3课 | 状态与上下文 | 多轮对话持久化 | `packages/opencode/src/session/` |
| 第4课 | 项目感知 | 文件系统索引 | `packages/opencode/src/project/` |
| 第5课 | UI 基础 | 简单 Web 界面 | `packages/app/src/` |
| ... | 后续根据学习情况定制 | - | - |

## 快速开始

### 1. 准备环境

- Node.js ≥ 18（推荐 22）
- 一个 OpenAI API Key（或兼容 OpenAI 的服务）

### 2. 运行第一课

```bash
# 进入课程目录
cd lesson-01

# 安装依赖
npm install

# 配置 API Key
cp .env.example .env
# 编辑 .env 填入 OPENAI_API_KEY

# 运行
npm start
```

### 3. 体验效果

```bash
🤖 最小 Agent 已启动（输入 'exit' 或按 Ctrl+C 退出）

> 你好
你好！很高兴见到你...

> 用 JavaScript 写个快排
function quickSort(arr) {
  // ...
}

> exit
👋 再见！
```

## 知识库使用指南

知识库不是给人类阅读的完整文档，而是**给 AI 助手用的参考资料**，用于：

1. **理解架构**：快速定位模块职责
2. **设计课程**：基于真实代码结构规划学习路径
3. **回答疑问**：解释特定技术选择的原因

### 推荐阅读顺序

```
1. knowledge-base/00-overview.md        # 了解项目全貌
2. knowledge-base/01-architecture.md    # 理解模块关系
3. knowledge-base/02-core-modules/      # 深入学习核心包
4. knowledge-base/03-tech-patterns.md   # 掌握关键技术
```

## 学习方法

### 每课三步走

1. **跟着做**：从零写出可运行代码，不要复制粘贴
2. **对比看**：查看原项目对应源码，理解差异
3. **思考问**：回答课程中的思考题，不懂就问

### 原项目源码速查

| 我们的实现 | 原项目对应位置 |
|-----------|---------------|
| `lesson-01/src/index.ts` | `packages/opencode/src/cli/cmd/run.ts` |
| `lesson-01/src/agent.ts` | `packages/opencode/src/agent/agent.ts` |
| `lesson-01/src/llm.ts` | `packages/opencode/src/provider/provider.ts` |

## 扩展练习

完成课程后，可以尝试：

1. **切换模型**：在 `llm.ts` 中改用 `gpt-4o` 或其他模型
2. **修改人设**：在 `agent.ts` 中修改 system prompt
3. **保存对话**：将历史记录导出为 JSON
4. **添加快捷键**：支持 `Ctrl+C` 优雅退出
5. **添加日志**：记录每次对话到文件

## 常见问题

### Q: 没有 OpenAI API Key 怎么办？

可以使用其他 OpenAI-compatible 服务：
- [OpenRouter](https://openrouter.ai/)（免费额度）
- [SiliconFlow](https://siliconflow.cn/)（国内可用）
- 本地部署 Ollama

修改 `.env`：
```bash
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://api.openrouter.ai/api/v1
```

### Q: 为什么用 Effect 而不是 async/await？

OpenCode 核心团队选择 Effect 是因为：
- 类型安全的错误处理
- 强大的依赖注入和可测试性
- 自动的 OpenTelemetry 追踪
- 可组合性更强

课程从简单场景开始，逐步引入 Effect 的高级特性。

### Q: 如何调试原项目？

```bash
cd opencode/packages/opencode

# 开发模式
bun run dev

# 带参数运行
bun run dev -- run "hello world"

# 启动服务器
bun run dev -- serve --port 4096

# 类型检查
bun run typecheck
```

## 贡献

欢迎提交 Issue 或 PR：
- 发现课程内容有误
- 想添加新的课程
- 改进知识库文档

## 许可证

MIT

---

> 💡 **提示**：学习过程中有任何问题，随时向 AI 助手提问。它可以通过知识库快速定位相关源码并给出解答。
