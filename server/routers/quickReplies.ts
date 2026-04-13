import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { quickReplies } from "../../drizzle/schema";

export const quickRepliesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(quickReplies)
      .where(eq(quickReplies.userId, ctx.user.id))
      .orderBy(asc(quickReplies.sortOrder), asc(quickReplies.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({
      id: z.string(),
      text: z.string().min(1).max(255),
      sortOrder: z.number().int().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(quickReplies).values({
        id: input.id,
        userId: ctx.user.id,
        text: input.text,
        sortOrder: input.sortOrder,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      text: z.string().min(1).max(255).optional(),
      sortOrder: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...rest } = input;
      if (Object.keys(rest).length === 0) return { success: true };
      await db
        .update(quickReplies)
        .set(rest)
        .where(and(eq(quickReplies.id, id), eq(quickReplies.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(quickReplies)
        .where(and(eq(quickReplies.id, input.id), eq(quickReplies.userId, ctx.user.id)));
      return { success: true };
    }),
});
