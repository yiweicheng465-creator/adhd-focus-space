/* ============================================================
   ADHD FOCUS SPACE — Mood Check-In v4.0
   Design: Hand-drawn SVG blob faces — organic shapes, expressive
   features, Morandi-tinted fills. Inspired by the "slide to mood"
   aesthetic with illustrated blob characters.
   
   5 moods, each with:
   - Unique organic blob shape (SVG path)
   - Hand-drawn eyes + mouth expression
   - Distinct Morandi color
   - Subtle scale + shadow on selection
   ============================================================ */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Morandi-tinted blob colors ── */
const MOODS = [
  {
    value: 1, label: "Drained",
    fill:   "oklch(0.72 0.035 260)",   // dusty lavender-blue
    stroke: "oklch(0.50 0.04 260)",
    shadow: "oklch(0.72 0.035 260 / 0.35)",
  },
  {
    value: 2, label: "Low",
    fill:   "oklch(0.76 0.045 310)",   // muted mauve-pink
    stroke: "oklch(0.52 0.05 310)",
    shadow: "oklch(0.76 0.045 310 / 0.35)",
  },
  {
    value: 3, label: "Okay",
    fill:   "oklch(0.80 0.04 75)",     // warm parchment-tan
    stroke: "oklch(0.55 0.04 75)",
    shadow: "oklch(0.80 0.04 75 / 0.35)",
  },
  {
    value: 4, label: "Good",
    fill:   "oklch(0.75 0.07 145)",    // sage green
    stroke: "oklch(0.50 0.08 145)",
    shadow: "oklch(0.75 0.07 145 / 0.35)",
  },
  {
    value: 5, label: "Glowing",
    fill:   "oklch(0.78 0.10 55)",     // warm amber-peach
    stroke: "oklch(0.55 0.12 45)",
    shadow: "oklch(0.78 0.10 55 / 0.35)",
  },
];

const MESSAGES: Record<number, string> = {
  1: "Rest when you can.",
  2: "Small steps still count.",
  3: "Steady wins the race.",
  4: "Great energy today.",
  5: "You're glowing — channel it.",
};

/* ── Hand-drawn blob face SVGs ── */

/* 1 — Drained: droopy blob, half-closed eyes, flat mouth */
function BlobDrained({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Blob shape — slightly squished, droopy */}
      <path
        d="M40 8 C58 6 74 18 74 36 C74 56 62 74 40 74 C18 74 6 56 6 36 C6 18 22 10 40 8Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
      />
      {/* Left eye — half-closed line */}
      <path d="M27 34 Q29 31 31 34" stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Right eye — half-closed line */}
      <path d="M49 34 Q51 31 53 34" stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Mouth — flat/slightly down */}
      <path d="M31 50 Q40 48 49 50" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* 2 — Low: rounded rectangle blob, sad eyes, downward curve */
function BlobLow({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Blob shape — soft rounded rectangle */}
      <path
        d="M18 12 C10 12 6 20 6 30 L6 52 C6 64 14 74 28 74 L52 74 C66 74 74 64 74 52 L74 30 C74 20 70 12 62 12 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
      />
      {/* Left eye — dot */}
      <circle cx="28" cy="35" r="2.5" fill={stroke} />
      {/* Right eye — dot */}
      <circle cx="52" cy="35" r="2.5" fill={stroke} />
      {/* Mouth — gentle frown */}
      <path d="M30 52 Q40 46 50 52" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* 3 — Okay: circle blob, neutral eyes, straight mouth */
function BlobOkay({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Blob shape — slightly wobbly circle */}
      <path
        d="M40 7 C56 5 75 20 75 40 C75 60 58 75 40 75 C22 75 5 60 5 40 C5 20 24 9 40 7Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
      />
      {/* Left eye — small oval */}
      <ellipse cx="28" cy="34" rx="3" ry="3.5" fill={stroke} />
      {/* Right eye — small oval */}
      <ellipse cx="52" cy="34" rx="3" ry="3.5" fill={stroke} />
      {/* Nose — tiny L shape, hand-drawn feel */}
      <path d="M39 40 L39 46 L43 46" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Mouth — straight line */}
      <line x1="30" y1="54" x2="50" y2="54" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* 4 — Good: star-burst blob, happy eyes, gentle smile */
function BlobGood({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Blob shape — slightly irregular, upbeat */}
      <path
        d="M40 6 C52 4 72 16 74 32 C76 48 68 72 48 76 C28 80 4 64 4 44 C4 24 20 8 40 6Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
      />
      {/* Left eye — upward arc (happy squint) */}
      <path d="M25 35 Q28 30 31 35" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Right eye — upward arc */}
      <path d="M49 35 Q52 30 55 35" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Mouth — gentle smile */}
      <path d="M29 50 Q40 58 51 50" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* 5 — Glowing: spiky sun-blob, bright eyes, big smile */
function BlobGlowing({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Spiky sun blob — like the orange star in reference */}
      <path
        d="M40 4 L44 18 L56 10 L52 24 L68 22 L58 32 L74 38 L60 42 L68 56 L54 52 L52 68 L40 58 L28 68 L26 52 L12 56 L20 42 L6 38 L22 32 L12 22 L28 24 L24 10 L36 18 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Left eye — bold arc */}
      <path d="M26 34 Q29 28 32 34" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Right eye — bold arc */}
      <path d="M48 34 Q51 28 54 34" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Mouth — big open smile */}
      <path d="M27 50 Q40 62 53 50" stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const BLOB_COMPONENTS = [BlobDrained, BlobLow, BlobOkay, BlobGood, BlobGlowing];

const M = {
  ink:    "oklch(0.28 0.018 65)",
  muted:  "oklch(0.55 0.018 70)",
  border: "oklch(0.88 0.014 75)",
};

interface MoodCheckInProps {
  currentMood: number | null;
  onMoodChange: (mood: number) => void;
}

export function MoodCheckIn({ currentMood, onMoodChange }: MoodCheckInProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const selectMood = (value: number) => {
    onMoodChange(value);
    toast(MESSAGES[value] || "Mood logged.", { duration: 2500 });
  };

  const displayMood = hovered ?? currentMood;
  const displayData = MOODS.find((m) => m.value === displayMood);

  return (
    <div className="flex flex-col gap-4">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.12em" }}
        >
          How are you feeling?
        </p>
        {displayData && (
          <span
            className="text-xs transition-all duration-200"
            style={{ color: displayData.stroke, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
          >
            {displayData.label}
          </span>
        )}
      </div>

      {/* Blob faces row */}
      <div className="flex items-end justify-between gap-2">
        {MOODS.map((mood, i) => {
          const BlobFace = BLOB_COMPONENTS[i];
          const isSelected = currentMood === mood.value;
          const isHovered  = hovered === mood.value;
          const isActive   = isSelected || isHovered;

          return (
            <button
              key={mood.value}
              onClick={() => selectMood(mood.value)}
              onMouseEnter={() => setHovered(mood.value)}
              onMouseLeave={() => setHovered(null)}
              className="flex flex-col items-center gap-1.5 flex-1 transition-all duration-200 focus:outline-none"
              style={{
                transform: isActive ? "scale(1.18) translateY(-4px)" : "scale(1)",
                filter: isActive
                  ? `drop-shadow(0 6px 12px ${mood.shadow})`
                  : "none",
                opacity: currentMood !== null && !isSelected && !isHovered ? 0.55 : 1,
              }}
              aria-label={mood.label}
            >
              {/* Blob SVG */}
              <div className="w-12 h-12 sm:w-14 sm:h-14">
                <BlobFace fill={mood.fill} stroke={mood.stroke} />
              </div>

              {/* Label — only visible on hover/select */}
              <span
                className="text-[9px] font-medium tracking-wide transition-all duration-200"
                style={{
                  color: isActive ? mood.stroke : "transparent",
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "0.08em",
                }}
              >
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Thin progress bar showing selected mood position */}
      <div className="flex gap-1 mt-1">
        {MOODS.map((mood) => (
          <div
            key={mood.value}
            className="flex-1 h-0.5 transition-all duration-300"
            style={{
              background: currentMood !== null && mood.value <= currentMood
                ? mood.fill
                : M.border,
            }}
          />
        ))}
      </div>
    </div>
  );
}
