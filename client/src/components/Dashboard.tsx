/* ============================================================
   ADHD FOCUS SPACE — Editorial Dashboard v4.0
   Design: Compact laptop-first grid — fits one screen
   Layout:
     [TOP]    greeting bar + quick capture + context filter
     [MIDDLE] 3-col grid: Focus Timer | Next Up | Talk with AI
     [BOTTOM] Today's wins/focus strip (only when data exists)
   ============================================================ */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { FocusTimer } from "./FocusTimer";
import { ContextSwitcher, getContextConfig, type ActiveContext } from "./ContextSwitcher";
import type { Task } from "./TaskManager";
import type { Win } from "./DailyWins";
import type { Goal } from "./Goals";
import type { Agent } from "./AgentTracker";
import { Clock, Sparkles, Zap, Send, Bot, Loader2 } from "lucide-react";
import { PixelTrophy } from "@/components/PixelIcons";
import { Streamdown } from "streamdown";

const SUNSET_BLOB = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-sunset-blob_5606b6c8.png";

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
const TC_BORDER = "oklch(0.52 0.14 35 / 0.25)";
const CREAM     = "oklch(0.985 0.008 80)";
const BORDER    = "oklch(0.87 0.014 75)";
const INK       = "oklch(0.18 0.01 60)";
const MUTED     = "oklch(0.52 0.015 70)";
const AI_BG     = "oklch(0.975 0.010 260 / 0.5)";
const AI_BORDER = "oklch(0.75 0.05 260 / 0.35)";

/* Corner cross-hair decoration */
function CornerMark({ color = BORDER }: { color?: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" style={{ opacity: 0.45 }}>
      <line x1="6" y1="0" x2="6" y2="5" stroke={color} strokeWidth="1" />
      <line x1="7" y1="6" x2="12" y2="6" stroke={color} strokeWidth="1" />
    </svg>
  );
}

type ChatMessage = { role: "user" | "assistant"; content: string };

/* ── Inline AI Chat Panel ── */
function AIChatPanel({ taskCount, focusSessions, mood }: { taskCount: number; focusSessions: number; mood: number | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const endRef = useState<HTMLDivElement | null>(null);
  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    },
  });

  const send = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    chatMutation.mutate({ messages: newMessages, taskCount, focusSessions, mood });
  };

  const SUGGESTED = [
    "Help me prioritise my tasks",
    "I'm feeling overwhelmed",
    "What should I focus on?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexShrink: 0 }}>
        <Bot size={13} style={{ color: "oklch(0.50 0.12 260)" }} />
        <p className="editorial-label" style={{ color: "oklch(0.38 0.08 260)" }}>Talk with AI</p>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          paddingRight: 2,
          minHeight: 0,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
            <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>
              Your ADHD coach is here. Ask anything.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    setTimeout(() => {
                      const newMessages: ChatMessage[] = [{ role: "user", content: s }];
                      setMessages(newMessages);
                      setInput("");
                      chatMutation.mutate({ messages: newMessages, taskCount, focusSessions, mood });
                    }, 0);
                  }}
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    color: "oklch(0.42 0.08 260)",
                    background: "oklch(0.975 0.010 260 / 0.4)",
                    border: `1px solid ${AI_BORDER}`,
                    padding: "5px 9px",
                    cursor: "pointer",
                    lineHeight: 1.4,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "90%",
                  padding: "6px 10px",
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: m.role === "user" ? CREAM : INK,
                  background: m.role === "user"
                    ? TC
                    : "oklch(0.975 0.010 260 / 0.55)",
                  border: m.role === "user" ? "none" : `1px solid ${AI_BORDER}`,
                }}
              >
                {m.role === "assistant" ? (
                  <Streamdown>{m.content}</Streamdown>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))
        )}
        {chatMutation.isPending && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
            <Loader2 size={12} style={{ color: "oklch(0.50 0.12 260)", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 11, color: MUTED }}>Thinking…</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 8,
          border: `1px solid ${AI_BORDER}`,
          background: AI_BG,
          padding: "5px 8px",
          flexShrink: 0,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask your coach…"
          style={{
            flex: 1,
            fontSize: 12,
            background: "transparent",
            border: "none",
            outline: "none",
            color: INK,
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || chatMutation.isPending}
          style={{
            background: input.trim() ? "oklch(0.50 0.12 260)" : "transparent",
            border: `1px solid ${input.trim() ? "transparent" : AI_BORDER}`,
            color: input.trim() ? CREAM : MUTED,
            padding: "4px 7px",
            cursor: input.trim() ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Send size={11} />
        </button>
      </div>
    </div>
  );
}

export function Dashboard({ tasks, wins, goals, agents, mood, blockStreak = 0, blockHistory = {}, focusSessions = 0, onNavigate, onSessionComplete, onBlockComplete, allCategories, onQuickDump }: DashboardProps) {
  const [activeContext, setActiveContext] = useState<ActiveContext>("all");
  const [quickCapture, setQuickCapture] = useState("");
  const now = new Date();

  const contextTasks = tasks.filter((t) => activeContext === "all" ? true : t.context === activeContext);
  const activeTasks  = contextTasks.filter((t) => !t.done);
  const todayWins    = wins.filter((w) => new Date(w.createdAt).toDateString() === now.toDateString());

  const allContexts = Array.from(new Set(["work", "personal", ...tasks.map((t) => t.context)]));
  const ctxCounts: Record<string, number> = { all: tasks.filter((t) => !t.done).length };
  allContexts.forEach((ctx) => {
    ctxCounts[ctx] = tasks.filter((t) => !t.done && t.context === ctx).length;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── TOP BAR: greeting + quick capture + context ── */}
      <div
        className="relative overflow-hidden"
        style={{ border: `1px solid ${BORDER}` }}
      >
        {/* Subtle sunset background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${SUNSET_BLOB})`,
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
            opacity: 0.12,
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, oklch(0.985 0.008 80 / 0.95) 50%, oklch(0.985 0.008 80 / 0.75) 100%)` }}
        />
        {/* Corner marks */}
        <div className="absolute top-2 left-2"><CornerMark /></div>
        <div className="absolute top-2 right-2" style={{ transform: "rotate(90deg)" }}><CornerMark /></div>
        <div className="absolute bottom-2 left-2" style={{ transform: "rotate(-90deg)" }}><CornerMark /></div>
        <div className="absolute bottom-2 right-2" style={{ transform: "rotate(180deg)" }}><CornerMark /></div>

        <div className="relative" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {/* Date + greeting */}
          <div style={{ flexShrink: 0 }}>
            <p className="editorial-label" style={{ marginBottom: 1, fontSize: 9 }}>
              {DAYS[now.getDay()]} · {MONTHS[now.getMonth()]} {now.getDate()}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1
                className="text-xl font-bold italic leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: INK }}
              >
                {getGreeting()}
              </h1>
              {blockStreak > 0 && (
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "oklch(0.55 0.13 35 / 0.10)",
                    border: "1px solid oklch(0.55 0.13 35 / 0.30)",
                    padding: "2px 8px",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2c0 0-1 3-1 5 0 1.5 1 3 1 3s-3-1-3-4c0 0-3 3-3 7a6 6 0 0 0 12 0c0-5-4-8-6-11z" fill="oklch(0.55 0.13 35)" opacity="0.9" />
                  </svg>
                  <span style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.45 0.10 35)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {blockStreak}d streak
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 32, background: BORDER, flexShrink: 0 }} />

          {/* Quick capture */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              border: `1px solid ${BORDER}`,
              background: "oklch(0.975 0.012 80 / 0.85)",
              backdropFilter: "blur(4px)",
              padding: "6px 12px",
              flex: "1 1 200px",
              maxWidth: 340,
            }}
          >
            <Zap size={12} style={{ color: TC, flexShrink: 0 }} />
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

      {/* ── MIDDLE: 3-column grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          minHeight: 0,
        }}
      >
        {/* Col 1: Focus Timer */}
        <div
          style={{
            border: `1px solid ${BORDER}`,
            background: CREAM,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, flexShrink: 0 }}>
            <Clock size={12} style={{ color: TC }} />
            <p className="editorial-label">Focus Timer</p>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <FocusTimer onSessionComplete={onSessionComplete} onBlockComplete={onBlockComplete} />
          </div>
        </div>

        {/* Col 2: Next Up */}
        <div
          style={{
            border: `1px solid ${BORDER}`,
            background: CREAM,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Zap size={12} style={{ color: TC }} />
              <p className="editorial-label">Next Up</p>
            </div>
            <button className="m-btn-link" onClick={() => onNavigate("tasks")}>All tasks</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {activeTasks.slice(0, 7).map((t) => {
                  const pc: Record<string, string> = { urgent: "oklch(0.6 0.2 15)", focus: TC, normal: "oklch(0.62 0.1 75)" };
                  const ctxColor = getContextConfig(t.context).color;
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 8px",
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      <div style={{ width: 5, height: 5, flexShrink: 0, background: pc[t.priority] ?? TC }} />
                      <p style={{ fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: INK }}>
                        {t.text.replace(/(?:^|\s)#[a-zA-Z0-9\u4e00-\u9fa5_-]+/g, " ").replace(/\s{2,}/g, " ").trim() || t.text}
                      </p>
                      <span
                        style={{
                          fontSize: 9, padding: "1px 5px", flexShrink: 0,
                          color: ctxColor, background: ctxColor + "18",
                          border: `1px solid ${ctxColor}30`,
                          fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em",
                        }}
                      >
                        {t.context}
                      </span>
                    </div>
                  );
                })}
                {activeTasks.length > 7 && (
                  <p style={{ fontSize: 10, textAlign: "center", paddingTop: 2, color: MUTED }}>+{activeTasks.length - 7} more</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Col 3: Talk with AI */}
        <div
          style={{
            border: `1px solid ${AI_BORDER}`,
            background: AI_BG,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <AIChatPanel
            taskCount={activeTasks.length}
            focusSessions={focusSessions}
            mood={mood}
          />
        </div>
      </div>

      {/* ── BOTTOM: Today's wins + focus strip ── */}
      {(todayWins.length > 0 || focusSessions > 0) && (
        <div
          style={{
            border: `1px solid oklch(0.65 0.12 75 / 0.3)`,
            background: "oklch(0.65 0.12 75 / 0.04)",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Sparkles size={11} style={{ color: "oklch(0.55 0.12 75)" }} />
            <p className="editorial-label" style={{ fontSize: 9 }}>
              Today{todayWins.length > 0 ? ` · ${todayWins.length} win${todayWins.length > 1 ? "s" : ""}` : ""}
            </p>
          </div>
          {focusSessions > 0 && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "oklch(0.52 0.14 35 / 0.08)",
                border: "1px solid oklch(0.52 0.14 35 / 0.25)",
                borderRadius: 20,
                color: "oklch(0.42 0.14 35)",
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.04em",
                padding: "2px 9px",
              }}
            >
              ⏱ {focusSessions} session{focusSessions > 1 ? "s" : ""}
            </div>
          )}
          {todayWins.map((w) => (
            <div
              key={w.id}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "3px 9px",
                border: `1px solid oklch(0.65 0.12 75 / 0.3)`,
                background: CREAM,
                color: INK,
                fontSize: 11,
              }}
            >
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
