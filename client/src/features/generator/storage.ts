import type { GenerationDraft, GenerationPayload, HistoryItem } from "./types";

const HISTORY_KEY = "makermind_history";
const SAVED_KEY = "makermind_saved";
const DRAFTS_KEY = "makermind_generation_drafts";
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? "");
}

function hashText(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function getGenerationCacheKey(payload: GenerationPayload): string {
  return hashText(
    stableStringify({
      concept: payload.concept,
      subject: payload.subject,
      level: payload.level,
      interest: payload.interest,
      kit: payload.kit,
      duration: payload.duration,
      materials: payload.materials,
      studentId: payload.studentId || ""
    })
  );
}

function getDraftStore(): Record<string, GenerationDraft & { updatedAt?: number }> {
  try {
    return JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function saveDraftStore(store: Record<string, GenerationDraft & { updatedAt?: number }>) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(store));
}

export function pruneGenerationDrafts() {
  const store = getDraftStore();
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (!store[key]?.updatedAt || now - store[key].updatedAt! > DRAFT_TTL_MS) delete store[key];
  });
  saveDraftStore(store);
}

export function loadGenerationDraft(key: string): GenerationDraft {
  const draft = getDraftStore()[key];
  if (!draft || Date.now() - (draft.updatedAt || 0) > DRAFT_TTL_MS) {
    return { parts: {}, degradedParts: [], warnings: [] };
  }
  return {
    parts: draft.parts || {},
    degradedParts: draft.degradedParts || [],
    warnings: draft.warnings || []
  };
}

export function saveGenerationDraft(key: string, draft: GenerationDraft) {
  const store = getDraftStore();
  store[key] = { ...draft, updatedAt: Date.now() };
  saveDraftStore(store);
}

export function clearGenerationDraft(key: string) {
  if (!key) return;
  const store = getDraftStore();
  delete store[key];
  saveDraftStore(store);
}

export function countDraftParts(draft: GenerationDraft | null): number {
  return ["overview", "build", "practice"].filter((part) => draft?.parts?.[part as keyof typeof draft.parts]).length;
}

export function getHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") || [];
  } catch {
    return [];
  }
}

export function saveHistory(item: HistoryItem) {
  const list = getHistory();
  list.unshift(item);
  if (list.length > 20) list.length = 20;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

export function deleteHistoryItem(id: string) {
  const list = getHistory().filter((i) => i.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

export function getSaved(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]") || [];
  } catch {
    return [];
  }
}

export function saveToFavorites(item: HistoryItem) {
  const list = getSaved();
  if (!list.find((i) => i.id === item.id)) {
    list.unshift(item);
    if (list.length > 30) list.length = 30;
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  }
}

export function removeFromFavorites(id: string) {
  const list = getSaved().filter((i) => i.id !== id);
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
}

export const DEMO_LOADED_KEY = "makermind_demo_loaded";
