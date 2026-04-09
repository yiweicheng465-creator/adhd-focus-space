/*
  ADHD FOCUS SPACE — Global Timer Context
  Owns all timer state so the countdown persists across page navigation.
  Both the Dashboard mini-timer and the full Focus page read from this
  single source of truth.
*/

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// ── Types ─────────────────────────────────────────────────────────────────────
export type TimerMode = "focus" | "short" | "long";
export type TimerPhase =
  | "idle"
  | "running"
  | "paused"
  | "complete"
  | "quit"
  | "recovering";
export type StripState = "attached" | "tearing" | "torn";

export const DEFAULT_DURATIONS: Record<TimerMode, number> = {
  focus: 25,
  short: 5,
  long: 15,
};
export const PRESETS: Record<TimerMode, number[]> = {
  focus: [15, 25, 45, 60],
  short: [3, 5, 10],
  long: [10, 15, 20, 30],
};
export const MODE_LABELS: Record<TimerMode, string> = {
  focus: "Focus",
  short: "Short Break",
  long: "Long Break",
};
export const MODE_COLORS: Record<TimerMode, string> = {
  focus: "#C8603A",
  short: "#7A8C6E",
  long: "#7A8C9E",
};

export const DEFAULT_STRIPS = [
  "overthinking",
  "email backlog",
  "that awkward thing",
  "yesterday's worries",
  "the meeting dread",
  "unread messages",
  "tomorrow's anxiety",
  "the mental noise",
];

// ── Context shape ─────────────────────────────────────────────────────────────
export interface TimerContextValue {
  // State
  mode: TimerMode;
  phase: TimerPhase;
  running: boolean;
  remaining: number;
  sessions: number;
  quitCount: number;
  durations: Record<TimerMode, number>;
  strips: string[];
  stripStates: StripState[];
  paperFlying: boolean;

  // Derived
  progress: number;
  totalSec: number;
  tornCount: number;
  stripsLeft: number;
  nextStripIdx: number;
  accentColor: string;

  // Actions
  handleStartPause: () => void;
  handleQuit: () => void;
  handleNewSession: () => void;
  switchMode: (m: TimerMode) => void;
  applyDuration: (m: TimerMode, mins: number) => void;
  setCustomStrips: (s: string[] | ((prev: string[]) => string[])) => void;

  // Callbacks (set by consumers)
  setOnSessionComplete: (fn: (() => void) | null) => void;
  setOnQuit: (fn: (() => void) | null) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside TimerProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [durations, setDurations] = useState<Record<TimerMode, number>>({
    ...DEFAULT_DURATIONS,
  });
  const [mode, setMode] = useState<TimerMode>("focus");
  const [remaining, setRemaining] = useState(DEFAULT_DURATIONS.focus * 60);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [sessions, setSessions] = useState(0);
  const [quitCount, setQuitCount] = useState(0);
  const [customStrips, setCustomStrips] = useLocalStorage<string[]>(
    "adhd-focus-strips",
    DEFAULT_STRIPS
  );
  const strips = customStrips.length > 0 ? customStrips : DEFAULT_STRIPS;
  const [stripStates, setStripStates] = useState<StripState[]>(() =>
    strips.map(() => "attached" as StripState)
  );
  const [paperFlying, setPaperFlying] = useState(false);

  // Refs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const remainingAtStartRef = useRef<number>(DEFAULT_DURATIONS.focus * 60);
  const onSessionCompleteRef = useRef<(() => void) | null>(null);
  const onQuitRef = useRef<(() => void) | null>(null);

  // Derived
  const totalSec = durations[mode] * 60;
  const progress = totalSec > 0 ? (totalSec - remaining) / totalSec : 0;
  const stripsToTear = Math.floor(progress * strips.length);
  const tornCount = stripStates.filter(
    (s) => s === "torn" || s === "tearing"
  ).length;
  const stripsLeft = strips.length - tornCount;
  const nextStripIdx = stripStates.findIndex((s) => s === "attached");
  const accentColor = MODE_COLORS[mode];

  // ── Strip tear progression ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "running") return;
    const currentTorn = stripStates.filter((s) => s === "torn").length;
    if (stripsToTear > currentTorn) {
      const nextIdx = stripStates.findIndex((s) => s === "attached");
      if (nextIdx !== -1) {
        setStripStates((prev) => {
          const next = [...prev];
          next[nextIdx] = "tearing";
          return next;
        });
        setTimeout(() => {
          setStripStates((prev) => {
            const next = [...prev];
            if (next[nextIdx] === "tearing") next[nextIdx] = "torn";
            return next;
          });
        }, 1020);
      }
    }
  }, [stripsToTear, phase, stripStates]);

  // ── Complete handler ───────────────────────────────────────────────────────
  const handleComplete = useCallback(
    (natural = true) => {
      setRunning(false);
      if (mode === "focus") {
        setSessions((s) => s + 1);
        if (natural && !completedRef.current) {
          completedRef.current = true;
          const remaining_strips = strips
            .map((_: string, i: number) => i)
            .filter((i: number) => stripStates[i] === "attached");
          remaining_strips.forEach((idx: number, j: number) => {
            setTimeout(() => {
              setStripStates((prev) => {
                const next = [...prev];
                next[idx] = "tearing";
                return next;
              });
              setTimeout(() => {
                setStripStates((prev) => {
                  const next = [...prev];
                  if (next[idx] === "tearing") next[idx] = "torn";
                  return next;
                });
              }, 700);
            }, j * 200);
          });
          setTimeout(() => {
            setPaperFlying(true);
            setTimeout(() => {
              setPhase("complete");
              onSessionCompleteRef.current?.();
            }, 900);
          }, remaining_strips.length * 200 + 400);
        } else {
          setPhase("complete");
        }
      } else {
        // Break complete — just go to complete state
        setPhase("complete");
      }
    },
    [mode, strips, stripStates]
  );

  // ── Timestamp-based countdown ──────────────────────────────────────────────
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    startedAtRef.current = Date.now();
    remainingAtStartRef.current = remaining;

    intervalRef.current = setInterval(() => {
      if (startedAtRef.current === null) return;
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const newRemaining = Math.max(0, remainingAtStartRef.current - elapsed);
      setRemaining(newRemaining);
      if (newRemaining <= 0) {
        clearInterval(intervalRef.current!);
        handleComplete(true);
      }
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const resetStrips = () =>
    setStripStates(strips.map(() => "attached" as StripState));

  const switchMode = (m: TimerMode) => {
    if (running) return;
    setMode(m);
    setRemaining(durations[m] * 60);
    setPhase("idle");
    resetStrips();
    setPaperFlying(false);
    completedRef.current = false;
  };

  const applyDuration = (m: TimerMode, mins: number) => {
    const v = Math.max(1, Math.min(180, mins));
    setDurations((d) => ({ ...d, [m]: v }));
    if (m === mode) {
      setRunning(false);
      setRemaining(v * 60);
      setPhase("idle");
      resetStrips();
    }
  };

  const handleStartPause = () => {
    if (
      phase === "complete" ||
      phase === "quit" ||
      phase === "recovering"
    )
      return;
    const next = !running;
    if (!next && startedAtRef.current !== null) {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const snapped = Math.max(0, remainingAtStartRef.current - elapsed);
      setRemaining(snapped);
      remainingAtStartRef.current = snapped;
    }
    setRunning(next);
    setPhase(next ? "running" : "paused");
  };

  const handleQuit = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setQuitCount((q) => q + 1);
    onQuitRef.current?.();
    setPaperFlying(false);
    setPhase("recovering");
    setTimeout(() => setPhase("quit"), 400);
  };

  const handleNewSession = () => {
    setRemaining(durations[mode] * 60);
    setPhase("idle");
    resetStrips();
    setPaperFlying(false);
    completedRef.current = false;
  };

  const setOnSessionComplete = (fn: (() => void) | null) => {
    onSessionCompleteRef.current = fn;
  };
  const setOnQuit = (fn: (() => void) | null) => {
    onQuitRef.current = fn;
  };

  const value: TimerContextValue = {
    mode,
    phase,
    running,
    remaining,
    sessions,
    quitCount,
    durations,
    strips,
    stripStates,
    paperFlying,
    progress,
    totalSec,
    tornCount,
    stripsLeft,
    nextStripIdx,
    accentColor,
    handleStartPause,
    handleQuit,
    handleNewSession,
    switchMode,
    applyDuration,
    setCustomStrips,
    setOnSessionComplete,
    setOnQuit,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}
