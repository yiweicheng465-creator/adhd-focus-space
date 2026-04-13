import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { ENV } from "../_core/env";

const KEY_TYPE_SCHEMA = z.enum(["openai", "manus"]).default("openai");

/** Resolve the correct validation URL based on key type */
function resolveValidationUrl(keyType: "openai" | "manus"): string {
  if (keyType === "openai") {
    return "https://api.openai.com/v1/chat/completions";
  }
  // User Manus keys go to forge.manus.im (the public API), NOT ENV.forgeApiUrl
  // ENV.forgeApiUrl = forge.manus.ai is the internal server endpoint for the built-in key only
  return "https://forge.manus.im/v1/chat/completions";
}

/** Resolve the correct model for validation based on key type */
function resolveValidationModel(keyType: "openai" | "manus"): string {
  if (keyType === "openai") return "gpt-4o-mini";
  return "gemini-2.5-flash";
}

export const profileRouter = router({
  // Get current user's display name
  getName: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { name: null };
    const rows = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.openId, ctx.user.openId))
      .limit(1);
    return { name: rows[0]?.name ?? null };
  }),

  // Save / update display name
  updateName: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(50).trim() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(users)
        .set({ name: input.name })
        .where(eq(users.openId, ctx.user.openId));
      return { success: true, name: input.name };
    }),

  // Get current user's API key (masked for display) + keyType
  getApiKey: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { hasKey: false, maskedKey: null, keyType: "openai" as const };
    const rows = await db
      .select({ apiKey: users.apiKey, keyType: users.keyType })
      .from(users)
      .where(eq(users.openId, ctx.user.openId))
      .limit(1);
    const key = rows[0]?.apiKey ?? null;
    const keyType = (rows[0]?.keyType ?? "openai") as "openai" | "manus";
    return {
      hasKey: !!key,
      maskedKey: key ? `${key.slice(0, 8)}...${key.slice(-4)}` : null,
      keyType,
    };
  }),

  // Validate an API key by making a minimal test call to the correct LLM endpoint
  validateApiKey: protectedProcedure
    .input(z.object({
      apiKey: z.string().min(1).max(512).trim(),
      keyType: KEY_TYPE_SCHEMA,
    }))
    .mutation(async ({ input }) => {
      // Manus keys cannot be validated via a simple test call — skip validation and trust the user
      if (input.keyType === "manus") return { valid: true };
      const apiUrl = resolveValidationUrl(input.keyType);
      const model = resolveValidationModel(input.keyType);
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${input.apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 5,
          }),
          signal: AbortSignal.timeout(10_000),
        });
        if (response.status === 401 || response.status === 403) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_API_KEY" });
        }
        // 429 = rate limit / quota — key is valid but has limits
        if (response.status === 429) return { valid: true };
        if (!response.ok) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `API_ERROR:${response.status}` });
        }
        return { valid: true };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "VALIDATION_FAILED" });
      }
    }),

  // Save / update user's personal API key + keyType
  updateApiKey: protectedProcedure
    .input(z.object({
      // Manus mode doesn't require a user key, so allow empty string
      apiKey: z.string().max(512).trim(),
      keyType: KEY_TYPE_SCHEMA,
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(users)
        .set({ apiKey: input.apiKey, keyType: input.keyType })
        .where(eq(users.openId, ctx.user.openId));
      return { success: true };
    }),

  // Test the currently saved API key by making a minimal LLM call
  testConnection: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db
      .select({ apiKey: users.apiKey, keyType: users.keyType })
      .from(users)
      .where(eq(users.openId, ctx.user.openId))
      .limit(1);
    const key = rows[0]?.apiKey?.trim();
    const keyType = (rows[0]?.keyType ?? "openai") as "openai" | "manus";
    if (!key) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "NO_API_KEY" });
    const apiUrl = resolveValidationUrl(keyType);
    const model = resolveValidationModel(keyType);
    const startMs = Date.now();
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "hi" }], max_tokens: 5 }),
        signal: AbortSignal.timeout(12_000),
      });
      const latencyMs = Date.now() - startMs;
      if (res.status === 401 || res.status === 403) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_API_KEY" });
      }
      if (res.status === 429) return { ok: true, latencyMs, note: "Rate limited but key is valid" };
      if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `API_ERROR:${res.status}` });
      return { ok: true, latencyMs, note: "Connection successful" };
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "CONNECTION_FAILED" });
    }
  }),

  // Get AI usage stats for the current user
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, thisMonth: 0, monthKey: null };
    const rows = await db
      .select({ aiCallsTotal: users.aiCallsTotal, aiCallsThisMonth: users.aiCallsThisMonth, aiCallsMonthKey: users.aiCallsMonthKey })
      .from(users)
      .where(eq(users.openId, ctx.user.openId))
      .limit(1);
    return {
      total: rows[0]?.aiCallsTotal ?? 0,
      thisMonth: rows[0]?.aiCallsThisMonth ?? 0,
      monthKey: rows[0]?.aiCallsMonthKey ?? null,
    };
  }),

  // Get which AI provider is active for the current user
  getAiProvider: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { provider: "manus" as const, hasOwnKey: false };
    const rows = await db
      .select({ apiKey: users.apiKey, keyType: users.keyType })
      .from(users)
      .where(eq(users.openId, ctx.user.openId))
      .limit(1);
    const key = rows[0]?.apiKey?.trim();
    const keyType = rows[0]?.keyType ?? "openai";
    const hasOwnKey = !!(key && keyType === "openai");
    return { provider: hasOwnKey ? ("openai" as const) : ("manus" as const), hasOwnKey };
  }),

  // Save name + API key together (used by the hello.exe setup modal)
  setupProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(50).trim(),
      apiKey: z.string().min(1).max(512).trim().optional(),
      keyType: KEY_TYPE_SCHEMA.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(users)
        .set({
          name: input.name,
          ...(input.apiKey ? { apiKey: input.apiKey, keyType: input.keyType ?? "openai" } : {}),
        })
        .where(eq(users.openId, ctx.user.openId));
      return { success: true, name: input.name };
    }),
});
