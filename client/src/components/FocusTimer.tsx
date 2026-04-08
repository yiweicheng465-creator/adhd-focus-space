/**
 * FocusTimer — Cat Companion Design
 * Morandi palette, flat 2D. Cat grows during focus, scared when paused,
 * alien-abducted when abandoned mid-session.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Check, Pause, Play, SkipForward, X, Settings } from "lucide-react";
import { toast } from "sonner";

type TimerMode = "focus" | "short" | "long";
type CatState = "idle" | "running" | "paused" | "abducted" | "complete";

const MODE_META: Record<TimerMode, { label: string; color: string }> = {
  focus: { label: "FOCUS",       color: "#C4714A" },
  short: { label: "SHORT BREAK", color: "#7A8C6E" },
  long:  { label: "LONG BREAK",  color: "#A8929E" },
};

const DEFAULT_DURATIONS: Record<TimerMode, number> = { focus: 25, short: 5, long: 15 };
const PRESETS: Record<TimerMode, number[]> = {
  focus: [15, 25, 45, 60],
  short: [3, 5, 10],
  long:  [10, 15, 20, 30],
};

const CAT_MESSAGES: Record<CatState, string[]> = {
  idle:     ["Your kitty is waiting. Start focusing!", "Ready when you are. Let's do this!", "Your cat believes in you"],
  running:  ["Your kitty's growing. Keep going!", "Interrupting focus will cause its loss.", "Stay focused — your cat is counting on you!"],
  paused:   ["Break time's over, start focusing again", "Your kitty is scared. Come back!", "Don't leave your cat waiting too long..."],
  abducted: ["Dang! Aliens snatched your cat", "Your cat got abducted. Start fresh!", "The aliens won this round. Try again?"],
  complete: ["Session complete! Your kitty is thriving!", "Amazing focus! Your cat is so proud.", "You did it! Your kitty grew big and happy!"],
};

// ── Cat SVG components ──────────────────────────────────────────────────────

function CatIdle({ scale = 1, color = "#3D2E1E" }: { scale?: number; color?: string }) {
  const s = Math.max(0.55, Math.min(1.0, scale));
  const size = Math.round(72 + s * 88);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
      <ellipse cx="50" cy="68" rx="22" ry="20" fill={color} />
      <circle cx="50" cy="42" r="18" fill={color} />
      <polygon points="36,28 30,14 42,24" fill={color} />
      <polygon points="64,28 70,14 58,24" fill={color} />
      <polygon points="37,27 32,17 42,24" fill="#C8A090" opacity="0.5" />
      <polygon points="63,27 68,17 58,24" fill="#C8A090" opacity="0.5" />
      <circle cx="43" cy="41" r="5" fill="white" />
      <circle cx="57" cy="41" r="5" fill="white" />
      <circle cx="44" cy="42" r="3" fill="#1A1008" />
      <circle cx="58" cy="42" r="3" fill="#1A1008" />
      <circle cx="45.5" cy="40.5" r="1.2" fill="white" />
      <circle cx="59.5" cy="40.5" r="1.2" fill="white" />
      <ellipse cx="50" cy="48" rx="2" ry="1.5" fill="#C8A090" />
      <path d="M48 49.5 Q50 52 52 49.5" stroke="#C8A090" strokeWidth="1" fill="none" />
      <path d="M72 72 Q88 60 82 50 Q78 42 72 50" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="38" cy="85" rx="8" ry="5" fill={color} />
      <ellipse cx="62" cy="85" rx="8" ry="5" fill={color} />
      <ellipse cx="50" cy="91" rx={14 + s * 6} ry="3" fill="rgba(0,0,0,0.07)" />
    </svg>
  );
}

function CatScared({ color = "#3D2E1E" }: { color?: string }) {
  return (
    <svg width="120" height="120" viewBox="0 0 100 100" style={{ display: "block" }}>
      <ellipse cx="50" cy="72" rx="28" ry="18" fill={color} />
      <circle cx="50" cy="50" r="20" fill={color} />
      <polygon points="34,34 26,16 40,30" fill={color} />
      <polygon points="66,34 74,16 60,30" fill={color} />
      <polygon points="35,33 28,19 40,30" fill="#C8A090" opacity="0.5" />
      <polygon points="65,33 72,19 60,30" fill="#C8A090" opacity="0.5" />
      <circle cx="41" cy="49" r="7" fill="white" />
      <circle cx="59" cy="49" r="7" fill="white" />
      <circle cx="41" cy="50" r="4" fill="#1A1008" />
      <circle cx="59" cy="50" r="4" fill="#1A1008" />
      <circle cx="43" cy="48" r="1.5" fill="white" />
      <circle cx="61" cy="48" r="1.5" fill="white" />
      <ellipse cx="72" cy="38" rx="3" ry="4" fill="#A8D0E8" opacity="0.7" />
      <polygon points="70,36 74,36 72,30" fill="#A8D0E8" opacity="0.7" />
      <ellipse cx="50" cy="56" rx="2" ry="1.5" fill="#C8A090" />
      <path d="M46 58 Q48 56 50 58 Q52 60 54 58" stroke="#C8A090" strokeWidth="1.2" fill="none" />
      <path d="M78 75 Q90 65 85 55 Q80 48 74 56" stroke={color} strokeWidth="7" fill="none" strokeLinecap="round" />
      <ellipse cx="40" cy="86" rx="7" ry="4" fill={color} />
      <ellipse cx="60" cy="86" rx="7" ry="4" fill={color} />
      <ellipse cx="50" cy="92" rx="22" ry="3" fill="rgba(0,0,0,0.07)" />
    </svg>
  );
}

function CatAbducted({ color = "#3D2E1E" }: { color?: string }) {
  return (
    <svg width="160" height="190" viewBox="0 0 160 190" style={{ display: "block" }}>
      <ellipse cx="80" cy="40" rx="52" ry="17" fill="#4A4A4A" />
      <ellipse cx="80" cy="34" rx="30" ry="15" fill="#6A6A6A" />
      <ellipse cx="80" cy="27" rx="20" ry="12" fill="#8A9A7A" opacity="0.85" />
      <circle cx="58" cy="44" r="4.5" fill="#F0C060" opacity="0.9" />
      <circle cx="70" cy="48" r="3.5" fill="#F0C060" opacity="0.75" />
      <circle cx="82" cy="49" r="3.5" fill="#F0C060" opacity="0.75" />
      <circle cx="94" cy="47" r="4" fill="#F0C060" opacity="0.85" />
      <circle cx="106" cy="43" r="4.5" fill="#F0C060" opacity="0.9" />
      <polygon points="54,57 106,57 122,145 38,145" fill="#F5E090" opacity="0.22" />
      <line x1="54" y1="57" x2="38" y2="145" stroke="#F0C060" strokeWidth="1" opacity="0.35" />
      <line x1="106" y1="57" x2="122" y2="145" stroke="#F0C060" strokeWidth="1" opacity="0.35" />
      <g opacity="0.5" transform="translate(80,118) scale(0.52) translate(-50,-50)">
        <ellipse cx="50" cy="68" rx="22" ry="20" fill="none" stroke={color} strokeWidth="3.5" strokeDasharray="5,4" />
        <circle cx="50" cy="42" r="18" fill="none" stroke={color} strokeWidth="3.5" strokeDasharray="5,4" />
        <polygon points="36,28 30,14 42,24" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="4,3" />
        <polygon points="64,28 70,14 58,24" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="4,3" />
        <circle cx="43" cy="41" r="5" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3,3" />
        <circle cx="57" cy="41" r="5" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3,3" />
        <path d="M72 72 Q88 60 82 50 Q78 42 72 50" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="5,4" />
        <ellipse cx="38" cy="85" rx="8" ry="5" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3,3" />
        <ellipse cx="62" cy="85" rx="8" ry="5" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3,3" />
      </g>
    </svg>
  );
}

function CatComplete({ color = "#3D2E1E" }: { color?: string }) {
  return (
    <svg width="160" height="160" viewBox="0 0 100 100" style={{ display: "block" }}>
      <ellipse cx="50" cy="68" rx="26" ry="22" fill={color} />
      <circle cx="50" cy="40" r="22" fill={color} />
      <polygon points="34,24 26,8 42,20" fill={color} />
      <polygon points="66,24 74,8 58,20" fill={color} />
      <polygon points="35,23 28,11 42,20" fill="#C8A090" opacity="0.5" />
      <polygon points="65,23 72,11 58,20" fill="#C8A090" opacity="0.5" />
      <path d="M38 40 Q43 36 48 40" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M52 40 Q57 36 62 40" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="36" cy="46" r="5" fill="#E8A090" opacity="0.35" />
      <circle cx="64" cy="46" r="5" fill="#E8A090" opacity="0.35" />
      <ellipse cx="50" cy="50" rx="2.5" ry="2" fill="#C8A090" />
      <path d="M46 52 Q50 57 54 52" stroke="#C8A090" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M76 74 Q96 55 88 36 Q84 24 76 32" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="38" cy="87" rx="9" ry="6" fill={color} />
      <ellipse cx="62" cy="87" rx="9" ry="6" fill={color} />
      <ellipse cx="50" cy="94" rx="24" ry="4" fill="rgba(0,0,0,0.07)" />
    </svg>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

interface FocusTimerProps {
  onSessionComplete?: () => void;
}

export function FocusTimer({ onSessionComplete }: FocusTimerProps) {
  const [durations, setDurations] = useState<Record<TimerMode, number>>(DEFAULT_DURATIONS);
  const [mode, setMode]           = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft]   = useState(DEFAULT_DURATIONS.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions]   = useState(0);
  const [catState, setCatState]   = useState<CatState>("idle");
  const [showSettings, setShowSettings] = useState(false);
  const [editingMode, setEditingMode]   = useState<TimerMode | null>(null);
  const [editVal, setEditVal]           = useState("");
  const [msgIdx, setMsgIdx]             = useState(0);
  const [abductAnim, setAbductAnim]     = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editRef     = useRef<HTMLInputElement>(null);

  const totalSec = durations[mode] * 60;
  const progress = totalSec > 0 ? 1 - timeLeft / totalSec : 0;
  const meta     = MODE_META[mode];
  const catScale = mode === "focus" ? 0.55 + progress * 0.45 : 0.8;
  const mm = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const ss = (timeLeft % 60).toString().padStart(2, "0");
  const catColor = mode === "focus" ? "#3D2E1E" : mode === "short" ? "#4A5E3A" : "#6A4A5E";

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    setCatState("complete");
    if (mode === "focus") {
      setSessions((s) => s + 1);
      toast.success("Session complete — your kitty is thriving!", { duration: 4000 });
      onSessionComplete?.();
    } else {
      toast.info("Break over. Ready to focus?", { duration: 3000 });
      setCatState("idle");
    }
  }, [mode, onSessionComplete]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { clearInterval(intervalRef.current!); handleComplete(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, handleComplete]);

  useEffect(() => {
    if (editingMode) setTimeout(() => editRef.current?.focus(), 40);
  }, [editingMode]);

  useEffect(() => {
    const msgs = CAT_MESSAGES[catState];
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % msgs.length), 8000);
    setMsgIdx(0);
    return () => clearInterval(t);
  }, [catState]);

  const switchMode = (m: TimerMode) => {
    setIsRunning(false); setMode(m); setTimeLeft(durations[m] * 60); setCatState("idle");
  };

  const applyDuration = (m: TimerMode, mins: number) => {
    const v = Math.max(1, Math.min(180, mins));
    setDurations((d) => ({ ...d, [m]: v }));
    if (m === mode) { setIsRunning(false); setTimeLeft(v * 60); }
  };

  const commitEdit = () => {
    if (!editingMode) return;
    const parsed = parseInt(editVal, 10);
    if (!isNaN(parsed)) applyDuration(editingMode, parsed);
    setEditingMode(null);
  };

  const handlePlayPause = () => {
    if (catState === "abducted") return;
    const next = !isRunning;
    setIsRunning(next);
    if (next) {
      setCatState("running");
    } else {
      if (progress > 0.02) setCatState("paused");
    }
  };

  const handleReset = () => {
    const hadProgress = progress > 0.05 && mode === "focus";
    setIsRunning(false);
    setTimeLeft(durations[mode] * 60);
    if (hadProgress) {
      setCatState("abducted");
      setAbductAnim(true);
      setTimeout(() => { setAbductAnim(false); setCatState("idle"); }, 3500);
    } else {
      setCatState("idle");
    }
  };

  const currentMsg = CAT_MESSAGES[catState][msgIdx % CAT_MESSAGES[catState].length];
  const segments = Array.from({ length: 20 }, (_, i) => i / 20 < progress);

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontSize: 9, letterSpacing: "0.22em", color: "#8C7B6B", textTransform: "uppercase" }}>Focus Timer</p>
          <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#3D2E1E", fontWeight: 600, marginTop: 2, textTransform: "uppercase" }}>{meta.label}</p>
        </div>
        <div className="flex items-center gap-2">
          {sessions > 0 && (
            <span style={{ fontSize: 9, letterSpacing: "0.16em", color: "#8C7B6B" }}>{sessions} SESSION{sessions > 1 ? "S" : ""}</span>
          )}
          <button onClick={() => setShowSettings((s) => !s)} style={{ width: 26, height: 26, border: `1px solid ${showSettings ? meta.color : "#D4C4B0"}`, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", cursor: "pointer", borderRadius: 0 }}>
            <Settings size={11} color={showSettings ? meta.color : "#8C7B6B"} />
          </button>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["focus", "short", "long"] as TimerMode[]).map((m) => (
          <button key={m} onClick={() => switchMode(m)} style={{ flex: 1, padding: "6px 0", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", border: `1px solid ${mode === m ? MODE_META[m].color : "#D4C4B0"}`, background: mode === m ? MODE_META[m].color : "transparent", color: mode === m ? "#FAF6F1" : "#8C7B6B", cursor: "pointer", borderRadius: 0, fontFamily: "'JetBrains Mono', monospace" }}>
            {m === "focus" ? "Focus" : m === "short" ? "Short" : "Long"}
          </button>
        ))}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{ border: "1px solid #D4C4B0", padding: "14px", background: "#FAF6F1" }}>
          <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "#8C7B6B", textTransform: "uppercase", marginBottom: 10 }}>Duration (min) — click to edit</p>
          <div style={{ display: "flex", gap: 16 }}>
            {(["focus", "short", "long"] as TimerMode[]).map((m) => (
              <div key={m} style={{ flex: 1 }}>
                <p style={{ fontSize: 8, letterSpacing: "0.18em", color: "#8C7B6B", textTransform: "uppercase", marginBottom: 4 }}>{m}</p>
                {editingMode === m ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input ref={editRef} value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingMode(null); }} type="number" min={1} max={180} style={{ width: 44, textAlign: "center", fontSize: 13, fontWeight: 700, border: `1px solid ${MODE_META[m].color}`, background: "transparent", outline: "none", padding: "2px 4px", fontFamily: "'JetBrains Mono', monospace", color: "#3D2E1E", borderRadius: 0 }} />
                    <button onClick={commitEdit} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Check size={12} color={MODE_META[m].color} /></button>
                    <button onClick={() => setEditingMode(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={12} color="#8C7B6B" /></button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingMode(m); setEditVal(String(durations[m])); }} style={{ fontSize: 20, fontWeight: 700, color: "#3D2E1E", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'JetBrains Mono', monospace" }}>{durations[m]}</button>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {PRESETS[m].map((p) => (
                    <button key={p} onClick={() => applyDuration(m, p)} style={{ fontSize: 8, padding: "2px 6px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", border: `1px solid ${durations[m] === p ? MODE_META[m].color : "#D4C4B0"}`, background: durations[m] === p ? `${MODE_META[m].color}18` : "transparent", color: durations[m] === p ? MODE_META[m].color : "#8C7B6B", borderRadius: 0 }}>{p}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cat companion card */}
      <div style={{ background: "#FDFAF5", border: "1px solid #E8DDD0", padding: "24px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center", minHeight: 260, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", minHeight: 175, transition: "transform 0.6s ease", transform: abductAnim ? "translateY(-24px)" : "translateY(0)" }}>
          {catState === "idle"     && <CatIdle scale={0.6} color={catColor} />}
          {catState === "running"  && <CatIdle scale={catScale} color={catColor} />}
          {catState === "paused"   && <CatScared color={catColor} />}
          {catState === "abducted" && <CatAbducted color={catColor} />}
          {catState === "complete" && <CatComplete color={catColor} />}
        </div>
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 }}>
            <span style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, color: "#1A1008", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>{mm}</span>
            <span style={{ fontSize: 36, fontWeight: 300, color: meta.color, margin: "0 1px", fontFamily: "'JetBrains Mono', monospace" }}>:</span>
            <span style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, color: "#1A1008", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>{ss}</span>
          </div>
        </div>
        <p style={{ marginTop: 10, fontSize: 11, color: "#6A5A4A", textAlign: "center", maxWidth: 220, lineHeight: 1.55, fontFamily: "'Playfair Display', serif", fontStyle: "italic", minHeight: 34 }}>
          {currentMsg}
        </p>
        {catState === "abducted" && (
          <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, background: "#FAE8E0", border: "1px solid #E8C0B0", padding: "4px 10px", fontSize: 10, color: "#C4714A", fontFamily: "'JetBrains Mono', monospace" }}>
            <span>&#9829;</span> Likability -5
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 3 }}>
        {segments.map((filled, i) => (
          <div key={i} style={{ flex: 1, height: 6, background: filled ? meta.color : "#E8DDD0", transition: "background 0.5s" }} />
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={handlePlayPause} disabled={catState === "abducted"} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 22px", borderRadius: 999, background: isRunning ? "transparent" : "#3D2E1E", border: "1px solid #3D2E1E", color: isRunning ? "#3D2E1E" : "#FAF6F1", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.14em", cursor: catState === "abducted" ? "not-allowed" : "pointer", opacity: catState === "abducted" ? 0.5 : 1, boxShadow: isRunning ? "none" : "0 3px 0 #1a1208", transition: "all 0.1s" }}>
          {isRunning ? <Pause size={11} /> : <Play size={11} />}
          {isRunning ? "PAUSE" : catState === "complete" ? "DONE" : "START"}
        </button>
        <button onClick={handleReset} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 999, background: "transparent", border: "1px solid #D4C4B0", color: "#8C7B6B", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.14em", cursor: "pointer", boxShadow: "0 2px 0 #C4B4A0", transition: "all 0.1s" }}>
          <SkipForward size={11} /> RESET
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ width: 7, height: 7, background: i < sessions % 4 ? meta.color : "#E8DDD0", transition: "background 0.3s" }} />
          ))}
          <span style={{ fontSize: 9, letterSpacing: "0.12em", color: "#8C7B6B", marginLeft: 3 }}>{sessions}/4</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #E8DDD0", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 8, letterSpacing: "0.2em", color: "#8C7B6B", textTransform: "uppercase" }}>{durations[mode]} min · {meta.label}</span>
        <span style={{ fontSize: 8, letterSpacing: "0.15em", color: "#8C7B6B" }}>{Math.round(progress * 100)}% ELAPSED</span>
      </div>
    </div>
  );
}

export default FocusTimer;
