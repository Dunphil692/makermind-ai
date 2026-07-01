# Loop Engineering 进度记录

## Loop 1：数据层合并（Schema + 认证扩展）

### Plan
- 以 MakerMind AI 为主项目，保留现有 `users` / `classes` / `projects` / `favorites` 结构和 PBKDF2 + JWT 认证体系。
- 从 SparkMinds 吸收与正循环相关的数据表：`students`、`student_projects`、`sessions`、`progress_events`、`milestones`、`student_milestone_completions`、`course_records`、`feedbacks`、`competition_records`、`works`。
- 丢弃 CRM / R2 技能相关表：`leads`、`follow_ups`、`trials`、`reminder_rules`、skills 文件管理。
- 用 `student_projects + progress_events` 替代旧 `student_progress`。

### Execute
- 更新 `migrations/schema.sql`：
  - `users.role` 注释扩展为 `teacher | student | parent`，新增 `idx_users_role`。
  - `projects` 增加 `is_template`、`difficulty_level`、`expected_duration_hours`。
  - 删除旧 `student_progress` 定义，新增学员档案、项目实例、课堂记录、进度事件、里程碑、反馈、课程记录、作品、比赛记录等表。
- 新建 `migrations/merge.sql`：
  - 重建 `projects` 表以兼容 SQLite/D1 不稳定支持 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 的问题。
  - 创建所有合并表与索引。
  - `DROP TABLE IF EXISTS student_progress`，由事件溯源模型替代。
- 更新 `src/auth.js`：注册时允许 `parent` 角色。
- 更新 `src/projects.js`：删除项目时清理 `student_projects`，不再访问旧 `student_progress`。

### Test
- 已用 SQLite 本地验证 schema 与 merge 迁移：
  - `sqlite3 /tmp/makermind-loop1-empty.sqlite < migrations/merge.sql`
  - `sqlite3 /tmp/makermind-loop1-empty.sqlite < migrations/merge.sql`
  - `sqlite3 /tmp/makermind-loop1-base.sqlite < migrations/schema.sql`
  - `sqlite3 /tmp/makermind-loop1-base.sqlite < migrations/merge.sql`
  - `sqlite3 /tmp/makermind-loop1-base.sqlite < migrations/merge.sql`
  - `sqlite3 /tmp/makermind-loop1-empty.sqlite "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name; PRAGMA table_info(projects);"`
- 结果：迁移可在空库和已有基础 schema 上连续执行两次；表列表包含 `students` / `student_projects` / `sessions` / `progress_events` / `feedbacks` / `works` 等目标表；`projects` 包含新增三列。
- 已用 Homebrew Node 做 JS 语法检查：
  - `/opt/homebrew/bin/node --check src/auth.js`
  - `/opt/homebrew/bin/node --check src/projects.js`
  - `/opt/homebrew/bin/node --check src/index.js`
- Wrangler D1 实测结果：用户手动执行 `npx wrangler d1 execute makermind-db --local --file=migrations/merge.sql` 后，Wrangler 报告 `69 commands executed successfully`。
- 已直接检查本地 D1 sqlite 文件，表列表包含 `students` / `student_projects` / `sessions` / `progress_events` / `feedbacks` / `works` 等目标表，`projects` 包含 `is_template` / `difficulty_level` / `expected_duration_hours` 三个新增字段。
- 已启动 `wrangler dev` 做冒烟测试。直接启动因当前缓存 Wrangler 的 runtime 只支持到 `2026-05-03`，而项目 `compatibility_date` 是 `2026-06-13` 失败；临时用 `--compatibility-date 2026-05-03` 启动成功，不改配置文件。
- 冒烟流程通过：注册 teacher、`/api/auth/me`、登录、创建项目、列表查询、详情查询、删除项目、注册 parent 并确认返回 role 为 `parent`。

### Reflect
- 字段冲突：SparkMinds 的 `users.name/avatar_url` 与 MakerMind 的 `display_name/avatar` 不一致，本轮只扩展 MakerMind 用户角色，不直接合并 SparkMinds 用户表。
- 语义冲突：SparkMinds `projects` 是模板项目，MakerMind `projects` 是 AI 生成项目方案；本轮只给 MakerMind `projects` 增加模板相关字段，不替换项目表语义。
- 进度模型冲突：旧 `student_progress` 是状态表，新模型是 `student_projects + progress_events` 事件溯源；已按方案 B 替换。
- 迁移约束：SQLite 不支持本机测试中的 `ALTER TABLE ADD COLUMN IF NOT EXISTS`，因此 `merge.sql` 用重建 `projects` 表保证幂等；本地 D1 可能是空库，因此 `merge.sql` 也需要包含 MakerMind 基础表兜底。

### Adapt
- Loop 2 可以继续推进后端 API 移植。开发时如需 `wrangler dev`，在当前缓存 Wrangler 升级前可临时追加 `--compatibility-date 2026-05-03` 启动；这只是本地测试绕过，不修改项目配置。
- Loop 2 的 API 移植需要继续使用 MakerMind 的 JWT `getUser()`，不要引入 SparkMinds 的明文 Bearer user_id。
- `projects.js` 已切到 `student_projects`，后续 API 需要实现 student project 分配与进度回滚，避免删除项目时留下孤儿记录。

## Loop 2：后端 API 移植（sessions + students + progress）

### Plan
- 按 MakerMind 现有纯 JS Workers 路由风格移植 SparkMinds 的学员档案、课堂记录、事件溯源进度和进度查询 API。
- 继续使用 MakerMind 的 JWT `getUser()`，不引入 SparkMinds 明文 Bearer user_id。
- 新增 RBAC 工具封装角色判断与 parent/student 数据隔离。

### Execute
- 新建 `src/rbac.js`：封装 `requireUser`、`requireRole`、`assertStudentAccess`、`assertStudentProjectAccess`。
- 新建 `src/students.js`：实现 `GET/POST /api/students`、`GET/PUT/DELETE /api/students/:id`、`GET /api/students/:id/progress`、`POST /api/students/:id/projects`。
- 新建 `src/sessions.js`：实现 `POST /api/sessions`、`GET /api/sessions/:id`、`DELETE /api/sessions/:id`，并移植 `recalculateProgress()` 事件溯源进度重算逻辑。
- 新建 `src/progress.js`：实现 `GET /api/students/:id/projects`、`GET /api/classes/:id/progress`。
- 更新 `src/index.js`：注册学员、课堂记录、班级进度相关路由。
- 修复一次 D1 参数问题：`students.js` 的 `stringifyValue()` 不再返回 `undefined`，避免 D1 bind 报 `Type 'undefined' not supported`。

### Test
- 已运行语法检查：
  - `/opt/homebrew/bin/node --check src/rbac.js`
  - `/opt/homebrew/bin/node --check src/sessions.js`
  - `/opt/homebrew/bin/node --check src/students.js`
  - `/opt/homebrew/bin/node --check src/progress.js`
  - `/opt/homebrew/bin/node --check src/index.js`
- 已用 `wrangler dev --local --port 8787 --compatibility-date 2026-05-03` 启动本地服务并跑完整流程：
  - 注册 teacher / parent / other parent / student
  - teacher 创建 project
  - teacher 创建 student，并绑定 parent 与 student user
  - teacher 列出 students
  - parent 可读取自己孩子
  - other parent 读取该学生返回 403
  - teacher 给 student 布置 project
  - 创建 session，`progressDelta=20` 后进度为 20
  - 再创建 session，`progressDelta=30` 后进度为 50
  - student 账号可读取自己的进度
  - parent 可读取 session
  - 删除第二个 session 后进度回滚为 20
  - student 可读取自己的项目实例列表
- 冒烟脚本最终输出：`loop2-smoke-ok`。

### Reflect
- TS → JS 移植中，SparkMinds 的 `ADMIN` 角色未引入；MakerMind 当前以 `teacher` 承担管理职能。
- Hono 中间件模式改为每个 handler 内显式调用 `requireUser()` / `requireRole()` / access assert，更符合 MakerMind 当前手写路由结构。
- SparkMinds `projects.name` 与 MakerMind `projects.title` 不同，进度查询已改为读取 MakerMind 的 `title/subject/concept`。
- D1 不接受 `undefined` bind 参数，所有可选字段需要显式转为 `null`。
- 事件回滚边界：删除 session 时同时删除对应 `progress_events` 后重算；当前 milestone 自动完成采用进度阈值插入，后续如需严格回滚 milestone，需要在更细粒度记录 session_id。

### Adapt
- Loop 3 可以在现有 `students/sessions/progress` API 基础上继续补 `feedbacks/course_records/works/competition_records` 的 API 与三端前端页面。
- 后续如升级 Wrangler 到支持 `compatibility_date=2026-06-13` 的版本，可去掉本地测试用的临时 `--compatibility-date 2026-05-03`。

## Loop 3：反馈与作品 API + 前端三个端

### Plan
- 在 Loop 2 的学员、课堂记录、进度 API 基础上补齐反馈、课程记录、作品和比赛记录 API。
- 新增 teacher / parent / student 三个纯 HTML/JS 页面，复用 `public/auth.js`、`MMAuth.authFetch()` 和现有卡片/工作台样式。
- 导航按 role 指向对应端，不引入 React/Hono/TS 或新依赖。

### Execute
- 新建 `src/feedback.js`：实现反馈与课程记录的列表、创建、删除。
- 新建 `src/works.js`：实现作品与比赛记录的列表、创建、更新、删除；R2 上传不接入，作品文件/链接信息存字符串。
- 更新 `src/sessions.js`：新增 `GET /api/students/:id/sessions` 用于家长端/教师端查看学生课堂记录。
- 更新 `src/index.js`：注册 feedbacks / courses / works / competitions / student sessions 路由。
- 新增 `public/teacher.html`：教师查看学员项目进度、反馈/作品/课程统计，并可快速写反馈和课程记录，课堂记录入口跳转 `session.html`。
- 新增 `public/parent.html`：家长只读查看孩子进度、最近课堂记录、教师反馈和作品。
- 新增 `public/student.html`：学生查看自己的项目任务、进度、教师反馈，并可提交作品链接/路径。
- 更新 `public/auth.js`：登录导航按 `teacher/parent/student` 指向对应端。
- 更新 `public/login.html`：注册角色增加“家长”。

### Test
- 已运行语法检查：
  - `/opt/homebrew/bin/node --check src/feedback.js`
  - `/opt/homebrew/bin/node --check src/works.js`
  - `/opt/homebrew/bin/node --check src/index.js`
- 已用 `wrangler dev --local --port 8787 --compatibility-date 2026-05-03` 启动本地服务并跑完整流程：
  - 注册 teacher / parent / student
  - teacher 创建 project、student 档案、项目实例和 session
  - teacher 创建 feedback 和 course record
  - parent 可读取 feedbacks / courses / works / competitions / sessions
  - student 可提交 work
  - parent 尝试提交 work 返回 403
  - teacher 创建 competition record
  - `teacher.html` / `parent.html` / `student.html` 均返回 200
- 冒烟脚本最终输出：`loop3-smoke-ok`。

### Reflect
- 前端复用现有 `dashboard.html` 的 topbar、dashboard-wrap、dash-stats、project-card 等样式，避免新增 CSS 文件。
- 导航栏适配集中在 `public/auth.js`，通过 roleHome/roleLabel 控制入口，未登录仍显示登录/注册。
- `session.html` 属于 Loop 4，本轮 teacher.html 只提供跳转入口；实际课堂记录表单下轮实现。
- 家长端保持只读：API 层禁止 parent 创建作品，页面也不提供修改入口。
- 作品上传未接 R2，符合本轮约束，先保存 `sourceUrl/filePaths` 字符串。

### Adapt
- Loop 4 可直接实现 `public/session.html`，复用本轮的 `/api/students/:id/projects` 与 `/api/sessions`。
- Loop 4 的 AI 结构化保存后，可继续使用本轮的 parent/student 页面展示 sessions、feedbacks 和 works。

## Loop 4：课堂记录语音功能 + AI 结构化

### Plan
- 新增课堂记录页 `public/session.html`，支持 Chrome 原生语音识别和手动输入。
- 新增 `POST /api/sessions/structure`，用 AI 将课堂转写结构化为 session 可保存字段与学生画像信号。
- 保存 session 时，把 `personalityTraits`、`interestSignals`、`learningStyle` 合并回 students 表，形成画像更新。

### Execute
- 更新 `migrations/schema.sql` 和 `migrations/merge.sql` 的 `students` 表定义，加入 `personality_traits`、`learning_style` 字段。
- 已对当前本地 D1 执行 `ALTER TABLE students ADD COLUMN personality_traits TEXT; ALTER TABLE students ADD COLUMN learning_style TEXT;`，并用 `PRAGMA table_info(students)` 确认字段存在。
- 更新 `src/ai.js`：新增 `handleStructureSession()`、学生画像读取、课堂结构化 prompt、结构化结果 normalize；测试时支持 `mock:true` 跳过真实 AI 调用。
- 更新 `src/index.js`：注册 `POST /api/sessions/structure`。
- 更新 `src/sessions.js`：保存 session 后调用画像合并逻辑，把课堂提取的性格特征、兴趣信号、学习风格更新到 students 表。
- 更新 `src/students.js`：学生创建、更新、详情返回支持 `personalityTraits` 和 `learningStyle`。
- 新增 `public/session.html`：选择学生与项目实例、录音/手动转写、AI 结构化、展示 suggestedNextProject、确认保存。

### Test
- 已运行语法检查：
  - `/opt/homebrew/bin/node --check src/ai.js`
  - `/opt/homebrew/bin/node --check src/sessions.js`
  - `/opt/homebrew/bin/node --check src/students.js`
  - `/opt/homebrew/bin/node --check src/index.js`
- 已用 `wrangler dev --local --port 8787 --compatibility-date 2026-05-03` 启动本地服务并跑完整流程：
  - 注册 teacher / parent / student
  - teacher 创建 project、student、项目实例
  - `POST /api/sessions/structure` 使用 `mock:true` 结构化课堂文本，返回 structuredSummary、topicsCovered、skillsDemonstrated、progressDelta、understandingScore、teacherNotes、personalityTraits、interestSignals、learningStyle、suggestedNextProject
  - 保存结构化 session 后，项目进度变为 15
  - 再查学生详情，确认 `personalityTraits` 与 `learningStyle` 已写入
  - parent 可读取该学生 sessions
  - `session.html` 返回 200
- 冒烟脚本最终输出：`loop4-smoke-ok`。

### Reflect
- `webkitSpeechRecognition` 只能在 Chrome 系浏览器中稳定使用；页面已在不支持时提示手动输入。
- 本地测试环境的 AI 变量在结构化接口中不可用，因此端到端测试使用 `mock:true` 验证 API、保存、进度和画像更新链路；真实 AI 调用逻辑已接入 `generateParsedPartWithRetry()`。
- 画像更新采用合并列表而不是硬覆盖，降低一次课堂记录错误标签污染画像的风险。
- 语音原始内容只作为 `raw_transcript` 文本保存，没有保存音频文件；后续上线前仍需要补充隐私提示。

### Adapt
- Loop 5 可以基于 `students.personality_traits`、`learning_style`、`interest_direction` 与最近 sessions，把学生画像注入项目生成 prompt。
- Loop 5 的 generator 页面可读取 teacher 名下学生列表，允许“为某个学生生成”。

## Loop 5：学生画像驱动 AI 生成（正循环闭环）

### Plan
- 改造 `/api/dialogue-task-brief` 与 `/api/generate-instruction-part`，支持可选 `studentId`。
- 当指定学生时，读取学生画像和最近 sessions，将其注入 brief 提取与三段式生成 prompt。
- 前端 generator 增加“为某个学生生成”下拉框，并支持 session 页 suggestedNextProject 预填跳转。

### Execute
- 更新 `src/ai.js`：
  - `handleDialogueTaskBrief()` 接收 `studentId`，通过 JWT + RBAC 校验教师权限后加载学生画像。
  - `handleGenerateInstructionPart()` 接收 `studentId`，加载学生画像后注入 overview/build/practice prompt。
  - 新增 `loadAuthorizedStudentProfile()`、`formatStudentProfileForPrompt()`、个性化 prompt 规则。
  - 测试用 `mock:true` 支持在无真实 AI 环境下验证画像注入路径。
- 更新 `public/generator.html`：新增“为某个学生生成（可选）”下拉框。
- 更新 `public/generator.js`：
  - 加载教师可见学生列表。
  - 对 `/api/dialogue-task-brief`、`/api/generate-instruction-part` 请求附带 `studentId` 与 Authorization。
  - 支持 URL 参数 `studentId` 和 `prefill`。
- 更新 `public/session.html`：`suggestedNextProject` 跳转 generator 时附带 `studentId` 与 `prefill`。

### Test
- 已运行语法检查：
  - `/opt/homebrew/bin/node --check src/ai.js`
  - `/opt/homebrew/bin/node --check public/generator.js`
- 已用 `wrangler dev --local --port 8787 --compatibility-date 2026-05-03` 启动本地服务并跑完整流程：
  - 注册 teacher / parent / student
  - teacher 创建带画像的 student（基础弱、篮球兴趣、耐心不足、短步骤即时反馈）
  - `POST /api/dialogue-task-brief` 使用 `studentId + mock:true` 返回 ready brief
  - `POST /api/generate-instruction-part` 使用 `studentId + mock:true + part=overview` 返回带“篮球”个性化 subtitle
  - parent 使用同一 studentId 调生成接口返回 403
  - `generator.html?studentId=...&prefill=...` 返回 200
- 冒烟脚本最终输出：`loop5-smoke-ok`。

### Reflect
- 画像注入会增加 prompt token，占用主要来自最近 sessions 和画像 JSON；当前只取最近 3 次 sessions，控制长度。
- 权限上限定“带 studentId 的画像生成”仅 teacher 可用，防止 parent/student 越权使用他人画像。
- 个性化规则强调“本次更适合”，避免把学生画像固化为永久标签。
- 真实个性化差异需要真实 AI 环境进一步人工观察；本地以 mock 验证链路和权限。

### Adapt
- 五轮闭环已完成。后续建议做一次整体 code-review / 安全 review，并清理当前工作树中与本任务无关的既有删除文件状态后再提交。
