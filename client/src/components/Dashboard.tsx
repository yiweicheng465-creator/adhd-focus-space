/* ============================================================
   ADHD FOCUS SPACE — Editorial Dashboard v3.0
   Design: Warm Editorial Minimalism + Atmospheric Sunset
   - Sunset hero image as atmospheric background panel
   - Geometric SVG decorations replace verbose text blocks
   - Playfair Display serif headings, DM Sans body
   - Thin 1px borders, cream backgrounds, terracotta accents
   ============================================================ */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FocusTimer } from "./FocusTimer";
import { ContextSwitcher, getContextConfig, type ActiveContext } from "./ContextSwitcher";
import type { Task } from "./TaskManager";
import type { Win } from "./DailyWins";
import type { Goal } from "./Goals";
import type { Agent } from "./AgentTracker";
import { CheckCircle2, Clock, Flame, Sparkles, Zap } from "lucide-react";
import { PixelAgents } from "@/components/PixelIcons";
import { PixelTrophy } from "@/components/PixelIcons";

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
  /** Shared category list from Home — all contexts across tasks/goals/agents */
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

const TC       = "oklch(0.52 0.14 35)";
const TC_LIGHT = "oklch(0.52 0.14 35 / 0.08)";
const TC_BORDER = "oklch(0.52 0.14 35 / 0.25)";
const CREAM    = "oklch(0.985 0.008 80)";
const BORDER   = "oklch(0.87 0.014 75)";
const INK      = "oklch(0.18 0.01 60)";
const MUTED    = "oklch(0.52 0.015 70)";

/* Tiny geometric SVG decoration — horizontal rule with diamond */
function GeoDivider({ color = BORDER }: { color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
      <div style={{ flex: 1, height: 1, background: color }} />
      <svg width="8" height="8" viewBox="0 0 8 8">
        <rect x="1" y="1" width="6" height="6" transform="rotate(45 4 4)" fill="none" stroke={color} strokeWidth="1" />
      </svg>
      <div style={{ flex: 1, height: 1, background: color }} />
    </div>
  );
}

/* Corner cross-hair decoration */
function CornerMark({ color = BORDER }: { color?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" style={{ opacity: 0.5 }}>
      <line x1="6" y1="0" x2="6" y2="5" stroke={color} strokeWidth="1" />
      <line x1="7" y1="6" x2="12" y2="6" stroke={color} strokeWidth="1" />
    </svg>
  );
}

export function Dashboard({ tasks, wins, goals, agents, mood, onNavigate, onSessionComplete, allCategories, onQuickDump }: DashboardProps) {
  const [activeContext, setActiveContext] = useState<ActiveContext>("all");
  const [quickCapture, setQuickCapture] = useState("");
  const now = new Date();

  const contextTasks  = tasks.filter((t) => activeContext === "all" ? true : t.context === activeContext);
  const contextGoals  = goals.filter((g) => activeContext === "all" ? true : g.context === activeContext);
  const contextAgents = agents.filter((a) => activeContext === "all" ? true : a.context === activeContext);

  const activeTasks  = contextTasks.filter((t) => !t.done);
  const urgentTasks  = activeTasks.filter((t) => t.priority === "urgent");
  const todayWins    = wins.filter((w) => new Date(w.createdAt).toDateString() === now.toDateString());
  const avgGoalProg  = contextGoals.length > 0
    ? Math.round(contextGoals.reduce((s, g) => s + g.progress, 0) / contextGoals.length)
    : 0;

  const today         = now.toDateString();
  const todayAgents   = contextAgents.filter((a) => new Date(a.startedAt).toDateString() === today);
  const runningAgents = contextAgents.filter((a) => a.status === "running");
  const uncovered     = activeTasks.filter(
    (t) => !agents.some((a) => a.linkedTaskId === t.id && (a.status === "running" || a.status === "paused"))
  );

  // Build counts for all known contexts (dynamic)
  const allContexts = Array.from(new Set(["work", "personal", ...tasks.map((t) => t.context)]));
  const ctxCounts: Record<string, number> = { all: tasks.filter((t) => !t.done).length };
  allContexts.forEach((ctx) => {
    ctxCounts[ctx] = tasks.filter((t) => !t.done && t.context === ctx).length;
  });

  return (
    <div className="flex flex-col gap-6">

      {/* ── Hero: sunset atmospheric panel ── */}
      <div
        className="relative overflow-hidden"
        style={{ border: `1px solid ${BORDER}`, minHeight: 200 }}
      >
        {/* Sunset image background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${SUNSET_BLOB})`,
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
            opacity: 0.22,
          }}
        />
        {/* Gradient overlay for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, oklch(0.985 0.008 80 / 0.92) 40%, oklch(0.985 0.008 80 / 0.60) 100%)`,
          }}
        />

        {/* Corner marks */}
        <div className="absolute top-3 left-3"><CornerMark /></div>
        <div className="absolute top-3 right-3" style={{ transform: "rotate(90deg)" }}><CornerMark /></div>
        <div className="absolute bottom-3 left-3" style={{ transform: "rotate(-90deg)" }}><CornerMark /></div>
        <div className="absolute bottom-3 right-3" style={{ transform: "rotate(180deg)" }}><CornerMark /></div>

        {/* Content — illustration left, text right */}
        <div className="relative flex items-stretch">
          {/* Left: illustration panel */}
          <div
            className="hidden md:flex w-44 shrink-0 items-end justify-center pb-0 pt-4"
            style={{ borderRight: `1px solid ${BORDER}` }}
          >
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-editorial-person-Bt8k6YePvnPHSwcK8XtieV.webp"
              alt="thinking person illustration"
              className="object-contain w-full"
              style={{ maxHeight: 190, opacity: 0.72 }}
            />
          </div>
          {/* Right: greeting + controls */}
          <div className="flex-1 p-7 flex flex-col gap-4">
          {/* Date + greeting */}
          <div>
            <p className="editorial-label mb-1">
              {DAYS[now.getDay()]} · {MONTHS[now.getMonth()]} {now.getDate()}
            </p>
            <h1
              className="text-3xl font-bold italic leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: INK }}
            >
              {getGreeting()}
            </h1>
          </div>

          <GeoDivider />

          {/* Quick capture */}
          <div
            className="flex items-center gap-3 px-4 py-3 max-w-lg"
            style={{ border: `1px solid ${BORDER}`, background: "oklch(0.975 0.012 80 / 0.85)", backdropFilter: "blur(4px)" }}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: TC }} />
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
              className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground/60"
              style={{ color: INK }}
            />
            <kbd className="hidden sm:inline text-[10px] border px-1.5 py-0.5" style={{ color: MUTED, borderColor: BORDER }}>↵</kbd>
          </div>

          {/* Context switcher — dynamic categories */}
          <ContextSwitcher active={activeContext} onChange={setActiveContext} counts={ctxCounts} contexts={allContexts} />
          </div>{/* end right column */}
        </div>{/* end illustration+content row */}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-4" style={{ border: `1px solid ${BORDER}`, background: CREAM, position: "relative", zIndex: 1 }}>
          {[
            { icon: <Flame className="w-3.5 h-3.5" />, label: "Urgent",  value: urgentTasks.length,  section: "tasks",  accent: "oklch(0.58 0.18 20)" },
            { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Active", value: activeTasks.length, section: "tasks", accent: TC },
            { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Wins today", value: todayWins.length, section: "wins", accent: "oklch(0.55 0.14 75)" },
            { icon: <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5"><line x1="5" y1="2" x2="5" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M5 2 L15 5.5 L5 9 Z" fill="currentColor" opacity="0.85" /></svg>, label: "Goals avg", value: `${avgGoalProg}%`, section: "goals", accent: "oklch(0.48 0.12 155)" },
          ].map(({ icon, label, value, section, accent }, i, arr) => (
            <button
              key={label}
              onClick={() => onNavigate(section)}
              className="flex flex-col gap-1.5 px-5 py-4 text-left transition-all hover:opacity-80 relative group cursor-pointer"
              style={{ borderRight: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}
            >
              <div className="flex items-center gap-1.5" style={{ color: accent }}>
                {icon}
                <span style={{ fontSize: "0.62rem", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: INK, fontStyle: "italic" }}>{value}</p>
              {/* Bottom accent bar on hover */}
              <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300" style={{ background: accent }} />
            </button>
          ))}
        </div>

      {/* ── Bottom: Focus timer + Next up ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Focus timer */}
        <div className="p-7" style={{ border: `1px solid ${BORDER}`, background: CREAM }}>
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-3.5 h-3.5" style={{ color: TC }} />
            <p className="editorial-label">Focus Timer</p>
          </div>
          <FocusTimer onSessionComplete={onSessionComplete} />
        </div>

        {/* Next up */}
        <div className="p-7 flex flex-col" style={{ border: `1px solid ${BORDER}`, background: CREAM }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" style={{ color: TC }} />
              <p className="editorial-label">Next Up</p>
            </div>
            <button className="m-btn-link" onClick={() => onNavigate("tasks")}>All tasks</button>
          </div>

          {activeTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-4">
              {/* Geometric empty state */}
              <svg width="40" height="40" viewBox="0 0 40 40" style={{ opacity: 0.18 }}>
                <circle cx="20" cy="20" r="18" fill="none" stroke={INK} strokeWidth="1" />
                <line x1="20" y1="8" x2="20" y2="32" stroke={INK} strokeWidth="0.8" />
                <line x1="8" y1="20" x2="32" y2="20" stroke={INK} strokeWidth="0.8" />
                <circle cx="20" cy="20" r="3" fill={INK} />
              </svg>
              <button className="m-btn-primary" onClick={() => onNavigate("tasks")}>Add a task</button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.slice(0, 5).map((t) => {
                const pc: Record<string, string> = { urgent: "oklch(0.6 0.2 15)", focus: TC, normal: "oklch(0.62 0.1 75)" };
                const ctxColor = getContextConfig(t.context).color;
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-3 transition-all"
                    style={{ border: `1px solid ${BORDER}` }}
                  >
                    <div className="w-1.5 h-1.5 shrink-0" style={{ background: pc[t.priority] ?? TC }} />
                    <p className="text-sm flex-1 truncate" style={{ color: INK }}>{t.text}</p>
                    <span
                      className="text-[10px] px-1.5 py-0.5 shrink-0"
                      style={{ color: ctxColor, background: ctxColor + "18", border: `1px solid ${ctxColor}30`, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em" }}
                    >
                      {t.context}
                    </span>
                  </div>
                );
              })}
              {activeTasks.length > 5 && (
                <p className="text-xs text-center pt-1" style={{ color: MUTED }}>+{activeTasks.length - 5} more</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── AI Agents panel ── */}
      <div
        className="p-6 cursor-pointer transition-all hover:opacity-95"
        style={{ border: `1px solid ${runningAgents.length > 0 ? TC_BORDER : BORDER}`, background: runningAgents.length > 0 ? TC_LIGHT : CREAM }}
        onClick={() => onNavigate("agents")}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PixelAgents size={14} active={true} color={TC} />
            <p className="editorial-label">AI Agents</p>
            {runningAgents.length > 0 && (
              <span
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5"
                style={{ background: TC_LIGHT, color: TC, border: `1px solid ${TC_BORDER}` }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: TC }} />
                {runningAgents.length} live
              </span>
            )}
          </div>
          <button className="m-btn-link" onClick={(e) => { e.stopPropagation(); onNavigate("agents"); }}>Manage</button>
        </div>

        {todayAgents.length === 0 ? (
          <div className="flex items-center gap-4 py-2">
            {/* Geometric bot placeholder */}
            <svg width="32" height="32" viewBox="0 0 32 32" style={{ opacity: 0.18, flexShrink: 0 }}>
              <rect x="6" y="10" width="20" height="16" fill="none" stroke={INK} strokeWidth="1" />
              <circle cx="12" cy="18" r="2.5" fill="none" stroke={INK} strokeWidth="1" />
              <circle cx="20" cy="18" r="2.5" fill="none" stroke={INK} strokeWidth="1" />
              <line x1="16" y1="10" x2="16" y2="6" stroke={INK} strokeWidth="1" />
              <circle cx="16" cy="5" r="1.5" fill={INK} />
            </svg>
            <p className="text-sm" style={{ color: MUTED }}>No agents today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayAgents.slice(0, 3).map((a) => {
              const sc: Record<string, string> = { running: TC, paused: "oklch(0.65 0.12 75)", done: "oklch(0.5 0.12 145)", failed: "oklch(0.6 0.2 15)" };
              return (
                <div key={a.id} className="flex items-center gap-3 p-3" style={{ border: `1px solid ${BORDER}`, background: "oklch(0.975 0.012 80)" }}>
                  <div className="w-1.5 h-1.5 shrink-0" style={{ background: sc[a.status] }} />
                  <span className="text-sm font-medium shrink-0" style={{ color: INK }}>{a.name}</span>
                  <span className="text-sm truncate flex-1" style={{ color: MUTED }}>{a.task}</span>
                  <span className="text-xs shrink-0 capitalize" style={{ color: sc[a.status] }}>{a.status}</span>
                </div>
              );
            })}
            {todayAgents.length > 3 && (
              <p className="text-xs text-center pt-1" style={{ color: MUTED }}>+{todayAgents.length - 3} more</p>
            )}
            {uncovered.length > 0 && (
              <div className="flex items-center gap-2 p-2.5" style={{ background: "oklch(0.65 0.2 15 / 0.05)", border: "1px solid oklch(0.65 0.2 15 / 0.2)" }}>
                <Flame className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.55 0.2 15)" }} />
                <p className="text-xs" style={{ color: "oklch(0.45 0.18 15)" }}>
                  {uncovered.length} task{uncovered.length > 1 ? "s" : ""} uncovered
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Today's wins ── */}
      {todayWins.length > 0 && (
        <div className="p-5" style={{ border: `1px solid oklch(0.65 0.12 75 / 0.3)`, background: "oklch(0.65 0.12 75 / 0.04)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.12 75)" }} />
              <p className="editorial-label">Today · {todayWins.length} win{todayWins.length > 1 ? "s" : ""}</p>
            </div>
            <button className="m-btn-link" onClick={() => onNavigate("wins")}>Log more</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {todayWins.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
                style={{ border: `1px solid oklch(0.65 0.12 75 / 0.3)`, background: "oklch(0.985 0.008 80)", color: INK }}
              >
                <PixelTrophy size={12} color="oklch(0.55 0.12 75)" />
                <span>{w.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
