/* ============================================================
   ADHD FOCUS SPACE — Home Page v3.0
   Design: Warm Editorial Minimalism + LocalStorage Persistence
   - All state persisted to localStorage
   - Focus page simplified with atmospheric sunset background
   - Less text, more geometric shapes
   ============================================================ */

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { FocusTimer } from "@/components/FocusTimer";
import { TaskManager, type Task } from "@/components/TaskManager";
import { DailyWins, type Win } from "@/components/DailyWins";
import { BrainDump } from "@/components/BrainDump";
import { Goals, type Goal } from "@/components/Goals";
import { AgentTracker, type Agent } from "@/components/AgentTracker";
import { GlobalQuickAdd } from "@/components/GlobalQuickAdd";
import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { DailyWrapUp } from "@/components/DailyWrapUp";
import { recordWrapUp, recordDumpEntry } from "@/components/MonthlyProgress";
import { WeeklyResetNudge } from "@/components/WeeklyResetNudge";
import { DailyCheckIn, useDailyCheckIn, type CheckInResult } from "@/components/DailyCheckIn";
import { useLocalStorage } from "@/hooks/useLocalStorage";
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

// Simple flag icon for Goals — replaces complex flower
function GoalFlagIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} style={style}>
      <line x1="5" y1="2" x2="5" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 2 L15 5.5 L5 9 Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

type Section = "dashboard" | "focus" | "tasks" | "wins" | "braindump" | "goals" | "agents";

const SECTION_META: Record<Section, { title: string; icon: React.ElementType }> = {
  dashboard:  { title: "Dashboard",    icon: LayoutDashboard },
  focus:      { title: "Focus Timer",  icon: Clock           },
  tasks:      { title: "My Tasks",     icon: Star     },
  wins:       { title: "Daily Wins",   icon: Sparkles        },
  braindump:  { title: "Brain Dump",   icon: Brain           },
  goals:      { title: "Weekly Goals", icon: GoalFlagIcon      },
  agents:     { title: "AI Agents",    icon: Bot             },
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

  // ── Persisted state ──
  const [tasks,  setTasks]  = useLocalStorage<Task[]>("adhd-tasks",  INITIAL_TASKS);
  const [wins,   setWins]   = useLocalStorage<Win[]>("adhd-wins",   []);
  const [goals,  setGoals]  = useLocalStorage<Goal[]>("adhd-goals",  INITIAL_GOALS);
  const [agents, setAgents] = useLocalStorage<Agent[]>("adhd-agents", []);
  const [mood,   setMood]   = useLocalStorage<number | null>("adhd-mood", null);
  // Manually deleted custom tags — persisted so they stay gone even if no items use them
  const [deletedCategories, setDeletedCategories] = useLocalStorage<string[]>("adhd-deleted-categories", []);

  // ── Transient state ──
  const [focusSessions, setFocusSessions] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [wrapUpOpen, setWrapUpOpen] = useState(false);
  const [pendingDump, setPendingDump] = useState<string | null>(null);

  // Daily check-in
  const { show: showCheckIn, dismiss: dismissCheckIn } = useDailyCheckIn();

  const handleCheckInComplete = (data: CheckInResult) => {
    if (data.mood) setMood(data.mood);
    if (data.newTasks.length) setTasks((p) => [...data.newTasks, ...p]);
    if (data.newWins.length) setWins((p) => [...data.newWins, ...p]);
    if (data.newAgents.length) setAgents((p) => [...data.newAgents, ...p]);
    dismissCheckIn(true);
    toast.success("Workspace ready.", { duration: 2500 });
  };

  /* ── Task completion with confetti ── */
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
    }
    setTasks(newTasks);
  };

  const handleSessionComplete = () => {
    setFocusSessions((s) => s + 1);
    setConfettiTrigger(true);
    const win: Win = {
      id: `session-${Date.now()}`,
      text: `Focus session #${focusSessions + 1} complete`,
        iconIdx: 4, // lightning icon
      createdAt: new Date(),
    };
    setWins((prev) => [win, ...prev]);
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
    <div className="min-h-screen flex" style={{ background: "oklch(0.975 0.012 80)" }}>
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={(s) => setActiveSection(s as Section)} onClearData={handleClearTestData} />

      {/* Main content */}
      <main className="flex-1 ml-14 min-h-screen flex flex-col">
        {/* Top header bar */}
        <header
          className="sticky top-0 z-30 px-8 py-4 flex items-center gap-4"
          style={{
            background: "oklch(0.975 0.012 80 / 0.9)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid oklch(0.88 0.012 75)",
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
            {/* Mini stats */}
            <div className="hidden sm:flex items-center gap-3 text-xs" style={{ color: "oklch(0.55 0.015 70)" }}>
              <span>{tasks.filter((t) => !t.done).length} tasks</span>
              <span style={{ color: "oklch(0.82 0.012 75)" }}>·</span>
              <span>{wins.filter((w) => new Date(w.createdAt).toDateString() === new Date().toDateString()).length} wins</span>
              {runningAgents > 0 && (
                <>
                  <span style={{ color: "oklch(0.82 0.012 75)" }}>·</span>
                  <button
                    onClick={() => setActiveSection("agents")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "oklch(0.52 0.14 35)" }} />
                    {runningAgents} agent{runningAgents > 1 ? "s" : ""}
                  </button>
                </>
              )}
            </div>

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
          <div className={cn("mx-auto", activeSection === "dashboard" ? "max-w-5xl" : "max-w-3xl")}>

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
                onMoodChange={setMood}
                onNavigate={(s) => setActiveSection(s as Section)}
                onSessionComplete={handleSessionComplete}
                allCategories={allCategories}
                onQuickDump={(text) => setPendingDump(text)}
              />
              </div>
            )}

            {activeSection === "focus" && (
              <div className="flex flex-col items-center gap-6 py-4 relative">
                <FocusDecor />
                {/* Atmospheric sunset panel behind the timer */}
                <div
                  className="w-full relative overflow-hidden"
                  style={{ border: "1px solid oklch(0.87 0.014 75)", maxWidth: 680 }}
                >
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
                    <FocusTimer onSessionComplete={handleSessionComplete} />
                  </div>
                </div>

                {/* Focus tips — minimal, geometric */}
                <div
                  className="w-full max-w-md p-5"
                  style={{ border: "1px solid oklch(0.87 0.014 75)", background: "oklch(0.985 0.008 80)" }}
                >
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
              </div>
            )}

            {activeSection === "tasks" && (
              <div
                className="p-8 min-h-[600px] flex flex-col relative overflow-hidden"
                style={{ border: "1px solid oklch(0.87 0.014 75)", background: "oklch(0.985 0.008 80)" }}
              >
                <TasksDecor />
                <div className="relative z-10">
                  <TaskManager tasks={tasks} onTasksChange={handleTasksChange} allCategories={allCategories} onDeleteCategory={handleDeleteCategory} />
                </div>
              </div>
            )}

            {activeSection === "wins" && (
              <div
                className="p-8 min-h-[600px] flex flex-col relative overflow-hidden"
                style={{ border: "1px solid oklch(0.87 0.014 75)", background: "oklch(0.985 0.008 80)" }}
              >
                <WinsDecor />
                <div className="relative z-10">
                  <DailyWins wins={wins} onWinsChange={setWins} />
                </div>
              </div>
            )}

            {activeSection === "braindump" && (
              <div
                className="p-8 min-h-[600px] flex flex-col relative overflow-hidden"
                style={{ border: "1px solid oklch(0.87 0.014 75)", background: "oklch(0.985 0.008 80)" }}
              >
                <BrainDumpDecor />
                <div className="relative z-10">
                  <BrainDump
                    onConvertToTask={handleConvertToTask}
                    onDump={recordDumpEntry}
                    initialText={pendingDump ?? undefined}
                    onInitialTextConsumed={() => setPendingDump(null)}
                  />
                </div>
              </div>
            )}

            {activeSection === "goals" && (
              <div
                className="p-8 min-h-[600px] flex flex-col relative overflow-hidden"
                style={{ border: "1px solid oklch(0.87 0.014 75)", background: "oklch(0.985 0.008 80)" }}
              >
                <GoalsDecor />
                <div className="relative z-10">
                  <Goals goals={goals} onGoalsChange={setGoals} allCategories={allCategories} onDeleteCategory={handleDeleteCategory} />
                </div>
              </div>
            )}

            {activeSection === "agents" && (
              <div className="relative">
                <AgentsDecor />
                <AgentTracker agents={agents} onAgentsChange={setAgents} tasks={tasks} allCategories={allCategories} />
              </div>
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
