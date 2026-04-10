/* ============================================================
   ADHD FOCUS SPACE — Monthly Progress Page
   Design: Morandi palette, calendar grid, daily activity rings
   Data sources: adhd-wins, adhd-tasks, adhd-daily-logs
   Each day shows: wrap-up done, brain dump entries, wins count, mood
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Brain, CheckCircle2, Flame } from "lucide-react";
import type { Win } from "./DailyWins";
import type { Task } from "./TaskManager";
/* ── Types ── */
export interface DailyLog {
  dateKey: string;       // "Mon Apr 07 2026"
  wrapUpDone: boolean;
  dumpCount: number;     // brain dump entries that day
  winsCount: number;
  tasksCompleted: number;
  mood: number | null;   // 1-5
  score: number;         // 0-100
  focusSessions?: number; // individual 25-min sessions completed
  blocksCompleted?: number; // full 4-session blocks completed
}

const MOOD_COLORS = ["#C0BCCC","#C8C0D8","#B09878","#90C8A8","#F0A878"];
const MOOD_LABELS = ["Drained","Low","Okay","Good","Glowing"];

const M = {
  ink:     "oklch(0.28 0.018 65)",
  muted:   "oklch(0.55 0.018 70)",
  border:  "oklch(0.88 0.014 75)",
  card:    "oklch(0.985 0.007 80)",
  coral:   "oklch(0.55 0.09 35)",
  coralBg: "oklch(0.55 0.09 35 / 0.08)",
  sage:    "oklch(0.50 0.07 145)",
  sageBg:  "oklch(0.50 0.07 145 / 0.08)",
  gold:    "oklch(0.58 0.09 55)",
  goldBg:  "oklch(0.58 0.09 55 / 0.08)",
  pink:    "oklch(0.62 0.06 20)",
  pinkBg:  "oklch(0.62 0.06 20 / 0.08)",
};

/* ── Helpers ── */
function dateKey(d: Date) {
  return d.toDateString(); // "Mon Apr 07 2026"
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ── Streak calculator ── */
function calcStreak(logs: Record<string, DailyLog>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = dateKey(d);
    if (logs[k]?.wrapUpDone || logs[k]?.dumpCount > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

/* ── Day cell ── */
function DayCell({
  day, year, month, log, isToday, isSelected, onClick,
}: {
  day: number;
  year: number;
  month: number;
  log?: DailyLog;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasActivity = log && (log.wrapUpDone || log.dumpCount > 0 || log.winsCount > 0);
  const moodColor = log?.mood ? MOOD_COLORS[log.mood - 1] : null;

  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1",
        borderRadius: 10,
        border: isSelected
          ? `2px solid ${M.coral}`
          : isToday
          ? `1.5px solid ${M.gold}`
          : `1px solid ${hasActivity ? "oklch(0.82 0.02 75)" : M.border}`,
        background: isSelected
          ? M.coralBg
          : hasActivity
          ? log?.wrapUpDone
            ? "oklch(0.97 0.012 80)"
            : "oklch(0.98 0.008 80)"
          : "transparent",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "4px 2px 2px",
        gap: 1,
        transition: "all 0.15s",
        overflow: "hidden",
      }}
      title={hasActivity ? `${log?.winsCount ?? 0} wins · ${log?.dumpCount ?? 0} dumps · ${log?.tasksCompleted ?? 0} tasks` : "No activity"}
    >
      {/* Day number */}
      <span style={{
        fontSize: 11,
        fontWeight: isToday ? 700 : 400,
        color: isToday ? M.coral : hasActivity ? M.ink : M.muted,
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1,
      }}>
        {day}
      </span>

      {/* Activity dots */}
      {hasActivity && (
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
          {log?.wrapUpDone && (
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: M.sage }} title="Wrap-up done" />
          )}
          {(log?.dumpCount ?? 0) > 0 && (
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: M.coral }} title="Brain dump" />
          )}
          {(log?.winsCount ?? 0) > 0 && (
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: M.gold }} title="Wins" />
          )}
        </div>
      )}

      {/* Mood colour strip at bottom */}
      {moodColor && (
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 3,
          background: moodColor,
          borderRadius: "0 0 8px 8px",
          opacity: 0.7,
        }} />
      )}
    </button>
  );
}

/* ── Day detail panel ── */
function DayDetail({ log, dateStr, onClose }: { log?: DailyLog; dateStr: string; onClose: () => void }) {
  const hasAny = log && (log.wrapUpDone || log.dumpCount > 0 || log.winsCount > 0 || log.tasksCompleted > 0);
  return (
    <div style={{
      background: M.card,
      border: `1px solid ${M.border}`,
      borderRadius: 14,
      padding: "18px 20px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: M.ink }}>{dateStr}</span>
        <button onClick={onClose} style={{ fontSize: 16, color: M.muted, background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {!hasAny ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{ fontSize: 13, color: M.muted, fontStyle: "italic" }}>No activity recorded for this day.</p>
          <p style={{ fontSize: 11, color: M.muted, marginTop: 6 }}>Even a quick brain dump counts!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {log?.wrapUpDone && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={14} style={{ color: M.sage, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: M.ink }}>Daily wrap-up completed</span>
            </div>
          )}
          {(log?.dumpCount ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Brain size={14} style={{ color: M.coral, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: M.ink }}>{log!.dumpCount} brain dump {log!.dumpCount === 1 ? "entry" : "entries"}</span>
            </div>
          )}
          {(log?.winsCount ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={14} style={{ color: M.gold, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: M.ink }}>{log!.winsCount} {log!.winsCount === 1 ? "win" : "wins"} logged</span>
            </div>
          )}
          {(log?.tasksCompleted ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={14} style={{ color: M.pink, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: M.ink }}>{log!.tasksCompleted} {log!.tasksCompleted === 1 ? "task" : "tasks"} completed</span>
            </div>
          )}
          {(log?.focusSessions ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9" stroke="oklch(0.52 0.14 35)" strokeWidth="1.5" />
                <polyline points="12,7 12,12 15,15" stroke="oklch(0.52 0.14 35)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 12, color: M.ink }}>{log!.focusSessions} focus {log!.focusSessions === 1 ? "session" : "sessions"} completed</span>
            </div>
          )}
          {(log?.blocksCompleted ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 2c0 0-1 3-1 5 0 1.5 1 3 1 3s-3-1-3-4c0 0-3 3-3 7a6 6 0 0 0 12 0c0-5-4-8-6-11z" fill="oklch(0.52 0.14 35)" opacity="0.85" />
              </svg>
              <span style={{ fontSize: 12, color: M.ink }}>{log!.blocksCompleted} deep focus {log!.blocksCompleted === 1 ? "block" : "blocks"} complete 🔥</span>
            </div>
          )}
          {log?.mood && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: MOOD_COLORS[log.mood - 1], flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: M.ink }}>Mood: {MOOD_LABELS[log.mood - 1]}</span>
            </div>
          )}
          {log?.score !== undefined && log.score > 0 && (
            <div style={{ marginTop: 4, paddingTop: 8, borderTop: `1px solid ${M.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: M.muted, textTransform: "uppercase", letterSpacing: 1 }}>Day score</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: M.ink }}>{log.score}/100</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: M.border, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${log.score}%`, background: M.coral, borderRadius: 2, transition: "width 0.4s" }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
interface MonthlyProgressProps {
  wins: Win[];
  tasks: Task[];
  blockHistory?: Record<string, number>;
  blockStreak?: number;
}

export function MonthlyProgress({ wins, tasks, blockHistory = {}, blockStreak = 0 }: MonthlyProgressProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});

  /* Load persisted logs + re-read on storage changes (e.g. focus session recorded) */
  const loadLogs = useCallback(() => {
    try {
      const raw = localStorage.getItem("adhd-daily-logs");
      if (raw) setLogs(prev => {
        const next = JSON.parse(raw) as Record<string, DailyLog>;
        // Merge: keep any in-memory wins/tasks counts that are more up-to-date
        return next;
      });
    } catch {}
  }, []);

  useEffect(() => {
    loadLogs();
    // Listen for changes from other parts of the app (same tab via custom event)
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === "adhd-daily-logs") loadLogs();
    };
    window.addEventListener("adhd-storage-update", handler);
    return () => window.removeEventListener("adhd-storage-update", handler);
  }, [loadLogs]);

  /* Derive today's log from live data and merge */
  useEffect(() => {
    const todayKey = dateKey(today);
    const todayWins = wins.filter(w => new Date(w.createdAt).toDateString() === todayKey);
    const todayDone = tasks.filter(t => t.done && new Date(t.createdAt).toDateString() === todayKey);

    setLogs(prev => {
      const existing = prev[todayKey] ?? { dateKey: todayKey, wrapUpDone: false, dumpCount: 0, winsCount: 0, tasksCompleted: 0, mood: null, score: 0 };
      const updated: DailyLog = {
        ...existing,
        winsCount: todayWins.length,
        tasksCompleted: todayDone.length,
        score: Math.min(100, todayWins.length * 10 + todayDone.length * 15 + (existing.wrapUpDone ? 20 : 0) + existing.dumpCount * 5 + (existing.focusSessions ?? 0) * 5 + (existing.blocksCompleted ?? 0) * 10),
      };
      if (JSON.stringify(existing) === JSON.stringify(updated)) return prev;
      const next = { ...prev, [todayKey]: updated };
      try { localStorage.setItem("adhd-daily-logs", JSON.stringify(next)); } catch {}
      return next;
    });
  }, [wins, tasks]);

  /* Calendar math */
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  /* Stats for this month */
  const monthStats = useMemo(() => {
    let activeDays = 0, wrapDays = 0, dumpDays = 0, totalWins = 0, totalTasks = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const k = dateKey(new Date(viewYear, viewMonth, d));
      const log = logs[k];
      if (!log) continue;
      if (log.wrapUpDone || log.dumpCount > 0 || log.winsCount > 0) activeDays++;
      if (log.wrapUpDone) wrapDays++;
      if (log.dumpCount > 0) dumpDays++;
      totalWins += log.winsCount;
      totalTasks += log.tasksCompleted;
    }
    return { activeDays, wrapDays, dumpDays, totalWins, totalTasks };
  }, [logs, viewYear, viewMonth, daysInMonth]);

  const streak = useMemo(() => calcStreak(logs), [logs]);

  const selectedDateStr = selectedDay
    ? new Date(viewYear, viewMonth, selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : null;
  const selectedLog = selectedDay
    ? logs[dateKey(new Date(viewYear, viewMonth, selectedDay))]
    : undefined;

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: M.ink, margin: 0 }}>
          Monthly Progress
        </h1>
        <p style={{ fontSize: 13, color: M.muted, marginTop: 4 }}>
          Every day you show up — wrap-up, brain dump, or just a win — it counts.
        </p>
      </div>

      {/* Streak + month stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 24 }}>
        {[
          { label: "Streak", value: streak, icon: <Flame size={14} />, color: M.coral },
          { label: "Active days", value: monthStats.activeDays, icon: <CheckCircle2 size={14} />, color: M.sage },
          { label: "Wrap-ups", value: monthStats.wrapDays, icon: <CheckCircle2 size={14} />, color: M.gold },
          { label: "Dumps", value: monthStats.dumpDays, icon: <Brain size={14} />, color: M.pink },
          { label: "Wins", value: monthStats.totalWins, icon: <Sparkles size={14} />, color: M.gold },
        ].map(s => (
          <div key={s.label} style={{
            background: M.card,
            border: `1px solid ${M.border}`,
            borderRadius: 10,
            padding: "10px 8px",
            textAlign: "center",
          }}>
            <div style={{ color: s.color, marginBottom: 2, display: "flex", justifyContent: "center" }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: M.ink, lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: M.muted, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Calendar navigation */}
      <div style={{
        background: M.card,
        border: `1px solid ${M.border}`,
        borderRadius: 14,
        padding: "16px",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: M.muted, padding: 4, borderRadius: 6 }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, color: M.ink }}>
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            style={{ background: "none", border: "none", cursor: isCurrentMonth ? "default" : "pointer", color: isCurrentMonth ? M.border : M.muted, padding: 4, borderRadius: 6 }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 9, color: M.muted, textTransform: "uppercase", letterSpacing: 0.8, padding: "2px 0" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {/* Empty cells for offset */}
          {Array.from({ length: firstDow }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const k = dateKey(new Date(viewYear, viewMonth, day));
            const log = logs[k];
            const isToday = isCurrentMonth && day === today.getDate();
            const isSel = selectedDay === day;
            return (
              <DayCell
                key={day}
                day={day}
                year={viewYear}
                month={viewMonth}
                log={log}
                isToday={isToday}
                isSelected={isSel}
                onClick={() => setSelectedDay(isSel ? null : day)}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { color: M.sage, label: "Wrap-up" },
            { color: M.coral, label: "Brain dump" },
            { color: M.gold, label: "Wins" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
              <span style={{ fontSize: 10, color: M.muted }}>{l.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 20, height: 3, borderRadius: 2, background: "linear-gradient(to right, #C0BCCC, #F0A878)" }} />
            <span style={{ fontSize: 10, color: M.muted }}>Mood bar</span>
          </div>
        </div>
      </div>

      {/* Day detail */}
      {selectedDay && selectedDateStr && (
        <DayDetail
          log={selectedLog}
          dateStr={selectedDateStr}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Motivational note */}
      <div style={{ marginTop: 20, padding: "14px 16px", background: M.coralBg, borderRadius: 10, border: `1px solid oklch(0.55 0.09 35 / 0.15)` }}>
        <p style={{ fontSize: 12, color: M.ink, margin: 0, lineHeight: 1.6 }}>
          <strong>Tip:</strong> Brain dumps count just as much as wrap-ups. Even on days with no plan, dumping your thoughts fills the calendar and keeps your streak alive.
        </p>
      </div>
    </div>
  );
}

/* ── Exported helper to record a wrap-up completion ── */
export function recordWrapUp(mood?: number | null, score?: number) {
  const today = new Date().toDateString();
  try {
    const raw = localStorage.getItem("adhd-daily-logs");
    const logs: Record<string, DailyLog> = raw ? JSON.parse(raw) : {};
    const existing = logs[today] ?? { dateKey: today, wrapUpDone: false, dumpCount: 0, winsCount: 0, tasksCompleted: 0, mood: null, score: 0 };
    logs[today] = { ...existing, wrapUpDone: true, mood: mood ?? existing.mood, score: score ?? existing.score };
    localStorage.setItem("adhd-daily-logs", JSON.stringify(logs));
  } catch {}
}

/* ── Exported helper to record a brain dump entry ── */
export function recordDumpEntry() {
  const today = new Date().toDateString();
  try {
    const raw = localStorage.getItem("adhd-daily-logs");
    const logs: Record<string, DailyLog> = raw ? JSON.parse(raw) : {};
    const existing = logs[today] ?? { dateKey: today, wrapUpDone: false, dumpCount: 0, winsCount: 0, tasksCompleted: 0, mood: null, score: 0 };
    logs[today] = { ...existing, dumpCount: existing.dumpCount + 1 };
    localStorage.setItem("adhd-daily-logs", JSON.stringify(logs));
  } catch {}
}

/* ── Exported helper to record a focus session completion ── */
export function recordFocusSession() {
  const today = new Date().toDateString();
  try {
    const raw = localStorage.getItem("adhd-daily-logs");
    const logs: Record<string, DailyLog> = raw ? JSON.parse(raw) : {};
    const existing = logs[today] ?? { dateKey: today, wrapUpDone: false, dumpCount: 0, winsCount: 0, tasksCompleted: 0, mood: null, score: 0 };
    const sessions = (existing.focusSessions ?? 0) + 1;
    const score = Math.min(100, existing.score + 5);
    logs[today] = { ...existing, focusSessions: sessions, score };
    localStorage.setItem("adhd-daily-logs", JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent("adhd-storage-update", { detail: "adhd-daily-logs" }));
  } catch {}
}

/* ── Exported helper to record a full 4-session block completion ── */
export function recordBlockComplete() {
  const today = new Date().toDateString();
  try {
    const raw = localStorage.getItem("adhd-daily-logs");
    const logs: Record<string, DailyLog> = raw ? JSON.parse(raw) : {};
    const existing = logs[today] ?? { dateKey: today, wrapUpDone: false, dumpCount: 0, winsCount: 0, tasksCompleted: 0, mood: null, score: 0 };
    const blocks = (existing.blocksCompleted ?? 0) + 1;
    const score = Math.min(100, existing.score + 10);
    logs[today] = { ...existing, blocksCompleted: blocks, score };
    localStorage.setItem("adhd-daily-logs", JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent("adhd-storage-update", { detail: "adhd-daily-logs" }));
  } catch {}
}
