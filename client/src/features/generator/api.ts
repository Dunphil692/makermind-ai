import { getToken } from "../../lib/auth";
import { AI_FEATURES_PAUSED, AI_FEATURES_PAUSED_MESSAGE } from "../../config";
import type { DialogueMessage, GenerationPayload, TaskBrief } from "./types";
import { formatFetchError } from "./helpers";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryablePartError(error: { status?: number; message?: string } | null): boolean {
  if (!error) return true;
  if (error.status && [400, 401, 403, 404].includes(Number(error.status))) return false;
  if (error.status && [408, 409, 429, 500, 502, 503, 504, 529].includes(Number(error.status))) return true;
  return /Failed to fetch|NetworkError|Load failed|timeout|超时|接口返回非 JSON|500|502|503|504|429/i.test(
    error.message || ""
  );
}

function clientRetryDelay(attempt: number) {
  return 800 * attempt + ((attempt * 271) % 700);
}

export async function requestPart(payload: GenerationPayload, part: "overview" | "build" | "practice") {
  if (AI_FEATURES_PAUSED) throw new Error(AI_FEATURES_PAUSED_MESSAGE);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const maxAttempts = 3;
  let lastError: { status?: number; message?: string; name?: string } | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), part === "build" ? 170000 : 150000);
    try {
      const response = await fetch("/api/generate-instruction-part", {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({ ...payload, part })
      });
      const text = await response.text();
      let data: { data?: unknown; degraded?: boolean; warning?: string; detail?: string; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`接口返回非 JSON：${text.slice(0, 200)}`);
      }
      if (!response.ok) {
        const error = new Error(data.detail || data.error || `${part} 生成失败`) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }
      if (!data.data) throw new Error(`AI 未返回 ${part} 数据`);
      return data as { data: unknown; degraded?: boolean; warning?: string };
    } catch (error) {
      const err = error as { status?: number; message?: string; name?: string };
      lastError = err.name === "AbortError" ? { message: `${part} 生成请求超时`, status: 408 } : err;
      if (!isRetryablePartError(lastError) || attempt >= maxAttempts) break;
      await wait(clientRetryDelay(attempt));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(formatFetchError(lastError));
}

export async function requestDialogueTurn(messages: DialogueMessage[], brief: TaskBrief, studentId?: string) {
  if (AI_FEATURES_PAUSED) throw new Error(AI_FEATURES_PAUSED_MESSAGE);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let response: Response;
  try {
    response = await fetch("/api/dialogue-task-brief", {
      method: "POST",
      headers,
      body: JSON.stringify({ messages, brief, studentId: studentId || undefined })
    });
  } catch (error) {
    throw new Error(formatFetchError(error));
  }
  const text = await response.text();
  let data: { brief?: TaskBrief; reply?: string; detail?: string; error?: string };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`接口返回非 JSON：${text.slice(0, 200)}`);
  }
  if (!response.ok) throw new Error(data.detail || data.error || "对话理解失败");
  return data;
}
