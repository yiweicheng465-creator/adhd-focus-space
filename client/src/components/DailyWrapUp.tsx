/* ============================================================
   ADHD FOCUS SPACE — Daily Wrap-Up
   ADHD principle: 缺乏反馈执行力差 → 完成后看到实际结果
   A "收工仪式" panel: summarises today's agents, tasks done,
   and wins. Generates a plain-text digest the user can copy.
   ============================================================ */

import { useState } from "react";
import { CheckCircle2, ClipboardCopy, Cpu, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Task } from "./TaskManager";
import type { Win } from "./DailyWins";
import type { Agent } from "./AgentTracker";

interface DailyWrapUpProps {
  tasks: Task[];
  wins: Win[];
  agents: Agent[];
  onClose: () => void;
}

export function DailyWrapUp({ tasks, wins, agents, onClose }: DailyWrapUpProps) {
  const [copied, setCopied] = useState(false);

  const today = new Date().toDateString();
  const todayStr = new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" });

  const doneTasks = tasks.filter((t) => t.done);
  const activeTasks = tasks.filter((t) => !t.done);
  const todayWins = wins.filter((w) => new Date(w.createdAt).toDateString() === today);
  const todayAgents = agents.filter((a) => new Date(a.startedAt).toDateString() === today);
  const doneAgents = todayAgents.filter((a) => a.status === "done");
  const runningAgents = todayAgents.filter((a) => a.status === "running");

  const workDone = doneTasks.filter((t) => t.context === "work");
  const personalDone = doneTasks.filter((t) => t.context === "personal");

  // Generate plain-text digest
  const generateDigest = () => {
    const lines: string[] = [
      `📋 ${todayStr} 日终复盘`,
      `${"─".repeat(30)}`,
      "",
      `✅ 完成任务 (${doneTasks.length})`,
      ...doneTasks.map((t) => `  • [${t.context === "work" ? "工作" : "个人"}] ${t.text}`),
      "",
      `🤖 AI Agent 汇报 (${todayAgents.length} 个)`,
      ...todayAgents.map((a) => `  • ${a.name}：${a.task} [${a.status}]${a.notes ? `\n    → ${a.notes}` : ""}`),
      "",
      `🌟 今日 Wins (${todayWins.length})`,
      ...todayWins.map((w) => `  ${w.emoji} ${w.text}`),
      "",
      activeTasks.length > 0
        ? `⏳ 明日待办 (${activeTasks.length})\n${activeTasks.slice(0, 5).map((t) => `  • ${t.text}`).join("\n")}`
        : "🎉 所有任务已清空！",
      "",
      runningAgents.length > 0
        ? `⚠️  仍在运行的 Agent：${runningAgents.map((a) => a.name).join("、")}`
        : "",
    ];
    return lines.filter((l) => l !== undefined).join("\n");
  };

  const copyDigest = async () => {
    try {
      await navigator.clipboard.writeText(generateDigest());
      setCopied(true);
      toast.success("复盘内容已复制到剪贴板！");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("复制失败，请手动选取文本");
    }
  };

  const score = Math.min(100, doneTasks.length * 15 + todayWins.length * 10 + doneAgents.length * 10);
  const scoreLabel = score >= 80 ? "超级高效！🚀" : score >= 50 ? "今天干得不错 💪" : score >= 20 ? "有进展，明天继续 🌱" : "休息也是生产力 ☕";

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border" style={{ background: "oklch(0.65 0.14 185 / 0.06)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{todayStr}</p>
              <h2 className="text-xl font-display font-bold text-foreground mt-0.5">今日复盘 🌙</h2>
              <p className="text-sm text-muted-foreground mt-1">{scoreLabel}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Score bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>今日效率分</span>
              <span className="font-medium text-foreground">{score} / 100</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${score}%`, background: "oklch(0.65 0.14 185)" }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Tasks done */}
          <Section icon={<CheckCircle2 className="w-4 h-4" />} title={`完成任务 (${doneTasks.length})`} color="oklch(0.6 0.12 145)">
            {doneTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">今天还没完成任务，明天加油！</p>
            ) : (
              <div className="space-y-1.5">
                {workDone.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[oklch(0.5_0.18_260)] mb-1">工作</p>
                    {workDone.map((t) => <TaskRow key={t.id} text={t.text} />)}
                  </div>
                )}
                {personalDone.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[oklch(0.45_0.18_310)] mb-1">个人</p>
                    {personalDone.map((t) => <TaskRow key={t.id} text={t.text} />)}
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Agents */}
          <Section icon={<Cpu className="w-4 h-4" />} title={`AI Agent 汇报 (${todayAgents.length})`} color="oklch(0.55 0.14 185)">
            {todayAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">今天没有运行 Agent。</p>
            ) : (
              <div className="space-y-2">
                {todayAgents.map((a) => {
                  const statusColors: Record<string, string> = { running: "oklch(0.65 0.14 185)", paused: "oklch(0.75 0.15 75)", done: "oklch(0.6 0.12 145)", failed: "oklch(0.65 0.22 15)" };
                  return (
                    <div key={a.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: statusColors[a.status] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{a.name}</span>
                          <span className="text-xs capitalize" style={{ color: statusColors[a.status] }}>{a.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{a.task}</p>
                        {a.notes && <p className="text-xs text-foreground mt-1 bg-white rounded p-1.5 border border-border">→ {a.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Wins */}
          <Section icon={<Sparkles className="w-4 h-4" />} title={`今日 Wins (${todayWins.length})`} color="oklch(0.6 0.15 75)">
            {todayWins.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">今天还没有记录 Win，完成任务后会自动添加。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {todayWins.map((w) => (
                  <div key={w.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[oklch(0.75_0.15_75_/_0.08)] border border-[oklch(0.75_0.15_75_/_0.25)] text-sm">
                    <span>{w.emoji}</span>
                    <span>{w.text}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Tomorrow's pending */}
          {activeTasks.length > 0 && (
            <Section icon={<span className="text-base">⏳</span>} title={`明日待办 (${activeTasks.length})`} color="oklch(0.55 0.08 255)">
              <div className="space-y-1.5">
                {activeTasks.slice(0, 6).map((t) => <TaskRow key={t.id} text={t.text} />)}
                {activeTasks.length > 6 && <p className="text-xs text-muted-foreground">…还有 {activeTasks.length - 6} 项</p>}
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>关闭</Button>
          <Button
            className="flex-1 gap-2"
            style={{ background: "oklch(0.65 0.14 185)" }}
            onClick={copyDigest}
          >
            <ClipboardCopy className="w-4 h-4" />
            {copied ? "已复制！" : "复制复盘文本"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {children}
    </div>
  );
}

function TaskRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.5_0.12_145)] shrink-0" />
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}
