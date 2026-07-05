---
name: makermind-chat-generator
description: Use when modifying MakerMind AI's generator chat intake, dialogue extraction, segmented AI generation, or final project rendering. Prioritize rich, classroom-ready STEAM project content over speed; preserve the dialogue brief + segmented generation architecture.
---

# MakerMind Chat Generator Workflow

## Core Goal

MakerMind AI 的生成器不是“快速给一个项目点子”，而是帮老师生成一份 **可以直接拿去上课的、足够充实的 STEAM 项目课 instruction**。

生成速度可以慢一点，优先级始终是：

1. 内容完整
2. 课堂可执行
3. 学习目标清楚
4. 制作步骤细
5. 知识讲解扎实
6. 练习能帮助学生真正迁移应用

不要为了快而压缩内容，不要生成空泛、短小、像概要一样的项目。

## Key Files

- `public/generator.html` — generator page markup and chat intake shell.
- `public/generator.js` — dialogue state, brief extraction calls, segmented generation orchestration, final renderer.
- `public/styles.css` — generator, chat, brief-chip, and final instruction visual styles.
- `src/index.js` — Cloudflare Worker route registration.
- `src/ai.js` — dialogue brief extraction and segmented instruction generation prompts.

## Architecture

The generator uses a chat-style intake to discover three required fields:

1. student interests
2. desired hardware/kit/materials
3. learning knowledge goal

The chat endpoint only extracts or updates the structured brief and asks follow-up questions. It must not generate the full project.

After the brief is complete, preserve the existing segmented generation flow:

- `POST /api/generate-instruction-part` with `part=overview`
- `POST /api/generate-instruction-part` with `part=build`
- `POST /api/generate-instruction-part` with `part=practice`

The frontend then uses `mergeParts()` and `renderInstruction()` for the final output.

## Non-Negotiable Rules

- Do not replace `renderInstruction()` unless explicitly requested.
- Do not generate full project content in `/api/dialogue-task-brief`.
- Do not collapse overview/build/practice back into one single generation request.
- Keep history, favorites, export, share, print, and cloud save behavior working.
- Use dialogue only to populate the canonical generation payload: concept, subject, level, interest, kit, duration, materials.
- Keep OpenAI-compatible provider environment variables unless the user explicitly asks to migrate providers: `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`.
- If adding new UI, keep the existing light orange/blue MakerMind visual language.
- Do not optimize by making the generated instruction shorter. If optimizing prompts, optimize for clarity, structure, and richness.

## Content Quality Standard

Every generated project should feel like a teacher-facing lesson package, not a short demo.

### Overview part must include

- A concrete project title tied to the student's interest.
- A one-sentence hook that a teacher can say to students at the start of class.
- A clear core learning goal: what concept students should understand after the project.
- Why this project helps students learn the concept, not just use the concept.
- A complete interaction flow:
  - student action / sensor input
  - concept-based rule or calculation
  - visual, sound, light, motion, or physical feedback
- A realistic classroom scenario using the selected hardware/materials.
- At least 3 learning reasons, written in teacher-friendly language.
- Avoid generic sentences like “通过项目学习知识点”. Explain the actual learning mechanism.

### Build part must include

- A complete material list with purpose and classroom notes.
- Step-by-step making process that a teacher can follow in class.
- Each step should include:
  - what students do
  - what the teacher reminds them
  - what common mistake may happen
  - how to check whether the step worked
- Hardware or material usage must match the teacher's selected kit/materials.
- Do not invent expensive or unrelated equipment unless the teacher provided it.
- Code explanation must be beginner-friendly:
  - variable meaning
  - input/output relationship
  - key condition or formula
  - how students can modify one parameter and observe the result
- If code is returned as string arrays, keep it readable and sufficiently commented.
- Avoid generating only a skeleton. The project must be buildable.

### Practice part must include

- 5-layer mastery training:
  1. basic understanding
  2. parameter change
  3. reverse thinking
  4. integrated challenge
  5. transfer to a new scenario
- Each layer should include:
  - student task
  - expected thinking
  - teacher observation point
  - possible extension question
- Include at least 3 reflection questions that help students explain the concept in their own words.
- Include at least 3 extension ideas for different student levels.
- Include FAQ / troubleshooting that covers both concept confusion and making/code issues.
- The practice section must not be a simple quiz. It should help students apply and transfer knowledge.

## Prompting Principles

When editing `src/ai.js` prompts, prefer instructions like:

- “生成课堂可直接使用的完整 instruction，而不是摘要。”
- “每个字段都要有具体内容，不要写待补充。”
- “制作步骤要细到老师能照着上课。”
- “知识讲解要解释为什么，不只给结论。”
- “练习要体现从理解到迁移，不要只列题目。”
- “宁可生成更长，也不要为了速度牺牲细节。”

Avoid instructions like:

- “内容要短。”
- “快速生成。”
- “简单概括。”
- “不要太复杂。” unless it is paired with “但仍要完整可上课”。

## Dialogue Brief Rules

The dialogue endpoint should collect only the brief:

- studentInterest
- hardwareKit
- knowledgeGoal
- optional: subject, level, duration, materials

It should ask one useful follow-up question at a time when information is missing.

Good follow-up style:

- “学生更喜欢足球、赛车，还是生活里的小发明？”
- “这节课你准备用 K10、Micro:bit、纸电路，还是普通手工材料？”
- “你希望学生主要理解一次函数里的斜率、截距，还是函数关系？”

Bad follow-up style:

- Asking for too many details at once.
- Asking abstract curriculum-design questions that busy teachers cannot answer quickly.
- Starting to generate the full project before the three core fields are ready.

## Segmented Generation Responsibilities

### overview

Responsible for project framing:

- title/subtitle
- core goal
- interest-based scenario
- interaction flow
- learning reasons
- classroom value

### build

Responsible for making and implementation:

- materials
- steps
- code or pseudo-code
- concept explanation inside the build process
- teacher reminders and checks

### practice

Responsible for mastery and transfer:

- layered exercises
- reflection questions
- differentiation
- extension challenges
- FAQ and troubleshooting

Do not let one part dump all responsibilities and leave the other parts thin.

## Fallback / Stability Rules

Fallback content is allowed only when AI generation fails, but fallback should still be usable.

Fallback should include:

- a basic but coherent project scenario
- enough materials and steps to render
- a clear notice that the section is degraded/basic

Fallback should not become the normal output style. Normal AI output should be richer than fallback.

## Verification

- Test one-turn complete prompt: “我们班学生喜欢足球点球，我想用 UNIHIKER K10，让他们学一次函数。”
- Test multi-turn prompt missing hardware.
- Test teacher correction: “改成纸电路，不要编程。”
- Verify the generate button stays disabled until the brief is complete.
- Verify final output still renders through `renderInstruction()` with overview/build/practice merged.
- Verify output is not too thin:
  - overview has concrete classroom hook and learning reasons
  - build has detailed steps, checks, and code explanation
  - practice has 5-layer training and FAQ
- Verify history, favorites, export, share, print, and logged-in cloud save still work.

## Reporting Back

When reporting changes to Rita, use plain Chinese:

- 说明是 skill / prompt 约束变详细了，不是把架构推倒重来。
- 说明速度可能会慢一点，但目标是生成内容更完整。
- 明确列出是否已提交、是否已上传 GitHub。
