# Core Package: packages/app (Web UI)

## 1. 定位

OpenCode 的 **Web 用户界面**，基于 SolidJS + Vite 构建。

支持两种运行模式：
- **独立模式**：直接连接后端服务器
- **嵌入模式**：作为桌面端 UI

## 2. 技术栈

| 技术 | 用途 |
|------|------|
| SolidJS 1.9 | 响应式 UI 框架 |
| Vite 7.1 | 构建工具 |
| TailwindCSS 4.1 | 样式 |
| @solidjs/router | 路由 |
| @solidjs/start | SSR/元框架 |
| @tanstack/solid-query | 数据获取 |
| @kobalte/core | UI 组件基座 |
| @opentui/core/solid | OpenCode 自定义 UI 组件 |
| Effect | 状态管理和副作用 |
| marked | Markdown 渲染 |
| shiki | 代码高亮 |
| ghostty-web | 终端模拟器 |

## 3. 目录结构

```
src/
├── entry.tsx           # 应用入口（渲染根组件）
├── app.tsx             # 根组件（路由、主题、平台适配）
├── index.css           # 全局样式
├── pages/              # 页面组件
│   ├── home.tsx        # 首页
│   ├── session.tsx     # 会话页面
│   └── ...
├── components/         # 通用组件
│   ├── chat/           # 聊天相关
│   ├── editor/         # 编辑器相关
│   └── ...
├── context/            # Context Providers
│   ├── platform.tsx    # 平台信息（web/desktop）
│   ├── server.tsx      # 服务器连接
│   └── command.tsx     # 命令上下文
├── hooks/              # 自定义 Hooks
├── utils/              # 工具函数
├── i18n/               # 国际化
│   ├── en.ts
│   └── zh.ts
└── addons/             # 插件/扩展
```

## 4. 核心架构

### 4.1 入口 (entry.tsx)

**职责**：
1. 检测平台类型（web / desktop）
2. 确定服务器地址（localStorage 或默认值）
3. 渲染 `<AppBaseProviders>` 包裹的应用

**平台检测**：
- Web：通过 `window.__OPENCODE_PLATFORM__` 或默认
- Desktop：Electron 注入的平台对象

### 4.2 根组件 (app.tsx)

**职责**：
- 设置路由（@solidjs/router）
- 主题管理（明暗模式）
- 平台适配（键盘快捷键、通知等）
- 全局状态初始化

**关键 Providers**：
- `PlatformProvider` - 平台能力注入
- `ServerConnection` - API 客户端
- `AppBaseProviders` - 基础 providers 组合

### 4.3 页面路由

```
/                     → 首页/会话列表
/session/:id          → 具体会话
/settings             → 设置
/...                  → 其他页面
```

### 4.4 数据获取

使用 `@tanstack/solid-query`（TanStack Query Solid 适配）：

```typescript
// 获取会话列表
const sessions = createQuery(() => ({
  queryKey: ["sessions"],
  queryFn: () => api.session.list()
}))

// 获取消息
const messages = createQuery(() => ({
  queryKey: ["messages", sessionID],
  queryFn: () => api.session.messages({ sessionID })
}))
```

### 4.5 与后端通信

**API 客户端**：使用 `@opencode-ai/sdk`

**连接方式**：
1. 直接 HTTP REST API
2. WebSocket（流式响应）

**服务器发现**：
- 默认连接 `https://app.opencode.ai`
- 本地开发连接 `http://localhost:4096`
- 通过 `localStorage` 保存用户选择

## 5. 关键组件

### 5.1 聊天界面

```
ChatContainer
├── ChatHeader          # 会话标题、工具栏
├── MessageList         # 消息列表（虚拟滚动）
│   ├── UserMessage     # 用户消息
│   └── AssistantMessage # AI 消息
│       ├── TextPart    # 文本内容
│       ├── ToolCall    # 工具调用
│       └── Thinking    # 思考过程
├── ChatInput           # 输入框
└── ToolStatus          # 工具执行状态
```

### 5.2 虚拟滚动

使用 `virtua` 库实现消息列表虚拟滚动，处理长会话的性能问题。

### 5.3 代码高亮

使用 `shiki` + `marked-shiki` 实现：
- Markdown 渲染
- 代码块语法高亮
- 行号显示
- 复制按钮

### 5.4 终端模拟器

使用 `ghostty-web` 在浏览器中模拟终端，用于：
- 显示命令执行输出
- 交互式终端会话

## 6. 状态管理

### 6.1 全局状态

使用 SolidJS `createStore`（非多个 createSignal）：

```typescript
// 推荐写法（AGENTS.md 规定）
const [state, setState] = createStore({
  sessions: [],
  currentSession: null,
  settings: { ... }
})
```

### 6.2 服务端状态

使用 TanStack Query 管理：
- 自动缓存
- 后台刷新
- 乐观更新

### 6.3 本地状态

组件级别使用 `createSignal` / `createMemo`。

## 7. 样式系统

### 7.1 TailwindCSS

使用 TailwindCSS v4 的工具类：
```html
<div class="flex items-center gap-2 p-4 bg-surface rounded-lg">
```

### 7.2 主题

支持明暗模式切换：
- CSS 变量定义颜色
- `prefers-color-scheme` 媒体查询
- 手动切换保存到 localStorage

### 7.3 自定义组件库

`@opentui/core` 和 `@opentui/solid` 提供：
- 按钮、输入框、对话框等基础组件
- 符合 OpenCode 设计语言的样式

## 8. 与 Core 包的交互

```
App (浏览器)
  ↓ HTTP / WebSocket
Server (Hono in packages/opencode)
  ↓ Effect Service 调用
Core Logic (Agent, Tool, Session)
```

**关键 API**：
- `POST /v1/session` - 创建会话
- `GET /v1/session/:id/messages` - 获取消息
- `POST /v1/message` - 发送消息
- `GET /v1/session/stream` - 流式响应（SSE/WebSocket）

## 9. 开发模式

```bash
# 开发后端（packages/opencode）
bun run --conditions=browser ./src/index.ts serve --port 4096

# 开发前端（packages/app）
bun dev -- --port 4444

# 打开 http://localhost:4444
```

**注意**：
- `opencode dev web` 代理生产环境，不适合本地 UI 开发
- 必须分开启动后端和前端才能看到 UI 修改

## 10. 构建输出

```bash
bun run build  # vite build
```

输出到 `dist/` 目录，包含：
- 静态资源（JS, CSS, 图片）
- `index.html` - 入口页面

部署方式：
- 静态托管（CDN）
- 嵌入 Electron（桌面端）
