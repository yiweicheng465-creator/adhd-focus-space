/* ============================================================
   ADHD FOCUS SPACE — Task Manager v3.0 (Morandi)
   Priority: Urgent=coral, Focus=sage, Normal=slumber
   Context: Work=slate-indigo, Personal=dusty-rose
   ============================================================ */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Flame, Plus, Star, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  ContextSwitcher, ContextBadge, CONTEXT_CONFIG,
  type ItemContext, type ActiveContext,
} from "./ContextSwitcher";

export type TaskPriority = "focus" | "urgent" | "normal";

export interface Task {
  id: string;
  text: string;
  priority: TaskPriority;
  context: ItemContext;
  done: boolean;
  createdAt: Date;
}

/* Morandi priority palette */
const PRIORITY_CONFIG: Record<TaskPriority, {
  label: string; icon: React.ElementType;
  color: string; bg: string; border: string;
}> = {
  urgent: {
    label: "Urgent", icon: Flame,
    color:  "oklch(0.55 0.09 35)",
    bg:     "oklch(0.55 0.09 35 / 0.08)",
    border: "oklch(0.55 0.09 35 / 0.28)",
  },
  focus: {
    label: "Focus", icon: Zap,
    color:  "oklch(0.52 0.07 145)",
    bg:     "oklch(0.52 0.07 145 / 0.08)",
    border: "oklch(0.52 0.07 145 / 0.28)",
  },
  normal: {
    label: "Normal", icon: Star,
    color:  "oklch(0.55 0.018 70)",
    bg:     "oklch(0.72 0.018 75 / 0.15)",
    border: "oklch(0.72 0.018 75 / 0.40)",
  },
};

const M = {
  ink:    "oklch(0.28 0.018 65)",
  muted:  "oklch(0.55 0.018 70)",
  border: "oklch(0.88 0.014 75)",
  card:   "oklch(0.985 0.007 80)",
  bg:     "oklch(0.972 0.010 78)",
  coral:  "oklch(0.55 0.09 35)",
};

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.65rem",
  fontWeight: 500,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: M.muted,
};

interface TaskManagerProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  defaultContext?: ActiveContext;
}

export function TaskManager({ tasks, onTasksChange, defaultContext = "all" }: TaskManagerProps) {
  const [newTaskText,     setNewTaskText]     = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("focus");
  const [newTaskContext,  setNewTaskContext]  = useState<ItemContext>("work");
  const [completingId,    setCompletingId]    = useState<string | null>(null);
  const [activeContext,   setActiveContext]   = useState<ActiveContext>(defaultContext);
  const [filter,          setFilter]          = useState<"all" | "active" | "done">("active");

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const task: Task = {
      id: nanoid(), text: newTaskText.trim(),
      priority: newTaskPriority, context: newTaskContext,
      done: false, createdAt: new Date(),
    };
    onTasksChange([task, ...tasks]);
    setNewTaskText("");
    toast.success("Task added.", { duration: 2000 });
  };

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (!task.done) {
      setCompletingId(id);
      setTimeout(() => {
        onTasksChange(tasks.map((t) => t.id === id ? { ...t, done: true } : t));
        setCompletingId(null);
        toast.success("Task complete. Well done.", { duration: 3000 });
      }, 400);
    } else {
      onTasksChange(tasks.map((t) => t.id === id ? { ...t, done: false } : t));
    }
  };

  const deleteTask = (id: string) => onTasksChange(tasks.filter((t) => t.id !== id));

  const counts = {
    all:      tasks.filter((t) => !t.done).length,
    work:     tasks.filter((t) => !t.done && t.context === "work").length,
    personal: tasks.filter((t) => !t.done && t.context === "personal").length,
  };

  const contextFiltered = tasks.filter((t) => activeContext === "all" ? true : t.context === activeContext);
  const sorted = [...contextFiltered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const order: TaskPriority[] = ["urgent", "focus", "normal"];
    return order.indexOf(a.priority) - order.indexOf(b.priority);
  });
  const filtered = sorted.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done")   return t.done;
    return true;
  });

  const activeCount = contextFiltered.filter((t) => !t.done).length;
  const doneCount   = contextFiltered.filter((t) => t.done).length;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Context switcher */}
      <ContextSwitcher active={activeContext} onChange={setActiveContext} counts={counts} />

      {/* Add task */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="What needs to get done?"
            className="flex-1"
            style={{ background: M.card, border: `1px solid ${M.border}`, fontFamily: "'DM Sans', sans-serif" }}
          />
          <button
            onClick={addTask}
            className="m-btn-primary shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {/* Priority + context row */}
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => {
            const { label, icon: Icon, color, bg, border } = PRIORITY_CONFIG[p];
            const isActive = newTaskPriority === p;
            return (
              <button
                key={p}
                onClick={() => setNewTaskPriority(p)}
                className="flex items-center gap-1.5 px-3 py-1 transition-all"
                style={{
                  background:  isActive ? bg : "transparent",
                  color:       isActive ? color : M.muted,
                  border:      `1px solid ${isActive ? border : M.border}`,
                  fontFamily:  "'DM Sans', sans-serif",
                  fontSize:    "0.62rem",
                  fontWeight:  isActive ? 600 : 400,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  borderRadius: 0,
                }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}

          <div className="w-px h-4" style={{ background: M.border }} />

          {(["work", "personal"] as ItemContext[]).map((ctx) => {
            const cfg  = CONTEXT_CONFIG[ctx];
            const Icon = cfg.icon;
            const isActive = newTaskContext === ctx;
            return (
              <button
                key={ctx}
                onClick={() => setNewTaskContext(ctx)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all"
                style={{
                  background:  isActive ? cfg.bg : "transparent",
                  color:       isActive ? cfg.color : M.muted,
                  border:      `1px solid ${isActive ? cfg.border : M.border}`,
                  fontFamily:  "'DM Sans', sans-serif",
                  outline:     isActive ? `2px solid ${cfg.color}25` : undefined,
                  outlineOffset: "2px",
                }}
              >
                <Icon className="w-3 h-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 text-xs" style={{ borderBottom: `1px solid ${M.border}` }}>
        {[
          { id: "active", label: `Active (${activeCount})` },
          { id: "done",   label: `Done (${doneCount})` },
          { id: "all",    label: "All" },
        ].map(({ id, label }) => {
          const isAct = filter === id;
          return (
            <button
              key={id}
              onClick={() => setFilter(id as typeof filter)}
              className="px-4 py-2 transition-all"
              style={{
                color:        isAct ? M.coral : M.muted,
                borderBottom: isAct ? `2px solid ${M.coral}` : "2px solid transparent",
                fontFamily:   "'DM Sans', sans-serif",
                fontWeight:   isAct ? 600 : 400,
                fontSize:     "0.68rem",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="w-10 h-10 mb-3" style={{ color: `${M.muted}50` }} />
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
              {filter === "active" ? "No active tasks — add one above!" : "Nothing here yet."}
            </p>
          </div>
        )}

        {filtered.map((task) => {
          const pcfg        = PRIORITY_CONFIG[task.priority];
          const PIcon       = pcfg.icon;
          const isCompleting = completingId === task.id;

          return (
            <div
              key={task.id}
              className={cn("group flex items-start gap-3 p-3 transition-all duration-300")}
              style={{
                background:  task.done ? "oklch(0.93 0.012 78 / 0.5)" : M.card,
                border:      `1px solid ${task.done ? M.border : M.border}`,
                opacity:     isCompleting ? 0.5 : task.done ? 0.65 : 1,
                transform:   isCompleting ? "scale(0.97)" : "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (!task.done) (e.currentTarget as HTMLDivElement).style.borderColor = `${M.coral}40`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = M.border;
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTask(task.id)}
                className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
              >
                {task.done
                  ? <CheckCircle2 className="w-5 h-5" style={{ color: pcfg.color }} />
                  : <Circle      className="w-5 h-5" style={{ color: M.muted }} />
                }
              </button>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn("text-sm leading-snug", task.done && "line-through")}
                  style={{ color: task.done ? M.muted : M.ink, fontFamily: "'DM Sans', sans-serif" }}
                >
                  {task.text}
                </p>
              </div>

              {/* Context badge */}
              <ContextBadge context={task.context} />

              {/* Priority badge */}
              <span
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 font-medium shrink-0"
                style={{ background: pcfg.bg, color: pcfg.color, border: `1px solid ${pcfg.border}`, fontFamily: "'DM Sans', sans-serif" }}
              >
                <PIcon className="w-2.5 h-2.5" />
                {pcfg.label}
              </span>

              {/* Delete */}
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: M.muted }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
