/* ============================================================
   ADHD FOCUS SPACE — Global Hue Shift System
   Manages --base-hue CSS variable on <html>.
   State persisted to localStorage under "adhd-base-hue".
   Dispatches "adhd-hue-change" custom event for cross-component sync.
   ============================================================ */
import { useCallback, useEffect, useState } from "react";

const LS_KEY = "adhd-base-hue";
const DEFAULT_HUE = 330; // Pink (original theme)

export const HUE_PRESETS = [
  { label: "Pink",   hue: 330, color: "hsl(330,60%,65%)" },
  { label: "Purple", hue: 280, color: "hsl(280,55%,65%)" },
  { label: "Blue",   hue: 220, color: "hsl(220,60%,65%)" },
  { label: "Green",  hue: 155, color: "hsl(155,50%,55%)" },
  { label: "Sepia",  hue: 35,  color: "hsl(35,55%,60%)"  },
  { label: "Red",    hue: 5,   color: "hsl(5,60%,62%)"   },
] as const;

function readLS(): number {
  try {
    const v = parseFloat(localStorage.getItem(LS_KEY) ?? "");
    return isNaN(v) ? DEFAULT_HUE : Math.max(0, Math.min(360, v));
  } catch {
    return DEFAULT_HUE;
  }
}

function applyHue(hue: number) {
  document.documentElement.style.setProperty("--base-hue", String(hue));
}

/* ── Hook ── */
export function useHue() {
  const [hue, setHueState] = useState<number>(() => readLS());

  // Apply on mount and whenever hue changes
  useEffect(() => {
    applyHue(hue);
  }, [hue]);

  // Restore on mount (in case the hook is used in multiple components)
  useEffect(() => {
    const stored = readLS();
    applyHue(stored);
    setHueState(stored);
  }, []);

  const setHue = useCallback((val: number) => {
    const v = Math.max(0, Math.min(360, Math.round(val)));
    setHueState(v);
    applyHue(v);
    try { localStorage.setItem(LS_KEY, String(v)); } catch {}
    window.dispatchEvent(new CustomEvent("adhd-hue-change", { detail: v }));
  }, []);

  const reset = useCallback(() => setHue(DEFAULT_HUE), [setHue]);

  // Listen for external changes (e.g. other components calling setHue)
  useEffect(() => {
    const handler = (e: Event) => {
      const val = (e as CustomEvent<number>).detail;
      setHueState(val);
    };
    window.addEventListener("adhd-hue-change", handler);
    return () => window.removeEventListener("adhd-hue-change", handler);
  }, []);

  return { hue, setHue, reset, defaultHue: DEFAULT_HUE };
}
