import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dailyLogs, focusSessions } from "../../drizzle/schema";

export const logsRouter = router({
  // ── Daily Logs ──────────────────────────────────────────────────────────────
  getDailyLogs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(dailyLogs).where(eq(dailyLogs.userId, ctx.user.id));
  }),

  upsertDailyLog: protectedProcedure
    .input(z.object({
      dateKey: z.string(),
      wrapUpDone: z.boolean().optional(),
      dumpCount: z.number().optional(),
      winsCount: z.number().optional(),
      tasksCompleted: z.number().optional(),
      mood: z.number().nullable().optional(),
      score: z.number().optional(),
      focusSessions: z.number().optional(),
      blocksCompleted: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { dateKey, ...rest } = input;

      // Check if a log already exists for this date
      const existing = await db.select().from(dailyLogs)
        .where(and(eq(dailyLogs.userId, ctx.user.id), eq(dailyLogs.dateKey, dateKey)))
        .limit(1);

      if (existing.length > 0) {
        const updateData: Record<string, unknown> = {};
        if (rest.wrapUpDone !== undefined) updateData.wrapUpDone = rest.wrapUpDone;
        if (rest.dumpCount !== undefined) updateData.dumpCount = rest.dumpCount;
        if (rest.winsCount !== undefined) updateData.winsCount = rest.winsCount;
        if (rest.tasksCompleted !== undefined) updateData.tasksCompleted = rest.tasksCompleted;
        if (rest.mood !== undefined) updateData.mood = rest.mood;
        if (rest.score !== undefined) updateData.score = rest.score;
        if (rest.focusSessions !== undefined) updateData.focusSessions = rest.focusSessions;
        if (rest.blocksCompleted !== undefined) updateData.blocksCompleted = rest.blocksCompleted;
        await db.update(dailyLogs)
          .set(updateData)
          .where(and(eq(dailyLogs.userId, ctx.user.id), eq(dailyLogs.dateKey, dateKey)));
      } else {
        await db.insert(dailyLogs).values({
          userId: ctx.user.id,
          dateKey,
          wrapUpDone: rest.wrapUpDone ?? false,
          dumpCount: rest.dumpCount ?? 0,
          winsCount: rest.winsCount ?? 0,
          tasksCompleted: rest.tasksCompleted ?? 0,
          mood: rest.mood ?? null,
          score: rest.score ?? 0,
          focusSessions: rest.focusSessions ?? 0,
          blocksCompleted: rest.blocksCompleted ?? 0,
        });
      }
      return { success: true };
    }),

  // ── Focus Sessions ──────────────────────────────────────────────────────────
  getFocusSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(focusSessions).where(eq(focusSessions.userId, ctx.user.id));
  }),

  addFocusSession: protectedProcedure
    .input(z.object({
      sessionNumber: z.number(),
      duration: z.number(),
      dateKey: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(focusSessions).values({
        userId: ctx.user.id,
        sessionNumber: input.sessionNumber,
        duration: input.duration,
        dateKey: input.dateKey,
      });
      return { success: true };
    }),

  // ── Mood ────────────────────────────────────────────────────────────────────
  // Mood is stored as part of daily_logs; this is a convenience endpoint
  getMood: protectedProcedure
    .input(z.object({ dateKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(dailyLogs)
        .where(and(eq(dailyLogs.userId, ctx.user.id), eq(dailyLogs.dateKey, input.dateKey)))
        .limit(1);
      return rows.length > 0 ? rows[0].mood : null;
    }),

  setMood: protectedProcedure
    .input(z.object({ dateKey: z.string(), mood: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const existing = await db.select().from(dailyLogs)
        .where(and(eq(dailyLogs.userId, ctx.user.id), eq(dailyLogs.dateKey, input.dateKey)))
        .limit(1);
      if (existing.length > 0) {
        await db.update(dailyLogs)
          .set({ mood: input.mood })
          .where(and(eq(dailyLogs.userId, ctx.user.id), eq(dailyLogs.dateKey, input.dateKey)));
      } else {
        await db.insert(dailyLogs).values({
          userId: ctx.user.id,
          dateKey: input.dateKey,
          mood: input.mood,
          wrapUpDone: false,
          dumpCount: 0,
          winsCount: 0,
          tasksCompleted: 0,
          score: 0,
          focusSessions: 0,
          blocksCompleted: 0,
        });
      }
      return { success: true };
    }),
});
