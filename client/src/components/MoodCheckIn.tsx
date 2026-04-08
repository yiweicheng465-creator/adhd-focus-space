/* ============================================================
   ADHD FOCUS SPACE — Mood Check-In v3.0 (Morandi)
   Warm muted tones: slumber → pinky-beige → coral gradient
   ============================================================ */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MOODS = [
  { emoji: "😴", label: "Exhausted", value: 1, color: "oklch(0.55 0.018 70)",  bg: "oklch(0.72 0.018 75 / 0.15)",  border: "oklch(0.72 0.018 75 / 0.40)" },
  { emoji: "😔", label: "Low",       value: 2, color: "oklch(0.52 0.035 50)",  bg: "oklch(0.72 0.035 50 / 0.12)",  border: "oklch(0.72 0.035 50 / 0.35)" },
  { emoji: "😐", label: "Okay",      value: 3, color: "oklch(0.52 0.055 35)",  bg: "oklch(0.72 0.055 35 / 0.10)",  border: "oklch(0.72 0.055 35 / 0.30)" },
  { emoji: "🙂", label: "Good",      value: 4, color: "oklch(0.52 0.07 145)",  bg: "oklch(0.52 0.07 145 / 0.08)", border: "oklch(0.52 0.07 145 / 0.28)" },
  { emoji: "🚀", label: "Energized", value: 5, color: "oklch(0.55 0.09 35)",   bg: "oklch(0.55 0.09 35 / 0.08)",  border: "oklch(0.55 0.09 35 / 0.28)" },
];

const M = {
  ink:    "oklch(0.28 0.018 65)",
  muted:  "oklch(0.55 0.018 70)",
  border: "oklch(0.88 0.014 75)",
  card:   "oklch(0.985 0.007 80)",
};

const MESSAGES: Record<number, string> = {
  1: "Rest when you can. You're doing your best.",
  2: "That's okay. Small steps still count.",
  3: "Steady wins the race. Let's go.",
  4: "Great energy! Let's make the most of it.",
  5: "You're on fire! Channel that energy.",
};

interface MoodCheckInProps {
  currentMood: number | null;
  onMoodChange: (mood: number) => void;
}

export function MoodCheckIn({ currentMood, onMoodChange }: MoodCheckInProps) {
  const [animating, setAnimating] = useState<number | null>(null);

  const selectMood = (value: number) => {
    setAnimating(value);
    setTimeout(() => setAnimating(null), 300);
    onMoodChange(value);
    toast(MESSAGES[value] || "Mood logged.", { duration: 3000 });
  };

  const selectedMood = MOODS.find((m) => m.value === currentMood);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
          How are you feeling?
        </p>
        {selectedMood && (
          <span className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            {selectedMood.emoji} {selectedMood.label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-1">
        {MOODS.map((mood) => {
          const isSelected  = currentMood === mood.value;
          const isAnimating = animating === mood.value;

          return (
            <button
              key={mood.value}
              onClick={() => selectMood(mood.value)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 px-1 transition-all duration-200",
                isAnimating && "mood-bounce"
              )}
              style={{
                background:  isSelected ? mood.bg : "transparent",
                border:      `${isSelected ? "2px" : "1px"} solid ${isSelected ? mood.border : M.border}`,
                transform:   isSelected ? "scale(1.08)" : "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = mood.border;
              }}
              onMouseLeave={(e) => {
                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = M.border;
              }}
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span
                className="text-[10px] font-medium"
                style={{ color: isSelected ? mood.color : M.muted, fontFamily: "'DM Sans', sans-serif" }}
              >
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
