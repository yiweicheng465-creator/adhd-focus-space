/* ============================================================
   ADHD FOCUS SPACE — Daily Wins Tracker v4.0 (Pixel Icons)
   No emoji — all icons are pixel-art SVG in Morandi palette
   ============================================================ */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { PixelTrophy, PixelStar, PixelFire, PixelTarget, PixelLightning, PixelCheck } from "@/components/PixelIcons";

export interface Win {
  id: string; text: string; iconIdx: number; createdAt: Date;
}

// Pixel icon options for wins — no emoji
const WIN_ICONS = [
  { key: "trophy",    Component: PixelTrophy,    label: "Trophy"    },
  { key: "star",      Component: PixelStar,      label: "Star"      },
  { key: "fire",      Component: PixelFire,      label: "Fire"      },
  { key: "target",    Component: PixelTarget,    label: "Target"    },
  { key: "lightning", Component: PixelLightning, label: "Lightning" },
  { key: "check",     Component: PixelCheck,     label: "Check"     },
];

const M = {
  coral:    "oklch(0.55 0.09 35)",
  coralBg:  "oklch(0.55 0.09 35 / 0.08)",
  coralBdr: "oklch(0.55 0.09 35 / 0.28)",
  pink:     "oklch(0.62 0.06 20)",
  pinkBg:   "oklch(0.62 0.06 20 / 0.08)",
  pinkBdr:  "oklch(0.62 0.06 20 / 0.28)",
  slumber:  "oklch(0.55 0.018 70)",
  slumBg:   "oklch(0.72 0.018 75 / 0.15)",
  slumBdr:  "oklch(0.72 0.018 75 / 0.40)",
  ink:      "oklch(0.28 0.018 65)",
  muted:    "oklch(0.55 0.018 70)",
  border:   "oklch(0.88 0.014 75)",
  card:     "oklch(0.985 0.007 80)",
};

interface DailyWinsProps {
  wins: Win[];
  onWinsChange: (wins: Win[]) => void;
}

export function DailyWins({ wins, onWinsChange }: DailyWinsProps) {
  const [newWin,          setNewWin]          = useState("");
  const [selectedIcon,    setSelectedIcon]    = useState(0);
  const [showIconPicker,  setShowIconPicker]  = useState(false);

  const addWin = () => {
    if (!newWin.trim()) return;
    onWinsChange([{ id: nanoid(), text: newWin.trim(), iconIdx: selectedIcon, createdAt: new Date() }, ...wins]);
    setNewWin("");
    toast.success("Win logged! You're doing great.", { duration: 3000 });
  };

  const todayWins = wins.filter((w) => {
    const today = new Date();
    const d     = new Date(w.createdAt);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const SelectedIconComp = WIN_ICONS[selectedIcon]?.Component ?? PixelTrophy;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3" style={{ background: M.pinkBg, border: `1px solid ${M.pinkBdr}` }}>
          <div className="flex items-center gap-2 mb-1">
            <PixelTrophy size={14} color={M.pink} />
            <span className="text-xs font-medium" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Today</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: M.pink, fontFamily: "'Playfair Display', serif" }}>{todayWins.length}</p>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>wins logged</p>
        </div>
        <div className="p-3" style={{ background: M.slumBg, border: `1px solid ${M.slumBdr}` }}>
          <div className="flex items-center gap-2 mb-1">
            <PixelStar size={14} color={M.slumber} />
            <span className="text-xs font-medium" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Total</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: M.slumber, fontFamily: "'Playfair Display', serif" }}>{wins.length}</p>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>all time</p>
        </div>
      </div>

      {/* Add win */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {/* Icon picker button */}
          <button
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="w-10 h-10 flex items-center justify-center transition-all shrink-0"
            style={{ border: `1px solid ${M.border}`, background: M.card }}
            title="Choose icon"
          >
            <SelectedIconComp size={16} color={M.coral} />
          </button>
          <Input
            value={newWin}
            onChange={(e) => setNewWin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addWin()}
            placeholder="What did you accomplish?"
            className="flex-1"
            style={{ background: M.card, border: `1px solid ${M.border}`, fontFamily: "'DM Sans', sans-serif" }}
          />
          <button
            onClick={addWin}
            className="m-btn-primary shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {showIconPicker && (
          <div className="flex flex-wrap gap-2 p-3" style={{ background: M.card, border: `1px solid ${M.border}` }}>
            {WIN_ICONS.map((icon, idx) => (
              <button
                key={icon.key}
                onClick={() => { setSelectedIcon(idx); setShowIconPicker(false); }}
                className="w-9 h-9 flex items-center justify-center transition-all"
                title={icon.label}
                style={{
                  background:  selectedIcon === idx ? M.pinkBg : "transparent",
                  border:      `1px solid ${selectedIcon === idx ? M.pinkBdr : M.border}`,
                }}
              >
                <icon.Component size={16} color={selectedIcon === idx ? M.coral : M.muted} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wins list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {wins.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <PixelTrophy size={32} color={M.muted} />
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Log your first win.</p>
          </div>
        )}

        {wins.map((win) => {
          const isToday = todayWins.some((w) => w.id === win.id);
          const iconIdx = typeof win.iconIdx === "number" ? win.iconIdx : 0;
          const IconComp = WIN_ICONS[iconIdx % WIN_ICONS.length]?.Component ?? PixelTrophy;
          return (
            <div
              key={win.id}
              className="flex items-start gap-3 p-3 transition-all"
              style={{
                background: isToday ? M.pinkBg : "oklch(0.93 0.012 78 / 0.4)",
                border:     `1px solid ${isToday ? M.pinkBdr : M.border}`,
                opacity:    isToday ? 1 : 0.65,
              }}
            >
              {/* Pixel icon instead of emoji */}
              <div className="flex-shrink-0 mt-0.5">
                <IconComp size={18} color={isToday ? M.coral : M.muted} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>{win.text}</p>
                <p className="text-xs mt-0.5" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                  {isToday ? "Today" : new Date(win.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              {isToday && (
                <div className="shrink-0 flex items-center gap-1">
                  <span className="text-xs font-medium" style={{ color: M.pink, fontFamily: "'DM Sans', sans-serif" }}>Today</span>
                  <PixelStar size={10} color={M.pink} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
