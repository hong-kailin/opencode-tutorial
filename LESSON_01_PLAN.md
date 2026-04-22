# 第一课：最小可运行 Agent 循环

## 1. 课程目标

实现一个**最小但完整**的 AI Agent CLI，能够：
1. 读取用户输入
2. 调用 LLM API
3. 流式接收响应
4. 输出到终端
5. 循环往复（多轮对话）

## 2. 设计原则

- **从零开始**：不依赖原项目代码，独立运行
- **最小依赖**：只用 Bun + ai SDK + Effect（核心三件套）
- **单文件优先**：先在一个文件里跑通，再拆分模块
- **循序渐进**：先跑起来，再讲原理

## 3. 技术选型

| 技术 | 用途 | 为什么选它 |
|------|------|-----------|
| **Bun** | 运行时 | 原项目使用，速度快，内置 TypeScript 支持 |
| **ai SDK** | LLM 调用 | 原项目使用，统一接口，支持流式 |
| **Effect** | 错误处理/流程控制 | 原项目核心框架，类型安全 |
| **@ai-sdk/openai** | OpenAI 兼容 API | 最常用，也兼容其他 OpenAI-compatible 服务 |

## 4. 项目结构

```
lesson-01/
├── package.json          # 最小依赖
├── .env.example          # 环境变量示例
├── src/
│   ├── index.ts         # 入口：读取输入、启动循环
│   ├── agent.ts         # Agent 循环：对话逻辑
│   └── llm.ts           # LLM 调用：封装 ai SDK
└── README.md            # 运行说明 + 源码对照
```

## 5. 核心代码设计

### 5.1 index.ts（入口）

```typescript
// 职责：
// 1. 读取环境变量（API Key）
// 2. 启动交互式输入循环
// 3. 调用 Agent 处理每条消息
// 4. 优雅退出（Ctrl+C）

import { Effect } from "effect"
import { runAgentLoop } from "./agent"

async function main() {
  console.log("🤖 最小 Agent 已启动（按 Ctrl+C 退出）\n")
  
  while (true) {
    const input = await prompt("> ")
    if (!input || input === "exit") break
    
    await Effect.runPromise(runAgentLoop(input))
  }
  
  console.log("\n👋 再见！")
}

main()
```

### 5.2 agent.ts（Agent 循环）

```typescript
// 职责：
// 1. 维护对话历史（内存中）
// 2. 组装消息（system + history + user input）
// 3. 调用 LLM
// 4. 流式输出响应
// 5. 更新历史

import { Effect } from "effect"
import { callLLM } from "./llm"

// 简单的内存历史
const history: Array<{ role: string; content: string }> = []

export const runAgentLoop = (input: string) => Effect.gen(function* () {
  // 1. 添加用户消息到历史
  history.push({ role: "user", content: input })
  
  // 2. 调用 LLM
  const response = yield* callLLM(history)
  
  // 3. 添加助手回复到历史
  history.push({ role: "assistant", content: response })
  
  // 4. 输出（流式过程中已经输出了，这里可选）
})
```

### 5.3 llm.ts（LLM 调用）

```typescript
// 职责：
// 1. 初始化 ai SDK provider
// 2. 流式调用 LLM
// 3. 实时输出 token
// 4. 返回完整响应

import { Effect } from "effect"
import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // 可选，用于兼容其他服务
})

export const callLLM = (messages: any[]) => Effect.gen(function* () {
  const model = openai("gpt-4o-mini") // 使用便宜模型
  
  const result = yield* Effect.tryPromise(() =>
    streamText({
      model,
      system: "你是一个有帮助的编程助手。",
      messages,
    })
  )
  
  let fullResponse = ""
  
  // 流式输出
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk)
    fullResponse += chunk
  }
  
  process.stdout.write("\n\n")
  
  return fullResponse
})
```

## 6. 涉及的知识点

### 6.1 必学（核心）

1. **Effect 基础**
   - `Effect.gen`：生成器语法，替代 async/await
   - `Effect.runPromise`：运行 Effect 并返回 Promise
   - `Effect.tryPromise`：将 Promise 包装为 Effect
   - 为什么用 Effect：类型安全、错误处理、可组合

2. **ai SDK 基础**
   - `createOpenAI`：创建提供商实例
   - `streamText`：流式文本生成
   - `textStream`：消费流式响应
   - 消息格式：`{ role: "user" | "assistant", content: string }`

3. **对话循环**
   - 维护历史记录
   - system prompt 的作用
   - 流式输出 vs 一次性输出

### 6.2 选学（进阶）

1. **环境变量管理**
   - `.env` 文件
   - `process.env` 读取

2. **Bun 特性**
   - 内置 TypeScript 支持
   - `bun run` 命令

## 7. 与原项目的对照

学完后，指引学员查看原项目对应代码，建立联系：

| 我们的实现 | 原项目对应 | 差异说明 |
|-----------|-----------|----------|
| `index.ts` 输入循环 | `src/cli/cmd/run.ts` handler | 原项目用 yargs，我们用简单 prompt |
| `agent.ts` 历史管理 | `src/session/session.ts` | 原项目用 SQLite 持久化，我们用内存 |
| `llm.ts` LLM 调用 | `src/provider/provider.ts` | 原项目支持多提供商，我们只支持 OpenAI |
| 流式输出 | `src/cli/cmd/run.ts` 渲染 | 原项目有更复杂的 UI 渲染 |

**核心问题**：
- 为什么原项目要把 Agent、Session、Provider 分成不同 Service？
- 为什么原项目用 Effect 的 Layer 系统而不是直接 import？
- 为什么原项目需要 SQLite 持久化？

## 8. 课程步骤

### Step 1：初始化项目（5 分钟）
1. 创建 `lesson-01/` 目录
2. 初始化 `package.json`
3. 安装依赖
4. 创建 `.env` 文件

### Step 2：实现 LLM 调用（15 分钟）
1. 编写 `src/llm.ts`
2. 测试单轮调用
3. 讲解 Effect 基础语法

### Step 3：实现 Agent 循环（15 分钟）
1. 编写 `src/agent.ts`
2. 添加历史记录
3. 测试多轮对话

### Step 4：实现入口（10 分钟）
1. 编写 `src/index.ts`
2. 添加交互式输入
3. 测试完整流程

### Step 5：源码对照（15 分钟）
1. 查看原项目 `src/cli/cmd/run.ts`
2. 查看原项目 `src/agent/agent.ts`
3. 查看原项目 `src/provider/provider.ts`
4. 讨论设计差异

## 9. 预期产出

运行效果：
```bash
$ cd lesson-01
$ bun run src/index.ts

🤖 最小 Agent 已启动（按 Ctrl+C 退出）

> 你好
你好！很高兴见到你。有什么我可以帮你的吗？

> 用 JavaScript 写个快排
当然！这是一个快速排序的实现：

function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x < pivot);
  const right = arr.slice(1).filter(x => x >= pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}

> exit
👋 再见！
```

## 10. 后续课程预告

- **第2课**：添加 Tool Use（让 Agent 能执行命令）
- **第3课**：添加 Session 持久化（SQLite + Drizzle）
- **第4课**：项目感知（读取文件系统）

---

**是否确认此课程设计？确认后我将开始实现。**
