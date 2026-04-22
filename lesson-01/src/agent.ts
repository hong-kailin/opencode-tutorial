/**
 * Agent 循环模块
 * 
 * 职责：
 * 1. 维护对话历史（内存中）
 * 2. 组装消息（system prompt + history + user input）
 * 3. 调用 LLM
 * 4. 更新历史记录
 * 
 * 对应原项目：packages/opencode/src/agent/agent.ts（简化版）
 */

import { Effect } from "effect"
import { callLLM } from "./llm.js"

/**
 * 对话历史
 * 
 * 注意：目前存在内存中，进程退出后丢失
 * 原项目使用 SQLite + Drizzle ORM 持久化到磁盘
 */
const history: Array<{ role: string; content: string }> = [
  // system prompt：设定 AI 的角色和行为
  {
    role: "system",
    content:
      "你是一个有帮助的编程助手。你可以回答编程问题、解释代码、帮助调试。请用中文回答。",
  },
]

/**
 * 运行一轮对话
 * 
 * 流程：
 * 1. 将用户输入加入历史
 * 2. 调用 LLM 获取回复
 * 3. 将助手回复加入历史
 * 
 * @param input - 用户输入的文本
 * @returns Effect，成功时完成一轮对话
 */
export const runAgentLoop = (input: string) =>
  Effect.gen(function* () {
    // 1. 添加用户消息到历史
    history.push({ role: "user", content: input })

    // 2. 调用 LLM（流式输出在 llm.ts 中处理）
    const response = yield* callLLM(history)

    // 3. 添加助手回复到历史
    history.push({ role: "assistant", content: response })

    // 可选：限制历史长度，防止上下文过长
    // 原项目有更复杂的 compaction 机制
    const MAX_HISTORY = 20
    if (history.length > MAX_HISTORY) {
      // 保留 system prompt 和最近的消息
      const systemMsg = history[0]
      const recentMsgs = history.slice(-(MAX_HISTORY - 1))
      history.length = 0
      history.push(systemMsg, ...recentMsgs)
    }
  })
