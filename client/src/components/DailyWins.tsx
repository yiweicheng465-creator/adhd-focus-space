/* ============================================================
   ADHD FOCUS SPACE — Daily Wins Tracker v5.0
   Icons: lifestyle SVG (health, study, work, social, creative,
          mindfulness, fitness, nutrition) — no pixel text
   Each logged win has a clickable icon to change category.
   ============================================================ */

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";

export interface Win {
  id: string; text: string; iconIdx: number; createdAt: Date;
}

// ── Lifestyle SVG icons ────────────────────────────────────────────────────────
interface IconProps { size?: number; color?: string }

function IconHealth({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Heart with pulse line */}
      <path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 0.5C21 14.5 12 21 12 21z" />
      <polyline points="6,12 9,9 11,14 13,10 15,12 18,12" strokeWidth="1.4" />
    </svg>
  );
}

function IconStudy({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Open book */}
      <path d="M2 6s2-1 6-1 6 1 6 1v13s-2-1-6-1-6 1-6 1V6z" />
      <path d="M14 6s2-1 6-1v13s-2-1-6-1" />
      <line x1="12" y1="6" x2="12" y2="19" />
    </svg>
  );
}

function IconWork({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Briefcase */}
      <rect x="2" y="8" width="20" height="13" rx="2" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="2" y1="14" x2="22" y2="14" />
    </svg>
  );
}

function IconSocial({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Two people */}
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <circle cx="18" cy="7" r="2.5" />
      <path d="M21 21v-1.5a3 3 0 0 0-2.5-2.97" />
    </svg>
  );
}

function IconCreative({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Palette */}
      <circle cx="12" cy="12" r="9" />
      <circle cx="8.5" cy="10" r="1.5" fill={color} stroke="none" />
      <circle cx="15.5" cy="10" r="1.5" fill={color} stroke="none" />
      <circle cx="12" cy="7" r="1.5" fill={color} stroke="none" />
      <path d="M12 21a4 4 0 0 0 4-4c0-2-2-3-4-3s-4 1-4 3a4 4 0 0 0 4 4z" fill={color} stroke="none" opacity="0.4" />
    </svg>
  );
}

function IconMindful({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Lotus / meditation */}
      <path d="M12 20c0 0-7-5-7-10a7 7 0 0 1 14 0c0 5-7 10-7 10z" />
      <path d="M12 20c0 0 4-3 4-7" strokeWidth="1.2" opacity="0.5" />
      <path d="M12 20c0 0-4-3-4-7" strokeWidth="1.2" opacity="0.5" />
      <circle cx="12" cy="10" r="2" fill={color} stroke="none" opacity="0.5" />
    </svg>
  );
}

function IconFitness({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Dumbbell */}
      <line x1="6" y1="12" x2="18" y2="12" />
      <rect x="2" y="9" width="4" height="6" rx="1" />
      <rect x="18" y="9" width="4" height="6" rx="1" />
      <rect x="5" y="10.5" width="2" height="3" rx="0.5" />
      <rect x="17" y="10.5" width="2" height="3" rx="0.5" />
    </svg>
  );
}

function IconNutrition({ size = 20, color = "#888" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Apple */}
      <path d="M12 3c-1 0-3 1-3 3 0 0 1-1 3-1s3 1 3 1c0-2-2-3-3-3z" fill={color} stroke="none" opacity="0.4" />
      <path d="M12 5c-4 0-6 3-6 7 0 5 3 8 6 8s6-3 6-8c0-4-2-7-6-7z" />
      <line x1="12" y1="3" x2="13" y2="1" />
    </svg>
  );
}

// ── Icon registry ──────────────────────────────────────────────────────────────
const WIN_ICONS = [
  { key: "health",    Component: IconHealth,    label: "健康",    color: "oklch(0.60 0.10 15)"  },
  { key: "study",     Component: IconStudy,     label: "学习",    color: "oklch(0.52 0.08 230)" },
  { key: "work",      Component: IconWork,      label: "工作",    color: "oklch(0.50 0.07 145)" },
  { key: "social",    Component: IconSocial,    label: "社交",    color: "oklch(0.58 0.09 55)"  },
  { key: "creative",  Component: IconCreative,  label: "创意",    color: "oklch(0.55 0.10 300)" },
  { key: "mindful",   Component: IconMindful,   label: "冥想",    color: "oklch(0.55 0.07 185)" },
  { key: "fitness",   Component: IconFitness,   label: "运动",    color: "oklch(0.53 0.09 35)"  },
  { key: "nutrition", Component: IconNutrition, label: "饮食",    color: "oklch(0.52 0.10 130)" },
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

// ── Floating icon picker popover ───────────────────────────────────────────────
function IconPickerPopover({
  current,
  onSelect,
  onClose,
}: {
  current: number;
  onSelect: (idx: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        zIndex: 50,
        top: "calc(100% + 6px)",
        left: 0,
        background: M.card,
        border: `1px solid ${M.border}`,
        borderRadius: 10,
        padding: 10,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 6,
        boxShadow: "0 4px 20px oklch(0.28 0.018 65 / 0.12)",
        minWidth: 196,
      }}
    >
      {WIN_ICONS.map((icon, idx) => {
        const active = idx === current;
        return (
          <button
            key={icon.key}
            onClick={() => { onSelect(idx); onClose(); }}
            title={icon.label}
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: `1.5px solid ${active ? icon.color : "transparent"}`,
              background: active ? `${icon.color}18` : "transparent",
              cursor: "pointer",
              transition: "background 0.12s, border-color 0.12s",
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLButtonElement).style.background = `${icon.color}12`;
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <icon.Component size={20} color={icon.color} />
          </button>
        );
      })}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface DailyWinsProps {
  wins: Win[];
  onWinsChange: (wins: Win[]) => void;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DailyWins({ wins, onWinsChange }: DailyWinsProps) {
  const [newWin,         setNewWin]         = useState("");
  const [selectedIcon,   setSelectedIcon]   = useState(0);
  const [showNewPicker,  setShowNewPicker]  = useState(false);
  // Which win item has its picker open: win id or null
  const [editingWinId,   setEditingWinId]   = useState<string | null>(null);

  const addWin = () => {
    if (!newWin.trim()) return;
    onWinsChange([{ id: nanoid(), text: newWin.trim(), iconIdx: selectedIcon, createdAt: new Date() }, ...wins]);
    setNewWin("");
    toast.success("Win logged! You're doing great.", { duration: 3000 });
  };

  const changeWinIcon = (winId: string, idx: number) => {
    onWinsChange(wins.map((w) => w.id === winId ? { ...w, iconIdx: idx } : w));
  };

  const todayWins = wins.filter((w) => {
    const today = new Date();
    const d     = new Date(w.createdAt);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const SelectedIconDef = WIN_ICONS[selectedIcon] ?? WIN_ICONS[0];

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3" style={{ background: M.pinkBg, border: `1px solid ${M.pinkBdr}` }}>
          <div className="flex items-center gap-2 mb-1">
            <IconHealth size={14} color={M.pink} />
            <span className="text-xs font-medium" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Today</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: M.pink, fontFamily: "'Playfair Display', serif" }}>{todayWins.length}</p>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>wins logged</p>
        </div>
        <div className="p-3" style={{ background: M.slumBg, border: `1px solid ${M.slumBdr}` }}>
          <div className="flex items-center gap-2 mb-1">
            <IconFitness size={14} color={M.slumber} />
            <span className="text-xs font-medium" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Total</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: M.slumber, fontFamily: "'Playfair Display', serif" }}>{wins.length}</p>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>all time</p>
        </div>
      </div>

      {/* Add win input row */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {/* Icon picker trigger */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNewPicker((v) => !v)}
              className="w-10 h-10 flex items-center justify-center transition-all shrink-0"
              style={{
                border: `1.5px solid ${showNewPicker ? SelectedIconDef.color : M.border}`,
                background: showNewPicker ? `${SelectedIconDef.color}12` : M.card,
                borderRadius: 6,
              }}
              title="选择类别"
            >
              <SelectedIconDef.Component size={18} color={SelectedIconDef.color} />
            </button>
            {showNewPicker && (
              <IconPickerPopover
                current={selectedIcon}
                onSelect={setSelectedIcon}
                onClose={() => setShowNewPicker(false)}
              />
            )}
          </div>

          <Input
            value={newWin}
            onChange={(e) => setNewWin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addWin()}
            placeholder="What did you accomplish?"
            className="flex-1"
            style={{ background: M.card, border: `1px solid ${M.border}`, fontFamily: "'DM Sans', sans-serif" }}
          />
          <button onClick={addWin} className="m-btn-primary shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Wins list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {wins.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <IconHealth size={32} color={M.muted} />
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Log your first win.</p>
          </div>
        )}

        {wins.map((win) => {
          const isToday   = todayWins.some((w) => w.id === win.id);
          const iconIdx   = typeof win.iconIdx === "number" ? win.iconIdx % WIN_ICONS.length : 0;
          const iconDef   = WIN_ICONS[iconIdx];
          const isEditing = editingWinId === win.id;

          return (
            <div
              key={win.id}
              className="flex items-start gap-3 p-3 transition-all"
              style={{
                background: isToday ? M.pinkBg : "oklch(0.93 0.012 78 / 0.4)",
                border:     `1px solid ${isToday ? M.pinkBdr : M.border}`,
                opacity:    isToday ? 1 : 0.65,
                borderRadius: 6,
              }}
            >
              {/* Clickable icon — opens picker to change category */}
              <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
                <button
                  onClick={() => setEditingWinId(isEditing ? null : win.id)}
                  title="点击更改类别"
                  style={{
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
                    border: `1px solid ${isEditing ? iconDef.color : "transparent"}`,
                    background: isEditing ? `${iconDef.color}15` : "transparent",
                    cursor: "pointer",
                    transition: "background 0.12s, border-color 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = `${iconDef.color}15`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isEditing) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <iconDef.Component size={16} color={iconDef.color} />
                </button>
                {isEditing && (
                  <IconPickerPopover
                    current={iconIdx}
                    onSelect={(idx) => changeWinIcon(win.id, idx)}
                    onClose={() => setEditingWinId(null)}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>{win.text}</p>
                <p className="text-xs mt-0.5" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                  {isToday ? "Today" : new Date(win.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" · "}
                  <span style={{ color: iconDef.color, opacity: 0.8 }}>{iconDef.label}</span>
                </p>
              </div>

              {isToday && (
                <div className="shrink-0 flex items-center gap-1">
                  <span className="text-xs font-medium" style={{ color: M.pink, fontFamily: "'DM Sans', sans-serif" }}>Today</span>
                  <IconHealth size={10} color={M.pink} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
