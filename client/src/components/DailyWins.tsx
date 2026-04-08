/* ============================================================
   ADHD FOCUS SPACE — Daily Wins Tracker v3.0 (Morandi)
   Warm pinky-beige for today's wins, slumber for totals
   ============================================================ */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Award, Plus, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";

export interface Win {
  id: string; text: string; emoji: string; createdAt: Date;
}

const WIN_EMOJIS = ["🌟", "🎯", "💪", "🚀", "✅", "🏆", "⚡", "🎉", "🔥", "💎"];

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
  const [selectedEmoji,   setSelectedEmoji]   = useState(WIN_EMOJIS[0]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const addWin = () => {
    if (!newWin.trim()) return;
    onWinsChange([{ id: nanoid(), text: newWin.trim(), emoji: selectedEmoji, createdAt: new Date() }, ...wins]);
    setNewWin("");
    toast.success("Win logged! You're doing great.", { duration: 3000 });
  };

  const todayWins = wins.filter((w) => {
    const today = new Date();
    const d     = new Date(w.createdAt);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3" style={{ background: M.pinkBg, border: `1px solid ${M.pinkBdr}` }}>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4" style={{ color: M.pink }} />
            <span className="text-xs font-medium" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Today</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: M.pink, fontFamily: "'Playfair Display', serif" }}>{todayWins.length}</p>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>wins logged</p>
        </div>
        <div className="p-3" style={{ background: M.slumBg, border: `1px solid ${M.slumBdr}` }}>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4" style={{ color: M.slumber }} />
            <span className="text-xs font-medium" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Total</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: M.slumber, fontFamily: "'Playfair Display', serif" }}>{wins.length}</p>
          <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>all time</p>
        </div>
      </div>

      {/* Add win */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-10 h-10 flex items-center justify-center text-lg transition-all shrink-0"
            style={{ border: `1px solid ${M.border}`, background: M.card }}
          >
            {selectedEmoji}
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

        {showEmojiPicker && (
          <div className="flex flex-wrap gap-2 p-3" style={{ background: M.card, border: `1px solid ${M.border}` }}>
            {WIN_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { setSelectedEmoji(emoji); setShowEmojiPicker(false); }}
                className={cn("w-8 h-8 flex items-center justify-center text-lg transition-all")}
                style={{
                  background:  selectedEmoji === emoji ? M.pinkBg : "transparent",
                  border:      `1px solid ${selectedEmoji === emoji ? M.pinkBdr : "transparent"}`,
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wins list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {wins.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="w-10 h-10 mb-3" style={{ color: `${M.pink}50` }} />
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
              Log your first win! Every small step counts.
            </p>
          </div>
        )}

        {wins.map((win) => {
          const isToday = todayWins.some((w) => w.id === win.id);
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
              <span className="text-xl flex-shrink-0">{win.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>{win.text}</p>
                <p className="text-xs mt-0.5" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                  {isToday ? "Today" : new Date(win.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              {isToday && (
                <span className="text-xs font-medium shrink-0" style={{ color: M.pink, fontFamily: "'DM Sans', sans-serif" }}>Today ✨</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
