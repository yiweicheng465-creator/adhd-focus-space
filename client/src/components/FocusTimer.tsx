/**
 * FocusTimer — Instrument / Podcast-Player Aesthetic
 * Design: Large JetBrains Mono digits, barcode-style progress bar,
 * geometric SVG circle dial with tick marks, pill toggle controls.
 * Morandi palette only — no blue, no teal.
 * Reference: podcast player UI (00:32:00 style), instrument panel.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Check, Pause, Play, SkipForward, X, Settings } from "lucide-react";
import { toast } from "sonner";

type TimerMode = "focus" | "short" | "long";

const MODE_META: Record<TimerMode, { label: string; stroke: string; glow: string }> = {
  focus: { label: "FOCUS",       stroke: "#C4714A", glow: "rgba(196,113,74,0.12)"  },
  short: { label: "SHORT BREAK", stroke: "#7A8C6E", glow: "rgba(122,140,110,0.12)" },
  long:  { label: "LONG BREAK",  stroke: "#A8929E", glow: "rgba(168,146,158,0.12)" },
};

const DEFAULT_DURATIONS: Record<TimerMode, number> = { focus: 25, short: 5, long: 15 };
const PRESETS: Record<TimerMode, number[]> = {
  focus: [15, 25, 45, 60],
  short: [3, 5, 10],
  long:  [10, 15, 20, 30],
};

const R = 82;
const CX = 96;
const CY = 96;
const CIRC = 2 * Math.PI * R;

interface FocusTimerProps {
  onSessionComplete?: () => void;
}

export function FocusTimer({ onSessionComplete }: FocusTimerProps) {
  const [durations, setDurations] = useState<Record<TimerMode, number>>(DEFAULT_DURATIONS);
  const [mode, setMode]           = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft]   = useState(DEFAULT_DURATIONS.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions]   = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [editingMode, setEditingMode]   = useState<TimerMode | null>(null);
  const [editVal, setEditVal]           = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editRef     = useRef<HTMLInputElement>(null);

  const totalSec  = durations[mode] * 60;
  // progress counts UP (0→1) — used for barcode fill
  const progress  = totalSec > 0 ? 1 - timeLeft / totalSec : 0;
  // arcProgress counts DOWN (1→0) — used for the dial arc (countdown)
  const arcProgress = totalSec > 0 ? timeLeft / totalSec : 1;
  const dashOff   = CIRC * (1 - progress);
  const meta      = MODE_META[mode];

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    if (mode === "focus") {
      setSessions((s) => s + 1);
      toast.success("Session complete — take a breath.", { duration: 4000 });
      onSessionComplete?.();
    } else {
      toast.info("Break over. Ready to focus?", { duration: 3000 });
    }
  }, [mode, onSessionComplete]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { clearInterval(intervalRef.current!); handleComplete(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, handleComplete]);

  useEffect(() => {
    if (editingMode) setTimeout(() => editRef.current?.focus(), 40);
  }, [editingMode]);

  const switchMode = (m: TimerMode) => {
    setIsRunning(false);
    setMode(m);
    setTimeLeft(durations[m] * 60);
  };

  const applyDuration = (m: TimerMode, mins: number) => {
    const v = Math.max(1, Math.min(180, mins));
    setDurations((d) => ({ ...d, [m]: v }));
    if (m === mode) { setIsRunning(false); setTimeLeft(v * 60); }
  };

  const commitEdit = () => {
    if (!editingMode) return;
    const parsed = parseInt(editVal, 10);
    if (!isNaN(parsed)) applyDuration(editingMode, parsed);
    setEditingMode(null);
  };

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const ss = (timeLeft % 60).toString().padStart(2, "0");

  // Barcode bars — 52 bars, height modulated by sine for visual rhythm
  const bars = Array.from({ length: 52 }, (_, i) => {
    const ratio = i / 52;
    const filled = ratio <= progress;
    const h = 6 + Math.abs(Math.sin(i * 0.55)) * 10;
    return { filled, h: filled ? h + 3 : h };
  });

  // Dial tick marks — glow orange for ticks within remaining time (countdown)
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const major = i % 5 === 0;
    const r1 = R + 2;
    const r2 = R + 2 + (major ? 9 : 4);
    // A tick is "remaining" if it falls within the arcProgress arc (from 0 to arcProgress * 60)
    const tickFraction = i / 60;
    const isRemaining = tickFraction <= arcProgress;
    return { angle, major, isRemaining, x1: CX + r1 * Math.cos(angle), y1: CY + r1 * Math.sin(angle), x2: CX + r2 * Math.cos(angle), y2: CY + r2 * Math.sin(angle) };
  });

  // Dot position — tracks the TRAILING edge of the countdown arc
  // arcProgress=1 → dot at 12 o'clock (start), arcProgress=0 → dot at 12 o'clock (end)
  const dotAngle = arcProgress * 2 * Math.PI - Math.PI / 2;
  const dotX = CX + (R - 5) * Math.cos(dotAngle);
  const dotY = CY + (R - 5) * Math.sin(dotAngle);

  // Add time to current timer (only when stopped)
  const addTime = (mins: number) => {
    if (isRunning) return;
    setTimeLeft((prev) => Math.min(prev + mins * 60, 180 * 60));
    setDurations((d) => ({ ...d, [mode]: Math.min(d[mode] + mins, 180) }));
  };

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontSize: 9, letterSpacing: "0.22em", color: "#8C7B6B", textTransform: "uppercase" }}>
            Focus Timer
          </p>
          <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#3D2E1E", fontWeight: 600, marginTop: 2, textTransform: "uppercase" }}>
            {meta.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sessions > 0 && (
            <span style={{ fontSize: 9, letterSpacing: "0.16em", color: "#8C7B6B" }}>
              {sessions} SESSION{sessions > 1 ? "S" : ""}
            </span>
          )}
          <button
            onClick={() => setShowSettings((s) => !s)}
            style={{ width: 26, height: 26, border: `1px solid ${showSettings ? meta.stroke : "#D4C4B0"}`, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", cursor: "pointer", borderRadius: 0 }}
          >
            <Settings size={11} color={showSettings ? meta.stroke : "#8C7B6B"} />
          </button>
        </div>
      </div>

      {/* ── Mode tabs ── */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["focus", "short", "long"] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              flex: 1,
              padding: "6px 0",
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              border: `1px solid ${mode === m ? MODE_META[m].stroke : "#D4C4B0"}`,
              background: mode === m ? MODE_META[m].stroke : "transparent",
              color: mode === m ? "#FAF6F1" : "#8C7B6B",
              cursor: "pointer",
              borderRadius: 0,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {m === "focus" ? "Focus" : m === "short" ? "Short" : "Long"}
          </button>
        ))}
      </div>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div style={{ border: "1px solid #D4C4B0", padding: "14px", background: "#FAF6F1" }}>
          <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "#8C7B6B", textTransform: "uppercase", marginBottom: 10 }}>
            Duration (min) — click to edit
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            {(["focus", "short", "long"] as TimerMode[]).map((m) => (
              <div key={m} style={{ flex: 1 }}>
                <p style={{ fontSize: 8, letterSpacing: "0.18em", color: "#8C7B6B", textTransform: "uppercase", marginBottom: 4 }}>
                  {m}
                </p>
                {editingMode === m ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      ref={editRef}
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingMode(null); }}
                      type="number" min={1} max={180}
                      style={{ width: 44, textAlign: "center", fontSize: 13, fontWeight: 700, border: `1px solid ${MODE_META[m].stroke}`, background: "transparent", outline: "none", padding: "2px 4px", fontFamily: "'JetBrains Mono', monospace", color: "#3D2E1E", borderRadius: 0 }}
                    />
                    <button onClick={commitEdit} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Check size={12} color={MODE_META[m].stroke} /></button>
                    <button onClick={() => setEditingMode(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={12} color="#8C7B6B" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingMode(m); setEditVal(String(durations[m])); }}
                    style={{ fontSize: 20, fontWeight: 700, color: "#3D2E1E", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {durations[m]}
                  </button>
                )}
                {/* Presets */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {PRESETS[m].map((p) => (
                    <button
                      key={p}
                      onClick={() => applyDuration(m, p)}
                      style={{
                        fontSize: 8, padding: "2px 6px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                        border: `1px solid ${durations[m] === p ? MODE_META[m].stroke : "#D4C4B0"}`,
                        background: durations[m] === p ? `${MODE_META[m].stroke}18` : "transparent",
                        color: durations[m] === p ? MODE_META[m].stroke : "#8C7B6B",
                        borderRadius: 0,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main instrument panel ── */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* SVG Dial — outer ring flat, inner center button is 3D */}
        <div style={{ flexShrink: 0 }}>
          <svg
            width="192" height="192" viewBox="0 0 192 192"
            style={{ cursor: isRunning ? "default" : "pointer", display: "block" }}
            onClick={() => addTime(1)}
            onContextMenu={(e) => { e.preventDefault(); addTime(5); }}
          >
            {/* SVG filter for orange glow on remaining ticks */}
            <defs>
              <filter id="tickGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* ── Flat watch-face style dial ── */}
            {/* Outer bezel ring — warm tan groove */}
            <circle cx={CX} cy={CY} r={R} fill="#E8DDD0" />
            {/* Flat white inner face — flush to bezel, no gap */}
            <circle cx={CX} cy={CY} r={R} fill="#FAF6F0" />
            {/* Subtle inner shadow ring for depth */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#D4C4B0" strokeWidth="1" />

            {/* Tick marks — orange glow on remaining ticks (countdown) */}
            {ticks.map((t, i) => (
              <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke={t.isRemaining ? (isRunning ? meta.stroke : "#C8B8A4") : "#D8CEC4"}
                strokeWidth={t.major ? (t.isRemaining && isRunning ? 2 : 1.5) : (t.isRemaining && isRunning ? 1 : 0.7)}
                filter={t.isRemaining && isRunning ? "url(#tickGlow)" : undefined}
                opacity={t.isRemaining ? 1 : 0.5}
              />
            ))}

            {/* Center cross hair — on top of inner button */}
            <line x1={CX - 5} y1={CY} x2={CX + 5} y2={CY} stroke="#C8B8A4" strokeWidth="0.8" />
            <line x1={CX} y1={CY - 5} x2={CX} y2={CY + 5} stroke="#C8B8A4" strokeWidth="0.8" />

            {/* +1 / +5 hint text when stopped */}
            {!isRunning && (
              <>
                <text x={CX} y={CY + 18} textAnchor="middle" fontSize="7" fill="#C4714A" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em" opacity="0.85">+1 MIN</text>
                <text x={CX} y={CY + 27} textAnchor="middle" fontSize="6" fill="#8C7B6B" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em" opacity="0.6">R-CLICK +5</text>
              </>
            )}
          </svg>
        </div>

        {/* Right panel: digits + barcode + controls */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>

          {/* Large digits */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
              <span style={{ fontSize: 56, fontWeight: 700, lineHeight: 1, color: "#3D2E1E", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em" }}>
                {mm}
              </span>
              <span style={{ fontSize: 36, fontWeight: 300, color: meta.stroke, margin: "0 2px", fontFamily: "'JetBrains Mono', monospace" }}>
                :
              </span>
              <span style={{ fontSize: 56, fontWeight: 700, lineHeight: 1, color: "#3D2E1E", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em" }}>
                {ss}
              </span>
            </div>
            <div style={{ display: "flex", gap: 28, marginTop: 2 }}>
              <span style={{ fontSize: 7, letterSpacing: "0.18em", color: "#8C7B6B" }}>MM</span>
              <span style={{ fontSize: 7, letterSpacing: "0.18em", color: "#8C7B6B" }}>SS</span>
            </div>
          </div>

          {/* Barcode progress */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: 36 }}>
            {bars.map((bar, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: bar.h,
                  background: bar.filled ? meta.stroke : "#E8DDD0",
                  flexShrink: 0,
                  transition: "background 0.4s",
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Play/Pause pill — 3D press effect */}
            <button
              onClick={() => setIsRunning((r) => !r)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 20px",
                borderRadius: 999,
                background: isRunning ? "transparent" : "#3D2E1E",
                border: `1px solid #3D2E1E`,
                color: isRunning ? "#3D2E1E" : "#FAF6F1",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.14em",
                cursor: "pointer",
                // 3D depth: bottom-right shadow creates raised look
                boxShadow: isRunning
                  ? "inset 0 1px 3px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.1)"
                  : "0 3px 0 #1a1208, 0 4px 8px rgba(0,0,0,0.25)",
                transform: "translateY(0)",
                transition: "box-shadow 0.1s, transform 0.1s",
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 0 #1a1208, 0 2px 4px rgba(0,0,0,0.2)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(2px)";
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = isRunning
                  ? "inset 0 1px 3px rgba(0,0,0,0.15)"
                  : "0 3px 0 #1a1208, 0 4px 8px rgba(0,0,0,0.25)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              {isRunning ? <Pause size={11} /> : <Play size={11} />}
              {isRunning ? "PAUSE" : "START"}
            </button>

            {/* Reset pill — 3D press effect */}
            <button
              onClick={() => { setIsRunning(false); setTimeLeft(durations[mode] * 60); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px",
                borderRadius: 999,
                background: "transparent",
                border: "1px solid #D4C4B0",
                color: "#8C7B6B",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.14em",
                cursor: "pointer",
                boxShadow: "0 2px 0 #C4B4A0, 0 3px 6px rgba(0,0,0,0.10)",
                transition: "box-shadow 0.1s, transform 0.1s",
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0px 0 #C4B4A0";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(2px)";
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 0 #C4B4A0, 0 3px 6px rgba(0,0,0,0.10)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              <SkipForward size={11} />
              RESET
            </button>
          </div>

          {/* Session dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 7, height: 7,
                  background: i < sessions % 4 ? meta.stroke : "#E8DDD0",
                  transition: "background 0.3s",
                }}
              />
            ))}
            <span style={{ fontSize: 9, letterSpacing: "0.12em", color: "#8C7B6B", marginLeft: 4 }}>
              {sessions} / 4
            </span>
          </div>
        </div>
      </div>

      {/* Footer rule */}
      <div style={{ borderTop: "1px solid #E8DDD0", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 8, letterSpacing: "0.2em", color: "#8C7B6B", textTransform: "uppercase" }}>
          {durations[mode]} min · {meta.label}
        </span>
        <span style={{ fontSize: 8, letterSpacing: "0.15em", color: "#8C7B6B" }}>
          TIME ELAPSED ◌
        </span>
      </div>
    </div>
  );
}

export default FocusTimer;
