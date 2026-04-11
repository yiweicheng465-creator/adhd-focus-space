/* ============================================================
   ADHD FOCUS SPACE — Film Grain Overlay
   Intensity-controlled canvas noise layer (0 = off, 100 = heavy).
   Persisted to localStorage under "adhd-film-grain-intensity".
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from "react";

const LS_KEY = "adhd-film-grain-intensity";
const DEFAULT_INTENSITY = 40; // default: noticeable but not heavy

/* ── Shared hook ── */
export function useFilmGrain() {
  const [intensity, setIntensityState] = useState<number>(() => {
    try {
      const v = parseInt(localStorage.getItem(LS_KEY) ?? "", 10);
      return isNaN(v) ? DEFAULT_INTENSITY : Math.max(0, Math.min(100, v));
    } catch {
      return DEFAULT_INTENSITY;
    }
  });

  const setIntensity = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setIntensityState(clamped);
    try { localStorage.setItem(LS_KEY, String(clamped)); } catch {}
    window.dispatchEvent(new CustomEvent("adhd-grain-intensity", { detail: clamped }));
  }, []);

  // Listen for external changes
  useEffect(() => {
    const handler = (e: Event) => setIntensityState((e as CustomEvent<number>).detail);
    window.addEventListener("adhd-grain-intensity", handler);
    return () => window.removeEventListener("adhd-grain-intensity", handler);
  }, []);

  return { intensity, setIntensity, enabled: intensity > 0 };
}

/* ── Canvas film grain overlay ── */
export function FilmGrainOverlay() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const intensityRef = useRef<number>(DEFAULT_INTENSITY);

  const [intensity, setIntensityState] = useState<number>(() => {
    try {
      const v = parseInt(localStorage.getItem(LS_KEY) ?? "", 10);
      return isNaN(v) ? DEFAULT_INTENSITY : Math.max(0, Math.min(100, v));
    } catch { return DEFAULT_INTENSITY; }
  });

  // Keep ref in sync so drawGrain always reads latest value without re-running effect
  useEffect(() => { intensityRef.current = intensity; }, [intensity]);

  // Sync with external changes
  useEffect(() => {
    const handler = (e: Event) => {
      const val = (e as CustomEvent<number>).detail;
      setIntensityState(val);
    };
    window.addEventListener("adhd-grain-intensity", handler);
    return () => window.removeEventListener("adhd-grain-intensity", handler);
  }, []);

  // Start/stop the animation loop once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;

    function resize() {
      if (!canvas) return;
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const GRAIN_SIZE = 3; // 3×3 blocks for chunky film-grain look

    function drawGrain() {
      const lvl = intensityRef.current;
      if (!ctx || !canvas) { rafRef.current = requestAnimationFrame(drawGrain); return; }

      if (lvl === 0) {
        ctx.clearRect(0, 0, w, h);
        rafRef.current = requestAnimationFrame(drawGrain);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      // Map intensity 1–100 → alpha range
      // At 1:  max alpha ≈ 0.04  (barely visible)
      // At 50: max alpha ≈ 0.22  (noticeable)
      // At 100: max alpha ≈ 0.55 (heavy grain)
      const maxAlpha = (lvl / 100) * 0.55;
      const minAlpha = maxAlpha * 0.3;

      const cols = Math.ceil(w / GRAIN_SIZE);
      const rows = Math.ceil(h / GRAIN_SIZE);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const v = (Math.random() * 255) | 0;
          const a = minAlpha + Math.random() * (maxAlpha - minAlpha);
          ctx.fillStyle = `rgba(${v},${v},${v},${a.toFixed(3)})`;
          ctx.fillRect(col * GRAIN_SIZE, row * GRAIN_SIZE, GRAIN_SIZE, GRAIN_SIZE);
        }
      }
      rafRef.current = requestAnimationFrame(drawGrain);
    }

    drawGrain();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []); // run once — intensity is read via ref

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      "fixed",
        inset:         0,
        width:         "100vw",
        height:        "100vh",
        pointerEvents: "none",
        zIndex:        9999,
        mixBlendMode:  "soft-light",
        opacity:       intensity > 0 ? 1 : 0,
        transition:    "opacity 0.3s ease",
      }}
      aria-hidden="true"
    />
  );
}

/* ── Sidebar grain intensity slider ── */
export function FilmGrainToggle() {
  const { intensity, setIntensity } = useFilmGrain();
  const enabled = intensity > 0;

  // Track dragging state for visual feedback
  const [dragging, setDragging] = useState(false);

  const activeColor = "oklch(0.55 0.18 340)";
  const mutedColor  = "oklch(0.65 0.040 330)";
  const trackColor  = enabled ? "oklch(0.88 0.06 340)" : "oklch(0.88 0.015 330)";
  const fillColor   = enabled ? activeColor : mutedColor;

  // Fill height as percentage of the 48px track
  const fillPct = intensity; // 0–100

  return (
    <div
      style={{
        width:          "100%",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            4,
        padding:        "4px 0 6px",
        userSelect:     "none",
      }}
      title={`Film grain intensity: ${intensity}%`}
    >
      {/* Film strip icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={enabled ? activeColor : mutedColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <rect x="2" y="6" width="20" height="12" rx="1" />
        <rect x="4"  y="9"  width="2" height="2" rx="0.3" fill={enabled ? activeColor : mutedColor} stroke="none" />
        <rect x="4"  y="13" width="2" height="2" rx="0.3" fill={enabled ? activeColor : mutedColor} stroke="none" />
        <rect x="18" y="9"  width="2" height="2" rx="0.3" fill={enabled ? activeColor : mutedColor} stroke="none" />
        <rect x="18" y="13" width="2" height="2" rx="0.3" fill={enabled ? activeColor : mutedColor} stroke="none" />
        <line x1="8"  y1="6"  x2="8"  y2="18" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="16" y1="6"  x2="16" y2="18" strokeWidth="1" strokeOpacity="0.4" />
      </svg>

      {/* Vertical slider track */}
      <div
        style={{
          position:     "relative",
          width:        10,
          height:       52,
          background:   trackColor,
          borderRadius: 5,
          border:       `1px solid ${enabled ? "oklch(0.80 0.06 340)" : "oklch(0.82 0.015 330)"}`,
          cursor:       "ns-resize",
          overflow:     "hidden",
          transition:   "background 0.2s, border-color 0.2s",
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          setDragging(true);
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const pct = Math.max(0, Math.min(100, Math.round((1 - (e.clientY - rect.top) / rect.height) * 100)));
          setIntensity(pct);

          const onMove = (me: MouseEvent) => {
            const p = Math.max(0, Math.min(100, Math.round((1 - (me.clientY - rect.top) / rect.height) * 100)));
            setIntensity(p);
          };
          const onUp = () => {
            setDragging(false);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
        onTouchStart={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const touch = e.touches[0];
          const pct = Math.max(0, Math.min(100, Math.round((1 - (touch.clientY - rect.top) / rect.height) * 100)));
          setIntensity(pct);

          const onMove = (te: TouchEvent) => {
            const t = te.touches[0];
            const p = Math.max(0, Math.min(100, Math.round((1 - (t.clientY - rect.top) / rect.height) * 100)));
            setIntensity(p);
          };
          const onEnd = () => {
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onEnd);
          };
          window.addEventListener("touchmove", onMove, { passive: true });
          window.addEventListener("touchend", onEnd);
        }}
      >
        {/* Fill bar — grows from bottom */}
        <div
          style={{
            position:     "absolute",
            bottom:       0,
            left:         0,
            right:        0,
            height:       `${fillPct}%`,
            background:   fillColor,
            borderRadius: "0 0 5px 5px",
            transition:   dragging ? "none" : "height 0.15s ease, background 0.2s",
            opacity:      0.75,
          }}
        />
        {/* Thumb line */}
        <div
          style={{
            position:   "absolute",
            left:       0,
            right:      0,
            bottom:     `calc(${fillPct}% - 1px)`,
            height:     2,
            background: fillColor,
            transition: dragging ? "none" : "bottom 0.15s ease, background 0.2s",
          }}
        />
      </div>

      {/* Label */}
      <span
        style={{
          fontSize:      "0.40rem",
          fontFamily:    "'Space Mono', monospace",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color:         enabled ? activeColor : mutedColor,
          lineHeight:    1,
          transition:    "color 0.2s",
        }}
      >
        {intensity === 0 ? "OFF" : `${intensity}%`}
      </span>
    </div>
  );
}
