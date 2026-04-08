/* ============================================================
   ADHD FOCUS SPACE — Brain Dump v3.0 (Morandi)
   Capture racing thoughts, convert to tasks
   ============================================================ */

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowRight, Brain, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";

interface BrainDumpEntry {
  id: string; text: string; createdAt: Date; converted: boolean;
}

interface BrainDumpProps {
  onConvertToTask: (task: Task) => void;
}

const M = {
  coral:    "oklch(0.55 0.09 35)",
  coralBg:  "oklch(0.55 0.09 35 / 0.08)",
  coralBdr: "oklch(0.55 0.09 35 / 0.28)",
  sage:     "oklch(0.52 0.07 145)",
  ink:      "oklch(0.28 0.018 65)",
  muted:    "oklch(0.55 0.018 70)",
  border:   "oklch(0.88 0.014 75)",
  card:     "oklch(0.985 0.007 80)",
};

export function BrainDump({ onConvertToTask }: BrainDumpProps) {
  const [currentThought, setCurrentThought] = useState("");
  const [entries,        setEntries]        = useState<BrainDumpEntry[]>([]);

  const dump = () => {
    if (!currentThought.trim()) return;
    setEntries([{ id: nanoid(), text: currentThought.trim(), createdAt: new Date(), converted: false }, ...entries]);
    setCurrentThought("");
    toast.success("Thought captured. Mind clear.", { duration: 2000 });
  };

  const convertToTask = (entry: BrainDumpEntry) => {
    onConvertToTask({ id: nanoid(), text: entry.text, priority: "focus", context: "work", done: false, createdAt: new Date() });
    setEntries(entries.map((e) => e.id === entry.id ? { ...e, converted: true } : e));
    toast.success("Moved to tasks.", { duration: 2000 });
  };

  const deleteEntry = (id: string) => setEntries(entries.filter((e) => e.id !== id));
  const clearAll    = () => { setEntries([]); toast.info("Brain dump cleared.", { duration: 2000 }); };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-start gap-3 p-4" style={{ background: M.coralBg, border: `1px solid ${M.coralBdr}` }}>
        <Brain className="w-5 h-5 mt-0.5 shrink-0" style={{ color: M.coral }} />
        <div>
          <p className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>Capture racing thoughts</p>
          <p className="text-xs mt-0.5" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            Dump everything here — no judgment. Convert to tasks later when you're ready.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <Textarea
          value={currentThought}
          onChange={(e) => setCurrentThought(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) dump(); }}
          placeholder="What's on your mind? Just let it out..."
          className="resize-none min-h-[100px]"
          style={{ background: M.card, border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
          rows={4}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>⌘ + Enter to capture</span>
          <button
            onClick={dump}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:opacity-88"
            style={{ background: M.coral, color: "oklch(0.97 0.005 80)", fontFamily: "'DM Sans', sans-serif" }}
          >
            <Brain className="w-4 h-4" />
            Dump It
          </button>
        </div>
      </div>

      {/* Entries header */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
            Captured thoughts ({entries.length})
          </p>
          <button
            onClick={clearAll}
            className="text-xs transition-colors hover:opacity-70"
            style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="w-10 h-10 mb-3" style={{ color: `${M.muted}50` }} />
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
              Your brain dump is empty. Let your thoughts flow!
            </p>
          </div>
        )}

        {entries.map((entry) => (
          <div
            key={entry.id}
            className={cn("group flex items-start gap-3 p-3 transition-all")}
            style={{
              background: entry.converted ? "oklch(0.93 0.012 78 / 0.5)" : M.card,
              border:     `1px solid ${M.border}`,
              opacity:    entry.converted ? 0.55 : 1,
            }}
            onMouseEnter={(e) => {
              if (!entry.converted) (e.currentTarget as HTMLDivElement).style.borderColor = M.coralBdr;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = M.border;
            }}
          >
            <div className="flex-1 min-w-0">
              <p
                className={cn("text-sm leading-relaxed", entry.converted && "line-through")}
                style={{ color: entry.converted ? M.muted : M.ink, fontFamily: "'DM Sans', sans-serif" }}
              >
                {entry.text}
              </p>
              <p className="text-xs mt-1" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                {new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            {!entry.converted && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => convertToTask(entry)}
                  className="flex items-center gap-1 h-7 px-2 text-xs font-medium transition-all"
                  style={{ border: `1px solid ${M.coralBdr}`, color: M.coral, background: M.coralBg, fontFamily: "'DM Sans', sans-serif" }}
                >
                  <ArrowRight className="w-3 h-3" />
                  Task
                </button>
                <button onClick={() => deleteEntry(entry.id)} className="p-1 transition-colors" style={{ color: M.muted }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {entry.converted && (
              <span className="text-xs shrink-0" style={{ color: M.sage, fontFamily: "'DM Sans', sans-serif" }}>→ Task</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
