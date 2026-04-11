/* ============================================================
   ADHD FOCUS SPACE — PaperTearTimer v4.0 (Peeling Strip)
   Design: The active strip looks like a physical paper strip
   that's been partially peeled off the page — raised with a
   drop shadow underneath, right corner curling up like a
   sticky note peeling off. Strips below sit flat on the page.
   Retro lo-fi: Space Mono, warm parchment, ruled lines.
   ============================================================ */

import { useEffect, useRef, useState } from "react";

// ── Inject keyframes once ─────────────────────────────────────────────────────
const STYLE_ID = "paper-peel-keyframes-v4";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes stripTearAway {
      0%   { transform: translateX(0) rotate(0deg) scaleY(1); opacity: 1; }
      15%  { transform: translateX(-8px) rotate(-1.5deg) scaleY(1.02); opacity: 1; }
      100% { transform: translateX(140%) rotate(-6deg) scaleY(0.7); opacity: 0; }
    }
    @keyframes stripShake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-3px); }
      40%     { transform: translateX(4px); }
      60%     { transform: translateX(-2px); }
      80%     { transform: translateX(2px); }
    }
    @keyframes curlPulse {
      0%,100% { transform: scale(1); }
      50%     { transform: scale(1.18); }
    }
    .strip-tearing { animation: stripTearAway 0.65s cubic-bezier(0.4,0,1,1) forwards; }
    .strip-shake   { animation: stripShake 0.25s ease-in-out; }
    .curl-pulse    { animation: curlPulse 2.8s ease-in-out infinite; }
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

const STRIP_H = 40; // px height per strip

// ── Single strip ──────────────────────────────────────────────────────────────
function TearStrip({
  text,
  index,
  state,
  isActive,
  progress,
}: {
  text: string;
  index: number;
  state: "attached" | "tearing" | "torn";
  isActive: boolean;
  progress: number; // 0..1 for active strip fill
}) {
  const [cls, setCls] = useState("");
  const [hidden, setHidden] = useState(false);
  const prevState = useRef(state);

  useEffect(() => {
    if (state === "tearing" && prevState.current !== "tearing") {
      setCls("strip-shake");
      const t1 = setTimeout(() => {
        setCls("strip-tearing");
        setTimeout(() => setHidden(true), 700);
      }, 260);
      prevState.current = "tearing";
      return () => clearTimeout(t1);
    }
    if (state === "attached") {
      setCls("");
      setHidden(false);
      prevState.current = "attached";
    }
  }, [state]);

  if (hidden || state === "torn") return null;

  // Colors
  const bgActive   = "oklch(0.972 0.014 70)";
  const bgInactive = "oklch(0.982 0.008 74)";
  const inkActive  = "oklch(0.28 0.022 55)";
  const inkInactive = "oklch(0.58 0.014 65)";
  const dotColor   = "oklch(0.52 0.10 32)";
  const ruleColor  = "oklch(0.88 0.012 68)";
  const marginColor = "oklch(0.65 0.12 15)";

  return (
    <div
      className={cls}
      style={{
        position: "relative",
        height: STRIP_H,
        transformOrigin: "left center",
        // Active strip is raised above the page with shadow
        zIndex: isActive ? 4 : 1,
        marginBottom: isActive ? 0 : 0,
      }}
    >
      {/* ── Strip body ── */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: isActive ? bgActive : bgInactive,
        // Active strip: elevated with shadow to look peeled off page
        boxShadow: isActive
          ? "0 3px 12px oklch(0.30 0.018 55 / 0.22), 0 1px 3px oklch(0.30 0.018 55 / 0.12)"
          : "none",
        borderBottom: `1px solid oklch(0.88 0.012 68 / 0.6)`,
        transition: "box-shadow 0.3s, background 0.3s",
        overflow: "hidden",
      }}>
        {/* Red margin line */}
        <div style={{
          position: "absolute",
          left: 34,
          top: 0,
          bottom: 0,
          width: 1,
          background: marginColor,
          opacity: 0.22,
        }} />
        {/* Ruled line */}
        <div style={{
          position: "absolute",
          left: 34,
          right: 0,
          top: "50%",
          height: 1,
          background: ruleColor,
          opacity: 0.35,
          transform: "translateY(-50%)",
        }} />

        {/* Progress fill for active strip */}
        {isActive && progress > 0 && (
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progress * 100}%`,
            background: "oklch(0.88 0.022 68 / 0.35)",
            transition: "width 1s linear",
            pointerEvents: "none",
          }} />
        )}
      </div>

      {/* ── Content ── */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        paddingLeft: 44,
        paddingRight: 28,
        zIndex: 2,
      }}>
        {/* Active dot */}
        {isActive && (
          <div style={{
            position: "absolute",
            left: 13,
            top: "50%",
            transform: "translateY(-50%)",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: dotColor,
            boxShadow: `0 0 5px ${dotColor}80`,
          }} />
        )}
        {/* Row number for inactive */}
        {!isActive && (
          <span style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "'Space Mono', monospace",
            fontSize: 8,
            color: inkInactive,
            opacity: 0.5,
          }}>
            {index + 1}
          </span>
        )}
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: isActive ? 10 : 9,
          letterSpacing: "0.07em",
          color: isActive ? inkActive : inkInactive,
          fontWeight: isActive ? 700 : 400,
          transition: "color 0.3s, font-size 0.2s",
        }}>
          {text}
        </span>
      </div>

      {/* ── Corner peel on active strip ── */}
      {isActive && (
        <div
          className="curl-pulse"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            zIndex: 10,
            pointerEvents: "none",
            transformOrigin: "bottom right",
          }}
        >
          {/* The peeled corner triangle */}
          <svg width={28} height={28} viewBox="0 0 28 28" style={{ display: "block" }}>
            <defs>
              <linearGradient id="peelGrad" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.022 68)" stopOpacity="1" />
                <stop offset="100%" stopColor="oklch(0.62 0.018 60)" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="peelShadow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.30 0.018 55)" stopOpacity="0.30" />
                <stop offset="100%" stopColor="oklch(0.30 0.018 55)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Shadow cast by the peeled corner onto the page */}
            <polygon points="4,28 28,4 28,28" fill="url(#peelShadow)" />
            {/* The peeled corner itself (lighter, curled-up paper) */}
            <polygon points="10,28 28,10 28,28" fill="url(#peelGrad)" />
            {/* Subtle highlight on the fold edge */}
            <line x1="10" y1="28" x2="28" y2="10" stroke="oklch(0.92 0.012 68)" strokeWidth="0.8" opacity="0.7" />
          </svg>
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
  const [phase, setPhase] = useState<"idle" | "running" | "paused" | "complete">("idle");
  const [tornCount, setTornCount] = useState(0);
  const [stripStates, setStripStates] = useState<Array<"attached" | "tearing" | "torn">>(
    STRIPS.map(() => "attached")
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTornRef = useRef(0);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");

  const allStrips = [...STRIPS, ...customItems];

  const progress = (totalSec - remaining) / totalSec;
  const stripsToTear = Math.min(Math.floor(progress * allStrips.length), allStrips.length);
  const stripProgress = (progress * allStrips.length) % 1;

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
      }, 1000);
    }
  }, [stripsToTear, running]);

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
      prevTornRef.current = 0;
      setStripStates(allStrips.map(() => "attached"));
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
    prevTornRef.current = 0;
    setStripStates(allStrips.map(() => "attached"));
    setPhase("idle");
  };

  const addItem = () => {
    const t = newItem.trim();
    if (!t) return;
    setCustomItems(c => [...c, t]);
    setStripStates(s => [...s, "attached"]);
    setNewItem("");
  };

  // Active strip index = first non-torn strip
  const activeIdx = stripStates.findIndex(s => s !== "torn");

  // Colors / tokens
  const C = {
    bg:       "oklch(0.968 0.016 72)",
    border:   "oklch(0.82 0.018 68)",
    ink:      "oklch(0.28 0.022 55)",
    muted:    "oklch(0.58 0.014 65)",
    accent:   "oklch(0.52 0.10 32)",
    shadow:   "oklch(0.28 0.018 55 / 0.15)",
  };

  return (
    <div style={{
      fontFamily: "'Space Mono', monospace",
      background: C.bg,
      border: `2px solid ${C.border}`,
      borderRadius: 4,
      boxShadow: `4px 4px 0 ${C.shadow}`,
      overflow: "hidden",
      userSelect: "none",
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: "10px 14px 8px",
        borderBottom: `1px solid ${C.border}`,
        background: "oklch(0.960 0.018 70)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 8, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>
            FOCUS TIMER
          </span>
          <button
            onClick={handleReset}
            style={{
              fontSize: 8, letterSpacing: "0.08em", color: C.muted,
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'Space Mono', monospace", textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            reset
          </button>
        </div>

        {/* Timer display */}
        <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
          <div style={{ fontSize: 8, letterSpacing: "0.1em", color: C.muted, marginBottom: 2 }}>
            things to let go of
          </div>
          <div style={{
            fontSize: 36,
            fontWeight: 700,
            color: C.accent,
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}>
            {mm}:{ss}
          </div>
        </div>
      </div>

      {/* ── Strip list ── */}
      <div style={{
        position: "relative",
        background: "oklch(0.978 0.010 74)",
        // Ruled notebook lines behind the strips
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent,
          transparent ${STRIP_H - 1}px,
          oklch(0.88 0.012 68 / 0.3) ${STRIP_H - 1}px,
          oklch(0.88 0.012 68 / 0.3) ${STRIP_H}px
        )`,
      }}>
        {allStrips.map((text, i) => {
          const s = stripStates[i] ?? "attached";
          const isActive = i === activeIdx;
          return (
            <TearStrip
              key={i}
              text={text}
              index={i}
              state={s}
              isActive={isActive}
              progress={isActive && running ? stripProgress : (isActive ? 0 : 0)}
            />
          );
        })}
      </div>

      {/* ── Add item ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderTop: `1px dashed ${C.border}`,
        background: "oklch(0.965 0.014 70)",
      }}>
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addItem()}
          placeholder="add something to let go of…"
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: C.ink,
            letterSpacing: "0.06em",
          }}
        />
        <button
          onClick={addItem}
          style={{
            width: 20, height: 20,
            background: C.accent,
            border: "none",
            borderRadius: 2,
            color: "oklch(0.97 0.010 70)",
            fontSize: 14,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >+</button>
      </div>

      {/* ── Footer / Start button ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderTop: `1px solid ${C.border}`,
        background: "oklch(0.960 0.018 70)",
      }}>
        <button
          onClick={handleStart}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 16px",
            background: phase === "complete" ? "oklch(0.52 0.10 145)" : C.accent,
            color: "oklch(0.97 0.010 70)",
            border: "none",
            borderRadius: 3,
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontWeight: 700,
            boxShadow: "2px 2px 0 oklch(0.30 0.018 55 / 0.20)",
          }}
        >
          {phase === "complete" ? "▶ AGAIN" : running ? "⏸ PAUSE" : "▶ START"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 4 }}>
            {allStrips.slice(0, Math.min(allStrips.length, 8)).map((_, i) => (
              <div key={i} style={{
                width: 6, height: 6,
                borderRadius: "50%",
                background: i < tornCount
                  ? C.accent
                  : i === activeIdx
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
        padding: "4px 12px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "space-between",
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
