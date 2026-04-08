/* ============================================================
   ADHD FOCUS SPACE — Focus Timer v2.0
   Design: Warm Editorial — terracotta accent, thin borders
   Features:
   - Fully customizable durations (click the label to edit)
   - Preset buttons: 15 / 25 / 45 / 60 min for focus
   - Modes: Focus, Short Break, Long Break
   - Circular SVG progress ring
   - Session counter (dots)
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Pause, Pencil, Play, RotateCcw, SkipForward, X } from "lucide-react";
import { toast } from "sonner";

type TimerMode = "focus" | "short" | "long";

// Terracotta palette aligned with editorial design
const MODE_COLORS: Record<TimerMode, { color: string; label: string }> = {
  focus: { color: "oklch(0.52 0.14 35)",  label: "Focus"       },
  short: { color: "oklch(0.55 0.12 140)", label: "Short Break" },
  long:  { color: "oklch(0.52 0.06 300)", label: "Long Break"  },
};

// Default durations in minutes
const DEFAULT_DURATIONS: Record<TimerMode, number> = {
  focus: 25,
  short: 5,
  long:  15,
};

// Quick preset options (minutes) per mode
const PRESETS: Record<TimerMode, number[]> = {
  focus: [15, 25, 45, 60],
  short: [3, 5, 10],
  long:  [10, 15, 20, 30],
};

const RADIUS       = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface FocusTimerProps {
  onSessionComplete?: () => void;
}

export function FocusTimer({ onSessionComplete }: FocusTimerProps) {
  // Custom durations (in minutes) — user-editable
  const [durations, setDurations] = useState<Record<TimerMode, number>>(DEFAULT_DURATIONS);

  const [mode, setMode]           = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft]   = useState(DEFAULT_DURATIONS.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions]   = useState(0);

  // Editing state
  const [editing, setEditing]     = useState<TimerMode | null>(null);
  const [editVal, setEditVal]     = useState("");
  const editRef                   = useRef<HTMLInputElement>(null);
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = durations[mode] * 60;
  const progress     = timeLeft / totalSeconds;
  const dashOffset   = CIRCUMFERENCE * (1 - progress);
  const modeColor    = MODE_COLORS[mode].color;

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === "focus") {
              setSessions((s) => s + 1);
              toast.success("Focus session complete! 🎉 Take a break.", { duration: 5000 });
              onSessionComplete?.();
            } else {
              toast.info("Break over! Ready to focus?", { duration: 3000 });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, onSessionComplete]);

  // Focus edit input when editing opens
  useEffect(() => {
    if (editing) setTimeout(() => editRef.current?.focus(), 50);
  }, [editing]);

  const switchMode = (m: TimerMode) => {
    setIsRunning(false);
    setMode(m);
    setTimeLeft(durations[m] * 60);
  };

  const applyDuration = (m: TimerMode, mins: number) => {
    const clamped = Math.max(1, Math.min(180, mins));
    setDurations((d) => ({ ...d, [m]: clamped }));
    if (m === mode) {
      setIsRunning(false);
      setTimeLeft(clamped * 60);
    }
  };

  const commitEdit = () => {
    if (!editing) return;
    const parsed = parseInt(editVal, 10);
    if (!isNaN(parsed)) applyDuration(editing, parsed);
    setEditing(null);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode] * 60);
  };

  const handleSkip = () => {
    setIsRunning(false);
    switchMode(mode === "focus" ? "short" : "focus");
  };

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const ss = (timeLeft % 60).toString().padStart(2, "0");

  const BORDER = "oklch(0.87 0.014 75)";
  const INK    = "oklch(0.18 0.01 60)";
  const MUTED  = "oklch(0.55 0.015 70)";

  return (
    <div className="flex flex-col items-center gap-6">

      {/* ── Mode tabs ── */}
      <div
        className="flex w-full"
        style={{ border: `1px solid ${BORDER}` }}
      >
        {(Object.keys(MODE_COLORS) as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className="flex-1 py-2 text-xs font-medium transition-all"
            style={{
              background: mode === m ? MODE_COLORS[m].color : "transparent",
              color: mode === m ? "white" : MUTED,
              borderRight: m !== "long" ? `1px solid ${BORDER}` : undefined,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.06em",
            }}
          >
            {MODE_COLORS[m].label}
          </button>
        ))}
      </div>

      {/* ── Duration customizer ── */}
      <div className="w-full">
        <p
          className="text-[10px] tracking-widest uppercase mb-2 text-center"
          style={{ color: MUTED, fontFamily: "'DM Sans', sans-serif" }}
        >
          Duration — click to edit
        </p>

        {/* Preset chips */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-3">
          {PRESETS[mode].map((mins) => (
            <button
              key={mins}
              onClick={() => applyDuration(mode, mins)}
              className="px-3 py-1 text-xs transition-all"
              style={{
                border: `1px solid ${durations[mode] === mins ? modeColor : BORDER}`,
                background: durations[mode] === mins ? `${modeColor}15` : "transparent",
                color: durations[mode] === mins ? modeColor : MUTED,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {mins} min
            </button>
          ))}

          {/* Custom edit button */}
          {editing === mode ? (
            <div className="flex items-center gap-1">
              <input
                ref={editRef}
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditing(null);
                }}
                className="w-14 px-2 py-1 text-xs text-center focus:outline-none"
                style={{
                  border: `1px solid ${modeColor}`,
                  color: INK,
                  background: "transparent",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                placeholder="min"
                type="number"
                min={1}
                max={180}
              />
              <button onClick={commitEdit} style={{ color: modeColor }}>
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditing(null)} style={{ color: MUTED }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditing(mode); setEditVal(String(durations[mode])); }}
              className="flex items-center gap-1 px-3 py-1 text-xs transition-all"
              style={{
                border: `1px solid ${BORDER}`,
                color: MUTED,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Pencil className="w-2.5 h-2.5" />
              Custom
            </button>
          )}
        </div>

        {/* Current duration display */}
        <p
          className="text-center text-xs"
          style={{ color: MUTED, fontFamily: "'DM Sans', sans-serif" }}
        >
          Set to <span style={{ color: modeColor, fontWeight: 600 }}>{durations[mode]} min</span>
          {durations[mode] !== DEFAULT_DURATIONS[mode] && (
            <button
              onClick={() => applyDuration(mode, DEFAULT_DURATIONS[mode])}
              className="ml-2 underline text-[10px] hover:opacity-70"
              style={{ color: MUTED }}
            >
              reset
            </button>
          )}
        </p>
      </div>

      {/* ── Circular timer ── */}
      <div className="relative flex items-center justify-center">
        {isRunning && (
          <div
            className="absolute rounded-full animate-ping"
            style={{
              width: 216,
              height: 216,
              border: `1px solid ${modeColor}`,
              opacity: 0.15,
              animationDuration: "2s",
            }}
          />
        )}

        <svg width={216} height={216} className="-rotate-90">
          {/* Track */}
          <circle
            cx={108} cy={108} r={RADIUS}
            fill="none"
            stroke="oklch(0.88 0.012 75)"
            strokeWidth={8}
          />
          {/* Progress */}
          <circle
            cx={108} cy={108} r={RADIUS}
            fill="none"
            stroke={modeColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>

        {/* Time display */}
        <div className="absolute flex flex-col items-center">
          <span
            className="text-5xl font-bold tabular-nums tracking-tight"
            style={{ fontFamily: "'DM Sans', sans-serif", color: modeColor }}
          >
            {mm}:{ss}
          </span>
          <span
            className="text-[10px] mt-1 tracking-widest uppercase"
            style={{ color: MUTED, fontFamily: "'DM Sans', sans-serif" }}
          >
            {MODE_COLORS[mode].label}
          </span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleReset}
          className="w-9 h-9 flex items-center justify-center transition-all hover:opacity-70"
          style={{ border: `1px solid ${BORDER}`, color: MUTED }}
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Play/Pause — main CTA */}
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="w-14 h-14 flex items-center justify-center transition-all hover:opacity-90 active:scale-95"
          style={{ background: modeColor, color: "white" }}
          title={isRunning ? "Pause" : "Start"}
        >
          {isRunning
            ? <Pause className="w-5 h-5" />
            : <Play  className="w-5 h-5 ml-0.5" />
          }
        </button>

        <button
          onClick={handleSkip}
          className="w-9 h-9 flex items-center justify-center transition-all hover:opacity-70"
          style={{ border: `1px solid ${BORDER}`, color: MUTED }}
          title="Skip to next"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Session dots ── */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 transition-all duration-300"
            style={{
              background: i < sessions % 4 ? modeColor : "oklch(0.88 0.012 75)",
              transform: i < sessions % 4 ? "scale(1.2)" : "scale(1)",
            }}
          />
        ))}
        <span
          className="text-xs ml-1"
          style={{ color: MUTED, fontFamily: "'DM Sans', sans-serif" }}
        >
          {sessions} session{sessions !== 1 ? "s" : ""} today
        </span>
      </div>
    </div>
  );
}
