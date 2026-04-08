/* ============================================================
   ADHD FOCUS SPACE — Context Switcher v3.0 (Morandi)
   Work  → muted slate-indigo  oklch(0.52 0.07 255)
   Personal → soft dusty rose  oklch(0.62 0.06 20)
   ============================================================ */

import { cn } from "@/lib/utils";
import { Briefcase, LayoutGrid, User } from "lucide-react";

export type ItemContext   = "work" | "personal";
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
    label:      "Work",
    icon:       Briefcase,
    color:      "oklch(0.42 0.07 255)",
    bg:         "oklch(0.42 0.07 255 / 0.07)",
    border:     "oklch(0.42 0.07 255 / 0.22)",
    pill:       "oklch(0.42 0.07 255 / 0.07)",
    pillActive: "oklch(0.42 0.07 255)",
  },
  personal: {
    label:      "Personal",
    icon:       User,
    color:      "oklch(0.52 0.07 20)",
    bg:         "oklch(0.52 0.07 20 / 0.07)",
    border:     "oklch(0.52 0.07 20 / 0.22)",
    pill:       "oklch(0.52 0.07 20 / 0.07)",
    pillActive: "oklch(0.52 0.07 20)",
  },
};

interface ContextSwitcherProps {
  active: ActiveContext;
  onChange: (ctx: ActiveContext) => void;
  counts?: { work: number; personal: number; all: number };
}

export function ContextSwitcher({ active, onChange, counts }: ContextSwitcherProps) {
  const options: { id: ActiveContext; label: string; icon: React.ElementType }[] = [
    { id: "all",      label: "All",      icon: LayoutGrid },
    { id: "work",     label: "Work",     icon: Briefcase  },
    { id: "personal", label: "Personal", icon: User       },
  ];

  return (
    <div
      className="flex items-center gap-0"
      style={{ border: "1px solid oklch(0.88 0.014 75)" }}
    >
      {options.map(({ id, label, icon: Icon }, idx) => {
        const isActive = active === id;
        const count    = counts?.[id];
        const cfg      = id !== "all" ? CONTEXT_CONFIG[id as ItemContext] : null;

        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all flex-1 justify-center"
            style={{
              background:  isActive ? (cfg ? cfg.bg : "oklch(0.93 0.012 78)") : "transparent",
              color:       isActive ? (cfg ? cfg.color : "oklch(0.28 0.018 65)") : "oklch(0.58 0.015 70)",
              borderRight: idx < 2 ? "1px solid oklch(0.88 0.014 75)" : undefined,
              fontFamily:  "'DM Sans', sans-serif",
              letterSpacing: "0.04em",
            }}
          >
            <Icon className="w-3 h-3" />
            {label}
            {count !== undefined && (
              <span
                className="text-[10px] px-1.5 py-0.5 font-medium"
                style={{
                  background: "oklch(0.88 0.014 75 / 0.6)",
                  color: "oklch(0.55 0.015 70)",
                }}
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
  const cfg  = CONTEXT_CONFIG[context];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 font-medium"
      style={{
        background:  cfg.bg,
        color:       cfg.color,
        border:      `1px solid ${cfg.border}`,
        fontFamily:  "'DM Sans', sans-serif",
        letterSpacing: "0.05em",
      }}
    >
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}
