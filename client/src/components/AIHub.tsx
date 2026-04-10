/* ============================================================
   ADHD FOCUS SPACE — AI Hub Page
   5 AI features, each with a description card + live demo
   ============================================================ */

import { useState } from "react";
import { Loader2, Sparkles, Brain, Clock, CalendarDays, Target, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

const M = {
  ink: "oklch(0.18 0.01 60)",
  muted: "oklch(0.52 0.015 70)",
  border: "oklch(0.87 0.014 75)",
  accent: "oklch(0.52 0.14 35)",
  bg: "oklch(0.985 0.008 80)",
  card: "oklch(0.975 0.012 80)",
};

/* ── Feature card shell ── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-6 flex flex-col gap-4"
      style={{ background: M.bg, border: `1px solid ${M.border}` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 flex items-center justify-center shrink-0"
          style={{ background: "oklch(0.52 0.14 35 / 0.10)", border: `1px solid oklch(0.52 0.14 35 / 0.25)` }}
        >
          <Icon className="w-4 h-4" style={{ color: M.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold" style={{ color: M.ink, fontFamily: "'Playfair Display', serif" }}>
              {title}
            </h3>
            <span
              className="text-[9px] font-bold tracking-widest px-1.5 py-0.5"
              style={{
                background: "oklch(0.52 0.14 35 / 0.12)",
                color: M.accent,
                fontFamily: "'JetBrains Mono', monospace",
                border: `1px solid oklch(0.52 0.14 35 / 0.25)`,
              }}
            >
              {badge}
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            {description}
          </p>
        </div>
      </div>
      <div
        className="p-4"
        style={{ background: "oklch(0.96 0.010 78)", border: `1px solid ${M.border}` }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── 1. Brain Dump Categoriser demo ── */
function BrainDumpDemo() {
  const [input, setInput] = useState("Need to call dentist\nWorried about the presentation tomorrow\nIdea: build a habit tracker\nPick up groceries");
  const [result, setResult] = useState<Array<{ original: string; category: string; action: string; rewritten: string; emoji: string }> | null>(null);
  const mutation = trpc.ai.categorizeDump.useMutation({
    onSuccess: (data) => setResult(data.items),
  });

  const CATEGORY_COLORS: Record<string, string> = {
    task: "oklch(0.40 0.12 155)",
    worry: "oklch(0.50 0.10 30)",
    idea: "oklch(0.50 0.12 270)",
    reminder: "oklch(0.45 0.10 60)",
    other: M.muted,
  };

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 text-xs bg-transparent resize-none focus:outline-none"
        style={{ border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
        placeholder="Paste your brain dump entries, one per line…"
      />
      <button
        onClick={() => {
          const entries = input.split("\n").map((l) => l.trim()).filter(Boolean);
          if (entries.length) mutation.mutate({ entries });
        }}
        disabled={mutation.isPending}
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium self-start transition-all hover:opacity-90"
        style={{ background: M.accent, color: "white", fontFamily: "'DM Sans', sans-serif" }}
      >
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        Categorise with AI
      </button>
      {result && (
        <div className="flex flex-col gap-2 mt-1">
          {result.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <span>{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <span style={{ color: CATEGORY_COLORS[item.category] ?? M.muted, fontWeight: 600, textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.05em" }}>
                  {item.category}
                </span>
                <span style={{ color: M.muted }}> · </span>
                <span style={{ color: M.ink }}>{item.rewritten || item.original}</span>
              </div>
              <span
                className="shrink-0 text-[9px] px-1.5 py-0.5"
                style={{
                  background: item.action === "add_to_tasks" ? "oklch(0.40 0.12 155 / 0.12)" : "oklch(0.88 0.012 75)",
                  color: item.action === "add_to_tasks" ? "oklch(0.40 0.12 155)" : M.muted,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {item.action.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 2. Daily Summary demo ── */
function DailySummaryDemo() {
  const [result, setResult] = useState<string | null>(null);
  const mutation = trpc.ai.dailySummary.useMutation({
    onSuccess: (data) => setResult(typeof data.summary === "string" ? data.summary : ""),
  });

  const runDemo = () => {
    mutation.mutate({
      date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
      mood: 3,
      focusSessions: 2,
      blocksCompleted: 1,
      quitCount: 1,
      wins: ["Finished the report", "Replied to all emails"],
      tasksCompleted: ["Review proposal", "Team standup"],
      tasksPending: ["Update docs", "Fix bug"],
      dumpEntries: ["Worried about deadline", "Idea: automate testing"],
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
        Generates a personalised end-of-day summary from your actual data. Appears in the Wrap-up panel.
      </p>
      <button
        onClick={runDemo}
        disabled={mutation.isPending}
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium self-start transition-all hover:opacity-90"
        style={{ background: M.accent, color: "white", fontFamily: "'DM Sans', sans-serif" }}
      >
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        Generate sample summary
      </button>
      {result && (
        <p className="text-sm leading-relaxed italic" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
          "{result}"
        </p>
      )}
    </div>
  );
}

/* ── 3. Focus Reflection demo ── */
function FocusReflectionDemo() {
  const [phase, setPhase] = useState<"before" | "after">("before");
  const [intention, setIntention] = useState("");
  const [outcome, setOutcome] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const mutation = trpc.ai.focusReflection.useMutation({
    onSuccess: (data) => setResult(typeof data.message === "string" ? data.message : ""),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(["before", "after"] as const).map((p) => (
          <button
            key={p}
            onClick={() => { setPhase(p); setResult(null); }}
            className="px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              background: phase === p ? M.accent : "transparent",
              color: phase === p ? "white" : M.muted,
              border: `1px solid ${phase === p ? M.accent : M.border}`,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {p === "before" ? "Before session" : "After session"}
          </button>
        ))}
      </div>
      {phase === "after" && (
        <div className="flex flex-col gap-2">
          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="What was your intention?"
            className="px-3 py-2 text-xs bg-transparent focus:outline-none"
            style={{ border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
          />
          <input
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="What actually happened?"
            className="px-3 py-2 text-xs bg-transparent focus:outline-none"
            style={{ border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>
      )}
      <button
        onClick={() => mutation.mutate({ phase, sessionNumber: 1, intention, outcome, blocksCompleted: 0 })}
        disabled={mutation.isPending}
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium self-start transition-all hover:opacity-90"
        style={{ background: M.accent, color: "white", fontFamily: "'DM Sans', sans-serif" }}
      >
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        Get AI reflection
      </button>
      {result && (
        <p className="text-sm leading-relaxed" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
          {result}
        </p>
      )}
    </div>
  );
}

/* ── 4. Monthly Review demo ── */
function MonthlyReviewDemo() {
  const [result, setResult] = useState<string | null>(null);
  const mutation = trpc.ai.monthlyReview.useMutation({
    onSuccess: (data) => setResult(typeof data.review === "string" ? data.review : ""),
  });

  const runDemo = () => {
    const now = new Date();
    mutation.mutate({
      month: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      activeDays: 18,
      totalDays: now.getDate(),
      wrapUpDays: 12,
      totalWins: 34,
      totalFocusSessions: 27,
      totalBlocks: 8,
      totalTasks: 45,
      avgMood: 3.4,
      streakMax: 5,
      topWins: ["Shipped the new feature", "Ran 3 times", "Finished the book"],
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
        Reads your full month of data and writes a personalised review. Available on the Monthly page.
      </p>
      <button
        onClick={runDemo}
        disabled={mutation.isPending}
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium self-start transition-all hover:opacity-90"
        style={{ background: M.accent, color: "white", fontFamily: "'DM Sans', sans-serif" }}
      >
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        Generate sample review
      </button>
      {result && (
        <p className="text-sm leading-relaxed" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
          {result}
        </p>
      )}
    </div>
  );
}

/* ── 5. MIT Suggestion demo ── */
function MITDemo() {
  const [result, setResult] = useState<{ mit: string; reason: string; warmup: string; encouragement: string } | null>(null);
  const mutation = trpc.ai.mitSuggestion.useMutation({
    onSuccess: (data) => setResult(data),
  });

  const runDemo = () => {
    mutation.mutate({
      pendingTasks: [
        { text: "Fix critical bug in production", priority: "urgent", context: "work", createdAt: new Date().toISOString() },
        { text: "Reply to client emails", priority: "focus", context: "work", createdAt: new Date().toISOString() },
        { text: "Go for a 20-minute walk", priority: "normal", context: "personal", createdAt: new Date().toISOString() },
        { text: "Update project documentation", priority: "normal", context: "work", createdAt: new Date().toISOString() },
      ],
      goals: [
        { text: "Ship v2 of the app", progress: 60, context: "work" },
        { text: "Exercise 3x per week", progress: 33, context: "personal" },
      ],
      mood: 3,
      focusSessionsToday: 0,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
        Picks the single most important task based on your tasks, goals, and mood. Shown at the end of morning check-in.
      </p>
      <button
        onClick={runDemo}
        disabled={mutation.isPending}
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium self-start transition-all hover:opacity-90"
        style={{ background: M.accent, color: "white", fontFamily: "'DM Sans', sans-serif" }}
      >
        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        Pick my MIT
      </button>
      {result && (
        <div className="flex flex-col gap-2">
          <div
            className="p-3"
            style={{ background: "oklch(0.52 0.14 35 / 0.08)", border: "1px solid oklch(0.52 0.14 35 / 0.25)" }}
          >
            <p className="text-xs font-bold mb-1" style={{ color: M.accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>
              MOST IMPORTANT THING
            </p>
            <p className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
              {result.mit}
            </p>
          </div>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: M.ink, fontWeight: 600 }}>Why:</span> {result.reason}
          </p>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: M.ink, fontWeight: 600 }}>Warm-up:</span> {result.warmup}
          </p>
          <p className="text-xs italic" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            {result.encouragement}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Main AI Hub ── */
export function AIHub() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 flex items-center justify-center"
          style={{ background: "oklch(0.52 0.14 35 / 0.10)", border: "1px solid oklch(0.52 0.14 35 / 0.25)" }}
        >
          <Sparkles className="w-4 h-4" style={{ color: M.accent }} />
        </div>
        <div>
          <h2
            className="text-base font-bold italic"
            style={{ fontFamily: "'Playfair Display', serif", color: M.ink }}
          >
            AI Features
          </h2>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            5 AI tools built into your workspace — try them here or find them in context
          </p>
        </div>
      </div>

      {/* Where to find each feature */}
      <div
        className="p-4 flex flex-col gap-2"
        style={{ background: "oklch(0.52 0.14 35 / 0.05)", border: "1px solid oklch(0.52 0.14 35 / 0.18)" }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: M.accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>
          WHERE TO FIND EACH FEATURE
        </p>
        {[
          { label: "Brain Dump → AI Categorise", where: "Brain Dump page → \"✦ AI Categorise\" button" },
          { label: "Daily Summary", where: "Wrap-up panel → \"✦ Generate AI summary\" button" },
          { label: "Focus Micro-Reflection", where: "Focus Timer → session complete screen" },
          { label: "Monthly AI Review", where: "Monthly page → \"✦ Generate AI Review\" button" },
          { label: "MIT Morning Suggestion", where: "Daily Check-in → final step (auto-generates)" },
        ].map(({ label, where }, i) => (
          <div key={i} className="flex items-start gap-2 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: M.accent }} />
            <span>
              <span style={{ color: M.ink, fontWeight: 600 }}>{label}</span>
              <span style={{ color: M.muted }}> — {where}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <FeatureCard
        icon={Brain}
        title="Brain Dump Categoriser"
        description="Paste your brain dump entries and AI will sort them into tasks, worries, ideas, and reminders — and suggest which ones to add to your task list."
        badge="BRAIN DUMP"
      >
        <BrainDumpDemo />
      </FeatureCard>

      <FeatureCard
        icon={Sparkles}
        title="Daily Summary"
        description="At the end of your day, AI reads your wins, tasks, focus sessions, and mood to write a warm, personal summary — not a generic template."
        badge="WRAP-UP"
      >
        <DailySummaryDemo />
      </FeatureCard>

      <FeatureCard
        icon={Clock}
        title="Focus Micro-Reflection"
        description="Before each session, AI asks one simple intention question. After, it gives a 1-2 sentence reflection on what happened — even if you went off-track."
        badge="FOCUS TIMER"
      >
        <FocusReflectionDemo />
      </FeatureCard>

      <FeatureCard
        icon={CalendarDays}
        title="Monthly AI Review"
        description="At any point in the month, AI reads your full data and writes a personalised review: what went well, one pattern it noticed, and one thing to try next month."
        badge="MONTHLY"
      >
        <MonthlyReviewDemo />
      </FeatureCard>

      <FeatureCard
        icon={Target}
        title="MIT — Most Important Thing"
        description="Every morning during check-in, AI looks at your tasks, goals, and mood to pick the single most important thing to focus on today. Reduces decision paralysis."
        badge="CHECK-IN"
      >
        <MITDemo />
      </FeatureCard>
    </div>
  );
}
