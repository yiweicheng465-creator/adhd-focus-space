/* ============================================================
   ADHD FOCUS SPACE — Context Switcher v4.0 (Dynamic Categories)
   Work  → sage green  oklch(0.48 0.07 145)
   Personal → dusty mauve  oklch(0.52 0.06 20)
   Custom → auto-generated Morandi palette from label hash
   ============================================================ */

import { cn } from "@/lib/utils";
import { Briefcase, LayoutGrid, User, Hash, X } from "lucide-react";

// ItemContext is now a flexible string — "work" | "personal" | any custom tag
export type ItemContext   = string;
export type ActiveContext = string; // "all" | any ItemContext

/* Built-in contexts with fixed Morandi colors */
export const BUILTIN_CONTEXT_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}> = {
  work: {
    label:  "Work",
    icon:   Briefcase,
    color:  "oklch(0.42 0.07 145)",
    bg:     "oklch(0.42 0.07 145 / 0.07)",
    border: "oklch(0.42 0.07 145 / 0.22)",
  },
  personal: {
    label:  "Personal",
    icon:   User,
    color:  "oklch(0.52 0.07 20)",
    bg:     "oklch(0.52 0.07 20 / 0.07)",
    border: "oklch(0.52 0.07 20 / 0.22)",
  },
};

// Keep legacy export for compatibility
export const CONTEXT_CONFIG = BUILTIN_CONTEXT_CONFIG;

/* Generate a deterministic Morandi color from a string label */
function hashColor(label: string): { color: string; bg: string; border: string } {
  // Morandi hue palette: warm earthy tones
  const hues = [35, 55, 75, 95, 115, 145, 165, 185, 205, 260, 290, 320, 345];
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) & 0xffff;
  const hue = hues[hash % hues.length];
  return {
    color:  `oklch(0.48 0.07 ${hue})`,
    bg:     `oklch(0.48 0.07 ${hue} / 0.07)`,
    border: `oklch(0.48 0.07 ${hue} / 0.22)`,
  };
}

/* Get config for any context — built-in or custom */
export function getContextConfig(ctx: string): {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
} {
  if (BUILTIN_CONTEXT_CONFIG[ctx]) return BUILTIN_CONTEXT_CONFIG[ctx];
  const colors = hashColor(ctx);
  return {
    label: ctx.charAt(0).toUpperCase() + ctx.slice(1),
    icon:  Hash,
    ...colors,
  };
}

interface ContextSwitcherProps {
  active: ActiveContext;
  onChange: (ctx: ActiveContext) => void;
  counts?: Record<string, number>;
  /** All known contexts to show as tabs (besides "all") */
  contexts?: string[];
  /** Called when user deletes a custom (non-builtin) context tag */
  onDeleteContext?: (ctx: string) => void;
}

export function ContextSwitcher({ active, onChange, counts, contexts, onDeleteContext }: ContextSwitcherProps) {
  // Always show "all", then built-ins, then custom
  const builtins = ["work", "personal"];
  const custom   = (contexts ?? []).filter((c) => !builtins.includes(c));
  const allCtxs  = [...builtins, ...custom];

  const options: { id: string; label: string; icon: React.ElementType }[] = [
    { id: "all", label: "All", icon: LayoutGrid },
    ...allCtxs.map((c) => {
      const cfg = getContextConfig(c);
      return { id: c, label: cfg.label, icon: cfg.icon };
    }),
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      style={{ padding: "2px 0" }}
    >
      {options.map(({ id, label, icon: Icon }, idx) => {
        const isActive = active === id;
        const cfg      = id !== "all" ? getContextConfig(id) : null;

        const isCustom = id !== "all" && !builtins.includes(id);
        return (
          <div key={id} className="flex items-center" style={{ position: "relative" }}>
            <button
              onClick={() => onChange(id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all justify-center shrink-0"
              style={{
                background:  isActive ? (cfg ? cfg.bg : "oklch(0.93 0.012 78)") : "transparent",
                color:       isActive ? (cfg ? cfg.color : "oklch(0.28 0.018 65)") : "oklch(0.58 0.015 70)",
                border:      `1px solid ${isActive ? (cfg ? cfg.border : "oklch(0.72 0.014 75)") : "oklch(0.88 0.014 75)"}`,
                borderRight: isCustom && onDeleteContext ? "none" : undefined,
                fontFamily:  "'DM Sans', sans-serif",
                letterSpacing: "0.04em",
                cursor: "pointer",
                borderRadius: 0,
              }}
            >
              <Icon className="w-3 h-3" />
              {label}
              {counts?.[id] !== undefined && counts[id] > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 font-medium"
                  style={{
                    background: "oklch(0.88 0.014 75 / 0.6)",
                    color: "oklch(0.55 0.015 70)",
                  }}
                >
                  {counts[id]}
                </span>
              )}
            </button>
            {isCustom && onDeleteContext && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteContext(id); }}
                title={`Delete #${id} tag`}
                className="flex items-center justify-center transition-all"
                style={{
                  width: 20,
                  height: "100%",
                  minHeight: 30,
                  background: isActive ? (cfg ? cfg.bg : "oklch(0.93 0.012 78)") : "transparent",
                  color: "oklch(0.58 0.015 70)",
                  border: `1px solid ${isActive ? (cfg ? cfg.border : "oklch(0.72 0.014 75)") : "oklch(0.88 0.014 75)"}`,
                  borderLeft: "none",
                  cursor: "pointer",
                  borderRadius: 0,
                  padding: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.55 0.18 25)"; (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.55 0.18 25 / 0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.58 0.015 70)"; (e.currentTarget as HTMLButtonElement).style.background = isActive ? (cfg ? cfg.bg : "oklch(0.93 0.012 78)") : "transparent"; }}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Inline context badge — used on task cards */
export function ContextBadge({ context }: { context: string }) {
  const cfg  = getContextConfig(context);
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 font-medium shrink-0"
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
