/* ============================================================
   ADHD FOCUS SPACE — PaperTearTimer v5.0
   Effect: Jagged vertical tear on the RIGHT side of the active
   strip. The tear progresses from BOTTOM to TOP as the timer
   runs. When complete, the strip tears away right-to-left.
   Matches the reference screenshot exactly.
   ============================================================ */

import { useEffect, useRef, useState } from "react";

// ── Inject keyframes once ─────────────────────────────────────────────────────
const STYLE_ID = "paper-tear-v5-keyframes";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes tearAway {
      0%   { transform: translateX(0) rotate(0deg); opacity: 1; }
      20%  { transform: translateX(-6px) rotate(-0.8deg); opacity: 1; }
      100% { transform: translateX(-110%) rotate(-3deg); opacity: 0; }
    }
    .strip-tear-away {
      animation: tearAway 0.55s cubic-bezier(0.4,0,0.9,1) forwards;
    }
  `;
  document.head.appendChild(s);
}

// ── Strip data ────────────────────────────────────────────────────────────────
const DEFAULT_STRIPS = [
  "overthinking",
  "email backlog",
  "that awkward thing",
  "yesterday's worries",
  "the meeting dread",
  "unread messages",
  "tomorrow's anxiety",
  "the mental noise",
];

// ── Jagged SVG tear path generator ───────────────────────────────────────────
// Generates a jagged vertical path for the right edge of the strip.
// The tear is revealed from bottom (y=height) to top (y=0) based on `revealFraction` (0..1).
// revealFraction=0 → full paper (no tear visible), =1 → full tear visible
function buildTearPath(
  w: number,
  h: number,
  revealFraction: number,
  seed: number
): string {
  // The tear edge is a fixed jagged path. We clip it from bottom to top.
  // We generate a deterministic jagged path based on seed.
  const tearX = w - 18; // where the tear starts (from right)
  const steps = 14;
  const stepH = h / steps;

  // Build jagged points along the tear edge
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const y = i * stepH;
    // Pseudo-random offset based on seed + step
    const rand = Math.sin(seed * 7.3 + i * 2.9) * 0.5 + 0.5;
    const x = tearX + (rand * 14 - 4); // jag between -4 and +10 from tearX
    pts.push([x, y]);
  }

  // The revealed portion: from y=h down to y = h*(1-revealFraction)
  const revealTop = h * (1 - revealFraction);

  // SVG polygon: right side of strip (torn away part) is hidden
  // We draw the "remaining paper" as a clip path
  // Shape: left edge top → tear edge (from top to revealTop) → straight right edge → bottom right → bottom left → back
  // Actually we draw the OVERLAY that covers the right portion that hasn't been torn yet

  // Overlay covers: from tearX to right, from top to bottom, EXCEPT the revealed tear area
  // Revealed area = bottom portion (from revealTop to h)

  // Overlay polygon:
  // top-left of overlay (tearX, 0) → top-right (w, 0) → bottom-right (w, h) → bottom-left of overlay (tearX, h)
  // But we cut out the jagged tear edge and the revealed bottom portion

  // Build the overlay path:
  // Start at (w, 0), go to (w, h), then along the jagged edge from bottom to revealTop,
  // then straight across to (w, revealTop) ... actually let's think differently.

  // The overlay (dark paper covering right portion) shape:
  // - Covers the right side of the strip
  // - Has a jagged LEFT edge (the tear)
  // - The bottom `revealFraction` of the tear has been torn away (not covered)

  // Path: start top-right → top of jagged edge → down jagged edge to revealTop → 
  //        straight right to right edge at revealTop → down right edge to bottom → 
  //        but bottom portion is revealed, so we stop at revealTop

  if (revealFraction <= 0) {
    // Full overlay: rectangle from tearX to w, full height
    return `M ${tearX} 0 L ${w} 0 L ${w} ${h} L ${tearX} ${h} Z`;
  }

  if (revealFraction >= 1) {
    // No overlay
    return "";
  }

  // Partial: overlay from top to revealTop, with jagged left edge
  // Top-right corner
  let d = `M ${w} 0 `;
  // Top of jagged edge (y=0)
  d += `L ${pts[0][0]} ${pts[0][1]} `;
  // Down the jagged edge to revealTop
  for (let i = 1; i <= steps; i++) {
    const [px, py] = pts[i];
    if (py >= revealTop) {
      // Interpolate to exact revealTop
      const [px0, py0] = pts[i - 1];
      const t = (revealTop - py0) / (py - py0);
      const ix = px0 + t * (px - px0);
      d += `L ${ix} ${revealTop} `;
      break;
    }
    d += `L ${px} ${py} `;
  }
  // Right edge back up to top
  d += `L ${w} ${revealTop} L ${w} 0 Z`;
  return d;
}

// ── Single strip component ────────────────────────────────────────────────────
function TearStrip({
  text,
  index,
  isActive,
  isTorn,
  isTearing,
  progress, // 0..1, how much of THIS strip's interval has elapsed
  seed,
}: {
  text: string;
  index: number;
  isActive: boolean;
  isTorn: boolean;
  isTearing: boolean;
  progress: number;
  seed: number;
}) {
  const [hidden, setHidden] = useState(false);
  const [tearClass, setTearClass] = useState("");
  const prevTearing = useRef(false);

  useEffect(() => {
    if (isTearing && !prevTearing.current) {
      prevTearing.current = true;
      setTearClass("strip-tear-away");
      setTimeout(() => setHidden(true), 600);
    }
    if (!isTearing && !isTorn) {
      prevTearing.current = false;
      setTearClass("");
      setHidden(false);
    }
  }, [isTearing, isTorn]);

  if (hidden || isTorn) return null;

  const STRIP_H = 42;
  const STRIP_W = 500; // large enough, SVG viewBox scales

  // Colors
  const bgColor   = isActive ? "oklch(0.975 0.012 72)" : "oklch(0.982 0.008 74)";
  const inkActive  = "oklch(0.28 0.022 55)";
  const inkMuted   = "oklch(0.62 0.012 68)";
  const dotColor   = "oklch(0.48 0.12 30)";
  const tearColor  = "oklch(0.88 0.018 68)"; // torn paper edge color
  const ruleColor  = "oklch(0.88 0.012 68)";
  const marginColor = "oklch(0.62 0.12 15)";

  const revealFraction = isActive ? progress : 0;
  const tearPath = buildTearPath(STRIP_W, STRIP_H, revealFraction, seed);

  return (
    <div
      className={tearClass}
      style={{
        position: "relative",
        height: STRIP_H,
        overflow: "hidden",
        borderBottom: `1px solid ${ruleColor}`,
        background: bgColor,
        zIndex: isActive ? 3 : 1,
        // Active strip: subtle lift
        boxShadow: isActive
          ? "0 2px 8px oklch(0.30 0.018 55 / 0.18)"
          : "none",
        transition: "box-shadow 0.3s",
        transformOrigin: "right center",
      }}
    >
      {/* Red margin line */}
      <div style={{
        position: "absolute", left: 32, top: 0, bottom: 0,
        width: 1, background: marginColor, opacity: 0.18, zIndex: 1,
      }} />

      {/* Content */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center",
        paddingLeft: 42, paddingRight: 24,
        zIndex: 2,
      }}>
        {isActive ? (
          <div style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)",
            width: 8, height: 8, borderRadius: "50%",
            background: dotColor,
            boxShadow: `0 0 6px ${dotColor}88`,
          }} />
        ) : (
          <span style={{
            position: "absolute", left: 13, top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "'Space Mono', monospace",
            fontSize: 8, color: inkMuted, opacity: 0.5,
          }}>{index + 1}</span>
        )}
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: isActive ? 10.5 : 9,
          letterSpacing: "0.07em",
          color: isActive ? inkActive : inkMuted,
          fontWeight: isActive ? 700 : 400,
        }}>
          {text}
        </span>
      </div>

      {/* SVG tear overlay — covers the right portion that hasn't been torn yet */}
      {isActive && tearPath && (
        <svg
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            zIndex: 4, pointerEvents: "none",
          }}
          viewBox={`0 0 ${STRIP_W} ${STRIP_H}`}
          preserveAspectRatio="none"
        >
          {/* Shadow under the tear edge */}
          <path
            d={tearPath}
            fill="oklch(0.30 0.018 55 / 0.12)"
            transform="translate(3, 0)"
          />
          {/* The paper overlay (right portion not yet torn) */}
          <path
            d={tearPath}
            fill={bgColor}
            stroke={tearColor}
            strokeWidth="1.5"
          />
          {/* Highlight on the torn edge */}
          {revealFraction > 0 && revealFraction < 1 && (() => {
            // Draw just the jagged edge line at the tear boundary
            const h = STRIP_H;
            const steps = 14;
            const stepH = h / steps;
            const tearX = STRIP_W - 18;
            const revealTop = h * (1 - revealFraction);
            let linePath = "";
            for (let i = 0; i <= steps; i++) {
              const y = i * stepH;
              const rand = Math.sin(seed * 7.3 + i * 2.9) * 0.5 + 0.5;
              const x = tearX + (rand * 14 - 4);
              if (y >= revealTop - 1) {
                linePath += (linePath ? ` L ${x} ${y}` : `M ${x} ${y}`);
              }
              if (y > revealTop + stepH) break;
            }
            return (
              <path
                d={linePath}
                fill="none"
                stroke="oklch(0.92 0.012 68)"
                strokeWidth="1"
                opacity="0.6"
              />
            );
          })()}
        </svg>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface PaperTearTimerProps {
  durationMinutes?: number;
  compact?: boolean; // for dashboard use
}

export function PaperTearTimer({ durationMinutes = 25, compact = false }: PaperTearTimerProps) {
  const totalSec = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"idle" | "running" | "paused" | "complete">("idle");
  const [tornCount, setTornCount] = useState(0);
  const [tearing, setTearing] = useState<number | null>(null);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTornRef = useRef(0);

  const allStrips = [...DEFAULT_STRIPS, ...customItems];
  const stripSeeds = useRef(allStrips.map((_, i) => i + 1.5));

  const elapsed = totalSec - remaining;
  const progress = elapsed / totalSec; // 0..1 overall
  const stripsPerSec = allStrips.length / totalSec;
  const currentStripFloat = progress * allStrips.length;
  const activeIdx = Math.min(Math.floor(currentStripFloat), allStrips.length - 1);
  const stripProgress = currentStripFloat - Math.floor(currentStripFloat); // 0..1 within active strip

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  // Detect strip transitions
  useEffect(() => {
    if (!running) return;
    const newTornCount = Math.floor(currentStripFloat);
    if (newTornCount > prevTornRef.current) {
      const idx = prevTornRef.current;
      prevTornRef.current = newTornCount;
      setTearing(idx);
      setTimeout(() => {
        setTearing(null);
        setTornCount(newTornCount);
      }, 600);
    }
  }, [currentStripFloat, running]);

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setPhase("complete");
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleStart = () => {
    if (phase === "complete") {
      setRemaining(totalSec);
      setTornCount(0);
      setTearing(null);
      prevTornRef.current = 0;
      setPhase("running");
      setRunning(true);
    } else {
      setPhase(running ? "paused" : "running");
      setRunning(r => !r);
    }
  };

  const handleReset = () => {
    setRunning(false);
    setRemaining(totalSec);
    setTornCount(0);
    setTearing(null);
    prevTornRef.current = 0;
    setPhase("idle");
  };

  const addItem = () => {
    const t = newItem.trim();
    if (!t) return;
    setCustomItems(c => [...c, t]);
    stripSeeds.current.push(stripSeeds.current.length + 1.5);
    setNewItem("");
  };

  // Colors
  const C = {
    bg:      "oklch(0.968 0.016 72)",
    border:  "oklch(0.82 0.018 68)",
    ink:     "oklch(0.28 0.022 55)",
    muted:   "oklch(0.58 0.014 65)",
    accent:  "oklch(0.48 0.12 30)",
    rule:    "oklch(0.88 0.012 68)",
  };

  return (
    <div style={{
      fontFamily: "'Space Mono', monospace",
      background: C.bg,
      border: `2px solid ${C.border}`,
      borderRadius: 3,
      boxShadow: `3px 3px 0 oklch(0.30 0.018 55 / 0.12)`,
      overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: compact ? "8px 12px 6px" : "10px 14px 8px",
        borderBottom: `1px solid ${C.border}`,
        background: "oklch(0.960 0.018 70)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 7.5, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase" }}>
            things to let go of
          </span>
          <button onClick={handleReset} style={{
            fontSize: 7.5, letterSpacing: "0.08em", color: C.muted,
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'Space Mono', monospace", textTransform: "uppercase", opacity: 0.7,
          }}>reset</button>
        </div>
        {/* Timer */}
        <div style={{ textAlign: "center", padding: compact ? "4px 0 2px" : "6px 0 2px" }}>
          <div style={{
            fontSize: compact ? 28 : 36,
            fontWeight: 700,
            color: C.accent,
            letterSpacing: "0.06em",
            lineHeight: 1,
            fontFamily: "'Space Mono', monospace",
          }}>
            {mm}:{ss}
          </div>
        </div>
        {/* Ruled lines decoration */}
        {[0,1,2].map(i => (
          <div key={i} style={{
            height: 1, background: C.rule, opacity: 0.25,
            marginTop: i === 0 ? 6 : 3,
          }} />
        ))}
      </div>

      {/* ── Strip list ── */}
      <div style={{
        background: "oklch(0.978 0.010 74)",
        position: "relative",
        // Notebook ruled lines behind strips
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent 41px,
          oklch(0.88 0.012 68 / 0.25) 41px,
          oklch(0.88 0.012 68 / 0.25) 42px
        )`,
      }}>
        {allStrips.map((text, i) => (
          <TearStrip
            key={i}
            text={text}
            index={i}
            isActive={i === activeIdx && (running || phase === "paused")}
            isTorn={i < tornCount}
            isTearing={tearing === i}
            progress={i === activeIdx && running ? stripProgress : (i === activeIdx && phase === "paused" ? stripProgress : 0)}
            seed={stripSeeds.current[i] ?? i + 1.5}
          />
        ))}
        {/* Idle state: show first strip as active with no progress */}
        {phase === "idle" && allStrips.map((text, i) => i === 0 ? null : null)}
      </div>

      {/* ── Add item ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "7px 12px",
        borderTop: `1px dashed ${C.border}`,
        background: "oklch(0.965 0.014 70)",
      }}>
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addItem()}
          placeholder="add something to let go of…"
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: C.ink, letterSpacing: "0.06em",
          }}
        />
        <button onClick={addItem} style={{
          width: 20, height: 20, background: C.accent, border: "none",
          borderRadius: 2, color: "oklch(0.97 0.010 70)", fontSize: 14,
          lineHeight: 1, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>+</button>
      </div>

      {/* ── Footer ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 12px",
        borderTop: `1px solid ${C.border}`,
        background: "oklch(0.960 0.018 70)",
      }}>
        <button onClick={handleStart} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 16px",
          background: phase === "complete" ? "oklch(0.52 0.10 145)" : C.accent,
          color: "oklch(0.97 0.010 70)",
          border: "none", borderRadius: 3,
          fontFamily: "'Space Mono', monospace",
          fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
          cursor: "pointer", fontWeight: 700,
          boxShadow: "2px 2px 0 oklch(0.30 0.018 55 / 0.20)",
        }}>
          {phase === "complete" ? "▶ AGAIN" : running ? "⏸ PAUSE" : "▶ START"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 3 }}>
            {allStrips.slice(0, 8).map((_, i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%",
                background: i < tornCount
                  ? C.accent
                  : i === activeIdx && running
                    ? "oklch(0.72 0.040 68)"
                    : "oklch(0.84 0.014 68)",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
          <span style={{ fontSize: 8, color: C.muted, letterSpacing: "0.06em" }}>
            {tornCount}/{allStrips.length}
          </span>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={{
        padding: "3px 12px",
        borderTop: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between",
        background: "oklch(0.955 0.016 70)",
      }}>
        <span style={{ fontSize: 7.5, color: C.muted, letterSpacing: "0.08em" }}>
          {durationMinutes} MIN · FOCUS
        </span>
        <span style={{ fontSize: 7.5, color: C.muted, letterSpacing: "0.08em" }}>
          {tornCount}/{allStrips.length} STRIPS TORN
        </span>
      </div>
    </div>
  );
}
