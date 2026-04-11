/* ============================================================
   ADHD FOCUS SPACE — Home Page v3.0
   Design: Warm Editorial Minimalism + LocalStorage Persistence
   - All state persisted to localStorage
   - Focus page simplified with atmospheric sunset background
   - Less text, more geometric shapes
   ============================================================ */

import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { FocusTimer } from "@/components/FocusTimer";
import { TaskManager, type Task } from "@/components/TaskManager";
import { DailyWins, type Win } from "@/components/DailyWins";
import { BrainDump } from "@/components/BrainDump";
import { Goals, type Goal } from "@/components/Goals";
import { AgentTracker, type Agent } from "@/components/AgentTracker";
import { AIHub } from "@/components/AIHub";
import { RetroPageWrapper } from "@/components/RetroPageWrapper";
import { GlobalQuickAdd } from "@/components/GlobalQuickAdd";
import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { DailyWrapUp } from "@/components/DailyWrapUp";
import { recordWrapUp, recordDumpEntry, recordFocusSession, recordBlockComplete } from "@/components/MonthlyProgress";
import { WeeklyResetNudge } from "@/components/WeeklyResetNudge";
import { DailyCheckIn, useDailyCheckIn, type CheckInResult } from "@/components/DailyCheckIn";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useBlockStreak } from "@/hooks/useBlockStreak";
import { useTimer } from "@/contexts/TimerContext";
import {
  DashboardDecor,
  FocusDecor,
  TasksDecor,
  WinsDecor,
  BrainDumpDecor,
  GoalsDecor,
  AgentsDecor,
} from "@/components/PageDecor";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Bot, Brain, Clock, LayoutDashboard, Moon, Sparkles, Star } from "lucide-react";
import { PixelDump } from "@/components/PixelIcons";


/* ── Compact mood pill SVG faces (same as MoodCheckIn) ── */
function PillFaceDrained({ active }: { active: boolean }) {
  const fill = active ? "#B8B4C8" : "#CCC8D8"; const c = "#5A5570";
  return <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%"><circle cx="40" cy="40" r="32" fill={fill} /><ellipse cx="28" cy="37" rx="4.5" ry="2.5" fill={c} /><ellipse cx="52" cy="37" rx="4.5" ry="2.5" fill={c} /><line x1="30" y1="52" x2="50" y2="52" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>;
}
function PillFaceLow({ active }: { active: boolean }) {
  const fill = active ? "#C0B8D4" : "#D4CEEA"; const c = "#5A5070";
  return <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%"><rect x="8" y="8" width="64" height="64" rx="22" fill={fill} /><circle cx="28" cy="37" r="3" fill={c} /><circle cx="52" cy="37" r="3" fill={c} /><path d="M30 52 Q40 47 50 52" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" /></svg>;
}
function PillFaceOkay({ active }: { active: boolean }) {
  const fill = active ? "#A89070" : "#C4AA88"; const c = "#4A3820";
  return <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%"><circle cx="40" cy="40" r="32" fill={fill} /><circle cx="28" cy="35" r="3.5" fill={c} /><circle cx="52" cy="35" r="3.5" fill={c} /><circle cx="40" cy="44" r="1.8" fill={c} opacity="0.7" /><line x1="30" y1="53" x2="50" y2="53" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>;
}
function PillFaceGood({ active }: { active: boolean }) {
  const fill = active ? "#90C8A8" : "#B0D8C0"; const c = "#2A5840";
  return <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%"><circle cx="40" cy="40" r="32" fill={fill} /><path d="M24 36 Q28 31 32 36" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" /><path d="M48 36 Q52 31 56 36" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" /><path d="M30 50 Q40 57 50 50" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" /></svg>;
}
function PillFaceGlowing({ active }: { active: boolean }) {
  const fill = active ? "#F0A878" : "#F8C8A0"; const c = "#7A3818";
  const pts = Array.from({ length: 20 }, (_, i) => { const a = (i * Math.PI) / 10 - Math.PI / 2; const r = i % 2 === 0 ? 38 : 28; return `${40 + r * Math.cos(a)},${40 + r * Math.sin(a)}`; }).join(" ");
  return <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%"><polygon points={pts} fill={fill} /><path d="M26 37 Q30 32 34 37" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" /><path d="M46 37 Q50 32 54 37" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" /><path d="M28 50 Q40 60 52 50" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" /></svg>;
}

const PILL_FACES = [PillFaceDrained, PillFaceLow, PillFaceOkay, PillFaceGood, PillFaceGlowing];
const MOOD_DATA = [
  { value: 1, label: "Drained", color: "oklch(0.50 0.06 280)" },
  { value: 2, label: "Low",     color: "oklch(0.48 0.08 290)" },
  { value: 3, label: "Okay",    color: "oklch(0.45 0.08 60)"  },
  { value: 4, label: "Good",    color: "oklch(0.40 0.12 155)" },
  { value: 5, label: "Glowing", color: "oklch(0.52 0.14 40)"  },
];

function MoodPill({ mood, onMoodChange }: { mood: number | null; onMoodChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = MOOD_DATA.find((m) => m.value === mood);
  const CurrentFace = mood ? PILL_FACES[mood - 1] : null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o: boolean) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 transition-all"
        style={{
          border: "1px solid oklch(0.87 0.014 75)",
          background: open ? "oklch(0.965 0.012 78)" : "transparent",
          borderRadius: 20,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.72rem",
          color: current ? current.color : "oklch(0.55 0.015 70)",
        }}
        title="How are you feeling?"
      >
        <span style={{ width: 18, height: 18, display: "inline-flex", flexShrink: 0 }}>
          {CurrentFace ? <CurrentFace active={true} /> : (
            <svg viewBox="0 0 80 80" fill="none" width="100%" height="100%"><circle cx="40" cy="40" r="32" fill="#B0D8C0" /><path d="M24 36 Q28 31 32 36" stroke="#2A5840" strokeWidth="2.5" strokeLinecap="round" fill="none" /><path d="M48 36 Q52 31 56 36" stroke="#2A5840" strokeWidth="2.5" strokeLinecap="round" fill="none" /><path d="M30 50 Q40 57 50 50" stroke="#2A5840" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>
          )}
        </span>
        <span className="hidden sm:inline">{current ? current.label : "Mood"}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 flex gap-1.5 p-2"
          style={{
            background: "oklch(0.990 0.006 78)",
            border: "1px solid oklch(0.87 0.014 75)",
            borderRadius: 12,
            boxShadow: "0 4px 16px oklch(0.18 0.01 60 / 0.10)",
          }}
        >
          {MOOD_DATA.map((m, i) => {
            const FaceComp = PILL_FACES[i];
            return (
              <button
                key={m.value}
                onClick={() => { onMoodChange(m.value); setOpen(false); }}
                title={m.label}
                className="flex flex-col items-center gap-1 px-2 py-1.5 transition-all"
                style={{
                  borderRadius: 8,
                  background: mood === m.value ? "oklch(0.965 0.012 78)" : "transparent",
                  border: mood === m.value ? `1px solid ${m.color}60` : "1px solid transparent",
                }}
              >
                <span style={{ width: 32, height: 32, display: "inline-flex" }}>
                  <FaceComp active={mood === m.value} />
                </span>
                <span style={{ fontSize: "0.60rem", color: m.color, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{m.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Simple flag icon for Goals — replaces complex flower
function GoalFlagIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} style={style}>
      <line x1="5" y1="2" x2="5" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 2 L15 5.5 L5 9 Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

type Section = "dashboard" | "focus" | "tasks" | "wins" | "braindump" | "goals" | "agents" | "ai";

const SECTION_META: Record<Section, { title: string; icon: React.ElementType }> = {
  dashboard:  { title: "Dashboard",    icon: LayoutDashboard },
  focus:      { title: "Focus Timer",  icon: Clock           },
  tasks:      { title: "My Tasks",     icon: Star     },
  wins:       { title: "Daily Wins",   icon: Sparkles        },
  braindump:  { title: "Brain Dump",   icon: Brain           },
  goals:      { title: "Weekly Goals", icon: GoalFlagIcon      },
  agents:     { title: "AI Agents",    icon: Bot             },
  ai:         { title: "AI Features",  icon: Sparkles        },
};

const INITIAL_TASKS: Task[] = [
  { id: "1", text: "Review project proposal",   priority: "urgent", context: "work",     done: false, createdAt: new Date() },
  { id: "2", text: "Reply to important emails", priority: "focus",  context: "work",     done: false, createdAt: new Date() },
  { id: "3", text: "Take a 10-minute walk",     priority: "normal", context: "personal", done: false, createdAt: new Date() },
];

const INITIAL_GOALS: Goal[] = [
  { id: "g1", text: "Complete the project proposal", progress: 30, context: "work",     createdAt: new Date() },
  { id: "g2", text: "Exercise 3 times this week",    progress: 0,  context: "personal", createdAt: new Date() },
];

const SUNSET_WIDE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-sunset-wide_e4204b59.png";

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const { durations } = useTimer();

  // ── Persisted state ──
  const [tasks,  setTasks]  = useLocalStorage<Task[]>("adhd-tasks",  INITIAL_TASKS);
  const [wins,   setWins]   = useLocalStorage<Win[]>("adhd-wins",   []);
  const [goals,  setGoals]  = useLocalStorage<Goal[]>("adhd-goals",  INITIAL_GOALS);
  const [agents, setAgents] = useLocalStorage<Agent[]>("adhd-agents", []);
  const [mood,   setMood]   = useLocalStorage<number | null>("adhd-mood", null);
  // Manually deleted custom tags — persisted so they stay gone even if no items use them
  const [deletedCategories, setDeletedCategories] = useLocalStorage<string[]>("adhd-deleted-categories", []);

  // ── Transient state ──
  // Initialise from today's session list so the counter survives page reloads
  const [focusSessions, setFocusSessions] = useState(() => {
    try {
      // First try the new detailed session list
      const listRaw = localStorage.getItem("adhd-focus-session-list");
      if (listRaw) {
        const list = JSON.parse(listRaw) as Record<string, Array<{ sessionNumber: number }>>;
        const today = new Date().toDateString();
        return (list[today] ?? []).length;
      }
      // Fallback: read from daily log count
      const logRaw = localStorage.getItem("adhd-daily-logs");
      if (logRaw) {
        const logs = JSON.parse(logRaw) as Record<string, { focusSessions?: number }>;
        const today = new Date().toDateString();
        return logs[today]?.focusSessions ?? 0;
      }
      return 0;
    } catch { return 0; }
  });
  const { streak: blockStreak, history: blockHistory, recordBlock } = useBlockStreak();
  const [timerQuitCount, setTimerQuitCount] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [wrapUpOpen, setWrapUpOpen] = useState(false);
  const [pendingDump, setPendingDump] = useState<string | null>(null);
  const [pendingAgentTask, setPendingAgentTask] = useState<string | null>(null);

  // One-time migration: remove old session- wins that were added before the pill badge change
  useEffect(() => {
    try {
      const raw = localStorage.getItem("adhd-wins");
      if (!raw) return;
      const all = JSON.parse(raw) as Array<{ id: string }>;
      const cleaned = all.filter((w) => !w.id.startsWith("session-"));
      if (cleaned.length !== all.length) {
        setWins(cleaned as Win[]);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Daily check-in
  const { show: showCheckIn, dismiss: dismissCheckIn } = useDailyCheckIn();

  const handleCheckInComplete = (data: CheckInResult) => {
    if (data.mood) setMood(data.mood);
    if (data.newGoals?.length) setGoals((p) => [...data.newGoals, ...p]);
    if (data.newTasks.length) setTasks((p) => [...data.newTasks, ...p]);
    if (data.newWins.length) setWins((p) => [...data.newWins, ...p]);
    if (data.newAgents.length) setAgents((p) => [...data.newAgents, ...p]);
    dismissCheckIn(true);
    toast.success("Workspace ready.", { duration: 2500 });
  };

  /* ── Task completion with confetti + goal auto-nudge ── */
  const handleTasksChange = (newTasks: Task[]) => {
    const newlyDone = newTasks.filter(
      (t) => t.done && !tasks.find((old) => old.id === t.id)?.done
    );
    if (newlyDone.length > 0) {
      setConfettiTrigger(true);
      const win: Win = {
        id: `task-${Date.now()}`,
        text: newlyDone[0].text.length > 40 ? newlyDone[0].text.slice(0, 40) + "…" : newlyDone[0].text,
        iconIdx: 5, // check icon
        createdAt: new Date(),
      };
      setWins((prev) => [win, ...prev]);

      // Auto-nudge linked goals: progress = 100 / total linked tasks per completed task
      const goalNudges: Record<string, number> = {};
      newlyDone.forEach((t) => {
        if (t.goalId) {
          // Count total tasks linked to this goal (including the one just completed)
          const totalLinked = newTasks.filter((task) => task.goalId === t.goalId).length;
          const increment = totalLinked > 0 ? Math.round(100 / totalLinked) : 10;
          goalNudges[t.goalId] = (goalNudges[t.goalId] ?? 0) + increment;
        }
      });
      if (Object.keys(goalNudges).length > 0) {
        // Check which goals will hit 100% after this nudge
        const goalsThatComplete: string[] = [];
        setGoals((prev) => {
          const updated = prev.map((g) => {
            if (!goalNudges[g.id]) return g;
            const newProgress = Math.min(100, g.progress + goalNudges[g.id]);
            if (newProgress >= 100 && g.progress < 100) goalsThatComplete.push(g.id);
            return { ...g, progress: newProgress };
          });
          return updated;
        });
        const nudgedGoal = goals.find((g) => goalNudges[g.id]);
        if (nudgedGoal) {
          const totalLinked = newTasks.filter((t) => t.goalId === nudgedGoal.id).length;
          const pct = totalLinked > 0 ? Math.round(100 / totalLinked) : 10;
          const newProgress = Math.min(100, nudgedGoal.progress + (goalNudges[nudgedGoal.id] ?? 0));
          if (newProgress >= 100) {
            // Goal achieved! Trigger special full-screen confetti + celebration toast
            setTimeout(() => setConfettiTrigger(true), 300);
            toast.success(
              `🎉 Goal achieved: "${nudgedGoal.text.length > 40 ? nudgedGoal.text.slice(0, 40) + "…" : nudgedGoal.text}"`,
              { duration: 6000, style: { fontSize: "13px", fontWeight: 600 } }
            );
          } else {
            toast.success(
              `→ Goal: "${nudgedGoal.text.length > 35 ? nudgedGoal.text.slice(0, 35) + "…" : nudgedGoal.text}" +${pct}%`,
              { duration: 3500 }
            );
          }
        }
      }
    }
    setTasks(newTasks);
  };

  const handleSessionComplete = () => {
    recordFocusSession(durations.focus);
    setFocusSessions((s) => {
      setConfettiTrigger(true);
      return s + 1;
    });
  };

  const handleBlockComplete = () => {
    recordBlockComplete();
    const blockWin: Win = {
      id: `block-${Date.now()}`,
      text: "2-hour deep focus block complete",
      iconIdx: 99, // special flame icon
      createdAt: new Date(),
    };
    setWins((prev) => [blockWin, ...prev]);
    setFocusSessions(0); // reset for next block
    recordBlock(); // increment streak
  };

  const handleConvertToTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    toast.success("Added to tasks.", { duration: 2000 });
  };

  const handleDumpEntry = (task: Task) => {
    // Record that a brain dump entry was added today
    recordDumpEntry();
    handleConvertToTask(task);
  };

  const meta = SECTION_META[activeSection];
  const Icon = meta.icon;
  const runningAgents = agents.filter((a) => a.status === "running").length;

  // ── Unified category system: aggregate all contexts from tasks, goals, agents ──
  const allCategories = Array.from(new Set([
    "work", "personal",
    ...tasks.map((t) => t.context),
    ...goals.map((g) => g.context),
    ...agents.map((a) => a.context),
  ])).filter(Boolean).filter((c) => !deletedCategories.includes(c));

  /** Clear all test data — wipes tasks, wins, goals, agents but keeps settings */
  const handleClearTestData = () => {
    if (!confirm("Clear all tasks, wins, goals, and agents? This cannot be undone.")) return;
    setTasks([]);
    setWins([]);
    setGoals([]);
    setAgents([]);
    setMood(null);
    setDeletedCategories([]);
    // Clear daily check-in suppression keys (both skip + X-dismiss for today)
    const today = new Date().toDateString();
    localStorage.removeItem(`adhd-checkin-skip-${today}`);
    localStorage.removeItem(`adhd-checkin-x-${today}`);
    // Re-show the check-in modal immediately
    dismissCheckIn(false); // hide current if open
    setTimeout(() => {
      // Trigger a page reload so the hook re-evaluates and shows the modal
      window.location.reload();
    }, 300);
    toast.success("All test data cleared. Reloading…", { duration: 2000 });
  };

  /** Delete a custom category: reassign all its items to "personal", then hide the tag */
  const handleDeleteCategory = (ctx: string) => {
    if (ctx === "work" || ctx === "personal") return; // protect built-ins
    setTasks((prev) => prev.map((t) => t.context === ctx ? { ...t, context: "personal" } : t));
    setGoals((prev) => prev.map((g) => g.context === ctx ? { ...g, context: "personal" } : g));
    setAgents((prev) => prev.map((a) => a.context === ctx ? { ...a, context: "personal" } : a));
    setDeletedCategories((prev) => [...prev, ctx]);
    toast.success(`#${ctx} tag removed. Items moved to Personal.`, { duration: 3000 });
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={(s) => setActiveSection(s as Section)} onClearData={handleClearTestData} />

      {/* Main content */}
      <main className="flex-1 ml-14 min-h-screen flex flex-col">
        {/* Top header bar — retro lo-fi light style */}
        <header
          className="sticky top-0 z-30 flex items-center gap-0"
          style={{
            background: "#F9D6E8",
            borderBottom: "3px solid #D45898",
            boxShadow: "0 3px 0 #E8A0C8, 0 5px 12px rgba(212,88,152,0.12)",
            minHeight: 48,
          }}
        >
          {/* Left: logo + page icon + title */}
          <div
            className="flex items-center gap-3 px-6 py-3 flex-1 min-w-0"
            style={{ borderRight: "1.5px solid #E8B8D0" }}
          >

            {/* App logo mark — pixel brain with lightning */}
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 30, height: 30,
                background: "#D45898",
                border: "2px solid #B03878",
                boxShadow: "2px 2px 0 #882858, inset 0 1px 0 #E880B8",
                position: "relative",
              }}
            >
              {/* Pixel-art brain + bolt SVG */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                {/* Brain left lobe */}
                <rect x="2" y="5" width="5" height="6" rx="2.5" fill="#FAF6F1" opacity="0.9"/>
                {/* Brain right lobe */}
                <rect x="11" y="5" width="5" height="6" rx="2.5" fill="#FAF6F1" opacity="0.9"/>
                {/* Brain center connector */}
                <rect x="6" y="7" width="6" height="2" fill="#FAF6F1" opacity="0.9"/>
                {/* Brain stem */}
                <rect x="8" y="11" width="2" height="3" fill="#FAF6F1" opacity="0.7"/>
                {/* Lightning bolt */}
                <polygon points="10,2 7,9 9,9 8,16 11,7 9,7" fill="#FFD080" opacity="0.95"/>
              </svg>
            </div>
            <div style={{ width: 1, height: 20, background: "#E8B8D0", flexShrink: 0 }} />
            {/* Page section icon */}
            <div
              className="flex items-center justify-center w-6 h-6 shrink-0"
                style={{ opacity: 0.75 }}
            >
              {activeSection === "braindump" ? (
                <PixelDump size={13} active={true} />
              ) : (
                <Icon className="w-3.5 h-3.5" style={{ color: "#B03878" }} />
              )}
            </div>
            <h1
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#6A1840",
                margin: 0,
                lineHeight: 1,
              }}
            >
              {meta.title}
            </h1>
          </div>

          {/* Right: stats + mood + wrap-up */}
          <div className="flex items-center shrink-0" style={{ gap: 0 }}>
            {/* Quick-stats — visible on all sections */}
            <div className="hidden sm:flex items-center" style={{ borderRight: "1.5px solid #E8B8D0" }}>                {[
                  { label: "tasks", value: tasks.filter((t) => !t.done).length, section: "tasks" as Section },
                  { label: "wins",  value: wins.filter((w) => new Date(w.createdAt).toDateString() === new Date().toDateString()).length, section: "wins" as Section },
                  { label: "agents live", value: agents.filter((a) => a.status === "running").length, section: "agents" as Section },
                ].map(({ label, value, section }, i, arr) => (
                  <React.Fragment key={label}>
                    <button
                      onClick={() => setActiveSection(section)}
                      className="flex items-baseline gap-1.5 transition-all cursor-pointer px-4 py-3"
                      style={{ background: "transparent", border: "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,88,152,0.10)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#6A1840", letterSpacing: "0.02em" }}>{value}</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 400, fontFamily: "'Space Mono', monospace", color: "#C070A0", letterSpacing: "0.10em", textTransform: "uppercase" }}>{label}</span>
                    </button>
                    {i < arr.length - 1 && (
                      <div style={{ width: 1, height: 20, background: "#E8B8D0" }} />
                    )}
                  </React.Fragment>
                ))}
            </div>

            {/* Mood pill */}
            <div className="px-4 py-3" style={{ borderRight: "1.5px solid #E8B8D0" }}>
              <MoodPill mood={mood} onMoodChange={setMood} />
            </div>

            {/* Wrap-up */}
            <button
              onClick={() => setWrapUpOpen(true)}
              className="flex items-center gap-2 transition-all px-5 py-3"
              style={{
                color: "#C070A0",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,88,152,0.10)"; (e.currentTarget as HTMLButtonElement).style.color = "#6A1840"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#C070A0"; }}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wrap up</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 px-8 py-8 overflow-y-auto">
          <div className={cn("mx-auto", activeSection === "dashboard" ? "max-w-7xl" : "max-w-3xl")}>

            {/* Weekly reset nudge */}
            <div className="mb-6">
              <WeeklyResetNudge />
            </div>

            {activeSection === "dashboard" && (
              <div className="relative">
                <DashboardDecor />
              <Dashboard
                tasks={tasks}
                wins={wins}
                goals={goals}
                agents={agents}
                mood={mood}
                blockStreak={blockStreak}
                blockHistory={blockHistory}
                onNavigate={(s) => setActiveSection(s as Section)}
                onSessionComplete={handleSessionComplete}
                onBlockComplete={handleBlockComplete}
                focusSessions={focusSessions}
                allCategories={allCategories}
                onQuickDump={(text) => setPendingDump(text)}
                onTaskToggle={(id) => {
                  const updated = tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t);
                  handleTasksChange(updated);
                }}
                onTaskCreate={(task) => setTasks((prev) => [task, ...prev])}
                onGoalCreate={(goal) => setGoals((prev) => [goal, ...prev])}
                onAgentCreate={(agent) => setAgents((prev) => [agent, ...prev])}
                onWinCreate={(win) => setWins((prev) => [win, ...prev])}
              />
              </div>
            )}

            {activeSection === "focus" && (
              <div className="relative py-8 px-4" style={{ minHeight: 700, overflow: "visible" }}>
                <FocusDecor />

                {/* ── Speech bubble — top-left decorative ── */}
                <div style={{
                  position: "absolute",
                  top: 18,
                  left: 12,
                  zIndex: 10,
                  transform: "rotate(-2deg)",
                  pointerEvents: "none",
                  userSelect: "none",
                }}>
                  {/* Stars */}
                  <div style={{ position: "absolute", top: -14, left: 8, fontSize: 11, color: "oklch(0.62 0.12 55)" }}>✦</div>
                  <div style={{ position: "absolute", top: -6, left: 28, fontSize: 8, color: "oklch(0.62 0.12 55)" }}>✦</div>
                  <div style={{ position: "absolute", bottom: -8, left: 4, fontSize: 14, color: "oklch(0.58 0.14 45)" }}>★</div>
                  {/* Bubble */}
                  <div style={{
                    background: "oklch(0.985 0.008 76)",
                    border: "1.5px solid oklch(0.38 0.018 55)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    maxWidth: 148,
                    position: "relative",
                    boxShadow: "2px 2px 0 oklch(0.38 0.018 55 / 0.25)",
                  }}>
                    <p style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      lineHeight: 1.55,
                      color: "oklch(0.32 0.018 55)",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                      margin: 0,
                    }}>let it go,<br />so you can<br />grow.</p>
                    {/* Tail pointing right-down */}
                    <div style={{
                      position: "absolute",
                      bottom: -10,
                      right: 18,
                      width: 0,
                      height: 0,
                      borderLeft: "8px solid transparent",
                      borderRight: "0px solid transparent",
                      borderTop: "10px solid oklch(0.38 0.018 55)",
                    }} />
                    <div style={{
                      position: "absolute",
                      bottom: -8,
                      right: 19,
                      width: 0,
                      height: 0,
                      borderLeft: "7px solid transparent",
                      borderRight: "0px solid transparent",
                      borderTop: "9px solid oklch(0.985 0.008 76)",
                    }} />
                  </div>
                </div>

                {/* ── Main focus_timer.exe window — slight tilt left ── */}
                <div style={{
                  position: "relative",
                  zIndex: 2,
                  transform: "rotate(-1deg)",
                  transformOrigin: "top center",
                  marginLeft: "auto",
                  marginRight: "auto",
                  maxWidth: 660,
                }}>
                  <FocusTimer onSessionComplete={handleSessionComplete} onBlockComplete={handleBlockComplete} onQuit={() => setTimerQuitCount(q => q + 1)} />
                </div>

                {/* ── session_tips.txt window — below the timer, slightly tilted ── */}
                <div style={{
                  position: "relative",
                  zIndex: 3,
                  width: 210,
                  marginTop: 18,
                  marginLeft: "auto",
                  marginRight: "auto",
                  transform: "rotate(-1.5deg)",
                  transformOrigin: "top center",
                  boxShadow: "4px 4px 0 rgba(180,60,120,0.15)",
                }}>
                  <RetroPageWrapper title="session_tips.txt" sticker="leaf">
                    <div style={{ padding: "10px 14px 12px" }}>
                      <p className="editorial-label mb-3">Session tips</p>
                      <div className="space-y-2">
                        {[
                          "Phone face-down or in another room",
                          "Close all unneeded browser tabs",
                          "Use Brain Dump for distracting thoughts",
                        ].map((tip, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div
                              className="w-1 h-1 mt-1.5 shrink-0"
                              style={{ background: "oklch(0.52 0.14 35)", transform: "rotate(45deg)" }}
                            />
                            <p className="text-xs" style={{ color: "oklch(0.45 0.01 60)" }}>{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </RetroPageWrapper>
                </div>
              </div>
            )}

            {activeSection === "tasks" && (
              <RetroPageWrapper title="tasks.txt" sticker="star">
                <div className="p-8 min-h-[600px] flex flex-col relative overflow-hidden">
                <TasksDecor />
                <div className="relative z-10">
                  <TaskManager tasks={tasks} onTasksChange={handleTasksChange} allCategories={allCategories} onDeleteCategory={handleDeleteCategory} goals={goals} />
                </div>
                </div>
              </RetroPageWrapper>
            )}

            {activeSection === "wins" && (
              <RetroPageWrapper title="wins.log" sticker="sparkle">
              <div className="p-8 min-h-[600px] flex flex-col relative overflow-hidden">
                <WinsDecor />
                <div className="relative z-10">
                  <DailyWins wins={wins} onWinsChange={setWins} />
                </div>
              </div>
              </RetroPageWrapper>
            )}

            {activeSection === "braindump" && (
              <RetroPageWrapper title="brain_dump.txt" sticker="sparkle">
              <div className="p-8 min-h-[600px] flex flex-col relative overflow-hidden">
                <BrainDumpDecor />
                <div className="relative z-10">
                  <BrainDump
                    onConvertToTask={handleConvertToTask}
                    onDump={recordDumpEntry}
                    initialText={pendingDump ?? undefined}
                    onInitialTextConsumed={() => setPendingDump(null)}
                    onCreateAgent={(text) => {
                      setPendingAgentTask(text);
                      setActiveSection("agents");
                    }}
                    onAddGoal={(text) => {
                      const newGoal: Goal = {
                        id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        text,
                        progress: 0,
                        context: "personal",
                        createdAt: new Date(),
                      };
                      setGoals((prev) => [newGoal, ...prev]);
                    }}
                  />
                </div>
              </div>
              </RetroPageWrapper>
            )}

            {activeSection === "goals" && (
              <RetroPageWrapper title="goals.md" sticker="leaf">
              <div className="p-8 min-h-[600px] flex flex-col relative overflow-hidden">
                <GoalsDecor />
                <div className="relative z-10">
                  <Goals goals={goals} onGoalsChange={setGoals} allCategories={allCategories} onDeleteCategory={handleDeleteCategory} tasks={tasks} onTasksChange={handleTasksChange} />
                </div>
              </div>
              </RetroPageWrapper>
            )}

            {activeSection === "agents" && (
              <RetroPageWrapper title="agents.app" sticker="star">
              <div className="p-8 relative">
                <AgentsDecor />
                <AgentTracker
                  agents={agents}
                  onAgentsChange={setAgents}
                  tasks={tasks}
                  allCategories={allCategories}
                  pendingTaskText={pendingAgentTask ?? undefined}
                  onPendingTaskConsumed={() => setPendingAgentTask(null)}
                />
              </div>
              </RetroPageWrapper>
            )}

            {activeSection === "ai" && (
              <RetroPageWrapper title="ai_hub.exe" sticker="sparkle">
              <div className="p-8 min-h-[600px] flex flex-col">
                <AIHub />
              </div>
              </RetroPageWrapper>
            )}
          </div>
        </div>
      </main>

      {/* ── Global overlays ── */}
      <GlobalQuickAdd onAddTask={(t) => setTasks((p) => [t, ...p])} />
      <ConfettiCelebration trigger={confettiTrigger} onComplete={() => setConfettiTrigger(false)} />

      {wrapUpOpen && (
        <DailyWrapUp
          tasks={tasks}
          wins={wins}
          agents={agents}
          quitCount={timerQuitCount}
          onClose={() => {
            const todayWins = wins.filter(w => new Date(w.createdAt).toDateString() === new Date().toDateString());
            const todayDone = tasks.filter(t => t.done && new Date(t.createdAt).toDateString() === new Date().toDateString());
            const score = Math.min(100, todayDone.length * 15 + todayWins.length * 10 + 20);
            recordWrapUp(mood, score);
            setWrapUpOpen(false);
          }}
        />
      )}

      {showCheckIn && (
        <DailyCheckIn
          onComplete={handleCheckInComplete}
          onSkip={() => dismissCheckIn(true)}
          onClose={() => dismissCheckIn(false)}
        />
      )}
    </div>
  );
}
