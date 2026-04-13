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

/* Built-in contexts with dreamy SukiSketch colors */
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
    color:  "oklch(0.48 0.14 290)",
    bg:     "oklch(0.48 0.14 290 / 0.10)",
    border: "oklch(0.48 0.14 290 / 0.28)",
  },
  personal: {
    label:  "Personal",
    icon:   User,
    color:  "var(--c-accent-text)",
    bg:     "var(--c-accent-bg-sm)",
    border: "var(--c-accent-bd-sm)",
  },
};

// Keep legacy export for compatibility
export const CONTEXT_CONFIG = BUILTIN_CONTEXT_CONFIG;

/* Generate a deterministic dreamy pastel color from a string label */
function hashColor(label: string): { color: string; bg: string; border: string } {
  // Dreamy hue palette: pink, lavender, mint, sky-blue, soft yellow
  const hues = [340, 355, 290, 270, 220, 200, 168, 150, 60, 40, 310, 330, 180];
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) & 0xffff;
  const hue = hues[hash % hues.length];
  return {
    color:  `oklch(0.48 0.12 ${hue})`,
    bg:     `oklch(0.48 0.12 ${hue} / 0.08)`,
    border: `oklch(0.48 0.12 ${hue} / 0.25)`,
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

        const isCustom = id !== "all" && !builtins.includes(id) && !!onDeleteContext;
        return (
          <div
            key={id}
            className="group flex items-center"
            style={{ position: "relative" }}
          >
            <button
              onClick={() => onChange(id)}
              className="flex items-center gap-1.5 text-xs font-medium transition-all justify-center shrink-0"
              style={{
                background:    isActive ? (cfg ? cfg.bg : "oklch(0.92 0.030 355)") : "transparent",
                color:         isActive ? (cfg ? cfg.color : "var(--c-deep-text)") : "var(--c-accent-faint)",
                border:        `1px solid ${isActive ? (cfg ? cfg.border : "var(--c-mid-soft)") : "var(--c-light-border)"}`,
                fontFamily:    "'DM Sans', sans-serif",
                letterSpacing: "0.04em",
                cursor:        "pointer",
                borderRadius:  0,
                /* padding: leave room for × on the right when custom */
                padding:       isCustom ? "8px 6px 8px 12px" : "8px 12px",
              }}
            >
              <Icon className="w-3 h-3" />
              {label}
              {counts?.[id] !== undefined && counts[id] > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 font-medium"
                  style={{
                    background: "var(--c-light-divider)",
                    color: "var(--c-accent-faint)",
                  }}
                >
                  {counts[id]}
                </span>
              )}
              {/* × lives INSIDE the same button rectangle, hidden until group hover */}
              {isCustom && (
                <span
                  onClick={(e) => { e.stopPropagation(); onDeleteContext!(id); }}
                  title={`Delete #${id} tag`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ml-0.5"
                  style={{
                    width: 14,
                    height: 14,
                    color: "var(--c-accent-faint)",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "var(--c-accent)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "var(--c-accent-faint)"; }}
                >
                  <X style={{ width: 10, height: 10 }} />
                </span>
              )}
            </button>
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
      className="inline-flex items-center gap-1 shrink-0"
      style={{
        background:    cfg.bg,
        color:         cfg.color,
        border:        `1.5px solid ${cfg.border}`,
        borderRadius:  2,
        padding:       "2px 6px",
        fontFamily:    "'Space Mono', monospace",
        fontSize:      "0.6rem",
        fontWeight:    700,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
      }}
    >
      <Icon style={{ width: 9, height: 9 }} />
      {cfg.label}
    </span>
  );
}
