# Core Package: packages/sdk/js (SDK)

## 1. 定位

OpenCode 的 **JavaScript/TypeScript SDK**，封装 HTTP API 调用，供：
- Web UI (`packages/app`) 使用
- 外部应用集成
- 插件开发

## 2. 目录结构

```
src/
├── index.ts         # SDK 主入口
├── client.ts        # HTTP 客户端封装
├── server.ts        # 本地服务器启动封装
├── process.ts       # 进程管理工具
└── gen/             # 自动生成的 API 代码
    ├── client/      # 生成的 HTTP 客户端
    ├── types.gen.ts # 生成的类型
    └── sdk.gen.ts   # SDK 包装类
```

## 3. 核心 API

### 3.1 createOpencode (index.ts)

**一键启动**：同时创建服务器和客户端

```typescript
const { client, server } = await createOpencode({
  hostname: "127.0.0.1",
  port: 4096,
  timeout: 5000,
})
```

### 3.2 createOpencodeClient (client.ts)

**HTTP 客户端**：基于生成的 API 客户端

**关键特性**：
- 自动处理 `directory` 参数（通过 header 或 query）
- 自定义 fetch（禁用超时）
- 请求拦截器

```typescript
const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
  directory: "/path/to/project",  // 自动编码到 header
})

// 使用
await client.session.create({ title: "hello" })
await client.message.send({ sessionID, content })
```

**directory 传递机制**：
```
1. 设置 header: x-opencode-directory=<encoded_path>
2. 请求拦截器自动将 GET 请求的 directory 转移到 query 参数
3. 非 GET 请求保持 header 方式
```

### 3.3 createOpencodeServer (server.ts)

**服务器启动**：通过子进程启动 opencode CLI

```typescript
const server = await createOpencodeServer({
  hostname: "127.0.0.1",
  port: 4096,
  timeout: 5000,  # 启动超时
})

// 使用完后关闭
server.close()
```

**实现细节**：
1. 使用 `cross-spawn` 启动 `opencode serve` 子进程
2. 监听 stdout 解析服务器地址
3. 支持 AbortSignal 取消启动
4. 自动处理进程退出和错误

**输出解析**：
```
监听 stdout 中的 "opencode server listening on http://..."
提取 URL 后 resolve Promise
```

### 3.4 createOpencodeTui (server.ts)

**启动 TUI（终端 UI）**：

```typescript
const tui = createOpencodeTui({
  project: "my-project",
  model: "openai/gpt-4",
  session: "session-id",
})

// stdio 继承自父进程，用户直接交互
// 关闭时发送信号终止进程
```

## 4. 自动生成的代码 (gen/)

SDK 的 API 类型和客户端是**自动生成**的：

- 来源：OpenAPI Schema（由 Hono + hono-openapi 生成）
- 工具：OpenAPI Generator 或类似工具
- 输出：TypeScript 类型 + HTTP 客户端代码

**重新生成**：
```bash
./packages/sdk/js/script/build.ts
```

## 5. 使用示例

### 5.1 基础使用

```typescript
import { createOpencode } from "@opencode-ai/sdk"

async function main() {
  const { client, server } = await createOpencode()
  
  // 创建会话
  const session = await client.session.create({ title: "Test" })
  
  // 发送消息
  await client.message.send({
    sessionID: session.data.id,
    content: "Hello!"
  })
  
  // 关闭
  server.close()
}
```

### 5.2 连接到现有服务器

```typescript
import { createOpencodeClient } from "@opencode-ai/sdk"

const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
  directory: "/home/user/project"
})

const sessions = await client.session.list()
```

### 5.3 在插件中使用

```typescript
import { createOpencodeClient } from "@opencode-ai/sdk"

export default definePlugin({
  async setup() {
    const client = createOpencodeClient()
    // 调用 API...
  }
})
```

## 6. 与 Core 的关系

```
SDK Client
  ↓ HTTP
Hono Server (packages/opencode/src/server/)
  ↓ Effect Service 调用
Core Logic
```

**版本同步**：
- SDK 版本与 Core 版本一致（1.14.20）
- API 变更时需要重新生成 SDK 代码

## 7. 错误处理

- HTTP 错误：由生成的客户端抛出异常
- 连接错误：网络超时、服务器未启动
- 解析错误：响应格式不匹配

## 8. 进程管理 (process.ts)

**工具函数**：
- `stop(proc)` - 安全终止进程
- `bindAbort(proc, signal, callback)` - 绑定取消信号

**使用场景**：
- 启动超时时终止子进程
- 用户取消操作时清理
- 应用退出时关闭服务器
