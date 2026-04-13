import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { wins } from "../../drizzle/schema";

export const winsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(wins).where(eq(wins.userId, ctx.user.id));
  }),

  create: protectedProcedure
    .input(z.object({
      id: z.string(),
      text: z.string(),
      iconIdx: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(wins).values({
        id: input.id,
        userId: ctx.user.id,
        text: input.text,
        iconIdx: input.iconIdx,
        archived: false,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      iconIdx: z.number().optional(),
      text: z.string().optional(),
      archived: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...rest } = input;
      const updateData: Record<string, unknown> = {};
      if (rest.iconIdx !== undefined) updateData.iconIdx = rest.iconIdx;
      if (rest.text !== undefined) updateData.text = rest.text;
      if (rest.archived !== undefined) updateData.archived = rest.archived;
      await db.update(wins)
        .set(updateData)
        .where(and(eq(wins.id, id), eq(wins.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(wins)
        .where(and(eq(wins.id, input.id), eq(wins.userId, ctx.user.id)));
      return { success: true };
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string(), archived: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(wins)
        .set({ archived: input.archived })
        .where(and(eq(wins.id, input.id), eq(wins.userId, ctx.user.id)));
      return { success: true };
    }),
});
