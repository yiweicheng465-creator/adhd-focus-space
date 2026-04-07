/* ============================================================
   ADHD FOCUS SPACE — Home Page v2.0
   Design: Warm Editorial Minimalism
   - Cream background, Playfair Display serif, DM Sans body
   - Thin 1px borders, generous whitespace
   - Daily check-in modal auto-opens once per day
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
import { WeeklyResetNudge } from "@/components/WeeklyResetNudge";
import { DailyCheckIn, useDailyCheckIn, type CheckInResult } from "@/components/DailyCheckIn";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Bot, Brain, CheckSquare, Clock, LayoutDashboard, Moon, Sparkles, Target } from "lucide-react";

type Section = "dashboard" | "focus" | "tasks" | "wins" | "braindump" | "goals" | "agents";

const SECTION_META: Record<Section, { title: string; subtitle: string; icon: React.ElementType }> = {
  dashboard:  { title: "Dashboard",    subtitle: "Your daily overview at a glance",              icon: LayoutDashboard },
  focus:      { title: "Focus Timer",  subtitle: "Pomodoro-style deep work sessions",            icon: Clock           },
  tasks:      { title: "My Tasks",     subtitle: "Prioritize what matters most today",           icon: CheckSquare     },
  wins:       { title: "Daily Wins",   subtitle: "Celebrate every step forward",                 icon: Sparkles        },
  braindump:  { title: "Brain Dump",   subtitle: "Capture racing thoughts without losing focus", icon: Brain           },
  goals:      { title: "Weekly Goals", subtitle: "Keep the big picture in sight",                icon: Target          },
  agents:     { title: "AI Agents",    subtitle: "Track every agent you've deployed today",      icon: Bot             },
};

const INITIAL_TASKS: Task[] = [
  { id: "1", text: "Review project proposal",   priority: "urgent", context: "work",     done: false, createdAt: new Date() },
  { id: "2", text: "Reply to important emails", priority: "focus",  context: "work",     done: false, createdAt: new Date() },
  { id: "3", text: "Take a 10-minute walk",     priority: "normal", context: "personal", done: false, createdAt: new Date() },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [wins, setWins] = useState<Win[]>([]);
  const [goals, setGoals] = useState<Goal[]>([
    { id: "g1", text: "Complete the project proposal", progress: 30, context: "work",     createdAt: new Date() },
    { id: "g2", text: "Exercise 3 times this week",    progress: 0,  context: "personal", createdAt: new Date() },
  ]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [mood, setMood] = useState<number | null>(null);
  const [focusSessions, setFocusSessions] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [wrapUpOpen, setWrapUpOpen] = useState(false);

  // Daily check-in
  const { show: showCheckIn, dismiss: dismissCheckIn } = useDailyCheckIn();

  const handleCheckInComplete = (data: CheckInResult) => {
    if (data.mood) setMood(data.mood);
    if (data.newTasks.length) setTasks((p) => [...data.newTasks, ...p]);
    if (data.newWins.length) setWins((p) => [...data.newWins, ...p]);
    if (data.newAgents.length) setAgents((p) => [...data.newAgents, ...p]);
    dismissCheckIn();
    toast.success("Welcome! Your workspace is ready.", { duration: 3000 });
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
        emoji: "✅",
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
      text: `Completed focus session #${focusSessions + 1}`,
      emoji: "⚡",
      createdAt: new Date(),
    };
    setWins((prev) => [win, ...prev]);
  };

  const handleConvertToTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    toast.success("Added to tasks!", { duration: 2000 });
  };

  const meta = SECTION_META[activeSection];
  const Icon = meta.icon;
  const runningAgents = agents.filter((a) => a.status === "running").length;

  return (
    <div className="min-h-screen flex" style={{ background: "oklch(0.975 0.012 80)" }}>
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={(s) => setActiveSection(s as Section)} />

      {/* Main content */}
      <main className="flex-1 ml-14 min-h-screen flex flex-col">
        {/* Top header bar — editorial style */}
        <header
          className="sticky top-0 z-30 px-8 py-4 flex items-center gap-4"
          style={{
            background: "oklch(0.975 0.012 80 / 0.9)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid oklch(0.88 0.012 75)",
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon className="w-4 h-4 shrink-0" style={{ color: "oklch(0.52 0.14 35)" }} />
            <div className="min-w-0">
              <h1
                className="text-base font-bold italic leading-tight truncate"
                style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.18 0.01 60)" }}
              >
                {meta.title}
              </h1>
              <p className="editorial-label truncate">{meta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 text-xs" style={{ color: "oklch(0.55 0.015 70)" }}>
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
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: "oklch(0.52 0.14 35)" }}
                    />
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
              <Dashboard
                tasks={tasks}
                wins={wins}
                goals={goals}
                agents={agents}
                mood={mood}
                onMoodChange={setMood}
                onNavigate={(s) => setActiveSection(s as Section)}
                onSessionComplete={handleSessionComplete}
              />
            )}

            {activeSection === "focus" && (
              <div className="flex flex-col items-center gap-8 py-4">
                <div
                  className="w-full max-w-md p-10"
                  style={{ border: "1px solid oklch(0.87 0.014 75)", background: "oklch(0.985 0.008 80)" }}
                >
                  {/* Editorial header */}
                  <div className="mb-8 text-center">
                    <img
                      src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-editorial-timer-SpuVNoS38pX9SRh3kmwiCK.webp"
                      alt="timer illustration"
                      className="w-16 mx-auto mb-4 opacity-70"
                    />
                    <h2
                      className="text-xl font-bold italic"
                      style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.18 0.01 60)" }}
                    >
                      Deep Work
                    </h2>
                    <p className="editorial-label mt-1">One session at a time</p>
                  </div>
                  <FocusTimer onSessionComplete={handleSessionComplete} />
                </div>
                <div
                  className="w-full max-w-md p-5"
                  style={{ border: "1px solid oklch(0.87 0.014 75)" }}
                >
                  <p className="editorial-label mb-3">Focus tips</p>
                  <ul className="space-y-2 text-sm" style={{ color: "oklch(0.45 0.01 60)" }}>
                    <li>— Put your phone face-down or in another room</li>
                    <li>— Close all browser tabs except what you need</li>
                    <li>— Tell others you're in a focus session</li>
                    <li>— Use the Brain Dump for distracting thoughts</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === "tasks" && (
              <div
                className="p-8 min-h-[600px] flex flex-col"
                style={{ border: "1px solid oklch(0.87 0.014 75)", background: "oklch(0.985 0.008 80)" }}
              >
                <TaskManager tasks={tasks} onTasksChange={handleTasksChange} />
              </div>
            )}

            {activeSection === "wins" && (
              <div
                className="p-8 min-h-[600px] flex flex-col"
                style={{ border: "1px solid oklch(0.87 0.014 75)", background: "oklch(0.985 0.008 80)" }}
              >
                <DailyWins wins={wins} onWinsChange={setWins} />
              </div>
            )}

            {activeSection === "braindump" && (
              <div
                className="p-8 min-h-[600px] flex flex-col"
                style={{ border: "1px solid oklch(0.87 0.014 75)", background: "oklch(0.985 0.008 80)" }}
              >
                <BrainDump onConvertToTask={handleConvertToTask} />
              </div>
            )}

            {activeSection === "goals" && (
              <div
                className="p-8 min-h-[600px] flex flex-col"
                style={{ border: "1px solid oklch(0.87 0.014 75)", background: "oklch(0.985 0.008 80)" }}
              >
                <Goals goals={goals} onGoalsChange={setGoals} />
              </div>
            )}

            {activeSection === "agents" && (
              <AgentTracker agents={agents} onAgentsChange={setAgents} tasks={tasks} />
            )}
          </div>
        </div>
      </main>

      {/* ── Global overlays ── */}
      <GlobalQuickAdd onAddTask={(t) => setTasks((p) => [t, ...p])} />
      <ConfettiCelebration trigger={confettiTrigger} onComplete={() => setConfettiTrigger(false)} />

      {wrapUpOpen && (
        <DailyWrapUp tasks={tasks} wins={wins} agents={agents} onClose={() => setWrapUpOpen(false)} />
      )}

      {/* Daily check-in — auto-opens once per day */}
      {showCheckIn && (
        <DailyCheckIn
          onComplete={handleCheckInComplete}
          onSkip={dismissCheckIn}
        />
      )}
    </div>
  );
}
