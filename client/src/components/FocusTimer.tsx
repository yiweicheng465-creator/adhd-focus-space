/* ============================================================
   ADHD FOCUS SPACE — Focus Timer
   Design: Circular SVG stroke timer, teal accent, JetBrains Mono digits
   Modes: Focus (25min), Short Break (5min), Long Break (15min)
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { toast } from "sonner";

type TimerMode = "focus" | "short" | "long";

const MODES: Record<TimerMode, { label: string; duration: number; color: string; bg: string }> = {
  focus: { label: "Focus", duration: 25 * 60, color: "oklch(0.65 0.14 185)", bg: "oklch(0.65 0.14 185 / 0.08)" },
  short: { label: "Short Break", duration: 5 * 60, color: "oklch(0.75 0.15 75)", bg: "oklch(0.75 0.15 75 / 0.08)" },
  long: { label: "Long Break", duration: 15 * 60, color: "oklch(0.7 0.1 145)", bg: "oklch(0.7 0.1 145 / 0.08)" },
};

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface FocusTimerProps {
  onSessionComplete?: () => void;
}

export function FocusTimer({ onSessionComplete }: FocusTimerProps) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentMode = MODES[mode];
  const progress = timeLeft / currentMode.duration;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === "focus") {
              setSessionsCompleted((s) => s + 1);
              toast.success("Focus session complete! 🎉 Take a break.", {
                duration: 5000,
              });
              onSessionComplete?.();
            } else {
              toast.info("Break over! Ready to focus?", { duration: 3000 });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, onSessionComplete]);

  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(currentMode.duration);
  };

  const handleSkip = () => {
    setIsRunning(false);
    const next: TimerMode = mode === "focus" ? "short" : "focus";
    handleModeChange(next);
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mode selector */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        {(Object.keys(MODES) as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
              mode === m
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      {/* Circular timer */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring when running */}
        {isRunning && (
          <div
            className="absolute rounded-full pulse-ring"
            style={{
              width: 220,
              height: 220,
              border: `2px solid ${currentMode.color}`,
              opacity: 0.3,
            }}
          />
        )}

        <svg width={220} height={220} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={110}
            cy={110}
            r={RADIUS}
            fill="none"
            stroke="oklch(0.9 0.006 90)"
            strokeWidth={10}
          />
          {/* Progress arc */}
          <circle
            cx={110}
            cy={110}
            r={RADIUS}
            fill="none"
            stroke={currentMode.color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>

        {/* Timer display */}
        <div className="absolute flex flex-col items-center">
          <span
            className="font-timer text-5xl font-bold tracking-tight"
            style={{ color: currentMode.color }}
          >
            {minutes}:{seconds}
          </span>
          <span className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-widest">
            {currentMode.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          className="rounded-full w-10 h-10"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          size="lg"
          onClick={() => setIsRunning(!isRunning)}
          className="rounded-full w-16 h-16 shadow-lg"
          style={{
            background: currentMode.color,
            boxShadow: `0 0 20px ${currentMode.color}40`,
          }}
        >
          {isRunning ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-0.5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleSkip}
          className="rounded-full w-10 h-10"
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Session counter */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              i < sessionsCompleted % 4
                ? "bg-[oklch(0.65_0.14_185)] scale-110"
                : "bg-muted"
            )}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2">
          {sessionsCompleted} session{sessionsCompleted !== 1 ? "s" : ""} today
        </span>
      </div>
    </div>
  );
}
