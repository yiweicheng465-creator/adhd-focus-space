/* ============================================================
   ADHD FOCUS SPACE — Goals Tracker
   Design: Simple weekly goals with progress bars
   Context: Work (indigo) | Personal (violet) tags on every goal
   ============================================================ */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  ContextSwitcher,
  ContextBadge,
  CONTEXT_CONFIG,
  type ItemContext,
  type ActiveContext,
} from "./ContextSwitcher";

export interface Goal {
  id: string;
  text: string;
  progress: number;
  context: ItemContext;
  createdAt: Date;
}

interface GoalsProps {
  goals: Goal[];
  onGoalsChange: (goals: Goal[]) => void;
  defaultContext?: ActiveContext;
}

export function Goals({ goals, onGoalsChange, defaultContext = "all" }: GoalsProps) {
  const [newGoal, setNewGoal] = useState("");
  const [newGoalContext, setNewGoalContext] = useState<ItemContext>("work");
  const [activeContext, setActiveContext] = useState<ActiveContext>(defaultContext);

  const visibleGoals = goals.filter((g) =>
    activeContext === "all" ? true : g.context === activeContext
  );

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const contextGoals = goals.filter((g) => g.context === newGoalContext);
    if (contextGoals.length >= 5) {
      toast.error(`Max 5 ${newGoalContext} goals. Focus is power!`, { duration: 3000 });
      return;
    }
    const goal: Goal = {
      id: nanoid(),
      text: newGoal.trim(),
      progress: 0,
      context: newGoalContext,
      createdAt: new Date(),
    };
    onGoalsChange([...goals, goal]);
    setNewGoal("");
    toast.success("Goal set! You've got this.", { duration: 2000 });
  };

  const updateProgress = (id: string, delta: number) => {
    onGoalsChange(goals.map((g) => {
      if (g.id !== id) return g;
      const newProgress = Math.min(100, Math.max(0, g.progress + delta));
      if (newProgress === 100) toast.success("Goal complete! Amazing work! 🎯", { duration: 3000 });
      return { ...g, progress: newProgress };
    }));
  };

  const deleteGoal = (id: string) => {
    onGoalsChange(goals.filter((g) => g.id !== id));
  };

  const avgProgress = visibleGoals.length > 0
    ? Math.round(visibleGoals.reduce((sum, g) => sum + g.progress, 0) / visibleGoals.length)
    : 0;

  const counts = {
    all: goals.length,
    work: goals.filter((g) => g.context === "work").length,
    personal: goals.filter((g) => g.context === "personal").length,
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Context switcher */}
      <ContextSwitcher active={activeContext} onChange={setActiveContext} counts={counts} />

      {/* Overall progress */}
      {visibleGoals.length > 0 && (
        <div className="p-4 rounded-xl bg-[oklch(0.65_0.14_185_/_0.06)] border border-[oklch(0.65_0.14_185_/_0.15)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[oklch(0.55_0.14_185)]" />
              <span className="text-sm font-medium">
                {activeContext === "all" ? "Overall" : activeContext === "work" ? "Work" : "Personal"} Progress
              </span>
            </div>
            <span className="text-sm font-display font-bold text-[oklch(0.55_0.14_185)]">
              {avgProgress}%
            </span>
          </div>
          <Progress value={avgProgress} className="h-2" />
        </div>
      )}

      {/* Add goal */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGoal()}
            placeholder="Set a goal for this week..."
            className="flex-1 bg-white"
          />
          <Button onClick={addGoal} style={{ background: "oklch(0.65 0.14 185)" }}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Context picker for new goal */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Context:</span>
          {(["work", "personal"] as ItemContext[]).map((ctx) => {
            const cfg = CONTEXT_CONFIG[ctx];
            const Icon = cfg.icon;
            return (
              <button
                key={ctx}
                onClick={() => setNewGoalContext(ctx)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                  newGoalContext === ctx ? "ring-2 ring-offset-1 scale-105" : "opacity-60 hover:opacity-100"
                )}
                style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
              >
                <Icon className="w-3 h-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Goals list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {visibleGoals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Set up to 5 goals per context. Keep them specific and achievable.
            </p>
          </div>
        )}

        {visibleGoals.map((goal) => (
          <div
            key={goal.id}
            className={cn(
              "group p-4 rounded-xl border bg-white transition-all",
              goal.progress === 100
                ? "border-[oklch(0.75_0.15_75_/_0.4)] bg-[oklch(0.75_0.15_75_/_0.04)]"
                : "border-border hover:border-[oklch(0.65_0.14_185_/_0.3)]"
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <Target className={cn(
                  "w-4 h-4 mt-0.5 shrink-0",
                  goal.progress === 100 ? "text-[oklch(0.65_0.15_75)]" : "text-[oklch(0.55_0.14_185)]"
                )} />
                <p className={cn(
                  "text-sm font-medium leading-snug",
                  goal.progress === 100 && "line-through text-muted-foreground"
                )}>
                  {goal.text}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ContextBadge context={goal.context} />
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Progress value={goal.progress} className="flex-1 h-2" />
              <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                {goal.progress}%
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              {[10, 25, 50].map((delta) => (
                <button
                  key={delta}
                  onClick={() => updateProgress(goal.id, delta)}
                  disabled={goal.progress >= 100}
                  className="text-xs px-2 py-0.5 rounded-md border border-border text-muted-foreground hover:border-[oklch(0.65_0.14_185_/_0.4)] hover:text-[oklch(0.55_0.14_185)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +{delta}%
                </button>
              ))}
              <button
                onClick={() => updateProgress(goal.id, -10)}
                disabled={goal.progress <= 0}
                className="text-xs px-2 py-0.5 rounded-md border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                -10%
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
