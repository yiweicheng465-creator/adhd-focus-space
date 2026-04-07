/* ============================================================
   ADHD FOCUS SPACE — Task Manager
   Design: Priority chips (teal=focus, coral=urgent, gold=done)
   Features: Add tasks, set priority, complete with animation, brain dump
   ============================================================ */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Plus, Trash2, Flame, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";

export type TaskPriority = "focus" | "urgent" | "normal";

export interface Task {
  id: string;
  text: string;
  priority: TaskPriority;
  done: boolean;
  createdAt: Date;
}

const PRIORITY_CONFIG: Record<TaskPriority, {
  label: string;
  icon: React.ElementType;
  chipClass: string;
  color: string;
}> = {
  urgent: {
    label: "Urgent",
    icon: Flame,
    chipClass: "chip-urgent",
    color: "oklch(0.65 0.22 15)",
  },
  focus: {
    label: "Focus",
    icon: Zap,
    chipClass: "chip-focus",
    color: "oklch(0.65 0.14 185)",
  },
  normal: {
    label: "Normal",
    icon: Star,
    chipClass: "chip-done",
    color: "oklch(0.75 0.15 75)",
  },
};

interface TaskManagerProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export function TaskManager({ tasks, onTasksChange }: TaskManagerProps) {
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("focus");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "done">("active");

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const task: Task = {
      id: nanoid(),
      text: newTaskText.trim(),
      priority: newTaskPriority,
      done: false,
      createdAt: new Date(),
    };
    onTasksChange([task, ...tasks]);
    setNewTaskText("");
    toast.success("Task added!", { duration: 2000 });
  };

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    if (!task.done) {
      setCompletingId(id);
      setTimeout(() => {
        onTasksChange(tasks.map((t) => t.id === id ? { ...t, done: true } : t));
        setCompletingId(null);
        toast.success("Task complete! Great work! 🌟", { duration: 3000 });
      }, 400);
    } else {
      onTasksChange(tasks.map((t) => t.id === id ? { ...t, done: false } : t));
    }
  };

  const deleteTask = (id: string) => {
    onTasksChange(tasks.filter((t) => t.id !== id));
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const order: TaskPriority[] = ["urgent", "focus", "normal"];
    return order.indexOf(a.priority) - order.indexOf(b.priority);
  });

  const filteredTasks = sortedTasks.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  const activeCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Add task input */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="What needs to get done?"
            className="flex-1 bg-white border-border focus-visible:ring-[oklch(0.65_0.14_185)]"
          />
          <Button
            onClick={addTask}
            className="shrink-0"
            style={{ background: "oklch(0.65 0.14 185)" }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Priority selector */}
        <div className="flex gap-2">
          {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => {
            const { label, icon: Icon, chipClass } = PRIORITY_CONFIG[p];
            return (
              <button
                key={p}
                onClick={() => setNewTaskPriority(p)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
                  chipClass,
                  newTaskPriority === p
                    ? "ring-2 ring-offset-1 scale-105"
                    : "opacity-60 hover:opacity-100"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 text-sm border-b border-border pb-2">
        {[
          { id: "active", label: `Active (${activeCount})` },
          { id: "done", label: `Done (${doneCount})` },
          { id: "all", label: "All" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id as typeof filter)}
            className={cn(
              "px-3 py-1 rounded-md transition-colors",
              filter === id
                ? "bg-[oklch(0.65_0.14_185_/_0.1)] text-[oklch(0.55_0.14_185)] font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {filter === "active" ? "No active tasks — add one above!" : "Nothing here yet."}
            </p>
          </div>
        )}

        {filteredTasks.map((task) => {
          const { icon: Icon, chipClass, color } = PRIORITY_CONFIG[task.priority];
          const isCompleting = completingId === task.id;

          return (
            <div
              key={task.id}
              className={cn(
                "group flex items-start gap-3 p-3 rounded-xl border transition-all duration-300",
                task.done
                  ? "bg-muted/40 border-border opacity-60"
                  : "bg-white border-border hover:border-[oklch(0.65_0.14_185_/_0.4)] hover:shadow-sm",
                isCompleting && "scale-95 opacity-50"
              )}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTask(task.id)}
                className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
              >
                {task.done ? (
                  <CheckCircle2 className="w-5 h-5" style={{ color }} />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground hover:text-[oklch(0.65_0.14_185)]" />
                )}
              </button>

              {/* Task content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm leading-snug",
                  task.done && "line-through text-muted-foreground"
                )}>
                  {task.text}
                </p>
              </div>

              {/* Priority badge */}
              <Badge className={cn("text-xs shrink-0", chipClass)}>
                <Icon className="w-3 h-3 mr-1" />
                {PRIORITY_CONFIG[task.priority].label}
              </Badge>

              {/* Delete */}
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
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
