import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { agents } from "../../drizzle/schema";

export const agentsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(agents).where(eq(agents.userId, ctx.user.id));
  }),

  create: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
      task: z.string(),
      status: z.enum(["running", "paused", "done", "failed"]).default("running"),
      context: z.string().default("personal"),
      linkedTaskId: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(agents).values({
        id: input.id,
        userId: ctx.user.id,
        name: input.name,
        task: input.task,
        status: input.status,
        context: input.context,
        linkedTaskId: input.linkedTaskId ?? null,
        notes: input.notes ?? null,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      task: z.string().optional(),
      status: z.enum(["running", "paused", "done", "failed"]).optional(),
      context: z.string().optional(),
      linkedTaskId: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...rest } = input;
      const updateData: Record<string, unknown> = {};
      if (rest.name !== undefined) updateData.name = rest.name;
      if (rest.task !== undefined) updateData.task = rest.task;
      if (rest.status !== undefined) {
        updateData.status = rest.status;
        if (rest.status === "done" || rest.status === "failed") {
          updateData.endedAt = new Date();
        }
      }
      if (rest.context !== undefined) updateData.context = rest.context;
      if (rest.linkedTaskId !== undefined) updateData.linkedTaskId = rest.linkedTaskId;
      if (rest.notes !== undefined) updateData.notes = rest.notes;
      await db.update(agents)
        .set(updateData)
        .where(and(eq(agents.id, id), eq(agents.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(agents)
        .where(and(eq(agents.id, input.id), eq(agents.userId, ctx.user.id)));
      return { success: true };
    }),
});
