/* ============================================================
   ADHD FOCUS SPACE — Mood Check-In
   Design: Emoji-based mood selector, warm and non-judgmental
   Purpose: Track emotional state to understand productivity patterns
   ============================================================ */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MOODS = [
  { emoji: "😴", label: "Exhausted", value: 1, color: "oklch(0.6 0.05 255)" },
  { emoji: "😔", label: "Low", value: 2, color: "oklch(0.6 0.1 255)" },
  { emoji: "😐", label: "Okay", value: 3, color: "oklch(0.7 0.08 75)" },
  { emoji: "🙂", label: "Good", value: 4, color: "oklch(0.65 0.14 185)" },
  { emoji: "🚀", label: "Energized", value: 5, color: "oklch(0.75 0.15 75)" },
];

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
    const mood = MOODS.find((m) => m.value === value);
    const messages: Record<number, string> = {
      1: "Rest when you can. You're doing your best.",
      2: "That's okay. Small steps still count.",
      3: "Steady wins the race. Let's go!",
      4: "Great energy! Let's make the most of it.",
      5: "You're on fire! Channel that energy!",
    };
    toast(messages[value] || "Mood logged!", { duration: 3000 });
  };

  const selectedMood = MOODS.find((m) => m.value === currentMood);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">How are you feeling?</p>
        {selectedMood && (
          <span className="text-xs text-muted-foreground">
            {selectedMood.emoji} {selectedMood.label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-1">
        {MOODS.map((mood) => {
          const isSelected = currentMood === mood.value;
          const isAnimating = animating === mood.value;

          return (
            <button
              key={mood.value}
              onClick={() => selectMood(mood.value)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all duration-200",
                isSelected
                  ? "border-2 scale-110 shadow-sm"
                  : "border-border hover:border-muted-foreground hover:scale-105",
                isAnimating && "mood-bounce",
                isSelected ? "bg-white" : "bg-muted/30 hover:bg-white"
              )}
              style={isSelected ? { borderColor: mood.color } : {}}
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span
                className="text-[10px] font-medium"
                style={{ color: isSelected ? mood.color : undefined }}
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
