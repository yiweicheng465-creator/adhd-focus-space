import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { ENV } from "../_core/env";

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

  // Get current user's API key (masked for display)
  getApiKey: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { hasKey: false, maskedKey: null };
    const rows = await db
      .select({ apiKey: users.apiKey })
      .from(users)
      .where(eq(users.openId, ctx.user.openId))
      .limit(1);
    const key = rows[0]?.apiKey ?? null;
    return {
      hasKey: !!key,
      maskedKey: key ? `${key.slice(0, 8)}...${key.slice(-4)}` : null,
    };
  }),

  // Validate an API key by making a minimal test call to the LLM endpoint
  validateApiKey: protectedProcedure
    .input(z.object({ apiKey: z.string().min(1).max(512).trim() }))
    .mutation(async ({ input }) => {
      const apiUrl = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
        ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
        : "https://forge.manus.im/v1/chat/completions";
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${input.apiKey}`,
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
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

  // Save / update user's personal API key
  updateApiKey: protectedProcedure
    .input(z.object({ apiKey: z.string().min(1).max(512).trim() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(users)
        .set({ apiKey: input.apiKey })
        .where(eq(users.openId, ctx.user.openId));
      return { success: true };
    }),

  // Save name + API key together (used by the hello.exe setup modal)
  setupProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(50).trim(),
      apiKey: z.string().min(1).max(512).trim().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(users)
        .set({
          name: input.name,
          ...(input.apiKey ? { apiKey: input.apiKey } : {}),
        })
        .where(eq(users.openId, ctx.user.openId));
      return { success: true, name: input.name };
    }),
});
