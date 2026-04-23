/**
 * Effect 示例程序
 * 
 * 场景：模拟 OpenCode 的核心 Agent 调用链
 * 
 * 展示：
 * 1. Service 定义和 Layer（依赖注入）
 * 2. Effect.gen（组合多个 Effect）
 * 3. Effect.tryPromise（包装 API 调用）
 * 4. 错误处理（类型安全）
 * 5. Effect.runPromise（执行）
 * 
 * 运行：npx tsx example.ts
 */

import { Effect, Context, Layer, Console, pipe } from "effect"
import * as Schema from "@effect/schema/Schema"

// ============================================================================
// 1. 定义错误类型
// ============================================================================

/**
 * 配置错误
 * 
 * 在 OpenCode 中：当读取 ~/.config/opencode/config.json 失败时使用
 */
class ConfigError extends Schema.TaggedErrorClass("ConfigError")(
  "ConfigError",
  { message: Schema.String }
) {}

/**
 * LLM API 错误
 * 
 * 在 OpenCode 中：当调用 OpenAI/Anthropic 等 API 失败时使用
 */
class LLMError extends Schema.TaggedErrorClass("LLMError")(
  "LLMError",
  { message: Schema.String }
) {}

/**
 * 文件系统错误
 * 
 * 在 OpenCode 中：当读取/写入文件失败时使用
 */
class FileSystemError extends Schema.TaggedErrorClass("FileSystemError")(
  "FileSystemError",
  { path: Schema.String, message: Schema.String }
) {}

// ============================================================================
// 2. 定义 Service（接口 + Tag）
// ============================================================================

/**
 * Config Service
 * 
 * OpenCode 中的应用：管理 ~/.config/opencode/config.json 中的配置
 * 包括：默认模型、Agent 设置、权限规则等
 */
interface ConfigInterface {
  readonly get: (key: string) => Effect.Effect<string, ConfigError>
}

class ConfigService extends Context.Tag("Config")<ConfigService, ConfigInterface>() {}

/**
 * Logger Service
 * 
 * OpenCode 中的应用：统一日志管理，支持文件日志和终端输出
 * 包括：日志级别、日志文件轮转、结构化日志
 */
interface LoggerInterface {
  readonly info: (message: string) => Effect.Effect<void>
  readonly error: (message: string, error?: Error) => Effect.Effect<void>
}

class LoggerService extends Context.Tag("Logger")<LoggerService, LoggerInterface>() {}

/**
 * FileSystem Service
 * 
 * OpenCode 中的应用：文件系统操作（读取代码、写入文件、执行命令）
 * 使用 Effect 包装，确保错误处理和类型安全
 */
interface FileSystemInterface {
  readonly readFile: (path: string) => Effect.Effect<string, FileSystemError>
}

class FileSystemService extends Context.Tag("FileSystem")<FileSystemService, FileSystemInterface>() {}

/**
 * LLM Service
 * 
 * OpenCode 中的应用：调用 LLM API 生成回复
 * 支持：流式输出、多轮对话、Tool Calling
 */
interface LLMInterface {
  readonly generate: (prompt: string) => Effect.Effect<string, LLMError>
}

class LLMService extends Context.Tag("LLM")<LLMService, LLMInterface>() {}

// ============================================================================
// 3. 创建 Layer（提供实现）
// ============================================================================

/**
 * Config Layer
 * 
 * 模拟从配置文件读取
 */
const configLayer = Layer.succeed(
  ConfigService,
  {
    get: (key) =>
      Effect.gen(function* () {
        // 模拟配置读取
        const configs: Record<string, string> = {
          model: "gpt-4o-mini",
          language: "zh",
        }
        const value = configs[key]
        if (!value) {
          return yield* new ConfigError({ message: `Config key "${key}" not found` })
        }
        return value
      }),
  }
)

/**
 * Logger Layer
 * 
 * 模拟日志记录（实际项目中会写入文件）
 */
const loggerLayer = Layer.succeed(
  LoggerService,
  {
    info: (message) => Console.log(`[INFO] ${message}`),
    error: (message, error) =>
      Console.error(`[ERROR] ${message}${error ? `: ${error.message}` : ""}`),
  }
)

/**
 * FileSystem Layer
 * 
 * 模拟文件读取（实际项目使用 Bun.file 或 Node fs）
 */
const fileSystemLayer = Layer.succeed(
  FileSystemService,
  {
    readFile: (path) =>
      Effect.tryPromise({
        try: async () => {
          // 模拟异步文件读取
          await new Promise((resolve) => setTimeout(resolve, 100))
          if (path === "src/main.ts") {
            return `console.log("Hello World")`
          }
          throw new Error(`File not found: ${path}`)
        },
        catch: (error) =>
          new FileSystemError({
            path,
            message: error instanceof Error ? error.message : "Unknown error",
          }),
      }),
  }
)

/**
 * LLM Layer
 * 
 * 模拟 LLM API 调用（实际项目使用 ai SDK）
 */
const llmLayer = Layer.effect(
  LLMService,
  Effect.gen(function* () {
    // 依赖注入：LLM 服务需要 Config 和 Logger
    const config = yield* ConfigService
    const logger = yield* LoggerService

    return {
      generate: (prompt) =>
        Effect.gen(function* () {
          yield* logger.info(`Calling LLM with model: ${yield* config.get("model")}`)

          return yield* Effect.tryPromise({
            try: async () => {
              // 模拟 API 调用
              await new Promise((resolve) => setTimeout(resolve, 500))

              // 模拟随机失败（10% 概率）
              if (Math.random() < 0.1) {
                throw new Error("Rate limit exceeded")
              }

              return `AI Response: "${prompt}" - 这是一个模拟回复`
            },
            catch: (error) =>
              new LLMError({
                message: error instanceof Error ? error.message : "LLM call failed",
              }),
          })
        }),
    }
  })
)

// ============================================================================
// 4. 组合 Layer（定义依赖图）
// ============================================================================

/**
 * 组合所有 Layer
 * 
 * 这类似于 OpenCode 中的 Effect Layer 组装：
 * packages/opencode/src/project/bootstrap.ts
 */
const appLayer = Layer.mergeAll(
  configLayer,
  loggerLayer,
  fileSystemLayer,
  llmLayer
)

// ============================================================================
// 5. 核心程序（模拟 Agent 循环）
// ============================================================================

/**
 * 读取文件并发送给 LLM
 * 
 * 模拟 OpenCode 中的 "读取文件 → 发送给 AI" 流程
 */
const analyzeFile = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystemService
    const llm = yield* LLMService
    const logger = yield* LoggerService

    yield* logger.info(`Reading file: ${path}`)

    // 读取文件（可能失败：FileSystemError）
    const content = yield* fs.readFile(path)

    yield* logger.info(`File content length: ${content.length} chars`)

    // 发送给 LLM（可能失败：LLMError）
    const response = yield* llm.generate(
      `请分析这段代码：\n\n\`\`\`typescript\n${content}\n\`\`\``
    )

    return response
  })

/**
 * 带重试的分析
 * 
 * OpenCode 中的应用：LLM API 调用失败时自动重试
 * packages/opencode/src/session/retry.ts
 */
const analyzeFileWithRetry = (path: string) =>
  analyzeFile(path).pipe(
    // 如果失败，重试 3 次
    Effect.retry({ times: 3 }),
    // 如果还是失败，返回默认值
    Effect.orElse(() => Effect.succeed("分析失败，请稍后重试"))
  )

/**
 * 批量分析多个文件
 * 
 * OpenCode 中的应用：并行处理多个文件
 */
const analyzeMultipleFiles = (paths: string[]) =>
  Effect.all(paths.map(analyzeFileWithRetry), {
    concurrency: "unbounded", // 并行执行
  })

// ============================================================================
// 6. 运行程序
// ============================================================================

async function main() {
  console.log("=".repeat(60))
  console.log("Effect 示例：模拟 OpenCode Agent 调用链")
  console.log("=".repeat(60))

  // 场景 1：成功读取文件并分析
  console.log("\n📝 场景 1：分析单个文件\n")
  const result1 = await Effect.runPromise(
    Effect.provide(analyzeFile("src/main.ts"), appLayer)
  )
  console.log("\n结果:", result1)

  // 场景 2：文件不存在（错误处理）
  console.log("\n❌ 场景 2：文件不存在（展示错误处理）\n")
  const result2 = await Effect.runPromise(
    Effect.provide(
      analyzeFile("non-existent.ts").pipe(
        Effect.catchTag("FileSystemError", (error) =>
          Effect.succeed(`文件读取失败: ${error.path} - ${error.message}`)
        )
      ),
      appLayer
    )
  )
  console.log("结果:", result2)

  // 场景 3：并行分析多个文件
  console.log("\n🚀 场景 3：并行分析多个文件\n")
  const result3 = await Effect.runPromise(
    Effect.provide(
      analyzeMultipleFiles(["src/main.ts", "src/main.ts", "src/main.ts"]),
      appLayer
    )
  )
  console.log("\n结果数:", result3.length)

  console.log("\n" + "=".repeat(60))
  console.log("示例完成！")
  console.log("=".repeat(60))
}

main().catch(console.error)
