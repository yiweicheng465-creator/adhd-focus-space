/* ============================================================
   ADHD FOCUS SPACE — Goals Tracker v3.0 (Morandi)
   Progress: coral bar, sage completed, slumber neutral
   ============================================================ */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  ContextSwitcher, ContextBadge, CONTEXT_CONFIG,
  type ItemContext, type ActiveContext,
} from "./ContextSwitcher";

export interface Goal {
  id: string;
  text: string;
  progress: number;
  context: ItemContext;
  createdAt: Date;
}

const M = {
  coral:    "oklch(0.55 0.09 35)",
  coralBg:  "oklch(0.55 0.09 35 / 0.08)",
  coralBdr: "oklch(0.55 0.09 35 / 0.28)",
  sage:     "oklch(0.52 0.07 145)",
  sageBg:   "oklch(0.52 0.07 145 / 0.08)",
  sageBdr:  "oklch(0.52 0.07 145 / 0.28)",
  ink:      "oklch(0.28 0.018 65)",
  muted:    "oklch(0.55 0.018 70)",
  border:   "oklch(0.88 0.014 75)",
  card:     "oklch(0.985 0.007 80)",
};

const LABEL: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.65rem",
  fontWeight: 500,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: M.muted,
};

interface GoalsProps {
  goals: Goal[];
  onGoalsChange: (goals: Goal[]) => void;
  defaultContext?: ActiveContext;
}

export function Goals({ goals, onGoalsChange, defaultContext = "all" }: GoalsProps) {
  const [newGoal,       setNewGoal]       = useState("");
  const [newGoalCtx,    setNewGoalCtx]    = useState<ItemContext>("work");
  const [activeContext, setActiveContext] = useState<ActiveContext>(defaultContext);

  const visibleGoals = goals.filter((g) => activeContext === "all" ? true : g.context === activeContext);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    if (goals.filter((g) => g.context === newGoalCtx).length >= 5) {
      toast.error(`Max 5 ${newGoalCtx} goals. Focus is power!`, { duration: 3000 });
      return;
    }
    onGoalsChange([...goals, { id: nanoid(), text: newGoal.trim(), progress: 0, context: newGoalCtx, createdAt: new Date() }]);
    setNewGoal("");
    toast.success("Goal set.", { duration: 2000 });
  };

  const updateProgress = (id: string, delta: number) => {
    onGoalsChange(goals.map((g) => {
      if (g.id !== id) return g;
      const next = Math.min(100, Math.max(0, g.progress + delta));
      if (next === 100) toast.success("Goal complete! 🎯", { duration: 3000 });
      return { ...g, progress: next };
    }));
  };

  const deleteGoal = (id: string) => onGoalsChange(goals.filter((g) => g.id !== id));

  const avgProgress = visibleGoals.length > 0
    ? Math.round(visibleGoals.reduce((sum, g) => sum + g.progress, 0) / visibleGoals.length) : 0;

  const counts = {
    all:      goals.length,
    work:     goals.filter((g) => g.context === "work").length,
    personal: goals.filter((g) => g.context === "personal").length,
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <ContextSwitcher active={activeContext} onChange={setActiveContext} counts={counts} />

      {/* Overall progress */}
      {visibleGoals.length > 0 && (
        <div className="p-4" style={{ background: M.coralBg, border: `1px solid ${M.coralBdr}` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: M.coral }} />
              <span className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
                {activeContext === "all" ? "Overall" : activeContext === "work" ? "Work" : "Personal"} Progress
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: M.coral, fontFamily: "'Playfair Display', serif" }}>
              {avgProgress}%
            </span>
          </div>
          {/* Custom progress bar */}
          <div className="h-1.5 w-full" style={{ background: "oklch(0.88 0.014 75)" }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${avgProgress}%`, background: M.coral }}
            />
          </div>
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
            className="flex-1"
            style={{ background: M.card, border: `1px solid ${M.border}`, fontFamily: "'DM Sans', sans-serif" }}
          />
          <button
            onClick={addGoal}
            className="m-btn-primary shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span style={LABEL}>Context:</span>
          {(["work", "personal"] as ItemContext[]).map((ctx) => {
            const cfg  = CONTEXT_CONFIG[ctx];
            const Icon = cfg.icon;
            const isActive = newGoalCtx === ctx;
            return (
              <button
                key={ctx}
                onClick={() => setNewGoalCtx(ctx)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all"
                style={{
                  background:  isActive ? cfg.bg : "transparent",
                  color:       isActive ? cfg.color : M.muted,
                  border:      `1px solid ${isActive ? cfg.border : M.border}`,
                  fontFamily:  "'DM Sans', sans-serif",
                }}
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
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ opacity: 0.18 }}>
              <circle cx="20" cy="20" r="17" fill="none" stroke={M.muted} strokeWidth="1" />
              <circle cx="20" cy="20" r="10" fill="none" stroke={M.muted} strokeWidth="0.8" />
              <circle cx="20" cy="20" r="3" fill={M.muted} />
              <line x1="20" y1="3" x2="20" y2="10" stroke={M.muted} strokeWidth="1" />
              <line x1="20" y1="30" x2="20" y2="37" stroke={M.muted} strokeWidth="1" />
            </svg>
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>No goals yet. Up to 5 per context.</p>
          </div>
        )}

        {visibleGoals.map((goal) => {
          const done = goal.progress === 100;
          return (
            <div
              key={goal.id}
              className="group p-4 transition-all"
              style={{
                background: done ? M.sageBg : M.card,
                border:     `1px solid ${done ? M.sageBdr : M.border}`,
              }}
              onMouseEnter={(e) => {
                if (!done) (e.currentTarget as HTMLDivElement).style.borderColor = M.coralBdr;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = done ? M.sageBdr : M.border;
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Target className="w-4 h-4 mt-0.5 shrink-0" style={{ color: done ? M.sage : M.coral }} />
                  <p
                    className={cn("text-sm font-medium leading-snug", done && "line-through")}
                    style={{ color: done ? M.muted : M.ink, fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {goal.text}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ContextBadge context={goal.context} />
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: M.muted }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5" style={{ background: "oklch(0.88 0.014 75)" }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${goal.progress}%`, background: done ? M.sage : M.coral }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                  {goal.progress}%
                </span>
              </div>

              {/* Progress buttons */}
              <div className="flex items-center gap-2 mt-2">
                {[10, 25, 50].map((delta) => (
                  <button
                    key={delta}
                    onClick={() => updateProgress(goal.id, delta)}
                    disabled={done}
                    className="m-chip disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +{delta}%
                  </button>
                ))}
                <button
                  onClick={() => updateProgress(goal.id, -10)}
                  disabled={goal.progress <= 0}
                  className="m-chip disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −10%
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
