/* ============================================================
   ADHD FOCUS SPACE — AI Agent Tracker
   Design: Focused Modernism — navy/teal/coral/gold palette
   Purpose: Log running AI agents, track what they're doing,
            compare against task list to ensure full coverage.
   ============================================================ */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Bot,
  CheckCircle2,
  Circle,
  Clock,
  Cpu,
  Flame,
  Link2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";

/* ── Types ──────────────────────────────────────────────── */

export type AgentStatus = "running" | "paused" | "done" | "failed";

export interface Agent {
  id: string;
  name: string;
  task: string;
  status: AgentStatus;
  linkedTaskId?: string;   // optional link to a task in the task list
  startedAt: Date;
  endedAt?: Date;
  notes?: string;
}

/* ── Status config ──────────────────────────────────────── */

const STATUS_CONFIG: Record<AgentStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}> = {
  running: {
    label: "Running",
    icon: Play,
    color: "oklch(0.65 0.14 185)",
    bg: "oklch(0.65 0.14 185 / 0.08)",
    border: "oklch(0.65 0.14 185 / 0.25)",
  },
  paused: {
    label: "Paused",
    icon: Pause,
    color: "oklch(0.75 0.15 75)",
    bg: "oklch(0.75 0.15 75 / 0.08)",
    border: "oklch(0.75 0.15 75 / 0.25)",
  },
  done: {
    label: "Done",
    icon: CheckCircle2,
    color: "oklch(0.6 0.12 145)",
    bg: "oklch(0.6 0.12 145 / 0.08)",
    border: "oklch(0.6 0.12 145 / 0.25)",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "oklch(0.65 0.22 15)",
    bg: "oklch(0.65 0.22 15 / 0.08)",
    border: "oklch(0.65 0.22 15 / 0.25)",
  },
};

/* ── Helpers ────────────────────────────────────────────── */

function elapsed(start: Date, end?: Date): string {
  const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m`;
  return "< 1m";
}

/* ── Component ──────────────────────────────────────────── */

interface AgentTrackerProps {
  agents: Agent[];
  onAgentsChange: (agents: Agent[]) => void;
  tasks: Task[];
}

export function AgentTracker({ agents, onAgentsChange, tasks }: AgentTrackerProps) {
  const [name, setName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [linkedTaskId, setLinkedTaskId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<AgentStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteEditing, setNoteEditing] = useState<{ id: string; value: string } | null>(null);

  /* ── Derived stats ── */
  const today = new Date().toDateString();
  const todayAgents = agents.filter(
    (a) => new Date(a.startedAt).toDateString() === today
  );
  const runningCount = todayAgents.filter((a) => a.status === "running").length;
  const doneCount = todayAgents.filter((a) => a.status === "done").length;

  /* ── Task coverage check ── */
  // Active tasks that have NO linked agent running/paused
  const uncoveredTasks = tasks
    .filter((t) => !t.done)
    .filter(
      (t) =>
        !agents.some(
          (a) =>
            a.linkedTaskId === t.id &&
            (a.status === "running" || a.status === "paused")
        )
    );

  /* ── Add agent ── */
  const addAgent = () => {
    if (!name.trim() || !taskDesc.trim()) {
      toast.error("Give the agent a name and describe what it's doing.");
      return;
    }
    const agent: Agent = {
      id: nanoid(),
      name: name.trim(),
      task: taskDesc.trim(),
      status: "running",
      linkedTaskId: linkedTaskId || undefined,
      startedAt: new Date(),
    };
    onAgentsChange([agent, ...agents]);
    setName("");
    setTaskDesc("");
    setLinkedTaskId("");
    toast.success(`Agent "${agent.name}" is now running!`, { duration: 2500 });
  };

  /* ── Status cycle ── */
  const cycleStatus = (id: string) => {
    const cycle: AgentStatus[] = ["running", "paused", "done", "failed"];
    onAgentsChange(
      agents.map((a) => {
        if (a.id !== id) return a;
        const next = cycle[(cycle.indexOf(a.status) + 1) % cycle.length];
        return {
          ...a,
          status: next,
          endedAt: next === "done" || next === "failed" ? new Date() : undefined,
        };
      })
    );
  };

  /* ── Delete ── */
  const deleteAgent = (id: string) => {
    onAgentsChange(agents.filter((a) => a.id !== id));
  };

  /* ── Save note ── */
  const saveNote = () => {
    if (!noteEditing) return;
    onAgentsChange(
      agents.map((a) =>
        a.id === noteEditing.id ? { ...a, notes: noteEditing.value } : a
      )
    );
    setNoteEditing(null);
    toast.success("Note saved.", { duration: 1500 });
  };

  /* ── Filtered list ── */
  const filtered = agents.filter(
    (a) => filterStatus === "all" || a.status === filterStatus
  );

  /* ── Active tasks (for link dropdown) ── */
  const activeTasks = tasks.filter((t) => !t.done);

  return (
    <div className="flex flex-col gap-5">

      {/* ── Summary bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          icon={<Cpu className="w-4 h-4" />}
          label="Running Now"
          value={runningCount}
          color="oklch(0.65 0.14 185)"
          bg="oklch(0.65 0.14 185 / 0.08)"
          border="oklch(0.65 0.14 185 / 0.2)"
        />
        <SummaryCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Done Today"
          value={doneCount}
          color="oklch(0.6 0.12 145)"
          bg="oklch(0.6 0.12 145 / 0.08)"
          border="oklch(0.6 0.12 145 / 0.2)"
        />
        <SummaryCard
          icon={<Bot className="w-4 h-4" />}
          label="Total Today"
          value={todayAgents.length}
          color="oklch(0.55 0.08 255)"
          bg="oklch(0.55 0.08 255 / 0.08)"
          border="oklch(0.55 0.08 255 / 0.2)"
        />
        <SummaryCard
          icon={<Flame className="w-4 h-4" />}
          label="Uncovered Tasks"
          value={uncoveredTasks.length}
          color={uncoveredTasks.length > 0 ? "oklch(0.65 0.22 15)" : "oklch(0.6 0.12 145)"}
          bg={uncoveredTasks.length > 0 ? "oklch(0.65 0.22 15 / 0.08)" : "oklch(0.6 0.12 145 / 0.08)"}
          border={uncoveredTasks.length > 0 ? "oklch(0.65 0.22 15 / 0.2)" : "oklch(0.6 0.12 145 / 0.2)"}
        />
      </div>

      {/* ── Task coverage alert ── */}
      {uncoveredTasks.length > 0 && (
        <div className="p-4 rounded-xl border border-[oklch(0.65_0.22_15_/_0.3)] bg-[oklch(0.65_0.22_15_/_0.05)]">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-[oklch(0.6_0.22_15)]" />
            <p className="text-sm font-semibold text-foreground">
              {uncoveredTasks.length} task{uncoveredTasks.length > 1 ? "s" : ""} not yet delegated to an agent
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {uncoveredTasks.map((t) => (
              <span
                key={t.id}
                className="text-xs px-2.5 py-1 rounded-full bg-white border border-[oklch(0.65_0.22_15_/_0.25)] text-[oklch(0.5_0.2_15)]"
              >
                {t.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {uncoveredTasks.length === 0 && activeTasks.length > 0 && (
        <div className="p-3 rounded-xl border border-[oklch(0.6_0.12_145_/_0.3)] bg-[oklch(0.6_0.12_145_/_0.05)] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[oklch(0.5_0.12_145)]" />
          <p className="text-sm text-[oklch(0.45_0.12_145)] font-medium">
            All active tasks are covered by an agent. You're fully delegated!
          </p>
        </div>
      )}

      {/* ── Add agent form ── */}
      <div className="p-4 rounded-2xl bg-white border border-border shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="w-4 h-4 text-[oklch(0.55_0.14_185)]" />
          <p className="text-sm font-semibold text-foreground">Log a new agent</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Agent name (e.g. Manus, Claude, GPT-4o)"
            className="bg-background"
          />
          <Input
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAgent()}
            placeholder="What is it doing?"
            className="bg-background"
          />
        </div>

        {/* Link to a task */}
        {activeTasks.length > 0 && (
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={linkedTaskId}
              onChange={(e) => setLinkedTaskId(e.target.value)}
              className="flex-1 text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.14_185_/_0.4)]"
            >
              <option value="">Link to a task (optional)</option>
              {activeTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.text}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button
          onClick={addAgent}
          className="self-start"
          style={{ background: "oklch(0.65 0.14 185)" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Start Agent
        </Button>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-1 text-sm border-b border-border pb-2">
        {(["all", "running", "paused", "done", "failed"] as const).map((s) => {
          const count =
            s === "all"
              ? agents.length
              : agents.filter((a) => a.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-1 rounded-md transition-colors capitalize",
                filterStatus === s
                  ? "bg-[oklch(0.65_0.14_185_/_0.1)] text-[oklch(0.45_0.14_185)] font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s].label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Agent list ── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="w-12 h-12 text-muted-foreground/25 mb-3" />
            <p className="text-sm text-muted-foreground">
              No agents logged yet. Start one above!
            </p>
          </div>
        )}

        {filtered.map((agent) => {
          const cfg = STATUS_CONFIG[agent.status];
          const StatusIcon = cfg.icon;
          const isExpanded = expandedId === agent.id;
          const linkedTask = tasks.find((t) => t.id === agent.linkedTaskId);

          return (
            <div
              key={agent.id}
              className="rounded-2xl border bg-white overflow-hidden transition-all"
              style={{ borderColor: cfg.border }}
            >
              {/* Main row */}
              <div
                className="flex items-start gap-3 p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : agent.id)}
              >
                {/* Status icon / pulse */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    agent.status === "running" && "pulse-ring"
                  )}
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-semibold text-sm text-foreground">
                      {agent.name}
                    </span>
                    <Badge
                      className="text-xs px-2 py-0"
                      style={{
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                      }}
                    >
                      {cfg.label}
                    </Badge>
                    {linkedTask && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        {linkedTask.text.length > 30
                          ? linkedTask.text.slice(0, 30) + "…"
                          : linkedTask.text}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {agent.task}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {elapsed(agent.startedAt, agent.endedAt)}
                    </span>
                    <span>
                      Started{" "}
                      {new Date(agent.startedAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {agent.endedAt && (
                      <span>
                        Ended{" "}
                        {new Date(agent.endedAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => cycleStatus(agent.id)}
                    title="Cycle status"
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAgent(agent.id)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded notes section */}
              {isExpanded && (
                <div
                  className="px-4 pb-4 border-t"
                  style={{ borderColor: cfg.border }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-medium text-muted-foreground mt-3 mb-1.5">
                    Notes / output summary
                  </p>
                  {noteEditing?.id === agent.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={noteEditing.value}
                        onChange={(e) =>
                          setNoteEditing({ id: agent.id, value: e.target.value })
                        }
                        className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.14_185_/_0.4)] min-h-[80px]"
                        placeholder="What did this agent produce? Any key outputs?"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveNote} style={{ background: "oklch(0.65 0.14 185)" }}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setNoteEditing(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-sm text-muted-foreground cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors min-h-[40px]"
                      onClick={() =>
                        setNoteEditing({ id: agent.id, value: agent.notes ?? "" })
                      }
                    >
                      {agent.notes ? (
                        agent.notes
                      ) : (
                        <span className="italic opacity-60">
                          Click to add notes or output summary…
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quick status buttons */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {(["running", "paused", "done", "failed"] as AgentStatus[]).map(
                      (s) => {
                        const c = STATUS_CONFIG[s];
                        const SI = c.icon;
                        return (
                          <button
                            key={s}
                            onClick={() =>
                              onAgentsChange(
                                agents.map((a) =>
                                  a.id === agent.id
                                    ? {
                                        ...a,
                                        status: s,
                                        endedAt:
                                          s === "done" || s === "failed"
                                            ? new Date()
                                            : undefined,
                                      }
                                    : a
                                )
                              )
                            }
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                              agent.status === s
                                ? "ring-2 ring-offset-1 scale-105"
                                : "opacity-60 hover:opacity-100"
                            )}
                            style={{
                              background: c.bg,
                              color: c.color,
                              borderColor: c.border,
                            }}
                          >
                            <SI className="w-3 h-3" />
                            {c.label}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Summary card sub-component ─────────────────────────── */

function SummaryCard({
  icon,
  label,
  value,
  color,
  bg,
  border,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{ background: bg, borderColor: border }}
    >
      <div className="flex items-center gap-2 mb-1" style={{ color }}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-display font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
