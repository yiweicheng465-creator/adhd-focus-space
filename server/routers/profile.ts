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
});
