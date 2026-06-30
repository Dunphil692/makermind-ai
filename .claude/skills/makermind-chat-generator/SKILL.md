---
name: makermind-chat-generator
description: Use when modifying MakerMind AI's generator chat intake, dialogue extraction, segmented AI generation, or final project rendering.
---

# MakerMind Chat Generator Workflow

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

## Rules

- Do not replace `renderInstruction()` unless explicitly requested.
- Do not generate full project content in `/api/dialogue-task-brief`.
- Keep history, favorites, export, share, print, and cloud save behavior working.
- Use dialogue only to populate the canonical generation payload: concept, subject, level, interest, kit, duration, materials.
- Keep OpenAI-compatible provider environment variables unless the user explicitly asks to migrate providers: `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`.
- If adding new UI, keep the existing light orange/blue MakerMind visual language.

## Verification

- Test one-turn complete prompt: “我们班学生喜欢足球点球，我想用 UNIHIKER K10，让他们学一次函数。”
- Test multi-turn prompt missing hardware.
- Test teacher correction: “改成纸电路，不要编程。”
- Verify the generate button stays disabled until the brief is complete.
- Verify final output still renders through `renderInstruction()` with overview/build/practice merged.
- Verify history, favorites, export, share, print, and logged-in cloud save still work.
