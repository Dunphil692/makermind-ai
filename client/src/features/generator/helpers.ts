import type { Instruction } from "./types";
import { imageLibrary } from "./constants";

export function safeText(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getCurrentTimeText(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

export function getImageInfo(instruction: Instruction) {
  const key = instruction.imageKey || "reaction-trainer";
  const lib = imageLibrary[key] || imageLibrary["reaction-trainer"];
  const images = Array.isArray(lib.images) ? lib.images : [];
  return {
    image: images[0] || "/assets/reaction-trainer.jpg",
    title: lib.title,
    caption: lib.caption
  };
}

export function getHealthLink(): string {
  return `${window.location.origin}/api/health`;
}

export function formatFetchError(error: unknown): string {
  const message =
    (error as { message?: string })?.message || String(error || "生成失败");
  if (
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("Load failed")
  ) {
    return `${message}。当前页面没有连到 MakerMind Worker API，请打开 ${getHealthLink()} 检查是否返回 JSON；如果返回 404/HTML，说明你打开的是静态预览，不是同源 Worker。`;
  }
  return message;
}

export function parseGenerationError(message: string): { errorType: string; errorSuggestion: string } {
  let errorType = "未知错误";
  let errorSuggestion = "请检查网络连接后重试，或联系管理员确认 API 配置。";

  if (
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("network") ||
    message.includes("静态预览")
  ) {
    errorType = "Worker API 未连通";
    errorSuggestion =
      "请打开 /api/health 检查：如果不是 JSON，说明当前页面不是由 Cloudflare Worker 同源服务；如果 JSON 里 AI 配置为 false，请在 Cloudflare 配置 AI_API_KEY、AI_BASE_URL、AI_MODEL。";
  } else if (message.includes("401") || message.includes("403")) {
    errorType = "权限不足";
    errorSuggestion =
      "如果选择了学生画像，请确认当前账号是教师账号；学生和家长只能查看已布置项目，不能替教师生成画像方案。";
  } else if (
    message.includes("AI_API_KEY") ||
    message.includes("AI_BASE_URL") ||
    message.includes("AI_MODEL") ||
    message.includes("API key")
  ) {
    errorType = "AI 环境变量缺失";
    errorSuggestion =
      "服务器 AI 配置可能有问题，请在 Cloudflare Worker 中设置 AI_API_KEY、AI_BASE_URL、AI_MODEL。";
  } else if (message.includes("429") || message.includes("rate limit") || message.includes("quota")) {
    errorType = "请求过于频繁";
    errorSuggestion = "AI 生成请求已达上限，请等待 1 分钟后重试。";
  } else if (message.includes("500") || message.includes("502") || message.includes("503")) {
    errorType = "服务器错误";
    errorSuggestion = "服务器暂时不可用，请稍后重试。";
  } else if (message.includes("timeout") || message.includes("超时")) {
    errorType = "请求超时";
    errorSuggestion = "AI 生成耗时过长，请重试。如果持续超时，建议选择较短的课堂时长。";
  }

  return { errorType, errorSuggestion };
}

export function instructionToPlainText(inst: Instruction): string {
  let text = `=== ${inst.projectName || "STEAM 项目方案"} ===\n`;
  text += `${inst.subtitle || ""}\n\n`;
  text += `--- 项目概述 ---\n`;
  text += `核心目标：${inst.overview?.coreGoal || ""}\n`;
  text += `项目简介：${inst.overview?.projectIntro || ""}\n`;
  text += `为什么学生会想玩：${inst.overview?.whyFun || ""}\n`;
  if (inst.overview?.learningReasons?.length) {
    text += `\n学习理由：\n`;
    inst.overview.learningReasons.forEach((r) => {
      text += `  - ${r}\n`;
    });
  }
  text += `\n--- 交互流程 ---\n`;
  text += `触发：${inst.interactionFlow?.trigger || ""}\n`;
  text += `计算：${inst.interactionFlow?.calculation || ""}\n`;
  text += `等级：${inst.interactionFlow?.level || ""}\n`;
  if (inst.interactionFlow?.feedback?.length) {
    text += `反馈：\n`;
    inst.interactionFlow.feedback.forEach((f) => {
      text += `  - ${f}\n`;
    });
  }
  text += `\n--- 材料清单 ---\n`;
  if (inst.materials?.length) {
    inst.materials.forEach((m) => {
      text += `  ${m.name} x${m.quantity} - ${m.usage} (${m.note || ""})\n`;
    });
  }
  text += `\n--- 制作步骤 ---\n`;
  if (inst.steps?.length) {
    inst.steps.forEach((s, i) => {
      text += `\nStep ${i + 1}: ${s.title}（${s.duration}）\n${s.content}\n`;
      if (s.tips) text += `提示：${s.tips}\n`;
      if (s.warning) text += `注意：${s.warning}\n`;
    });
  }
  text += `\n--- 知识点讲解 ---\n`;
  text += `核心概念：${inst.knowledgeExplanation?.coreConcept || ""}\n`;
  text += `关键公式：${inst.knowledgeExplanation?.keyFormula || ""}\n`;
  text += `在项目中的应用：${inst.knowledgeExplanation?.inProject || ""}\n`;
  text += `深入理解：${inst.knowledgeExplanation?.deepUnderstanding || ""}\n`;
  text += `常见误区：${inst.knowledgeExplanation?.commonMisunderstanding || ""}\n`;
  text += `\n--- 融会贯通训练 ---\n`;
  const training = inst.masteryTraining || {};
  const trainingItems: [string, { task?: string; hint?: string; answer?: string } | undefined][] = [
    ["基础练习", training.basicPractice],
    ["变化挑战", training.variationChallenge],
    ["逆向思维", training.reverseThinking],
    ["综合应用", training.comprehensiveApplication],
    ["举一反三", training.transferQuestion]
  ];
  trainingItems.forEach(([title, item]) => {
    if (item) {
      text += `\n【${title}】\n任务：${item.task}\n提示：${item.hint}\n参考答案：${item.answer}\n`;
    }
  });
  if (inst.starterCodeCpp) text += `\n--- C++ / Arduino 代码 ---\n${inst.starterCodeCpp}\n`;
  if (inst.starterCodePython) text += `\n--- MicroPython / K10 代码 ---\n${inst.starterCodePython}\n`;
  if (inst.extensions?.length) {
    text += `\n--- 进阶方向 ---\n`;
    inst.extensions.forEach((e) => {
      text += `  - ${e}\n`;
    });
  }
  if (inst.faq?.length) {
    text += `\n--- 常见问题 ---\n`;
    inst.faq.forEach((f, i) => {
      text += `Q${i + 1}: ${f.question}\nA: ${f.answer}\n\n`;
    });
  }
  return text;
}
