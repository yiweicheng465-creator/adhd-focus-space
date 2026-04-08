/* ============================================================
   ADHD FOCUS SPACE — Mood Check-In v5.0
   Design: Korean-style cute blob characters (기쁨/행복/평온/피곤/우울)
   Soft pastel fills, hand-drawn organic shapes, expressive faces.
   Mapped: Drained→피곤(tired), Low→우울(depressed), Okay→평온(calm),
           Good→기쁨(joy), Glowing→행복(happy)
   ============================================================ */

import { useState } from "react";
import { toast } from "sonner";

const MOODS = [
  { value: 1, label: "Drained", kr: "피곤", shadow: "rgba(180,175,185,0.4)" },
  { value: 2, label: "Low",     kr: "우울", shadow: "rgba(175,170,185,0.4)" },
  { value: 3, label: "Okay",    kr: "평온", shadow: "rgba(160,200,175,0.4)" },
  { value: 4, label: "Good",    kr: "기쁨", shadow: "rgba(240,200,60,0.4)"  },
  { value: 5, label: "Glowing", kr: "행복", shadow: "rgba(240,160,175,0.4)" },
];

const MESSAGES: Record<number, string> = {
  1: "Rest when you can.",
  2: "Small steps still count.",
  3: "Steady wins the race.",
  4: "Great energy today.",
  5: "You're glowing — channel it.",
};

/* ── 1. Drained / 피곤 — pale grey flat oval, sleepy half-closed eyes, zzz ── */
function KoreanBlobDrained({ active }: { active: boolean }) {
  const fill = active ? "#D0CBCA" : "#E8E4E2";
  const c = "#6B6560";
  return (
    <svg viewBox="0 0 80 72" fill="none">
      {/* Flat oval body */}
      <ellipse cx="40" cy="42" rx="34" ry="24" fill={fill} />
      {/* Sleepy half-closed eyes — filled ovals with droopy lids */}
      <ellipse cx="28" cy="40" rx="5" ry="3.5" fill={c} />
      <ellipse cx="52" cy="40" rx="5" ry="3.5" fill={c} />
      {/* Droopy eyelid lines */}
      <path d="M23 38 Q28 35 33 38" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M47 38 Q52 35 57 38" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Flat mouth */}
      <path d="M32 52 Q40 50 48 52" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* zzz */}
      <text x="58" y="26" fontSize="7" fill="#B0A8A5" fontFamily="serif" opacity="0.9">z</text>
      <text x="63" y="20" fontSize="5.5" fill="#B0A8A5" fontFamily="serif" opacity="0.7">z</text>
      <text x="67" y="15" fontSize="4" fill="#B0A8A5" fontFamily="serif" opacity="0.5">z</text>
    </svg>
  );
}

/* ── 2. Low / 우울 — grey teardrop blob, sad dots, tears, frown ── */
function KoreanBlobLow({ active }: { active: boolean }) {
  const fill = active ? "#C4C0CC" : "#D8D4DC";
  const c = "#5A5060";
  return (
    <svg viewBox="0 0 80 72" fill="none">
      {/* Rounded blob body */}
      <path d="M40 10 C60 10 70 24 70 40 C70 56 58 64 40 64 C22 64 10 56 10 40 C10 24 20 10 40 10Z" fill={fill} />
      {/* Sad dot eyes */}
      <circle cx="28" cy="37" r="3.5" fill={c} />
      <circle cx="52" cy="37" r="3.5" fill={c} />
      {/* Tear drops */}
      <path d="M27 41 Q26 47 27.5 49" stroke="#8BBCD4" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M53 41 Q52 47 53.5 49" stroke="#8BBCD4" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Frown */}
      <path d="M30 53 Q40 48 50 53" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ── 3. Okay / 평온 — mint green cloud blob, gentle curved eyes, soft smile ── */
function KoreanBlobOkay({ active }: { active: boolean }) {
  const fill = active ? "#A8D4B8" : "#C8E8D4";
  const c = "#3A6848";
  return (
    <svg viewBox="0 0 80 72" fill="none">
      {/* Cloud-like blob */}
      <path d="M18 46 C14 46 10 42 10 38 C10 34 13 31 17 31 C17 25 22 20 28 20 C31 17 35 16 40 16 C50 16 58 24 58 34 C62 34 70 38 70 44 C70 50 64 54 57 54 L23 54 C20 54 18 50 18 46Z" fill={fill} />
      {/* Calm curved eyes */}
      <path d="M26 37 Q29 34 32 37" stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M48 37 Q51 34 54 37" stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Gentle smile */}
      <path d="M32 46 Q40 50 48 46" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ── 4. Good / 기쁨 — warm yellow round blob, happy squint eyes, big smile ── */
function KoreanBlobGood({ active }: { active: boolean }) {
  const fill = active ? "#F0C830" : "#F8E060";
  const c = "#5A4820";
  return (
    <svg viewBox="0 0 80 72" fill="none">
      {/* Round cheerful blob */}
      <path d="M40 8 C58 8 72 20 72 38 C72 54 58 64 40 64 C22 64 8 54 8 38 C8 20 22 8 40 8Z" fill={fill} />
      {/* Happy squint eyes — upward arcs */}
      <path d="M24 34 Q28 29 32 34" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M48 34 Q52 29 56 34" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Big smile */}
      <path d="M27 46 Q40 56 53 46" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Rosy cheeks */}
      <ellipse cx="20" cy="44" rx="5.5" ry="3" fill="#F0A080" opacity="0.45" />
      <ellipse cx="60" cy="44" rx="5.5" ry="3" fill="#F0A080" opacity="0.45" />
    </svg>
  );
}

/* ── 5. Glowing / 행복 — soft pink round blob, happy eyes, wide smile, hearts ── */
function KoreanBlobGlowing({ active }: { active: boolean }) {
  const fill = active ? "#F0A0B0" : "#F8C8D4";
  const c = "#8B3050";
  return (
    <svg viewBox="0 0 80 72" fill="none">
      {/* Round pink blob */}
      <path d="M40 8 C58 8 72 22 72 40 C72 56 58 66 40 66 C22 66 8 56 8 40 C8 22 22 8 40 8Z" fill={fill} />
      {/* Happy arc eyes */}
      <path d="M24 36 Q28 31 32 36" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M48 36 Q52 31 56 36" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Wide smile */}
      <path d="M25 48 Q40 60 55 48" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Rosy cheeks */}
      <ellipse cx="19" cy="45" rx="6" ry="3.5" fill="#E07080" opacity="0.38" />
      <ellipse cx="61" cy="45" rx="6" ry="3.5" fill="#E07080" opacity="0.38" />
      {/* Small hearts */}
      <path d="M35 17 C35 15 37 14 37 16 C37 14 39 15 39 17 C39 19 37 21 37 21 C37 21 35 19 35 17Z" fill="#E07080" opacity="0.75" />
      <path d="M41 13 C41 11.5 42.5 10.5 42.5 12 C42.5 10.5 44 11.5 44 13 C44 14.5 42.5 16 42.5 16 C42.5 16 41 14.5 41 13Z" fill="#E07080" opacity="0.55" />
    </svg>
  );
}

const BLOB_COMPONENTS = [
  KoreanBlobDrained,
  KoreanBlobLow,
  KoreanBlobOkay,
  KoreanBlobGood,
  KoreanBlobGlowing,
];

const MOOD_COLORS = [
  { fill: "#E8E4E2", stroke: "#6B6560", bar: "#C8C4C0" },
  { fill: "#D8D4DC", stroke: "#5A5060", bar: "#B8B0C0" },
  { fill: "#C8E8D4", stroke: "#3A6848", bar: "#90C8A8" },
  { fill: "#F8E060", stroke: "#5A4820", bar: "#E8C030" },
  { fill: "#F8C8D4", stroke: "#8B3050", bar: "#E89090" },
];

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
  const displayColor = displayMood ? MOOD_COLORS[displayMood - 1] : null;

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
        {displayData && displayColor && (
          <span
            className="text-xs transition-all duration-200"
            style={{ color: displayColor.stroke, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
          >
            {displayData.label}
          </span>
        )}
      </div>

      {/* Korean blob faces row */}
      <div className="flex items-end justify-between gap-1">
        {MOODS.map((mood, i) => {
          const BlobFace = BLOB_COMPONENTS[i];
          const colors = MOOD_COLORS[i];
          const isSelected = currentMood === mood.value;
          const isHovered  = hovered === mood.value;
          const isActive   = isSelected || isHovered;

          return (
            <button
              key={mood.value}
              onClick={() => selectMood(mood.value)}
              onMouseEnter={() => setHovered(mood.value)}
              onMouseLeave={() => setHovered(null)}
              className="flex flex-col items-center gap-1 flex-1 transition-all duration-200 focus:outline-none"
              style={{
                transform: isActive ? "scale(1.22) translateY(-5px)" : "scale(1)",
                filter: isActive ? `drop-shadow(0 6px 14px ${MOODS[i].shadow})` : "none",
                opacity: currentMood !== null && !isSelected && !isHovered ? 0.5 : 1,
              }}
              aria-label={mood.label}
            >
              {/* Blob SVG */}
              <div className="w-12 h-10 sm:w-14 sm:h-12">
                <BlobFace active={isActive} />
              </div>
              {/* Label — visible on hover/select */}
              <span
                className="text-[9px] font-medium tracking-wide transition-all duration-200"
                style={{
                  color: isActive ? colors.stroke : "transparent",
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "0.06em",
                }}
              >
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Thin progress bar */}
      <div className="flex gap-1 mt-1">
        {MOODS.map((mood, i) => (
          <div
            key={mood.value}
            className="flex-1 h-0.5 transition-all duration-300"
            style={{
              background: currentMood !== null && mood.value <= currentMood
                ? MOOD_COLORS[i].bar
                : M.border,
            }}
          />
        ))}
      </div>
    </div>
  );
}
