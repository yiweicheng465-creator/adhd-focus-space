/* ============================================================
   ADHD FOCUS SPACE — Editorial Dashboard v6.0
   Layout:
     [TOP]    hero bar: illustration left + greeting/quick-capture/context right
     [MIDDLE] 3-col grid: Focus Timer | Next Up (MIT + cute cards) | AI Command Center
     [BOTTOM] Today's wins/focus strip
   Changes v6:
     - MIT "What should I focus on?" button in task panel
     - Glowing highlight on the MIT task
     - Persistent AI chat history (last 10 msgs) in localStorage
     - Softer, warmer UI palette — no harsh blues/dark boxes
   ============================================================ */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { FocusTimer } from "./FocusTimer";
import { ContextSwitcher, getContextConfig, type ActiveContext } from "./ContextSwitcher";
import type { Task } from "./TaskManager";
import type { Win } from "./DailyWins";
import type { Goal } from "./Goals";
import type { Agent } from "./AgentTracker";
import { useTimer } from "@/contexts/TimerContext";
import { Clock, Sparkles, Zap, Send, Bot, Loader2, Check, Star, PlayCircle } from "lucide-react";
import { PixelTrophy } from "@/components/PixelIcons";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const SUNSET_BLOB = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-sunset-blob_5606b6c8.png";
const PERSON_IMG  = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-editorial-person-Bt8k6YePvnPHSwcK8XtieV.webp";

const CHAT_HISTORY_KEY = "adhd-ai-chat-history";
const MAX_CHAT_HISTORY = 10;

const MOOD_LABELS = ["Drained", "Low", "Okay", "Good", "Glowing"];
const MOOD_GREETINGS: Record<number, string> = {
  1: "Looks like a low-energy day 🌧 — want me to suggest lighter tasks first, or help you find one small win to start with?",
  2: "Energy's a bit low today — shall I help you pick just one thing to focus on so it doesn't feel overwhelming?",
  3: "Feeling okay today! Want me to help you prioritise your tasks, or is there something specific on your mind?",
  4: "You're in a good headspace today 🌿 — great time to tackle something meaningful. Want me to find your MIT?",
  5: "You're glowing today ✨ — let's make the most of it! Want me to line up your most important tasks?",
};

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

/* ── Warm editorial palette ── */
const TC        = "oklch(0.52 0.14 35)";   // terracotta accent
const CREAM     = "oklch(0.985 0.008 80)"; // warm cream background
const BORDER    = "oklch(0.87 0.014 75)";  // soft warm border
const INK       = "oklch(0.22 0.01 60)";   // near-black ink
const MUTED     = "oklch(0.55 0.015 70)";  // warm muted text
// AI panel: warm sand tones instead of cold blue
const AI_BG     = "oklch(0.978 0.010 75 / 0.70)";  // warm sand
const AI_BORDER = "oklch(0.82 0.020 70 / 0.60)";   // warm sand border
const AI_MSG_BG = "oklch(0.965 0.012 75 / 0.80)";  // slightly deeper sand for AI messages
const AI_ACCENT = "oklch(0.48 0.12 35)";            // terracotta for AI header/icons

function CornerMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" style={{ opacity: 0.4 }}>
      <line x1="6" y1="0" x2="6" y2="5" stroke={BORDER} strokeWidth="1" />
      <line x1="7" y1="6" x2="12" y2="6" stroke={BORDER} strokeWidth="1" />
    </svg>
  );
}

/* Priority dot config */
const PRIORITY_DOTS: Record<string, { color: string; bg: string; glow: string }> = {
  urgent: { color: "oklch(0.55 0.16 20)",  bg: "oklch(0.55 0.16 20 / 0.08)",  glow: "oklch(0.55 0.16 20 / 0.35)" },
  focus:  { color: "oklch(0.52 0.14 35)",  bg: "oklch(0.52 0.14 35 / 0.08)",  glow: "oklch(0.52 0.14 35 / 0.35)" },
  normal: { color: "oklch(0.60 0.08 145)", bg: "oklch(0.60 0.08 145 / 0.06)", glow: "oklch(0.60 0.08 145 / 0.30)" },
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
  // Load persisted history from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) return JSON.parse(saved) as ChatMessage[];
    } catch { /* ignore */ }
    return [];
  });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const greetedRef = useRef(false);

  // Persist last MAX_CHAT_HISTORY messages
  useEffect(() => {
    try {
      const toSave = messages.slice(-MAX_CHAT_HISTORY);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave));
    } catch { /* ignore */ }
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // greetedRef kept for future use but auto-greeting removed — panel starts with suggestion chips

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

  const sendMessage = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || commandMutation.isPending) return;
    const newMessages: ChatMessage[] = [...messages, { role: "user", content }];
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
    "Set a goal: finish the project",
    "How should I prioritise today?",
  ];

  const hasMessages = messages.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexShrink: 0 }}>
        <Bot size={13} style={{ color: AI_ACCENT }} />
        <p className="editorial-label" style={{ color: AI_ACCENT }}>AI Assistant</p>
        {hasMessages && (
          <button
            onClick={() => {
              setMessages([]);
              localStorage.removeItem(CHAT_HISTORY_KEY);
            }}
            style={{ marginLeft: "auto", fontSize: 9, color: MUTED, background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em", fontFamily: "'DM Mono', monospace" }}
          >
            CLEAR
          </button>
        )}
        {!hasMessages && (
          <span style={{ fontSize: 9, color: MUTED, marginLeft: "auto", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
            TASKS · GOALS · AGENTS · WINS
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 7, minHeight: 0, paddingRight: 2 }}>
        {!hasMessages ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, marginBottom: 4 }}>
              Tell me what you need — I can create tasks, set goals, launch agents, log wins, or just help you think.
            </p>
            {COMMANDS.map((c) => (
              <button
                key={c}
                onClick={() => sendMessage(c)}
                style={{
                  textAlign: "left", fontSize: 11,
                  color: "oklch(0.40 0.08 55)",
                  background: "oklch(0.965 0.012 75 / 0.70)",
                  border: `1px solid ${AI_BORDER}`,
                  borderRadius: 6,
                  padding: "6px 11px", cursor: "pointer", lineHeight: 1.4,
                  transition: "background 0.15s",
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
                  maxWidth: "92%", padding: "7px 11px", fontSize: 12, lineHeight: 1.55,
                  color: m.role === "user" ? CREAM : INK,
                  background: m.role === "user"
                    ? "oklch(0.50 0.13 35)"   // warm terracotta for user
                    : AI_MSG_BG,              // warm sand for AI
                  border: m.role === "user" ? "none" : `1px solid ${AI_BORDER}`,
                  borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "3px 12px 12px 12px",
                  boxShadow: m.role === "user" ? "none" : "0 1px 3px oklch(0 0 0 / 0.04)",
                }}
              >
                {m.role === "assistant" ? <Streamdown>{m.content}</Streamdown> : m.content}
              </div>
            </div>
          ))
        )}
        {commandMutation.isPending && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Loader2 size={11} style={{ color: AI_ACCENT, animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 11, color: MUTED }}>Working on it…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 6, marginTop: 8,
          border: `1px solid ${AI_BORDER}`,
          background: "oklch(0.975 0.010 75 / 0.85)",
          borderRadius: 8,
          padding: "6px 10px", flexShrink: 0,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Add task, set goal, log win…"
          style={{ flex: 1, fontSize: 12, background: "transparent", border: "none", outline: "none", color: INK }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || commandMutation.isPending}
          style={{
            background: input.trim() ? "oklch(0.50 0.13 35)" : "transparent",
            border: `1px solid ${input.trim() ? "transparent" : AI_BORDER}`,
            color: input.trim() ? CREAM : MUTED,
            padding: "4px 8px", cursor: input.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center",
            borderRadius: 6,
            transition: "all 0.15s",
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
  const [mitTaskId, setMitTaskId] = useState<string | null>(null);
  const [mitLoading, setMitLoading] = useState(false);
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
    if (taskId === mitTaskId) setMitTaskId(null);
    setTimeout(() => {
      onTaskToggle?.(taskId);
      setCompleting(null);
    }, 350);
  };

  const mitMutation = trpc.ai.command.useMutation({
    onSuccess: (data) => {
      setMitLoading(false);
      // First try: look for a task ID in the reply (format: "TASK_ID:<id>")
      const idMatch = data.reply.match(/TASK_ID:([\w-]+)/);
      if (idMatch) {
        const found = activeTasks.find(t => t.id === idMatch[1]);
        if (found) {
          setMitTaskId(found.id);
          toast.success("MIT highlighted!", { duration: 2000 });
          return;
        }
      }
      // Second try: fuzzy text match against full task text
      const reply = data.reply.toLowerCase();
      const found = activeTasks.find(t =>
        reply.includes(t.text.toLowerCase().replace(/(?:^|\s)#[\w-]+/g, "").trim().slice(0, 30))
      );
      if (found) {
        setMitTaskId(found.id);
        toast.success("MIT highlighted!", { duration: 2000 });
      } else if (activeTasks.length > 0) {
        // Fallback: highlight the first urgent/focus task, or just the first
        const priority = activeTasks.find(t => t.priority === "urgent") ??
                         activeTasks.find(t => t.priority === "focus") ??
                         activeTasks[0];
        setMitTaskId(priority.id);
        toast.success("Most important task highlighted!", { duration: 2000 });
      }
    },
    onError: () => {
      setMitLoading(false);
      toast.error("Couldn't determine MIT. Try again.");
    },
  });

  const handleMIT = () => {
    if (activeTasks.length === 0) return;
    setMitLoading(true);
    setMitTaskId(null);
    mitMutation.mutate({
      messages: [{
        role: "user",
        content: `You are helping an ADHD user identify their single most important task. From the list below, pick ONE task and reply in this exact format: "TASK_ID:<id> — <short reason why>". Tasks: ${activeTasks.map(t => `[TASK_ID:${t.id}] "${t.text.replace(/(?:^|\s)#[\w-]+/g, "").trim()}" (priority: ${t.priority}, context: ${t.context})`).join(" | ")}`,
      }],
      tasks: activeTasks.map(t => ({ id: t.id, text: t.text, priority: t.priority, context: t.context, done: t.done })),
      goals: goals.map(g => ({ id: g.id, text: g.text, progress: g.progress, context: g.context })),
      agents: [],
      focusSessions,
      mood,
    });
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
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: "oklch(0.55 0.13 35 / 0.10)", border: "1px solid oklch(0.55 0.13 35 / 0.30)", padding: "2px 8px", borderRadius: 20 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 2c0 0-1 3-1 5 0 1.5 1 3 1 3s-3-1-3-4c0 0-3 3-3 7a6 6 0 0 0 12 0c0-5-4-8-6-11z" fill="oklch(0.55 0.13 35)" opacity="0.9" /></svg>
                    <span style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.45 0.10 35)", fontFamily: "'JetBrains Mono', monospace" }}>{blockStreak}d streak</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {/* Quick capture */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${BORDER}`, background: "oklch(0.975 0.012 80 / 0.85)", backdropFilter: "blur(4px)", padding: "5px 12px", flex: "1 1 180px", maxWidth: 300, borderRadius: 8 }}>
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
                <kbd style={{ fontSize: 9, border: `1px solid ${BORDER}`, padding: "1px 5px", color: MUTED, borderRadius: 3 }}>↵</kbd>
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
        <div style={{ border: `1px solid ${BORDER}`, background: CREAM, padding: "14px 16px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, flexShrink: 0 }}>
            <Clock size={12} style={{ color: TC }} />
            <p className="editorial-label">Focus Timer</p>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <FocusTimer onSessionComplete={onSessionComplete} onBlockComplete={onBlockComplete} />
          </div>
        </div>

        {/* Col 2: Next Up — cute cards with checkboxes + MIT button */}
        <div style={{ border: `1px solid ${BORDER}`, background: CREAM, padding: "14px 16px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Zap size={12} style={{ color: TC }} />
              <p className="editorial-label">Next Up</p>
            </div>
            <button className="m-btn-link" onClick={() => onNavigate("tasks")}>All tasks</button>
          </div>

          {/* MIT button */}
          {activeTasks.length > 0 && (
            <button
              onClick={handleMIT}
              disabled={mitLoading}
              style={{
                display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
                padding: "5px 10px", cursor: mitLoading ? "default" : "pointer",
                background: mitTaskId ? "oklch(0.52 0.14 35 / 0.10)" : "oklch(0.965 0.012 75 / 0.70)",
                border: `1px solid ${mitTaskId ? "oklch(0.52 0.14 35 / 0.40)" : BORDER}`,
                borderRadius: 20, transition: "all 0.2s", flexShrink: 0,
                width: "100%",
              }}
            >
              {mitLoading ? (
                <Loader2 size={11} style={{ color: TC, animation: "spin 1s linear infinite", flexShrink: 0 }} />
              ) : (
                <Star size={11} style={{ color: TC, flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 11, color: mitTaskId ? TC : MUTED, fontFamily: "'DM Sans', sans-serif" }}>
                {mitLoading ? "Finding your MIT…" : mitTaskId ? "MIT highlighted ✓" : "What should I focus on?"}
              </span>
            </button>
          )}

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
                const isMIT = mitTaskId === t.id;
                const cleanText = t.text.replace(/(?:^|\s)#[a-zA-Z0-9\u4e00-\u9fa5_-]+/g, " ").replace(/\s{2,}/g, " ").trim() || t.text;
                return (
                  <div key={t.id} style={{ position: "relative" }}>
                    {/* Gradient glow layer for MIT */}
                    {isMIT && (
                      <div style={{
                        position: "absolute", inset: -3, borderRadius: 10, zIndex: 0, pointerEvents: "none",
                        background: "linear-gradient(135deg, oklch(0.52 0.14 35 / 0.35) 0%, oklch(0.65 0.12 55 / 0.20) 50%, oklch(0.52 0.14 35 / 0.30) 100%)",
                        filter: "blur(6px)",
                      }} />
                    )}
                    <div
                      style={{
                        position: "relative", zIndex: 1,
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "7px 10px",
                        background: isCompleting
                          ? "oklch(0.60 0.08 145 / 0.08)"
                          : isMIT
                            ? "oklch(0.985 0.010 75)"
                            : pd.bg,
                        border: `1px solid ${isCompleting ? "oklch(0.60 0.08 145 / 0.30)" : isMIT ? "oklch(0.52 0.14 35 / 0.55)" : pd.color + "30"}`,
                        borderLeft: `3px solid ${isCompleting ? "oklch(0.60 0.08 145)" : isMIT ? TC : pd.color}`,
                        borderRadius: 6,
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
                        border: `1.5px solid ${isCompleting ? "oklch(0.60 0.08 145)" : isMIT ? TC : pd.color}`,
                        background: isCompleting ? "oklch(0.60 0.08 145 / 0.15)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      {isCompleting && <Check size={10} style={{ color: "oklch(0.60 0.08 145)" }} />}
                    </button>

                    {/* Task text */}
                    <p style={{
                      fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      color: INK, textDecoration: isCompleting ? "line-through" : "none",
                      fontWeight: isMIT ? 600 : 400,
                    }}>
                      {isMIT && <Star size={9} style={{ color: TC, marginRight: 4, display: "inline", verticalAlign: "middle" }} />}
                      {cleanText}
                    </p>

                    {/* Context badge */}
                    <span style={{ fontSize: 9, padding: "1px 5px", flexShrink: 0, color: ctxColor, background: ctxColor + "18", border: `1px solid ${ctxColor}30`, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em", borderRadius: 4 }}>
                      {t.context}
                    </span>
                    </div>
                    {/* Start 25min focus button — only on MIT card */}
                    {isMIT && (
                      <button
                        onClick={() => {
                          onNavigate("focus");
                          setTimeout(() => {
                            try {
                              window.dispatchEvent(new CustomEvent("adhd-start-mit-focus", { detail: { taskText: cleanText } }));
                            } catch { /* ignore */ }
                          }, 300);
                          toast.success(`Starting 25 min focus on: ${cleanText}`);
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: 5, marginTop: 4, marginLeft: 2,
                          fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: "0.04em",
                          color: TC, background: "oklch(0.52 0.14 35 / 0.08)",
                          border: `1px solid oklch(0.52 0.14 35 / 0.30)`,
                          borderRadius: 20, padding: "3px 10px", cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <PlayCircle size={11} />
                        Start 25 min focus on this
                      </button>
                    )}
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

        {/* Col 3: AI Command Center — warm sand palette */}
        <div style={{ border: `1px solid ${AI_BORDER}`, background: AI_BG, padding: "14px 16px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", borderRadius: 8 }}>
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
        <div style={{ border: `1px solid oklch(0.65 0.12 75 / 0.3)`, background: "oklch(0.65 0.12 75 / 0.04)", padding: "7px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderRadius: 8 }}>
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
            <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", border: `1px solid oklch(0.65 0.12 75 / 0.3)`, background: CREAM, color: INK, fontSize: 11, borderRadius: 6 }}>
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
