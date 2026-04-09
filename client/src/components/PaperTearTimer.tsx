/* ============================================================
   ADHD FOCUS SPACE — PaperTearTimer Prototype
   Design: A notebook page. As you focus, bottom strips tear off
   one by one with a dramatic rip animation — sliding sideways
   and rotating off screen. The jagged tear edge stays visible
   on the remaining paper. Quit = paper recovers.
   Complete = whole page tears away in a cascade.

   Key fix: strips are HTML divs (not SVG <g>), so CSS transforms
   actually animate and strips truly disappear from the layout.
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from "react";

// ── Inject keyframes once ─────────────────────────────────────────────────────
const STYLE_ID = "paper-tear-keyframes";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes tearAway {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; max-height: 44px; }
      30%  { transform: translateY(8px) rotate(-2deg); opacity: 0.9; }
      100% { transform: translateY(120px) rotate(-18deg) translateX(-40px); opacity: 0; max-height: 0px; }
    }
    @keyframes tearAwayRight {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; max-height: 44px; }
      30%  { transform: translateY(8px) rotate(3deg); opacity: 0.9; }
      100% { transform: translateY(130px) rotate(22deg) translateX(50px); opacity: 0; max-height: 0px; }
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

// ── Jagged tear SVG edge ──────────────────────────────────────────────────────
function JaggedEdge({ width, seed, flip = false }: { width: number; seed: number; flip?: boolean }) {
  const h = 10;
  const steps = 24;
  const pts: string[] = [];
  if (!flip) {
    pts.push(`M 0 ${h}`);
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      const jag = (Math.sin(seed * 5.1 + i * 2.7) * 4 + Math.cos(seed * 3.3 + i * 1.9) * 3);
      pts.push(`L ${x} ${h + jag}`);
    }
    pts.push(`L ${width} 0 L 0 0 Z`);
  } else {
    pts.push(`M 0 0`);
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      const jag = (Math.sin(seed * 5.1 + i * 2.7) * 4 + Math.cos(seed * 3.3 + i * 1.9) * 3);
      pts.push(`L ${x} ${jag}`);
    }
    pts.push(`L ${width} ${h} L 0 ${h} Z`);
  }
  return (
    <svg
      width={width} height={h + 8}
      viewBox={`0 0 ${width} ${h + 8}`}
      style={{ display: "block", marginBottom: -1 }}
    >
      <path d={pts.join(" ")} fill="#F0E8DC" />
    </svg>
  );
}

// ── Single strip ──────────────────────────────────────────────────────────────
function TearStrip({
  text, seed, state, isNext,
}: {
  text: string; seed: number;
  state: "attached" | "tearing" | "torn";
  isNext: boolean;
}) {
  const [cls, setCls] = useState("");
  const [hidden, setHidden] = useState(false);
  const prevState = useRef(state);

  useEffect(() => {
    if (state === "tearing" && prevState.current !== "tearing") {
      // Brief shake first, then tear
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

  return (
    <div className={cls} style={{ position: "relative", transformOrigin: "center top" }}>
      {/* Jagged top edge — only shown when it's the next strip to be torn */}
      {isNext && (
        <div style={{ position: "relative", zIndex: 1 }}>
          <JaggedEdge width={260} seed={seed} />
        </div>
      )}
      {/* Strip body */}
      <div style={{
        height: 40,
        background: isNext
          ? "linear-gradient(90deg, #F5EDE0 0%, #EDE0D0 50%, #F5EDE0 100%)"
          : "#FAF6F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        borderBottom: "1px solid #E8DDD0",
        transition: "background 0.3s",
      }}>
        {/* Ruled line texture */}
        <div style={{
          position: "absolute", left: 0, right: 0, top: "50%",
          height: 1, background: "#EDE0D4", opacity: 0.6,
        }} />
        {/* "Next to tear" indicator */}
        {isNext && (
          <div style={{
            position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
            width: 6, height: 6, borderRadius: "50%",
            background: "#C8603A", opacity: 0.7,
            boxShadow: "0 0 6px #C8603A88",
          }} />
        )}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.09em",
          color: isNext ? "#5A3A2A" : "#9C8B7A",
          fontWeight: isNext ? 600 : 400,
          transition: "color 0.3s",
        }}>
          {text}
        </span>
        {/* Perforated right edge hint */}
        {isNext && (
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 3,
            background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 4px, #C8603A44 4px, #C8603A44 6px)",
          }} />
        )}
      </div>
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
      // Mark current strip as tearing
      setStripStates(prev => prev.map((s, i) => {
        if (i < idx) return "torn";
        if (i === idx) return "tearing";
        return "attached";
      }));
      // After animation, mark as torn
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
    // Cascade tear all remaining
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
    idle: "Start focusing — tear away the noise.",
    running: "Tearing away the stress, one strip at a time…",
    paused: "Paused — the paper waits.",
    complete: "All torn away. You did it. ✨",
    recovering: "Recovering…",
  }[phase];

  // Which strip is next to be torn
  const nextStripIdx = stripStates.findIndex(s => s === "attached");

  return (
    <div style={{
      background: "#FAF6F1",
      borderRadius: 16,
      padding: "24px 20px",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      minHeight: 480,
      position: "relative",
    }}>

      {/* Paper */}
      <div
        className={paperFlying ? "paper-fly-away" : ""}
        style={{
          width: 260,
          background: "#FDFAF6",
          borderRadius: 4,
          boxShadow: "0 4px 24px rgba(92,61,46,0.14), 0 1px 4px rgba(92,61,46,0.08)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Margin line */}
        <div style={{
          position: "absolute", left: 38, top: 0, bottom: 0, width: 1,
          background: "#F0A0A0", opacity: 0.4, zIndex: 0,
        }} />

        {/* Header */}
        <div style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid #E8DDD0",
          position: "relative",
          zIndex: 1,
          background: "#FDFAF6",
        }}>
          {/* Ruled lines in header */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute", left: 20, right: 20,
              top: 28 + i * 14, height: 1, background: "#EDE0D4", opacity: 0.5,
            }} />
          ))}
          <p style={{
            margin: 0, textAlign: "center",
            fontFamily: "'Playfair Display', serif",
            fontSize: 13, fontStyle: "italic",
            color: "#3D2B1F", opacity: 0.65,
            position: "relative", zIndex: 1,
          }}>
            things to let go of
          </p>
          <p style={{
            margin: "8px 0 0", textAlign: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 26, fontWeight: 700, letterSpacing: "0.04em",
            color: remaining <= 60 ? "#C0392B" : "#2A1F14",
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
              isNext={i === nextStripIdx && running}
            />
          ))}
        </div>

        {/* Bottom edge */}
        <div style={{ height: 6, background: "#E8DDD0" }} />
      </div>

      {/* Status */}
      <p style={{
        fontSize: 12, color: "#8C7B6B", fontStyle: "italic",
        textAlign: "center", margin: 0, letterSpacing: "0.02em", minHeight: 18,
      }}>
        {statusMsg}
      </p>

      {/* Progress bar */}
      <div style={{ width: 260, height: 4, background: "#E8DDD0", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", background: "#C8603A", borderRadius: 2,
          width: `${progress * 100}%`, transition: "width 1s linear",
        }} />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {(running || phase === "paused") && (
          <button onClick={handleQuit} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 14px", borderRadius: 999,
            background: "transparent", border: "1px solid #D4C4B0",
            color: "#8C7B6B", cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            letterSpacing: "0.12em",
          }}>
            ↩ QUIT
          </button>
        )}

        {phase !== "complete" && phase !== "recovering" && (
          <button
            onClick={running ? handlePause : handleStart}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 24px", borderRadius: 999,
              background: running ? "transparent" : "#2a1f14",
              border: "1px solid #2a1f14",
              color: running ? "#2a1f14" : "#FAF6F1",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              letterSpacing: "0.14em", cursor: "pointer",
              boxShadow: running ? "none" : "0 3px 0 #1a1208",
              transition: "all 0.1s",
            }}
          >
            {running ? "⏸ PAUSE" : phase === "paused" ? "▶ RESUME" : "▶ START"}
          </button>
        )}

        {phase === "complete" && (
          <button onClick={handleNewSession} style={{
            padding: "9px 24px", borderRadius: 999,
            background: "#8B9E7A", border: "none",
            color: "#fff", cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            letterSpacing: "0.14em",
          }}>
            ✦ NEW SESSION
          </button>
        )}
      </div>

      {/* Strip count */}
      <p style={{
        fontSize: 10, color: "#B0A090", margin: 0,
        letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace",
      }}>
        {tornCount}/{STRIPS.length} STRIPS TORN
      </p>
    </div>
  );
}

export default PaperTearTimer;
