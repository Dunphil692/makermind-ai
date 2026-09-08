// Default closed: the frontend build must explicitly set this to "false" before AI can run.
export const AI_FEATURES_PAUSED = import.meta.env.VITE_AI_FEATURES_PAUSED !== "false";
export const AI_FEATURES_PAUSED_MESSAGE = "AI 生成功能暂时暂停";
