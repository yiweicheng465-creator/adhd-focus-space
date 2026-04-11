/* ============================================================
   ADHD FOCUS SPACE — Sidebar v6.0 (Retro Lo-Fi Desktop)
   Icons: thin-line minimal geometric SVGs (no pixel art)
   Aesthetic: clean outline icons like a vintage OS sidebar
   ============================================================ */

import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTimer } from "@/contexts/TimerContext";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onClearData?: () => void;
}

/* ── Thin-line minimal SVG icons ──
   Clean geometric outlines — simple, no fill, consistent stroke weight */

function IconHome({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path d="M3 9.5L10 3l7 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 8v8h4v-4h2v4h4V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconFocus({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="3" stroke={color} strokeWidth="1.2"/>
      <line x1="10" y1="3" x2="10" y2="1" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="17" x2="10" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3" y1="10" x2="1" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17" y1="10" x2="19" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconTasks({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="14" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
      <line x1="7" y1="7" x2="13" y2="7" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="7" y1="10" x2="13" y2="10" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="7" y1="13" x2="10" y2="13" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconWins({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      {/* Trophy cup */}
      <path d="M7 3h6v7a3 3 0 01-6 0V3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7 6H4a2 2 0 000 4h3" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M13 6h3a2 2 0 010 4h-3" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="10" y1="13" x2="10" y2="16" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="7" y1="16" x2="13" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconDump({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      {/* Brain outline */}
      <path d="M10 16c-4 0-6-2.5-6-5.5 0-1.5.6-2.8 1.5-3.7C5.8 5.5 6 4.5 6.5 4c.5-.5 1.2-.8 2-.8.5 0 1 .1 1.5.4.5-.3 1-.4 1.5-.4.8 0 1.5.3 2 .8.5.5.7 1.5 1 2.8.9.9 1.5 2.2 1.5 3.7C16 13.5 14 16 10 16z" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
      <line x1="10" y1="3.6" x2="10" y2="16" stroke={color} strokeWidth="1" strokeLinecap="round" strokeDasharray="1.5 1.5"/>
    </svg>
  );
}

function IconGoals({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      {/* Flag on pole */}
      <line x1="5" y1="3" x2="5" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5 3h9l-2 3.5L14 10H5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconAgents({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      {/* Robot face */}
      <rect x="4" y="6" width="12" height="9" rx="2" stroke={color} strokeWidth="1.5"/>
      <rect x="2" y="9" width="2" height="3" rx="1" stroke={color} strokeWidth="1.2"/>
      <rect x="16" y="9" width="2" height="3" rx="1" stroke={color} strokeWidth="1.2"/>
      <line x1="10" y1="3" x2="10" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="3" r="1" fill={color}/>
      <circle cx="7.5" cy="10" r="1.2" fill={color}/>
      <circle cx="12.5" cy="10" r="1.2" fill={color}/>
      <line x1="7.5" y1="13" x2="12.5" y2="13" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconAI({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      {/* Sparkle / star */}
      <path d="M10 2v4M10 14v4M2 10h4M14 10h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4.93 4.93l2.83 2.83M12.24 12.24l2.83 2.83M4.93 15.07l2.83-2.83M12.24 7.76l2.83-2.83" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="10" cy="10" r="2" stroke={color} strokeWidth="1.3"/>
    </svg>
  );
}

/* NAV config — now uses thin-line icon components */
interface NavIconProps { color: string }
const NAV: Array<{
  id: string;
  short: string;
  Icon: React.FC<NavIconProps>;
  title: string;
}> = [
  { id: "dashboard", short: "HOME",   Icon: IconHome,   title: "Dashboard"   },
  { id: "focus",     short: "FOCUS",  Icon: IconFocus,  title: "Focus Timer"  },
  { id: "tasks",     short: "TASKS",  Icon: IconTasks,  title: "My Tasks"     },
  { id: "wins",      short: "WINS",   Icon: IconWins,   title: "Daily Wins"   },
  { id: "braindump", short: "DUMP",   Icon: IconDump,   title: "Brain Dump"   },
  { id: "goals",     short: "GOALS",  Icon: IconGoals,  title: "Goals"        },
  { id: "agents",    short: "AGENTS", Icon: IconAgents, title: "AI Agents"    },
  { id: "ai",        short: "AI",     Icon: IconAI,     title: "AI Features"  },
];

/* ── Floating timer pill ── */
function TimerPill({ onGoToFocus }: { onGoToFocus: () => void }) {
  const { phase, remaining, mode } = useTimer();
  const active = phase === "running" || phase === "paused" || phase === "transition";
  if (!active) return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const modeColor = mode === "focus" ? "oklch(0.52 0.10 32)" : mode === "short" ? "oklch(0.60 0.07 138)" : "oklch(0.58 0.08 220)";
  const modeBg = mode === "focus" ? "oklch(0.52 0.10 32 / 0.10)" : mode === "short" ? "oklch(0.60 0.07 138 / 0.10)" : "oklch(0.58 0.08 220 / 0.10)";
  const label = mode === "focus" ? "FOCUS" : mode === "short" ? "SHORT" : "LONG";

  return (
    <button
      onClick={onGoToFocus}
      title={`${mm}:${ss} · ${label} — click to go to timer`}
      className="w-full flex flex-col items-center justify-center py-2 transition-all duration-200"
      style={{
        background: modeBg,
        borderTop: `1px solid ${modeColor}`,
        borderBottom: `1px solid ${modeColor}`,
      }}
    >
      <div style={{ position: "relative", width: 6, height: 6, marginBottom: 3 }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%", background: modeColor,
          animation: phase === "running" ? "timerPulse 2s ease-in-out infinite" : "none"
        }} />
      </div>
      <span
        className="tabular-nums"
        style={{ fontSize: 10, letterSpacing: "0.06em", color: modeColor, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}
      >
        {phase === "transition" ? "NEXT" : `${mm}:${ss}`}
      </span>
      <span
        style={{ fontSize: 6, color: modeColor, fontFamily: "'Space Mono', monospace", marginTop: 2, opacity: 0.75, letterSpacing: "0.12em" }}
      >
        {phase === "paused" ? "PAUSED" : label}
      </span>
    </button>
  );
}

/* ── Logo mark ── */
function LogoMark() {
  return (
    <div className="w-10 h-10 flex items-center justify-center" title="ADHD Focus Space">
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/logo-focus-transparent-7auUnrhQ46WmQP8YJF5StA.webp"
        alt="ADHD Focus Space logo"
        className="w-9 h-9 object-contain"
        style={{ filter: "saturate(0.85) sepia(0.15)" }}
      />
    </div>
  );
}

function LiveTime() {
  const fmt = () =>
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      style={{ fontSize: 8, letterSpacing: "0.08em", color: "oklch(0.60 0.015 68)", fontFamily: "'Space Mono', monospace" }}
    >
      {t}
    </span>
  );
}

/* Calendar icon link to /monthly */
function MonthlyLink() {
  const [location, navigate] = useLocation();
  const active = location === "/monthly";
  const color = active ? "oklch(0.52 0.10 32)" : "oklch(0.62 0.018 68)";
  return (
    <button
      onClick={() => navigate("/monthly")}
      title="Monthly Progress"
      className="relative w-full flex flex-col items-center justify-center py-2.5 transition-all duration-150"
      style={{ background: active ? "oklch(0.52 0.10 32 / 0.08)" : "transparent" }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.52 0.10 32 / 0.04)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5" style={{ background: "oklch(0.52 0.10 32)" }} />
      )}
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="14" height="12" rx="1.5" stroke={color} strokeWidth="1.4"/>
        <line x1="2" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.2"/>
        <line x1="6" y1="2" x2="6" y2="6" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="12" y1="2" x2="12" y2="6" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="6" cy="11" r="1" fill={color} />
        <circle cx="9" cy="11" r="1" fill={color} />
        <circle cx="12" cy="11" r="1" fill={color} />
        <circle cx="6" cy="14" r="1" fill={color} />
        <circle cx="9" cy="14" r="1" fill={color} />
      </svg>
      <span style={{ fontSize: 7, marginTop: 2, letterSpacing: "0.12em", fontFamily: "'Space Mono', monospace", color }}>MTH</span>
    </button>
  );
}

/* Info icon link to /insight */
function InsightLink() {
  const [location, navigate] = useLocation();
  const active = location === "/insight";
  const color = active ? "oklch(0.52 0.10 32)" : "oklch(0.62 0.018 68)";
  return (
    <button
      onClick={() => navigate("/insight")}
      title="Insight"
      className="relative w-full flex flex-col items-center justify-center py-2.5 transition-all duration-150"
      style={{ background: active ? "oklch(0.52 0.10 32 / 0.08)" : "transparent" }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.52 0.10 32 / 0.04)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5" style={{ background: "oklch(0.52 0.10 32)" }} />
      )}
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke={color} strokeWidth="1.4"/>
        <line x1="9" y1="8" x2="9" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="5.5" r="0.9" fill={color} />
      </svg>
      <span style={{ fontSize: 7, marginTop: 2, letterSpacing: "0.12em", fontFamily: "'Space Mono', monospace", color }}>IDEA</span>
    </button>
  );
}

/* Beaker icon link to /timer-prototypes */
function PrototypesLink() {
  const [location, navigate] = useLocation();
  const active = location === "/timer-prototypes";
  const color = active ? "oklch(0.52 0.10 32)" : "oklch(0.62 0.018 68)";
  return (
    <button
      onClick={() => navigate("/timer-prototypes")}
      title="Timer Prototypes"
      className="relative w-full flex flex-col items-center justify-center py-2.5 transition-all duration-150"
      style={{ background: active ? "oklch(0.52 0.10 32 / 0.08)" : "transparent" }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.52 0.10 32 / 0.04)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5" style={{ background: "oklch(0.52 0.10 32)" }} />
      )}
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M6 2v6L2 14a1 1 0 00.9 1.5h12.2A1 1 0 0016 14l-4-6V2" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="5" y1="2" x2="13" y2="2" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="7" cy="12" r="1" fill={color} />
        <circle cx="11" cy="13.5" r="0.7" fill={color} />
      </svg>
      <span style={{ fontSize: 7, marginTop: 2, letterSpacing: "0.12em", fontFamily: "'Space Mono', monospace", color }}>LAB</span>
    </button>
  );
}

if (typeof document !== "undefined" && !document.getElementById("sidebar-timer-pulse")) {
  const s = document.createElement("style");
  s.id = "sidebar-timer-pulse";
  s.textContent = `@keyframes timerPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }`;
  document.head.appendChild(s);
}

export function Sidebar({ activeSection, onSectionChange, onClearData }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-14 z-40 flex flex-col items-center py-4"
      style={{
        background: "oklch(0.950 0.018 70)",
        borderRight: "1.5px solid oklch(0.84 0.022 68)",
        boxShadow: "2px 0 8px oklch(0.60 0.020 60 / 0.06)",
      }}
    >
      {/* Live time at top */}
      <div className="mb-3 flex flex-col items-center gap-1">
        <LiveTime />
      </div>

      {/* Divider */}
      <div style={{ width: "70%", height: "1px", background: "oklch(0.84 0.022 68)", marginBottom: 6 }} />

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 w-full px-1.5">
        {NAV.map(({ id, short, Icon, title }) => {
          const active = activeSection === id;
          const color = active ? "oklch(0.52 0.10 32)" : "oklch(0.58 0.018 68)";
          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              title={title}
              className="relative w-full flex flex-col items-center justify-center py-2 transition-all duration-150"
              style={{
                background: active ? "oklch(0.52 0.10 32 / 0.10)" : "transparent",
                borderRadius: 3,
                border: active ? "1px solid oklch(0.52 0.10 32 / 0.20)" : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.52 0.10 32 / 0.05)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5"
                  style={{ background: "oklch(0.52 0.10 32)", borderRadius: "0 2px 2px 0" }}
                />
              )}
              <Icon color={color} />
              <span
                style={{
                  fontSize: 6.5,
                  marginTop: 2,
                  letterSpacing: "0.12em",
                  fontFamily: "'Space Mono', monospace",
                  color,
                  fontWeight: active ? 700 : 400,
                }}
              >
                {short}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Timer pill */}
      <div className="w-full my-1">
        <TimerPill onGoToFocus={() => onSectionChange("focus")} />
      </div>

      {/* Divider */}
      <div style={{ width: "70%", height: "1px", background: "oklch(0.84 0.022 68)", marginBottom: 4 }} />

      {/* Bottom links */}
      <div className="flex flex-col w-full gap-0">
        <MonthlyLink />
        <InsightLink />
        <PrototypesLink />
      </div>
    </aside>
  );
}
