/* ============================================================
   ADHD FOCUS SPACE — Editorial Sidebar v2.0
   Design: Warm cream, thin 1px borders, serif logo mark
   Layout: Narrow 56px column, icon + tiny caps label
   ============================================================ */

import React, { useEffect, useState } from "react";
import {
  Bot,
  Brain,
  CheckSquare,
  Clock,
  LayoutDashboard,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const NAV_ITEMS = [
  { id: "dashboard",  shortLabel: "HOME",   icon: LayoutDashboard, title: "Dashboard"  },
  { id: "focus",      shortLabel: "FOCUS",  icon: Clock,           title: "Focus Timer" },
  { id: "tasks",      shortLabel: "TASKS",  icon: CheckSquare,     title: "My Tasks"   },
  { id: "wins",       shortLabel: "WINS",   icon: Sparkles,        title: "Daily Wins" },
  { id: "braindump",  shortLabel: "DUMP",   icon: Brain,           title: "Brain Dump" },
  { id: "goals",      shortLabel: "GOALS",  icon: Target,          title: "Goals"      },
  { id: "agents",     shortLabel: "AGENTS", icon: Bot,             title: "AI Agents"  },
];

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
      className="text-[8px] tracking-widest"
      style={{ color: "oklch(0.62 0.015 70)", fontFamily: "'DM Sans', sans-serif" }}
    >
      {t}
    </span>
  );
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-14 z-40 flex flex-col items-center py-5 gap-0"
      style={{
        background: "oklch(0.955 0.018 78)",
        borderRight: "1px solid oklch(0.87 0.014 75)",
      }}
    >
      {/* Logo mark */}
      <div className="mb-5 flex flex-col items-center">
        <div
          className="w-8 h-8 flex items-center justify-center"
          style={{
            border: "1px solid oklch(0.52 0.14 35)",
            background: "transparent",
          }}
        >
          <span
            className="text-sm font-bold italic"
            style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.52 0.14 35)" }}
          >
            A
          </span>
        </div>
      </div>

      {/* Thin divider */}
      <div className="w-6 mb-4" style={{ borderTop: "1px solid oklch(0.87 0.014 75)" }} />

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 flex-1 w-full px-2">
        {NAV_ITEMS.map(({ id, shortLabel, icon: Icon, title }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              title={title}
              className={cn(
                "relative w-full flex flex-col items-center justify-center py-2.5 transition-all duration-150 group",
                isActive ? "" : "hover:bg-[oklch(0.52_0.14_35_/_0.04)]"
              )}
              style={{
                background: isActive ? "oklch(0.52 0.14 35 / 0.08)" : undefined,
              }}
            >
              {/* Active left bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5"
                  style={{ background: "oklch(0.52 0.14 35)" }}
                />
              )}
              <Icon
                className="w-[15px] h-[15px] transition-colors"
                style={{ color: isActive ? "oklch(0.52 0.14 35)" : "oklch(0.55 0.015 70)" }}
              />
              <span
                className="text-[7px] mt-1 tracking-[0.12em] font-medium"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: isActive ? "oklch(0.52 0.14 35)" : "oklch(0.65 0.015 70)",
                }}
              >
                {shortLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom: live time */}
      <div className="mt-auto flex flex-col items-center gap-1 pb-1">
        <div className="w-6" style={{ borderTop: "1px solid oklch(0.87 0.014 75)" }} />
        <div className="mt-2">
          <LiveTime />
        </div>
      </div>
    </aside>
  );
}
