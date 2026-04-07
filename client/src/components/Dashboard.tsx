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
import { Bot, CheckCircle2, Clock, Cpu, Flame, Sparkles, Target, Zap } from "lucide-react";
import type { Agent } from "./AgentTracker";
import { Button } from "@/components/ui/button";

interface DashboardProps {
  tasks: Task[];
  wins: Win[];
  goals: Goal[];
  agents: Agent[];
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
  agents,
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

  const today = now.toDateString();
  const todayAgents = agents.filter((a) => new Date(a.startedAt).toDateString() === today);
  const runningAgents = agents.filter((a) => a.status === "running");
  const uncoveredTasks = activeTasks.filter(
    (t) => !agents.some((a) => a.linkedTaskId === t.id && (a.status === "running" || a.status === "paused"))
  );

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

      {/* AI Agent mini-panel */}
      <div
        className="p-4 rounded-2xl border cursor-pointer hover:shadow-sm transition-all"
        style={{
          background: runningAgents.length > 0 ? "oklch(0.65 0.14 185 / 0.05)" : "oklch(0.98 0.004 90)",
          borderColor: runningAgents.length > 0 ? "oklch(0.65 0.14 185 / 0.3)" : "oklch(0.9 0.006 90)",
        }}
        onClick={() => onNavigate("agents")}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[oklch(0.55_0.14_185)]" />
            <h2 className="text-sm font-display font-semibold text-foreground">AI Agents Today</h2>
            {runningAgents.length > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[oklch(0.65_0.14_185_/_0.1)] text-[oklch(0.45_0.14_185)] border border-[oklch(0.65_0.14_185_/_0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.14_185)] animate-pulse" />
                {runningAgents.length} running
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[oklch(0.55_0.14_185)] hover:text-[oklch(0.45_0.14_185)]"
            onClick={(e) => { e.stopPropagation(); onNavigate("agents"); }}
          >
            Manage →
          </Button>
        </div>

        {todayAgents.length === 0 ? (
          <div className="flex items-center gap-3 py-2">
            <Bot className="w-8 h-8 text-muted-foreground/30" />
            <div>
              <p className="text-sm text-muted-foreground">No agents logged today.</p>
              <p className="text-xs text-muted-foreground/70">Track which AI agents you've deployed and what they're handling.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {todayAgents.slice(0, 3).map((agent) => {
              const statusColors: Record<string, string> = {
                running: "oklch(0.65 0.14 185)",
                paused: "oklch(0.75 0.15 75)",
                done: "oklch(0.6 0.12 145)",
                failed: "oklch(0.65 0.22 15)",
              };
              return (
                <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg bg-white border border-border">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: statusColors[agent.status] }}
                  />
                  <span className="text-sm font-medium text-foreground shrink-0">{agent.name}</span>
                  <span className="text-sm text-muted-foreground truncate flex-1">{agent.task}</span>
                  <span
                    className="text-xs shrink-0 capitalize font-medium"
                    style={{ color: statusColors[agent.status] }}
                  >
                    {agent.status}
                  </span>
                </div>
              );
            })}
            {todayAgents.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-1">+{todayAgents.length - 3} more agents</p>
            )}
            {uncoveredTasks.length > 0 && (
              <div className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-[oklch(0.65_0.22_15_/_0.06)] border border-[oklch(0.65_0.22_15_/_0.2)]">
                <Flame className="w-3.5 h-3.5 text-[oklch(0.6_0.22_15)] shrink-0" />
                <p className="text-xs text-[oklch(0.5_0.2_15)]">
                  {uncoveredTasks.length} task{uncoveredTasks.length > 1 ? "s" : ""} not yet delegated to an agent
                </p>
              </div>
            )}
          </div>
        )}
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
