/*
 * TIMER PROTOTYPE SHOWCASE
 * Design: Morandi palette — terracotta #C8603A, sage #8B9E7A, cream #F5EFE6, warm brown #5C3D2E
 * 4 distinct timer designs for user selection before integrating into main app.
 */

import { useState, useEffect, useRef } from "react";

// ─── Shared helpers ───────────────────────────────────────────────────────────
const DEMO_TOTAL = 25 * 60; // 25 min demo

function useCountdown(total: number) {
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && remaining > 0) {
      ref.current = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running, remaining]);

  const toggle = () => setRunning((r) => !r);
  const reset = () => { setRunning(false); setRemaining(total); };
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = (total - remaining) / total; // 0→1

  return { remaining, running, toggle, reset, mm, ss, progress };
}

// ─── PROTOTYPE A: Gradient Big Number ─────────────────────────────────────────
function ProtoA() {
  const { running, toggle, reset, mm, ss, progress } = useCountdown(DEMO_TOTAL);
  return (
    <div className="proto-card" style={{ background: "linear-gradient(135deg, #C8603A 0%, #D4845A 40%, #E8A87C 70%, #B08090 100%)", borderRadius: 20, padding: 0, overflow: "hidden", position: "relative", minHeight: 340 }}>
      <div style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,200,150,0.25)", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", bottom: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(180,120,140,0.3)", filter: "blur(35px)" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 32px", gap: 8 }}>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, letterSpacing: 3, textTransform: "uppercase", fontFamily: "system-ui", margin: 0 }}>Focus Session</p>
        <div style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui", fontWeight: 700, fontSize: 88, lineHeight: 1, color: "#fff", letterSpacing: -4, textShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>
          {mm}:{ss}
        </div>
        <div style={{ width: "100%", maxWidth: 260, height: 3, background: "rgba(255,255,255,0.25)", borderRadius: 2, marginTop: 8 }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: "#fff", borderRadius: 2, transition: "width 1s linear" }} />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button onClick={toggle} style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 50, padding: "10px 28px", fontSize: 14, cursor: "pointer", backdropFilter: "blur(8px)", fontWeight: 600 }}>
            {running ? "Pause" : "Start"}
          </button>
          <button onClick={reset} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.7)", borderRadius: 50, padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROTOTYPE B: Tomato Pomodoro ─────────────────────────────────────────────
function ProtoB() {
  const { running, toggle, reset, mm, ss, progress } = useCountdown(DEMO_TOTAL);
  const R = 90;
  const cx = 120, cy = 115;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference * progress;

  return (
    <div className="proto-card" style={{ background: "#F5EFE6", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px 24px", gap: 0 }}>
      <p style={{ color: "#8B9E7A", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px", fontFamily: "system-ui" }}>Pomodoro</p>
      <svg width="240" height="220" viewBox="0 0 240 220" style={{ overflow: "visible" }}>
        <rect x="117" y="12" width="6" height="22" rx="3" fill="#5C3D2E" />
        <path d="M120 20 Q108 8 96 14 Q104 22 120 20Z" fill="#8B9E7A" />
        <path d="M120 20 Q132 8 144 14 Q136 22 120 20Z" fill="#8B9E7A" />
        <path d="M120 20 Q112 4 118 0 Q124 4 120 20Z" fill="#6B8A5E" />
        <path d="M120 20 Q128 4 122 0 Q116 4 120 20Z" fill="#6B8A5E" />
        <circle cx={cx} cy={cy} r={R} fill="#C8603A" />
        <ellipse cx="88" cy="78" rx="14" ry="22" fill="rgba(255,255,255,0.18)" transform="rotate(-20 88 78)" />
        <circle cx={cx} cy={cy} r={R - 8} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="14" />
        <circle cx={cx} cy={cy} r={R - 8} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="14"
          strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dashoffset 1s linear" }} />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize="32" fontWeight="700" fontFamily="'SF Pro Display', system-ui" letterSpacing="-1">{mm}:{ss}</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11" fontFamily="system-ui" letterSpacing="2">FOCUS</text>
      </svg>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button onClick={toggle} style={{ background: "#C8603A", border: "none", color: "#fff", borderRadius: 50, padding: "10px 28px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={reset} style={{ background: "transparent", border: "1.5px solid #C8603A", color: "#C8603A", borderRadius: 50, padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── PROTOTYPE C: Cat Companion (Enhanced) ────────────────────────────────────
// Inspired by: peeking cat, headphone focus cat, "you can do this" sticky note cat
// Cat states: idle (big eyes + sticky note), running (squint + headphones), done (happy closed eyes), peek (last 60s)

type CatState = "idle" | "running" | "done" | "peek";

function CatSVG({ state, blink }: { state: CatState; blink: boolean }) {
  const CAT = "#9C8B7A";        // warm grey-brown (like the "you can do this" cat)
  const CAT_DARK = "#4A3728";   // outline / dark areas
  const EAR_INNER = "#C8A0A0";  // dusty rose inner ear
  const EYE_BG = "#F5EFE6";     // cream eye whites
  const PUPIL = "#2A1A0E";
  const NOSE = "#C8603A";
  const NOTE = "#F0D898";       // warm yellow sticky note
  const NOTE_TEXT = "#5C3D2E";

  // Peeking: just ears + top of head over the card edge
  if (state === "peek") {
    return (
      <svg width="200" height="80" viewBox="0 0 200 80" style={{ display: "block" }}>
        {/* Left ear */}
        <path d="M58 78 Q46 34 66 10 Q78 32 80 78Z" fill={CAT} stroke={CAT_DARK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M63 72 Q54 38 67 18 Q74 36 75 72Z" fill={EAR_INNER} opacity="0.65" />
        {/* Right ear */}
        <path d="M142 78 Q154 34 134 10 Q122 32 120 78Z" fill={CAT} stroke={CAT_DARK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M137 72 Q146 38 133 18 Q126 36 125 72Z" fill={EAR_INNER} opacity="0.65" />
        {/* Top of head arc */}
        <path d="M58 78 Q100 18 142 78Z" fill={CAT} stroke={CAT_DARK} strokeWidth="2.5" />
        {/* Big eyes peeking over */}
        <circle cx="78" cy="68" r="11" fill={EYE_BG} stroke={CAT_DARK} strokeWidth="1.5" />
        <circle cx="122" cy="68" r="11" fill={EYE_BG} stroke={CAT_DARK} strokeWidth="1.5" />
        <circle cx="78" cy="70" r="6" fill={PUPIL} />
        <circle cx="122" cy="70" r="6" fill={PUPIL} />
        <circle cx="81" cy="67" r="2.5" fill="rgba(255,255,255,0.85)" />
        <circle cx="125" cy="67" r="2.5" fill="rgba(255,255,255,0.85)" />
      </svg>
    );
  }

  return (
    <svg width="200" height="220" viewBox="0 0 200 220" style={{ display: "block" }}>
      {/* Tail curling to the right */}
      <path d="M138 170 Q175 158 178 128 Q180 108 162 104" fill="none" stroke={CAT} strokeWidth="16" strokeLinecap="round" />
      <path d="M138 170 Q175 158 178 128 Q180 108 162 104" fill="none" stroke={CAT_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.25" />

      {/* Body — chonky rounded shape */}
      <ellipse cx="100" cy="160" rx="56" ry="48" fill={CAT} />
      <ellipse cx="100" cy="160" rx="56" ry="48" fill="none" stroke={CAT_DARK} strokeWidth="2.5" />

      {/* Belly patch */}
      <ellipse cx="100" cy="168" rx="30" ry="28" fill="#B8A898" opacity="0.45" />

      {/* Head */}
      <circle cx="100" cy="88" r="50" fill={CAT} />
      <circle cx="100" cy="88" r="50" fill="none" stroke={CAT_DARK} strokeWidth="2.5" />

      {/* Left ear */}
      <path d="M58 58 Q46 18 70 30 Q78 46 80 62Z" fill={CAT} stroke={CAT_DARK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M62 56 Q53 24 68 34 Q74 46 75 58Z" fill={EAR_INNER} opacity="0.65" />
      {/* Right ear */}
      <path d="M142 58 Q154 18 130 30 Q122 46 120 62Z" fill={CAT} stroke={CAT_DARK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M138 56 Q147 24 132 34 Q126 46 125 58Z" fill={EAR_INNER} opacity="0.65" />

      {/* Eyes — state-dependent */}
      {state === "done" ? (
        // Happy closed curved lines + rosy cheeks
        <>
          <path d="M74 88 Q84 78 94 88" fill="none" stroke={CAT_DARK} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M106 88 Q116 78 126 88" fill="none" stroke={CAT_DARK} strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="80" cy="98" rx="11" ry="7" fill="#E8A0A0" opacity="0.35" />
          <ellipse cx="120" cy="98" rx="11" ry="7" fill="#E8A0A0" opacity="0.35" />
        </>
      ) : state === "running" ? (
        // Focused squint eyes + headphones
        <>
          {blink ? (
            <>
              <path d="M74 88 Q84 84 94 88" fill="none" stroke={CAT_DARK} strokeWidth="3.5" strokeLinecap="round" />
              <path d="M106 88 Q116 84 126 88" fill="none" stroke={CAT_DARK} strokeWidth="3.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Half-closed squinting eyes */}
              <path d="M74 90 Q84 80 94 90" fill={CAT_DARK} />
              <path d="M106 90 Q116 80 126 90" fill={CAT_DARK} />
              <path d="M74 90 Q84 95 94 90" fill={CAT} />
              <path d="M106 90 Q116 95 126 90" fill={CAT} />
              {/* Small pupils */}
              <circle cx="84" cy="87" r="4" fill={PUPIL} />
              <circle cx="116" cy="87" r="4" fill={PUPIL} />
              {/* Concentration lines — like the headphone cat */}
              <line x1="68" y1="82" x2="62" y2="78" stroke={CAT_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="70" y1="86" x2="63" y2="85" stroke={CAT_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="132" y1="82" x2="138" y2="78" stroke={CAT_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="130" y1="86" x2="137" y2="85" stroke={CAT_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </>
          )}
          {/* Headphones arc over head */}
          <path d="M50 82 Q50 46 100 46 Q150 46 150 82" fill="none" stroke={CAT_DARK} strokeWidth="6" strokeLinecap="round" />
          {/* Ear cups */}
          <rect x="40" y="76" width="18" height="24" rx="9" fill={CAT_DARK} />
          <rect x="142" y="76" width="18" height="24" rx="9" fill={CAT_DARK} />
          <rect x="43" y="80" width="12" height="16" rx="6" fill="#3A2818" />
          <rect x="145" y="80" width="12" height="16" rx="6" fill="#3A2818" />
        </>
      ) : (
        // Idle — big round cute eyes
        <>
          {blink ? (
            <>
              <path d="M74 88 Q84 84 94 88" fill="none" stroke={CAT_DARK} strokeWidth="3.5" strokeLinecap="round" />
              <path d="M106 88 Q116 84 126 88" fill="none" stroke={CAT_DARK} strokeWidth="3.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="84" cy="88" r="14" fill={EYE_BG} stroke={CAT_DARK} strokeWidth="2" />
              <circle cx="116" cy="88" r="14" fill={EYE_BG} stroke={CAT_DARK} strokeWidth="2" />
              <circle cx="84" cy="88" r="8" fill={PUPIL} />
              <circle cx="116" cy="88" r="8" fill={PUPIL} />
              {/* Shine spots */}
              <circle cx="88" cy="83" r="3.5" fill="rgba(255,255,255,0.85)" />
              <circle cx="120" cy="83" r="3.5" fill="rgba(255,255,255,0.85)" />
              <circle cx="81" cy="91" r="1.5" fill="rgba(255,255,255,0.5)" />
              <circle cx="113" cy="91" r="1.5" fill="rgba(255,255,255,0.5)" />
            </>
          )}
        </>
      )}

      {/* Nose */}
      <path d="M100 104 L95 111 L105 111 Z" fill={NOSE} />
      {/* Mouth */}
      {state === "done" ? (
        <path d="M93 113 Q100 122 107 113" fill="none" stroke={CAT_DARK} strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <path d="M95 113 Q100 118 105 113" fill="none" stroke={CAT_DARK} strokeWidth="2" strokeLinecap="round" />
      )}

      {/* Whiskers */}
      <line x1="100" y1="107" x2="58" y2="96" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="100" y1="110" x2="55" y2="110" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="100" y1="113" x2="60" y2="122" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="100" y1="107" x2="142" y2="96" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="100" y1="110" x2="145" y2="110" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="100" y1="113" x2="140" y2="122" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />

      {/* Sticky note on head — idle and done states */}
      {(state === "idle" || state === "done") && (
        <g transform="translate(100, 42) rotate(-7)">
          {/* Shadow */}
          <rect x="-30" y="-30" width="60" height="56" rx="3" fill="rgba(0,0,0,0.10)" transform="translate(2,2)" />
          {/* Note body */}
          <rect x="-30" y="-30" width="60" height="56" rx="3" fill={NOTE} />
          {/* Ruled lines */}
          <line x1="-20" y1="-12" x2="20" y2="-12" stroke={NOTE_TEXT} strokeWidth="1.5" opacity="0.25" />
          <line x1="-20" y1="-3" x2="20" y2="-3" stroke={NOTE_TEXT} strokeWidth="1.5" opacity="0.25" />
          <line x1="-20" y1="6" x2="20" y2="6" stroke={NOTE_TEXT} strokeWidth="1.5" opacity="0.25" />
          {/* Note text */}
          <text x="0" y="-18" textAnchor="middle" fill={NOTE_TEXT} fontSize="9" fontWeight="800" fontFamily="system-ui" letterSpacing="0.5">
            {state === "done" ? "GREAT" : "YOU CAN"}
          </text>
          <text x="0" y="-7" textAnchor="middle" fill={NOTE_TEXT} fontSize="9" fontWeight="800" fontFamily="system-ui" letterSpacing="0.5">
            {state === "done" ? "JOB!" : "DO THIS"}
          </text>
          <text x="0" y="4" textAnchor="middle" fill={NOTE_TEXT} fontSize="9" fontWeight="800" fontFamily="system-ui" letterSpacing="0.5">
            {state === "done" ? "✓ Rest" : ":)"}
          </text>
          {/* Tape strip at top */}
          <rect x="-14" y="-34" width="28" height="8" rx="2" fill="rgba(200,160,112,0.55)" />
        </g>
      )}

      {/* Paws */}
      <ellipse cx="70" cy="202" rx="20" ry="11" fill={CAT} stroke={CAT_DARK} strokeWidth="2" />
      <ellipse cx="130" cy="202" rx="20" ry="11" fill={CAT} stroke={CAT_DARK} strokeWidth="2" />
      {/* Toe lines */}
      <line x1="64" y1="197" x2="64" y2="206" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="70" y1="196" x2="70" y2="206" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="76" y1="197" x2="76" y2="206" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="124" y1="197" x2="124" y2="206" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="130" y1="196" x2="130" y2="206" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="136" y1="197" x2="136" y2="206" stroke={CAT_DARK} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function ProtoC() {
  const { running, toggle, reset, mm, ss, remaining } = useCountdown(DEMO_TOTAL);
  const [blink, setBlink] = useState(false);
  const [task, setTask] = useState("");
  const [taskSet, setTaskSet] = useState(false);

  const catState: CatState =
    remaining === 0 ? "done" :
    running && remaining < 90 ? "peek" :   // last 90s: peeking!
    running ? "running" : "idle";

  // Cat blinks — slower when focused
  useEffect(() => {
    const interval = running ? 7000 : 3500;
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, interval);
    return () => clearInterval(id);
  }, [running]);

  const encouragements = [
    "You've got this!", "Stay with it!", "One step at a time.",
    "Deep breaths.", "You're doing great!", "Keep going!"
  ];
  const [encourageIdx] = useState(() => Math.floor(Math.random() * encouragements.length));

  return (
    <div className="proto-card" style={{
      background: "#F5EFE6",
      borderRadius: 20,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px 20px 24px",
      gap: 0,
      overflow: "hidden",
      position: "relative",
    }}>

      {/* Cat — peeking variant overlaps the card top */}
      {catState === "peek" ? (
        <div style={{ width: "100%", position: "relative", height: 0, zIndex: 2, marginBottom: 0 }}>
          <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)" }}>
            <CatSVG state="peek" blink={blink} />
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: -6 }}>
          <CatSVG state={catState} blink={blink} />
        </div>
      )}

      {/* Timer card */}
      <div style={{
        background: catState === "done" ? "#EFF5E8" : "#fff",
        borderRadius: 16,
        padding: "22px 28px 20px",
        width: "100%",
        maxWidth: 300,
        textAlign: "center",
        boxShadow: "0 2px 18px rgba(92,61,46,0.10)",
        transition: "background 0.6s ease",
        position: "relative",
        zIndex: 1,
        marginTop: catState === "peek" ? 72 : 0,
      }}>
        {/* Mode label */}
        <p style={{ color: "#8B9E7A", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", margin: "0 0 2px", fontFamily: "system-ui" }}>
          {catState === "done" ? "Session complete!" : running ? "focusing" : "ready to start"}
        </p>

        {/* Big time display */}
        <div style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontWeight: 400,
          fontSize: 62,
          color: catState === "done" ? "#8B9E7A" : "#C8603A",
          letterSpacing: -3,
          lineHeight: 1,
          transition: "color 0.5s",
        }}>
          {mm}:{ss}
        </div>

        {/* Task intention */}
        {!taskSet && !running && remaining === DEMO_TOTAL ? (
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && task.trim() && setTaskSet(true)}
            placeholder="What will you focus on?"
            style={{
              width: "100%",
              border: "none",
              borderBottom: "1.5px solid #E8D8C8",
              background: "transparent",
              textAlign: "center",
              fontSize: 12,
              color: "#5C3D2E",
              padding: "6px 0",
              outline: "none",
              fontStyle: "italic",
              marginTop: 10,
              marginBottom: 2,
              boxSizing: "border-box",
            }}
          />
        ) : task ? (
          <p style={{ color: "#8B9E7A", fontSize: 12, margin: "8px 0 0", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {catState === "done" ? `✓ ${task}` : `→ ${task}`}
          </p>
        ) : (
          <p style={{ color: "#C8A870", fontSize: 11, margin: "8px 0 0", fontStyle: "italic" }}>
            {running ? encouragements[encourageIdx] : "What would you like to accomplish?"}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {remaining > 0 && (
            <button
              onClick={() => { if (!taskSet && task.trim()) setTaskSet(true); toggle(); }}
              style={{
                flex: 1,
                background: running ? "#F5EFE6" : "#C8603A",
                border: "none",
                color: running ? "#C8603A" : "#fff",
                borderRadius: 10,
                padding: "12px",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.2s",
                letterSpacing: 0.5,
              }}
            >
              {running ? "Pause" : "Start"}
            </button>
          )}
          <button
            onClick={() => { reset(); setTask(""); setTaskSet(false); }}
            style={{
              flex: remaining === 0 ? 2 : 1,
              background: "#F5EFE6",
              border: "none",
              color: "#8B9E7A",
              borderRadius: 10,
              padding: "12px",
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {remaining === 0 ? "New Session" : "Reset"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROTOTYPE D: Balloon Focus ───────────────────────────────────────────────
function ProtoD() {
  const { running, toggle, reset, mm, ss, progress, remaining } = useCountdown(DEMO_TOTAL);
  const balloonScale = 1 - progress * 0.55;
  const balloonOpacity = 0.4 + (1 - progress) * 0.6;

  return (
    <div className="proto-card" style={{ background: "#F5EFE6", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 28px", gap: 0, position: "relative", overflow: "hidden" }}>
      <p style={{ color: "#8B9E7A", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px", fontFamily: "system-ui" }}>Focus Balloon</p>
      <div style={{ transition: "transform 1s ease, opacity 1s ease", transform: `scale(${balloonScale})`, opacity: balloonOpacity, transformOrigin: "bottom center" }}>
        <svg width="160" height="200" viewBox="0 0 160 200">
          <ellipse cx="80" cy="85" rx="62" ry="72" fill="#C8603A" />
          <ellipse cx="58" cy="58" rx="16" ry="24" fill="rgba(255,255,255,0.2)" transform="rotate(-20 58 58)" />
          <path d="M72 157 Q80 165 88 157 Q84 162 80 168 Q76 162 72 157Z" fill="#A04828" />
          <path d="M80 168 Q72 185 80 200" fill="none" stroke="#5C3D2E" strokeWidth="1.5" strokeLinecap="round" />
          <text x="80" y="78" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="600" fontFamily="system-ui" letterSpacing="1">MY FOCUS</text>
          <text x="80" y="100" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700" fontFamily="'SF Pro Display', system-ui" letterSpacing="-1">{mm}:{ss}</text>
        </svg>
      </div>
      {remaining === 0 && (
        <p style={{ color: "#C8603A", fontSize: 13, fontWeight: 600, marginTop: -20, marginBottom: 8 }}>Session complete!</p>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: remaining === 0 ? 0 : -16 }}>
        <button onClick={toggle} style={{ background: "#C8603A", border: "none", color: "#fff", borderRadius: 50, padding: "10px 28px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={reset} style={{ background: "transparent", border: "1.5px solid #C8603A", color: "#C8603A", borderRadius: 50, padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── Main showcase page ───────────────────────────────────────────────────────
export default function TimerPrototypes() {
  return (
    <div style={{ minHeight: "100vh", background: "oklch(0.975 0.012 80)", padding: "40px 24px 60px", fontFamily: "system-ui" }}>
      <style>{`
        .proto-card { width: 100%; box-shadow: 0 4px 24px rgba(92,61,46,0.10); }
        .proto-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #8B9E7A; margin: 0 0 6px; }
        .proto-badge { display: inline-block; background: #C8603A; color: #fff; font-size: 10px; letter-spacing: 1px; padding: 2px 8px; border-radius: 20px; margin-left: 8px; vertical-align: middle; }
        .proto-badge-rec { display: inline-block; background: #8B9E7A; color: #fff; font-size: 10px; letter-spacing: 1px; padding: 2px 8px; border-radius: 20px; margin-left: 8px; vertical-align: middle; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 960, margin: "0 auto 40px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#3D2B1F", margin: "0 0 8px", fontStyle: "italic" }}>
          Timer Design Prototypes
        </h1>
        <p style={{ color: "#8B9E7A", fontSize: 14, margin: 0 }}>
          4 interactive prototypes — click Start to test each one. Pick your favourite and I'll integrate it into the main app.
        </p>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>

        {/* A */}
        <div>
          <p className="proto-label">A — Gradient Fullscreen <span className="proto-badge">Minimal</span></p>
          <ProtoA />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Bold gradient background, giant countdown digits. Clean and distraction-free. Great for full-focus mode.
          </p>
        </div>

        {/* B */}
        <div>
          <p className="proto-label">B — Tomato Pomodoro <span className="proto-badge">Playful</span></p>
          <ProtoB />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Flat illustrated tomato with a white arc ring depleting inside it. Classic Pomodoro metaphor, warm Morandi colors.
          </p>
        </div>

        {/* C */}
        <div>
          <p className="proto-label">C — Cat Companion <span className="proto-badge">Cute</span> <span className="proto-badge-rec">Recommended</span></p>
          <ProtoC />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Chonky cat with sticky note sits above the timer. Changes expression: big eyes (idle) → headphones squint (focus) → happy closed eyes (done) → peeking over card (last 90s). Type your intention and press Enter.
          </p>
        </div>

        {/* D */}
        <div>
          <p className="proto-label">D — Focus Balloon <span className="proto-badge">Metaphor</span></p>
          <ProtoD />
          <p style={{ color: "#8B9E7A", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>
            Balloon slowly deflates as time runs out — a visual metaphor for focus depleting. Unique and memorable.
          </p>
        </div>

      </div>

      {/* Footer CTA */}
      <div style={{ maxWidth: 960, margin: "48px auto 0", padding: "24px", background: "#fff", borderRadius: 16, textAlign: "center", boxShadow: "0 2px 12px rgba(92,61,46,0.06)" }}>
        <p style={{ color: "#5C3D2E", fontSize: 15, margin: "0 0 4px", fontWeight: 600 }}>Which design do you prefer?</p>
        <p style={{ color: "#8B9E7A", fontSize: 13, margin: 0 }}>Reply with A, B, C, or D — or mix elements from multiple designs — and I'll build it into the main app.</p>
      </div>
    </div>
  );
}
