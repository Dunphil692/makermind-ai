import test from "node:test";
import assert from "node:assert/strict";
import { handleApiRequest } from "../src/api.js";
import {
  handleDialogueTaskBrief,
  handleGenerateInstructionPart,
  handleStructureSession
} from "../src/ai.js";

const expectedBody = {
  error: "AI 功能已暂停",
  code: "AI_FEATURES_PAUSED",
  detail: "MakerMind AI 的模型调用目前已暂停。"
};

test("AI routes and handlers default to paused without calling upstream", async () => {
  const originalFetch = globalThis.fetch;
  let upstreamCalls = 0;
  globalThis.fetch = async () => {
    upstreamCalls += 1;
    throw new Error("upstream fetch must not run");
  };

  try {
    const paths = [
      "/api/dialogue-task-brief",
      "/api/generate-instruction-part",
      "/api/sessions/structure",
      "/api/generate-projects",
      "/api/generate-instruction"
    ];
    for (const path of paths) {
      const response = await handleApiRequest(new Request(`https://example.com${path}`, { method: "POST" }), {});
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), expectedBody);
    }

    const handlers = [handleDialogueTaskBrief, handleGenerateInstructionPart, handleStructureSession];
    for (const handler of handlers) {
      const response = await handler(new Request("https://example.com/api/test", { method: "POST" }), {});
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), expectedBody);
    }

    assert.equal(upstreamCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("non-AI health endpoint remains available and reports paused state", async () => {
  const response = await handleApiRequest(new Request("https://example.com/api/health"), {});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ai.paused, true);
});
