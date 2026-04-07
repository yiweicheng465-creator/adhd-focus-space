/* ============================================================
   ADHD FOCUS SPACE — Daily Wins Tracker
   Design: Gold accent, celebratory, dopamine-rewarding
   Features: Log wins, view history, streak counter
   ============================================================ */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Award, Plus, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";

export interface Win {
  id: string;
  text: string;
  emoji: string;
  createdAt: Date;
}

const WIN_EMOJIS = ["🌟", "🎯", "💪", "🚀", "✅", "🏆", "⚡", "🎉", "🔥", "💎"];

interface DailyWinsProps {
  wins: Win[];
  onWinsChange: (wins: Win[]) => void;
}

export function DailyWins({ wins, onWinsChange }: DailyWinsProps) {
  const [newWin, setNewWin] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(WIN_EMOJIS[0]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const addWin = () => {
    if (!newWin.trim()) return;
    const win: Win = {
      id: nanoid(),
      text: newWin.trim(),
      emoji: selectedEmoji,
      createdAt: new Date(),
    };
    onWinsChange([win, ...wins]);
    setNewWin("");
    toast.success("Win logged! You're crushing it! 🏆", { duration: 3000 });
  };

  const todayWins = wins.filter((w) => {
    const today = new Date();
    const winDate = new Date(w.createdAt);
    return (
      winDate.getDate() === today.getDate() &&
      winDate.getMonth() === today.getMonth() &&
      winDate.getFullYear() === today.getFullYear()
    );
  });

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[oklch(0.75_0.15_75_/_0.08)] border border-[oklch(0.75_0.15_75_/_0.2)]">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-[oklch(0.65_0.15_75)]" />
            <span className="text-xs text-muted-foreground font-medium">Today</span>
          </div>
          <p className="text-2xl font-display font-bold text-[oklch(0.55_0.15_75)]">
            {todayWins.length}
          </p>
          <p className="text-xs text-muted-foreground">wins logged</p>
        </div>
        <div className="p-3 rounded-xl bg-[oklch(0.65_0.14_185_/_0.08)] border border-[oklch(0.65_0.14_185_/_0.2)]">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-[oklch(0.55_0.14_185)]" />
            <span className="text-xs text-muted-foreground font-medium">Total</span>
          </div>
          <p className="text-2xl font-display font-bold text-[oklch(0.55_0.14_185)]">
            {wins.length}
          </p>
          <p className="text-xs text-muted-foreground">all time</p>
        </div>
      </div>

      {/* Add win */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {/* Emoji picker trigger */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-10 h-10 rounded-lg border border-border bg-white flex items-center justify-center text-lg hover:border-[oklch(0.75_0.15_75)] transition-colors shrink-0"
          >
            {selectedEmoji}
          </button>
          <Input
            value={newWin}
            onChange={(e) => setNewWin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addWin()}
            placeholder="What did you accomplish?"
            className="flex-1 bg-white"
          />
          <Button
            onClick={addWin}
            className="shrink-0"
            style={{ background: "oklch(0.65 0.15 75)" }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="flex flex-wrap gap-2 p-3 bg-white rounded-xl border border-border shadow-md">
            {WIN_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setSelectedEmoji(emoji);
                  setShowEmojiPicker(false);
                }}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-muted transition-colors",
                  selectedEmoji === emoji && "bg-[oklch(0.75_0.15_75_/_0.15)] ring-1 ring-[oklch(0.75_0.15_75)]"
                )}
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
            <Sparkles className="w-10 h-10 text-[oklch(0.75_0.15_75_/_0.4)] mb-3" />
            <p className="text-sm text-muted-foreground">
              Log your first win! Every small step counts.
            </p>
          </div>
        )}

        {wins.map((win) => {
          const isToday = todayWins.some((w) => w.id === win.id);
          return (
            <div
              key={win.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border transition-all",
                isToday
                  ? "bg-[oklch(0.75_0.15_75_/_0.06)] border-[oklch(0.75_0.15_75_/_0.25)]"
                  : "bg-white border-border opacity-70"
              )}
            >
              <span className="text-xl flex-shrink-0">{win.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">{win.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isToday
                    ? "Today"
                    : new Date(win.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                </p>
              </div>
              {isToday && (
                <span className="text-xs text-[oklch(0.6_0.15_75)] font-medium shrink-0">
                  Today ✨
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
