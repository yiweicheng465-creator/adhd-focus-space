/* ============================================================
   ADHD FOCUS SPACE — DailySplash
   Design: Dreamy aura gradient opening animation, shown once per day
   Inspired by the soft blurry aura reference images
   Fades in with floating orbs, then fades out after ~3.5s
   ============================================================ */

import { useEffect, useState } from "react";

const QUOTES = [
  { text: "If you're growing slow,\nyou're still growing.", author: "— Furaest Studio" },
  { text: "Your brain is not broken —\nit just works differently.", author: "" },
  { text: "One thing at a time.\nThat's enough.", author: "" },
  { text: "Progress, not perfection.", author: "" },
  { text: "Small steps still\nmove you forward.", author: "" },
];

function getTodayKey() {
  return `adhd-splash-${new Date().toDateString()}`;
}

export default function DailySplash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("in");
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  useEffect(() => {
    // in → hold after 0.8s
    const t1 = setTimeout(() => setPhase("hold"), 800);
    // hold → out after 3.2s
    const t2 = setTimeout(() => setPhase("out"), 3200);
    // out → done after 4.2s (1s fade-out)
    const t3 = setTimeout(() => {
      setPhase("done");
      onDone();
    }, 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  if (phase === "done") return null;

  const opacity = phase === "in" ? 0 : phase === "out" ? 0 : 1;
  const transition = phase === "in"
    ? "opacity 0.8s ease-out"
    : phase === "out"
    ? "opacity 1s ease-in"
    : "opacity 0.8s ease-out";

  return (
    <div
      onClick={() => { setPhase("out"); setTimeout(onDone, 1000); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        cursor: "pointer",
        overflow: "hidden",
        opacity,
        transition,
      }}
    >
      {/* Aura background */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <radialGradient id="sp-base" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#fdf0e8" />
            <stop offset="100%" stopColor="#f0e4d8" />
          </radialGradient>
          <radialGradient id="sp-rose" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e09090" stopOpacity="0.70" />
            <stop offset="55%" stopColor="#d07070" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#d07070" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sp-orange" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8935a" stopOpacity="0.65" />
            <stop offset="55%" stopColor="#e07840" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#e07840" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sp-gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d4a96a" stopOpacity="0.60" />
            <stop offset="55%" stopColor="#c49050" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#c49050" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sp-blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8b4b8" stopOpacity="0.50" />
            <stop offset="60%" stopColor="#dda0a4" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#dda0a4" stopOpacity="0" />
          </radialGradient>
          <filter id="sp-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="90" />
          </filter>
        </defs>

        {/* Base */}
        <rect width="800" height="900" fill="url(#sp-base)" />

        {/* Animated orbs */}
        <g filter="url(#sp-blur)">
          <ellipse cx="180" cy="160" rx="380" ry="340" fill="url(#sp-rose)">
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 40,25; -20,45; 0,0" dur="6s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" />
          </ellipse>
          <ellipse cx="620" cy="100" rx="320" ry="290" fill="url(#sp-orange)">
            <animateTransform attributeName="transform" type="translate"
              values="0,0; -30,35; 25,-20; 0,0" dur="7s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" />
          </ellipse>
          <ellipse cx="400" cy="820" rx="450" ry="280" fill="url(#sp-gold)">
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 50,-25; -35,15; 0,0" dur="8s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" />
          </ellipse>
          <ellipse cx="100" cy="750" rx="340" ry="260" fill="url(#sp-blush)">
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 25,-35; -15,25; 0,0" dur="9s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1" />
          </ellipse>
        </g>

        {/* Subtle grain */}
        <filter id="sp-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>
        <rect width="800" height="900" fill="transparent" filter="url(#sp-grain)" opacity="0.04" />
      </svg>

      {/* Text content */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "0 40px",
        textAlign: "center",
      }}>
        {/* App name */}
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.68rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "oklch(0.45 0.06 35 / 0.65)",
          marginBottom: 8,
        }}>
          ADHD Focus Space
        </div>

        {/* Quote */}
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(1.6rem, 5vw, 2.4rem)",
          fontWeight: 700,
          fontStyle: "italic",
          color: "oklch(0.28 0.025 35)",
          lineHeight: 1.35,
          whiteSpace: "pre-line",
          maxWidth: 480,
          textShadow: "0 1px 24px oklch(0.98 0.01 50 / 0.6)",
        }}>
          {quote.text}
        </div>

        {quote.author && (
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.78rem",
            color: "oklch(0.50 0.04 35 / 0.70)",
            letterSpacing: "0.04em",
          }}>
            {quote.author}
          </div>
        )}

        {/* Tap to continue hint */}
        <div style={{
          position: "absolute",
          bottom: 36,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.65rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "oklch(0.50 0.04 35 / 0.45)",
          animation: "pulse-hint 2s ease-in-out infinite",
        }}>
          Tap to continue
        </div>
      </div>

      <style>{`
        @keyframes pulse-hint {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

/** Returns true if the splash should be shown today */
export function shouldShowSplash(): boolean {
  try {
    return !localStorage.getItem(getTodayKey());
  } catch {
    return false;
  }
}

/** Mark today's splash as seen */
export function markSplashSeen(): void {
  try {
    localStorage.setItem(getTodayKey(), "1");
  } catch { /* ignore */ }
}
