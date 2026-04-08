/* ============================================================
   ADHD FOCUS SPACE — Eisenhower Matrix (四象限)
   Design: Morandi palette, pixel-art accents, hand-crafted feel
   Quadrant → Priority mapping:
     Q1 (urgent+important)     → "urgent"
     Q2 (not urgent+important) → "focus"
     Q3 (urgent+not important) → "normal"
     Q4 (not urgent+not important) → "normal"
   ============================================================ */

import { useState, useRef } from "react";
import type { Task, TaskPriority } from "./TaskManager";

// ── Quadrant definitions ──────────────────────────────────────────────────────
export type QuadrantId = "q1" | "q2" | "q3" | "q4";

interface QuadrantDef {
  id: QuadrantId;
  label: string;
  sub: string;
  action: string;
  priority: TaskPriority;
  urgent: boolean;
  important: boolean;
  color: string;
  bg: string;
  border: string;
  headerBg: string;
  numeral: string;
}

const QUADRANTS: QuadrantDef[] = [
  {
    id: "q1",
    label: "立刻做",
    sub: "紧急 · 重要",
    action: "DO NOW",
    priority: "urgent",
    urgent: true,
    important: true,
    color: "oklch(0.52 0.09 35)",
    bg: "oklch(0.98 0.007 35)",
    border: "oklch(0.55 0.09 35 / 0.22)",
    headerBg: "oklch(0.55 0.09 35 / 0.10)",
    numeral: "I",
  },
  {
    id: "q2",
    label: "计划做",
    sub: "不紧急 · 重要",
    action: "SCHEDULE",
    priority: "focus",
    urgent: false,
    important: true,
    color: "oklch(0.48 0.07 145)",
    bg: "oklch(0.98 0.007 145)",
    border: "oklch(0.52 0.07 145 / 0.22)",
    headerBg: "oklch(0.52 0.07 145 / 0.10)",
    numeral: "II",
  },
  {
    id: "q3",
    label: "委托别人",
    sub: "紧急 · 不重要",
    action: "DELEGATE",
    priority: "normal",
    urgent: true,
    important: false,
    color: "oklch(0.55 0.06 55)",
    bg: "oklch(0.98 0.007 70)",
    border: "oklch(0.60 0.05 65 / 0.22)",
    headerBg: "oklch(0.60 0.05 65 / 0.10)",
    numeral: "III",
  },
  {
    id: "q4",
    label: "减少 / 删除",
    sub: "不紧急 · 不重要",
    action: "ELIMINATE",
    priority: "normal",
    urgent: false,
    important: false,
    color: "oklch(0.55 0.018 70)",
    bg: "oklch(0.975 0.005 80)",
    border: "oklch(0.72 0.018 75 / 0.22)",
    headerBg: "oklch(0.72 0.018 75 / 0.12)",
    numeral: "IV",
  },
];

// Map priority → default quadrant when a task is first placed
export function priorityToQuadrant(p: TaskPriority): QuadrantId {
  if (p === "urgent") return "q1";
  if (p === "focus")  return "q2";
  return "q4";
}

// Map quadrant → priority
function quadrantToPriority(q: QuadrantId): TaskPriority {
  const def = QUADRANTS.find((d) => d.id === q)!;
  return def.priority;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface EisenhowerMatrixProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  /** quadrantMap: taskId → quadrantId, persisted by parent */
  quadrantMap: Record<string, QuadrantId>;
  onQuadrantMapChange: (map: Record<string, QuadrantId>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function EisenhowerMatrix({
  tasks,
  onTasksChange,
  quadrantMap,
  onQuadrantMapChange,
}: EisenhowerMatrixProps) {
  const [dragOverQ, setDragOverQ] = useState<QuadrantId | null>(null);
  const draggingId = useRef<string | null>(null);

  const activeTasks = tasks.filter((t) => !t.done);

  // Tasks not yet placed go to their default quadrant
  function getTaskQuadrant(task: Task): QuadrantId {
    return quadrantMap[task.id] ?? priorityToQuadrant(task.priority);
  }

  function handleDragStart(e: React.DragEvent, taskId: string) {
    draggingId.current = taskId;
    e.dataTransfer.effectAllowed = "move";
    // ghost image styling
    (e.currentTarget as HTMLElement).style.opacity = "0.45";
  }

  function handleDragEnd(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    draggingId.current = null;
    setDragOverQ(null);
  }

  function handleDragOver(e: React.DragEvent, qId: QuadrantId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverQ(qId);
  }

  function handleDrop(e: React.DragEvent, qId: QuadrantId) {
    e.preventDefault();
    const id = draggingId.current;
    if (!id) return;

    // Update quadrant map
    const newMap = { ...quadrantMap, [id]: qId };
    onQuadrantMapChange(newMap);

    // Update task priority to match quadrant
    const newPriority = quadrantToPriority(qId);
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, priority: newPriority } : t
    );
    onTasksChange(updated);
    setDragOverQ(null);
  }

  return (
    <div style={{ marginTop: 32 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 3,
          height: 18,
          background: "oklch(0.55 0.09 35)",
          borderRadius: 2,
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 15,
          fontWeight: 700,
          color: "oklch(0.28 0.018 65)",
          fontStyle: "italic",
        }}>
          四象限优先级矩阵
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          color: "oklch(0.60 0.018 70)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginLeft: 2,
        }}>
          拖动任务卡片到对应象限
        </span>
      </div>

      {/* Axis labels */}
      <div style={{ position: "relative", paddingLeft: 28, paddingBottom: 22 }}>

        {/* Y-axis label: 重要程度 */}
        <div style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          transformOrigin: "center center",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 9,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "oklch(0.60 0.018 70)",
          whiteSpace: "nowrap",
        }}>
          重要程度 ↑
        </div>

        {/* Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 6,
          minHeight: 380,
        }}>
          {QUADRANTS.map((q) => {
            const qTasks = activeTasks.filter((t) => getTaskQuadrant(t) === q.id);
            const isOver = dragOverQ === q.id;

            return (
              <div
                key={q.id}
                onDragOver={(e) => handleDragOver(e, q.id)}
                onDragLeave={() => setDragOverQ(null)}
                onDrop={(e) => handleDrop(e, q.id)}
                style={{
                  background: isOver ? q.headerBg : q.bg,
                  border: `1.5px ${isOver ? "dashed" : "solid"} ${isOver ? q.color : q.border}`,
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  transition: "background 0.15s, border-color 0.15s",
                  minHeight: 185,
                }}
              >
                {/* Quadrant header */}
                <div style={{
                  padding: "8px 12px 6px",
                  background: q.headerBg,
                  borderBottom: `1px solid ${q.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexShrink: 0,
                }}>
                  {/* Roman numeral badge */}
                  <span style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: q.color,
                    opacity: 0.7,
                    minWidth: 18,
                  }}>
                    {q.numeral}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      color: q.color,
                      letterSpacing: "0.02em",
                    }}>
                      {q.label}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 9,
                      color: q.color,
                      opacity: 0.65,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginTop: 1,
                    }}>
                      {q.sub}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: q.color,
                    opacity: 0.5,
                    background: `${q.color}18`,
                    padding: "2px 6px",
                    borderRadius: 3,
                  }}>
                    {q.action}
                  </span>
                </div>

                {/* Task cards */}
                <div style={{
                  flex: 1,
                  padding: "8px 8px 6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  overflowY: "auto",
                }}>
                  {qTasks.length === 0 && (
                    <div style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 10,
                      color: "oklch(0.72 0.014 75)",
                      letterSpacing: "0.04em",
                      fontStyle: "italic",
                      opacity: isOver ? 0.9 : 0.5,
                      padding: "12px 0",
                    }}>
                      {isOver ? "放到这里 ↓" : "拖入任务"}
                    </div>
                  )}
                  {qTasks.map((task) => (
                    <TaskChip
                      key={task.id}
                      task={task}
                      quadrantColor={q.color}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis label: 紧急程度 */}
        <div style={{
          textAlign: "center",
          marginTop: 8,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 9,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "oklch(0.60 0.018 70)",
        }}>
          紧急程度 →
        </div>
      </div>
    </div>
  );
}

// ── Task chip inside quadrant ─────────────────────────────────────────────────
function TaskChip({
  task,
  quadrantColor,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  quadrantColor: string;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      title={task.text}
      style={{
        background: "oklch(1 0 0 / 0.85)",
        border: `1px solid ${quadrantColor}30`,
        borderLeft: `3px solid ${quadrantColor}`,
        borderRadius: 5,
        padding: "5px 8px",
        cursor: "grab",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "box-shadow 0.12s",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 8px ${quadrantColor}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Drag handle dots */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 2,
        flexShrink: 0,
        opacity: 0.3,
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 2.5,
            height: 2.5,
            borderRadius: "50%",
            background: quadrantColor,
          }} />
        ))}
      </div>
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        color: "oklch(0.32 0.018 65)",
        lineHeight: 1.35,
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {task.text}
      </span>
      {/* Context dot */}
      <div style={{
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: quadrantColor,
        opacity: 0.45,
        flexShrink: 0,
      }} />
    </div>
  );
}
