# Core Package: packages/plugin (Plugin System)

## 1. 定位

OpenCode 的 **插件系统 SDK**，定义插件接口和类型，供外部开发者扩展功能。

## 2. 技术栈

| 技术 | 用途 |
|------|------|
| Effect | 类型安全的服务定义 |
| Zod | 参数校验和类型定义 |
| @opentui/core/solid | UI 扩展（可选） |

## 3. 目录结构

```
src/
├── index.ts         # 主入口：插件定义和加载
├── tool.ts          # 工具插件接口
└── tui.ts           # TUI 插件接口
```

## 4. 核心概念

### 4.1 插件定义

```typescript
// src/index.ts
export interface PluginDefinition {
  name: string
  version: string
  setup: (context: PluginContext) => Effect.Effect<void>
}
```

### 4.2 工具插件 (tool.ts)

允许插件注册自定义工具：

```typescript
export interface ToolDefinition {
  id: string
  description: string
  parameters: z.ZodType
  execute: (args: any, ctx: ToolContext) => Effect.Effect<ToolResult>
}

export interface ToolContext {
  sessionID: string
  messageID: string
  agent: string
  abort: AbortSignal
  // ...
}
```

### 4.3 TUI 插件 (tui.ts)

允许插件扩展终端 UI：

```typescript
export interface TuiExtension {
  // 自定义渲染组件
  // 键盘快捷键
  // 状态面板
}
```

## 5. 插件加载机制

### 5.1 发现方式

1. **本地插件**：`~/.config/opencode/plugins/` 目录
2. **npm 包**：以 `opencode-plugin-*` 命名的包
3. **配置指定**：在配置文件中显式声明

### 5.2 加载流程

```
Core 启动
  ↓
扫描插件目录
  ↓
加载每个插件的入口文件
  ↓
调用 plugin.setup(context)
  ↓
注册工具 / UI 扩展
  ↓
合并到 ToolRegistry
```

### 5.3 初始化顺序

```typescript
// packages/opencode/src/project/bootstrap.ts
yield* Plugin.Service.use((svc) => svc.init())
// 插件初始化在 Config 之后，其他服务之前
// 因为插件可以修改配置
```

## 6. 权限控制

插件注册的工具受 Agent 权限系统约束：
- 默认继承 Agent 的权限规则
- 用户可在配置中覆盖
- 危险操作（如 bash）需要显式授权

## 7. 示例插件

```typescript
// opencode-plugin-hello/index.ts
import { definePlugin } from "@opencode-ai/plugin"
import { z } from "zod"

export default definePlugin({
  name: "hello",
  version: "1.0.0",
  setup(context) {
    context.registerTool({
      id: "hello",
      description: "Say hello to someone",
      parameters: z.object({
        name: z.string().describe("Name to greet")
      }),
      execute: async (args) => ({
        title: "Greeting",
        metadata: {},
        output: `Hello, ${args.name}!`
      })
    })
  }
})
```

## 8. 与 Core 的交互

```
Plugin (外部 npm 包 / 本地目录)
  ↓ 调用 SDK API
@opencode-ai/sdk
  ↓ HTTP
Core Server
  ↓
ToolRegistry 注册工具
```

**依赖关系**：
- `packages/opencode` 依赖 `@opencode-ai/plugin`
- `@opencode-ai/plugin` 依赖 `@opencode-ai/sdk`

## 9. 开发插件

```bash
# 创建插件目录
mkdir opencode-plugin-myplugin
cd opencode-plugin-myplugin

# 初始化
npm init -y
npm install @opencode-ai/plugin effect zod

# 编写代码...

# 本地测试
npm link
# 在 opencode 配置中启用
```

## 10. 注意事项

- 插件在**沙箱外**运行，拥有完整的 Node.js 权限
- 恶意插件可能访问文件系统、网络
- 建议只安装可信来源的插件
- 使用 `--pure` 标志禁用所有外部插件
