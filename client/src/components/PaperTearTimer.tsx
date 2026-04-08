/* ============================================================
   ADHD FOCUS SPACE — PaperTearTimer Prototype
   Design: A piece of paper with "tasks/worries" written on it.
   As you focus, the bottom strips tear off one by one (like
   a tear-off flyer). Quit = paper recovers. Complete = whole
   page is torn away in a satisfying cascade.
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from "react";

// ── Tear strip content ────────────────────────────────────────────────────────
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

// ── Jagged tear path generator ────────────────────────────────────────────────
function makeTearPath(width: number, y: number, seed: number): string {
  const pts: string[] = [];
  const steps = 18;
  pts.push(`M 0 ${y}`);
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * width;
    // Pseudo-random jagged offset based on seed + position
    const jag = ((Math.sin(seed * 7.3 + i * 2.1) + Math.cos(seed * 3.7 + i * 1.4)) * 5.5);
    pts.push(`L ${x} ${y + jag}`);
  }
  pts.push(`L ${width} ${y} L ${width} ${y + 28} L 0 ${y + 28} Z`);
  return pts.join(" ");
}

// ── Paper texture lines ───────────────────────────────────────────────────────
function PaperLines({ width, height }: { width: number; height: number }) {
  const lines = [];
  for (let y = 32; y < height - 10; y += 22) {
    lines.push(
      <line key={y} x1={20} y1={y} x2={width - 20} y2={y}
        stroke="#E8E0D4" strokeWidth="0.8" strokeDasharray="none" />
    );
  }
  return <>{lines}</>;
}

// ── Single strip component ────────────────────────────────────────────────────
function TearStrip({
  text, width, y, seed, state, delay,
}: {
  text: string; width: number; y: number; seed: number;
  state: "attached" | "tearing" | "torn"; delay: number;
}) {
  const [visible, setVisible] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (state === "tearing" && !animating) {
      setAnimating(true);
      const t = setTimeout(() => {
        // Animate strip falling off
        setTranslateY(120);
        setRotate((seed % 3 - 1) * 15);
        setOpacity(0);
        setTimeout(() => setVisible(false), 600);
      }, delay);
      return () => clearTimeout(t);
    }
    if (state === "attached") {
      setVisible(true);
      setAnimating(false);
      setTranslateY(0);
      setRotate(0);
      setOpacity(1);
    }
  }, [state, delay, seed, animating]);

  if (!visible) return null;

  const tearTop = makeTearPath(width, 0, seed);
  const stripH = 28;

  return (
    <g
      transform={`translate(0, ${y}) translate(0, ${translateY}) rotate(${rotate}, ${width / 2}, ${stripH / 2})`}
      style={{ transition: "transform 0.55s cubic-bezier(0.4,0,1,1), opacity 0.55s", opacity }}
    >
      {/* Strip background */}
      <rect x={0} y={0} width={width} height={stripH} fill="#FAF6F0" />
      {/* Tear edge at top */}
      <path d={tearTop} fill="#F0E8DC" />
      {/* Subtle shadow line */}
      <line x1={0} y1={1} x2={width} y2={1} stroke="#D4C4B0" strokeWidth="0.6" />
      {/* Text */}
      <text
        x={width / 2} y={stripH * 0.68}
        textAnchor="middle"
        fontSize="9.5"
        fontFamily="'JetBrains Mono', monospace"
        letterSpacing="0.08em"
        fill="#8C7B6B"
        opacity="0.85"
      >
        {text}
      </text>
    </g>
  );
}

// ── Main PaperTearTimer ───────────────────────────────────────────────────────
interface PaperTearTimerProps {
  durationMinutes?: number;
}

export function PaperTearTimer({ durationMinutes = 25 }: PaperTearTimerProps) {
  const totalSec = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"idle" | "running" | "paused" | "complete" | "recovering">("idle");
  const [tornCount, setTornCount] = useState(0); // how many strips have been torn
  const [stripStates, setStripStates] = useState<Array<"attached" | "tearing" | "torn">>(
    STRIPS.map(() => "attached")
  );
  const [finalTear, setFinalTear] = useState(false); // whole paper tears away
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = (totalSec - remaining) / totalSec;
  const stripsToTear = Math.floor(progress * STRIPS.length);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  // Sync strip states with progress
  useEffect(() => {
    setStripStates(prev => prev.map((s, i) => {
      if (i < stripsToTear) return "torn";
      if (i === stripsToTear && running) return "tearing";
      return "attached";
    }));
    setTornCount(stripsToTear);
  }, [stripsToTear, running]);

  const handleComplete = useCallback(() => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setPhase("complete");
    // Tear all remaining strips in cascade
    setStripStates(STRIPS.map(() => "tearing"));
    setTimeout(() => setFinalTear(true), 1200);
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
    // Recover — strips fly back up
    clearInterval(intervalRef.current!);
    setRunning(false);
    setPhase("recovering");
    setFinalTear(false);
    // Animate recovery: reset all strips
    setTimeout(() => {
      setRemaining(totalSec);
      setStripStates(STRIPS.map(() => "attached"));
      setTornCount(0);
      setPhase("idle");
    }, 800);
  };

  const handleNewSession = () => {
    setRemaining(totalSec);
    setStripStates(STRIPS.map(() => "attached"));
    setTornCount(0);
    setFinalTear(false);
    setPhase("idle");
    setRunning(false);
  };

  // Paper dimensions
  const W = 260;
  const paperTop = 20;
  const headerH = 70; // area above strips
  const stripH = 28;
  const totalStripsH = STRIPS.length * stripH;
  const paperH = headerH + totalStripsH + 16;

  const statusMsg = {
    idle: "Start focusing — tear away the noise.",
    running: "Tearing away the stress, one strip at a time…",
    paused: "Paused — the paper waits. Keep going.",
    complete: "All torn away. You did it. ✨",
    recovering: "Recovering the paper…",
  }[phase];

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
      overflow: "hidden",
    }}>
      {/* Paper SVG */}
      <div style={{
        position: "relative",
        transform: finalTear ? "translateY(-120%) rotate(-8deg)" : "none",
        transition: finalTear ? "transform 0.9s cubic-bezier(0.4,0,0.2,1), opacity 0.9s" : "none",
        opacity: finalTear ? 0 : 1,
      }}>
        <svg
          width={W}
          height={paperH + paperTop}
          viewBox={`0 0 ${W} ${paperH + paperTop}`}
          style={{ display: "block", filter: "drop-shadow(0 4px 18px rgba(92,61,46,0.13))" }}
        >
          {/* Paper background */}
          <rect x={0} y={paperTop} width={W} height={paperH} rx={4} fill="#FDFAF6" />
          {/* Ruled lines */}
          <PaperLines width={W} height={paperH + paperTop} />
          {/* Red margin line */}
          <line x1={38} y1={paperTop + 8} x2={38} y2={paperTop + paperH - 8}
            stroke="#F0A0A0" strokeWidth="1.2" opacity="0.5" />
          {/* Header text */}
          <text x={W / 2} y={paperTop + 22} textAnchor="middle"
            fontFamily="'Playfair Display', serif" fontSize="13" fontStyle="italic"
            fill="#3D2B1F" opacity="0.7">
            things to let go of
          </text>
          <line x1={20} y1={paperTop + 30} x2={W - 20} y2={paperTop + 30}
            stroke="#D4C4B0" strokeWidth="0.8" />
          {/* Countdown in header */}
          <text x={W / 2} y={paperTop + 56} textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace" fontSize="22" fontWeight="700"
            fill={remaining <= 60 ? "#C0392B" : "#3D2B1F"}
            style={{ transition: "fill 0.5s" }}>
            {mm}:{ss}
          </text>

          {/* Tear strips */}
          {STRIPS.map((text, i) => (
            <TearStrip
              key={i}
              text={text}
              width={W}
              y={paperTop + headerH + i * stripH}
              seed={i + 1}
              state={stripStates[i]}
              delay={i * 120}
            />
          ))}

          {/* Bottom edge of paper */}
          <rect x={0} y={paperTop + paperH - 4} width={W} height={4} rx={2} fill="#E8DDD0" />
        </svg>
      </div>

      {/* Status message */}
      <p style={{
        fontSize: 12, color: "#8C7B6B", fontStyle: "italic",
        textAlign: "center", margin: 0, letterSpacing: "0.02em",
        minHeight: 18,
      }}>
        {statusMsg}
      </p>

      {/* Progress bar */}
      <div style={{ width: W, height: 4, background: "#E8DDD0", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", background: "#C8603A", borderRadius: 2,
          width: `${progress * 100}%`, transition: "width 1s linear",
        }} />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Quit */}
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

        {/* Start / Pause / Resume */}
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

        {/* New session after complete */}
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
      <p style={{ fontSize: 10, color: "#B0A090", margin: 0, letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace" }}>
        {tornCount}/{STRIPS.length} STRIPS TORN
      </p>
    </div>
  );
}

export default PaperTearTimer;
