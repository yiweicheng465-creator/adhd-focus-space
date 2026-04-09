/* ============================================================
   ADHD FOCUS SPACE — Focus Timer (Paper Tear Edition)
   Design: A notebook page. As you focus, bottom strips tear off
   one by one. Quit = sad wrap-up with score penalty + quit count.
   Complete = celebration wrap-up with confetti.

   Palette: warm cream bg, ink strokes, terracotta accent
   Typography: Playfair Display (display), DM Sans (body), JetBrains Mono (digits)
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, Play, Pause, Settings, Check, X } from "lucide-react";

// ── Inject keyframes once ─────────────────────────────────────────────────────
const STYLE_ID = "focus-timer-tear-keyframes";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes ft-tearLeft {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; max-height: 44px; }
      25%  { transform: translateY(6px) rotate(-1.5deg); opacity: 0.95; }
      100% { transform: translateY(110px) rotate(-16deg) translateX(-50px); opacity: 0; max-height: 0; }
    }
    @keyframes ft-tearRight {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; max-height: 44px; }
      25%  { transform: translateY(6px) rotate(2deg); opacity: 0.95; }
      100% { transform: translateY(120px) rotate(20deg) translateX(55px); opacity: 0; max-height: 0; }
    }
    @keyframes ft-shake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-3px) rotate(-1deg); }
      40%     { transform: translateX(4px) rotate(1.5deg); }
      60%     { transform: translateX(-2px) rotate(-0.5deg); }
      80%     { transform: translateX(2px); }
    }
    @keyframes ft-flyAway {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(-160%) rotate(-10deg); opacity: 0; }
    }
    @keyframes ft-sadDrop {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(80px) rotate(5deg); opacity: 0; }
    }
    @keyframes ft-fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ft-scoreCount {
      from { opacity: 0; transform: scale(0.7); }
      to   { opacity: 1; transform: scale(1); }
    }
    .ft-tear-left  { animation: ft-tearLeft  0.65s cubic-bezier(0.4,0,1,1) forwards; overflow: hidden; }
    .ft-tear-right { animation: ft-tearRight 0.65s cubic-bezier(0.4,0,1,1) forwards; overflow: hidden; }
    .ft-shake      { animation: ft-shake 0.3s ease-in-out; }
    .ft-fly-away   { animation: ft-flyAway 0.9s cubic-bezier(0.4,0,0.2,1) forwards; }
    .ft-sad-drop   { animation: ft-sadDrop 0.7s cubic-bezier(0.4,0,0.2,1) forwards; }
    .ft-fade-in    { animation: ft-fadeIn 0.5s ease forwards; }
    .ft-score-pop  { animation: ft-scoreCount 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  `;
  document.head.appendChild(s);
}

// ── Types ─────────────────────────────────────────────────────────────────────
type TimerMode = "focus" | "short" | "long";
type TimerPhase = "idle" | "running" | "paused" | "complete" | "quit" | "recovering";

const DEFAULT_DURATIONS: Record<TimerMode, number> = { focus: 25, short: 5, long: 15 };
const PRESETS: Record<TimerMode, number[]> = {
  focus: [15, 25, 45, 60],
  short: [3, 5, 10],
  long: [10, 15, 20, 30],
};
const MODE_LABELS: Record<TimerMode, string> = { focus: "Focus", short: "Short Break", long: "Long Break" };
const MODE_COLORS: Record<TimerMode, string> = { focus: "#C8603A", short: "#7A8C6E", long: "#7A8C9E" };

// ── Strip content ─────────────────────────────────────────────────────────────
const STRIPS = [
  "overthinking",
  "email backlog",
  "that awkward thing",
  "yesterday's worries",
  "the meeting dread",
  "unread messages",
  "tomorrow's anxiety",
  "the mental noise",
];

// ── Jagged tear SVG edge ──────────────────────────────────────────────────────
function JaggedEdge({ seed }: { seed: number }) {
  const w = 320;
  const h = 10;
  const steps = 28;
  const pts: string[] = [`M 0 ${h}`];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const jag = Math.sin(seed * 5.1 + i * 2.7) * 4 + Math.cos(seed * 3.3 + i * 1.9) * 3;
    pts.push(`L ${x} ${h + jag}`);
  }
  pts.push(`L ${w} 0 L 0 0 Z`);
  return (
    <svg width="100%" height={h + 8} viewBox={`0 0 ${w} ${h + 8}`} preserveAspectRatio="none"
      style={{ display: "block", marginBottom: -1, pointerEvents: "none" }}>
      <path d={pts.join(" ")} fill="#F0E8DC" />
    </svg>
  );
}

// ── Single strip ──────────────────────────────────────────────────────────────
type StripState = "attached" | "tearing" | "torn";

function TearStrip({ text, seed, state, isNext }: {
  text: string; seed: number;
  state: StripState; isNext: boolean;
}) {
  const [cls, setCls] = useState("");
  const [hidden, setHidden] = useState(false);
  const prevState = useRef<StripState>(state);

  useEffect(() => {
    if (state === "tearing" && prevState.current !== "tearing") {
      setCls("ft-shake");
      const t1 = setTimeout(() => {
        setCls(seed % 2 === 0 ? "ft-tear-left" : "ft-tear-right");
        setTimeout(() => setHidden(true), 680);
      }, 320);
      prevState.current = "tearing";
      return () => clearTimeout(t1);
    }
    if (state === "attached") {
      setCls(""); setHidden(false); prevState.current = "attached";
    }
    if (state === "torn") {
      setHidden(true); prevState.current = "torn";
    }
  }, [state, seed]);

  if (hidden) return null;

  return (
    <div className={cls} style={{ overflow: "hidden" }}>
      {isNext && <JaggedEdge seed={seed + 0.5} />}
      <div style={{
        padding: "10px 16px",
        background: isNext
          ? "linear-gradient(90deg, #F5EDE0 0%, #EDE0CF 100%)"
          : "#FAF6F1",
        borderTop: isNext ? "none" : "1px solid #EDE0CF",
        display: "flex",
        alignItems: "center",
        gap: 10,
        position: "relative",
      }}>
        {isNext && (
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#C8603A",
            boxShadow: "0 0 6px #C8603A",
            flexShrink: 0,
          }} />
        )}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: isNext ? 11 : 10,
          color: isNext ? "#3D2E1E" : "#8C7B6B",
          letterSpacing: "0.06em",
          fontWeight: isNext ? 600 : 400,
        }}>{text}</span>
        {/* Perforated right edge on next strip */}
        {isNext && (
          <div style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            display: "flex", flexDirection: "column", gap: 3,
          }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#D4C4B0" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Complete wrap-up ──────────────────────────────────────────────────────────
function CompleteWrapUp({ sessions, mode, onNewSession }: {
  sessions: number; mode: TimerMode; onNewSession: () => void;
}) {
  const accentColor = MODE_COLORS[mode];
  const messages = [
    "You stayed. That's everything.",
    "The noise didn't win today.",
    "One full session. Real progress.",
    "You showed up. That matters.",
  ];
  const msg = messages[sessions % messages.length];

  return (
    <div className="ft-fade-in" style={{
      background: "#FDFAF5",
      border: "1px solid #E8DDD0",
      padding: "28px 20px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      textAlign: "center",
      minHeight: 260,
    }}>
      {/* Big celebration icon */}
      <div style={{ fontSize: 48, lineHeight: 1 }}>✨</div>

      <div>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22,
          fontWeight: 700,
          color: "#3D2E1E",
          margin: 0,
          lineHeight: 1.2,
        }}>Session complete</p>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 13,
          fontStyle: "italic",
          color: "#8C7B6B",
          margin: "6px 0 0",
        }}>{msg}</p>
      </div>

      {/* Score ring */}
      <div className="ft-score-pop" style={{
        width: 80, height: 80,
        borderRadius: "50%",
        border: `3px solid ${accentColor}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `${accentColor}12`,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 22,
          fontWeight: 700,
          color: accentColor,
          lineHeight: 1,
        }}>{sessions}</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8,
          color: "#8C7B6B",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginTop: 2,
        }}>SESSION{sessions !== 1 ? "S" : ""}</span>
      </div>

      <div style={{
        background: "#F5EDE0",
        border: "1px solid #E8DDD0",
        borderRadius: 4,
        padding: "10px 18px",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        color: "#6A5A4A",
        letterSpacing: "0.08em",
      }}>
        8 strips torn · all stress released
      </div>

      <button onClick={onNewSession} style={{
        background: "#2a1f14",
        border: "none",
        color: "#FAF6F1",
        borderRadius: 999,
        padding: "10px 28px",
        fontSize: 10,
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.14em",
        boxShadow: "0 3px 0 #1a1208",
      }}>
        ✦ NEW SESSION
      </button>
    </div>
  );
}

// ── Quit (sad) wrap-up ────────────────────────────────────────────────────────
function QuitWrapUp({ quitCount, stripsLeft, onNewSession }: {
  quitCount: number; stripsLeft: number; onNewSession: () => void;
}) {
  const sadMessages = [
    "It's okay. Tomorrow is a new page.",
    "The strips are waiting for you.",
    "Rest, then try again.",
    "Even stopping takes courage.",
  ];
  const msg = sadMessages[(quitCount - 1) % sadMessages.length];
  const penalty = Math.min(stripsLeft * 5, 40);

  return (
    <div className="ft-fade-in" style={{
      background: "#FDFAF5",
      border: "1px solid #E8DDD0",
      padding: "28px 20px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      textAlign: "center",
      minHeight: 260,
    }}>
      {/* Sad icon */}
      <div style={{ fontSize: 44, lineHeight: 1, filter: "grayscale(0.3)" }}>🌧</div>

      <div>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          fontWeight: 700,
          color: "#5A4A3A",
          margin: 0,
          lineHeight: 1.2,
        }}>Session ended early</p>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 13,
          fontStyle: "italic",
          color: "#8C7B6B",
          margin: "6px 0 0",
        }}>{msg}</p>
      </div>

      {/* Stats */}
      <div style={{
        display: "flex",
        gap: 12,
        width: "100%",
      }}>
        <div style={{
          flex: 1,
          background: "#F5EDE0",
          border: "1px solid #E8DDD0",
          padding: "12px 8px",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "#8C7B6B",
            margin: 0,
          }}>{quitCount}</p>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            color: "#A09080",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            margin: "4px 0 0",
          }}>QUIT{quitCount !== 1 ? "S" : ""} TODAY</p>
        </div>
        <div style={{
          flex: 1,
          background: "#FFF0EC",
          border: "1px solid #F0D0C4",
          padding: "12px 8px",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "#C8603A",
            margin: 0,
          }}>−{penalty}</p>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            color: "#C8603A",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            margin: "4px 0 0",
          }}>SCORE PENALTY</p>
        </div>
        <div style={{
          flex: 1,
          background: "#F5EDE0",
          border: "1px solid #E8DDD0",
          padding: "12px 8px",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "#8C7B6B",
            margin: 0,
          }}>{stripsLeft}</p>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            color: "#A09080",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            margin: "4px 0 0",
          }}>STRIPS LEFT</p>
        </div>
      </div>

      <button onClick={onNewSession} style={{
        background: "transparent",
        border: "1px solid #8C7B6B",
        color: "#6A5A4A",
        borderRadius: 999,
        padding: "9px 24px",
        fontSize: 10,
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.12em",
      }}>
        TRY AGAIN
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface FocusTimerProps {
  onSessionComplete?: () => void;
  onQuit?: () => void;
}

export function FocusTimer({ onSessionComplete, onQuit }: FocusTimerProps) {
  const [durations, setDurations] = useState<Record<TimerMode, number>>({ ...DEFAULT_DURATIONS });
  const [mode, setMode] = useState<TimerMode>("focus");
  const [remaining, setRemaining] = useState(DEFAULT_DURATIONS.focus * 60);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [sessions, setSessions] = useState(0);
  const [quitCount, setQuitCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [editingMode, setEditingMode] = useState<TimerMode | null>(null);
  const [editVal, setEditVal] = useState("");
  const [stripStates, setStripStates] = useState<StripState[]>(STRIPS.map(() => "attached"));
  const [paperFlying, setPaperFlying] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const editRef = useRef<HTMLInputElement>(null);
  // Timestamp when the current running session started (or resumed)
  const startedAtRef = useRef<number | null>(null);
  // Remaining seconds at the moment the timer was last started/resumed
  const remainingAtStartRef = useRef<number>(DEFAULT_DURATIONS.focus * 60);

  const totalSec = durations[mode] * 60;
  const progress = totalSec > 0 ? (totalSec - remaining) / totalSec : 0;
  const stripsToTear = Math.floor(progress * STRIPS.length);
  const tornCount = stripStates.filter(s => s === "torn" || s === "tearing").length;
  const stripsLeft = STRIPS.length - tornCount;
  const nextStripIdx = stripStates.findIndex(s => s === "attached");

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const accentColor = MODE_COLORS[mode];
  const segments = Array.from({ length: 20 }, (_, i) => i / 20 < progress);

  // Focus editingMode input
  useEffect(() => {
    if (editingMode) setTimeout(() => editRef.current?.focus(), 40);
  }, [editingMode]);

  // Tear strips as progress advances
  useEffect(() => {
    if (phase !== "running") return;
    const currentTorn = stripStates.filter(s => s === "torn").length;
    if (stripsToTear > currentTorn) {
      const nextIdx = stripStates.findIndex(s => s === "attached");
      if (nextIdx !== -1) {
        setStripStates(prev => {
          const next = [...prev];
          next[nextIdx] = "tearing";
          return next;
        });
        setTimeout(() => {
          setStripStates(prev => {
            const next = [...prev];
            if (next[nextIdx] === "tearing") next[nextIdx] = "torn";
            return next;
          });
        }, 1020);
      }
    }
  }, [stripsToTear, phase, stripStates]);

  const handleComplete = useCallback((natural = true) => {
    setRunning(false);
    if (mode === "focus") {
      setSessions(s => s + 1);
      if (natural && !completedRef.current) {
        completedRef.current = true;
        // Cascade tear remaining strips
        const remaining_strips = STRIPS.map((_, i) => i).filter(i => stripStates[i] === "attached");
        remaining_strips.forEach((idx, j) => {
          setTimeout(() => {
            setStripStates(prev => {
              const next = [...prev];
              next[idx] = "tearing";
              return next;
            });
            setTimeout(() => {
              setStripStates(prev => {
                const next = [...prev];
                if (next[idx] === "tearing") next[idx] = "torn";
                return next;
              });
            }, 700);
          }, j * 200);
        });
        // Fly away after cascade
        setTimeout(() => {
          setPaperFlying(true);
          setTimeout(() => {
            setPhase("complete");
            onSessionComplete?.();
          }, 900);
        }, remaining_strips.length * 200 + 400);
      } else {
        setPhase("complete");
      }
    } else {
      setPhase("complete");
    }
  }, [mode, onSessionComplete, stripStates]);

  // Timestamp-based countdown — survives tab switches / browser throttling
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    // Record the wall-clock start time and remaining seconds at that moment
    startedAtRef.current = Date.now();
    remainingAtStartRef.current = remaining;

    intervalRef.current = setInterval(() => {
      if (startedAtRef.current === null) return;
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const newRemaining = Math.max(0, remainingAtStartRef.current - elapsed);
      setRemaining(newRemaining);
      if (newRemaining <= 0) {
        clearInterval(intervalRef.current!);
        handleComplete(true);
      }
    }, 500); // poll every 500ms for responsiveness

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]); // only restart when running changes — elapsed calc uses refs

  const resetStrips = () => setStripStates(STRIPS.map(() => "attached"));

  const switchMode = (m: TimerMode) => {
    if (running) return;
    setMode(m);
    setRemaining(durations[m] * 60);
    setPhase("idle");
    resetStrips();
    setPaperFlying(false);
    completedRef.current = false;
  };

  const applyDuration = (m: TimerMode, mins: number) => {
    const v = Math.max(1, Math.min(180, mins));
    setDurations(d => ({ ...d, [m]: v }));
    if (m === mode) { setRunning(false); setRemaining(v * 60); setPhase("idle"); resetStrips(); }
  };

  const commitEdit = () => {
    if (!editingMode) return;
    const parsed = parseInt(editVal, 10);
    if (!isNaN(parsed)) applyDuration(editingMode, parsed);
    setEditingMode(null);
  };

  const handleStartPause = () => {
    if (phase === "complete" || phase === "quit" || phase === "recovering") return;
    const next = !running;
    if (!next) {
      // Pausing: capture remaining time from timestamp before stopping
      if (startedAtRef.current !== null) {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        const snapped = Math.max(0, remainingAtStartRef.current - elapsed);
        setRemaining(snapped);
        remainingAtStartRef.current = snapped;
      }
    }
    setRunning(next);
    setPhase(next ? "running" : "paused");
  };

  const handleQuit = () => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setQuitCount(q => q + 1);
    onQuit?.();
    // Sad drop animation — strips fall down
    setPaperFlying(false);
    setPhase("recovering");
    setTimeout(() => {
      setPhase("quit");
    }, 400);
  };

  const handleNewSession = () => {
    setRemaining(durations[mode] * 60);
    setPhase("idle");
    resetStrips();
    setPaperFlying(false);
    completedRef.current = false;
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
            <span style={{ fontSize: 9, letterSpacing: "0.16em", color: "#8C7B6B", fontFamily: "'JetBrains Mono', monospace" }}>{sessions} SESSION{sessions !== 1 ? "S" : ""}</span>
          )}
          {quitCount > 0 && (
            <span style={{ fontSize: 9, letterSpacing: "0.16em", color: "#C8603A", fontFamily: "'JetBrains Mono', monospace" }}>{quitCount} QUIT{quitCount !== 1 ? "S" : ""}</span>
          )}
          <button onClick={() => setShowSettings(s => !s)} style={{ width: 26, height: 26, border: `1px solid ${showSettings ? accentColor : "#D4C4B0"}`, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", cursor: "pointer", borderRadius: 0 }}>
            <Settings size={11} color={showSettings ? accentColor : "#8C7B6B"} />
          </button>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["focus", "short", "long"] as TimerMode[]).map(m => (
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
            {(["focus", "short", "long"] as TimerMode[]).map(m => (
              <div key={m} style={{ flex: 1 }}>
                <p style={{ fontSize: 8, letterSpacing: "0.18em", color: "#8C7B6B", textTransform: "uppercase", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{m}</p>
                {editingMode === m ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input ref={editRef} value={editVal} onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingMode(null); }}
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
                  {PRESETS[m].map(p => (
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

      {/* Complete wrap-up */}
      {phase === "complete" && (
        <CompleteWrapUp sessions={sessions} mode={mode} onNewSession={handleNewSession} />
      )}

      {/* Quit wrap-up */}
      {phase === "quit" && (
        <QuitWrapUp quitCount={quitCount} stripsLeft={stripsLeft} onNewSession={handleNewSession} />
      )}

      {/* Paper scene — hidden during complete/quit */}
      {phase !== "complete" && phase !== "quit" && (
        <div
          className={paperFlying ? "ft-fly-away" : ""}
          style={{
            background: "#FDFAF5",
            border: "1px solid #E8DDD0",
            minHeight: 260,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Notebook header — time display */}
          <div style={{
            padding: "14px 16px 10px",
            borderBottom: "1px solid #E8DDD0",
            background: "#FAF6F1",
            position: "relative",
          }}>
            {/* Red margin line */}
            <div style={{
              position: "absolute", left: 36, top: 0, bottom: 0,
              width: 1, background: "#E8A090", opacity: 0.5,
            }} />
            {/* Ruled lines */}
            {[0,1,2].map(i => (
              <div key={i} style={{
                position: "absolute", left: 0, right: 0,
                top: 14 + i * 10,
                height: 1, background: "#E8DDD0", opacity: 0.6,
              }} />
            ))}
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 11,
              fontStyle: "italic",
              color: "#8C7B6B",
              margin: "0 0 4px 44px",
              position: "relative",
            }}>things to let go of</p>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 32,
              fontWeight: 700,
              color: phase === "running" ? accentColor : "#3D2E1E",
              margin: "0 0 0 44px",
              letterSpacing: "0.04em",
              lineHeight: 1,
              position: "relative",
              transition: "color 0.5s",
            }}>{mm}:{ss}</p>
          </div>

          {/* Strips */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {STRIPS.map((text, i) => (
              <TearStrip
                key={i}
                text={text}
                seed={i + 1}
                state={stripStates[i]}
                isNext={i === nextStripIdx && (phase === "running" || phase === "paused")}
              />
            ))}
          </div>

          {/* Empty state when all torn */}
          {tornCount === STRIPS.length && phase === "running" && (
            <div style={{
              padding: "20px",
              textAlign: "center",
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              color: "#8C7B6B",
              fontSize: 13,
            }}>
              All torn away…
            </div>
          )}
        </div>
      )}

      {/* Progress segments */}
      {phase !== "complete" && phase !== "quit" && (
        <div style={{ display: "flex", gap: 3 }}>
          {segments.map((filled, i) => (
            <div key={i} style={{ flex: 1, height: 5, background: filled ? accentColor : "#E8DDD0", transition: "background 0.5s" }} />
          ))}
        </div>
      )}

      {/* Controls */}
      {phase !== "complete" && phase !== "quit" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Quit */}
          {(running || phase === "paused") && (
            <button onClick={handleQuit} title="Quit session" style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 999,
              background: "transparent", border: "1px solid #D4C4B0",
              color: "#8C7B6B", cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              letterSpacing: "0.12em",
            }}>
              <RotateCcw size={11} /> QUIT
            </button>
          )}

          {/* Play / Pause */}
          {phase !== "recovering" && (
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
              {running ? <><Pause size={11} /> PAUSE</> : <><Play size={11} /> {phase === "paused" ? "RESUME" : "START"}</>}
            </button>
          )}

          {/* Session dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ width: 7, height: 7, background: i < sessions % 4 ? accentColor : "#E8DDD0", transition: "background 0.3s" }} />
            ))}
            <span style={{ fontSize: 9, letterSpacing: "0.12em", color: "#8C7B6B", marginLeft: 3, fontFamily: "'JetBrains Mono', monospace" }}>{sessions}/4</span>
          </div>
        </div>
      )}

      {/* Footer */}
      {phase !== "complete" && phase !== "quit" && (
        <div style={{ borderTop: "1px solid #E8DDD0", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 8, letterSpacing: "0.2em", color: "#8C7B6B", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>{durations[mode]} min · {MODE_LABELS[mode]}</span>
          <span style={{ fontSize: 8, letterSpacing: "0.15em", color: "#8C7B6B", fontFamily: "'JetBrains Mono', monospace" }}>{tornCount}/{STRIPS.length} STRIPS TORN</span>
        </div>
      )}
    </div>
  );
}

export default FocusTimer;
