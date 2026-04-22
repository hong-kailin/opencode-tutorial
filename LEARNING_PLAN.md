# OpenCode 源码学习方案

> 目标：循序渐进学习 OpenCode 完整源码
> 当前阶段：方案设计（待审核）

---

## 一、项目背景

**OpenCode** 是一个开源的 AI Coding Agent（AI 编程助手），支持 CLI、Web、Desktop 多端。

- **仓库规模**：18+ packages，Monorepo 架构
- **核心技术栈**：Bun + TypeScript + Effect + SolidJS + Hono + Drizzle + SST
- **源码位置**：`./opencode/`

---

## 二、Phase 1：知识库构建方案

### 2.1 输出位置

```
./knowledge-base/           # 与源码分离，方便多 session 读取
├── 00-overview.md         # 项目定位与技术栈总览
├── 01-architecture.md     # Monorepo 架构与模块依赖图
├── 02-core-modules/       # 核心模块详解
│   ├── 02a-opencode.md   # CLI 核心 Agent 包
│   ├── 02b-app.md        # Web UI 包
│   ├── 02c-sdk.md        # SDK 包
│   ├── 02d-plugin.md     # 插件系统
│   └── 02e-shared.md     # 共享工具包
├── 03-tech-patterns.md    # 关键技术在项目中如何落地
└── index.md               # 总索引
```

### 2.2 扫描策略

1. **广度扫描**（1-2 轮）
   - 读取所有 `package.json`，建立模块依赖图
   - 扫描目录结构，识别核心入口文件
   - 读取关键配置（`tsconfig.json`、`turbo.json`、`sst.config.ts`）

2. **深度扫描**（按优先级）
   - **最高优先级**：`packages/opencode/src/` —— CLI Agent 核心
   - **高优先级**：`packages/sdk/js/src/` —— SDK 接口
   - **中优先级**：`packages/app/src/` —— Web UI
   - **低优先级**：其他 packages（按需补充）

3. **提炼方式**
   - 每个模块记录：职责、入口、核心类/函数、数据流、对外接口
   - 关键技术记录：在项目中出现的典型用法（非文档式教程）
   - 使用 Mermaid 绘制依赖图和架构图

### 2.3 知识库风格

- **精简版**：只记录服务课程设计的核心信息
- 避免罗列所有 API，聚焦"这个模块做什么"和"怎么与其他模块协作"
- 代码示例只保留最关键片段（< 20 行）

---

## 三、Phase 2：课程设计方案

### 3.1 设计原则

1. **渐进式**：从最小可运行单元开始，逐步叠加复杂度
2. **产出导向**：每课结束都有可运行的代码
3. **源码映射**：每课结束后，指明对应原项目源码位置，建立联系

### 3.2 课程大纲（暂定，逐课释放）

| 课次 | 主题 | 产出 | 涉及源码 |
|------|------|------|----------|
| **第1课** | 最小 Agent 循环 | 一个能对话的 CLI | `packages/opencode/src/agent/` |
| **第2课** | Tool Use 基础 | Agent 能执行命令 | `packages/opencode/src/tool/` |
| **第3课** | 状态与上下文 | 多轮对话 + 持久化 | `packages/opencode/src/session/` |
| **第4课** | 项目感知 | 读取文件系统 | `packages/opencode/src/project/` |
| **第5课** | UI 基础 | 简单 Web 界面 | `packages/app/src/` |
| ... | 后续课程根据学习情况定制 | - | - |

### 3.3 第一课详细设计

**目标**：实现一个最小的可运行 AI Agent CLI

**核心知识点**：
1. Effect 基础（`Effect.gen`, `Effect.runPromise`）
2. LLM API 调用（使用 `ai` SDK）
3. 最基本的 Agent 循环：输入 → LLM → 输出 → 循环

**不涉及的**（留给后续课程）：
- Tool/Function Calling
- 状态持久化
- 多模态
- 复杂 UI

**产出结构**：
```
./lesson-01/
├── package.json          # 最小依赖：bun + ai + effect + zod
├── src/
│   ├── index.ts         # 入口：读取用户输入
│   ├── agent.ts         # Agent 循环核心
│   └── llm.ts           # LLM 调用封装
└── README.md            # 运行说明 + 源码对照
```

**与原项目关联**：
- 运行后，会指引学员查看 `packages/opencode/src/agent/` 中的对应实现
- 对比最小实现与原项目的差异，理解原项目为什么要那么设计

---

## 四、执行计划

### Step 1：构建知识库（预计 2-3 轮交互）
- 扫描并生成 `00-overview.md`
- 扫描并生成 `01-architecture.md`
- 扫描核心模块，生成 `02-core-modules/`

### Step 2：设计第一课（预计 1 轮交互）
- 基于知识库，细化第一课大纲
- 确定具体代码结构和知识点

### Step 3：实现第一课（预计 2-3 轮交互）
- 初始化 `lesson-01/` 项目
- 编写核心代码
- 测试运行 + 编写 README

---

## 五、待您确认

请审核以上方案，确认或调整以下内容：

1. **知识库结构**是否符合预期？
2. **课程大纲**的进度安排是否合理？
3. **第一课设计**的难度和范围是否合适？
4. 是否有其他特殊需求（如指定先学习的模块、希望侧重前端/后端等）？

**审核通过后，我将按此方案严格执行。**
