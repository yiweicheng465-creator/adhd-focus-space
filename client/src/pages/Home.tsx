/* ============================================================
   ADHD FOCUS SPACE — Main Page
   Design: Focused Modernism — navy sidebar + warm white canvas
   Layout: Fixed sidebar (icon rail) + scrollable main content
   State: All app state lives here, passed down to components
   ============================================================ */

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { FocusTimer } from "@/components/FocusTimer";
import { TaskManager, type Task } from "@/components/TaskManager";
import { DailyWins, type Win } from "@/components/DailyWins";
import { BrainDump } from "@/components/BrainDump";
import { Goals, type Goal } from "@/components/Goals";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Brain, Clock, CheckSquare, Sparkles, Target, LayoutDashboard } from "lucide-react";

type Section = "dashboard" | "focus" | "tasks" | "wins" | "braindump" | "goals";

const SECTION_META: Record<Section, { title: string; subtitle: string; icon: React.ElementType }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Your daily overview at a glance",
    icon: LayoutDashboard,
  },
  focus: {
    title: "Focus Timer",
    subtitle: "Pomodoro-style deep work sessions",
    icon: Clock,
  },
  tasks: {
    title: "My Tasks",
    subtitle: "Prioritize what matters most today",
    icon: CheckSquare,
  },
  wins: {
    title: "Daily Wins",
    subtitle: "Celebrate every step forward",
    icon: Sparkles,
  },
  braindump: {
    title: "Brain Dump",
    subtitle: "Capture racing thoughts without losing focus",
    icon: Brain,
  },
  goals: {
    title: "Weekly Goals",
    subtitle: "Keep the big picture in sight",
    icon: Target,
  },
};

// Sample initial tasks to show the app in action
const INITIAL_TASKS: Task[] = [
  { id: "1", text: "Review project proposal", priority: "urgent", done: false, createdAt: new Date() },
  { id: "2", text: "Reply to important emails", priority: "focus", done: false, createdAt: new Date() },
  { id: "3", text: "Take a 10-minute walk", priority: "normal", done: false, createdAt: new Date() },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [wins, setWins] = useState<Win[]>([]);
  const [goals, setGoals] = useState<Goal[]>([
    { id: "g1", text: "Complete the project proposal", progress: 30, createdAt: new Date() },
    { id: "g2", text: "Exercise 3 times this week", progress: 0, createdAt: new Date() },
  ]);
  const [mood, setMood] = useState<number | null>(null);
  const [focusSessions, setFocusSessions] = useState(0);

  const handleSessionComplete = () => {
    setFocusSessions((s) => s + 1);
    // Auto-log a win for completing a focus session
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={(s) => setActiveSection(s as Section)} />

      {/* Main content — offset by sidebar width */}
      <main className="flex-1 ml-16 min-h-screen flex flex-col">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "oklch(0.65 0.14 185 / 0.1)" }}
          >
            <Icon className="w-4 h-4 text-[oklch(0.55_0.14_185)]" />
          </div>
          <div>
            <h1 className="text-base font-display font-semibold text-foreground leading-tight">
              {meta.title}
            </h1>
            <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
          </div>

          {/* Right side: quick stats */}
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.65_0.14_185)]" />
              {tasks.filter((t) => !t.done).length} tasks
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.75_0.15_75)]" />
              {wins.filter((w) => new Date(w.createdAt).toDateString() === new Date().toDateString()).length} wins today
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.65_0.22_15)]" />
              {focusSessions} sessions
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className={cn(
            "mx-auto",
            activeSection === "dashboard" ? "max-w-5xl" : "max-w-3xl"
          )}>
            {activeSection === "dashboard" && (
              <Dashboard
                tasks={tasks}
                wins={wins}
                goals={goals}
                mood={mood}
                onMoodChange={setMood}
                onNavigate={(s) => setActiveSection(s as Section)}
                onSessionComplete={handleSessionComplete}
              />
            )}

            {activeSection === "focus" && (
              <div className="flex flex-col items-center gap-8 py-8">
                {/* Focus visual */}
                <div className="relative">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-focus-visual-RZxfAktQKAhRr5QkGCzrDY.webp"
                    alt="Focus"
                    className="w-32 h-32 rounded-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-background/40 to-transparent" />
                </div>

                <div className="w-full max-w-md p-8 rounded-2xl bg-white border border-border shadow-sm">
                  <FocusTimer onSessionComplete={handleSessionComplete} />
                </div>

                {/* Tips */}
                <div className="w-full max-w-md p-4 rounded-xl bg-[oklch(0.65_0.14_185_/_0.06)] border border-[oklch(0.65_0.14_185_/_0.15)]">
                  <p className="text-sm font-medium text-foreground mb-2">Focus Tips</p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li>• Put your phone face-down or in another room</li>
                    <li>• Close all browser tabs except what you need</li>
                    <li>• Tell others you're in a focus session</li>
                    <li>• Use the Brain Dump for distracting thoughts</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === "tasks" && (
              <div className="bg-white rounded-2xl border border-border shadow-sm p-6 min-h-[600px] flex flex-col">
                <TaskManager tasks={tasks} onTasksChange={setTasks} />
              </div>
            )}

            {activeSection === "wins" && (
              <div className="bg-white rounded-2xl border border-border shadow-sm p-6 min-h-[600px] flex flex-col">
                <DailyWins wins={wins} onWinsChange={setWins} />
              </div>
            )}

            {activeSection === "braindump" && (
              <div className="bg-white rounded-2xl border border-border shadow-sm p-6 min-h-[600px] flex flex-col">
                <BrainDump onConvertToTask={handleConvertToTask} />
              </div>
            )}

            {activeSection === "goals" && (
              <div className="bg-white rounded-2xl border border-border shadow-sm p-6 min-h-[600px] flex flex-col">
                <Goals goals={goals} onGoalsChange={setGoals} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
