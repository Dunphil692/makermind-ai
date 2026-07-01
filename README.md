# MakerMind AI — 互动项目课生成工作台

> 输入知识点，AI 在 60 秒内生成完整的 STEAM 项目方案。

## 项目简介

MakerMind AI 是一个面向中小学教师的 AI 驱动 STEAM 项目课生成与学员成长追踪平台。教师先用对话式生成器按学生画像生成项目，系统把项目布置到学生端；学生提交作品后，教师通过课堂记录和可视化反馈更新进度；家长端同步查看成长报告，下一次生成会继续参考学生画像。

**参赛信息**：TRAE AI 创造力大赛 · 学习工作赛道

## 核心功能

- **知识点 → 个性化项目方案**：输入任意知识点，AI 结合学生兴趣、硬件和画像生成完整 STEAM 项目
- **教师端闭环工作台**：查看学生画像、项目进度、作品提交、课堂记录和待反馈队列
- **学生端任务板**：查看老师布置的项目、提交作品、阅读教师反馈和课堂成长记录
- **家长端成长报告**：只读查看孩子项目进度、课堂总结、教师反馈和作品展示
- **课堂记录与画像更新**：教师语音/文本记录课堂，AI 结构化为进度事件、反馈线索和学生画像
- **5 层融会贯通训练**：基础练习 → 变化挑战 → 逆向思维 → 综合应用 → 举一反三
- **双语言代码**：C++ / Arduino + MicroPython / K10
- **完整课堂材料**：学生任务卡、教师引导卡、材料清单、制作步骤、FAQ

## 技术架构

```
用户浏览器 (HTML/CSS/JS)
    ↓ POST /api/generate-instruction-part
Cloudflare Workers (src/index.js)
    ↓ HTTP Request
DeepSeek AI API
    ↓ JSON Response
分段渲染（overview → build → practice）
```

- **前端**：纯 HTML/CSS/JS，无框架依赖，响应式设计
- **后端**：Cloudflare Workers，分段式 AI 生成
- **AI 模型**：DeepSeek Chat API
- **Prompt Engineering**：三段式结构化 Prompt，每段输出严格 JSON Schema

## 本地开发

```bash
# 安装依赖
npm install

# 本地预览（必须用 Worker，不能只开 public 静态目录，否则 /api/* 会 Failed to fetch）
npx wrangler dev --local

# 部署到 Cloudflare Workers
npx wrangler deploy
```

## 环境变量

本项目使用 OpenAI-compatible Chat Completions 接口。在 Cloudflare Workers / Pages Preview 对应环境中配置以下变量或 Secret：

- `AI_API_KEY`：模型服务 API 密钥
- `AI_BASE_URL`：模型服务基础地址，例如 `https://api.deepseek.com` 或完整 `/chat/completions` 地址
- `AI_MODEL`：模型名称，例如 `deepseek-chat`
- `JWT_SECRET`：登录态签名密钥

可选本地测试变量：

- `AI_MOCK=1`：本地冒烟测试时跳过真实 AI 调用，生产环境不要开启。

线上排查：打开同源地址 `/api/health`。如果不是 JSON，说明当前页面不是由 Worker 同源服务；如果 JSON 中 `ai.hasApiKey / hasBaseUrl / hasModel` 为 `false`，说明 Cloudflare 预览或生产环境缺少 AI 配置。

## 生成稳定性与兜底

任务生成器保留三段式 `overview → build → practice` 流程，但增加了抗失败机制：

- 后端对上游 AI 的 429、5xx、超时和偶发 JSON 解析失败做指数退避重试。
- 前端对每个分段做独立重试；如果第 1 段成功、第 2 段失败，重试时会从第 2 段继续。
- 已成功的分段会临时保存到浏览器本地草稿，刷新或重试不会浪费前面生成的内容。
- 如果真实 AI 连续失败，后端会对失败分段返回可渲染的基础模板兜底，并在页面提示“部分内容使用基础模板生成”。
- `/api/health` 只检查 Worker、D1、Assets 和 AI 环境变量是否存在，不代表上游 AI 服务一定稳定。

## 项目结构

```
makermind-ai/
├── public/              # 前端静态文件
│   ├── index.html       # 首页
│   ├── generator.html   # 任务生成器（核心页面）
│   ├── gallery.html     # 任务案例库
│   ├── rules.html       # 课堂痛点
│   ├── students.html    # 学生分层
│   ├── about.html       # 关于我们
│   ├── faq.html         # 常见问题
│   ├── app.js           # 学生分层交互逻辑
│   └── styles.css       # 全局样式
├── src/
│   └── index.js         # Cloudflare Workers 后端
├── wrangler.jsonc       # Cloudflare 配置
└── README.md
```

## 支持的硬件

- UNIHIKER K10（推荐）
- Arduino / ESP32
- micro:bit
- 纸电路 / 无需编程
- 纸板 + 电子模块

## License

MIT
