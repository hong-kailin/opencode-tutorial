# 第一课：最小可运行 Agent 循环

## 运行步骤

### 1. 安装依赖

```bash
cd lesson-01
bun install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入你的 OpenAI API Key
```

### 3. 运行

```bash
bun run start
```

## 项目结构

```
src/
├── index.ts    # 入口：读取用户输入，启动循环
├── agent.ts    # Agent 循环：维护历史，调用 LLM
└── llm.ts      # LLM 调用：封装 ai SDK
```

## 核心知识点

### 1. Effect 基础

- `Effect.gen`：使用生成器语法组合异步操作
- `Effect.runPromise`：将 Effect 转为 Promise 执行
- `Effect.tryPromise`：安全地将 Promise 包装为 Effect

### 2. ai SDK 基础

- `createOpenAI`：创建 OpenAI provider
- `streamText`：流式生成文本
- `textStream`：异步迭代器，逐 token 接收响应

### 3. 对话循环

- 维护 `messages` 数组作为对话历史
- system prompt 设定 AI 角色
- 流式输出提升用户体验

## 与原项目的对照

| 我们的实现 | 原项目对应 | 差异 |
|-----------|-----------|------|
| `index.ts` | `packages/opencode/src/cli/cmd/run.ts` | 原项目用 yargs 解析命令，我们直接用 prompt |
| `agent.ts` | `packages/opencode/src/agent/agent.ts` | 原项目支持多 Agent 切换，我们只有单 Agent |
| `llm.ts` | `packages/opencode/src/provider/provider.ts` | 原项目支持多 LLM 提供商，我们只支持 OpenAI |
| 内存历史 | `packages/opencode/src/session/session.ts` | 原项目用 SQLite 持久化，我们用内存 |

**思考题**：
1. 为什么原项目要把功能拆分成多个 Service？
2. 如果对话历史很长，会有什么问题？原项目怎么解决的？
3. 为什么原项目用 Effect 的 Layer 系统，而不是直接 import 函数？

## 扩展练习

1. **切换模型**：修改 `llm.ts` 中的模型名称（如 `gpt-4o`）
2. **添加 system prompt**：修改 `agent.ts` 中的 system 内容
3. **保存对话**：将历史记录保存到 JSON 文件
4. **支持多轮上下文限制**：当历史太长时，只保留最近 N 条

## 下一课预告

**第2课：Tool Use**
- 让 Agent 能够调用外部工具（如执行命令、读取文件）
- 学习 ai SDK 的 `tools` 参数
- 理解 Tool Schema 定义
