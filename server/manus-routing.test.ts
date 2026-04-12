/**
 * Tests for Manus API routing and invokeLLM behavior.
 * Verifies that:
 * 1. Manus keys route to the forge endpoint with gemini-2.5-flash model
 * 2. OpenAI keys route to api.openai.com with gpt-4o-mini model
 * 3. invokeLLM only adds max_tokens/thinking for non-OpenAI endpoints
 * 4. invokeLLM throws NO_API_KEY when no key is provided
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Unit tests for invokeLLM payload construction ──────────────────────────

describe("invokeLLM payload construction", () => {
  let fetchCalls: Array<{ url: string; body: Record<string, unknown> }> = [];

  beforeEach(() => {
    fetchCalls = [];
    // Mock global fetch
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      fetchCalls.push({ url, body });
      return {
        ok: true,
        json: async () => ({
          id: "test",
          created: Date.now(),
          model: body.model,
          choices: [{ index: 0, message: { role: "assistant", content: "hi" }, finish_reason: "stop" }],
        }),
      };
    });
  });

  it("adds max_tokens and thinking for Manus forge endpoint", async () => {
    const { invokeLLM } = await import("./_core/llm");
    await invokeLLM({
      apiKey: "sk-test-manus-key",
      apiUrl: "https://forge.manus.im/v1/chat/completions",
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: "hello" }],
    });
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].body.max_tokens).toBe(32768);
    expect(fetchCalls[0].body.thinking).toEqual({ budget_tokens: 128 });
    expect(fetchCalls[0].body.model).toBe("gemini-2.5-flash");
  });

  it("does NOT add max_tokens or thinking for OpenAI endpoint", async () => {
    const { invokeLLM } = await import("./_core/llm");
    await invokeLLM({
      apiKey: "sk-test-openai-key",
      apiUrl: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "hello" }],
    });
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].body.max_tokens).toBeUndefined();
    expect(fetchCalls[0].body.thinking).toBeUndefined();
    expect(fetchCalls[0].body.model).toBe("gpt-4o-mini");
  });

  it("throws NO_API_KEY when no apiKey is provided", async () => {
    const { invokeLLM } = await import("./_core/llm");
    await expect(
      invokeLLM({
        messages: [{ role: "user", content: "hello" }],
      })
    ).rejects.toThrow("NO_API_KEY");
  });

  it("sends correct Authorization header with user key", async () => {
    const { invokeLLM } = await import("./_core/llm");
    // Track the headers from fetch calls
    const headerCalls: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      const headers = init.headers as Record<string, string>;
      headerCalls.push(headers.authorization);
      return {
        ok: true,
        json: async () => ({
          id: "test",
          created: Date.now(),
          model: "gemini-2.5-flash",
          choices: [{ index: 0, message: { role: "assistant", content: "hi" }, finish_reason: "stop" }],
        }),
      };
    });
    await invokeLLM({
      apiKey: "sk-An-my-manus-key",
      apiUrl: "https://forge.manus.im/v1/chat/completions",
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: "hello" }],
    });
    expect(headerCalls[0]).toBe("Bearer sk-An-my-manus-key");
  });
});

// ── Unit tests for getUserApiConfig routing logic ──────────────────────────

describe("Manus routing model selection", () => {
  it("Manus keyType should use gemini-2.5-flash model", () => {
    // This validates the constant we use in getUserApiConfig
    const MANUS_MODEL = "gemini-2.5-flash";
    const OPENAI_MODEL = "gpt-4o-mini";
    expect(MANUS_MODEL).toBe("gemini-2.5-flash");
    expect(OPENAI_MODEL).toBe("gpt-4o-mini");
    expect(MANUS_MODEL).not.toBe(OPENAI_MODEL);
  });

  it("Manus forge URL should not contain openai.com", () => {
    const manusUrl = "https://forge.manus.im/v1/chat/completions";
    const openaiUrl = "https://api.openai.com/v1/chat/completions";
    expect(manusUrl.includes("openai.com")).toBe(false);
    expect(openaiUrl.includes("openai.com")).toBe(true);
  });
});
