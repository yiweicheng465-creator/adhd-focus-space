/* ============================================================
   ADHD FOCUS SPACE — Sidebar Navigation
   Design: Deep navy (#0F172A) fixed sidebar, icon rail + labels
   Expands on hover, collapses to icon-only on small screens
   ============================================================ */

import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bot,
  Brain,
  CheckSquare,
  Clock,
  LayoutDashboard,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "focus", label: "Focus Timer", icon: Clock },
  { id: "tasks", label: "My Tasks", icon: CheckSquare },
  { id: "wins", label: "Daily Wins", icon: Sparkles },
  { id: "braindump", label: "Brain Dump", icon: Brain },
  { id: "goals", label: "Goals", icon: Target },
  { id: "agents", label: "AI Agents", icon: Bot },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-40 flex flex-col sidebar-transition",
        "bg-[oklch(0.18_0.04_255)] border-r border-[oklch(0.28_0.04_255)]",
        expanded ? "w-56" : "w-16"
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[oklch(0.28_0.04_255)] overflow-hidden">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[oklch(0.65_0.14_185)] flex items-center justify-center glow-teal">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {expanded && (
          <span className="ml-3 font-display font-bold text-white text-sm whitespace-nowrap opacity-0 animate-[fadeIn_0.15s_ease-out_0.05s_forwards]">
            Focus Space
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <Tooltip key={id} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSectionChange(id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-150",
                    "text-[oklch(0.7_0.02_255)] hover:text-white",
                    isActive
                      ? "bg-[oklch(0.65_0.14_185_/_0.2)] text-[oklch(0.65_0.14_185)] border border-[oklch(0.65_0.14_185_/_0.3)]"
                      : "hover:bg-[oklch(0.25_0.05_255)]"
                  )}
                >
                  <Icon
                    className={cn(
                      "flex-shrink-0 w-5 h-5",
                      isActive && "text-[oklch(0.65_0.14_185)]"
                    )}
                  />
                  {expanded && (
                    <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                      {label}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {!expanded && (
                <TooltipContent side="right" className="bg-[oklch(0.25_0.05_255)] text-white border-[oklch(0.35_0.05_255)]">
                  {label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom streak indicator */}
      <div className="p-3 border-t border-[oklch(0.28_0.04_255)]">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-3 px-2 py-2 rounded-lg",
              "bg-[oklch(0.75_0.15_75_/_0.1)] border border-[oklch(0.75_0.15_75_/_0.2)]"
            )}>
              <span className="text-lg flex-shrink-0">🔥</span>
              {expanded && (
                <div className="overflow-hidden">
                  <p className="text-xs text-[oklch(0.75_0.15_75)] font-medium whitespace-nowrap">Day Streak</p>
                  <p className="text-xs text-[oklch(0.6_0.02_255)] whitespace-nowrap">Keep it up!</p>
                </div>
              )}
            </div>
          </TooltipTrigger>
          {!expanded && (
            <TooltipContent side="right" className="bg-[oklch(0.25_0.05_255)] text-white border-[oklch(0.35_0.05_255)]">
              Day Streak — Keep it up!
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
