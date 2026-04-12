import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { brainDumpEntries } from "../../drizzle/schema";

export const brainDumpRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(brainDumpEntries)
      .where(eq(brainDumpEntries.userId, ctx.user.id));
    // Parse tags JSON string back to array
    return rows.map(r => ({ ...r, tags: JSON.parse(r.tags || "[]") as string[] }));
  }),

  create: protectedProcedure
    .input(z.object({
      id: z.string(),
      text: z.string(),
      tags: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(brainDumpEntries).values({
        id: input.id,
        userId: ctx.user.id,
        text: input.text,
        tags: JSON.stringify(input.tags),
        converted: false,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      text: z.string().optional(),
      tags: z.array(z.string()).optional(),
      converted: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...rest } = input;
      const updateData: Record<string, unknown> = {};
      if (rest.text !== undefined) updateData.text = rest.text;
      if (rest.tags !== undefined) updateData.tags = JSON.stringify(rest.tags);
      if (rest.converted !== undefined) updateData.converted = rest.converted;
      await db.update(brainDumpEntries)
        .set(updateData)
        .where(and(eq(brainDumpEntries.id, id), eq(brainDumpEntries.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(brainDumpEntries)
        .where(and(eq(brainDumpEntries.id, input.id), eq(brainDumpEntries.userId, ctx.user.id)));
      return { success: true };
    }),
});
