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
import { Clock, Sparkles, Zap, Send, Bot, Loader2, Check } from "lucide-react";
import { PixelTrophy } from "@/components/PixelIcons";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const SUNSET_BLOB = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-sunset-blob_5606b6c8.png";
const PERSON_IMG  = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/lofi-pink-windows_f21d8166.png";
const CAT_BLUE    = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/cat1_blue_lying_fbb2632f.png";
const CAT_PINK    = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/cat2_pink_standing_a0abaf8f.png";
const CAT_OLIVE   = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/cat6_olive_playing_2d875a0d.png";

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

/* ── Retro Lo-Fi Palette (aligned with index.css CSS vars) ── */
const TC        = "oklch(0.52 0.10 32)";   // terracotta accent
const CREAM     = "oklch(0.975 0.010 75)"; // parchment card bg
const BORDER    = "oklch(0.82 0.022 68)";  // pencil-stroke border
const INK       = "oklch(0.30 0.020 60)";  // near-black ink
const MUTED     = "oklch(0.54 0.018 68)";  // warm muted text
// AI panel: same parchment as other panels
const AI_BG     = "oklch(0.975 0.010 75)";  // parchment
const AI_BORDER = "oklch(0.82 0.022 68)";   // pencil border
const AI_MSG_BG = "oklch(0.960 0.014 72)";  // slightly deeper sand for AI messages
const AI_ACCENT = "oklch(0.52 0.10 32)";    // terracotta for AI header/icons
const TITLEBAR  = "oklch(0.940 0.020 70)";  // retro title bar bg
const TITLEBAR_TEXT = "oklch(0.45 0.020 62)"; // title bar text

function CornerMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" style={{ opacity: 0.4 }}>
      <line x1="6" y1="0" x2="6" y2="5" stroke={BORDER} strokeWidth="1" />
      <line x1="7" y1="6" x2="12" y2="6" stroke={BORDER} strokeWidth="1" />
    </svg>
  );
}

/* Priority config — distinct colors per level, sorted urgent → focus → normal → someday */
const PRIORITY_ORDER: Record<string, number> = { urgent: 0, focus: 1, normal: 2, someday: 3 };
const PRIORITY_DOTS: Record<string, { color: string; bg: string; label: string; labelBg: string }> = {
  // Muted ink-stamp palette — desaturated, dusty, lo-fi
  urgent:  { color: "#8B4A3A", bg: "oklch(0.97 0.025 18)",  label: "urgent",  labelBg: "rgba(139, 74, 58, 0.10)" },
  focus:   { color: "#7A5C3A", bg: "oklch(0.97 0.018 35)",  label: "focus",   labelBg: "rgba(122, 92, 58, 0.10)" },
  normal:  { color: "#4A6B4A", bg: "oklch(0.97 0.014 145)", label: "normal",  labelBg: "rgba(74, 107, 74, 0.08)" },
  someday: { color: "#5A6070", bg: "oklch(0.97 0.010 240)", label: "someday", labelBg: "rgba(90, 96, 112, 0.08)" },
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
  const aiInputRef = useRef<HTMLInputElement>(null);

  // Expose aiInputRef globally so the / shortcut can focus it
  useEffect(() => {
    (window as Window & { __adhd_ai_input?: HTMLInputElement | null }).__adhd_ai_input = aiInputRef.current;
    return () => { (window as Window & { __adhd_ai_input?: HTMLInputElement | null }).__adhd_ai_input = null; };
  });

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
          ref={aiInputRef}
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

  // / keyboard shortcut: focus the AI input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === "/") {
        e.preventDefault();
        const el = (window as Window & { __adhd_ai_input?: HTMLInputElement | null }).__adhd_ai_input;
        el?.focus();
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── HERO: Retro Lo-Fi Desktop Window ── */}
      <div className="retro-window relative overflow-hidden" style={{ minHeight: 148 }}>
        {/* Warm parchment overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.985 0.010 78 / 0.98) 0%, oklch(0.978 0.014 72 / 0.96) 100%)" }} />

        {/* ── Retro title bar ── */}
        <div className="retro-titlebar relative z-10">
          <span>dashboard.exe</span>
          <div className="retro-titlebar-buttons">
            <span className="retro-titlebar-btn">_</span>
            <span className="retro-titlebar-btn">□</span>
            <span className="retro-titlebar-btn">✕</span>
          </div>
        </div>

        {/* ── Decorative SVG Stickers ── */}
        {/* Crescent moon — top right */}
        <div className="absolute" style={{ top: 28, right: 18, opacity: 0.55, transform: "rotate(12deg)" }}>
          <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
            <path d="M28 20c0 8.837-7.163 16-16 16a16.07 16.07 0 0 1-4-.504C11.84 37.1 15.78 38 20 38c9.941 0 18-8.059 18-18S29.941 2 20 2c-4.22 0-8.16.9-11 2.504A16.07 16.07 0 0 1 13 4c8.837 0 15 7.163 15 16z" fill="oklch(0.68 0.08 55)" />
            <circle cx="22" cy="9" r="1.2" fill="oklch(0.78 0.06 60)" />
            <circle cx="30" cy="14" r="0.8" fill="oklch(0.78 0.06 60)" />
            <circle cx="26" cy="5" r="0.6" fill="oklch(0.78 0.06 60)" />
          </svg>
        </div>
        {/* Small stars cluster — top right area */}
        <div className="absolute" style={{ top: 32, right: 62, opacity: 0.45 }}>
          <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
            <path d="M4 2 L4.6 3.8 L6.5 3.8 L5 4.9 L5.6 6.7 L4 5.6 L2.4 6.7 L3 4.9 L1.5 3.8 L3.4 3.8 Z" fill="oklch(0.62 0.10 50)" />
            <path d="M14 8 L14.4 9.2 L15.7 9.2 L14.7 10 L15.1 11.2 L14 10.4 L12.9 11.2 L13.3 10 L12.3 9.2 L13.6 9.2 Z" fill="oklch(0.62 0.10 50)" />
            <path d="M23 2 L23.3 3 L24.3 3 L23.5 3.6 L23.8 4.6 L23 4 L22.2 4.6 L22.5 3.6 L21.7 3 L22.7 3 Z" fill="oklch(0.62 0.10 50)" />
          </svg>
        </div>
        {/* Potted plant — bottom right */}
        <div className="absolute" style={{ bottom: 6, right: 22, opacity: 0.50 }}>
          <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
            {/* pot */}
            <path d="M10 30 Q9 38 8 40 L28 40 Q27 38 26 30 Z" fill="oklch(0.62 0.10 35)" />
            <rect x="8" y="28" width="20" height="4" rx="2" fill="oklch(0.55 0.12 32)" />
            {/* stem */}
            <line x1="18" y1="28" x2="18" y2="14" stroke="oklch(0.48 0.10 145)" strokeWidth="1.5" strokeLinecap="round" />
            {/* leaves */}
            <path d="M18 22 Q10 18 8 10 Q14 14 18 22Z" fill="oklch(0.52 0.12 145)" />
            <path d="M18 18 Q26 14 28 6 Q22 10 18 18Z" fill="oklch(0.48 0.10 145)" />
            <path d="M18 26 Q12 22 11 16 Q16 20 18 26Z" fill="oklch(0.55 0.11 148)" />
          </svg>
        </div>
        {/* Sticky note — bottom left area */}
        <div className="absolute" style={{ bottom: 10, left: 148, opacity: 0.70, transform: "rotate(-3deg)" }}>
          <div style={{
            background: "oklch(0.96 0.030 88)",
            border: "1px solid oklch(0.82 0.040 80)",
            padding: "5px 9px",
            fontSize: 8,
            fontFamily: "'Space Mono', monospace",
            color: "oklch(0.42 0.06 55)",
            boxShadow: "1px 2px 4px oklch(0.60 0.04 60 / 0.18)",
            lineHeight: 1.5,
            minWidth: 90,
          }}>
            be kind to yourself ✦
          </div>
        </div>
        {/* Leaf sprig — left edge */}
        <div className="absolute" style={{ top: 38, left: 148, opacity: 0.35, transform: "rotate(-15deg)" }}>
          <svg width="22" height="30" viewBox="0 0 22 30" fill="none">
            <line x1="11" y1="28" x2="11" y2="4" stroke="oklch(0.50 0.10 145)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M11 20 Q4 16 3 8 Q9 12 11 20Z" fill="oklch(0.54 0.11 145)" />
            <path d="M11 14 Q18 10 19 2 Q13 6 11 14Z" fill="oklch(0.50 0.10 145)" />
          </svg>
        </div>
        {/* Cloud puff — far right, mid height */}
        <div className="absolute" style={{ top: 70, right: 8, opacity: 0.22 }}>
          <svg width="44" height="22" viewBox="0 0 44 22" fill="none">
            <ellipse cx="22" cy="14" rx="18" ry="8" fill="oklch(0.70 0.06 55)" />
            <ellipse cx="14" cy="12" rx="10" ry="7" fill="oklch(0.72 0.05 58)" />
            <ellipse cx="30" cy="11" rx="9" ry="6" fill="oklch(0.72 0.05 58)" />
            <ellipse cx="22" cy="9" rx="8" ry="6" fill="oklch(0.74 0.04 60)" />
          </svg>
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 flex items-stretch" style={{ minHeight: 108 }}>
          {/* Cat sticker: blue lying cat — bottom-right of hero */}
          <img src={CAT_BLUE} alt="" aria-hidden="true" style={{ position: "absolute", bottom: -18, right: 10, width: 72, opacity: 0.45, pointerEvents: "none", zIndex: 20, transform: "scaleX(-1)" }} />
          {/* Left: illustration */}
          <div className="hidden md:flex w-36 shrink-0 items-end justify-center pb-0 pt-3" style={{ borderRight: `1px solid ${BORDER}` }}>
            <img src={PERSON_IMG} alt="thinking person" className="object-cover w-full" style={{ maxHeight: 120, opacity: 0.92, borderRadius: 16 }} />
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
        <div className="retro-window" style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div className="retro-titlebar">
            <span>focus_timer.exe</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto", marginRight: 6 }}>
              {/* star sticker */}
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.55 }}>
                <path d="M6 1 L7 4.2 L10.5 4.2 L7.8 6.3 L8.8 9.5 L6 7.4 L3.2 9.5 L4.2 6.3 L1.5 4.2 L5 4.2 Z" fill="oklch(0.62 0.10 50)" />
              </svg>
            </div>
            <div className="retro-titlebar-buttons">
              <span className="retro-titlebar-btn">_</span>
              <span className="retro-titlebar-btn">□</span>
              <span className="retro-titlebar-btn">✕</span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "14px 16px" }}>
            <div style={{ position: "relative" }}>
            {/* Cat sticker: pink standing cat — top-right of focus timer */}
            <img src={CAT_PINK} alt="" aria-hidden="true" style={{ position: "absolute", top: -8, right: -8, width: 56, opacity: 0.40, pointerEvents: "none", zIndex: 5 }} />
            <FocusTimer onSessionComplete={onSessionComplete} onBlockComplete={onBlockComplete} />
          </div>
          </div>
        </div>

        {/* Col 2: Next Up — cute cards with checkboxes + MIT button */}
        <div className="retro-window" style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div className="retro-titlebar">
            <span>next_up.txt</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto", marginRight: 6 }}>
              {/* leaf sticker */}
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ opacity: 0.55 }}>
                <line x1="5" y1="11" x2="5" y2="2" stroke="oklch(0.48 0.10 145)" strokeWidth="1" strokeLinecap="round" />
                <path d="M5 8 Q1 6 1 2 Q4 4 5 8Z" fill="oklch(0.52 0.12 145)" />
                <path d="M5 6 Q9 4 9 0 Q6 2 5 6Z" fill="oklch(0.48 0.10 145)" />
              </svg>
            </div>
            <div className="retro-titlebar-buttons">
              <span className="retro-titlebar-btn">_</span>
              <span className="retro-titlebar-btn">□</span>
              <span className="retro-titlebar-btn">✕</span>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexShrink: 0 }}>
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
              [...activeTasks]
                .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))
                .slice(0, 8)
                .map((t) => {
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
                        border: `1px solid ${isCompleting ? "oklch(0.60 0.08 145 / 0.30)" : pd.color + "40"}`,
                        borderLeft: `3px solid ${isCompleting ? "oklch(0.60 0.08 145)" : pd.color}`,
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
                          border: `1.5px solid ${isCompleting ? "oklch(0.60 0.08 145)" : pd.color}`,
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
                      }}>
                        {cleanText}
                      </p>

                      {/* Priority badge — lo-fi ink stamp */}
                      <span style={{
                        fontSize: 7.5, padding: "1px 5px", flexShrink: 0,
                        color: pd.color, background: pd.labelBg,
                        border: `1px solid ${pd.color}55`,
                        fontFamily: "'Space Mono', monospace",
                        letterSpacing: "0.06em", borderRadius: 2,
                        fontWeight: 400, opacity: 0.85,
                      }}>
                        {pd.label}
                      </span>

                      {/* Context badge */}
                      <span style={{ fontSize: 9, padding: "1px 5px", flexShrink: 0, color: ctxColor, background: ctxColor + "18", border: `1px solid ${ctxColor}30`, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em", borderRadius: 4 }}>
                        {t.context}
                      </span>
                    </div>
                  );
                })
            )}
            {activeTasks.length > 8 && (
              <button
                onClick={() => onNavigate("tasks")}
                style={{ fontSize: 10, textAlign: "center", paddingTop: 2, color: MUTED, background: "none", border: "none", cursor: "pointer" }}
              >
                +{activeTasks.length - 8} more →
              </button>
            )}
          </div>
          </div>{/* /inner padding div */}
        </div>{/* /retro-window Col 2 */}

        {/* Col 3: AI Command Center */}
        <div className="retro-window" style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div className="retro-titlebar">
            <span>ai_assistant.app</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto", marginRight: 6 }}>
              {/* sparkle sticker */}
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.55 }}>
                <path d="M6 0 L6.5 5 L12 6 L6.5 7 L6 12 L5.5 7 L0 6 L5.5 5 Z" fill="oklch(0.62 0.10 50)" />
              </svg>
            </div>
            <div className="retro-titlebar-buttons">
              <span className="retro-titlebar-btn">_</span>
              <span className="retro-titlebar-btn">□</span>
              <span className="retro-titlebar-btn">✕</span>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", padding: "14px 16px" }}>
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
          </div>{/* /inner padding div */}
        </div>{/* /retro-window Col 3 */}
      </div>{/* /grid */}

      {/* ── BOTTOM: Today's wins + focus strip ── */}
      {(todayWins.length > 0 || focusSessions > 0) && (
        <div style={{ position: "relative", border: `1px solid oklch(0.65 0.12 75 / 0.3)`, background: "oklch(0.65 0.12 75 / 0.04)", padding: "7px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderRadius: 8 }}>
          {/* Cat sticker: olive playing cat — right side of wins strip */}
          <img src={CAT_OLIVE} alt="" aria-hidden="true" style={{ position: "absolute", right: 8, bottom: -22, width: 60, opacity: 0.42, pointerEvents: "none", zIndex: 5 }} />
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
