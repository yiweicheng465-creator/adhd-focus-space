/* ============================================================
   ADHD FOCUS SPACE — Weekly Reset Nudge
   ADHD principle: 固定极简环境 — 每周10分钟整理高频使用区域
   Shows on Monday (or when manually triggered) as a dismissible
   card reminding the user to do their weekly environment reset.
   ============================================================ */

import { useState } from "react";
import { CheckCircle2, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

const RESET_CHECKLIST = [
  { id: "desktop", label: "清理桌面 / 下载文件夹" },
  { id: "inbox",   label: "清空邮件收件箱未读" },
  { id: "tabs",    label: "关闭上周遗留的浏览器标签" },
  { id: "notes",   label: "把散落的笔记归档到 Brain Dump" },
  { id: "agents",  label: "回顾上周 AI Agent 完成情况" },
];

export function WeeklyResetNudge() {
  const [dismissed, setDismissed] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // Show on Mondays, or if user hasn't dismissed this week
  const isMonday = new Date().getDay() === 1;
  // For demo purposes, also show if forced via URL param
  const forceShow = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("reset");

  if (dismissed || (!isMonday && !forceShow)) return null;

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allDone = checked.size === RESET_CHECKLIST.length;

  return (
    <div
      className={cn(
        "p-4 rounded-2xl border transition-all",
        allDone
          ? "border-[oklch(0.6_0.12_145_/_0.4)] bg-[oklch(0.6_0.12_145_/_0.05)]"
          : "border-[oklch(0.75_0.15_75_/_0.4)] bg-[oklch(0.75_0.15_75_/_0.05)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <RefreshCw className={cn("w-4 h-4 shrink-0", allDone ? "text-[oklch(0.5_0.12_145)]" : "text-[oklch(0.6_0.15_75)]")} />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {allDone ? "🎉 本周环境重置完成！" : "🗓️ 周一环境重置 — 10分钟清空杂乱"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {allDone ? "干净的环境让大脑更容易进入状态。" : "减少视觉杂乱，降低无意识分心。每周固定做一次。"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {RESET_CHECKLIST.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all",
                isChecked
                  ? "border-[oklch(0.6_0.12_145_/_0.3)] bg-[oklch(0.6_0.12_145_/_0.06)] text-muted-foreground line-through"
                  : "border-border bg-white hover:border-[oklch(0.75_0.15_75_/_0.4)] text-foreground"
              )}
            >
              {isChecked
                ? <CheckCircle2 className="w-4 h-4 text-[oklch(0.5_0.12_145)] shrink-0" />
                : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
              }
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>

      {allDone && (
        <button
          onClick={() => setDismissed(true)}
          className="mt-3 w-full py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: "oklch(0.6 0.12 145)" }}
        >
          完成，关闭提醒
        </button>
      )}
    </div>
  );
}
