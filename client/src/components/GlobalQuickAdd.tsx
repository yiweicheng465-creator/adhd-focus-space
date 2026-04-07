/* ============================================================
   ADHD FOCUS SPACE — Global Quick Add
   ADHD principle: 最小启动单元 — 一句话就能开始
   A floating button always visible on every page.
   Press it (or hit Cmd/Ctrl+K) → type → Enter. Done.
   No priority, no context required — defaults applied.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";

interface GlobalQuickAddProps {
  onAddTask: (task: Task) => void;
}

export function GlobalQuickAdd({ onAddTask }: GlobalQuickAddProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
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
    const task: Task = {
      id: nanoid(),
      text: trimmed,
      priority: "focus",
      context: "work",
      done: false,
      createdAt: new Date(),
    };
    onAddTask(task);
    setText("");
    setOpen(false);
    toast.success("✅ 已加入任务列表！", {
      description: trimmed.length > 40 ? trimmed.slice(0, 40) + "…" : trimmed,
      duration: 2500,
    });
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="快速添加任务 (⌘K)"
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          "hover:scale-110 active:scale-95",
          open ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        style={{ background: "oklch(0.65 0.14 185)" }}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "oklch(0.65 0.14 185 / 0.1)" }}
              >
                <Zap className="w-4 h-4 text-[oklch(0.55_0.14_185)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">一句话添加任务</p>
                <p className="text-xs text-muted-foreground">不用整理格式，说清楚要做什么就行</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input */}
            <div className="px-4 pb-4">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                  if (e.key === "Escape") setOpen(false);
                }}
                placeholder="例如：帮我整理一下这周的会议记录…"
                className="w-full text-base px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.14_185_/_0.4)] placeholder:text-muted-foreground/60"
              />

              {/* Quick examples */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  "回复 Alice 的邮件",
                  "整理桌面文件夹",
                  "写今天的日报",
                  "预约下周体检",
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => { setText(example); inputRef.current?.focus(); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-[oklch(0.65_0.14_185_/_0.4)] hover:text-[oklch(0.55_0.14_185)] transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>

              {/* Submit row */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">默认：Focus 优先级 · Work 上下文</p>
                <button
                  onClick={submit}
                  disabled={!text.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                  style={{ background: "oklch(0.65 0.14 185)" }}
                >
                  <Plus className="w-4 h-4" />
                  添加任务
                  <kbd className="text-xs opacity-70 ml-1">↵</kbd>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
