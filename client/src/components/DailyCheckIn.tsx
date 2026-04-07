/* ============================================================
   ADHD FOCUS SPACE — Daily Check-In Prompt v2.0
   ADHD principle: Conversational onboarding reduces friction
   Auto-opens once per day (localStorage key = today's date).
   Multi-step conversational flow — one question at a time.
   Skip button always visible.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, SkipForward, X } from "lucide-react";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";
import type { Win } from "./DailyWins";
import type { Agent } from "./AgentTracker";
import type { Goal } from "./Goals";

interface DailyCheckInProps {
  onComplete: (data: CheckInResult) => void;
  onSkip: () => void;
}

export interface CheckInResult {
  mood: number | null;
  newTasks: Task[];
  newWins: Win[];
  newAgents: Agent[];
  goalUpdates: { id: string; progress: number }[];
  focusNote: string;
}

type Step =
  | "greeting"
  | "mood"
  | "tasks"
  | "agents"
  | "wins"
  | "focus"
  | "done";

const MOODS = [
  { value: 1, emoji: "😴", label: "Exhausted" },
  { value: 2, emoji: "😔", label: "Low"       },
  { value: 3, emoji: "😐", label: "Okay"      },
  { value: 4, emoji: "🙂", label: "Good"      },
  { value: 5, emoji: "🚀", label: "Energized" },
];

const STEP_ORDER: Step[] = ["greeting", "mood", "tasks", "agents", "wins", "focus", "done"];

function getStorageKey() {
  return `adhd-checkin-${new Date().toDateString()}`;
}

export function useDailyCheckIn() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show once per day
    const done = localStorage.getItem(getStorageKey());
    if (!done) {
      // Small delay so the page renders first
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(getStorageKey(), "1");
    setShow(false);
  };

  return { show, dismiss };
}

export function DailyCheckIn({ onComplete, onSkip }: DailyCheckInProps) {
  const [step, setStep] = useState<Step>("greeting");
  const [mood, setMood] = useState<number | null>(null);
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState<string[]>([]);
  const [agentInput, setAgentInput] = useState("");
  const [agents, setAgents] = useState<{ name: string; task: string }[]>([]);
  const [winInput, setWinInput] = useState("");
  const [wins, setWins] = useState<string[]>([]);
  const [focusNote, setFocusNote] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const stepIndex = STEP_ORDER.indexOf(step);
  const progress = Math.round((stepIndex / (STEP_ORDER.length - 1)) * 100);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [step]);

  const addTask = () => {
    if (taskInput.trim()) {
      setTasks((p) => [...p, taskInput.trim()]);
      setTaskInput("");
    }
  };

  const addAgent = () => {
    const parts = agentInput.trim().split(" — ");
    if (parts[0]) {
      setAgents((p) => [...p, { name: parts[0], task: parts[1] || "General task" }]);
      setAgentInput("");
    }
  };

  const addWin = () => {
    if (winInput.trim()) {
      setWins((p) => [...p, winInput.trim()]);
      setWinInput("");
    }
  };

  const next = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  };

  const finish = () => {
    const result: CheckInResult = {
      mood,
      newTasks: tasks.map((t) => ({
        id: nanoid(), text: t, priority: "focus", context: "work", done: false, createdAt: new Date(),
      })),
      newWins: wins.map((w) => ({
        id: nanoid(), text: w, emoji: "⭐", createdAt: new Date(),
      })),
      newAgents: agents.map((a) => ({
        id: nanoid(), name: a.name, task: a.task, status: "running",
        context: "work", startedAt: new Date(), notes: "",
      })),
      goalUpdates: [],
      focusNote,
    };
    onComplete(result);
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "oklch(0.18 0.01 60 / 0.35)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-lg animate-scale-in overflow-hidden"
        style={{
          background: "oklch(0.975 0.012 80)",
          border: "1px solid oklch(0.87 0.014 75)",
        }}
      >
        {/* Progress bar */}
        <div className="h-[2px] w-full" style={{ background: "oklch(0.88 0.012 75)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "oklch(0.52 0.14 35)" }}
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-7 pb-0">
          <div>
            <p className="editorial-label">{today}</p>
            <h2
              className="text-2xl mt-1 font-bold italic"
              style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.18 0.01 60)" }}
            >
              {step === "greeting" && "Good morning,"}
              {step === "mood"     && "How are you feeling?"}
              {step === "tasks"    && "What's on your plate?"}
              {step === "agents"   && "Any AI agents running?"}
              {step === "wins"     && "Any wins from yesterday?"}
              {step === "focus"    && "One thing to focus on?"}
              {step === "done"     && "You're all set."}
            </h2>
          </div>
          <button
            onClick={onSkip}
            title="Skip for today"
            className="text-muted-foreground hover:text-foreground p-1 transition-colors mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step content */}
        <div className="px-8 py-6 min-h-[200px]">

          {/* GREETING */}
          {step === "greeting" && (
            <div className="flex gap-6 items-start">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-editorial-person-Bt8k6YePvnPHSwcK8XtieV.webp"
                alt="illustration"
                className="w-28 opacity-80 shrink-0"
              />
              <div className="pt-2">
                <p className="text-base leading-relaxed" style={{ color: "oklch(0.35 0.01 60)" }}>
                  Let's set up your day in just a few quick questions. No pressure — answer what you can, skip anything you don't have yet.
                </p>
                <p className="text-sm mt-3 italic" style={{ color: "oklch(0.52 0.015 70)" }}>
                  "Your brain is not broken — it just works differently."
                </p>
              </div>
            </div>
          )}

          {/* MOOD */}
          {step === "mood" && (
            <div className="flex flex-wrap gap-3">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-4 py-3 transition-all",
                    "border",
                    mood === m.value
                      ? "border-[oklch(0.52_0.14_35)] bg-[oklch(0.52_0.14_35_/_0.07)]"
                      : "border-[oklch(0.88_0.012_75)] hover:border-[oklch(0.52_0.14_35_/_0.5)]"
                  )}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="editorial-label">{m.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* TASKS */}
          {step === "tasks" && (
            <div>
              <p className="text-sm mb-3" style={{ color: "oklch(0.52 0.015 70)" }}>
                Type one task and press Enter. Add as many as you like, or skip.
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="e.g. Reply to Alice's email…"
                  className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none"
                  style={{ border: "1px solid oklch(0.87 0.014 75)", color: "oklch(0.18 0.01 60)" }}
                />
                <button
                  onClick={addTask}
                  className="px-3 py-2 text-sm"
                  style={{ background: "oklch(0.52 0.14 35)", color: "white" }}
                >
                  +
                </button>
              </div>
              {tasks.length > 0 && (
                <ul className="space-y-1.5">
                  {tasks.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.35 0.01 60)" }}>
                      <span style={{ color: "oklch(0.52 0.14 35)" }}>—</span>
                      {t}
                      <button onClick={() => setTasks((p) => p.filter((_, j) => j !== i))} className="ml-auto text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* AGENTS */}
          {step === "agents" && (
            <div>
              <p className="text-sm mb-3" style={{ color: "oklch(0.52 0.015 70)" }}>
                Format: <span className="font-medium">Agent name — what it's doing</span>. E.g. "Manus — research competitors"
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAgent()}
                  placeholder="Manus — writing blog post draft…"
                  className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none"
                  style={{ border: "1px solid oklch(0.87 0.014 75)", color: "oklch(0.18 0.01 60)" }}
                />
                <button
                  onClick={addAgent}
                  className="px-3 py-2 text-sm"
                  style={{ background: "oklch(0.52 0.14 35)", color: "white" }}
                >
                  +
                </button>
              </div>
              {agents.length > 0 && (
                <ul className="space-y-1.5">
                  {agents.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.35 0.01 60)" }}>
                      <span style={{ color: "oklch(0.52 0.14 35)" }}>—</span>
                      <span className="font-medium">{a.name}</span>: {a.task}
                      <button onClick={() => setAgents((p) => p.filter((_, j) => j !== i))} className="ml-auto text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* WINS */}
          {step === "wins" && (
            <div>
              <p className="text-sm mb-3" style={{ color: "oklch(0.52 0.015 70)" }}>
                What did you accomplish yesterday? Even small things count.
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={winInput}
                  onChange={(e) => setWinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWin()}
                  placeholder="e.g. Finished the report draft…"
                  className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none"
                  style={{ border: "1px solid oklch(0.87 0.014 75)", color: "oklch(0.18 0.01 60)" }}
                />
                <button
                  onClick={addWin}
                  className="px-3 py-2 text-sm"
                  style={{ background: "oklch(0.52 0.14 35)", color: "white" }}
                >
                  +
                </button>
              </div>
              {wins.length > 0 && (
                <ul className="space-y-1.5">
                  {wins.map((w, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.35 0.01 60)" }}>
                      <span>⭐</span> {w}
                      <button onClick={() => setWins((p) => p.filter((_, j) => j !== i))} className="ml-auto text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* FOCUS NOTE */}
          {step === "focus" && (
            <div>
              <p className="text-sm mb-3" style={{ color: "oklch(0.52 0.015 70)" }}>
                One sentence. What's the single most important thing today?
              </p>
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={focusNote}
                onChange={(e) => setFocusNote(e.target.value)}
                placeholder="Today I will…"
                rows={3}
                className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none resize-none"
                style={{ border: "1px solid oklch(0.87 0.014 75)", color: "oklch(0.18 0.01 60)" }}
              />
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div className="flex gap-6 items-start">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410012773/WNs8kMVMKanwFbtYhk72en/adhd-editorial-brain-AsWVT7JWa9jdswJaKeJWzj.webp"
                alt="illustration"
                className="w-20 opacity-80 shrink-0"
              />
              <div className="pt-1 space-y-1.5 text-sm" style={{ color: "oklch(0.35 0.01 60)" }}>
                {mood && <p>Mood: {MOODS.find((m) => m.value === mood)?.emoji} {MOODS.find((m) => m.value === mood)?.label}</p>}
                {tasks.length > 0 && <p>{tasks.length} task{tasks.length > 1 ? "s" : ""} added</p>}
                {agents.length > 0 && <p>{agents.length} agent{agents.length > 1 ? "s" : ""} logged</p>}
                {wins.length > 0 && <p>{wins.length} win{wins.length > 1 ? "s" : ""} recorded</p>}
                {focusNote && <p className="italic">"{focusNote}"</p>}
                {!mood && !tasks.length && !agents.length && !wins.length && !focusNote && (
                  <p className="italic text-muted-foreground">Nothing added — that's okay. Your space is ready.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-8 py-5"
          style={{ borderTop: "1px solid oklch(0.88 0.012 75)" }}
        >
          <button
            onClick={onSkip}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Skip for today
          </button>

          {step !== "done" ? (
            <button
              onClick={next}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95"
              style={{ background: "oklch(0.52 0.14 35)", color: "white" }}
            >
              {step === "greeting" ? "Let's go" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95"
              style={{ background: "oklch(0.52 0.14 35)", color: "white" }}
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
