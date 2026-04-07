/* ============================================================
   ADHD FOCUS SPACE — Brain Dump
   Design: Freeform text capture, convert thoughts to tasks
   Purpose: Capture racing thoughts without breaking focus
   ============================================================ */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowRight, Brain, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";

interface BrainDumpEntry {
  id: string;
  text: string;
  createdAt: Date;
  converted: boolean;
}

interface BrainDumpProps {
  onConvertToTask: (task: Task) => void;
}

export function BrainDump({ onConvertToTask }: BrainDumpProps) {
  const [currentThought, setCurrentThought] = useState("");
  const [entries, setEntries] = useState<BrainDumpEntry[]>([]);

  const dump = () => {
    if (!currentThought.trim()) return;
    const entry: BrainDumpEntry = {
      id: nanoid(),
      text: currentThought.trim(),
      createdAt: new Date(),
      converted: false,
    };
    setEntries([entry, ...entries]);
    setCurrentThought("");
    toast.success("Thought captured! Your mind is clear.", { duration: 2000 });
  };

  const convertToTask = (entry: BrainDumpEntry) => {
    const task: Task = {
      id: nanoid(),
      text: entry.text,
      priority: "focus",
      context: "work",
      done: false,
      createdAt: new Date(),
    };
    onConvertToTask(task);
    setEntries(entries.map((e) => e.id === entry.id ? { ...e, converted: true } : e));
    toast.success("Moved to tasks!", { duration: 2000 });
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const clearAll = () => {
    setEntries([]);
    toast.info("Brain dump cleared.", { duration: 2000 });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[oklch(0.65_0.14_185_/_0.06)] border border-[oklch(0.65_0.14_185_/_0.15)]">
        <Brain className="w-5 h-5 text-[oklch(0.55_0.14_185)] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Capture racing thoughts</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dump everything here — no judgment. Convert to tasks later when you're ready.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <Textarea
          value={currentThought}
          onChange={(e) => setCurrentThought(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) dump();
          }}
          placeholder="What's on your mind? Just let it out..."
          className="resize-none bg-white min-h-[100px] focus-visible:ring-[oklch(0.65_0.14_185)]"
          rows={4}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">⌘ + Enter to capture</span>
          <Button
            onClick={dump}
            style={{ background: "oklch(0.65 0.14 185)" }}
          >
            <Brain className="w-4 h-4 mr-2" />
            Dump It
          </Button>
        </div>
      </div>

      {/* Entries */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            Captured thoughts ({entries.length})
          </p>
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Your brain dump is empty. Let your thoughts flow!
            </p>
          </div>
        )}

        {entries.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "group flex items-start gap-3 p-3 rounded-xl border transition-all",
              entry.converted
                ? "bg-muted/40 border-border opacity-50"
                : "bg-white border-border hover:border-[oklch(0.65_0.14_185_/_0.3)]"
            )}
          >
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm leading-relaxed",
                entry.converted && "line-through text-muted-foreground"
              )}>
                {entry.text}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(entry.createdAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {!entry.converted && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => convertToTask(entry)}
                  className="h-7 text-xs px-2 text-[oklch(0.55_0.14_185)] border-[oklch(0.65_0.14_185_/_0.3)] hover:bg-[oklch(0.65_0.14_185_/_0.08)]"
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Task
                </Button>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {entry.converted && (
              <span className="text-xs text-[oklch(0.6_0.14_185)] shrink-0">→ Task</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
