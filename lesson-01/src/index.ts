/**
 * 入口文件
 * 
 * 职责：
 * 1. 加载环境变量
 * 2. 读取用户输入（交互式）
 * 3. 调用 Agent 处理每条消息
 * 4. 优雅退出
 * 
 * 对应原项目：packages/opencode/src/index.ts（简化版）
 * 原项目使用 yargs 解析命令行参数，我们用简单的 prompt
 */

import "dotenv/config"

// 关闭 AI SDK 兼容性警告（智谱 AI 使用 v1 规范，ai SDK 自动降级到 v2 兼容模式）
// @ts-ignore
globalThis.AI_SDK_LOG_WARNINGS = false

import { Effect } from "effect"
import { runAgentLoop } from "./agent.js"

// 简单的 prompt 函数
function prompt(question: string): Promise<string | null> {
  return new Promise((resolve) => {
    process.stdout.write(question)
    process.stdin.once("data", (data) => {
      const input = data.toString().trim()
      resolve(input || null)
    })
  })
}

async function main() {
  console.log("🤖 最小 Agent 已启动（输入 'exit' 或按 Ctrl+C 退出）\n")
  console.log('💡 提示：你可以问编程问题，比如"如何用 JavaScript 写快排？"\n')

  try {
    while (true) {
      const input = await prompt("> ")

      // 退出条件
      if (!input || input === "exit" || input === "quit") {
        break
      }

      // 运行 Agent 循环（Effect 包装）
      await Effect.runPromise(runAgentLoop(input))
    }
  } catch (error) {
    console.error("\n❌ 发生错误:", error)
    process.exit(1)
  }

  console.log("\n👋 再见！")
  process.exit(0)
}

// 启动
main()
