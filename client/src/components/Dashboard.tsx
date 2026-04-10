/* ============================================================
   ADHD FOCUS SPACE — Editorial Dashboard v5.0
   Layout:
     [TOP]    hero bar: illustration left + greeting/quick-capture/context right
     [MIDDLE] 3-col grid: Focus Timer | Next Up (cute cards + checkboxes) | AI Command Center
     [BOTTOM] Today's wins/focus strip
   ============================================================ */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { FocusTimer } from "./FocusTimer";
import { ContextSwitcher, getContextConfig, type ActiveContext } from "./ContextSwitcher";
import type { Task } from "./TaskManager";
import type { Win } from "./DailyWins";
import type { Goal } from "./Goals";
import type { Agent } from "./AgentTracker";
import { Clock, Sparkles, Zap, Send, Bot, Loader2, Check, CheckCircle2 } from "lucide-react";
import { PixelTrophy } from "@/components/PixelIcons";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const SUNSET_BLOB = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-sunset-blob_5606b6c8.png";
const PERSON_IMG  = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-editorial-person-Bt8k6YePvnPHSwcK8XtieV.webp";

interface DashboardProps {
  tasks: Task[];
  wins: Win[];
  goals: Goal[];
  agents: Agent[];
  mood: number | null;
  onNavigate: (section: string) => void;
  onQuickDump?: (text: string) => void;
  onSessionComplete: () => void;
  onBlockComplete?: () => void;
  onTaskToggle?: (taskId: string) => void;
  onTaskCreate?: (task: Task) => void;
  onGoalCreate?: (goal: Goal) => void;
  onAgentCreate?: (agent: Agent) => void;
  onWinCreate?: (win: Win) => void;
  blockStreak?: number;
  blockHistory?: Record<string, number>;
  focusSessions?: number;
  allCategories?: string[];
}

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const TC        = "oklch(0.52 0.14 35)";
const CREAM     = "oklch(0.985 0.008 80)";
const BORDER    = "oklch(0.87 0.014 75)";
const INK       = "oklch(0.18 0.01 60)";
const MUTED     = "oklch(0.52 0.015 70)";
const AI_BG     = "oklch(0.975 0.010 260 / 0.45)";
const AI_BORDER = "oklch(0.72 0.06 260 / 0.35)";

function CornerMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" style={{ opacity: 0.4 }}>
      <line x1="6" y1="0" x2="6" y2="5" stroke={BORDER} strokeWidth="1" />
      <line x1="7" y1="6" x2="12" y2="6" stroke={BORDER} strokeWidth="1" />
    </svg>
  );
}

/* Priority dot config */
const PRIORITY_DOTS: Record<string, { color: string; bg: string; label: string }> = {
  urgent: { color: "oklch(0.55 0.16 20)",  bg: "oklch(0.55 0.16 20 / 0.10)",  label: "!" },
  focus:  { color: "oklch(0.52 0.14 35)",  bg: "oklch(0.52 0.14 35 / 0.10)",  label: "★" },
  normal: { color: "oklch(0.60 0.08 145)", bg: "oklch(0.60 0.08 145 / 0.10)", label: "·" },
};

type ChatMessage = { role: "user" | "assistant"; content: string };

/* ── AI Command Center Panel ── */
function AICommandPanel({
  tasks, goals, agents, focusSessions, mood,
  onTaskToggle, onTaskCreate, onGoalCreate, onAgentCreate, onWinCreate,
}: {
  tasks: Task[]; goals: Goal[]; agents: Agent[];
  focusSessions: number; mood: number | null;
  onTaskToggle?: (id: string) => void;
  onTaskCreate?: (t: Task) => void;
  onGoalCreate?: (g: Goal) => void;
  onAgentCreate?: (a: Agent) => void;
  onWinCreate?: (w: Win) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const commandMutation = trpc.ai.command.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.action && data.action.type !== "none") {
        executeAction(data.action.type, data.action.payload);
      }
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Try again?" }]);
    },
  });

  const executeAction = (type: string, payload: Record<string, unknown>) => {
    const id = () => `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (type === "create_task") {
      const task: Task = {
        id: id(),
        text: String(payload.text ?? "New task"),
        priority: (payload.priority as Task["priority"]) ?? "normal",
        context: String(payload.context ?? "personal") as Task["context"],
        done: false,
        createdAt: new Date(),
      };
      onTaskCreate?.(task);
      toast.success(`Task added: "${task.text}"`, { duration: 2500 });
    } else if (type === "complete_task") {
      const match = tasks.find(t =>
        t.id === String(payload.id) ||
        t.text.toLowerCase().includes(String(payload.text ?? "").toLowerCase())
      );
      if (match) {
        onTaskToggle?.(match.id);
        toast.success(`Task completed: "${match.text}"`, { duration: 2500 });
      }
    } else if (type === "delete_task") {
      const match = tasks.find(t =>
        t.id === String(payload.id) ||
        t.text.toLowerCase().includes(String(payload.text ?? "").toLowerCase())
      );
      if (match) {
        onTaskToggle?.(match.id);
        toast.success(`Task removed: "${match.text}"`, { duration: 2500 });
      }
    } else if (type === "create_goal") {
      const goal: Goal = {
        id: id(),
        text: String(payload.text ?? "New goal"),
        progress: 0,
        context: String(payload.context ?? "personal") as Goal["context"],
        createdAt: new Date(),
      };
      onGoalCreate?.(goal);
      toast.success(`Goal set: "${goal.text}"`, { duration: 2500 });
    } else if (type === "create_agent") {
      const agent: Agent = {
        id: id(),
        name: String(payload.name ?? "AI Agent"),
        task: String(payload.task ?? ""),
        status: "running",
        context: String(payload.context ?? "work") as Agent["context"],
        startedAt: new Date(),
      };
      onAgentCreate?.(agent);
      toast.success(`Agent created: "${agent.name}"`, { duration: 2500 });
    } else if (type === "log_win") {
      const win: Win = {
        id: id(),
        text: String(payload.text ?? "Win logged"),
        iconIdx: 5,
        createdAt: new Date(),
      };
      onWinCreate?.(win);
      toast.success(`Win logged: "${win.text}"`, { duration: 2500 });
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || commandMutation.isPending) return;
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    commandMutation.mutate({
      messages: newMessages,
      tasks: tasks.map(t => ({ id: t.id, text: t.text, priority: t.priority, context: t.context, done: t.done })),
      goals: goals.map(g => ({ id: g.id, text: g.text, progress: g.progress, context: g.context })),
      agents: agents.map(a => ({ id: a.id, name: a.name, task: a.task, status: a.status, context: a.context })),
      focusSessions,
      mood,
    });
  };

  const COMMANDS = [
    "Add task: review the PR, urgent",
    "Log a win: shipped the feature",
    "Create a goal: finish the project",
    "How should I prioritise today?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexShrink: 0 }}>
        <Bot size={13} style={{ color: "oklch(0.48 0.12 260)" }} />
        <p className="editorial-label" style={{ color: "oklch(0.38 0.08 260)" }}>AI Assistant</p>
        <span style={{ fontSize: 9, color: MUTED, marginLeft: "auto", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
          TASKS · GOALS · AGENTS · WINS
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, minHeight: 0, paddingRight: 2 }}>
        {messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.5, marginBottom: 4 }}>
              Tell me what you need — I can create tasks, set goals, launch agents, log wins, or just help you think.
            </p>
            {COMMANDS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setInput(c);
                  setTimeout(() => {
                    const newMessages: ChatMessage[] = [{ role: "user", content: c }];
                    setMessages(newMessages);
                    setInput("");
                    commandMutation.mutate({
                      messages: newMessages,
                      tasks: tasks.map(t => ({ id: t.id, text: t.text, priority: t.priority, context: t.context, done: t.done })),
                      goals: goals.map(g => ({ id: g.id, text: g.text, progress: g.progress, context: g.context })),
                      agents: agents.map(a => ({ id: a.id, name: a.name, task: a.task, status: a.status, context: a.context })),
                      focusSessions, mood,
                    });
                  }, 0);
                }}
                style={{
                  textAlign: "left", fontSize: 11,
                  color: "oklch(0.40 0.09 260)",
                  background: "oklch(0.975 0.010 260 / 0.45)",
                  border: `1px solid ${AI_BORDER}`,
                  padding: "5px 10px", cursor: "pointer", lineHeight: 1.4,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "92%", padding: "6px 10px", fontSize: 12, lineHeight: 1.5,
                  color: m.role === "user" ? CREAM : INK,
                  background: m.role === "user" ? TC : "oklch(0.975 0.010 260 / 0.55)",
                  border: m.role === "user" ? "none" : `1px solid ${AI_BORDER}`,
                }}
              >
                {m.role === "assistant" ? <Streamdown>{m.content}</Streamdown> : m.content}
              </div>
            </div>
          ))
        )}
        {commandMutation.isPending && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Loader2 size={11} style={{ color: "oklch(0.48 0.12 260)", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 11, color: MUTED }}>Working on it…</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 6, marginTop: 8,
          border: `1px solid ${AI_BORDER}`, background: AI_BG,
          padding: "5px 8px", flexShrink: 0,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Add task, set goal, log win…"
          style={{ flex: 1, fontSize: 12, background: "transparent", border: "none", outline: "none", color: INK }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || commandMutation.isPending}
          style={{
            background: input.trim() ? "oklch(0.48 0.12 260)" : "transparent",
            border: `1px solid ${input.trim() ? "transparent" : AI_BORDER}`,
            color: input.trim() ? CREAM : MUTED,
            padding: "4px 7px", cursor: input.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center",
          }}
        >
          <Send size={11} />
        </button>
      </div>
    </div>
  );
}

export function Dashboard({
  tasks, wins, goals, agents, mood, blockStreak = 0, focusSessions = 0,
  onNavigate, onSessionComplete, onBlockComplete, allCategories, onQuickDump,
  onTaskToggle, onTaskCreate, onGoalCreate, onAgentCreate, onWinCreate,
}: DashboardProps) {
  const [activeContext, setActiveContext] = useState<ActiveContext>("all");
  const [quickCapture, setQuickCapture] = useState("");
  const [completing, setCompleting] = useState<string | null>(null);
  const now = new Date();

  const contextTasks = tasks.filter((t) => activeContext === "all" ? true : t.context === activeContext);
  const activeTasks  = contextTasks.filter((t) => !t.done);
  const todayWins    = wins.filter((w) => new Date(w.createdAt).toDateString() === now.toDateString());

  const allContexts = Array.from(new Set(["work", "personal", ...tasks.map((t) => t.context)]));
  const ctxCounts: Record<string, number> = { all: tasks.filter((t) => !t.done).length };
  allContexts.forEach((ctx) => {
    ctxCounts[ctx] = tasks.filter((t) => !t.done && t.context === ctx).length;
  });

  const handleCheck = (taskId: string) => {
    setCompleting(taskId);
    setTimeout(() => {
      onTaskToggle?.(taskId);
      setCompleting(null);
    }, 350);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── HERO: illustration left + greeting/controls right ── */}
      <div className="relative overflow-hidden" style={{ border: `1px solid ${BORDER}`, minHeight: 140 }}>
        {/* Sunset background */}
        <div className="absolute inset-0" style={{ backgroundImage: `url(${SUNSET_BLOB})`, backgroundSize: "cover", backgroundPosition: "center 40%", opacity: 0.18 }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, oklch(0.985 0.008 80 / 0.94) 40%, oklch(0.985 0.008 80 / 0.65) 100%)` }} />
        {/* Corner marks */}
        <div className="absolute top-2 left-2"><CornerMark /></div>
        <div className="absolute top-2 right-2" style={{ transform: "rotate(90deg)" }}><CornerMark /></div>
        <div className="absolute bottom-2 left-2" style={{ transform: "rotate(-90deg)" }}><CornerMark /></div>
        <div className="absolute bottom-2 right-2" style={{ transform: "rotate(180deg)" }}><CornerMark /></div>

        <div className="relative flex items-stretch">
          {/* Left: illustration */}
          <div className="hidden md:flex w-36 shrink-0 items-end justify-center pb-0 pt-3" style={{ borderRight: `1px solid ${BORDER}` }}>
            <img src={PERSON_IMG} alt="thinking person" className="object-contain w-full" style={{ maxHeight: 140, opacity: 0.72 }} />
          </div>
          {/* Right: greeting + controls */}
          <div className="flex-1 px-6 py-4 flex flex-col gap-3">
            <div>
              <p className="editorial-label" style={{ marginBottom: 2, fontSize: 9 }}>
                {DAYS[now.getDay()]} · {MONTHS[now.getMonth()]} {now.getDate()}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 className="text-2xl font-bold italic" style={{ fontFamily: "'Playfair Display', serif", color: INK }}>
                  {getGreeting()}
                </h1>
                {blockStreak > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: "oklch(0.55 0.13 35 / 0.10)", border: "1px solid oklch(0.55 0.13 35 / 0.30)", padding: "2px 8px" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 2c0 0-1 3-1 5 0 1.5 1 3 1 3s-3-1-3-4c0 0-3 3-3 7a6 6 0 0 0 12 0c0-5-4-8-6-11z" fill="oklch(0.55 0.13 35)" opacity="0.9" /></svg>
                    <span style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.45 0.10 35)", fontFamily: "'JetBrains Mono', monospace" }}>{blockStreak}d streak</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {/* Quick capture */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${BORDER}`, background: "oklch(0.975 0.012 80 / 0.85)", backdropFilter: "blur(4px)", padding: "5px 12px", flex: "1 1 180px", maxWidth: 300 }}>
                <Zap size={11} style={{ color: TC, flexShrink: 0 }} />
                <input
                  value={quickCapture}
                  onChange={(e) => setQuickCapture(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && quickCapture.trim()) {
                      const text = quickCapture.trim();
                      setQuickCapture("");
                      onQuickDump?.(text);
                      onNavigate("braindump");
                    }
                  }}
                  placeholder="What's on your mind?"
                  style={{ flex: 1, fontSize: 12, background: "transparent", border: "none", outline: "none", color: INK }}
                />
                <kbd style={{ fontSize: 9, border: `1px solid ${BORDER}`, padding: "1px 5px", color: MUTED }}>↵</kbd>
              </div>
              {/* Context switcher */}
              <div style={{ flex: "1 1 auto" }}>
                <ContextSwitcher active={activeContext} onChange={setActiveContext} counts={ctxCounts} contexts={allContexts} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE: 3-column grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, minHeight: 0 }}>

        {/* Col 1: Focus Timer */}
        <div style={{ border: `1px solid ${BORDER}`, background: CREAM, padding: "14px 16px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, flexShrink: 0 }}>
            <Clock size={12} style={{ color: TC }} />
            <p className="editorial-label">Focus Timer</p>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <FocusTimer onSessionComplete={onSessionComplete} onBlockComplete={onBlockComplete} />
          </div>
        </div>

        {/* Col 2: Next Up — cute cards with checkboxes */}
        <div style={{ border: `1px solid ${BORDER}`, background: CREAM, padding: "14px 16px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Zap size={12} style={{ color: TC }} />
              <p className="editorial-label">Next Up</p>
            </div>
            <button className="m-btn-link" onClick={() => onNavigate("tasks")}>All tasks</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {activeTasks.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, textAlign: "center" }}>
                <svg width="32" height="32" viewBox="0 0 40 40" style={{ opacity: 0.15 }}>
                  <circle cx="20" cy="20" r="18" fill="none" stroke={INK} strokeWidth="1" />
                  <line x1="20" y1="8" x2="20" y2="32" stroke={INK} strokeWidth="0.8" />
                  <line x1="8" y1="20" x2="32" y2="20" stroke={INK} strokeWidth="0.8" />
                  <circle cx="20" cy="20" r="3" fill={INK} />
                </svg>
                <button className="m-btn-primary" onClick={() => onNavigate("tasks")}>Add a task</button>
              </div>
            ) : (
              activeTasks.slice(0, 7).map((t) => {
                const pd = PRIORITY_DOTS[t.priority] ?? PRIORITY_DOTS.normal;
                const ctxColor = getContextConfig(t.context).color;
                const isCompleting = completing === t.id;
                const cleanText = t.text.replace(/(?:^|\s)#[a-zA-Z0-9\u4e00-\u9fa5_-]+/g, " ").replace(/\s{2,}/g, " ").trim() || t.text;
                return (
                  <div
                    key={t.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px",
                      background: isCompleting ? "oklch(0.60 0.08 145 / 0.08)" : pd.bg,
                      border: `1px solid ${isCompleting ? "oklch(0.60 0.08 145 / 0.30)" : pd.color + "30"}`,
                      borderLeft: `3px solid ${isCompleting ? "oklch(0.60 0.08 145)" : pd.color}`,
                      opacity: isCompleting ? 0.6 : 1,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleCheck(t.id)}
                      title="Mark done"
                      style={{
                        width: 18, height: 18, flexShrink: 0, borderRadius: "50%",
                        border: `1.5px solid ${isCompleting ? "oklch(0.60 0.08 145)" : pd.color}`,
                        background: isCompleting ? "oklch(0.60 0.08 145 / 0.15)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      {isCompleting && <Check size={10} style={{ color: "oklch(0.60 0.08 145)" }} />}
                    </button>

                    {/* Task text */}
                    <p style={{ fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: INK, textDecoration: isCompleting ? "line-through" : "none" }}>
                      {cleanText}
                    </p>

                    {/* Context badge */}
                    <span style={{ fontSize: 9, padding: "1px 5px", flexShrink: 0, color: ctxColor, background: ctxColor + "18", border: `1px solid ${ctxColor}30`, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em" }}>
                      {t.context}
                    </span>
                  </div>
                );
              })
            )}
            {activeTasks.length > 7 && (
              <button
                onClick={() => onNavigate("tasks")}
                style={{ fontSize: 10, textAlign: "center", paddingTop: 2, color: MUTED, background: "none", border: "none", cursor: "pointer" }}
              >
                +{activeTasks.length - 7} more →
              </button>
            )}
          </div>
        </div>

        {/* Col 3: AI Command Center */}
        <div style={{ border: `1px solid ${AI_BORDER}`, background: AI_BG, padding: "14px 16px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <AICommandPanel
            tasks={tasks}
            goals={goals}
            agents={agents}
            focusSessions={focusSessions}
            mood={mood}
            onTaskToggle={onTaskToggle}
            onTaskCreate={onTaskCreate}
            onGoalCreate={onGoalCreate}
            onAgentCreate={onAgentCreate}
            onWinCreate={onWinCreate}
          />
        </div>
      </div>

      {/* ── BOTTOM: Today's wins + focus strip ── */}
      {(todayWins.length > 0 || focusSessions > 0) && (
        <div style={{ border: `1px solid oklch(0.65 0.12 75 / 0.3)`, background: "oklch(0.65 0.12 75 / 0.04)", padding: "7px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Sparkles size={11} style={{ color: "oklch(0.55 0.12 75)" }} />
            <p className="editorial-label" style={{ fontSize: 9 }}>Today{todayWins.length > 0 ? ` · ${todayWins.length} win${todayWins.length > 1 ? "s" : ""}` : ""}</p>
          </div>
          {focusSessions > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "oklch(0.52 0.14 35 / 0.08)", border: "1px solid oklch(0.52 0.14 35 / 0.25)", borderRadius: 20, color: "oklch(0.42 0.14 35)", fontSize: 10, fontWeight: 600, fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em", padding: "2px 9px" }}>
              ⏱ {focusSessions} session{focusSessions > 1 ? "s" : ""}
            </div>
          )}
          {todayWins.map((w) => (
            <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", border: `1px solid oklch(0.65 0.12 75 / 0.3)`, background: CREAM, color: INK, fontSize: 11 }}>
              <PixelTrophy size={10} color="oklch(0.55 0.12 75)" />
              <span>{w.text}</span>
            </div>
          ))}
          <button className="m-btn-link" style={{ marginLeft: "auto", fontSize: 10 }} onClick={() => onNavigate("wins")}>Log more</button>
        </div>
      )}
    </div>
  );
}
