/* ============================================================
   AI Router — ADHD Focus Space
   5 AI features, all calling invokeLLM server-side
   ============================================================ */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

/* ── Shared ADHD-aware system prompt ── */
const ADHD_SYSTEM = `You are a warm, non-judgmental ADHD coach embedded in a focus app.
Your responses are:
- Brief and actionable (ADHD users don't need walls of text)
- Encouraging without being patronising
- Specific, not generic
- Written in plain language, no jargon
Always respond in the same language the user writes in.`;

/* ── 1. Brain Dump Categoriser ── */
const brainDumpCategoriseInput = z.object({
  entries: z.array(z.string()).min(1).max(50),
});

const CATEGORY_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "brain_dump_categories",
    strict: true,
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              original: { type: "string", description: "The original entry text" },
              category: {
                type: "string",
                enum: ["task", "worry", "idea", "reminder", "other"],
                description: "Category of the entry",
              },
              action: {
                type: "string",
                enum: ["add_to_tasks", "archive", "keep"],
                description: "Suggested action: add_to_tasks for actionable items, archive for worries/venting, keep for ideas/reminders",
              },
              rewritten: {
                type: "string",
                description: "If category is task, rewrite as a clear actionable task (verb + object). Otherwise same as original.",
              },
              emoji: { type: "string", description: "A single relevant emoji" },
            },
            required: ["original", "category", "action", "rewritten", "emoji"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
};

/* ── 2. Daily AI Summary ── */
const dailySummaryInput = z.object({
  date: z.string(),
  wins: z.array(z.string()),
  tasksCompleted: z.array(z.string()),
  tasksPending: z.array(z.string()),
  dumpEntries: z.array(z.string()),
  focusSessions: z.number(),
  blocksCompleted: z.number(),
  mood: z.number().nullable(),
  quitCount: z.number(),
});

/* ── 3. Focus Session Micro-Reflection ── */
const focusReflectionInput = z.object({
  phase: z.enum(["before", "after"]),
  sessionNumber: z.number(),
  intention: z.string().optional(), // what they planned to do (for "after")
  outcome: z.string().optional(),   // what they actually did (for "after")
  blocksCompleted: z.number().optional(),
});

/* ── 4. Monthly AI Review ── */
const monthlyReviewInput = z.object({
  month: z.string(), // e.g. "April 2026"
  totalDays: z.number(),
  activeDays: z.number(),
  wrapUpDays: z.number(),
  totalWins: z.number(),
  totalFocusSessions: z.number(),
  totalBlocks: z.number(),
  totalTasks: z.number(),
  avgMood: z.number().nullable(),
  streakMax: z.number(),
  bestWeek: z.string().optional(),
  lowestScoreDay: z.string().optional(),
  topWins: z.array(z.string()),
});

/* ── 5. MIT (Most Important Task) Morning Suggestion ── */
const mitSuggestionInput = z.object({
  pendingTasks: z.array(z.object({
    text: z.string(),
    priority: z.string(),
    context: z.string(),
    createdAt: z.string(),
  })),
  goals: z.array(z.object({
    text: z.string(),
    progress: z.number(),
    context: z.string(),
  })),
  mood: z.number().nullable(),
  focusSessionsToday: z.number(),
});

const MIT_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "mit_suggestion",
    strict: true,
    schema: {
      type: "object",
      properties: {
        mit: { type: "string", description: "The single most important task to focus on today" },
        reason: { type: "string", description: "One sentence explaining why this task was chosen" },
        warmup: { type: "string", description: "A tiny 2-minute warmup action to start momentum on the MIT" },
        encouragement: { type: "string", description: "A brief (1 sentence) personalised encouragement for the day" },
      },
      required: ["mit", "reason", "warmup", "encouragement"],
      additionalProperties: false,
    },
  },
};

export const aiRouter = router({

  /* ── 1. Brain Dump Categorise ── */
  categorizeDump: publicProcedure
    .input(brainDumpCategoriseInput)
    .mutation(async ({ input }) => {
      const entriesList = input.entries.map((e, i) => `${i + 1}. ${e}`).join("\n");
      const result = await invokeLLM({
        messages: [
          { role: "system", content: ADHD_SYSTEM },
          {
            role: "user",
            content: `Categorise these brain dump entries. For each one, decide if it's a task (actionable), worry (emotional/venting), idea, reminder, or other. If it's a task, rewrite it as a clear action.\n\nEntries:\n${entriesList}`,
          },
        ],
        response_format: CATEGORY_SCHEMA,
      });
      const rawContent = result.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) throw new Error("No response from AI");
      return JSON.parse(content) as {
        items: Array<{
          original: string;
          category: "task" | "worry" | "idea" | "reminder" | "other";
          action: "add_to_tasks" | "archive" | "keep";
          rewritten: string;
          emoji: string;
        }>;
      };
    }),

  /* ── 2. Daily Summary ── */
  dailySummary: publicProcedure
    .input(dailySummaryInput)
    .mutation(async ({ input }) => {
      const moodLabels = ["Drained", "Low", "Okay", "Good", "Glowing"];
      const moodStr = input.mood ? moodLabels[input.mood - 1] : "not recorded";
      const prompt = `Generate a warm, personal end-of-day summary for an ADHD user.

Date: ${input.date}
Mood: ${moodStr}
Focus sessions completed: ${input.focusSessions}
Deep focus blocks: ${input.blocksCompleted}
Times quit timer early: ${input.quitCount}
Wins today (${input.wins.length}): ${input.wins.slice(0, 5).join(", ") || "none"}
Tasks completed (${input.tasksCompleted.length}): ${input.tasksCompleted.slice(0, 5).join(", ") || "none"}
Tasks still pending: ${input.tasksPending.length}
Brain dump entries: ${input.dumpEntries.length}

Write 3-4 sentences that:
1. Acknowledge what they actually did (be specific, not generic)
2. Gently note one thing to carry into tomorrow
3. End with a genuine, non-cheesy closing thought

Keep it under 80 words. Warm, human, not corporate.`;

      const result = await invokeLLM({
        messages: [
          { role: "system", content: ADHD_SYSTEM },
          { role: "user", content: prompt },
        ],
      });
      const summary = result.choices[0]?.message?.content ?? "";
      return { summary };
    }),

  /* ── 3. Focus Micro-Reflection ── */
  focusReflection: publicProcedure
    .input(focusReflectionInput)
    .mutation(async ({ input }) => {
      let prompt = "";
      if (input.phase === "before") {
        prompt = `An ADHD user is about to start focus session #${input.sessionNumber}. 
Ask them ONE simple question to set their intention for this session. 
Make it feel like a friendly nudge, not a form. Max 15 words.`;
      } else {
        prompt = `An ADHD user just finished focus session #${input.sessionNumber}.
Their intention was: "${input.intention || "not set"}"
What they actually did: "${input.outcome || "not shared"}"
${input.blocksCompleted ? `They've completed ${input.blocksCompleted} full deep focus blocks today!` : ""}

Give them a 1-2 sentence reflection: acknowledge what happened (even if they went off-track), and one micro-insight or encouragement. Max 30 words.`;
      }

      const result = await invokeLLM({
        messages: [
          { role: "system", content: ADHD_SYSTEM },
          { role: "user", content: prompt },
        ],
      });
      const message = result.choices[0]?.message?.content ?? "";
      return { message, phase: input.phase };
    }),

  /* ── 4. Monthly Review ── */
  monthlyReview: publicProcedure
    .input(monthlyReviewInput)
    .mutation(async ({ input }) => {
      const moodLabels = ["Drained", "Low", "Okay", "Good", "Glowing"];
      const avgMoodStr = input.avgMood
        ? `${moodLabels[Math.round(input.avgMood) - 1]} (${input.avgMood.toFixed(1)}/5)`
        : "not tracked";

      const prompt = `Write a monthly review for an ADHD user for ${input.month}.

Stats:
- Active days: ${input.activeDays}/${input.totalDays}
- Days with wrap-up: ${input.wrapUpDays}
- Total wins logged: ${input.totalWins}
- Focus sessions: ${input.totalFocusSessions}
- Deep focus blocks: ${input.totalBlocks}
- Tasks completed: ${input.totalTasks}
- Average mood: ${avgMoodStr}
- Longest streak: ${input.streakMax} days
${input.topWins.length > 0 ? `- Top wins: ${input.topWins.slice(0, 3).join(", ")}` : ""}

Write a 4-5 sentence review that:
1. Celebrates what went well (be specific with the numbers)
2. Identifies one pattern or insight (e.g. "your best days had X in common")
3. Suggests ONE concrete thing to try next month
4. Ends with genuine encouragement

Keep it under 120 words. Sound like a coach who actually read the data, not a template.`;

      const result = await invokeLLM({
        messages: [
          { role: "system", content: ADHD_SYSTEM },
          { role: "user", content: prompt },
        ],
      });
      const review = result.choices[0]?.message?.content ?? "";
      return { review };
    }),

  /* ── 5. MIT Morning Suggestion ── */
  mitSuggestion: publicProcedure
    .input(mitSuggestionInput)
    .mutation(async ({ input }) => {
      const taskList = input.pendingTasks
        .slice(0, 15)
        .map((t, i) => `${i + 1}. [${t.priority}] ${t.text} (${t.context})`)
        .join("\n");
      const goalList = input.goals
        .slice(0, 5)
        .map((g, i) => `${i + 1}. ${g.text} — ${g.progress}% done`)
        .join("\n");
      const moodLabels = ["Drained", "Low", "Okay", "Good", "Glowing"];
      const moodStr = input.mood ? moodLabels[input.mood - 1] : "unknown";

      const prompt = `An ADHD user is starting their day. Help them pick ONE most important task.

Current mood: ${moodStr}
Focus sessions done today: ${input.focusSessionsToday}

Pending tasks:
${taskList || "No tasks yet"}

Active goals:
${goalList || "No goals set"}

Pick the single most important task they should focus on today. Consider urgency, goal alignment, and their current mood/energy. Return structured JSON.`;

      const result = await invokeLLM({
        messages: [
          { role: "system", content: ADHD_SYSTEM },
          { role: "user", content: prompt },
        ],
        response_format: MIT_SCHEMA,
      });
      const rawContent2 = result.choices[0]?.message?.content;
      const content = typeof rawContent2 === "string" ? rawContent2 : null;
      if (!content) throw new Error("No response from AI");
      return JSON.parse(content) as {
        mit: string;
        reason: string;
        warmup: string;
        encouragement: string;
      };
    }),
});
