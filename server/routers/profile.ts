import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

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
