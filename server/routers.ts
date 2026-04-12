import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { aiRouter } from "./routers/ai";
import { tasksRouter } from "./routers/tasks";
import { winsRouter } from "./routers/wins";
import { goalsRouter } from "./routers/goals";
import { agentsRouter } from "./routers/agents";
import { brainDumpRouter } from "./routers/braindump";
import { logsRouter } from "./routers/logs";
import { profileRouter } from "./routers/profile";
import { aiChatRouter } from "./routers/aichat";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  ai: aiRouter,
  tasks: tasksRouter,
  wins: winsRouter,
  goals: goalsRouter,
  agents: agentsRouter,
  brainDump: brainDumpRouter,
  logs: logsRouter,
  profile: profileRouter,
  aiChat: aiChatRouter,
});

export type AppRouter = typeof appRouter;
