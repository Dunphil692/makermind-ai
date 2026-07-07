---
name: makermind-task-generator
description: MakerMind AI 任务生成器维护 skill。当用户提到任务生成器、项目课生成、对话式 brief、三段式生成、/api/dialogue-task-brief、/api/generate-instruction-part、/api/health、Worker API 未连通或 Failed to fetch 时使用。用于排查和改进 MakerMind 生成器，必须保留纯 HTML/CSS/JS + Cloudflare Workers 架构。
---

# MakerMind Task Generator — 任务生成器维护 Skill

## 定位

你是 MakerMind AI 的 **任务生成器维护助手**。

你的目标是帮助 Rita 维护“教师和 AI 对话收集需求 → 分段生成 STEAM 项目方案 → 渲染成课堂项目”的核心生成器。你不是后台数据管理员，也不是前端框架迁移助手。

始终围绕这条主线工作：

```text
教师对话输入
  ↓
/api/dialogue-task-brief 收集 brief
  ↓
/api/generate-instruction-part 分 overview / build / practice 三段生成
  ↓
mergeParts() 合并
  ↓
renderInstruction() 渲染完整项目课方案
```

---

## 触发条件

当用户表达以下意图时使用本 skill：

### 任务生成器问题

- “任务生成器坏了”
- “生成项目失败”
- “AI 项目课生成失败”
- “帮我改生成器 prompt”
- “生成出来的项目质量不好”
- “项目课生成逻辑要优化”
- “对话式备课 / 和 AI 一起备课”

### Worker / API 排查

- “Worker API 未连通”
- “Failed to fetch”
- “NetworkError”
- “Load failed”
- “/api/health”
- “/api/dialogue-task-brief”
- “/api/generate-instruction-part”
- “本地预览不能生成”
- “Cloudflare 部署后不能生成”

### 生成架构维护

- “三段式生成”
- “overview / build / practice”
- “mergeParts”
- “renderInstruction”
- “草稿恢复 / 分段重试 / fallback”
- “学生兴趣、硬件材料、学习知识点”

不要用于：

- SparkMinds 后台数据管理：用 `sparkminds-admin`。
- SparkMinds 老师教学数据操作：用 `sparkminds-teacher`。
- 上传、下载、同步服务器 skill 包：用 `sparkminds-skills`。
- 飞书、Obsidian 或其他外部系统操作。

---

## 必须遵守的架构边界

### 不要改技术栈

MakerMind AI 任务生成器必须继续保持：

- 前端：纯 HTML / CSS / JavaScript。
- 后端：Cloudflare Workers。
- 静态资源：Worker assets 绑定 `public/`。
- 不引入 React、Vue、Hono、TypeScript 或新的前后端框架，除非 Rita 明确要求。

### 不要破坏生成流程

不要把生成器改回“一次请求生成完整项目”。必须保留：

1. `public/generator.js` 使用对话式 brief 收集需求。
2. `/api/dialogue-task-brief` 只收集三类信息：
   - 学生兴趣
   - 硬件 / 材料
   - 学习知识点
3. 完整项目继续通过 `/api/generate-instruction-part` 分三段生成：
   - `overview`
   - `build`
   - `practice`
4. 前端继续通过 `mergeParts()` 合并三段结果。
5. 前端继续通过现有 `renderInstruction()` 渲染完整项目。
6. 不要替换 `renderInstruction()`，除非 Rita 明确要求。

### 不要恢复旧接口为主流程

以下旧路径只应保留兼容提示，不要重新作为主生成接口：

- `/api/generate-projects`
- `/api/generate-instruction`

主流程只使用：

- `POST /api/dialogue-task-brief`
- `POST /api/generate-instruction-part`

### AI provider 配置规则

AI 调用必须继续使用 OpenAI-compatible 配置：

- `AI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL`

不要把旧 README 里的 `DEEPSEEK_API_KEY` 当成唯一配置名。
不要把 API key 写进前端、README 示例真实值、提交记录或 skill 包。

---

## 关键文件

优先查看这些文件：

| 文件 | 用途 |
|---|---|
| `public/generator.js` | 核心任务生成器前端：对话 brief、分段生成、草稿、错误提示、渲染 |
| `src/index.js` | Worker 路由：`/api/health`、`/api/dialogue-task-brief`、`/api/generate-instruction-part` |
| `src/ai.js` | AI 生成逻辑、prompt、retry、fallback、环境变量检查 |
| `src/utils.js` | 静态资源服务、JSON 响应、CORS 等工具 |
| `wrangler.jsonc` | Cloudflare Worker、assets、D1 绑定配置 |
| `README.md` | 本地开发、环境变量、故障排查说明 |

修改前先读相关文件，复用已有函数，不要重复造新流程。

---

## 前端工作规则

在 `public/generator.js` 中，优先复用这些函数：

- `requestDialogueTurn()`：调用 `/api/dialogue-task-brief`。
- `normalizeClientBrief()` / `createEmptyBrief()`：统一 brief 结构。
- `applyBriefToLegacyInputs()`：把 brief 回填到旧表单。
- `renderBriefStatus()`：显示 brief 收集状态。
- `seedDialogueFromFields()` / `syncBriefFromAdvancedFields()`：表单与 brief 同步。
- `getGenerationCacheKey()` / `loadGenerationDraft()` / `saveGenerationDraft()` / `clearGenerationDraft()`：分段草稿恢复。
- `requestPart()`：调用 `/api/generate-instruction-part`。
- `mergeParts()`：合并三段结果。
- `renderInstruction()`：渲染完整 instruction。
- `renderDegradedNotice()`：提示 fallback 分段。
- `formatFetchError()` / `renderError()`：统一错误诊断。

允许小范围改进：

- 错误提示更清楚。
- 增加 `/api/health` 检查入口。
- 改善分段重试和草稿提示。
- 优化 prompt 输入、brief 状态展示、字段校验。

禁止默认做：

- 删除分段草稿机制。
- 删除前端分段重试。
- 把三段生成改成一次生成。
- 用新组件体系重写页面。
- 在前端直接调用 AI provider。

---

## 后端工作规则

在 `src/index.js` 中保留这些路由职责：

- `GET /api/health`：诊断 Worker、bindings 和 AI 环境变量是否存在。
- `POST /api/dialogue-task-brief`：只负责收集 brief。
- `POST /api/generate-instruction-part`：按 `part` 生成三段之一。

在 `src/ai.js` 中优先复用这些函数：

- `handleDialogueTaskBrief()`
- `handleGenerateInstructionPart()`
- `normalizePartName()`
- `buildPartPrompt()`
- `buildOverviewPrompt()`
- `buildBuildPrompt()`
- `buildPracticePrompt()`
- `fallbackInstructionPart()`
- `mockInstructionPart()`
- `checkEnv()`
- `generateParsedPartWithRetry()`
- `normalizeDialogueMessages()`
- `buildDialogueBriefPrompt()`

修改 prompt 或 JSON 字段时，要同时确认前端 `mergeParts()` 和 `renderInstruction()` 仍能消费这些字段。

---

## Failed to fetch / Worker API 未连通排查流程

遇到截图里类似问题时，按顺序判断，不要直接改代码。

### 第 1 步：打开同源 `/api/health`

让用户打开当前页面同一个域名下的：

```text
/api/health
```

例如当前页面是：

```text
https://makermind.cloud/generator.html
```

就打开：

```text
https://makermind.cloud/api/health
```

### 第 2 步：看 `/api/health` 返回什么

| 返回结果 | 含义 | 处理 |
|---|---|---|
| JSON，且 `ok: true` | Worker API 同源可用 | 继续看 AI 配置和生成接口 |
| HTML 页面 | 当前打开的是静态站点或错误预览，不是 Worker 同源服务 | 改用 Worker 地址 / 正确部署域名 |
| 404 | 当前域名没有绑定 Worker API | 检查 Cloudflare 路由和部署 |
| JSON 里 `ai.hasApiKey` 为 false | 缺 `AI_API_KEY` | 在 Cloudflare 配置 Secret |
| JSON 里 `ai.hasBaseUrl` 为 false | 缺 `AI_BASE_URL` | 在 Cloudflare 配置变量 |
| JSON 里 `ai.hasModel` 为 false | 缺 `AI_MODEL` | 在 Cloudflare 配置变量 |
| JSON 正常但生成仍 500/502/超时 | Worker 通了，上游 AI 或响应解析有问题 | 查 Worker logs、模型名、额度、base url |

### 第 3 步：判断是不是本地静态预览

如果用户是在本地打开：

- `file://.../public/generator.html`
- 只启动了普通静态服务器
- 只预览了 `public/` 目录

那么 `/api/*` 一定不能正常工作。

正确本地方式是在项目根目录运行 Worker：

```bash
cd /Users/rita/Desktop/projects/makermind-ai
npx wrangler dev --local
```

然后打开 Wrangler 输出的地址，例如：

```text
http://127.0.0.1:<port>/generator.html
http://127.0.0.1:<port>/api/health
```

### 第 4 步：区分 AI 失败和 Worker 未连通

- `Failed to fetch` / `NetworkError` / `Load failed`：优先判断 Worker 未连通或静态预览。
- `/api/health` 返回 JSON 但 AI 配置为 false：是 Cloudflare 环境变量缺失。
- `/api/health` 正常，但分段接口报 429/5xx/timeout：是上游 AI、额度、模型名、base url 或响应格式问题。
- 页面提示 `degraded: true` 或基础模板兜底：说明后端 fallback 生效，不代表完全失败。

---

## 本地和线上验证模板

### 本地 Worker 验证

```bash
cd /Users/rita/Desktop/projects/makermind-ai
npx wrangler dev --local
```

检查：

1. 打开 Wrangler 输出的 `/api/health`，必须返回 JSON。
2. 打开同源 `/generator.html`。
3. 走一轮对话 brief。
4. 点击生成，确认按 `overview → build → practice` 生成。
5. 确认最终页面由 `mergeParts()` 合并并由 `renderInstruction()` 渲染。
6. 如果本地只做冒烟测试，可用 `AI_MOCK=1`，但要说明 mock 通过不代表真实 AI 一定稳定。

### 线上 Worker 验证

1. 打开线上同源 `/api/health`。
2. 确认返回 JSON，而不是 HTML 或 404。
3. 确认：
   - `ai.hasApiKey: true`
   - `ai.hasBaseUrl: true`
   - `ai.hasModel: true`
4. 从线上生成器页面走完整流程。
5. 如果失败，按顺序查：
   - 是否访问旧 PR preview URL。
   - 浏览器是否缓存旧 `generator.js`。
   - Cloudflare 最新部署是否包含当前 main。
   - Worker logs 中 AI provider 的响应。

---

## 修改后的汇报格式

完成任务后，尽量用这几项汇报：

```text
已完成：
- 改了哪些文件
- 解决了什么问题

这次截图里的问题判断：
- 是静态预览 / Worker 未连通 / AI 配置缺失 / 上游 AI 失败 / 权限问题 中的哪一类

如何验证：
- 本地怎么打开
- 线上怎么检查 /api/health
- 生成器怎么跑一轮

如果还需要 Rita 操作：
- 给完整可复制命令
- 说明成功后应该看到什么输出
```

涉及 GitHub、分支、部署时，用白话解释：

- `commit` = 保存到本地仓库。
- `push` = 上传到 GitHub。
- `main` = GitHub 默认展示 / 正式分支。
- Cloudflare 线上是否更新，取决于最新代码是否已部署到 Cloudflare。

---

## 安全和提交注意事项

- 不提交任何密钥、token、`.credentials.json`。
- 不把 Cloudflare AI key 写入 README 或示例。
- 提交代码时只 stage 当前任务相关文件。
- 仓库中已有无关文档改动时，不要擅自删除、恢复或提交。
- 如果需要上传 skill 包到 SparkMinds 技能库，交给 `sparkminds-skills`，并确保 zip 排除 `.credentials.json`。
