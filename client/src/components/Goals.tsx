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
  ContextSwitcher, ContextBadge, getContextConfig,
  type ItemContext, type ActiveContext,
} from "./ContextSwitcher";

/* Parse hashtag from goal input — same logic as TaskManager */
function parseHashtag(raw: string): { cleanText: string; tag: string | null } {
  const match = raw.match(/(^|\s)#([\w-]+)(\s|$)/);
  if (!match) return { cleanText: raw.trim(), tag: null };
  const cleanText = raw.replace(/(^|\s)#[\w-]+(\s|$)/g, " ").replace(/\s{2,}/g, " ").trim();
  return { cleanText, tag: match[2].toLowerCase() };
}

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
  /** Shared category list from Home — includes all contexts across tasks/goals/agents */
  allCategories?: string[];
  /** Called when user wants to delete a custom tag */
  onDeleteCategory?: (ctx: string) => void;
}

export function Goals({ goals, onGoalsChange, defaultContext = "all", allCategories, onDeleteCategory }: GoalsProps) {
  const [newGoal,       setNewGoal]       = useState("");
  const [newGoalCtx,    setNewGoalCtx]    = useState<ItemContext>("work");
  const [activeContext, setActiveContext] = useState<ActiveContext>(defaultContext);

  // Unified categories: use shared list if provided, else derive from own goals
  const knownCategories = allCategories ?? Array.from(new Set(["work", "personal", ...goals.map((g) => g.context)]));

  // Detect hashtag in current input for live preview
  const { tag: liveTag } = parseHashtag(newGoal);

  const visibleGoals = goals.filter((g) => activeContext === "all" ? true : g.context === activeContext);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const { cleanText, tag } = parseHashtag(newGoal);
    // If a hashtag is typed, use it; otherwise use the currently active tab category
    // (fall back to "work" only when on the "all" tab with no hashtag)
    const contextFromTab = activeContext !== "all" ? activeContext : newGoalCtx;
    const context = tag ?? contextFromTab;
    if (goals.filter((g) => g.context === context).length >= 5) {
      toast.error(`Max 5 goals per category. Focus is power!`, { duration: 3000 });
      return;
    }
    onGoalsChange([...goals, { id: nanoid(), text: cleanText || newGoal.trim(), progress: 0, context, createdAt: new Date() }]);
    setNewGoal("");
    if (tag) toast.success(`Goal added to #${tag}.`, { duration: 2000 });
    else toast.success(`Goal added to ${context}.`, { duration: 2000 });
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

  // Build dynamic counts for all known categories
  const counts: Record<string, number> = { all: goals.length };
  knownCategories.forEach((ctx) => { counts[ctx] = goals.filter((g) => g.context === ctx).length; });

  return (
    <div className="flex flex-col gap-4 h-full">
      <ContextSwitcher active={activeContext} onChange={setActiveContext} counts={counts} contexts={knownCategories} onDeleteContext={onDeleteCategory} />

      {/* Overall progress */}
      {visibleGoals.length > 0 && (
        <div className="p-4" style={{ background: M.coralBg, border: `1px solid ${M.coralBdr}` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: M.coral }} />
              <span className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
                {activeContext === "all" ? "Overall" : getContextConfig(activeContext).label} Progress
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
            placeholder="Goal... or add #health #learning to categorize"
            className="flex-1"
            style={{ background: M.card, border: `1px solid ${liveTag ? M.coral : M.border}`, fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s" }}
          />
          <button
            onClick={addGoal}
            className="m-btn-primary shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live hashtag preview */}
        {liveTag && (
          <div className="flex items-center gap-1.5" style={{ fontSize: "0.7rem", color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: M.coral }}>◆</span>
            Will be added to category{" "}
            <span className="px-2 py-0.5 font-medium" style={{ background: M.coral + "15", color: M.coral, border: `1px solid ${M.coral}30`, fontSize: "0.68rem", letterSpacing: "0.06em" }}>
              #{liveTag}
            </span>
          </div>
        )}

        {/* Category is set via #hashtag in the input or the ContextSwitcher tabs above */}
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
