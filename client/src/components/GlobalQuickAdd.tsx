/* ============================================================
   ADHD FOCUS SPACE — Global Quick Add v5.0 (Morandi)
   Minimum-friction one-sentence task capture
   Icon-based priority (no color emoji), no tag input field
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Flame, Plus, Star, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";

const M = {
  coral:    "oklch(0.58 0.18 340)",
  coralBg:  "oklch(0.58 0.18 340 / 0.08)",
  coralBdr: "oklch(0.58 0.18 340 / 0.28)",
  ink:      "oklch(0.28 0.040 320)",
  muted:    "oklch(0.52 0.040 330)",
  border:   "oklch(0.82 0.050 340)",
  card:     "oklch(0.975 0.018 355)",
};

/* Matches TaskManager's PRIORITY_CONFIG exactly */
const PRIORITY_CFG = {
  urgent: {
    label: "Urgent", Icon: Flame,
    color:  "oklch(0.55 0.09 35)",
    bg:     "oklch(0.55 0.09 35 / 0.08)",
    border: "oklch(0.55 0.09 35 / 0.28)",
  },
  focus: {
    label: "Focus", Icon: Zap,
    color:  "oklch(0.52 0.14 290)",
    bg:     "oklch(0.52 0.14 290 / 0.08)",
    border: "oklch(0.52 0.14 290 / 0.28)",
  },
  normal: {
    label: "Normal", Icon: Star,
    color:  "oklch(0.55 0.10 330)",
    bg:     "oklch(0.72 0.10 330 / 0.10)",
    border: "oklch(0.72 0.10 330 / 0.30)",
  },
} as const;

type Priority = "urgent" | "focus" | "normal";

const QUICK_EXAMPLES = [
  "Reply message from Sarah",
  "Reply email from manager",
  "Book appointment with doctor",
  "Book meeting with team",
  "Review pull request from Alex",
  "Send invoice to client",
];

interface GlobalQuickAddProps {
  onAddTask: (task: Task) => void;
}

export function GlobalQuickAdd({ onAddTask }: GlobalQuickAddProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("focus");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === "Escape") setOpen(false);
      // Press + to open Quick Capture (only when not typing in an input)
      if (e.key === "+") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && !(e.target as HTMLElement).isContentEditable) {
          e.preventDefault();
          setOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // Parse #tag from text
    const hashMatch = trimmed.match(/(^|\s)#([\w-]+)/);
    const effectiveTag = hashMatch ? hashMatch[2].toLowerCase() : "personal";
    const cleanText = hashMatch ? trimmed.replace(/(^|\s)#[\w-]+(\s|$)/g, " ").replace(/\s{2,}/g, " ").trim() : trimmed;

    onAddTask({
      id: nanoid(),
      text: cleanText,
      priority,
      context: (effectiveTag === "work" || effectiveTag === "personal" ? effectiveTag : "personal") as "work" | "personal",
      done: false,
      createdAt: new Date(),
    });
    toast.success(`Task added · ${priority}${effectiveTag !== "personal" ? ` · #${effectiveTag}` : ""}`);
    setText("");
    setPriority("focus");
    setOpen(false);
  };

  return (
    <>
      {/* Floating trigger — retro lo-fi style */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1.5"
        style={{ opacity: open ? 0 : 1, pointerEvents: open ? "none" : "auto", transition: "opacity 0.15s" }}
      >
        <button
          onClick={() => setOpen(true)}
          title="Quick add task (⌘K or +)"
          className="w-12 h-12 flex items-center justify-center transition-all duration-200 active:translate-y-[2px] active:shadow-none"
          style={{
            background:   "oklch(0.975 0.018 355)",
            border:       `2px solid ${M.ink}`,
            boxShadow:    `3px 3px 0 ${M.ink}`,
            fontFamily:   "'Space Mono', monospace",
          }}
        >
          <Plus className="w-5 h-5" style={{ color: M.coral }} />
        </button>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "0.50rem",
          letterSpacing: "0.08em",
          color: M.muted,
          textAlign: "center",
          lineHeight: 1.3,
          userSelect: "none",
          pointerEvents: "none",
        }}>
          press +
        </span>
      </div>

      {/* Backdrop + modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "oklch(0.18 0.01 60 / 0.25)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden shadow-2xl"
            style={{ background: M.card, border: `1px solid ${M.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: M.coralBg, border: `1px solid ${M.coralBdr}` }}>
                <Zap className="w-4 h-4" style={{ color: M.coral }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>Quick capture</p>
                <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>One sentence — no formatting needed</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 transition-colors" style={{ color: M.muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input */}
            <div className="px-5 pb-5">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
                placeholder="e.g. Reply message from Alice…"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="w-full text-base px-4 py-3 bg-transparent focus:outline-none"
                style={{
                  border: `1px solid ${M.border}`,
                  color: M.ink,
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = M.coralBdr; }}
                onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = M.border; }}
              />

              {/* Priority row — icon-based, matching TaskManager */}
              <div className="flex items-center gap-1.5 mt-3">
                {(["urgent", "focus", "normal"] as Priority[]).map((p) => {
                  const { label, Icon, color, bg, border } = PRIORITY_CFG[p];
                  const isActive = priority === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className="flex items-center gap-1.5 px-3 py-1 transition-all"
                      style={{
                        background:    isActive ? bg : "transparent",
                        color:         isActive ? color : M.muted,
                        border:        `1px solid ${isActive ? border : M.border}`,
                        fontFamily:    "'DM Sans', sans-serif",
                        fontSize:      "0.62rem",
                        fontWeight:    isActive ? 600 : 400,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        borderRadius:  0,
                      }}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Quick examples */}
              <div className="flex flex-wrap gap-2 mt-3">
                {QUICK_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setText(ex); inputRef.current?.focus(); }}
                    className="m-chip"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {/* Submit row */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                  tip: type <span style={{ color: M.coral }}>#tag</span> in text to categorise
                </p>
                <button
                  onClick={submit}
                  disabled={!text.trim()}
                  className="m-btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add task
                  <kbd className="text-xs opacity-60 ml-1">↵</kbd>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
