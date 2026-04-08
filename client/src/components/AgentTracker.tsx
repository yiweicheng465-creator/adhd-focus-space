/* ============================================================
   ADHD FOCUS SPACE — AI Agent Tracker v3.0 (Morandi)
   Palette: coral primary, sage done, slumber paused, dusty rose failed
   No teal, no bright green, no vivid red
   ============================================================ */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Clock, Flame,
  Link2, Pause, Play, Plus, RefreshCw, Trash2, XCircle,
} from "lucide-react";
import { PixelAgents } from "@/components/PixelIcons";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";
import {
  ContextSwitcher, ContextBadge, getContextConfig,
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
  border:   "oklch(0.90 0.010 75)",
  card:     "oklch(0.992 0.005 80 / 0.85)",
  surface:  "oklch(0.985 0.007 78 / 0.60)",
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
  /** Shared category list from Home — all contexts across tasks/goals/agents */
  allCategories?: string[];
}

export function AgentTracker({ agents, onAgentsChange, tasks, defaultContext = "all", allCategories }: AgentTrackerProps) {
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

  // Unified categories: use shared list if provided, else derive from own agents
  const knownCategories = allCategories ?? Array.from(new Set(["work", "personal", ...agents.map((a) => a.context)]));

  const counts: Record<string, number> = { all: agents.length };
  knownCategories.forEach((ctx) => { counts[ctx] = agents.filter((a) => a.context === ctx).length; });

  const addAgent = () => {
    if (!name.trim()) {
      toast.error("Give the agent a name.");
      return;
    }
    const agent: Agent = {
      id: nanoid(), name: name.trim(), task: "",
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
    <div className="flex flex-col" style={{ gap: 24 }}>

      {/* Context switcher — dynamic categories */}
      <ContextSwitcher active={activeContext} onChange={setActiveContext} counts={counts} contexts={knownCategories} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 10 }}>
        {[
          { icon: PixelAgents,  label: "Running",     value: runningCount,       color: M.coral,   bg: M.coralBg,  border: M.coralBdr },
          { icon: CheckCircle2, label: "Done Today",  value: doneCount,          color: M.sage,    bg: M.sageBg,   border: M.sageBdr  },
          { icon: PixelAgents,  label: "Total Today", value: todayAgents.length, color: M.slumber, bg: M.slumBg,   border: M.slumBdr  },
          {
            icon: Flame,
            label: "Uncovered",
            value: uncoveredTasks.length,
            color:  uncoveredTasks.length > 0 ? M.rose    : M.sage,
            bg:     uncoveredTasks.length > 0 ? M.roseBg  : M.sageBg,
            border: uncoveredTasks.length > 0 ? M.roseBdr : M.sageBdr,
          },
        ].map(({ icon: Icon, label, value, color, bg, border }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 16px", backdropFilter: "blur(6px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              {Icon === PixelAgents
                ? <PixelAgents size={12} active={false} color={color} />
                : <Icon style={{ width: 12, height: 12, color }} />
              }
              <span style={{ ...LABEL, color: M.muted }}>{label}</span>
            </div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.65rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Coverage alert */}
      {uncoveredTasks.length > 0 && (
        <div style={{ padding: "14px 18px", borderRadius: 10, border: `1px solid ${M.roseBdr}`, background: M.roseBg }}>
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
        <div style={{ padding: "12px 18px", borderRadius: 10, border: `1px solid ${M.sageBdr}`, background: M.sageBg, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 className="w-4 h-4" style={{ color: M.sage }} />
          <p className="text-sm font-medium" style={{ color: M.sage, fontFamily: "'DM Sans', sans-serif" }}>
            All active tasks are covered. You're fully delegated!
          </p>
        </div>
      )}

      {/* Add agent form */}
      <div style={{ padding: "22px 22px 18px", borderRadius: 16, background: M.card, border: `1px solid ${M.border}`, backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ width: 3, height: 16, background: M.coral, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.92rem", fontWeight: 700, fontStyle: "italic", color: M.ink }}>Log a new agent</span>
        </div>

        <Input
          value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addAgent()}
          placeholder="Agent name (e.g. Manus, Claude)"
          style={{ background: "oklch(0.997 0.003 80)", border: `1px solid ${M.border}`, borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: M.ink, height: 42 }}
        />

        {/* Context picker — dynamic categories */}
        <div className="flex items-center gap-2 flex-wrap">
          <span style={LABEL}>Category:</span>
          {knownCategories.map((ctx) => {
            const cfg  = getContextConfig(ctx);
            const Icon = cfg.icon;
            return (
              <button
                key={ctx}
                onClick={() => setNewCtx(ctx)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: `1px solid ${newCtx === ctx ? cfg.border : M.border}`,
                  background: newCtx === ctx ? cfg.bg : "transparent",
                  color: newCtx === ctx ? cfg.color : M.muted,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: newCtx === ctx ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
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
              style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", padding: "8px 12px", borderRadius: 8, border: `1px solid ${M.border}`, background: "oklch(0.997 0.003 80)", color: linkedTaskId ? M.ink : M.muted, outline: "none" }}
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
            <div key={agent.id} style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${M.border}`, background: M.card, backdropFilter: "blur(6px)", transition: "box-shadow 0.15s" }}>
              {/* Status accent bar */}
              <div style={{ height: 3, background: cfg.color, opacity: 0.45 }} />
              {/* Main row */}
              <div className="flex items-start gap-3 cursor-pointer" style={{ padding: "15px 18px" }} onClick={() => setExpandedId(isExpanded ? null : agent.id)}>
                {/* Status icon */}
                <div
                  style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}
                >
                  <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", fontWeight: 700, color: M.ink }}>{agent.name}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.60rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase" as const, padding: "2px 8px", borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
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
                <div style={{ padding: "0 18px 18px", paddingTop: 16, borderTop: `1px solid ${M.border}` }} onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs font-medium mt-3 mb-1.5" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Notes / output summary
                  </p>
                  {noteEditing?.id === agent.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={noteEditing.value}
                        onChange={(e) => setNoteEditing({ id: agent.id, value: e.target.value })}
                        style={{ width: "100%", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", padding: "10px 12px", borderRadius: 8, border: `1px solid ${M.border}`, background: "oklch(0.997 0.003 80)", color: M.ink, resize: "vertical" as const, minHeight: 80, outline: "none" }}
                        placeholder="What did this agent produce? Any key outputs?"
                      />
                      <div className="flex gap-2">
                        <button onClick={saveNote} className="m-btn-primary">Save</button>
                        <button onClick={() => setNoteEditing(null)} className="m-btn-ghost">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setNoteEditing({ id: agent.id, value: agent.notes ?? "" })}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: agent.notes ? M.ink : M.muted, fontStyle: agent.notes ? "normal" : "italic", padding: "10px 12px", borderRadius: 8, border: `1px dashed ${M.border}`, background: "oklch(0.990 0.005 78 / 0.60)", cursor: "pointer", minHeight: 40 }}
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
