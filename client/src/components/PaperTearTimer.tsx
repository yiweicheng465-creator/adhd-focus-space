/* ============================================================
   ADHD FOCUS SPACE — PaperTearTimer v2.0 (Retro Lo-Fi)
   Design: A notebook page. As you focus, bottom strips tear off
   one by one. The jagged tear edge is at the BOTTOM of the last
   remaining strip — so it looks like you're tearing from the
   bottom of the paper, not the middle.
   Retro lo-fi styling: Space Mono, warm parchment, thick dark
   border, 3D offset shadow, ruled lines.
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from "react";

// ── Inject keyframes once ─────────────────────────────────────────────────────
const STYLE_ID = "paper-tear-keyframes-v2";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes tearAway {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      25%  { transform: translateY(4px) rotate(-1.5deg); opacity: 0.95; }
      100% { transform: translateY(110px) rotate(-16deg) translateX(-30px); opacity: 0; }
    }
    @keyframes tearAwayRight {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      25%  { transform: translateY(4px) rotate(2deg); opacity: 0.95; }
      100% { transform: translateY(120px) rotate(20deg) translateX(40px); opacity: 0; }
    }
    @keyframes stripShake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-3px) rotate(-1deg); }
      40%     { transform: translateX(4px) rotate(1.5deg); }
      60%     { transform: translateX(-2px) rotate(-0.5deg); }
      80%     { transform: translateX(2px); }
    }
    @keyframes paperFlyAway {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(-160%) rotate(-12deg); opacity: 0; }
    }
    .strip-tearing-left  { animation: tearAway 0.65s cubic-bezier(0.4,0,1,1) forwards; overflow: hidden; }
    .strip-tearing-right { animation: tearAwayRight 0.65s cubic-bezier(0.4,0,1,1) forwards; overflow: hidden; }
    .strip-shake         { animation: stripShake 0.3s ease-in-out; }
    .paper-fly-away      { animation: paperFlyAway 0.9s cubic-bezier(0.4,0,0.2,1) forwards; }
  `;
  document.head.appendChild(s);
}

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

// ── Jagged tear SVG edge — placed at BOTTOM of last remaining strip ───────────
function JaggedBottomEdge({ width, seed }: { width: number; seed: number }) {
  const h = 12;
  const steps = 28;
  const pts: string[] = [];
  // Start at top-left, draw across top flat, then jagged bottom
  pts.push(`M 0 0`);
  pts.push(`L ${width} 0`);
  pts.push(`L ${width} ${h * 0.5}`);
  for (let i = steps; i >= 0; i--) {
    const x = (i / steps) * width;
    const jag = Math.sin(seed * 4.7 + i * 2.3) * 4.5 + Math.cos(seed * 3.1 + i * 1.7) * 3;
    pts.push(`L ${x} ${h * 0.5 + jag}`);
  }
  pts.push(`L 0 ${h * 0.5} Z`);
  return (
    <svg
      width={width} height={h + 4}
      viewBox={`0 0 ${width} ${h + 4}`}
      style={{ display: "block", marginTop: -1 }}
    >
      {/* Shadow under tear */}
      <path
        d={pts.join(" ")}
        fill="oklch(0.60 0.020 55)"
        transform="translate(0, 3)"
        opacity={0.18}
      />
      {/* Main paper tear */}
      <path d={pts.join(" ")} fill="oklch(0.975 0.012 72)" />
      {/* Fibrous edge highlight */}
      <path d={pts.join(" ")} fill="none" stroke="oklch(0.88 0.018 68)" strokeWidth="0.8" opacity={0.6} />
    </svg>
  );
}

// ── Single strip ──────────────────────────────────────────────────────────────
function TearStrip({
  text, seed, state, isLast, isRunning,
}: {
  text: string; seed: number;
  state: "attached" | "tearing" | "torn";
  isLast: boolean;   // last remaining (bottom-most visible) strip
  isRunning: boolean;
}) {
  const [cls, setCls] = useState("");
  const [hidden, setHidden] = useState(false);
  const prevState = useRef(state);

  useEffect(() => {
    if (state === "tearing" && prevState.current !== "tearing") {
      setCls("strip-shake");
      const t1 = setTimeout(() => {
        setCls(seed % 2 === 0 ? "strip-tearing-left" : "strip-tearing-right");
        setTimeout(() => setHidden(true), 680);
      }, 320);
      prevState.current = "tearing";
      return () => clearTimeout(t1);
    }
    if (state === "attached") {
      setCls("");
      setHidden(false);
      prevState.current = "attached";
    }
  }, [state, seed]);

  if (hidden || state === "torn") return null;

  const isHighlighted = isLast && isRunning;

  return (
    <div className={cls} style={{ position: "relative", transformOrigin: "top center" }}>
      {/* Strip body */}
      <div style={{
        height: 38,
        background: isHighlighted
          ? "oklch(0.965 0.018 70)"
          : "oklch(0.978 0.010 74)",
        display: "flex",
        alignItems: "center",
        paddingLeft: 44,
        paddingRight: 10,
        position: "relative",
        borderBottom: isHighlighted ? "none" : "1px dashed oklch(0.88 0.014 68 / 0.6)",
        transition: "background 0.3s",
      }}>
        {/* Ruled line */}
        <div style={{
          position: "absolute", left: 44, right: 10, top: "50%",
          height: 1, background: "oklch(0.88 0.014 68)", opacity: 0.4,
        }} />
        {/* "Next to tear" dot indicator */}
        {isHighlighted && (
          <div style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            width: 7, height: 7, borderRadius: "50%",
            background: "oklch(0.52 0.10 32)",
            boxShadow: "0 0 5px oklch(0.52 0.10 32 / 0.5)",
          }} />
        )}
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9.5,
          letterSpacing: "0.08em",
          color: isHighlighted ? "oklch(0.30 0.020 55)" : "oklch(0.60 0.016 65)",
          fontWeight: isHighlighted ? 700 : 400,
          position: "relative", zIndex: 1,
          transition: "color 0.3s",
        }}>
          {text}
        </span>
        {/* Perforated right edge on highlighted strip */}
        {isHighlighted && (
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 4,
            background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, oklch(0.52 0.10 32 / 0.3) 3px, oklch(0.52 0.10 32 / 0.3) 5px)",
          }} />
        )}
      </div>
      {/* Jagged tear edge at the BOTTOM of the last remaining strip */}
      {isHighlighted && (
        <div style={{ position: "relative", zIndex: 2, marginTop: -1 }}>
          <JaggedBottomEdge width={260} seed={seed} />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface PaperTearTimerProps {
  durationMinutes?: number;
}

export function PaperTearTimer({ durationMinutes = 25 }: PaperTearTimerProps) {
  const totalSec = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"idle" | "running" | "paused" | "complete" | "recovering">("idle");
  const [tornCount, setTornCount] = useState(0);
  const [stripStates, setStripStates] = useState<Array<"attached" | "tearing" | "torn">>(
    STRIPS.map(() => "attached")
  );
  const [paperFlying, setPaperFlying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTornRef = useRef(0);

  const progress = (totalSec - remaining) / totalSec;
  const stripsToTear = Math.floor(progress * STRIPS.length);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  // Sync strip states — trigger tearing one at a time
  useEffect(() => {
    if (stripsToTear > prevTornRef.current && running) {
      const idx = prevTornRef.current;
      prevTornRef.current = stripsToTear;
      setStripStates(prev => prev.map((s, i) => {
        if (i < idx) return "torn";
        if (i === idx) return "tearing";
        return "attached";
      }));
      setTimeout(() => {
        setStripStates(prev => prev.map((s, i) => i <= idx ? "torn" : s));
        setTornCount(stripsToTear);
      }, 1100);
    }
  }, [stripsToTear, running]);

  const handleComplete = useCallback(() => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setPhase("complete");
    let delay = 0;
    for (let i = prevTornRef.current; i < STRIPS.length; i++) {
      const idx = i;
      setTimeout(() => {
        setStripStates(prev => prev.map((s, j) => j === idx ? "tearing" : s));
        setTimeout(() => {
          setStripStates(prev => prev.map((s, j) => j <= idx ? "torn" : s));
        }, 700);
      }, delay);
      delay += 150;
    }
    setTimeout(() => setPaperFlying(true), delay + 400);
  }, []);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { handleComplete(); return 0; }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running, handleComplete]);

  const handleStart = () => {
    if (phase === "complete" || phase === "recovering") return;
    setRunning(true);
    setPhase("running");
  };

  const handlePause = () => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setPhase("paused");
  };

  const handleQuit = () => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setPhase("recovering");
    setPaperFlying(false);
    prevTornRef.current = 0;
    setTimeout(() => {
      setRemaining(totalSec);
      setStripStates(STRIPS.map(() => "attached"));
      setTornCount(0);
      setPhase("idle");
    }, 500);
  };

  const handleNewSession = () => {
    setRemaining(totalSec);
    setStripStates(STRIPS.map(() => "attached"));
    setTornCount(0);
    setPaperFlying(false);
    prevTornRef.current = 0;
    setPhase("idle");
    setRunning(false);
  };

  const statusMsg = {
    idle: "start focusing — tear away the noise.",
    running: "tearing away the stress, one strip at a time…",
    paused: "paused — the paper waits.",
    complete: "all torn away. you did it. ✦",
    recovering: "recovering…",
  }[phase];

  // Last remaining (bottom-most visible) strip index
  const lastVisibleIdx = (() => {
    for (let i = STRIPS.length - 1; i >= 0; i--) {
      if (stripStates[i] === "attached") return i;
    }
    return -1;
  })();

  return (
    <div style={{
      background: "oklch(0.972 0.010 78)",
      border: "2px solid oklch(0.28 0.018 55)",
      boxShadow: "4px 4px 0px oklch(0.28 0.018 55)",
      borderRadius: 0,
      padding: "20px 20px 18px",
      fontFamily: "'Space Mono', monospace",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      position: "relative",
    }}>

      {/* Paper */}
      <div
        className={paperFlying ? "paper-fly-away" : ""}
        style={{
          width: 260,
          background: "oklch(0.985 0.008 76)",
          border: "1.5px solid oklch(0.72 0.018 65)",
          boxShadow: "3px 3px 0px oklch(0.72 0.018 65 / 0.5)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Red margin line */}
        <div style={{
          position: "absolute", left: 38, top: 0, bottom: 0, width: 1,
          background: "oklch(0.65 0.12 15)", opacity: 0.35, zIndex: 0,
        }} />

        {/* Header */}
        <div style={{
          padding: "14px 16px 10px",
          borderBottom: "1.5px solid oklch(0.82 0.018 68)",
          position: "relative",
          zIndex: 1,
          background: "oklch(0.985 0.008 76)",
        }}>
          {/* Ruled lines in header */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute", left: 16, right: 16,
              top: 26 + i * 13, height: 1,
              background: "oklch(0.88 0.014 68)", opacity: 0.45,
            }} />
          ))}
          <p style={{
            margin: 0, textAlign: "center",
            fontFamily: "'Space Mono', monospace",
            fontSize: 10, fontStyle: "italic",
            color: "oklch(0.45 0.020 60)", opacity: 0.75,
            letterSpacing: "0.06em",
            position: "relative", zIndex: 1,
          }}>
            things to let go of
          </p>
          <p style={{
            margin: "6px 0 0", textAlign: "center",
            fontFamily: "'Space Mono', monospace",
            fontSize: 28, fontWeight: 700, letterSpacing: "0.06em",
            color: remaining <= 60 ? "oklch(0.48 0.16 22)" : "oklch(0.30 0.020 55)",
            transition: "color 0.5s",
            position: "relative", zIndex: 1,
          }}>
            {mm}:{ss}
          </p>
        </div>

        {/* Strips */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {STRIPS.map((text, i) => (
            <TearStrip
              key={i}
              text={text}
              seed={i + 1}
              state={stripStates[i]}
              isLast={i === lastVisibleIdx}
              isRunning={running}
            />
          ))}
        </div>

        {/* Bottom edge — only when paper still has strips */}
        {lastVisibleIdx >= 0 && !running && (
          <div style={{
            height: 5,
            background: "oklch(0.88 0.014 68)",
            borderTop: "1px solid oklch(0.78 0.018 65)",
          }} />
        )}
      </div>

      {/* Status */}
      <p style={{
        fontSize: 9, color: "oklch(0.58 0.016 65)",
        fontFamily: "'Space Mono', monospace",
        fontStyle: "italic",
        textAlign: "center", margin: 0,
        letterSpacing: "0.04em", minHeight: 16,
      }}>
        {statusMsg}
      </p>

      {/* Progress bar — retro style */}
      <div style={{
        width: 260, height: 6,
        background: "oklch(0.90 0.012 70)",
        border: "1px solid oklch(0.78 0.018 65)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          background: "oklch(0.52 0.10 32)",
          width: `${progress * 100}%`,
          transition: "width 1s linear",
        }} />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {(running || phase === "paused") && (
          <button onClick={handleQuit} className="m-btn-secondary" style={{
            fontSize: 9, letterSpacing: "0.12em", padding: "5px 12px",
          }}>
            ↩ QUIT
          </button>
        )}

        {phase !== "complete" && phase !== "recovering" && (
          <button
            onClick={running ? handlePause : handleStart}
            className="m-btn-primary"
            style={{ fontSize: 9, letterSpacing: "0.14em", padding: "6px 20px" }}
          >
            {running ? "⏸ PAUSE" : phase === "paused" ? "▶ RESUME" : "▶ START"}
          </button>
        )}

        {phase === "complete" && (
          <button onClick={handleNewSession} className="m-btn-primary" style={{
            fontSize: 9, letterSpacing: "0.14em", padding: "6px 20px",
          }}>
            ✦ NEW SESSION
          </button>
        )}
      </div>

      {/* Strip count */}
      <p style={{
        fontSize: 9, color: "oklch(0.68 0.014 65)", margin: 0,
        letterSpacing: "0.10em", fontFamily: "'Space Mono', monospace",
      }}>
        {tornCount}/{STRIPS.length} STRIPS TORN
      </p>
    </div>
  );
}

export default PaperTearTimer;
