/* ============================================================
   ADHD FOCUS SPACE — Film Grain Overlay
   Animated canvas-based noise layer over the entire app.
   Toggle persisted to localStorage under "adhd-film-grain".
   ============================================================ */

import { useEffect, useRef, useState, useCallback } from "react";

const LS_KEY = "adhd-film-grain";

/* ── Hook: shared grain state ── */
export function useFilmGrain() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY) !== "off";
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(LS_KEY, next ? "on" : "off"); } catch {}
      // Dispatch so other components can react
      window.dispatchEvent(new CustomEvent("adhd-grain-toggle", { detail: next }));
      return next;
    });
  }, []);

  // Listen for external toggles (e.g. sidebar button)
  useEffect(() => {
    const handler = (e: Event) => {
      setEnabled((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener("adhd-grain-toggle", handler);
    return () => window.removeEventListener("adhd-grain-toggle", handler);
  }, []);

  return { enabled, toggle };
}

/* ── Canvas film grain overlay ── */
export function FilmGrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const [enabled, setEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem(LS_KEY) !== "off"; } catch { return true; }
  });

  // Sync with toggle events
  useEffect(() => {
    const handler = (e: Event) => setEnabled((e as CustomEvent<boolean>).detail);
    window.addEventListener("adhd-grain-toggle", handler);
    return () => window.removeEventListener("adhd-grain-toggle", handler);
  }, []);

  useEffect(() => {
    if (!enabled) {
      cancelAnimationFrame(rafRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

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

    // Grain block size — larger = more visible chunky film grain
    const GRAIN_SIZE = 3;

    function drawGrain() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, w, h);
      // Draw chunky grain blocks for a visible film-grain look
      const cols = Math.ceil(w / GRAIN_SIZE);
      const rows = Math.ceil(h / GRAIN_SIZE);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const v = (Math.random() * 255) | 0;
          // Alpha range 30–90 — punchy but not opaque
          const a = (Math.random() * 60 + 30) / 255;
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
  }, [enabled]);

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
        opacity:       enabled ? 1 : 0,
        transition:    "opacity 0.4s ease",
      }}
      aria-hidden="true"
    />
  );
}

/* ── Sidebar toggle button ── */
export function FilmGrainToggle() {
  const { enabled, toggle } = useFilmGrain();

  return (
    <button
      onClick={toggle}
      title={enabled ? "Film grain ON — click to disable" : "Film grain OFF — click to enable"}
      style={{
        width:         "100%",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        justifyContent:"center",
        padding:       "6px 0 4px",
        gap:           2,
        background:    "none",
        border:        "none",
        cursor:        "pointer",
        opacity:       enabled ? 1 : 0.45,
        transition:    "opacity 0.2s",
      }}
    >
      {/* Film strip SVG icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={enabled ? "oklch(0.55 0.18 340)" : "oklch(0.55 0.040 330)"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Film strip body */}
        <rect x="2" y="6" width="20" height="12" rx="1" />
        {/* Sprocket holes left */}
        <rect x="4"  y="9"  width="2" height="2" rx="0.3" fill={enabled ? "oklch(0.55 0.18 340)" : "oklch(0.55 0.040 330)"} stroke="none" />
        <rect x="4"  y="13" width="2" height="2" rx="0.3" fill={enabled ? "oklch(0.55 0.18 340)" : "oklch(0.55 0.040 330)"} stroke="none" />
        {/* Sprocket holes right */}
        <rect x="18" y="9"  width="2" height="2" rx="0.3" fill={enabled ? "oklch(0.55 0.18 340)" : "oklch(0.55 0.040 330)"} stroke="none" />
        <rect x="18" y="13" width="2" height="2" rx="0.3" fill={enabled ? "oklch(0.55 0.18 340)" : "oklch(0.55 0.040 330)"} stroke="none" />
        {/* Center frame divider */}
        <line x1="8"  y1="6"  x2="8"  y2="18" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="16" y1="6"  x2="16" y2="18" strokeWidth="1" strokeOpacity="0.5" />
      </svg>
      <span style={{
        fontSize:      "0.42rem",
        fontFamily:    "'Space Mono', monospace",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color:         enabled ? "oklch(0.55 0.18 340)" : "oklch(0.55 0.040 330)",
        lineHeight:    1,
      }}>
        {enabled ? "GRAIN" : "GRAIN"}
      </span>
    </button>
  );
}
