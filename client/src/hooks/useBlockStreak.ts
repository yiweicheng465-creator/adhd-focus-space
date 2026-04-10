/* ============================================================
   useBlockStreak — tracks consecutive days with a completed
   2-hour (4-session) Pomodoro block, persisted in localStorage.

   Storage key: "adhd_block_streak"
   Shape: { streak: number; lastBlockDate: string | null }
   lastBlockDate is ISO date string "YYYY-MM-DD"
   ============================================================ */

import { useState, useCallback } from "react";

interface StreakData {
  streak: number;
  lastBlockDate: string | null;
}

const STORAGE_KEY = "adhd_block_streak";

function today(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { streak: 0, lastBlockDate: null };
    return JSON.parse(raw) as StreakData;
  } catch {
    return { streak: 0, lastBlockDate: null };
  }
}

function saveStreak(data: StreakData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useBlockStreak() {
  const [data, setData] = useState<StreakData>(loadStreak);

  /**
   * Call this when a full 4-session block completes.
   * - If last block was yesterday → streak++
   * - If last block was today already → no change (idempotent)
   * - If last block was 2+ days ago → streak resets to 1
   */
  const recordBlock = useCallback(() => {
    setData((prev) => {
      const t = today();
      if (prev.lastBlockDate === t) return prev; // already counted today

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);

      const newStreak = prev.lastBlockDate === yStr ? prev.streak + 1 : 1;
      const next: StreakData = { streak: newStreak, lastBlockDate: t };
      saveStreak(next);
      return next;
    });
  }, []);

  return { streak: data.streak, recordBlock };
}
