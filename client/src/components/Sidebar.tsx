/* ============================================================
   ADHD FOCUS SPACE — Sidebar v4.0 (Pixel Icons)
   Icons: cute pixel-art SVG characters in beige/terracotta
   Colors: parchment bg, coral active, griffin charcoal text
   ============================================================ */

import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  PixelHome,
  PixelFocus,
  PixelTasks,
  PixelWins,
  PixelDump,
  PixelGoals,
  PixelAgents,
  PixelBrain,
} from "@/components/PixelIcons";
import { useTimer } from "@/contexts/TimerContext";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onClearData?: () => void;
}

const NAV = [
  { id: "dashboard", short: "HOME",   PixelIcon: PixelHome,   title: "Dashboard"   },
  { id: "focus",     short: "FOCUS",  PixelIcon: PixelFocus,  title: "Focus Timer"  },
  { id: "tasks",     short: "TASKS",  PixelIcon: PixelTasks,  title: "My Tasks"     },
  { id: "wins",      short: "WINS",   PixelIcon: PixelWins,   title: "Daily Wins"   },
  { id: "braindump", short: "DUMP",   PixelIcon: PixelDump,   title: "Brain Dump"   },
  { id: "goals",     short: "GOALS",  PixelIcon: PixelGoals,  title: "Goals"        },
  { id: "agents",    short: "AGENTS", PixelIcon: PixelAgents, title: "AI Agents"    },
  { id: "ai",        short: "AI",     PixelIcon: PixelBrain,  title: "AI Features"  },
];

/* ── Floating timer pill — shows live countdown in sidebar when running/paused ── */
function TimerPill({ onGoToFocus }: { onGoToFocus: () => void }) {
  const { phase, remaining, mode } = useTimer();
  const active = phase === "running" || phase === "paused" || phase === "transition";
  if (!active) return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const modeColor = mode === "focus" ? "oklch(0.55 0.12 35)" : mode === "short" ? "oklch(0.50 0.08 145)" : "oklch(0.50 0.07 240)";
  const modeBg = mode === "focus" ? "oklch(0.55 0.12 35 / 0.12)" : mode === "short" ? "oklch(0.50 0.08 145 / 0.12)" : "oklch(0.50 0.07 240 / 0.12)";
  const label = mode === "focus" ? "FOCUS" : mode === "short" ? "SHORT" : "LONG";

  return (
    <button
      onClick={onGoToFocus}
      title={`${mm}:${ss} · ${label} — click to go to timer`}
      className="w-full flex flex-col items-center justify-center py-2 transition-all duration-200"
      style={{ background: modeBg, borderTop: `1px solid ${modeColor}20`, borderBottom: `1px solid ${modeColor}20`, cursor: "pointer" }}
    >
      {/* Pulsing dot */}
      <div style={{ position: "relative", width: 6, height: 6, marginBottom: 3 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: modeColor, animation: phase === "running" ? "timerPulse 2s ease-in-out infinite" : "none" }} />
      </div>
      <span
        className="tabular-nums font-bold"
        style={{ fontSize: 11, letterSpacing: "0.04em", color: modeColor, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}
      >
        {phase === "transition" ? "NEXT" : `${mm}:${ss}`}
      </span>
      <span
        className="tracking-widest"
        style={{ fontSize: 6, color: modeColor, fontFamily: "'JetBrains Mono', monospace", marginTop: 2, opacity: 0.75 }}
      >
        {phase === "paused" ? "PAUSED" : label}
      </span>
    </button>
  );
}

/* ── Logo mark ── */
function LogoMark() {
  return (
    <div
      className="w-10 h-10 flex items-center justify-center"
      title="ADHD Focus Space"
    >
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/logo-focus-transparent-7auUnrhQ46WmQP8YJF5StA.webp"
        alt="ADHD Focus Space logo"
        className="w-10 h-10 object-contain"
        style={{ filter: "saturate(1.05)" }}
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
      className="text-[8px] tracking-widest tabular-nums"
      style={{ color: "oklch(0.62 0.015 70)", fontFamily: "'DM Sans', sans-serif" }}
    >
      {t}
    </span>
  );
}

/* Calendar icon link to /monthly */
function MonthlyLink() {
  const [location, navigate] = useLocation();
  const active = location === "/monthly";
  return (
    <button
      onClick={() => navigate("/monthly")}
      title="Monthly Progress"
      className="relative w-full flex flex-col items-center justify-center py-2.5 transition-all duration-150"
      style={{ background: active ? "oklch(0.55 0.09 35 / 0.09)" : "transparent" }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.55 0.09 35 / 0.04)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5" style={{ background: "oklch(0.55 0.09 35)" }} />
      )}
      {/* Calendar SVG */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="14" height="12" rx="2" stroke={active ? "oklch(0.55 0.09 35)" : "oklch(0.65 0.015 70)"} strokeWidth="1.4"/>
        <line x1="2" y1="8" x2="16" y2="8" stroke={active ? "oklch(0.55 0.09 35)" : "oklch(0.65 0.015 70)"} strokeWidth="1.2"/>
        <line x1="6" y1="2" x2="6" y2="6" stroke={active ? "oklch(0.55 0.09 35)" : "oklch(0.65 0.015 70)"} strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="12" y1="2" x2="12" y2="6" stroke={active ? "oklch(0.55 0.09 35)" : "oklch(0.65 0.015 70)"} strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="6" cy="11" r="1" fill={active ? "oklch(0.55 0.09 35)" : "oklch(0.72 0.015 70)"} />
        <circle cx="9" cy="11" r="1" fill={active ? "oklch(0.55 0.09 35)" : "oklch(0.72 0.015 70)"} />
        <circle cx="12" cy="11" r="1" fill={active ? "oklch(0.55 0.09 35)" : "oklch(0.72 0.015 70)"} />
        <circle cx="6" cy="14" r="1" fill={active ? "oklch(0.55 0.09 35)" : "oklch(0.72 0.015 70)"} />
        <circle cx="9" cy="14" r="1" fill={active ? "oklch(0.55 0.09 35)" : "oklch(0.72 0.015 70)"} />
      </svg>
      <span
        className="text-[7px] mt-1 tracking-[0.12em] font-medium"
        style={{ fontFamily: "'DM Sans', sans-serif", color: active ? "oklch(0.55 0.09 35)" : "oklch(0.65 0.015 70)" }}
      >
        MTH
      </span>
    </button>
  );
}

/* Info/bulb icon link to /insight */
function InsightLink() {
  const [location, navigate] = useLocation();
  const active = location === "/insight";
  return (
    <button
      onClick={() => navigate("/insight")}
      title="Insight — how this app works"
      className="relative w-full flex flex-col items-center justify-center py-2.5 transition-all duration-150"
      style={{ background: active ? "oklch(0.55 0.09 35 / 0.09)" : "transparent" }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.55 0.09 35 / 0.04)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5" style={{ background: "oklch(0.55 0.09 35)" }} />
      )}
      {/* Simple circle-i icon */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke={active ? "oklch(0.55 0.09 35)" : "oklch(0.65 0.015 70)"} strokeWidth="1.4"/>
        <line x1="9" y1="8" x2="9" y2="13" stroke={active ? "oklch(0.55 0.09 35)" : "oklch(0.65 0.015 70)"} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="5.5" r="0.9" fill={active ? "oklch(0.55 0.09 35)" : "oklch(0.72 0.015 70)"} />
      </svg>
      <span
        className="text-[7px] mt-1 tracking-[0.12em] font-medium"
        style={{ fontFamily: "'DM Sans', sans-serif", color: active ? "oklch(0.55 0.09 35)" : "oklch(0.65 0.015 70)" }}
      >
        IDEA
      </span>
    </button>
  );
}

/* Beaker icon link to /timer-prototypes */
function PrototypesLink() {
  const [location, navigate] = useLocation();
  const active = location === "/timer-prototypes";
  return (
    <button
      onClick={() => navigate("/timer-prototypes")}
      title="Timer Prototypes"
      className="relative w-full flex flex-col items-center justify-center py-2.5 transition-all duration-150"
      style={{ background: active ? "oklch(0.55 0.09 35 / 0.09)" : "transparent" }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.55 0.09 35 / 0.04)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5" style={{ background: "oklch(0.55 0.09 35)" }} />
      )}
      {/* Beaker SVG */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M6 2v6L2 14a1 1 0 00.9 1.5h12.2A1 1 0 0016 14l-4-6V2" stroke={active ? "oklch(0.55 0.09 35)" : "oklch(0.65 0.015 70)"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="5" y1="2" x2="13" y2="2" stroke={active ? "oklch(0.55 0.09 35)" : "oklch(0.65 0.015 70)"} strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="7" cy="12" r="1" fill={active ? "oklch(0.55 0.09 35)" : "oklch(0.72 0.015 70)"} />
        <circle cx="11" cy="13.5" r="0.7" fill={active ? "oklch(0.55 0.09 35)" : "oklch(0.72 0.015 70)"} />
      </svg>
      <span
        className="text-[7px] mt-1 tracking-[0.12em] font-medium"
        style={{ fontFamily: "'DM Sans', sans-serif", color: active ? "oklch(0.55 0.09 35)" : "oklch(0.65 0.015 70)" }}
      >
        LAB
      </span>
    </button>
  );
}

// Inject timerPulse keyframe once
if (typeof document !== "undefined" && !document.getElementById("sidebar-timer-pulse")) {
  const s = document.createElement("style");
  s.id = "sidebar-timer-pulse";
  s.textContent = `@keyframes timerPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }`;
  document.head.appendChild(s);
}

export function Sidebar({ activeSection, onSectionChange, onClearData }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-14 z-40 flex flex-col items-center py-5"
      style={{
        background: "oklch(0.975 0.010 72)",
        borderRight: "1px solid oklch(0.90 0.010 72)",
      }}
    >


      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 w-full px-2">
        {NAV.map(({ id, short, PixelIcon, title }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              title={title}
              className={cn(
                "relative w-full flex flex-col items-center justify-center py-2.5 transition-all duration-150"
              )}
              style={{
                background: active ? "oklch(0.55 0.09 35 / 0.09)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.55 0.09 35 / 0.04)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5"
                  style={{ background: "oklch(0.55 0.09 35)" }}
                />
              )}
              <PixelIcon
                size={18}
                active={active}
              />
              <span
                className="text-[7px] mt-1 tracking-[0.12em] font-medium"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: active ? "oklch(0.55 0.09 35)" : "oklch(0.65 0.015 70)",
                }}
              >
                {short}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Timer pill — appears when timer is running, click navigates to focus */}
      <TimerPill onGoToFocus={() => onSectionChange("focus")} />

      {/* Monthly + Prototypes links — bottom of nav */}
      <div className="w-full px-2 mt-1">
        <MonthlyLink />
        <InsightLink />
        <PrototypesLink />
        {/* Subtle clear-data button — only visible on hover */}
        {onClearData && (
          <button
            onClick={onClearData}
            title="Clear all test data"
            className="relative w-full flex flex-col items-center justify-center py-2 opacity-20 hover:opacity-60 transition-opacity duration-200"
            style={{ background: "transparent" }}
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <polyline points="3,6 15,6" stroke="oklch(0.45 0.08 15)" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M7 6V4h4v2" stroke="oklch(0.45 0.08 15)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="4" y="6" width="10" height="9" rx="1.5" stroke="oklch(0.45 0.08 15)" strokeWidth="1.4"/>
              <line x1="7" y1="9" x2="7" y2="13" stroke="oklch(0.45 0.08 15)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="11" y1="9" x2="11" y2="13" stroke="oklch(0.45 0.08 15)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Bottom: time */}
      <div className="flex flex-col items-center gap-2 pb-1">
        {/* Tiny geometric diamond */}
        <svg width="8" height="8" viewBox="0 0 8 8" style={{ opacity: 0.3 }}>
          <rect x="1" y="1" width="6" height="6" transform="rotate(45 4 4)" fill="oklch(0.55 0.09 35)" />
        </svg>
        <div className="w-6" style={{ borderTop: "1px solid oklch(0.90 0.010 72)" }} />
        <LiveTime />
      </div>
    </aside>
  );
}
