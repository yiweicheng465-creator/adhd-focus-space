/* ============================================================
   ADHD FOCUS SPACE — Focus Timer (Balloon Deflate)
   Design: Hand-painted sketch balloon that deflates as you focus.
   Needle creeps toward the balloon as time runs out.
   Reset mid-session → needle pops the balloon.
   Complete → balloon fully deflated, stress fully released.

   Palette: warm cream bg, golden balloon, dark ink stroke
   Typography: Playfair Display (display), DM Sans (body), JetBrains Mono (digits)
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, Play, Pause, SkipForward, Settings, Check, X } from "lucide-react";

type TimerMode = "focus" | "short" | "long";
type BalloonState = "idle" | "running" | "paused" | "popping" | "popped" | "complete";

const DEFAULT_DURATIONS: Record<TimerMode, number> = { focus: 25, short: 5, long: 15 };
const PRESETS: Record<TimerMode, number[]> = {
  focus: [15, 25, 45, 60],
  short: [3, 5, 10],
  long: [10, 15, 20, 30],
};
const MODE_LABELS: Record<TimerMode, string> = {
  focus: "Focus",
  short: "Short Break",
  long: "Long Break",
};
const MODE_COLORS: Record<TimerMode, string> = {
  focus: "#C8603A",
  short: "#7A8C6E",
  long: "#7A8C9E",
};
const BALLOON_FILLS: Record<TimerMode, string> = {
  focus: "#E8C06A",
  short: "#A8C4A0",
  long: "#A0B8C8",
};

// ── Balloon path helper ───────────────────────────────────────────────────────
function makeBalloonPath(cx: number, cy: number, rx: number, ry: number) {
  return `
    M ${cx} ${cy - ry}
    C ${cx + rx * 1.18} ${cy - ry * 0.95},
      ${cx + rx * 1.22} ${cy + ry * 0.55},
      ${cx + rx * 0.12} ${cy + ry * 0.92}
    C ${cx - rx * 0.08} ${cy + ry * 1.02},
      ${cx - rx * 0.08} ${cy + ry * 1.02},
      ${cx - rx * 0.22} ${cy + ry * 0.90}
    C ${cx - rx * 1.28} ${cy + ry * 0.52},
      ${cx - rx * 1.20} ${cy - ry * 0.92},
      ${cx} ${cy - ry}
    Z
  `;
}

// ── Pop burst ─────────────────────────────────────────────────────────────────
function PopBurst() {
  const rays = [
    [0, 18, 52], [28, 16, 44], [55, 20, 58], [82, 15, 48],
    [110, 22, 60], [138, 17, 50], [165, 21, 55], [195, 14, 46],
    [222, 19, 54], [250, 16, 42], [278, 23, 58], [308, 18, 50],
    [335, 20, 52],
  ];
  return (
    <svg width="200" height="200" viewBox="0 0 180 180" style={{ display: "block" }}>
      {rays.map(([angle, r1, r2], i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 90 + r1 * Math.cos(rad), y1 = 90 + r1 * Math.sin(rad);
        const x2 = 90 + r2 * Math.cos(rad), y2 = 90 + r2 * Math.sin(rad);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={i % 3 === 0 ? "#C8603A" : i % 3 === 1 ? "#E8C06A" : "#2a1f14"}
            strokeWidth={1.8 + (i % 3) * 0.6} strokeLinecap="round" opacity="0.85" />
        );
      })}
      {[30, 90, 150, 210, 270, 330].map((a, i) => {
        const r = 38 + (i % 2) * 10;
        const rad = (a * Math.PI) / 180;
        return <circle key={i} cx={90 + r * Math.cos(rad)} cy={90 + r * Math.sin(rad)} r={3.5}
          fill={i % 2 === 0 ? "#C8603A" : "#E8C06A"} opacity="0.9" />;
      })}
      <text x="90" y="97" textAnchor="middle" fill="#C8603A" fontSize="20" fontWeight="900"
        fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic">POP!</text>
    </svg>
  );
}

// ── BalloonScene: unified SVG with balloon + needle ───────────────────────────
function BalloonScene({
  balloonScale, timeLabel, showNeedle, touching, mode,
}: {
  balloonScale: number;
  timeLabel: string;
  showNeedle: boolean;
  touching: boolean;
  mode: TimerMode;
}) {
  const s = Math.max(0.15, balloonScale);
  const cx = 110, cy = 100;
  const rx = 72 * s, ry = 84 * s;
  const knotY = cy + ry;
  const knotSize = 9 * s;
  const stringY1 = knotY + knotSize * 1.2;
  const stringY2 = 255;

  const FILL = BALLOON_FILLS[mode];
  const STROKE = "#2a1f14";
  const sw = 2.2;

  const bPath = makeBalloonPath(cx, cy, rx, ry);
  const h1 = `M ${cx - rx * 0.38} ${cy - ry * 0.58} Q ${cx - rx * 0.22} ${cy - ry * 0.72} ${cx - rx * 0.05} ${cy - ry * 0.62}`;
  const h2 = `M ${cx - rx * 0.42} ${cy - ry * 0.38} Q ${cx - rx * 0.30} ${cy - ry * 0.48} ${cx - rx * 0.18} ${cy - ry * 0.40}`;

  // Needle tip always tracks balloon right edge
  const progressFromScale = Math.max(0, Math.min(1, (1 - balloonScale) / 0.85));
  const needleGap = touching ? -4 : Math.max(8, 80 - progressFromScale * 72);
  const balloonRightEdge = cx + rx;
  const needleTipX = balloonRightEdge + needleGap;
  const needleEyeX = needleTipX + 130;
  const needleY = cy;

  const svgW = 340;
  const svgH = 270;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ display: "block", overflow: "visible", maxWidth: "100%" }}
    >
      {/* Balloon fill */}
      <path d={bPath} fill={FILL} />
      {/* Balloon outline */}
      <path d={bPath} fill="none" stroke={STROKE} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
      {/* Gloss highlights */}
      {s > 0.4 && (
        <>
          <path d={h1} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={sw * 0.9} strokeLinecap="round" />
          <path d={h2} fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth={sw * 0.7} strokeLinecap="round" />
        </>
      )}
      {/* Knot */}
      {s > 0.22 && (
        <path
          d={`M${cx - knotSize * 0.75} ${knotY} L${cx} ${knotY + knotSize * 1.3} L${cx + knotSize * 0.75} ${knotY} L${cx} ${knotY - knotSize * 0.25}Z`}
          fill={FILL} stroke={STROKE} strokeWidth={sw * 0.85} strokeLinejoin="round"
        />
      )}
      {/* String */}
      {s > 0.22 && (
        <path
          d={`M${cx} ${stringY1} C${cx - 18} ${(stringY1 + stringY2) * 0.45} ${cx + 10} ${(stringY1 + stringY2) * 0.72} ${cx} ${stringY2}`}
          fill="none" stroke={STROKE} strokeWidth={sw * 0.75} strokeLinecap="round"
        />
      )}
      {/* Text inside balloon */}
      {s > 0.45 && (
        <>
          <text x={cx} y={cy - 10} textAnchor="middle" fill={STROKE}
            fontSize={Math.round(13 * s)} fontWeight="800"
            fontFamily="'Playfair Display', Georgia, serif" letterSpacing="1">
            {MODE_LABELS[mode].toUpperCase()}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill={STROKE}
            fontSize={Math.round(13 * s)} fontFamily="'JetBrains Mono', monospace" letterSpacing="1.5">
            {timeLabel}
          </text>
        </>
      )}

      {/* Needle — tip always at balloon right edge + gap */}
      {showNeedle && (
        <g style={{ transition: touching ? "transform 0.5s cubic-bezier(0.25,0,0.5,1)" : "transform 0.4s ease-out" }}>
          <path
            d={`M ${needleTipX} ${needleY - 2} C ${needleTipX + 30} ${needleY - 4}, ${needleTipX + 70} ${needleY - 5}, ${needleEyeX - 12} ${needleY}`}
            fill="none" stroke="#2a1f14" strokeWidth="1.8" strokeLinecap="round"
          />
          <path
            d={`M ${needleTipX} ${needleY + 2} C ${needleTipX + 30} ${needleY + 4}, ${needleTipX + 70} ${needleY + 5}, ${needleEyeX - 12} ${needleY}`}
            fill="none" stroke="#2a1f14" strokeWidth="1.8" strokeLinecap="round"
          />
          <ellipse cx={needleEyeX - 6} cy={needleY} rx="5" ry="3" fill="none" stroke="#2a1f14" strokeWidth="1.6" />
          <ellipse cx={needleEyeX - 6} cy={needleY} rx="2" ry="1.2" fill="none" stroke="#2a1f14" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}

// ── Status messages ───────────────────────────────────────────────────────────
const IDLE_MSGS: Record<TimerMode, string> = {
  focus: "Start the timer — breathe out your stress, one second at a time.",
  short: "Take a breath. Let the tension float away.",
  long: "A longer rest. Let the air — and the pressure — out slowly.",
};
const RUNNING_MSGS = [
  "Stay focused — the needle is watching...",
  "Every second of focus deflates the stress.",
  "Keep going. The balloon is getting lighter.",
  "You're doing great. Don't let the needle win.",
];
const PAUSED_MSG = "Paused — the needle is waiting. Don't let it win.";
const POPPED_MSG = "Your focus balloon popped. Shake it off and try again!";
const COMPLETE_MSGS: Record<TimerMode, string> = {
  focus: "All the stress is out. Session complete! 🎉",
  short: "Break over — you're refreshed and ready.",
  long: "Long break complete. You've earned it.",
};

// ── Main component ────────────────────────────────────────────────────────────
interface FocusTimerProps {
  onSessionComplete?: () => void;
}

export function FocusTimer({ onSessionComplete }: FocusTimerProps) {
  const [durations, setDurations] = useState<Record<TimerMode, number>>({ ...DEFAULT_DURATIONS });
  const [mode, setMode] = useState<TimerMode>("focus");
  const [remaining, setRemaining] = useState(DEFAULT_DURATIONS.focus * 60);
  const [running, setRunning] = useState(false);
  const [balloonState, setBalloonState] = useState<BalloonState>("idle");
  const [touching, setTouching] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [editingMode, setEditingMode] = useState<TimerMode | null>(null);
  const [editVal, setEditVal] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const editRef = useRef<HTMLInputElement>(null);

  const totalSec = durations[mode] * 60;
  const progress = totalSec > 0 ? (totalSec - remaining) / totalSec : 0;
  // Balloon deflates from 1.0 → 0.15 as focus progresses
  const balloonScale = balloonState === "popped" ? 0 : 1 - progress * 0.85;

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  // Rotate running messages
  useEffect(() => {
    if (running) {
      msgRef.current = setInterval(() => setMsgIdx((i) => (i + 1) % RUNNING_MSGS.length), 8000);
    } else {
      if (msgRef.current) clearInterval(msgRef.current);
    }
    return () => { if (msgRef.current) clearInterval(msgRef.current); };
  }, [running]);

  // Focus editingMode input
  useEffect(() => {
    if (editingMode) setTimeout(() => editRef.current?.focus(), 40);
  }, [editingMode]);

  const handleComplete = useCallback(() => {
    setRunning(false);
    setBalloonState("complete");
    if (mode === "focus") {
      setSessions((s) => s + 1);
      if (!completedRef.current) {
        completedRef.current = true;
        onSessionComplete?.();
      }
    }
  }, [mode, onSessionComplete]);

  // Countdown
  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(intervalRef.current!);
            handleComplete();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, remaining, handleComplete]);

  const switchMode = (m: TimerMode) => {
    if (running) return;
    setMode(m);
    setRemaining(durations[m] * 60);
    setBalloonState("idle");
    setTouching(false);
    completedRef.current = false;
  };

  const applyDuration = (m: TimerMode, mins: number) => {
    const v = Math.max(1, Math.min(180, mins));
    setDurations((d) => ({ ...d, [m]: v }));
    if (m === mode) { setRunning(false); setRemaining(v * 60); setBalloonState("idle"); }
  };

  const commitEdit = () => {
    if (!editingMode) return;
    const parsed = parseInt(editVal, 10);
    if (!isNaN(parsed)) applyDuration(editingMode, parsed);
    setEditingMode(null);
  };

  const handleStartPause = () => {
    if (balloonState === "complete" || balloonState === "popped" || balloonState === "popping") return;
    const next = !running;
    setRunning(next);
    setBalloonState(next ? "running" : "paused");
  };

  const handleSkip = () => {
    clearInterval(intervalRef.current!);
    handleComplete();
    setRemaining(0);
  };

  const handleReset = () => {
    const wasRunning = running && progress > 0.05;
    clearInterval(intervalRef.current!);
    setRunning(false);
    completedRef.current = false;
    if (wasRunning) {
      setBalloonState("popping");
      setTouching(true);
      setTimeout(() => {
        setBalloonState("popped");
        setTouching(false);
        setTimeout(() => {
          setRemaining(durations[mode] * 60);
          setBalloonState("idle");
        }, 2200);
      }, 700);
    } else {
      setRemaining(durations[mode] * 60);
      setBalloonState("idle");
    }
  };

  const showNeedle = balloonState === "running" || balloonState === "popping" || balloonState === "paused";
  const accentColor = MODE_COLORS[mode];
  const segments = Array.from({ length: 20 }, (_, i) => i / 20 < progress);

  const statusMsg = (() => {
    if (balloonState === "complete") return COMPLETE_MSGS[mode];
    if (balloonState === "popped" || balloonState === "popping") return POPPED_MSG;
    if (balloonState === "running") return RUNNING_MSGS[msgIdx];
    if (balloonState === "paused") return PAUSED_MSG;
    return IDLE_MSGS[mode];
  })();

  return (
    <div className="flex flex-col gap-3" style={{ fontFamily: "'DM Sans', system-ui" }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontSize: 9, letterSpacing: "0.22em", color: "#8C7B6B", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>Focus Timer</p>
          <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#3D2E1E", fontWeight: 600, marginTop: 2, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>{MODE_LABELS[mode]}</p>
        </div>
        <div className="flex items-center gap-2">
          {sessions > 0 && (
            <span style={{ fontSize: 9, letterSpacing: "0.16em", color: "#8C7B6B", fontFamily: "'JetBrains Mono', monospace" }}>{sessions} SESSION{sessions > 1 ? "S" : ""}</span>
          )}
          <button onClick={() => setShowSettings((s) => !s)} style={{ width: 26, height: 26, border: `1px solid ${showSettings ? accentColor : "#D4C4B0"}`, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", cursor: "pointer", borderRadius: 0 }}>
            <Settings size={11} color={showSettings ? accentColor : "#8C7B6B"} />
          </button>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["focus", "short", "long"] as TimerMode[]).map((m) => (
          <button key={m} onClick={() => switchMode(m)} style={{
            flex: 1, padding: "6px 0", fontSize: 9, letterSpacing: "0.18em",
            textTransform: "uppercase", border: `1px solid ${mode === m ? MODE_COLORS[m] : "#D4C4B0"}`,
            background: mode === m ? MODE_COLORS[m] : "transparent",
            color: mode === m ? "#FAF6F1" : "#8C7B6B", cursor: running ? "not-allowed" : "pointer",
            borderRadius: 0, fontFamily: "'JetBrains Mono', monospace", opacity: running ? 0.6 : 1,
          }}>
            {m === "focus" ? "Focus" : m === "short" ? "Short" : "Long"}
          </button>
        ))}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{ border: "1px solid #D4C4B0", padding: "14px", background: "#FAF6F1" }}>
          <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "#8C7B6B", textTransform: "uppercase", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>Duration (min) — click to edit</p>
          <div style={{ display: "flex", gap: 16 }}>
            {(["focus", "short", "long"] as TimerMode[]).map((m) => (
              <div key={m} style={{ flex: 1 }}>
                <p style={{ fontSize: 8, letterSpacing: "0.18em", color: "#8C7B6B", textTransform: "uppercase", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{m}</p>
                {editingMode === m ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input ref={editRef} value={editVal} onChange={(e) => setEditVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingMode(null); }}
                      type="number" min={1} max={180}
                      style={{ width: 44, textAlign: "center", fontSize: 13, fontWeight: 700, border: `1px solid ${MODE_COLORS[m]}`, background: "transparent", outline: "none", padding: "2px 4px", fontFamily: "'JetBrains Mono', monospace", color: "#3D2E1E", borderRadius: 0 }} />
                    <button onClick={commitEdit} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Check size={12} color={MODE_COLORS[m]} /></button>
                    <button onClick={() => setEditingMode(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={12} color="#8C7B6B" /></button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingMode(m); setEditVal(String(durations[m])); }}
                    style={{ fontSize: 20, fontWeight: 700, color: "#3D2E1E", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                    {durations[m]}
                  </button>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {PRESETS[m].map((p) => (
                    <button key={p} onClick={() => applyDuration(m, p)} style={{
                      fontSize: 8, padding: "2px 6px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                      border: `1px solid ${durations[m] === p ? MODE_COLORS[m] : "#D4C4B0"}`,
                      background: durations[m] === p ? `${MODE_COLORS[m]}18` : "transparent",
                      color: durations[m] === p ? MODE_COLORS[m] : "#8C7B6B", borderRadius: 0,
                    }}>{p}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Balloon scene */}
      <div style={{
        background: "#FDFAF5",
        border: "1px solid #E8DDD0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 16px 16px",
        minHeight: 260,
        overflow: "visible",
        position: "relative",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          minHeight: 220,
          overflow: "visible",
        }}>
          {balloonState === "popped" ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
              <PopBurst />
            </div>
          ) : (
            <BalloonScene
              balloonScale={balloonScale}
              timeLabel={mm + ":" + ss}
              showNeedle={showNeedle}
              touching={touching}
              mode={mode}
            />
          )}
        </div>

        {/* Status message */}
        <p style={{
          fontSize: 11, color: balloonState === "popped" || balloonState === "popping" ? "#C8603A" : "#6A5A4A",
          margin: "8px 0 0", fontStyle: "italic",
          fontFamily: "'Playfair Display', serif",
          maxWidth: 260, textAlign: "center", lineHeight: 1.55, minHeight: 34,
          transition: "color 0.3s",
        }}>
          {statusMsg}
        </p>
      </div>

      {/* Progress segments */}
      <div style={{ display: "flex", gap: 3 }}>
        {segments.map((filled, i) => (
          <div key={i} style={{ flex: 1, height: 5, background: filled ? accentColor : "#E8DDD0", transition: "background 0.5s" }} />
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Reset */}
        <button onClick={handleReset} title="Reset" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 36, height: 36, borderRadius: "50%",
          background: "transparent", border: "1px solid #D4C4B0", color: "#8C7B6B", cursor: "pointer",
        }}>
          <RotateCcw size={13} />
        </button>

        {/* Play / Pause */}
        {balloonState !== "complete" && balloonState !== "popped" && balloonState !== "popping" && (
          <button onClick={handleStartPause} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 24px", borderRadius: 999,
            background: running ? "transparent" : "#2a1f14",
            border: "1px solid #2a1f14",
            color: running ? "#2a1f14" : "#FAF6F1",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            letterSpacing: "0.14em", cursor: "pointer",
            boxShadow: running ? "none" : "0 3px 0 #1a1208",
            transition: "all 0.1s",
          }}>
            {running ? <><Pause size={11} /> PAUSE</> : <><Play size={11} /> {balloonState === "paused" ? "RESUME" : "START"}</>}
          </button>
        )}

        {/* Skip */}
        <button onClick={handleSkip} title="Skip to end" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 36, height: 36, borderRadius: "50%",
          background: "transparent", border: "1px solid #D4C4B0", color: "#8C7B6B", cursor: "pointer",
        }}>
          <SkipForward size={13} />
        </button>

        {/* Session dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ width: 7, height: 7, background: i < sessions % 4 ? accentColor : "#E8DDD0", transition: "background 0.3s" }} />
          ))}
          <span style={{ fontSize: 9, letterSpacing: "0.12em", color: "#8C7B6B", marginLeft: 3, fontFamily: "'JetBrains Mono', monospace" }}>{sessions}/4</span>
        </div>
      </div>

      {/* New session button after complete/popped */}
      {(balloonState === "complete" || balloonState === "popped") && (
        <button onClick={() => { setRemaining(durations[mode] * 60); setBalloonState("idle"); completedRef.current = false; }} style={{
          background: "transparent", border: "1px solid #2a1f14", color: "#2a1f14",
          borderRadius: 999, padding: "7px 22px", fontSize: 10, cursor: "pointer",
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em",
          alignSelf: "center",
        }}>
          NEW SESSION
        </button>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #E8DDD0", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 8, letterSpacing: "0.2em", color: "#8C7B6B", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>{durations[mode]} min · {MODE_LABELS[mode]}</span>
        <span style={{ fontSize: 8, letterSpacing: "0.15em", color: "#8C7B6B", fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(progress * 100)}% ELAPSED</span>
      </div>
    </div>
  );
}

export default FocusTimer;
