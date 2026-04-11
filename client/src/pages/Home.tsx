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
        {/* Top header bar */}
        <header
          className="sticky top-0 z-30 px-8 py-4 flex items-center gap-4"
          style={{
            background: "#EFE0C8E6",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #C9A87C",
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {activeSection === "braindump" ? (
            <PixelDump size={16} active={false} />
          ) : (
            <Icon className="w-4 h-4 shrink-0" style={{ color: "oklch(0.52 0.14 35)" }} />
          )}
            <h1
              className="text-base font-bold italic leading-tight truncate"
              style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.18 0.01 60)" }}
            >
              {meta.title}
            </h1>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Dashboard quick-stats in header — clickable, only shown on dashboard */}
            {activeSection === "dashboard" && (
              <div className="hidden sm:flex items-center gap-3">
                {[
                  { label: "tasks", value: tasks.filter((t) => !t.done).length, section: "tasks" as Section },
                  { label: "wins",  value: wins.filter((w) => new Date(w.createdAt).toDateString() === new Date().toDateString()).length, section: "wins" as Section },
                  { label: "agents live", value: agents.filter((a) => a.status === "running").length, section: "agents" as Section },
                ].map(({ label, value, section }, i, arr) => (
                  <React.Fragment key={label}>
                    <button
                      onClick={() => setActiveSection(section)}
                      className="flex items-baseline gap-1.5 transition-all hover:opacity-60 cursor-pointer"
                      style={{ background: "transparent", border: "none", padding: 0 }}
                    >
                      <span style={{ fontSize: "0.95rem", fontWeight: 400, fontFamily: "'DM Sans', sans-serif", color: "oklch(0.45 0.010 70)", letterSpacing: "-0.01em" }}>{value}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 400, fontFamily: "'DM Sans', sans-serif", color: "oklch(0.55 0.010 70)" }}>{label}</span>
                    </button>
                    {i < arr.length - 1 && (
                      <span style={{ color: "oklch(0.70 0.008 70)", fontSize: "0.5rem", lineHeight: 1 }}>·</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Mood pill */}
            <MoodPill mood={mood} onMoodChange={setMood} />

            {/* Wrap-up */}
            <button
              onClick={() => setWrapUpOpen(true)}
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-foreground"
              style={{ color: "oklch(0.55 0.015 70)" }}
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
              <div className="flex flex-col items-center gap-6 py-4 relative">
                <FocusDecor />
                {/* Atmospheric sunset panel behind the timer */}
                <RetroPageWrapper title="focus_timer.exe" sticker="moon" className="w-full" style={{ maxWidth: 680 }}>
                  {/* Sunset background */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${SUNSET_WIDE})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      opacity: 0.15,
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "oklch(0.985 0.008 80 / 0.88)" }}
                  />
                  {/* Corner marks */}
                  {[
                    "top-2 left-2",
                    "top-2 right-2 rotate-90",
                    "bottom-2 left-2 -rotate-90",
                    "bottom-2 right-2 rotate-180",
                  ].map((cls, i) => (
                    <div key={i} className={`absolute ${cls}`}>
                      <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.35 }}>
                        <line x1="5" y1="0" x2="5" y2="4" stroke="oklch(0.28 0.018 65)" strokeWidth="1" />
                        <line x1="6" y1="5" x2="10" y2="5" stroke="oklch(0.28 0.018 65)" strokeWidth="1" />
                      </svg>
                    </div>
                  ))}
                  <div className="relative p-6" style={{ minWidth: 0, overflow: "hidden" }}>
                    {/* Small header */}
                    <div className="mb-7 text-center">
                      {/* Geometric clock icon */}
                      <svg width="36" height="36" viewBox="0 0 36 36" className="mx-auto mb-3" style={{ opacity: 0.45 }}>
                        <circle cx="18" cy="18" r="16" fill="none" stroke="oklch(0.52 0.14 35)" strokeWidth="1" />
                        <circle cx="18" cy="18" r="1.5" fill="oklch(0.52 0.14 35)" />
                        <line x1="18" y1="18" x2="18" y2="8" stroke="oklch(0.52 0.14 35)" strokeWidth="1.5" strokeLinecap="square" />
                        <line x1="18" y1="18" x2="25" y2="18" stroke="oklch(0.52 0.14 35)" strokeWidth="1" strokeLinecap="square" />
                        {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => {
                          const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
                          const r1 = 13, r2 = i % 3 === 0 ? 11 : 12;
                          return <line key={i} x1={18 + r1 * Math.cos(a)} y1={18 + r1 * Math.sin(a)} x2={18 + r2 * Math.cos(a)} y2={18 + r2 * Math.sin(a)} stroke="oklch(0.52 0.14 35)" strokeWidth="0.8" />;
                        })}
                      </svg>
                      <h2
                        className="text-xl font-bold italic"
                        style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.18 0.01 60)" }}
                      >
                        Deep Work
                      </h2>
                    </div>
                    <FocusTimer onSessionComplete={handleSessionComplete} onBlockComplete={handleBlockComplete} onQuit={() => setTimerQuitCount(q => q + 1)} />
                  </div>
                </RetroPageWrapper>

                {/* Focus tips — minimal, geometric */}
                <RetroPageWrapper title="session_tips.txt" sticker="leaf" className="w-full max-w-md">
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
                </RetroPageWrapper>
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
