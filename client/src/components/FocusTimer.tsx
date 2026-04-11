/* ============================================================
   ADHD FOCUS SPACE — Focus Timer (Paper Tear Edition)
   Design: A notebook page. As you focus, bottom strips tear off
   one by one. Quit = sad wrap-up with score penalty + quit count.
   Complete = celebration wrap-up with confetti.

   Palette: warm cream bg, ink strokes, terracotta accent
   Typography: Playfair Display (display), DM Sans (body), JetBrains Mono (digits)
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, Play, Pause, Settings, Check, X, Plus, Trash2, Pencil, Coffee, Volume2, VolumeX } from "lucide-react";
import { useTimer, MODE_LABELS, MODE_COLORS, PRESETS, DEFAULT_STRIPS, type TimerMode } from "@/contexts/TimerContext";
import { useTimerSound } from "@/hooks/useTimerSound";
import { trpc } from "@/lib/trpc";

// ── Inject keyframes once ─────────────────────────────────────────────────────
const STYLE_ID = "focus-timer-tear-keyframes";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes ft-tearLeft {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; max-height: 44px; }
      25%  { transform: translateY(6px) rotate(-1.5deg); opacity: 0.95; }
      100% { transform: translateY(110px) rotate(-16deg) translateX(-50px); opacity: 0; max-height: 0; }
    }
    @keyframes ft-tearRight {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; max-height: 44px; }
      25%  { transform: translateY(6px) rotate(2deg); opacity: 0.95; }
      100% { transform: translateY(120px) rotate(20deg) translateX(55px); opacity: 0; max-height: 0; }
    }
    @keyframes ft-shake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-3px) rotate(-1deg); }
      40%     { transform: translateX(4px) rotate(1.5deg); }
      60%     { transform: translateX(-2px) rotate(-0.5deg); }
      80%     { transform: translateX(2px); }
    }
    @keyframes ft-flyAway {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(-160%) rotate(-10deg); opacity: 0; }
    }
    @keyframes ft-sadDrop {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(80px) rotate(5deg); opacity: 0; }
    }
    @keyframes ft-fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ft-scoreCount {
      from { opacity: 0; transform: scale(0.7); }
      to   { opacity: 1; transform: scale(1); }
    }
    .ft-tear-left  { animation: ft-tearLeft  0.65s cubic-bezier(0.4,0,1,1) forwards; overflow: hidden; }
    .ft-tear-right { animation: ft-tearRight 0.65s cubic-bezier(0.4,0,1,1) forwards; overflow: hidden; }
    .ft-shake      { animation: ft-shake 0.3s ease-in-out; }
    .ft-fly-away   { animation: ft-flyAway 0.9s cubic-bezier(0.4,0,0.2,1) forwards; }
    .ft-sad-drop   { animation: ft-sadDrop 0.7s cubic-bezier(0.4,0,0.2,1) forwards; }
    .ft-fade-in    { animation: ft-fadeIn 0.5s ease forwards; }
    .ft-score-pop  { animation: ft-scoreCount 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .strip-row:hover .strip-actions { opacity: 1 !important; }
  `;
  document.head.appendChild(s);
}

// ── Types re-exported from context (kept for local use) ──────────────────────

// ── Strip editor (shown in idle state) ───────────────────────────────────────
function StripEditor({ strips, onChange }: {
  strips: string[];
  onChange: (strips: string[]) => void;
}) {
  const [newText, setNewText] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const addStrip = () => {
    const trimmed = newText.trim();
    if (!trimmed || strips.length >= 12) return;
    onChange([...strips, trimmed]);
    setNewText("");
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  const removeStrip = (i: number) => onChange(strips.filter((_, idx) => idx !== i));

  const startEdit = (i: number) => {
    setEditingIdx(i);
    setEditVal(strips[i]);
    setTimeout(() => editRef.current?.focus(), 40);
  };

  const commitEdit = () => {
    if (editingIdx === null) return;
    const trimmed = editVal.trim();
    if (trimmed) {
      const next = [...strips];
      next[editingIdx] = trimmed;
      onChange(next);
    }
    setEditingIdx(null);
  };

  const resetToDefaults = () => onChange([...DEFAULT_STRIPS]);

  return (
    <div style={{ padding: "12px 16px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 11, fontStyle: "italic",
          color: "#8C7B6B", margin: 0,
        }}>things to let go of</p>
        <button
          onClick={resetToDefaults}
          title="Reset to defaults"
          style={{
            fontSize: 8, letterSpacing: "0.12em",
            color: "#B0A090", background: "none", border: "none",
            cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
            textDecoration: "underline", padding: 0,
          }}
        >reset</button>
      </div>

      {/* Strip list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
        {strips.map((text, i) => (
          <div key={i} className="strip-row" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 10px",
            background: i === 0 ? "linear-gradient(90deg,#F5EDE0,#EDE0CF)" : "#FAF6F1",
            borderTop: i === 0 ? "none" : "1px solid #EDE0CF",
            position: "relative",
          }}>
            {/* Tear-order number */}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, color: "#C8C0B0",
              width: 14, flexShrink: 0, textAlign: "right",
            }}>{i + 1}</span>

            {editingIdx === i ? (
              <input
                ref={editRef}
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditingIdx(null);
                }}
                onBlur={commitEdit}
                style={{
                  flex: 1, fontSize: 10, border: "none",
                  borderBottom: "1px solid #C8603A",
                  background: "transparent", outline: "none",
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#3D2E1E", padding: "1px 0",
                }}
              />
            ) : (
              <span style={{
                flex: 1, fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                color: "#3D2E1E", letterSpacing: "0.04em",
              }}>{text}</span>
            )}

            <div style={{ display: "flex", gap: 4, opacity: 0, transition: "opacity 0.15s" }}
              className="strip-actions">
              <button onClick={() => startEdit(i)} style={{
                background: "none", border: "none", cursor: "pointer", padding: 2,
              }}><Pencil size={10} color="#B0A090" /></button>
              <button onClick={() => removeStrip(i)} style={{
                background: "none", border: "none", cursor: "pointer", padding: 2,
              }}><Trash2 size={10} color="#C8603A" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new strip */}
      {strips.length < 12 && (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            ref={inputRef}
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addStrip(); }}
            placeholder="add something to let go of…"
            style={{
              flex: 1, fontSize: 10,
              border: "none", borderBottom: "1px solid #D4C4B0",
              background: "transparent", outline: "none",
              fontFamily: "'JetBrains Mono', monospace",
              color: "#3D2E1E", padding: "4px 0",
              letterSpacing: "0.04em",
            }}
          />
          <button
            onClick={addStrip}
            disabled={!newText.trim()}
            style={{
              width: 22, height: 22,
              border: `1px solid ${newText.trim() ? "#C8603A" : "#D4C4B0"}`,
              background: newText.trim() ? "#C8603A" : "transparent",
              color: newText.trim() ? "#FAF6F1" : "#B0A090",
              cursor: newText.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 0, flexShrink: 0,
            }}
          ><Plus size={11} /></button>
        </div>
      )}

      {strips.length >= 12 && (
        <p style={{ fontSize: 8, color: "#B0A090", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", margin: 0 }}>max 12 strips</p>
      )}
    </div>
  );
}

// ── Single strip (strikethrough style — no tear animations) ──────────────────
type StripState = "attached" | "tearing" | "torn"; // local alias

function TearStrip({ text, state, isNext }: {
  text: string; seed: number;
  state: StripState; isNext: boolean;
}) {
  const isDone = state === "tearing" || state === "torn";

  // Torn strips fade out smoothly then disappear
  const [visible, setVisible] = useState(true);
  const prevState = useRef<StripState>(state);
  useEffect(() => {
    if (state === "tearing" && prevState.current !== "tearing") {
      // Brief delay then hide
      const t = setTimeout(() => setVisible(false), 400);
      prevState.current = "tearing";
      return () => clearTimeout(t);
    }
    if (state === "attached") {
      setVisible(true); prevState.current = "attached";
    }
    if (state === "torn") {
      setVisible(false); prevState.current = "torn";
    }
  }, [state]);

  if (!visible) return null;

  return (
    <div style={{
      padding: "7px 14px",
      background: isNext
        ? "rgba(200, 96, 58, 0.07)"
        : "transparent",
      borderTop: "1px solid rgba(180, 160, 130, 0.4)",
      display: "flex",
      alignItems: "center",
      gap: 8,
      opacity: isDone ? 0.5 : 1,
      transition: "opacity 0.35s",
      position: "relative",
      zIndex: 1,
    }}>
      {/* Row number */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 7,
        color: "#C8B8A0",
        letterSpacing: "0.04em",
        width: 14,
        textAlign: "right",
        flexShrink: 0,
        userSelect: "none",
      }}>{isDone ? "✓" : isNext ? "▶" : ""}</span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: isNext ? 10 : 9,
        color: isDone ? "#C8B8A0" : isNext ? "#3D2E1E" : "#7A6A5A",
        letterSpacing: "0.05em",
        fontWeight: isNext ? 700 : 400,
        textDecoration: isDone ? "line-through" : "none",
        textDecorationColor: "#C8603A",
        textDecorationThickness: "2px",
        transition: "color 0.3s, text-decoration 0.3s",
        flex: 1,
      }}>{text}</span>
    </div>
  );
}

// ── Complete wrap-up ──────────────────────────────────────────────────────────
function CompleteWrapUp({ sessions, mode, onNewSession }: {
  sessions: number; mode: TimerMode; onNewSession: () => void;
}) {
  const accentColor = MODE_COLORS[mode];
  const messages = [
    "You stayed. That's everything.",
    "The noise didn't win today.",
    "One full session. Real progress.",
    "You showed up. That matters.",
  ];
  const msg = messages[sessions % messages.length];

  // AI micro-reflection
  const [intention, setIntention] = useState("");
  const [outcome, setOutcome] = useState("");
  const [reflection, setReflection] = useState<string | null>(null);
  const [showReflect, setShowReflect] = useState(false);

  const reflectMutation = trpc.ai.focusReflection.useMutation({
    onSuccess: (data) => {
      const msg = data.message;
      setReflection(typeof msg === "string" ? msg : "");
    },
  });

  const handleReflect = () => {
    reflectMutation.mutate({
      phase: "after",
      sessionNumber: sessions,
      intention: intention || undefined,
      outcome: outcome || undefined,
    });
  };

  return (
    <div className="ft-fade-in" style={{
      background: "#FDFAF5",
      border: "1px solid #E8DDD0",
      padding: "28px 20px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      textAlign: "center",
      minHeight: 260,
    }}>
      {/* Big celebration icon */}
      <div style={{ fontSize: 48, lineHeight: 1 }}>✨</div>

      <div>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22,
          fontWeight: 700,
          color: "#3D2E1E",
          margin: 0,
          lineHeight: 1.2,
        }}>Session complete</p>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 13,
          fontStyle: "italic",
          color: "#8C7B6B",
          margin: "6px 0 0",
        }}>{msg}</p>
      </div>

      {/* Score ring */}
      <div className="ft-score-pop" style={{
        width: 80, height: 80,
        borderRadius: "50%",
        border: `3px solid ${accentColor}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `${accentColor}12`,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 22,
          fontWeight: 700,
          color: accentColor,
          lineHeight: 1,
        }}>{sessions}</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8,
          color: "#8C7B6B",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginTop: 2,
        }}>SESSION{sessions !== 1 ? "S" : ""}</span>
      </div>

      <div style={{
        background: "#F5EDE0",
        border: "1px solid #E8DDD0",
        borderRadius: 4,
        padding: "10px 18px",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        color: "#6A5A4A",
        letterSpacing: "0.08em",
      }}>
        8 strips torn · all stress released
      </div>

      {/* AI Micro-Reflection */}
      {!showReflect && !reflection && (
        <button
          onClick={() => setShowReflect(true)}
          style={{
            background: "oklch(0.55 0.09 35 / 0.10)",
            border: "1px solid oklch(0.55 0.09 35 / 0.28)",
            color: "oklch(0.52 0.14 35)",
            borderRadius: 6,
            padding: "7px 14px",
            fontSize: 10,
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.08em",
          }}
        >
          ✦ REFLECT WITH AI
        </button>
      )}

      {showReflect && !reflection && (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6A5A4A", margin: 0 }}>What did you intend to do?</p>
          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="e.g. finish the report intro"
            style={{
              border: "1px solid #E8DDD0", borderRadius: 4, padding: "6px 10px",
              fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: "#3D2E1E",
              background: "#FDFAF5", outline: "none", width: "100%",
            }}
          />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6A5A4A", margin: 0 }}>What actually happened?</p>
          <input
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g. got distracted but wrote 2 paragraphs"
            style={{
              border: "1px solid #E8DDD0", borderRadius: 4, padding: "6px 10px",
              fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: "#3D2E1E",
              background: "#FDFAF5", outline: "none", width: "100%",
            }}
          />
          <button
            onClick={handleReflect}
            disabled={reflectMutation.isPending}
            style={{
              background: reflectMutation.isPending ? "#E8DDD0" : "#2a1f14",
              border: "none", color: "#FAF6F1", borderRadius: 4,
              padding: "8px 16px", fontSize: 10, cursor: reflectMutation.isPending ? "not-allowed" : "pointer",
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.10em",
              display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-end",
            }}
          >
            {reflectMutation.isPending ? <><Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> THINKING…</> : "✦ GET REFLECTION"}
          </button>
        </div>
      )}

      {reflection && (
        <div style={{
          background: "oklch(0.55 0.09 35 / 0.06)",
          border: "1px solid oklch(0.55 0.09 35 / 0.20)",
          borderRadius: 6, padding: "10px 14px",
          fontSize: 12, fontFamily: "'DM Sans', sans-serif",
          color: "#3D2E1E", lineHeight: 1.6, textAlign: "left",
          width: "100%",
        }}>
          {reflection}
        </div>
      )}

      <button onClick={onNewSession} style={{
        background: "#2a1f14",
        border: "none",
        color: "#FAF6F1",
        borderRadius: 999,
        padding: "10px 28px",
        fontSize: 10,
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.14em",
        boxShadow: "0 3px 0 #1a1208",
      }}>
        ✶ NEW SESSION
      </button>
    </div>
  );
}

// ── Quit (sad) wrap-up ────────────────────────────────────────────────────────
function QuitWrapUp({ quitCount, stripsLeft, onNewSession }: {
  quitCount: number; stripsLeft: number; onNewSession: () => void;
}) {
  const sadMessages = [
    "It's okay. Tomorrow is a new page.",
    "The strips are waiting for you.",
    "Rest, then try again.",
    "Even stopping takes courage.",
  ];
  const msg = sadMessages[(quitCount - 1) % sadMessages.length];
  const penalty = Math.min(stripsLeft * 5, 40);

  return (
    <div className="ft-fade-in" style={{
      background: "#FDFAF5",
      border: "1px solid #E8DDD0",
      padding: "28px 20px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      textAlign: "center",
      minHeight: 260,
    }}>
      {/* Sad icon */}
      <div style={{ fontSize: 44, lineHeight: 1, filter: "grayscale(0.3)" }}>🌧</div>

      <div>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          fontWeight: 700,
          color: "#5A4A3A",
          margin: 0,
          lineHeight: 1.2,
        }}>Session ended early</p>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 13,
          fontStyle: "italic",
          color: "#8C7B6B",
          margin: "6px 0 0",
        }}>{msg}</p>
      </div>

      {/* Stats */}
      <div style={{
        display: "flex",
        gap: 12,
        width: "100%",
      }}>
        <div style={{
          flex: 1,
          background: "#F5EDE0",
          border: "1px solid #E8DDD0",
          padding: "12px 8px",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "#8C7B6B",
            margin: 0,
          }}>{quitCount}</p>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            color: "#A09080",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            margin: "4px 0 0",
          }}>QUIT{quitCount !== 1 ? "S" : ""} TODAY</p>
        </div>
        <div style={{
          flex: 1,
          background: "#FFF0EC",
          border: "1px solid #F0D0C4",
          padding: "12px 8px",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "#C8603A",
            margin: 0,
          }}>−{penalty}</p>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            color: "#C8603A",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            margin: "4px 0 0",
          }}>SCORE PENALTY</p>
        </div>
        <div style={{
          flex: 1,
          background: "#F5EDE0",
          border: "1px solid #E8DDD0",
          padding: "12px 8px",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "#8C7B6B",
            margin: 0,
          }}>{stripsLeft}</p>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            color: "#A09080",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            margin: "4px 0 0",
          }}>STRIPS LEFT</p>
        </div>
      </div>

      <button onClick={onNewSession} style={{
        background: "transparent",
        border: "1px solid #8C7B6B",
        color: "#6A5A4A",
        borderRadius: 999,
        padding: "9px 24px",
        fontSize: 10,
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.12em",
      }}>
        TRY AGAIN
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface FocusTimerProps {
  onSessionComplete?: () => void;
  onBlockComplete?: () => void;
  onQuit?: () => void;
}

export function FocusTimer({ onSessionComplete, onBlockComplete, onQuit }: FocusTimerProps) {
  // All timer logic lives in the global context — this component is purely a view
  const {
    mode, phase, running, remaining, sessions, quitCount,
    durations, strips, stripStates, paperFlying,
    progress, tornCount, stripsLeft, nextStripIdx, accentColor,
    pomodoroStep, transitionCountdown, nextMode,
    handleStartPause, handleQuit, handleNewSession, handleSkipTransition,
    switchMode, applyDuration, setCustomStrips,
    setOnSessionComplete, setOnBlockComplete, setOnQuit,
  } = useTimer();

  // MIT pre-label: listen for adhd-start-mit-focus event from Dashboard
  const [mitLabel, setMitLabel] = useState<string | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.taskText) setMitLabel(detail.taskText);
    };
    window.addEventListener("adhd-start-mit-focus", handler);
    return () => window.removeEventListener("adhd-start-mit-focus", handler);
  }, []);

  // Register callbacks so the context can fire them
  useEffect(() => {
    setOnSessionComplete(onSessionComplete ?? null);
    return () => setOnSessionComplete(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSessionComplete]);

  useEffect(() => {
    setOnBlockComplete(onBlockComplete ?? null);
    return () => setOnBlockComplete(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBlockComplete]);

  useEffect(() => {
    setOnQuit(onQuit ?? null);
    return () => setOnQuit(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onQuit]);

  // Local UI-only state (settings panel, inline edit)
  const [showSettings, setShowSettings] = useState(false);
  const [showSound, setShowSound] = useState(false);
  const [editingMode, setEditingMode] = useState<TimerMode | null>(null);
  const [editVal, setEditVal] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  // Sound
  const sound = useTimerSound();
  const prevPhaseRef = useRef(phase);
  const prevTornRef = useRef(tornCount);
  const prevTransitionRef = useRef(transitionCountdown);

  // Fire sound effects on phase/strip changes
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (phase === "transition" && prev !== "transition") sound.playChimeSfx();
    if (phase === "block_complete" && prev !== "block_complete") sound.playFanfareSfx();
  }, [phase, sound]);

  useEffect(() => {
    if (tornCount > prevTornRef.current && phase === "running") sound.playRipSfx();
    prevTornRef.current = tornCount;
  }, [tornCount, phase, sound]);

  useEffect(() => {
    if (phase === "transition" && transitionCountdown < prevTransitionRef.current && transitionCountdown > 0) {
      sound.playTickSfx();
    }
    prevTransitionRef.current = transitionCountdown;
  }, [transitionCountdown, phase, sound]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const segments = Array.from({ length: 20 }, (_, i) => i / 20 < progress);

  useEffect(() => {
    if (editingMode) setTimeout(() => editRef.current?.focus(), 40);
  }, [editingMode]);

  const commitEdit = () => {
    if (!editingMode) return;
    const parsed = parseInt(editVal, 10);
    if (!isNaN(parsed)) applyDuration(editingMode, parsed);
    setEditingMode(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        background: "#FAF8F3",
        overflow: "hidden",
      }}
    >
      {/* ── Top bar: mode tabs + sound/settings controls ── */}
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid #D4C4B0" }}>
        {/* Mode tabs */}
        <div style={{ display: "flex", flex: 1 }}>
          {(["focus", "short", "long"] as TimerMode[]).map((m, idx) => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1,
              padding: "6px 0",
              fontSize: 8,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              border: "none",
              borderRight: idx < 2 ? "1px solid #D4C4B0" : "none",
              background: mode === m ? MODE_COLORS[m] : "transparent",
              color: mode === m ? "#FAF6F1" : "#8C7B6B",
              cursor: running ? "not-allowed" : "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              opacity: running && mode !== m ? 0.5 : 1,
              fontWeight: mode === m ? 700 : 400,
              transition: "background 0.15s",
            }}>
              {m === "focus" ? "FOCUS" : m === "short" ? "SHORT" : "LONG"}
            </button>
          ))}
        </div>
        {/* Sound + settings */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 8px", borderLeft: "1px solid #D4C4B0" }}>
          {sessions > 0 && (
            <span style={{ fontSize: 8, letterSpacing: "0.10em", color: "#8C7B6B", marginRight: 2 }}>{sessions}×</span>
          )}
          <button
            onClick={() => { setShowSound(s => !s); setShowSettings(false); }}
            title="Sound & music"
            style={{ width: 20, height: 20, border: `1px solid ${showSound || sound.musicEnabled ? "#7A8C6E" : "#D4C4B0"}`, display: "flex", alignItems: "center", justifyContent: "center", background: sound.musicEnabled ? "#D4E8D0" : "transparent", cursor: "pointer", borderRadius: 0 }}
          >
            {sound.musicLoading ? <span style={{ fontSize: 7, color: "#7A8C6E" }}>…</span> : sound.musicEnabled ? <Coffee size={9} color="#5A8A5A" /> : (sound.sfxEnabled ? <Volume2 size={9} color="#8C7B6B" /> : <VolumeX size={9} color="#B0A090" />)}
          </button>
          <button
            onClick={() => { setShowSettings(s => !s); setShowSound(false); }}
            style={{ width: 20, height: 20, border: `1px solid ${showSettings ? accentColor : "#D4C4B0"}`, display: "flex", alignItems: "center", justifyContent: "center", background: showSettings ? `${accentColor}18` : "transparent", cursor: "pointer", borderRadius: 0 }}
          >
            <Settings size={9} color={showSettings ? accentColor : "#8C7B6B"} />
          </button>
        </div>
      </div>

      {/* MIT label if set */}
      {mitLabel && phase === "idle" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "oklch(0.52 0.10 32 / 0.08)", borderBottom: "1px solid oklch(0.52 0.10 32 / 0.20)" }}>
          <span style={{ fontSize: 8, color: "oklch(0.52 0.10 32)", letterSpacing: "0.06em", flex: 1 }}>★ MIT: {mitLabel.length > 32 ? mitLabel.slice(0, 32) + "…" : mitLabel}</span>
          <button onClick={() => setMitLabel(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "oklch(0.52 0.10 32 / 0.60)", fontSize: 12, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Quit count badge */}
      {quitCount > 0 && (
        <div style={{ padding: "3px 12px", background: "#FFF0EC", borderBottom: "1px solid #F0C8B8" }}>
          <span style={{ fontSize: 8, letterSpacing: "0.14em", color: "#C8603A" }}>{quitCount} QUIT{quitCount !== 1 ? "S" : ""} LOGGED</span>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div style={{ border: "1px solid #D4C4B0", padding: "14px", background: "#FAF6F1" }}>
          <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "#8C7B6B", textTransform: "uppercase", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>Duration (min) — click to edit</p>
          <div style={{ display: "flex", gap: 16 }}>
            {(["focus", "short", "long"] as TimerMode[]).map(m => (
              <div key={m} style={{ flex: 1 }}>
                <p style={{ fontSize: 8, letterSpacing: "0.18em", color: "#8C7B6B", textTransform: "uppercase", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{m}</p>
                {editingMode === m ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input ref={editRef} value={editVal} onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingMode(null); }}
                      type="number" min={1} max={180}
                      style={{ width: 44, textAlign: "center", fontSize: 13, fontWeight: 700, border: `1px solid ${MODE_COLORS[m]}`, background: "transparent", outline: "none", padding: "2px 4px", fontFamily: "'JetBrains Mono', monospace", color: "#3D2E1E", borderRadius: 0 }} />
                    <button onClick={commitEdit} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Check size={12} color={MODE_COLORS[m]} /></button>
                    <button onClick={() => setEditingMode(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={12} color="#8C7B6B" /></button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingMode(m); setEditVal(String(durations[m])); }}
                    style={{ fontSize: 20, fontWeight: 700, color: "#3D2E1E", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                    {durations[m]}
                  </button>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {PRESETS[m].map(p => (
                    <button key={p} onClick={() => applyDuration(m, p)} style={{
                      fontSize: 8, padding: "2px 6px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                      border: `1px solid ${durations[m] === p ? MODE_COLORS[m] : "#D4C4B0"}`,
                      background: durations[m] === p ? `${MODE_COLORS[m]}18` : "transparent",
                      color: durations[m] === p ? MODE_COLORS[m] : "#8C7B6B", borderRadius: 0,
                    }}>{p}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>


        </div>
      )}

      {/* Sound panel */}
      {showSound && (
        <div style={{ border: "1px solid #D4C4B0", padding: "14px", background: "#FAF6F1" }}>
          <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "#8C7B6B", textTransform: "uppercase", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>Sound</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Sound effects toggle + volume */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={sound.toggleSfx} style={{ width: 22, height: 22, border: `1px solid ${sound.sfxEnabled ? "#C8603A" : "#D4C4B0"}`, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", cursor: "pointer", borderRadius: 0, flexShrink: 0 }}>
                {sound.sfxEnabled ? <Volume2 size={10} color="#C8603A" /> : <VolumeX size={10} color="#8C7B6B" />}
              </button>
              <span style={{ fontSize: 8, letterSpacing: "0.14em", color: "#8C7B6B", fontFamily: "'JetBrains Mono', monospace", width: 80 }}>Sound Effects</span>
              <input type="range" min={0} max={1} step={0.05} value={sound.sfxVolume}
                onChange={e => sound.setSfxVolume(parseFloat(e.target.value))}
                disabled={!sound.sfxEnabled}
                style={{ flex: 1, accentColor: "#C8603A", cursor: sound.sfxEnabled ? "pointer" : "default", opacity: sound.sfxEnabled ? 1 : 0.4 }} />
              <span style={{ fontSize: 8, color: "#8C7B6B", fontFamily: "'JetBrains Mono', monospace", width: 24, textAlign: "right" }}>{Math.round(sound.sfxVolume * 100)}%</span>
            </div>
            {/* Coffee shop music toggle + volume */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={sound.toggleMusic} style={{ width: 22, height: 22, border: `1px solid ${sound.musicEnabled ? "#7A8C6E" : "#D4C4B0"}`, display: "flex", alignItems: "center", justifyContent: "center", background: sound.musicEnabled ? "oklch(0.52 0.07 145 / 0.12)" : "transparent", cursor: "pointer", borderRadius: 0, flexShrink: 0 }}>
                {sound.musicLoading ? <span style={{ fontSize: 7, color: "#7A8C6E" }}>…</span> : <Coffee size={10} color={sound.musicEnabled ? "#7A8C6E" : "#8C7B6B"} />}
              </button>
              <span style={{ fontSize: 8, letterSpacing: "0.14em", color: "#8C7B6B", fontFamily: "'JetBrains Mono', monospace", width: 80 }}>Cafe Music</span>
              <input type="range" min={0} max={1} step={0.05} value={sound.musicVolume}
                onChange={e => sound.setMusicVolume(parseFloat(e.target.value))}
                disabled={!sound.musicEnabled}
                style={{ flex: 1, accentColor: "#7A8C6E", cursor: sound.musicEnabled ? "pointer" : "default", opacity: sound.musicEnabled ? 1 : 0.4 }} />
              <span style={{ fontSize: 8, color: "#8C7B6B", fontFamily: "'JetBrains Mono', monospace", width: 24, textAlign: "right" }}>{Math.round(sound.musicVolume * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Complete wrap-up (manual complete, not auto-cycle) */}
      {phase === "complete" && (
        <CompleteWrapUp sessions={sessions} mode={mode} onNewSession={handleNewSession} />
      )}

      {/* Quit wrap-up */}
      {phase === "quit" && (
        <QuitWrapUp quitCount={quitCount} stripsLeft={stripsLeft} onNewSession={handleNewSession} />
      )}

      {/* Transition countdown — auto-start next phase */}
      {phase === "transition" && nextMode && (
        <div style={{
          border: "1px solid #E8DDD0", background: "#FDFAF5",
          padding: "28px 20px", textAlign: "center",
        }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.22em", color: "#8C7B6B", textTransform: "uppercase", marginBottom: 10 }}>
            NEXT UP
          </p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, fontStyle: "italic", color: MODE_COLORS[nextMode], marginBottom: 6 }}>
            {MODE_LABELS[nextMode]}
          </p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 700, color: "#3D2E1E", marginBottom: 16 }}>
            {transitionCountdown}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#8C7B6B", marginBottom: 16 }}>
            Starting automatically…
          </p>
          <button onClick={handleSkipTransition} style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            letterSpacing: "0.14em", textTransform: "uppercase",
            background: MODE_COLORS[nextMode], color: "#FAF6F1",
            border: "none", padding: "8px 20px", cursor: "pointer",
          }}>
            Start now →
          </button>
        </div>
      )}

      {/* Block complete — all 4 focus rounds done */}
      {phase === "block_complete" && (
        <div style={{
          border: "1px solid #E8DDD0", background: "#FDFAF5",
          padding: "28px 20px", textAlign: "center",
        }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.22em", color: "#7A8C6E", textTransform: "uppercase", marginBottom: 10 }}>
            BLOCK COMPLETE
          </p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, fontStyle: "italic", color: "#3D2E1E", marginBottom: 8 }}>
            4 sessions done.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#8C7B6B", lineHeight: 1.6, marginBottom: 20 }}>
            You completed a full Pomodoro block.<br />
            Take a real break — you earned it.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ width: 10, height: 10, background: "#7A8C6E", borderRadius: 0 }} />
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <button onClick={handleNewSession} style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              letterSpacing: "0.14em", textTransform: "uppercase",
              background: "#2a1f14", color: "#FAF6F1",
              border: "none", padding: "9px 24px", cursor: "pointer",
              boxShadow: "0 3px 0 #1a1208",
            }}>
              Start new block
            </button>
          </div>
        </div>
      )}

      {/* Paper scene — hidden during complete/quit/transition/block_complete */}
      {phase !== "complete" && phase !== "quit" && phase !== "transition" && phase !== "block_complete" && (
        <div
          className={paperFlying ? "ft-fly-away" : ""}
          style={{
            background: "#FAF8F3",
            minHeight: 260,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Grid paper background */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            backgroundImage: `
              linear-gradient(to right, #D8CFC0 1px, transparent 1px),
              linear-gradient(to bottom, #D8CFC0 1px, transparent 1px)
            `,
            backgroundSize: "18px 18px",
            opacity: 0.45,
          }} />

          {/* Clock display row */}
          <div style={{
            padding: "14px 16px 10px",
            borderBottom: "1.5px solid #C8B8A0",
            background: "transparent",
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "baseline",
            gap: 12,
          }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 36,
              fontWeight: 700,
              color: phase === "running" ? accentColor : "#3D2E1E",
              margin: 0,
              letterSpacing: "0.04em",
              lineHeight: 1,
              transition: "color 0.5s",
            }}>{mm}:{ss}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, letterSpacing: "0.18em", color: "#8C7B6B", textTransform: "uppercase" }}>things to</span>
              <span style={{ fontSize: 8, letterSpacing: "0.18em", color: "#8C7B6B", textTransform: "uppercase" }}>let go of</span>
            </div>
          </div>

          {/* Idle: show editable strip list */}
          {phase === "idle" && (
            <StripEditor
              strips={strips}
              onChange={(next) => {
                setCustomStrips(next);
              }}
            />
          )}

          {/* Running / paused: show strips */}
          {phase !== "idle" && (
            <div style={{ display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
              {strips.map((text: string, i: number) => {
                const baseState = stripStates[i] ?? "attached";
                const effectiveState: StripState =
                  i === 0 && baseState === "attached" && tornCount === 0
                    ? "tearing"
                    : baseState;
                return (
                  <TearStrip
                    key={i}
                    text={text}
                    seed={i + 1}
                    state={effectiveState}
                    isNext={i === nextStripIdx && (phase === "running" || phase === "paused")}
                  />
                );
              })}
            </div>
          )}

          {/* Empty state when all crossed off */}
          {tornCount === strips.length && phase === "running" && (
            <div style={{
              padding: "20px",
              textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace",
              color: "#8C7B6B",
              fontSize: 9,
              letterSpacing: "0.14em",
              position: "relative",
              zIndex: 1,
            }}>
              ALL CLEARED ✓
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      {phase !== "complete" && phase !== "quit" && phase !== "transition" && phase !== "block_complete" && (
        <div style={{ display: "flex", gap: 2, borderTop: "2px solid #3D2E1E" }}>
          {segments.map((filled, i) => (
            <div key={i} style={{ flex: 1, height: 6, background: filled ? accentColor : "#EDE0CF", transition: "background 0.5s" }} />
          ))}
        </div>
      )}

      {/* Controls row */}
      {phase !== "complete" && phase !== "quit" && phase !== "transition" && phase !== "block_complete" && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "#EDE0CF",
          borderTop: "2px solid #3D2E1E",
        }}>
          {/* Quit */}
          {(running || phase === "paused") && (
            <button onClick={handleQuit} title="Quit session" style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px",
              background: "transparent",
              border: "1.5px solid #B0A090",
              color: "#8C7B6B", cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
              letterSpacing: "0.12em",
              boxShadow: "2px 2px 0 #B0A090",
            }}>
              <RotateCcw size={10} /> QUIT
            </button>
          )}

          {/* Play / Pause */}
          {phase !== "recovering" && (
            <button onClick={handleStartPause} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 20px",
              background: running ? "#FAF8F3" : accentColor,
              border: `1.5px solid ${running ? "#B0A090" : accentColor}`,
              color: running ? "#3D2E1E" : "#FAF6F1",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              letterSpacing: "0.14em", cursor: "pointer",
              boxShadow: running ? "2px 2px 0 #B0A090" : `2px 2px 0 #7A3A1A`,
              fontWeight: 700,
              transition: "all 0.12s",
            }}>
              {running ? <><Pause size={10} /> PAUSE</> : <><Play size={10} /> {phase === "paused" ? "RESUME" : "START"}</>}
            </button>
          )}

          {/* Session dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8,
                background: i < sessions % 4 ? accentColor : "#C8B8A0",
                border: `1px solid ${i < sessions % 4 ? accentColor : "#A09080"}`,
                transition: "background 0.3s",
              }} />
            ))}
            <span style={{ fontSize: 8, letterSpacing: "0.10em", color: "#8C7B6B", marginLeft: 4, fontFamily: "'JetBrains Mono', monospace" }}>{sessions}/4</span>
          </div>
        </div>
      )}

      {/* Status bar footer */}
      {phase !== "complete" && phase !== "quit" && phase !== "transition" && phase !== "block_complete" && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "3px 10px",
          background: "#D8CCBA",
          borderTop: "1px solid #B0A090",
        }}>
          <span style={{ fontSize: 7, letterSpacing: "0.18em", color: "#6A5A4A", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>{durations[mode]} MIN · {MODE_LABELS[mode]}</span>
          <span style={{ fontSize: 7, letterSpacing: "0.14em", color: "#6A5A4A", fontFamily: "'JetBrains Mono', monospace" }}>{tornCount}/{strips.length} CROSSED OFF</span>
        </div>
      )}
    </div>
  );
}

export default FocusTimer;
