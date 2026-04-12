import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { tasks } from "../../drizzle/schema";

export const tasksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(tasks).where(eq(tasks.userId, ctx.user.id));
  }),

  create: protectedProcedure
    .input(z.object({
      id: z.string(),
      text: z.string(),
      priority: z.enum(["focus", "urgent", "normal"]).default("normal"),
      context: z.string().default("personal"),
      goalId: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(tasks).values({
        id: input.id,
        userId: ctx.user.id,
        text: input.text,
        priority: input.priority,
        context: input.context,
        goalId: input.goalId ?? null,
        done: false,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      text: z.string().optional(),
      priority: z.enum(["focus", "urgent", "normal"]).optional(),
      context: z.string().optional(),
      done: z.boolean().optional(),
      goalId: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...rest } = input;
      const updateData: Record<string, unknown> = {};
      if (rest.text !== undefined) updateData.text = rest.text;
      if (rest.priority !== undefined) updateData.priority = rest.priority;
      if (rest.context !== undefined) updateData.context = rest.context;
      if (rest.done !== undefined) updateData.done = rest.done;
      if (rest.goalId !== undefined) updateData.goalId = rest.goalId;
      await db.update(tasks)
        .set(updateData)
        .where(and(eq(tasks.id, id), eq(tasks.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(tasks)
        .where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)));
      return { success: true };
    }),
});
