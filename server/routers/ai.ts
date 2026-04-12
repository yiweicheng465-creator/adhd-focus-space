/* ============================================================
   AI Router — ADHD Focus Space
   5 AI features, all calling invokeLLM server-side
   ============================================================ */

import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { ENV } from "../_core/env";

/** Fetch the user's personal API key + routing config from the DB.
 * Throws a TRPCError if the user has not set one — never falls back to the server key. */
async function getUserApiConfig(openId: string): Promise<{ apiKey: string; apiUrl: string; model: string }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "NO_API_KEY" });
  const rows = await db
    .select({ apiKey: users.apiKey, keyType: users.keyType })
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  const key = rows[0]?.apiKey?.trim();
  if (!key) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "NO_API_KEY" });
  const keyType = rows[0]?.keyType ?? "openai";
  if (keyType === "openai") {
    return { apiKey: key, apiUrl: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" };
  }
  // Manus key — use forge endpoint
  const apiUrl = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";
  return { apiKey: key, apiUrl, model: "gemini-2.5-flash" };
}

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
                enum: ["task", "goal", "worry", "idea", "reminder", "other"],
                description: "Category of the entry: task=actionable single step, goal=bigger aspiration or outcome to achieve over time, worry=emotional/venting, idea=creative thought, reminder=time-based, other=misc",
              },
              action: {
                type: "string",
                enum: ["add_to_tasks", "add_to_goals", "archive", "keep"],
                description: "Suggested action: add_to_tasks for single actionable items, add_to_goals for bigger aspirations or multi-step outcomes, archive for worries/venting, keep for ideas/reminders",
              },
              rewritten: {
                type: "string",
                description: "If category is task, rewrite as a clear actionable task (verb + object). If category is goal, rewrite as a clear goal statement. Otherwise same as original.",
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
  categorizeDump: protectedProcedure
    .input(brainDumpCategoriseInput)
    .mutation(async ({ ctx, input }) => {
      const { apiKey, apiUrl, model } = await getUserApiConfig(ctx.user.openId);
      const entriesList = input.entries.map((e, i) => `${i + 1}. ${e}`).join("\n");
      const result = await invokeLLM({
        apiKey,
        apiUrl,
        model,
        messages: [
          { role: "system", content: ADHD_SYSTEM },
          {
            role: "user",
            content: `Categorise these brain dump entries. For each one, decide the best category:\n- task: a single, clearly actionable step that needs to be done (rewrite as clear verb+object, action: add_to_tasks)\n- goal: an explicit aspiration or multi-step outcome the user wants to achieve (rewrite as a clear goal statement, action: add_to_goals)\n- worry: emotional venting or anxiety (action: archive)\n- idea: a creative thought, concept, inspiration, or standalone thought that is NOT explicitly actionable right now — keep it as an idea (action: keep). Do NOT convert ideas into tasks or goals.\n- reminder: time-based or logistical note (action: keep)\n- other: anything else (action: keep)\n\nIMPORTANT: When in doubt, prefer 'idea' over 'task' or 'goal'. Only use 'task' if the entry is a clear single action step. Only use 'goal' if the entry explicitly states an aspiration to achieve.\n\nEntries:\n${entriesList}`,
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
          category: "task" | "goal" | "worry" | "idea" | "reminder" | "other";
          action: "add_to_tasks" | "add_to_goals" | "archive" | "keep";
          rewritten: string;
          emoji: string;
        }>;
      };
    }),

  /* ── 2. Daily Summary ── */
  dailySummary: protectedProcedure
    .input(dailySummaryInput)
    .mutation(async ({ ctx, input }) => {
      const { apiKey, apiUrl, model } = await getUserApiConfig(ctx.user.openId);
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
        apiKey,
        apiUrl,
        model,
        messages: [
          { role: "system", content: ADHD_SYSTEM },
          { role: "user", content: prompt },
        ],
      });
      const summary = result.choices[0]?.message?.content ?? "";
      return { summary };
    }),

  /* ── 3. Focus Micro-Reflection ── */
  focusReflection: protectedProcedure
    .input(focusReflectionInput)
    .mutation(async ({ ctx, input }) => {
      const { apiKey, apiUrl, model } = await getUserApiConfig(ctx.user.openId);
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
        apiKey,
        apiUrl,
        model,
        messages: [
          { role: "system", content: ADHD_SYSTEM },
          { role: "user", content: prompt },
        ],
      });
      const message = result.choices[0]?.message?.content ?? "";
      return { message, phase: input.phase };
    }),

  /* ── 4. Monthly Review ── */
  monthlyReview: protectedProcedure
    .input(monthlyReviewInput)
    .mutation(async ({ ctx, input }) => {
      const { apiKey, apiUrl, model } = await getUserApiConfig(ctx.user.openId);
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
        apiKey,
        apiUrl,
        model,
        messages: [
          { role: "system", content: ADHD_SYSTEM },
          { role: "user", content: prompt },
        ],
      });
      const review = result.choices[0]?.message?.content ?? "";
      return { review };
    }),

  /* ── 6. Create Agent Brief ── */
  createAgentBrief: protectedProcedure
    .input(z.object({
      taskText: z.string(),
      context: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { apiKey, apiUrl, model } = await getUserApiConfig(ctx.user.openId);
      const result = await invokeLLM({
        apiKey,
        apiUrl,
        model,
        messages: [
          { role: "system", content: ADHD_SYSTEM },
          {
            role: "user",
            content: `Generate a concise AI agent name and a ready-to-paste prompt for this task: "${input.taskText}" (context: ${input.context}).

Return JSON with:
- name: short agent name (3-5 words, action-oriented, e.g. "API Review Checker")
- brief: a first-person prompt the user will paste directly into an AI agent. Start with "Help me..." and be specific and actionable (2-4 sentences). Include what to check, what to produce, and any key constraints.
- firstStep: leave this as an empty string ""`,
          },
        ],
        response_format: {
          type: "json_schema" as const,
          json_schema: {
            name: "agent_brief",
            strict: true,
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                brief: { type: "string" },
                firstStep: { type: "string" },
              },
              required: ["name", "brief", "firstStep"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = result.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) throw new Error("No response from AI");
      return JSON.parse(content) as { name: string; brief: string; firstStep: string };
    }),

  /* ── 6. Dashboard Chat ── */
  chat: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).min(1).max(40),
      // Optional context so the AI can give personalised replies
      taskCount: z.number().optional(),
      focusSessions: z.number().optional(),
      mood: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { apiKey, apiUrl, model } = await getUserApiConfig(ctx.user.openId);
      const moodLabels = ["Drained", "Low", "Okay", "Good", "Glowing"];
      const contextNote = [
        input.taskCount != null ? `Active tasks: ${input.taskCount}` : "",
        input.focusSessions ? `Focus sessions today: ${input.focusSessions}` : "",
        input.mood ? `Current mood: ${moodLabels[input.mood - 1]}` : "",
      ].filter(Boolean).join(" | ");

      const systemPrompt = `${ADHD_SYSTEM}${contextNote ? `\n\nUser context: ${contextNote}` : ""}`;

      const result = await invokeLLM({
        apiKey,
        apiUrl,
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...input.messages,
        ],
      });
      const reply = result.choices[0]?.message?.content;
      if (!reply || typeof reply !== "string") throw new Error("No response from AI");
      return { reply };
    }),

  /* ── 5. MIT Morning Suggestion ── */
  mitSuggestion: protectedProcedure
    .input(mitSuggestionInput)
    .mutation(async ({ ctx, input }) => {
      const { apiKey, apiUrl, model } = await getUserApiConfig(ctx.user.openId);
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
        apiKey,
        apiUrl,
        model,
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

  /* ── 7. AI Command Center ── */
  command: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).min(1).max(40),
      tasks: z.array(z.object({
        id: z.string(),
        text: z.string(),
        priority: z.enum(["focus", "urgent", "normal", "someday"]),
        context: z.string(),
        done: z.boolean(),
      })).optional(),
      goals: z.array(z.object({
        id: z.string(),
        text: z.string(),
        progress: z.number(),
        context: z.string(),
      })).optional(),
      agents: z.array(z.object({
        id: z.string(),
        name: z.string(),
        task: z.string(),
        status: z.string(),
        context: z.string(),
      })).optional(),
      focusSessions: z.number().optional(),
      mood: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { apiKey, apiUrl, model } = await getUserApiConfig(ctx.user.openId);
      const moodLabels = ["Drained", "Low", "Okay", "Good", "Glowing"];
      const taskSummary = (input.tasks ?? []).filter(t => !t.done).slice(0, 10)
        .map(t => `- [${t.priority}] ${t.text} (${t.context})`).join("\n");
      const goalSummary = (input.goals ?? []).slice(0, 5)
        .map(g => `- ${g.text} (${g.progress}% done, ${g.context})`).join("\n");
      const agentSummary = (input.agents ?? []).filter(a => a.status !== "done").slice(0, 5)
        .map(a => `- ${a.name}: ${a.task} [${a.status}]`).join("\n");

      const systemPrompt = `${ADHD_SYSTEM}

You are also an AI command assistant. The user can ask you to:
- Create tasks (e.g. "add task review PR urgent work")
- Complete/delete tasks (e.g. "mark review PR as done", "delete that task")
- Create goals (e.g. "set a goal to ship the feature by Friday")
- Create AI agents (e.g. "create an agent to research competitors")
- Log wins (e.g. "log a win: finished the design")
- Answer questions, give advice, prioritise, or coach them

Current app state:
Active tasks:
${taskSummary || "No active tasks"}
Goals:
${goalSummary || "No goals set"}
Agents:
${agentSummary || "No active agents"}
Focus sessions today: ${input.focusSessions ?? 0}
Mood: ${input.mood ? moodLabels[input.mood - 1] : "Not set"}

When the user wants to perform an action, respond with a friendly confirmation message AND include a JSON action block at the very end of your response in this exact format (raw JSON, no code fences):
ACTION:{"type":"...","payload":{...}}

Supported action types and payloads:
- create_task: {"text":"...","priority":"focus|urgent|normal","context":"work|personal|..."}
- complete_task: {"id":"...","text":"..."}
- delete_task: {"id":"...","text":"..."}
- create_goal: {"text":"...","context":"work|personal|..."}
- create_agent: {"name":"...","task":"...","context":"work|personal|..."}
- log_win: {"text":"..."}
- none: {}

Only include the ACTION line when performing an action. For pure conversation, omit it entirely.`;

      const result = await invokeLLM({
        apiKey,
        apiUrl,
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...input.messages,
        ],
      });
      const raw = result.choices[0]?.message?.content;
      if (!raw || typeof raw !== "string") throw new Error("No response from AI");

      // Parse out the ACTION line if present
      const actionMatch = raw.match(/^ACTION:(\{.*\})$/m);
      const reply = raw.replace(/^ACTION:\{.*\}$/m, "").trim();
      let action: { type: string; payload: Record<string, unknown> } | null = null;
      if (actionMatch) {
        try { action = JSON.parse(actionMatch[1]); } catch { action = null; }
      }
      return { reply, action };
    }),
});
