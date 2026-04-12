import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { aiMessages } from "../../drizzle/schema";

export const aiChatRouter = router({
  /** Load the last N messages for the current user */
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(100) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.userId, ctx.user.id))
        .orderBy(desc(aiMessages.createdAt))
        .limit(input.limit);
      // Return in chronological order (oldest first)
      return rows.reverse();
    }),

  /** Append a single message */
  append: protectedProcedure
    .input(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(32_000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(aiMessages).values({
        userId: ctx.user.id,
        role: input.role,
        content: input.content,
      });
      return { success: true };
    }),

  /** Clear all messages for the current user */
  clear: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(aiMessages).where(eq(aiMessages.userId, ctx.user.id));
      return { success: true };
    }),
});
