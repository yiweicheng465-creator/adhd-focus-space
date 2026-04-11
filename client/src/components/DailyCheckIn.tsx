/* ============================================================
   ADHD FOCUS SPACE — Daily Check-In v3.0
   Fixes:
   - X = dismiss temporarily (re-shows same day on reload)
   - Skip for today / Finish = suppress all day (localStorage)
   - Back button to navigate to previous steps
   - Wins include category selector (8 categories)
   - Wins tagged as yesterday's date
   - Agent creation: separate name + task fields
   - Mood faces match the geometric design (same as MoodCheckIn)
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, SkipForward, Sparkles, X } from "lucide-react";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";
import type { Win } from "./DailyWins";
import type { Agent } from "./AgentTracker";
import type { Goal } from "./Goals";
import { trpc } from "@/lib/trpc";

/* ── localStorage keys ── */
function getTodayKey() {
  return `adhd-checkin-skip-${new Date().toDateString()}`;
}
function getXKey() {
  return `adhd-checkin-x-${new Date().toDateString()}`;
}

export function useDailyCheckIn() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show unless user clicked Skip/Finish today
    const skipped = localStorage.getItem(getTodayKey());
    if (!skipped) {
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (permanent: boolean) => {
    if (permanent) {
      localStorage.setItem(getTodayKey(), "1");
    }
    setShow(false);
  };

  return { show, dismiss };
}

/* ── Types ── */
interface DailyCheckInProps {
  onComplete: (data: CheckInResult) => void;
  onSkip: () => void;
  onClose: () => void; // X button — temporary dismiss
}

export interface CheckInResult {
  mood: number | null;
  newTasks: Task[];
  newWins: Win[];
  newAgents: Agent[];
  newGoals: Goal[];
  goalUpdates: { id: string; progress: number }[];
  focusNote: string;
}

type Step = "greeting" | "mood" | "goals" | "tasks" | "agents" | "wins" | "done";
const STEP_ORDER: Step[] = ["greeting", "mood", "goals", "tasks", "agents", "wins", "done"];

/* ── Win categories (matches DailyWins) ── */
const WIN_CATS = [
  { idx: 0, label: "Health",    color: "oklch(0.60 0.10 15)",  emoji: "❤️" },
  { idx: 1, label: "Study",     color: "oklch(0.52 0.08 230)", emoji: "📚" },
  { idx: 2, label: "Work",      color: "oklch(0.50 0.07 145)", emoji: "💼" },
  { idx: 3, label: "Social",    color: "oklch(0.58 0.09 55)",  emoji: "👥" },
  { idx: 4, label: "Creative",  color: "oklch(0.55 0.10 300)", emoji: "✨" },
  { idx: 5, label: "Mindful",   color: "oklch(0.55 0.07 185)", emoji: "🌿" },
  { idx: 6, label: "Fitness",   color: "oklch(0.53 0.09 35)",  emoji: "⚡" },
  { idx: 7, label: "Nutrition", color: "oklch(0.52 0.10 130)", emoji: "🍎" },
];

/* ── Geometric mood faces (matching MoodCheckIn) ── */
const MOODS = [
  { value: 1, label: "Drained", fill: "#B8B4C8", stroke: "#5A5570", shadow: "rgba(180,175,200,0.4)" },
  { value: 2, label: "Low",     fill: "#C0B8D4", stroke: "#5A5070", shadow: "rgba(175,165,195,0.4)" },
  { value: 3, label: "Okay",    fill: "#A89070", stroke: "#4A3820", shadow: "rgba(160,140,110,0.4)" },
  { value: 4, label: "Good",    fill: "#90C8A8", stroke: "#2A5840", shadow: "rgba(140,195,165,0.4)" },
  { value: 5, label: "Glowing", fill: "#F0A878", stroke: "#7A3818", shadow: "rgba(240,160,120,0.4)" },
];

function FaceDrained({ active }: { active: boolean }) {
  const fill = active ? "#B8B4C8" : "#CCC8D8"; const c = "#5A5570";
  return <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="32" fill={fill}/><circle cx="28" cy="37" r="3" fill={c}/><circle cx="52" cy="37" r="3" fill={c}/><line x1="30" y1="52" x2="50" y2="52" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>;
}
function FaceLow({ active }: { active: boolean }) {
  const fill = active ? "#C0B8D4" : "#D4CEEA"; const c = "#5A5070";
  return <svg viewBox="0 0 80 80" fill="none"><rect x="8" y="8" width="64" height="64" rx="22" fill={fill}/><circle cx="28" cy="37" r="3" fill={c}/><circle cx="52" cy="37" r="3" fill={c}/><path d="M30 52 Q40 47 50 52" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>;
}
function FaceOkay({ active }: { active: boolean }) {
  const fill = active ? "#A89070" : "#C4AA88"; const c = "#4A3820";
  return <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="32" fill={fill}/><circle cx="28" cy="37" r="3" fill={c}/><circle cx="52" cy="37" r="3" fill={c}/><line x1="30" y1="52" x2="50" y2="52" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>;
}
function FaceGood({ active }: { active: boolean }) {
  const fill = active ? "#90C8A8" : "#B0D8C0"; const c = "#2A5840";
  return <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="32" fill={fill}/><path d="M24 36 Q28 31 32 36" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/><path d="M48 36 Q52 31 56 36" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/><path d="M30 50 Q40 57 50 50" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>;
}
function FaceGlowing({ active }: { active: boolean }) {
  const fill = active ? "#F0A878" : "#F8C8A0"; const c = "#7A3818";
  const numRays = 10; const outerR = 38, innerR = 28;
  const points = Array.from({ length: numRays * 2 }, (_, i) => {
    const angle = (i * Math.PI) / numRays - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    return `${40 + r * Math.cos(angle)},${40 + r * Math.sin(angle)}`;
  }).join(" ");
  return <svg viewBox="0 0 80 80" fill="none"><polygon points={points} fill={fill}/><path d="M26 37 Q30 32 34 37" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/><path d="M46 37 Q50 32 54 37" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/><path d="M28 50 Q40 60 52 50" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>;
}
const FACE_COMPONENTS = [FaceDrained, FaceLow, FaceOkay, FaceGood, FaceGlowing];

/* ── Main component ── */
export function DailyCheckIn({ onComplete, onSkip, onClose }: DailyCheckInProps) {
  const [step, setStep] = useState<Step>("greeting");
  const [mitSuggestion, setMitSuggestion] = useState<string | null>(null);
  const [mood, setMood] = useState<number | null>(null);

  // Goals
  const [goalInput, setGoalInput] = useState("");
  const [goalContext, setGoalContext] = useState<string>("work");
  const [newGoals, setNewGoals] = useState<{ text: string; context: string }[]>([]);

  // Tasks
  const [taskInput, setTaskInput] = useState("");
  const [taskContext, setTaskContext] = useState<"work" | "personal">("work");
  const [taskCustomTag, setTaskCustomTag] = useState("");
  const [taskGoalIdx, setTaskGoalIdx] = useState<number | null>(null); // index into newGoals
  const [tasks, setTasks] = useState<{ text: string; context: string; goalIdx: number | null }[]>([]);

  // Agents
  const [agentName, setAgentName] = useState("");
  const [agentLinkedTaskIdx, setAgentLinkedTaskIdx] = useState<number | null>(null); // index into tasks
  const [agents, setAgents] = useState<{ name: string; task: string; linkedTaskIdx: number | null }[]>([]);

  // Wins (with category)
  const [winInput, setWinInput] = useState("");
  const [winCatIdx, setWinCatIdx] = useState(0);
  const [wins, setWins] = useState<{ text: string; catIdx: number }[]>([]);

  const focusNote = "";
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const stepIndex = STEP_ORDER.indexOf(step);
  const progress = Math.round((stepIndex / (STEP_ORDER.length - 1)) * 100);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [step]);

  const parseHashtag = (raw: string): { cleanText: string; tag: string | null } => {
    const match = raw.match(/(^|\s)#([\w-]+)(\s|$)/);
    if (!match) return { cleanText: raw.trim(), tag: null };
    const cleanText = raw.replace(/(^|\s)#[\w-]+(\s|$)/g, " ").replace(/\s{2,}/g, " ").trim();
    return { cleanText, tag: match[2].toLowerCase() };
  };

  const addGoal = () => {
    if (!goalInput.trim()) return;
    const { cleanText, tag } = parseHashtag(goalInput);
    // Allow any custom hashtag as context (not just work/personal)
    const context = (tag ?? goalContext ?? "personal") as string;
    setNewGoals((p) => [...p, { text: cleanText || goalInput.trim(), context }]);
    setGoalInput("");
  };

  const addTask = () => {
    if (!taskInput.trim()) return;
    // Custom tag overrides the toggle; hashtag in text overrides custom tag
    const { cleanText, tag: hashTag } = parseHashtag(taskInput);
    const effectiveContext = hashTag ?? (taskCustomTag.trim() ? taskCustomTag.trim().replace(/^#/, "") : taskContext);
    setTasks((p) => [...p, { text: cleanText || taskInput.trim(), context: effectiveContext, goalIdx: taskGoalIdx }]);
    setTaskInput("");
    setTaskCustomTag("");
  };

  const addAgent = () => {
    if (agentName.trim()) {
      const linkedTask = agentLinkedTaskIdx !== null ? tasks[agentLinkedTaskIdx]?.text || "General task" : "General task";
      setAgents((p) => [...p, { name: agentName.trim(), task: linkedTask, linkedTaskIdx: agentLinkedTaskIdx }]);
      setAgentName("");
      setAgentLinkedTaskIdx(null);
    }
  };

  const addWin = () => {
    if (winInput.trim()) {
      setWins((p) => [...p, { text: winInput.trim(), catIdx: winCatIdx }]);
      setWinInput("");
    }
  };

  const mitMutation = trpc.ai.mitSuggestion.useMutation({
    onSuccess: (data) => {
      setMitSuggestion(data.mit ?? "");
    },
  });

  const goNext = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[idx + 1];
      setStep(nextStep);
      // When entering done step, auto-generate MIT suggestion
      if (nextStep === "done" && tasks.length > 0) {
        mitMutation.mutate({
          pendingTasks: tasks.map((t) => ({
            text: t.text,
            priority: "focus",
            context: t.context,
            createdAt: new Date().toISOString(),
          })),
          goals: newGoals.map((g) => ({ text: g.text, progress: 0, context: g.context })),
          mood: mood,
          focusSessionsToday: 0,
        });
      }
    }
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  const finish = () => {
    // Yesterday's date for wins (since we ask "wins from yesterday")
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 0, 0);

    // Pre-assign IDs to goals so tasks can reference them
    const goalIds = newGoals.map(() => nanoid());

    const result: CheckInResult = {
      mood,
      newGoals: newGoals.map((g, i) => ({
        id: goalIds[i],
        text: g.text,
        progress: 0,
        context: g.context,
        createdAt: new Date(),
      })),
      newTasks: tasks.map((t) => ({
        id: nanoid(),
        text: t.text,
        priority: "focus",
        context: (t.context === "work" || t.context === "personal" ? t.context : "personal") as "work" | "personal",
        done: false,
        createdAt: new Date(),
        goalId: t.goalIdx !== null && goalIds[t.goalIdx] ? goalIds[t.goalIdx] : undefined,
      })),
      newWins: wins.map((w) => ({
        id: nanoid(),
        text: w.text,
        iconIdx: w.catIdx,
        createdAt: yesterday, // tag as yesterday
      })),
      newAgents: agents.map((a) => ({
        id: nanoid(),
        name: a.name,
        task: a.task,
        status: "running" as const,
        context: "work" as const,
        startedAt: new Date(),
        notes: "",
      })),
      goalUpdates: [],
      focusNote: "",
    };
    onComplete(result);
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning,";
    if (h < 17) return "Good afternoon,";
    if (h < 21) return "Good evening,";
    return "Good night,";
  })();

  const M = {
    ink: "oklch(0.18 0.01 60)",
    muted: "oklch(0.52 0.015 70)",
    border: "oklch(0.87 0.014 75)",
    accent: "oklch(0.52 0.14 35)",
    bg: "oklch(0.975 0.012 80)",
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "oklch(0.18 0.01 60 / 0.40)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-lg animate-scale-in overflow-hidden"
        style={{
          background: M.bg,
          border: `1.5px solid ${M.border}`,
          boxShadow: "4px 6px 20px oklch(0.30 0.02 60 / 0.18), 0 0 0 1px oklch(0.90 0.018 72 / 0.60)",
          position: "relative",
        }}
      >


        {/* Retro title bar */}
        <div className="relative z-10" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "5px 10px",
          background: "oklch(0.940 0.020 70)",
          borderBottom: `1.5px solid ${M.border}`,
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          color: "oklch(0.45 0.020 62)",
        }}>
          <span>daily_checkin.exe</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Progress dots */}
            {STEP_ORDER.slice(0, -1).map((s, i) => (
              <div key={s} style={{
                width: 6, height: 6, borderRadius: "50%",
                background: i <= STEP_ORDER.indexOf(step) ? M.accent : "oklch(0.82 0.022 68)",
                transition: "background 0.3s",
              }} />
            ))}
            <div style={{ width: 1, height: 10, background: M.border, margin: "0 4px" }} />
            <button
              onClick={onClose}
              title="Close (will show again today)"
              style={{ fontSize: 9, padding: "1px 5px", cursor: "pointer",
                background: "oklch(0.88 0.022 68)", border: `1px solid ${M.border}`,
                color: "oklch(0.45 0.020 62)", fontFamily: "'Space Mono', monospace",
                lineHeight: 1.4,
              }}
            >✕</button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 h-[2px] w-full" style={{ background: "oklch(0.88 0.012 75)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: M.accent }}
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between px-8 pt-6 pb-0">
          <div>
            <p className="text-[10px] tracking-widest uppercase font-medium" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>{today}</p>
            <h2
              className="text-2xl mt-1 font-bold italic"
              style={{ fontFamily: "'Playfair Display', serif", color: M.ink }}
            >
              {step === "greeting" && greeting}
              {step === "mood"     && "How are you feeling?"}
              {step === "goals"    && "Set a goal for today?"}
              {step === "tasks"    && "What's on your plate?"}
              {step === "agents"   && "Any AI agents running?"}
              {step === "wins"     && "Wins from yesterday?"}
              {step === "done"     && "You're all set."}
            </h2>
          </div>
        </div>

        {/* Step content */}
        <div className="relative z-10 px-8 py-6 min-h-[220px]">

          {/* GREETING */}
          {step === "greeting" && (
            <div className="flex gap-6 items-start">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/lofi-ds-ouija_c3b2a30f.png"
                alt="illustration"
                className="w-28 opacity-90 shrink-0" style={{ borderRadius: 16 }}
              />
              <div className="pt-2">
                <p className="text-base leading-relaxed" style={{ color: "oklch(0.35 0.01 60)" }}>
                  Let's set up your day in just a few quick questions. No pressure — answer what you can, skip anything you don't have yet.
                </p>
                <p className="text-sm mt-3 italic" style={{ color: M.muted }}>
                  "Your brain is not broken — it just works differently."
                </p>
              </div>
            </div>
          )}

          {/* MOOD */}
          {step === "mood" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-2">
                {MOODS.map((m, i) => {
                  const FaceIcon = FACE_COMPONENTS[i];
                  const isSelected = mood === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      className="flex flex-col items-center gap-1.5 flex-1 transition-all duration-200 focus:outline-none"
                      style={{
                        transform: isSelected ? "scale(1.18) translateY(-4px)" : "scale(1)",
                        filter: isSelected ? `drop-shadow(0 6px 12px ${m.shadow})` : "none",
                        opacity: mood !== null && !isSelected ? 0.55 : 1,
                      }}
                    >
                      <div className="w-12 h-12">
                        <FaceIcon active={isSelected} />
                      </div>
                      <span
                        className="text-[9px] font-medium tracking-wide"
                        style={{ color: isSelected ? M.ink : "transparent", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-1">
                {MOODS.map((m) => (
                  <div
                    key={m.value}
                    className="flex-1 h-0.5 transition-all duration-300"
                    style={{ background: mood !== null && m.value <= mood ? m.fill : "oklch(0.88 0.012 75)" }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* GOALS */}
          {step === "goals" && (
            <div>
              <p className="text-sm mb-3" style={{ color: M.muted }}>
                Add goals for today. Use #work or #personal to tag, then press Enter.
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGoal()}
                  placeholder="e.g. Launch the new feature by Friday…"
                  className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none"
                  style={{ border: `1px solid ${M.border}`, color: M.ink }}
                />
                <button onClick={addGoal} className="px-3 py-2 text-sm font-bold" style={{ background: M.accent, color: "white" }}>+</button>
              </div>
              {newGoals.length > 0 && (
                <ul className="space-y-1.5 mt-3">
                  {newGoals.map((g, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.35 0.01 60)" }}>
                      🎯 <span>{g.text}</span>
                      {g.context && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "oklch(0.92 0.02 75)", color: "oklch(0.45 0.08 35)" }}>
                          #{g.context}
                        </span>
                      )}
                      <button onClick={() => setNewGoals((p) => p.filter((_, j) => j !== i))} className="ml-auto text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* TASKS */}
          {step === "tasks" && (
            <div>
              <p className="text-sm mb-3" style={{ color: M.muted }}>
                Add tasks for today. Press Enter to add each one.
              </p>
              {/* Goal link dropdown (only if goals were set) */}
              {newGoals.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px]" style={{ color: M.muted }}>↳ Goal:</span>
                  <select
                    value={taskGoalIdx ?? ""}
                    onChange={(e) => setTaskGoalIdx(e.target.value === "" ? null : Number(e.target.value))}
                    className="flex-1 px-2 py-1 text-xs bg-transparent focus:outline-none"
                    style={{ border: `1px solid ${M.border}`, color: taskGoalIdx !== null ? M.ink : M.muted }}
                  >
                    <option value="">None</option>
                    {newGoals.map((g, i) => (
                      <option key={i} value={i}>{g.text.length > 40 ? g.text.slice(0, 40) + "…" : g.text}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Row 3: Input + add */}
              <div className="flex gap-2 mb-2">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="e.g. Reply to Alice's email…"
                  className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none"
                  style={{ border: `1px solid ${M.border}`, color: M.ink }}
                />
                <button onClick={addTask} className="px-3 py-2 text-sm font-bold" style={{ background: M.accent, color: "white" }}>+</button>
              </div>
              {tasks.length > 0 && (
                <ul className="space-y-1.5 mt-3 max-h-28 overflow-y-auto">
                  {tasks.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.35 0.01 60)" }}>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "oklch(0.52 0.07 145 / 0.12)", color: M.muted }}>
                        #{t.context}
                      </span>
                      {t.goalIdx !== null && newGoals[t.goalIdx] && (
                        <span className="text-[9px]" style={{ color: M.accent }}>↳ {newGoals[t.goalIdx].text.length > 20 ? newGoals[t.goalIdx].text.slice(0, 20) + "…" : newGoals[t.goalIdx].text}</span>
                      )}
                      <span className="truncate">{t.text}</span>
                      <button onClick={() => setTasks((p) => p.filter((_, j) => j !== i))} className="ml-auto shrink-0 text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* AGENTS */}
          {step === "agents" && (
            <div>
              <p className="text-sm mb-3" style={{ color: M.muted }}>
                Log any AI agents you have running. Optionally link to a task.
              </p>
              {/* Task link dropdown */}
              {tasks.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px]" style={{ color: M.muted }}>↳ Task:</span>
                  <select
                    value={agentLinkedTaskIdx ?? ""}
                    onChange={(e) => setAgentLinkedTaskIdx(e.target.value === "" ? null : Number(e.target.value))}
                    className="flex-1 px-2 py-1 text-xs bg-transparent focus:outline-none"
                    style={{ border: `1px solid ${M.border}`, color: agentLinkedTaskIdx !== null ? M.ink : M.muted }}
                  >
                    <option value="">No linked task</option>
                    {tasks.map((t, i) => (
                      <option key={i} value={i}>{t.text.length > 45 ? t.text.slice(0, 45) + "…" : t.text}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2 mb-2">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAgent()}
                  placeholder="Agent name (e.g. Manus, Claude…)"
                  className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none"
                  style={{ border: `1px solid ${M.border}`, color: M.ink }}
                />
                <button onClick={addAgent} className="px-3 py-2 text-sm font-bold" style={{ background: M.accent, color: "white" }}>+</button>
              </div>
              {agents.length > 0 && (
                <ul className="space-y-1.5 mt-3">
                  {agents.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.35 0.01 60)" }}>
                      <span style={{ color: M.accent }}>⚡</span>
                      <span className="font-medium">{a.name}</span>
                      {a.task !== "General task" && (
                        <span className="text-[9px] truncate max-w-[140px]" style={{ color: M.muted }}>— {a.task}</span>
                      )}
                      <button onClick={() => setAgents((p) => p.filter((_, j) => j !== i))} className="ml-auto shrink-0 text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* WINS */}
          {step === "wins" && (
            <div>
              <p className="text-sm mb-3" style={{ color: M.muted }}>
                What did you accomplish yesterday? Pick a category and describe it.
              </p>
              {/* Category selector */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {WIN_CATS.map((cat) => (
                  <button
                    key={cat.idx}
                    onClick={() => setWinCatIdx(cat.idx)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-full transition-all"
                    style={{
                      background: winCatIdx === cat.idx ? `${cat.color}22` : "transparent",
                      border: `1.5px solid ${winCatIdx === cat.idx ? cat.color : "oklch(0.88 0.012 75)"}`,
                      color: winCatIdx === cat.idx ? cat.color : M.muted,
                    }}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={winInput}
                  onChange={(e) => setWinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWin()}
                  placeholder={`e.g. ${WIN_CATS[winCatIdx].label === "Health" ? "Went for a 30-min walk" : WIN_CATS[winCatIdx].label === "Work" ? "Finished the project proposal" : "Completed something meaningful"}…`}
                  className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none"
                  style={{ border: `1px solid ${M.border}`, color: M.ink }}
                />
                <button
                  onClick={addWin}
                  className="px-3 py-2 text-sm font-bold"
                  style={{ background: M.accent, color: "white" }}
                >
                  +
                </button>
              </div>
              {wins.length > 0 && (
                <ul className="space-y-1.5 mt-3">
                  {wins.map((w, i) => {
                    const cat = WIN_CATS[w.catIdx];
                    return (
                      <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.35 0.01 60)" }}>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${cat.color}18`, color: cat.color, border: `1px solid ${cat.color}44` }}>
                          {cat.emoji} {cat.label}
                        </span>
                        {w.text}
                        <button onClick={() => setWins((p) => p.filter((_, j) => j !== i))} className="ml-auto text-xs text-muted-foreground hover:text-destructive">✕</button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <>
              <div className="flex gap-6 items-start">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-editorial-brain-AsWVT7JWa9jdswJaKeJWzj.webp"
                  alt="illustration"
                  className="w-20 opacity-80 shrink-0"
                />
                <div className="pt-1 space-y-1.5 text-sm" style={{ color: "oklch(0.35 0.01 60)" }}>
                  {mood && <p>Mood: <span className="font-medium">{MOODS.find((m) => m.value === mood)?.label}</span></p>}
                  {newGoals.length > 0 && <p>{newGoals.length} goal{newGoals.length > 1 ? "s" : ""} added</p>}
                  {tasks.length > 0 && <p>{tasks.length} task{tasks.length > 1 ? "s" : ""} added</p>}
                  {agents.length > 0 && <p>{agents.length} agent{agents.length > 1 ? "s" : ""} logged</p>}
                  {wins.length > 0 && <p>{wins.length} win{wins.length > 1 ? "s" : ""} from yesterday recorded</p>}
                  {!mood && !newGoals.length && !tasks.length && !agents.length && !wins.length && (
                    <p className="italic text-muted-foreground">Nothing added — that's okay. Your space is ready.</p>
                  )}
                </div>
              </div>

              {/* MIT Suggestion */}
              {(tasks.length > 0 || newGoals.length > 0) && (
                <div
                  className="mt-4 p-3 rounded-lg"
                  style={{ background: "oklch(0.52 0.14 35 / 0.07)", border: "1px solid oklch(0.52 0.14 35 / 0.22)" }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: M.accent }} />
                    <span className="text-xs font-semibold" style={{ color: M.accent, fontFamily: "'DM Sans', sans-serif" }}>Most Important Thing today</span>
                  </div>
                  {mitMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" style={{ color: M.muted }} />
                      <span className="text-xs italic" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>AI is thinking…</span>
                    </div>
                  ) : mitSuggestion ? (
                    <p className="text-sm leading-relaxed" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
                      {mitSuggestion}
                    </p>
                  ) : (
                    <p className="text-xs italic" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Add tasks to get your MIT suggestion.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="relative z-10 flex items-center justify-between px-8 py-5"
          style={{ borderTop: `1px solid ${M.border}` }}
        >
          {/* Left: Back (if not on greeting) or Skip */}
          <div className="flex items-center gap-3">
            {stepIndex > 0 && step !== "done" && (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            {/* Skip for today = permanent suppress */}
            <button
              onClick={onSkip}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip for today
            </button>
          </div>

          {/* Right: Next / Finish */}
          {step !== "done" ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95"
              style={{ background: M.accent, color: "white" }}
            >
              {step === "greeting" ? "Let's go" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95"
              style={{ background: M.accent, color: "white" }}
            >
              Open my workspace
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
