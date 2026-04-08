/* ============================================================
   ADHD FOCUS SPACE — Insight / About page
   Explains the balloon metaphor and core app philosophy
   ============================================================ */

import { useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";

const M = {
  bg:      "oklch(0.975 0.012 80)",
  card:    "oklch(0.992 0.005 80)",
  border:  "oklch(0.88 0.012 75)",
  ink:     "oklch(0.28 0.018 65)",
  muted:   "oklch(0.55 0.018 70)",
  coral:   "oklch(0.55 0.09 35)",
  coralBg: "oklch(0.55 0.09 35 / 0.08)",
  sage:    "oklch(0.52 0.07 145)",
  sageBg:  "oklch(0.52 0.07 145 / 0.08)",
};

function BalloonIllustration({ scale = 1 }: { scale?: number }) {
  const s = scale;
  const cx = 60, cy = 60;
  const rx = 38 * s, ry = 44 * s;
  const knotY = cy + ry;
  return (
    <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
      {/* Balloon body */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="oklch(0.65 0.12 35)" opacity="0.85" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#3A2A1A" strokeWidth="1.6" opacity="0.7" />
      {/* Highlight */}
      <ellipse cx={cx - rx * 0.28} cy={cy - ry * 0.28} rx={rx * 0.18} ry={ry * 0.14} fill="white" opacity="0.25" />
      {/* Smiley */}
      <path d={`M ${cx - rx * 0.28} ${cy - ry * 0.05} Q ${cx - rx * 0.18} ${cy + ry * 0.08} ${cx - rx * 0.08} ${cy - ry * 0.05}`}
        fill="none" stroke="#3A2A1A" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d={`M ${cx + rx * 0.08} ${cy - ry * 0.05} Q ${cx + rx * 0.18} ${cy + ry * 0.08} ${cx + rx * 0.28} ${cy - ry * 0.05}`}
        fill="none" stroke="#3A2A1A" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d={`M ${cx - rx * 0.35} ${cy + ry * 0.28} Q ${cx} ${cy + ry * 0.44} ${cx + rx * 0.35} ${cy + ry * 0.28}`}
        fill="none" stroke="#3A2A1A" strokeWidth="1.1" strokeLinecap="round" opacity="0.65" />
      {/* Knot */}
      <ellipse cx={cx} cy={knotY + 5 * s} rx={5 * s} ry={6 * s} fill="oklch(0.50 0.10 35)" opacity="0.8" />
      {/* String */}
      <path d={`M ${cx} ${knotY + 10 * s} Q ${cx + 8} ${knotY + 35} ${cx - 4} ${130}`}
        fill="none" stroke="oklch(0.55 0.018 70)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

const CONCEPTS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="11" fill="oklch(0.55 0.09 35 / 0.15)" stroke="oklch(0.55 0.09 35)" strokeWidth="1.4" />
        <path d="M14 8 L14 14 L18 16" stroke="oklch(0.55 0.09 35)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "The Balloon = Your Focus Session",
    body: "When you start the timer, the balloon is fully inflated — big, round, full of potential. As you stay focused, it slowly deflates. Completing a session means you've breathed out all that stored tension. The balloon is empty. You did it.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 20 Q8 10 14 14 Q20 18 24 8" fill="none" stroke="oklch(0.52 0.07 145)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="24" cy="8" r="3" fill="oklch(0.52 0.07 145 / 0.3)" stroke="oklch(0.52 0.07 145)" strokeWidth="1.2" />
      </svg>
    ),
    title: "Deflation = Progress",
    body: "Every second the balloon gets smaller is a second of real focus. The shrinking is not a countdown to failure — it's a countdown to release. Stress leaves the balloon as you work. By the end, it's flat. So is the anxiety.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M6 22 L22 6" stroke="oklch(0.55 0.09 35)" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="22" cy="6" r="4" fill="oklch(0.55 0.09 35 / 0.15)" stroke="oklch(0.55 0.09 35)" strokeWidth="1.2" />
        <path d="M14 14 L18 10" stroke="oklch(0.55 0.09 35)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    title: "The Needle = Accountability",
    body: "The needle hovering near the balloon is not a threat — it's a reminder that quitting early has a cost. If you abandon the session, the balloon pops. That's okay. But the goal is to let it deflate naturally, on your terms.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="5" y="12" width="18" height="12" rx="3" fill="oklch(0.52 0.07 145 / 0.15)" stroke="oklch(0.52 0.07 145)" strokeWidth="1.3" />
        <path d="M10 12 V9 Q10 5 14 5 Q18 5 18 9 V12" fill="none" stroke="oklch(0.52 0.07 145)" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="14" cy="18" r="2" fill="oklch(0.52 0.07 145)" />
      </svg>
    ),
    title: "Wins = Evidence You Exist",
    body: "ADHD brains discount their own achievements constantly. Wins are not trophies — they are proof. Logging a win, no matter how small, trains your brain to notice what it accomplishes instead of only what it missed.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <line x1="5" y1="2" x2="5" y2="26" stroke="oklch(0.55 0.09 35)" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M5 4 L20 8 L5 12 Z" fill="oklch(0.55 0.09 35 / 0.25)" stroke="oklch(0.55 0.09 35)" strokeWidth="1.2" />
      </svg>
    ),
    title: "Goals = Direction, Not Pressure",
    body: "Goals here are not deadlines. They are compass headings. Progress is measured in small nudges (+10%, +25%) because ADHD brains work in bursts. A goal at 40% is not failing — it's 40% further than before.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="5" y="8" width="18" height="16" rx="2.5" fill="oklch(0.55 0.018 70 / 0.12)" stroke="oklch(0.55 0.018 70)" strokeWidth="1.3" />
        <circle cx="10" cy="16" r="2.5" fill="none" stroke="oklch(0.55 0.018 70)" strokeWidth="1" />
        <circle cx="18" cy="16" r="2.5" fill="none" stroke="oklch(0.55 0.018 70)" strokeWidth="1" />
        <line x1="14" y1="8" x2="14" y2="4" stroke="oklch(0.55 0.018 70)" strokeWidth="1.2" />
        <circle cx="14" cy="3" r="1.5" fill="none" stroke="oklch(0.55 0.018 70)" strokeWidth="1" />
      </svg>
    ),
    title: "AI Agents = Extended Cognition",
    body: "Your brain has limited working memory. AI agents are not shortcuts — they are cognitive extensions. Logging what each agent is doing externalizes the mental load of tracking parallel work, freeing your focus for what only you can do.",
  },
];

export default function Insight() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex" style={{ background: M.bg }}>
      <Sidebar activeSection="" onSectionChange={() => navigate("/")} />

      <main className="flex-1 ml-14 min-h-screen flex flex-col">
        {/* Header */}
        <header
          className="sticky top-0 z-30 px-8 py-4 flex items-center gap-3"
          style={{
            background: `${M.bg}e8`,
            backdropFilter: "blur(8px)",
            borderBottom: `1px solid ${M.border}`,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" fill="oklch(0.55 0.09 35 / 0.15)" stroke="oklch(0.55 0.09 35)" strokeWidth="1.3" />
            <line x1="9" y1="6" x2="9" y2="10" stroke="oklch(0.55 0.09 35)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="12.5" r="0.9" fill="oklch(0.55 0.09 35)" />
          </svg>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: M.muted }}>
            INSIGHT
          </span>
        </header>

        <div className="flex-1 px-8 py-8 max-w-2xl" style={{ margin: "0 auto", width: "100%" }}>

          {/* Hero */}
          <div
            className="flex items-center gap-8 mb-10 p-7"
            style={{ background: M.coralBg, border: `1px solid oklch(0.55 0.09 35 / 0.18)` }}
          >
            <div className="shrink-0">
              <BalloonIllustration scale={1} />
            </div>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: M.coral, marginBottom: 8 }}>
                THE PHILOSOPHY
              </p>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.45rem", fontWeight: 700, color: M.ink, lineHeight: 1.3, marginBottom: 10 }}>
                Your focus is a balloon.<br />Stress is the air inside.
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: M.muted, lineHeight: 1.65 }}>
                This workspace is built around one idea: ADHD brains are not broken. They are high-pressure systems that need the right release valves. Every feature here is a valve.
              </p>
            </div>
          </div>

          {/* Concept cards */}
          <div className="flex flex-col gap-4">
            {CONCEPTS.map(({ icon, title, body }) => (
              <div
                key={title}
                className="flex items-start gap-5 p-5"
                style={{ background: M.card, border: `1px solid ${M.border}` }}
              >
                <div className="shrink-0 mt-0.5">{icon}</div>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", fontWeight: 700, fontStyle: "italic", color: M.ink, marginBottom: 6 }}>
                    {title}
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: M.muted, lineHeight: 1.65 }}>
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer quote */}
          <div className="mt-10 mb-8 text-center">
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontStyle: "italic", color: M.muted, lineHeight: 1.7 }}>
              "Your brain is not broken — it just works differently."
            </p>
            <div className="mt-4">
              <button
                onClick={() => navigate("/")}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.75rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: M.coral,
                  background: "transparent",
                  border: `1px solid oklch(0.55 0.09 35 / 0.35)`,
                  padding: "8px 20px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Back to workspace →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
