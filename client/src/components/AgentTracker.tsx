/* ============================================================
   ADHD FOCUS SPACE — AI Agent Tracker v3.0 (Morandi)
   Palette: coral primary, sage done, slumber paused, dusty rose failed
   No teal, no bright green, no vivid red
   ============================================================ */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Clock, Cpu, Flame,
  Link2, Pause, Play, Plus, RefreshCw, Trash2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";
import {
  ContextSwitcher, ContextBadge, CONTEXT_CONFIG,
  type ItemContext, type ActiveContext,
} from "./ContextSwitcher";

/* ── Morandi tokens ── */
const M = {
  coral:    "oklch(0.55 0.09 35)",
  coralBg:  "oklch(0.55 0.09 35 / 0.08)",
  coralBdr: "oklch(0.55 0.09 35 / 0.25)",
  sage:     "oklch(0.52 0.07 145)",
  sageBg:   "oklch(0.52 0.07 145 / 0.08)",
  sageBdr:  "oklch(0.52 0.07 145 / 0.25)",
  slumber:  "oklch(0.55 0.018 70)",
  slumBg:   "oklch(0.72 0.018 75 / 0.15)",
  slumBdr:  "oklch(0.72 0.018 75 / 0.40)",
  rose:     "oklch(0.52 0.07 20)",
  roseBg:   "oklch(0.52 0.07 20 / 0.08)",
  roseBdr:  "oklch(0.52 0.07 20 / 0.25)",
  ink:      "oklch(0.28 0.018 65)",
  muted:    "oklch(0.55 0.018 70)",
  border:   "oklch(0.88 0.014 75)",
  card:     "oklch(0.985 0.007 80)",
};

/* ── Types ── */
export type AgentStatus = "running" | "paused" | "done" | "failed";

export interface Agent {
  id: string;
  name: string;
  task: string;
  status: AgentStatus;
  context: ItemContext;
  linkedTaskId?: string;
  startedAt: Date;
  endedAt?: Date;
  notes?: string;
}

const STATUS_CONFIG: Record<AgentStatus, {
  label: string; icon: React.ElementType;
  color: string; bg: string; border: string;
}> = {
  running: { label: "Running", icon: Play,         color: M.coral,   bg: M.coralBg,  border: M.coralBdr },
  paused:  { label: "Paused",  icon: Pause,        color: M.slumber, bg: M.slumBg,   border: M.slumBdr  },
  done:    { label: "Done",    icon: CheckCircle2, color: M.sage,    bg: M.sageBg,   border: M.sageBdr  },
  failed:  { label: "Failed",  icon: XCircle,      color: M.rose,    bg: M.roseBg,   border: M.roseBdr  },
};

function elapsed(start: Date, end?: Date): string {
  const ms   = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const hrs  = Math.floor(mins / 60);
  if (hrs > 0)  return `${hrs}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m`;
  return "< 1m";
}

interface AgentTrackerProps {
  agents: Agent[];
  onAgentsChange: (agents: Agent[]) => void;
  tasks: Task[];
  defaultContext?: ActiveContext;
}

export function AgentTracker({ agents, onAgentsChange, tasks, defaultContext = "all" }: AgentTrackerProps) {
  const [name,           setName]           = useState("");
  const [taskDesc,       setTaskDesc]       = useState("");
  const [linkedTaskId,   setLinkedTaskId]   = useState<string>("");
  const [newCtx,         setNewCtx]         = useState<ItemContext>("work");
  const [activeContext,  setActiveContext]  = useState<ActiveContext>(defaultContext);
  const [filterStatus,   setFilterStatus]  = useState<AgentStatus | "all">("all");
  const [expandedId,     setExpandedId]    = useState<string | null>(null);
  const [noteEditing,    setNoteEditing]   = useState<{ id: string; value: string } | null>(null);

  const today        = new Date().toDateString();
  const todayAgents  = agents.filter((a) => new Date(a.startedAt).toDateString() === today);
  const runningCount = todayAgents.filter((a) => a.status === "running").length;
  const doneCount    = todayAgents.filter((a) => a.status === "done").length;

  const activeTasks    = tasks.filter((t) => !t.done);
  const contextTasks   = activeTasks.filter((t) => activeContext === "all" ? true : t.context === activeContext);
  const uncoveredTasks = contextTasks.filter(
    (t) => !agents.some((a) => a.linkedTaskId === t.id && (a.status === "running" || a.status === "paused"))
  );

  const counts = {
    all:      agents.length,
    work:     agents.filter((a) => a.context === "work").length,
    personal: agents.filter((a) => a.context === "personal").length,
  };

  const addAgent = () => {
    if (!name.trim() || !taskDesc.trim()) {
      toast.error("Give the agent a name and describe what it's doing.");
      return;
    }
    const agent: Agent = {
      id: nanoid(), name: name.trim(), task: taskDesc.trim(),
      status: "running", context: newCtx,
      linkedTaskId: linkedTaskId || undefined, startedAt: new Date(),
    };
    onAgentsChange([agent, ...agents]);
    setName(""); setTaskDesc(""); setLinkedTaskId("");
    toast.success(`Agent "${agent.name}" is now running.`, { duration: 2500 });
  };

  const cycleStatus = (id: string) => {
    const cycle: AgentStatus[] = ["running", "paused", "done", "failed"];
    onAgentsChange(agents.map((a) => {
      if (a.id !== id) return a;
      const next = cycle[(cycle.indexOf(a.status) + 1) % cycle.length];
      return { ...a, status: next, endedAt: next === "done" || next === "failed" ? new Date() : undefined };
    }));
  };

  const deleteAgent = (id: string) => onAgentsChange(agents.filter((a) => a.id !== id));

  const saveNote = () => {
    if (!noteEditing) return;
    onAgentsChange(agents.map((a) => a.id === noteEditing.id ? { ...a, notes: noteEditing.value } : a));
    setNoteEditing(null);
    toast.success("Note saved.", { duration: 1500 });
  };

  const filtered = agents
    .filter((a) => activeContext === "all" ? true : a.context === activeContext)
    .filter((a) => filterStatus === "all" || a.status === filterStatus);

  const linkableTasks = activeTasks.filter((t) => activeContext === "all" ? true : t.context === newCtx);

  const LABEL: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.65rem",
    fontWeight: 500,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: M.muted,
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Context switcher */}
      <ContextSwitcher active={activeContext} onChange={setActiveContext} counts={counts} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Cpu className="w-3.5 h-3.5" />,         label: "Running Now",    value: runningCount,       color: M.coral,   bg: M.coralBg,  border: M.coralBdr },
          { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Done Today",     value: doneCount,          color: M.sage,    bg: M.sageBg,   border: M.sageBdr  },
          { icon: <Cpu className="w-3.5 h-3.5" />,          label: "Total Today",    value: todayAgents.length, color: M.slumber, bg: M.slumBg,   border: M.slumBdr  },
          {
            icon: <Flame className="w-3.5 h-3.5" />,
            label: "Uncovered Tasks",
            value: uncoveredTasks.length,
            color:  uncoveredTasks.length > 0 ? M.rose    : M.sage,
            bg:     uncoveredTasks.length > 0 ? M.roseBg  : M.sageBg,
            border: uncoveredTasks.length > 0 ? M.roseBdr : M.sageBdr,
          },
        ].map(({ icon, label, value, color, bg, border }) => (
          <div key={label} className="p-4" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-1.5 mb-2" style={{ color }}>
              {icon}
              <span style={LABEL}>{label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color, fontFamily: "'Playfair Display', serif" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Coverage alert */}
      {uncoveredTasks.length > 0 && (
        <div className="p-4" style={{ border: `1px solid ${M.roseBdr}`, background: M.roseBg }}>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4" style={{ color: M.rose }} />
            <p className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
              {uncoveredTasks.length} task{uncoveredTasks.length > 1 ? "s" : ""} not yet delegated to an agent
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {uncoveredTasks.map((t) => (
              <span key={t.id} className="text-xs px-2.5 py-1" style={{ background: M.card, border: `1px solid ${M.roseBdr}`, color: M.rose, fontFamily: "'DM Sans', sans-serif" }}>
                {t.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {uncoveredTasks.length === 0 && contextTasks.length > 0 && (
        <div className="p-3 flex items-center gap-2" style={{ border: `1px solid ${M.sageBdr}`, background: M.sageBg }}>
          <CheckCircle2 className="w-4 h-4" style={{ color: M.sage }} />
          <p className="text-sm font-medium" style={{ color: M.sage, fontFamily: "'DM Sans', sans-serif" }}>
            All active tasks are covered. You're fully delegated!
          </p>
        </div>
      )}

      {/* Add agent form */}
      <div className="p-5 flex flex-col gap-3" style={{ background: M.card, border: `1px solid ${M.border}` }}>
        <p className="editorial-label mb-1" style={{ color: M.coral }}>Log a new agent</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Agent name (e.g. Manus, Claude, GPT-4o)"
            style={{ background: "oklch(0.972 0.010 78)", border: `1px solid ${M.border}`, fontFamily: "'DM Sans', sans-serif" }}
          />
          <Input
            value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAgent()}
            placeholder="What is it doing?"
            style={{ background: "oklch(0.972 0.010 78)", border: `1px solid ${M.border}`, fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>

        {/* Context picker */}
        <div className="flex items-center gap-2">
          <span style={LABEL}>Context:</span>
          {(["work", "personal"] as ItemContext[]).map((ctx) => {
            const cfg  = CONTEXT_CONFIG[ctx];
            const Icon = cfg.icon;
            return (
              <button
                key={ctx}
                onClick={() => setNewCtx(ctx)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all"
                style={{
                  background:  newCtx === ctx ? cfg.bg : "transparent",
                  color:       newCtx === ctx ? cfg.color : M.muted,
                  border:      `1px solid ${newCtx === ctx ? cfg.border : M.border}`,
                  fontFamily:  "'DM Sans', sans-serif",
                  outline:     newCtx === ctx ? `2px solid ${cfg.color}30` : undefined,
                  outlineOffset: "2px",
                }}
              >
                <Icon className="w-3 h-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Link to task */}
        {linkableTasks.length > 0 && (
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 shrink-0" style={{ color: M.muted }} />
            <select
              value={linkedTaskId} onChange={(e) => setLinkedTaskId(e.target.value)}
              className="flex-1 text-sm px-3 py-2 focus:outline-none"
              style={{ border: `1px solid ${M.border}`, background: "oklch(0.972 0.010 78)", color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
            >
              <option value="">Link to a task (optional)</option>
              {linkableTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.text}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={addAgent}
          className="m-btn-primary self-start"
        >
          <Plus className="w-3.5 h-3.5" />
          Start Agent
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 text-xs" style={{ borderBottom: `1px solid ${M.border}` }}>
        {(["all", "running", "paused", "done", "failed"] as const).map((s) => {
          const count  = s === "all" ? filtered.length : filtered.filter((a) => a.status === s).length;
          const isAct  = filterStatus === s;
          const cfg    = s !== "all" ? STATUS_CONFIG[s] : null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-4 py-2 transition-all"
              style={{
                color:        isAct ? (cfg ? cfg.color : M.ink) : M.muted,
                borderBottom: isAct ? `2px solid ${cfg ? cfg.color : M.coral}` : "2px solid transparent",
                fontFamily:   "'DM Sans', sans-serif",
                fontWeight:   isAct ? 600 : 400,
                fontSize:     "0.68rem",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
              }}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Agent list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ opacity: 0.18 }}>
              <rect x="8" y="14" width="24" height="20" fill="none" stroke={M.muted} strokeWidth="1" />
              <circle cx="15" cy="24" r="3" fill="none" stroke={M.muted} strokeWidth="0.8" />
              <circle cx="25" cy="24" r="3" fill="none" stroke={M.muted} strokeWidth="0.8" />
              <line x1="20" y1="14" x2="20" y2="8" stroke={M.muted} strokeWidth="1" />
              <circle cx="20" cy="6" r="2" fill="none" stroke={M.muted} strokeWidth="0.8" />
              <line x1="8" y1="30" x2="4" y2="34" stroke={M.muted} strokeWidth="0.8" />
              <line x1="32" y1="30" x2="36" y2="34" stroke={M.muted} strokeWidth="0.8" />
            </svg>
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>No agents yet.</p>
          </div>
        )}

        {filtered.map((agent) => {
          const cfg        = STATUS_CONFIG[agent.status];
          const StatusIcon = cfg.icon;
          const isExpanded = expandedId === agent.id;
          const linkedTask = tasks.find((t) => t.id === agent.linkedTaskId);

          return (
            <div key={agent.id} className="overflow-hidden transition-all" style={{ border: `1px solid ${cfg.border}`, background: M.card }}>
              {/* Main row */}
              <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : agent.id)}>
                {/* Status icon */}
                <div
                  className="w-9 h-9 flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: M.ink, fontFamily: "'Playfair Display', serif" }}>{agent.name}</span>
                    <span className="text-[10px] px-2 py-0.5 font-medium" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontFamily: "'DM Sans', sans-serif" }}>
                      {cfg.label}
                    </span>
                    <ContextBadge context={agent.context} />
                    {linkedTask && (
                      <span className="text-xs flex items-center gap-1" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                        <Link2 className="w-3 h-3" />
                        {linkedTask.text.length > 28 ? linkedTask.text.slice(0, 28) + "…" : linkedTask.text}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-0.5 truncate" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>{agent.task}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{elapsed(agent.startedAt, agent.endedAt)}</span>
                    <span>Started {new Date(agent.startedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                    {agent.endedAt && <span>Ended {new Date(agent.endedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => cycleStatus(agent.id)} title="Cycle status" className="p-1.5 transition-colors" style={{ color: M.muted }}>
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteAgent(agent.id)} className="p-1.5 transition-colors" style={{ color: M.muted }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded notes */}
              {isExpanded && (
                <div className="px-4 pb-4" style={{ borderTop: `1px solid ${cfg.border}` }} onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs font-medium mt-3 mb-1.5" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Notes / output summary
                  </p>
                  {noteEditing?.id === agent.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={noteEditing.value}
                        onChange={(e) => setNoteEditing({ id: agent.id, value: e.target.value })}
                        className="w-full text-sm px-3 py-2 resize-none focus:outline-none min-h-[80px]"
                        style={{ border: `1px solid ${M.border}`, background: "oklch(0.972 0.010 78)", color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
                        placeholder="What did this agent produce? Any key outputs?"
                      />
                      <div className="flex gap-2">
                        <button onClick={saveNote} className="m-btn-primary">Save</button>
                        <button onClick={() => setNoteEditing(null)} className="m-btn-ghost">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-sm cursor-pointer p-2 min-h-[40px] transition-colors"
                      style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}
                      onClick={() => setNoteEditing({ id: agent.id, value: agent.notes ?? "" })}
                    >
                      {agent.notes ? agent.notes : <span className="italic opacity-60">Click to add notes or output summary…</span>}
                    </div>
                  )}

                  {/* Quick status buttons */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {(["running", "paused", "done", "failed"] as AgentStatus[]).map((s) => {
                      const c  = STATUS_CONFIG[s];
                      const SI = c.icon;
                      return (
                        <button
                          key={s}
                          onClick={() => onAgentsChange(agents.map((a) => a.id === agent.id ? { ...a, status: s, endedAt: s === "done" || s === "failed" ? new Date() : undefined } : a))}
                          className={cn("m-chip", agent.status === s && "active")}
                        >
                          <SI className="w-3 h-3" />
                          {c.label}
                        </button>
                      );
                    })}
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
