/* ============================================================
   ADHD FOCUS SPACE — PaperTearTimer v3.0 (Horizontal Rip)
   Design: Each strip has a horizontal torn-paper opening that
   reveals the text inside. The tear starts from the right and
   expands left as the strip becomes "active". Ragged torn edges
   on both top and bottom of the opening, like ripping a strip
   off a notebook page.
   Retro lo-fi: Space Mono, warm parchment, thick border, 3D shadow.
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from "react";

// ── Inject keyframes once ─────────────────────────────────────────────────────
const STYLE_ID = "paper-tear-keyframes-v3";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes tearRipRight {
      0%   { transform: translateX(0) rotate(0deg) scaleY(1); opacity: 1; }
      20%  { transform: translateX(10px) rotate(2deg) scaleY(0.98); opacity: 0.95; }
      100% { transform: translateX(160px) rotate(8deg) scaleY(0.6); opacity: 0; }
    }
    @keyframes stripShakeH {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-4px); }
      40%     { transform: translateX(5px); }
      60%     { transform: translateX(-3px); }
      80%     { transform: translateX(3px); }
    }
    @keyframes paperFlyAway {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(-160%) rotate(-12deg); opacity: 0; }
    }
    @keyframes ripExpand {
      0%   { clip-path: inset(0 100% 0 0); }
      100% { clip-path: inset(0 0% 0 0); }
    }
    .strip-tearing    { animation: tearRipRight 0.7s cubic-bezier(0.4,0,1,1) forwards; }
    .strip-shake      { animation: stripShakeH 0.28s ease-in-out; }
    .paper-fly-away   { animation: paperFlyAway 0.9s cubic-bezier(0.4,0,0.2,1) forwards; }
    .rip-reveal       { animation: ripExpand 0.45s cubic-bezier(0.2,0,0.4,1) forwards; }
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

const STRIP_H = 42; // px height of each strip

// ── Generate a jagged vertical path (for right-side tear) ────────────────────
// Returns an SVG path string that zigzags vertically along x = tearX
function jaggedVerticalPath(
  tearX: number,
  height: number,
  seed: number,
  amplitude = 5
): string {
  const steps = 24;
  const pts: string[] = [`M ${tearX} 0`];
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * height;
    const jag =
      Math.sin(seed * 3.7 + i * 2.3) * amplitude +
      Math.cos(seed * 5.1 + i * 1.7) * (amplitude * 0.5);
    pts.push(`L ${tearX + jag} ${y}`);
  }
  return pts.join(" ");
}

// ── Torn paper overlay — right-side vertical rip ─────────────────────────────
// The paper covers the RIGHT portion of the strip (from tearX to the right).
// The jagged vertical edge at tearX is the torn right edge.
// revealed = 0 → fully covered (tearX = 0, nothing visible)
// revealed = 1 → fully revealed (tearX = width, all content visible)
function TornPaperOverlay({
  width,
  height,
  seed,
  revealed,
}: {
  width: number;
  height: number;
  seed: number;
  revealed: number;
}) {
  // tearX is how far from the LEFT the paper has been torn away
  // revealed=0 → tearX=0 (paper covers everything)
  // revealed=1 → tearX=width (paper fully gone)
  const tearX = width * revealed;
  const amp = 5;

  // Jagged vertical path at tearX
  const jagPath = jaggedVerticalPath(tearX, height, seed, amp);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 3,
      }}
    >
      {/* Paper covers from tearX to the right */}
      {revealed < 1 && (
        <path
          d={`${jagPath} L ${width} ${height} L ${width} 0 Z`}
          fill="oklch(0.978 0.010 74)"
        />
      )}
      {/* Jagged torn edge highlight — thin warm shadow on the rip */}
      {revealed > 0 && revealed < 1 && (
        <>
          <path
            d={jagPath}
            fill="none"
            stroke="oklch(0.70 0.025 65)"
            strokeWidth="1.5"
            opacity={0.5}
          />
          {/* Curl/shadow strip just to the right of the tear */}
          <path
            d={`${jagPath} L ${tearX + 8} ${height} L ${tearX + 8} 0 Z`}
            fill="oklch(0.55 0.018 60 / 0.10)"
          />
        </>
      )}
    </svg>
  );
}

// ── Single strip ──────────────────────────────────────────────────────────────
function TearStrip({
  text,
  seed,
  state,
  isLast,
  isRunning,
  revealProgress, // 0..1 for the currently-active strip
}: {
  text: string;
  seed: number;
  state: "attached" | "tearing" | "torn";
  isLast: boolean;
  isRunning: boolean;
  revealProgress: number;
}) {
  const [cls, setCls] = useState("");
  const [hidden, setHidden] = useState(false);
  const prevState = useRef(state);

  useEffect(() => {
    if (state === "tearing" && prevState.current !== "tearing") {
      setCls("strip-shake");
      const t1 = setTimeout(() => {
        setCls("strip-tearing");
        setTimeout(() => setHidden(true), 720);
      }, 290);
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

  const isActive = isLast;
  // When idle/paused: show fully open rip (revealed=1) so the effect is always visible.
  // When running: animate from current stripProgress (0→1 as the strip interval elapses).
  // Non-active strips (already torn or not yet active) stay covered (revealed=0).
  const revealed = isLast
    ? (isRunning ? revealProgress : 1)
    : 0;

  return (
    <div
      className={cls}
      style={{
        position: "relative",
        height: STRIP_H,
        transformOrigin: "center right",
        overflow: "visible",
      }}
    >
      {/* Strip background — the "inside" of the torn paper */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: isActive
          ? "oklch(0.968 0.016 70)"
          : "oklch(0.978 0.010 74)",
        borderBottom: "1px dashed oklch(0.88 0.014 68 / 0.5)",
        transition: "background 0.3s",
      }}>
        {/* Red margin line */}
        <div style={{
          position: "absolute",
          left: 36,
          top: 0,
          bottom: 0,
          width: 1,
          background: "oklch(0.65 0.12 15)",
          opacity: 0.25,
        }} />
        {/* Ruled lines */}
        <div style={{
          position: "absolute",
          left: 36,
          right: 10,
          top: "50%",
          height: 1,
          background: "oklch(0.88 0.014 68)",
          opacity: 0.4,
          transform: "translateY(-50%)",
        }} />
      </div>

      {/* Content — shown through the torn opening */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        paddingLeft: 44,
        paddingRight: 12,
        zIndex: 2,
      }}>
        {/* Active dot */}
        {isActive && (
          <div style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "oklch(0.52 0.10 32)",
            boxShadow: "0 0 5px oklch(0.52 0.10 32 / 0.5)",
          }} />
        )}
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9.5,
          letterSpacing: "0.08em",
          color: isActive ? "oklch(0.30 0.020 55)" : "oklch(0.60 0.016 65)",
          fontWeight: isActive ? 700 : 400,
          transition: "color 0.3s",
        }}>
          {text}
        </span>
      </div>

      {/* Torn paper overlay — covers the strip, revealing content through the rip */}
      <TornPaperOverlay
        width={260}
        height={STRIP_H}
        seed={seed}
        revealed={revealed}
      />
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

  // Progress within the current strip (0..1)
  const stripProgress = (progress * STRIPS.length) % 1;

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  // Sync strip states
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
      delay += 140;
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
    idle: "start focusing — rip away the noise.",
    running: "tearing through the stress…",
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
          position: "absolute", left: 36, top: 0, bottom: 0, width: 1,
          background: "oklch(0.65 0.12 15)", opacity: 0.3, zIndex: 0,
        }} />

        {/* Header */}
        <div style={{
          padding: "14px 16px 10px",
          borderBottom: "1.5px solid oklch(0.82 0.018 68)",
          position: "relative",
          zIndex: 1,
          background: "oklch(0.985 0.008 76)",
        }}>
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
              revealProgress={i === lastVisibleIdx && running ? stripProgress : 0}
            />
          ))}
        </div>

        {/* Bottom edge */}
        {lastVisibleIdx >= 0 && (
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

      {/* Progress bar */}
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
