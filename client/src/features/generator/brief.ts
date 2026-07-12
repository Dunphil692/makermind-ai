import type { TaskBrief } from "./types";

export function createEmptyBrief(): TaskBrief {
  return {
    studentInterest: "",
    hardwareKit: "",
    knowledgeGoal: "",
    subject: "数学",
    level: "需要项目带着学",
    duration: "60 分钟项目课",
    confidence: {
      studentInterest: 0,
      hardwareKit: 0,
      knowledgeGoal: 0
    },
    missingFields: ["studentInterest", "hardwareKit", "knowledgeGoal"],
    readyToGenerate: false
  };
}

export function canGenerateFromBrief(brief: TaskBrief | null | undefined): boolean {
  return Boolean(brief?.studentInterest && brief?.hardwareKit && brief?.knowledgeGoal);
}

export function normalizeClientBrief(brief?: Partial<TaskBrief> | null): TaskBrief {
  const next = { ...createEmptyBrief(), ...(brief || {}) };
  next.confidence = { ...createEmptyBrief().confidence, ...(brief?.confidence || {}) };
  next.missingFields = [];
  if (!next.studentInterest) next.missingFields.push("studentInterest");
  if (!next.hardwareKit) next.missingFields.push("hardwareKit");
  if (!next.knowledgeGoal) next.missingFields.push("knowledgeGoal");
  next.readyToGenerate = next.missingFields.length === 0;
  return next;
}

export function fieldLabel(key: string): string {
  return (
    {
      studentInterest: "学生兴趣",
      hardwareKit: "硬件/材料",
      knowledgeGoal: "学习知识"
    }[key] || key
  );
}

export function inferKitValue(hardwareText: string): string {
  const text = String(hardwareText || "").toLowerCase();
  if (text.includes("k10") || text.includes("unihiker")) return "k10";
  if (text.includes("arduino") || text.includes("esp32")) return "arduino";
  if (text.includes("micro:bit") || text.includes("microbit")) return "microbit";
  if (text.includes("纸") || text.includes("无需编程") || text.includes("不编程")) return "paper";
  if (text.includes("纸板") || text.includes("电子模块")) return "mixed";
  return "k10";
}
