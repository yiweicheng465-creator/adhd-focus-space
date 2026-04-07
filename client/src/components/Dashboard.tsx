/* ============================================================
   ADHD FOCUS SPACE — Dashboard Overview
   Design: Asymmetric grid, status at a glance, motivational
   Shows: Today's date, mood, tasks summary, wins, focus sessions
   ============================================================ */

import { cn } from "@/lib/utils";
import { MoodCheckIn } from "./MoodCheckIn";
import { FocusTimer } from "./FocusTimer";
import type { Task } from "./TaskManager";
import type { Win } from "./DailyWins";
import type { Goal } from "./Goals";
import { CheckCircle2, Clock, Flame, Sparkles, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardProps {
  tasks: Task[];
  wins: Win[];
  goals: Goal[];
  mood: number | null;
  onMoodChange: (mood: number) => void;
  onNavigate: (section: string) => void;
  onSessionComplete: () => void;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getTip() {
  const tips = [
    "Start with your most important task first.",
    "Break big tasks into 3-step mini-plans.",
    "A 2-minute task? Do it now.",
    "Reward yourself after each focus session.",
    "Body doubling helps — work alongside someone.",
    "Set a timer before you start. It makes it real.",
    "Done is better than perfect.",
    "Your brain is not broken — it just works differently.",
  ];
  return tips[new Date().getDate() % tips.length];
}

export function Dashboard({
  tasks,
  wins,
  goals,
  mood,
  onMoodChange,
  onNavigate,
  onSessionComplete,
}: DashboardProps) {
  const now = new Date();
  const activeTasks = tasks.filter((t) => !t.done);
  const urgentTasks = activeTasks.filter((t) => t.priority === "urgent");
  const todayWins = wins.filter((w) => {
    const d = new Date(w.createdAt);
    return d.toDateString() === now.toDateString();
  });
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">
            {DAYS[now.getDay()]}, {MONTHS[now.getMonth()]} {now.getDate()}
          </p>
          <h1 className="text-3xl font-display font-bold text-foreground mt-0.5">
            {getGreeting()} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1 italic">
            "{getTip()}"
          </p>
        </div>
      </div>

      {/* Mood check-in */}
      <div className="p-4 rounded-2xl bg-white border border-border shadow-sm">
        <MoodCheckIn currentMood={mood} onMoodChange={onMoodChange} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Urgent Tasks"
          value={urgentTasks.length}
          color="oklch(0.65 0.22 15)"
          bg="oklch(0.65 0.22 15 / 0.08)"
          border="oklch(0.65 0.22 15 / 0.2)"
          onClick={() => onNavigate("tasks")}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Active Tasks"
          value={activeTasks.length}
          color="oklch(0.65 0.14 185)"
          bg="oklch(0.65 0.14 185 / 0.08)"
          border="oklch(0.65 0.14 185 / 0.2)"
          onClick={() => onNavigate("tasks")}
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          label="Today's Wins"
          value={todayWins.length}
          color="oklch(0.65 0.15 75)"
          bg="oklch(0.65 0.15 75 / 0.08)"
          border="oklch(0.65 0.15 75 / 0.2)"
          onClick={() => onNavigate("wins")}
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Goal Progress"
          value={`${avgGoalProgress}%`}
          color="oklch(0.6 0.12 145)"
          bg="oklch(0.6 0.12 145 / 0.08)"
          border="oklch(0.6 0.12 145 / 0.2)"
          onClick={() => onNavigate("goals")}
        />
      </div>

      {/* Main content: Focus timer + Quick tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Focus timer */}
        <div className="p-6 rounded-2xl bg-white border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-[oklch(0.55_0.14_185)]" />
            <h2 className="text-sm font-display font-semibold text-foreground">Focus Timer</h2>
          </div>
          <FocusTimer onSessionComplete={onSessionComplete} />
        </div>

        {/* Quick task view */}
        <div className="p-6 rounded-2xl bg-white border border-border shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[oklch(0.55_0.14_185)]" />
              <h2 className="text-sm font-display font-semibold text-foreground">Next Up</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("tasks")}
              className="text-xs text-[oklch(0.55_0.14_185)] hover:text-[oklch(0.45_0.14_185)]"
            >
              View all →
            </Button>
          </div>

          {activeTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-[oklch(0.65_0.14_185_/_0.3)] mb-2" />
              <p className="text-sm text-muted-foreground">All clear! Add tasks to get started.</p>
              <Button
                size="sm"
                className="mt-3"
                style={{ background: "oklch(0.65 0.14 185)" }}
                onClick={() => onNavigate("tasks")}
              >
                Add a task
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.slice(0, 5).map((task) => {
                const priorityColors: Record<string, string> = {
                  urgent: "oklch(0.65 0.22 15)",
                  focus: "oklch(0.65 0.14 185)",
                  normal: "oklch(0.65 0.15 75)",
                };
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-[oklch(0.65_0.14_185_/_0.3)] transition-colors"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: priorityColors[task.priority] }}
                    />
                    <p className="text-sm flex-1 truncate">{task.text}</p>
                  </div>
                );
              })}
              {activeTasks.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{activeTasks.length - 5} more tasks
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Today's wins preview */}
      {todayWins.length > 0 && (
        <div className="p-4 rounded-2xl bg-[oklch(0.75_0.15_75_/_0.06)] border border-[oklch(0.75_0.15_75_/_0.2)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[oklch(0.6_0.15_75)]" />
              <h2 className="text-sm font-display font-semibold text-foreground">
                Today's Wins ({todayWins.length})
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("wins")}
              className="text-xs text-[oklch(0.6_0.15_75)]"
            >
              Log more →
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {todayWins.map((win) => (
              <div
                key={win.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[oklch(0.75_0.15_75_/_0.3)] text-sm"
              >
                <span>{win.emoji}</span>
                <span className="text-foreground">{win.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  border: string;
  onClick?: () => void;
}

function StatCard({ icon, label, value, color, bg, border, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border text-left transition-all hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
      )}
      style={{ background: bg, borderColor: border }}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-display font-bold" style={{ color }}>
        {value}
      </p>
    </button>
  );
}
