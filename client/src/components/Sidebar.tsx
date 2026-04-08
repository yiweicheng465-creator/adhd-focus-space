/* ============================================================
   ADHD FOCUS SPACE — Sidebar v3.0 (Morandi)
   Logo: SVG mark — overlapping circles with serif "A"
   Colors: parchment bg, coral active, griffin charcoal text
   ============================================================ */

import React, { useEffect, useState } from "react";
import {
  Bot, Brain, Clock,
  LayoutDashboard, Sparkles,
  Flower2, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const NAV = [
  { id: "dashboard", short: "HOME",   Icon: LayoutDashboard, title: "Dashboard"   },
  { id: "focus",     short: "FOCUS",  Icon: Clock,           title: "Focus Timer"  },
  { id: "tasks",     short: "TASKS",  Icon: Star,            title: "My Tasks"     },
  { id: "wins",      short: "WINS",   Icon: Sparkles,        title: "Daily Wins"   },
  { id: "braindump", short: "DUMP",   Icon: Brain,           title: "Brain Dump"   },
  { id: "goals",     short: "GOALS",  Icon: Flower2,         title: "Goals"        },
  { id: "agents",    short: "AGENTS", Icon: Bot,             title: "AI Agents"    },
];

/* ── Logo mark: refined editorial monogram ── */
function LogoMark() {
  return (
    <div
      className="w-10 h-10 flex items-center justify-center"
      title="ADHD Focus Space"
      style={{ background: "oklch(0.975 0.010 72)" }}
    >
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-logo-blob2-8QDj2kgAG624iuGTX4JAY6.webp"
        alt="ADHD Focus Space logo"
        className="w-10 h-10 object-contain"
        style={{
          mixBlendMode: "multiply",
          filter: "saturate(1.1)",
        }}
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

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-14 z-40 flex flex-col items-center py-5"
      style={{
        background: "oklch(0.975 0.010 72)",
        borderRight: "1px solid oklch(0.90 0.010 72)",
      }}
    >
      {/* Logo */}
      <div className="mb-5">
        <LogoMark />
      </div>

      {/* Thin rule */}
      <div className="w-6 mb-4" style={{ borderTop: "1px solid oklch(0.90 0.010 72)" }} />

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 w-full px-2">
        {NAV.map(({ id, short, Icon, title }) => {
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
              <Icon
                className="w-[15px] h-[15px]"
                style={{ color: active ? "oklch(0.55 0.09 35)" : "oklch(0.58 0.018 70)" }}
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

      {/* Bottom: sunset accent + time */}
      <div className="mt-auto flex flex-col items-center gap-2 pb-1">
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
