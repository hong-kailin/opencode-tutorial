/**
 * LLM 调用模块
 * 
 * 职责：
 * 1. 初始化 ai SDK provider（OpenAI）
 * 2. 流式调用 LLM
 * 3. 实时输出 token 到终端
 * 4. 返回完整响应文本
 * 
 * 对应原项目：packages/opencode/src/provider/provider.ts
 */

import { Effect } from "effect"
import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"

// 从环境变量读取配置
const apiKey = process.env.OPENAI_API_KEY
const baseURL = process.env.OPENAI_BASE_URL

if (!apiKey) {
  console.error("❌ 请设置 OPENAI_API_KEY 环境变量")
  console.error("   cp .env.example .env")
  console.error("   然后编辑 .env 填入你的 API Key")
  process.exit(1)
}

// 创建 OpenAI provider
// 通过 baseURL 可以兼容其他 OpenAI-compatible 服务（如 OpenRouter、SiliconFlow）
const openai = createOpenAI({
  apiKey,
  baseURL,
})

/**
 * 调用 LLM 生成回复
 * 
 * @param messages - 对话历史（包含 system、user、assistant 消息）
 * @returns Effect，成功时返回完整响应文本
 */
export const callLLM = (messages: Array<{ role: string; content: string }>) =>
  Effect.gen(function* () {
    // 使用 gpt-4o-mini 模型（便宜且速度快）
    const model = openai("gpt-4o-mini")

    // streamText：流式生成文本
    // 注意：streamText 是同步返回 StreamTextResult 的
    const result = streamText({
      model: model as any,
      messages: messages as any,
    })

    let fullResponse = ""

    // 使用 Effect.promise 处理异步迭代
    yield* Effect.promise(async () => {
      // textStream 是异步迭代器，每次 yield 一个 token
      for await (const chunk of result.textStream) {
        process.stdout.write(chunk)
        fullResponse += chunk
      }
      // 输出完响应后换行
      process.stdout.write("\n\n")
    })

    return fullResponse
  })
