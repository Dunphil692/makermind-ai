import type { Instruction, InstructionPartBuild, InstructionPartOverview, InstructionPartPractice } from "./types";

/** 合并三段生成结果，保持与 legacy generator.js 一致 */
export function mergeParts(
  overview: InstructionPartOverview,
  build: InstructionPartBuild,
  practice: InstructionPartPractice
): Instruction {
  return {
    projectName: overview.projectName,
    subtitle: overview.subtitle,
    imageKey: overview.imageKey,
    meta: overview.meta,
    overview: overview.overview,
    interactionFlow: overview.interactionFlow,
    materials: overview.materials,
    steps: build.steps,
    knowledgeExplanation: build.knowledgeExplanation,
    starterCodeCpp: build.starterCodeCpp || build.starterCode,
    starterCodePython: build.starterCodePython,
    masteryTraining: practice.masteryTraining,
    extensions: practice.extensions,
    faq: practice.faq
  };
}
