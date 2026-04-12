import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { goals } from "../../drizzle/schema";

export const goalsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(goals).where(eq(goals.userId, ctx.user.id));
  }),

  create: protectedProcedure
    .input(z.object({
      id: z.string(),
      text: z.string(),
      context: z.string().default("personal"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(goals).values({
        id: input.id,
        userId: ctx.user.id,
        text: input.text,
        context: input.context,
        progress: 0,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      text: z.string().optional(),
      progress: z.number().min(0).max(100).optional(),
      context: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...rest } = input;
      const updateData: Record<string, unknown> = {};
      if (rest.text !== undefined) updateData.text = rest.text;
      if (rest.progress !== undefined) updateData.progress = rest.progress;
      if (rest.context !== undefined) updateData.context = rest.context;
      await db.update(goals)
        .set(updateData)
        .where(and(eq(goals.id, id), eq(goals.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(goals)
        .where(and(eq(goals.id, input.id), eq(goals.userId, ctx.user.id)));
      return { success: true };
    }),
});
