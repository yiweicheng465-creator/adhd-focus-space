/* ============================================================
   ADHD FOCUS SPACE — Global Quick Add v3.0 (Morandi)
   Minimum-friction one-sentence task capture
   Coral accent, warm cream card, no teal
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Plus, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";

const M = {
  coral:    "oklch(0.55 0.09 35)",
  coralBg:  "oklch(0.55 0.09 35 / 0.08)",
  coralBdr: "oklch(0.55 0.09 35 / 0.28)",
  ink:      "oklch(0.28 0.018 65)",
  muted:    "oklch(0.55 0.018 70)",
  border:   "oklch(0.88 0.014 75)",
  card:     "oklch(0.975 0.012 80)",
};

interface GlobalQuickAddProps {
  onAddTask: (task: Task) => void;
}

export function GlobalQuickAdd({ onAddTask }: GlobalQuickAddProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === "Escape") setOpen(false);
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
    onAddTask({ id: nanoid(), text: trimmed, priority: "focus", context: "work", done: false, createdAt: new Date() });
    setText("");
    setOpen(false);
    toast.success("Task added.", {
      description: trimmed.length > 40 ? trimmed.slice(0, 40) + "…" : trimmed,
      duration: 2500,
    });
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Quick add task (⌘K)"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 flex items-center justify-center transition-all duration-200 hover:opacity-80 active:scale-95"
        style={{
          background: M.ink,
          opacity: open ? 0 : 1,
          pointerEvents: open ? "none" : "auto",
          border: `1px solid ${M.ink}`,
        }}
      >
        <Plus className="w-5 h-5" style={{ color: "oklch(0.97 0.005 80)" }} />
      </button>

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
                placeholder="e.g. Reply to Alice's email…"
                className="w-full text-base px-4 py-3 bg-transparent focus:outline-none"
                style={{
                  border: `1px solid ${M.border}`,
                  color: M.ink,
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = M.coralBdr; }}
                onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = M.border; }}
              />

              {/* Quick examples */}
              <div className="flex flex-wrap gap-2 mt-3">
                {["Reply to email", "Clear downloads folder", "Write daily summary", "Book appointment"].map((ex) => (
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
                  Defaults: Focus priority · Work context
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
