/* ============================================================
   ADHD FOCUS SPACE — Context Switcher
   Design: Focused Modernism — pill switcher in header
   Contexts: Work (indigo) | Personal (violet) | All (neutral)
   ============================================================ */

import { cn } from "@/lib/utils";
import { Briefcase, LayoutGrid, User } from "lucide-react";

export type ItemContext = "work" | "personal";
export type ActiveContext = "work" | "personal" | "all";

export const CONTEXT_CONFIG: Record<ItemContext, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  pill: string;
  pillActive: string;
}> = {
  work: {
    label: "Work",
    icon: Briefcase,
    color: "oklch(0.5 0.18 260)",
    bg: "oklch(0.5 0.18 260 / 0.08)",
    border: "oklch(0.5 0.18 260 / 0.25)",
    pill: "oklch(0.5 0.18 260 / 0.1)",
    pillActive: "oklch(0.5 0.18 260)",
  },
  personal: {
    label: "Personal",
    icon: User,
    color: "oklch(0.55 0.18 310)",
    bg: "oklch(0.55 0.18 310 / 0.08)",
    border: "oklch(0.55 0.18 310 / 0.25)",
    pill: "oklch(0.55 0.18 310 / 0.1)",
    pillActive: "oklch(0.55 0.18 310)",
  },
};

interface ContextSwitcherProps {
  active: ActiveContext;
  onChange: (ctx: ActiveContext) => void;
  counts?: { work: number; personal: number; all: number };
}

export function ContextSwitcher({ active, onChange, counts }: ContextSwitcherProps) {
  const options: { id: ActiveContext; label: string; icon: React.ElementType }[] = [
    { id: "all", label: "All", icon: LayoutGrid },
    { id: "work", label: "Work", icon: Briefcase },
    { id: "personal", label: "Personal", icon: User },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
      {options.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        const count = counts?.[id];
        const cfg = id !== "all" ? CONTEXT_CONFIG[id as ItemContext] : null;

        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={
              isActive && cfg
                ? { color: cfg.color }
                : undefined
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count !== undefined && (
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-medium",
                  isActive ? "bg-muted text-muted-foreground" : "bg-muted/60 text-muted-foreground"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* Inline context badge — used on cards */
export function ContextBadge({ context }: { context: ItemContext }) {
  const cfg = CONTEXT_CONFIG[context];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}
