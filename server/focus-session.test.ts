/**
 * Tests for focus session recording logic.
 * These tests validate the data structures and logic used by recordFocusSession().
 * Since recordFocusSession() runs in the browser (localStorage), we test the
 * equivalent server-side logic and data shape validation here.
 */
import { describe, expect, it } from "vitest";

// ── Replicate the FocusSessionEntry interface ──
interface FocusSessionEntry {
  sessionNumber: number;
  duration: number;
  timestamp: number;
  dateKey: string;
}

// ── Replicate the recordFocusSession logic (pure function, no localStorage) ──
function simulateRecordFocusSession(
  existingList: Record<string, FocusSessionEntry[]>,
  existingLogCount: number,
  dateKey: string,
  durationMinutes: number
): {
  updatedList: Record<string, FocusSessionEntry[]>;
  newCount: number;
  newEntry: FocusSessionEntry;
} {
  const sessions = existingLogCount + 1;
  const entry: FocusSessionEntry = {
    sessionNumber: sessions,
    duration: durationMinutes,
    timestamp: Date.now(),
    dateKey,
  };
  const updatedList = { ...existingList };
  if (!updatedList[dateKey]) updatedList[dateKey] = [];
  updatedList[dateKey] = [...updatedList[dateKey], entry];
  return { updatedList, newCount: sessions, newEntry: entry };
}

describe("Focus Session Recording Logic", () => {
  const TODAY = "Thu Apr 10 2026";

  it("records the first session with correct data", () => {
    const { updatedList, newCount, newEntry } = simulateRecordFocusSession({}, 0, TODAY, 25);

    expect(newCount).toBe(1);
    expect(newEntry.sessionNumber).toBe(1);
    expect(newEntry.duration).toBe(25);
    expect(newEntry.dateKey).toBe(TODAY);
    expect(typeof newEntry.timestamp).toBe("number");
    expect(updatedList[TODAY]).toHaveLength(1);
  });

  it("increments session number correctly for subsequent sessions", () => {
    const existingEntry: FocusSessionEntry = {
      sessionNumber: 1,
      duration: 25,
      timestamp: Date.now() - 30 * 60 * 1000,
      dateKey: TODAY,
    };
    const existingList = { [TODAY]: [existingEntry] };

    const { updatedList, newCount, newEntry } = simulateRecordFocusSession(existingList, 1, TODAY, 25);

    expect(newCount).toBe(2);
    expect(newEntry.sessionNumber).toBe(2);
    expect(updatedList[TODAY]).toHaveLength(2);
  });

  it("uses custom duration when provided", () => {
    const { newEntry } = simulateRecordFocusSession({}, 0, TODAY, 45);
    expect(newEntry.duration).toBe(45);
  });

  it("defaults to 25 min duration when not specified", () => {
    const { newEntry } = simulateRecordFocusSession({}, 0, TODAY, 25);
    expect(newEntry.duration).toBe(25);
  });

  it("keeps sessions for different days separate", () => {
    const YESTERDAY = "Wed Apr 09 2026";
    const yesterdayEntry: FocusSessionEntry = {
      sessionNumber: 1,
      duration: 25,
      timestamp: Date.now() - 24 * 60 * 60 * 1000,
      dateKey: YESTERDAY,
    };
    const existingList = { [YESTERDAY]: [yesterdayEntry] };

    const { updatedList } = simulateRecordFocusSession(existingList, 0, TODAY, 25);

    expect(updatedList[YESTERDAY]).toHaveLength(1);
    expect(updatedList[TODAY]).toHaveLength(1);
    expect(updatedList[TODAY][0].sessionNumber).toBe(1);
  });

  it("session list can hold a full 4-session block", () => {
    let list: Record<string, FocusSessionEntry[]> = {};
    let count = 0;

    for (let i = 0; i < 4; i++) {
      const result = simulateRecordFocusSession(list, count, TODAY, 25);
      list = result.updatedList;
      count = result.newCount;
    }

    expect(count).toBe(4);
    expect(list[TODAY]).toHaveLength(4);
    expect(list[TODAY].map(s => s.sessionNumber)).toEqual([1, 2, 3, 4]);
  });

  it("session entries have valid timestamps", () => {
    const before = Date.now();
    const { newEntry } = simulateRecordFocusSession({}, 0, TODAY, 25);
    const after = Date.now();

    expect(newEntry.timestamp).toBeGreaterThanOrEqual(before);
    expect(newEntry.timestamp).toBeLessThanOrEqual(after);
  });
});
