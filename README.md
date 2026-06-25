# MakerMind AI — 互动项目课生成工作台

> 输入知识点，AI 在 60 秒内生成完整的 STEAM 项目方案。

## 项目简介

MakerMind AI 是一个面向中小学教师的 AI 驱动 STEAM 项目课生成工具。教师输入知识点、选择学生兴趣场景和硬件条件后，系统调用 DeepSeek AI 分三段生成完整的项目指导方案。

**参赛信息**：TRAE AI 创造力大赛 · 学习工作赛道

## 核心功能

- **知识点 → 项目方案**：输入任意知识点，AI 生成完整 STEAM 项目
- **三层递进设计**：网页模拟 → 低成本任务 → 硬件拓展
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

# 本地预览
cd public && python3 -m http.server 8080

# 部署到 Cloudflare Workers
npx wrangler deploy
```

## 环境变量

在 Cloudflare Workers 中配置以下 Secret：

- `DEEPSEEK_API_KEY`：DeepSeek API 密钥

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
