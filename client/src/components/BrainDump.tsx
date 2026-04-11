/* ============================================================
   ADHD FOCUS SPACE — Brain Dump v4.0 (Morandi + #tags)
   Auto-detect #tags on capture, filter by tag, highlight inline
   ============================================================ */

import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { PixelBrain } from "@/components/PixelIcons";
import { cn } from "@/lib/utils";
import { ArrowRight, Hash, Sparkles, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";
import { trpc } from "@/lib/trpc";

interface BrainDumpEntry {
  id: string;
  text: string;
  tags: string[];       // extracted from #hashtags
  createdAt: Date;
  converted: boolean;
}

interface BrainDumpProps {
  onConvertToTask: (task: Task) => void;
  onCreateAgent?: (taskText: string) => void;
  onDump?: () => void;
  initialText?: string;
  onInitialTextConsumed?: () => void;
}

const M = {
  coral:    "oklch(0.55 0.09 35)",
  coralBg:  "oklch(0.55 0.09 35 / 0.08)",
  coralBdr: "oklch(0.55 0.09 35 / 0.28)",
  sage:     "oklch(0.52 0.07 145)",
  sageBg:   "oklch(0.52 0.07 145 / 0.08)",
  sageBdr:  "oklch(0.52 0.07 145 / 0.28)",
  ink:      "oklch(0.28 0.018 65)",
  muted:    "oklch(0.55 0.018 70)",
  border:   "oklch(0.88 0.014 75)",
  card:     "oklch(0.985 0.007 80)",
  tagBg:    "oklch(0.55 0.09 35 / 0.10)",
  tagBdr:   "oklch(0.55 0.09 35 / 0.22)",
};

/** Extract all #tags from a string, return lowercase without the # */
function extractTags(text: string): string[] {
  // Only match #tag when preceded by whitespace or start of string (not inside URLs)
  const matches = text.match(/(?:^|\s)(#[a-zA-Z0-9\u4e00-\u9fa5_-]+)/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((t) => t.trim().slice(1).toLowerCase())));
}

/** Render text with #tags highlighted as inline coral chips */
function HighlightedText({ text, activeTag }: { text: string; activeTag: string | null }) {
  // Split on #tags only when preceded by whitespace or start of string
  const parts = text.split(/((?:^|(?<=\s))#[a-zA-Z0-9\u4e00-\u9fa5_-]+)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("#")) {
          const tag = part.slice(1).toLowerCase();
          const isActive = activeTag === tag;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-0.5 mx-0.5 px-1.5 py-0.5 text-xs font-medium"
              style={{
                background: isActive ? M.coral : M.tagBg,
                border: `1px solid ${isActive ? M.coral : M.tagBdr}`,
                color: isActive ? "oklch(0.97 0.005 80)" : M.coral,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              <Hash className="w-2.5 h-2.5" />
              {part.slice(1)}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

const STORAGE_KEY = "adhd_braindump_entries";

function loadEntries(): BrainDumpEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<BrainDumpEntry & { createdAt: string }>;
    // Filter out entries that were already moved to Tasks — they should not reappear on refresh
    return parsed
      .filter((e) => !e.converted)
      .map((e) => ({ ...e, createdAt: new Date(e.createdAt) }));
  } catch {
    return [];
  }
}

export function BrainDump({ onConvertToTask, onCreateAgent, onDump, initialText, onInitialTextConsumed }: BrainDumpProps) {
  const [currentThought, setCurrentThought] = useState("");
  const [entries,        setEntries]        = useState<BrainDumpEntry[]>(() => loadEntries());
  const [activeTag,      setActiveTag]      = useState<string | null>(null);

  // Persist entries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // storage full or unavailable — silently ignore
    }
  }, [entries]);

  // All unique tags across all entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [entries]);

  // Entries filtered by active tag — also exclude converted entries from display
  const visibleEntries = useMemo(() => {
    const active = entries.filter((e) => !e.converted);
    if (!activeTag) return active;
    return active.filter((e) => e.tags.includes(activeTag));
  }, [entries, activeTag]);

  const dump = () => {
    if (!currentThought.trim()) return;
    const tags = extractTags(currentThought);
    setEntries([
      { id: nanoid(), text: currentThought.trim(), tags, createdAt: new Date(), converted: false },
      ...entries,
    ]);
    setCurrentThought("");
    onDump?.();
    const tagMsg = tags.length > 0 ? ` Tagged: ${tags.map((t) => `#${t}`).join(", ")}` : "";
    toast.success(`Thought captured.${tagMsg}`, { duration: 2500 });
  };

  const convertToTask = (entry: BrainDumpEntry) => {
    const cleanText = entry.text.replace(/(?:^|\s)#[a-zA-Z0-9\u4e00-\u9fa5_-]+/g, " ").replace(/\s{2,}/g, " ").trim();
    onConvertToTask({
      id: nanoid(), text: cleanText || entry.text.trim(), priority: "focus",
      context: "work", done: false, createdAt: new Date(),
    });
    setEntries(entries.map((e) => e.id === entry.id ? { ...e, converted: true } : e));
    toast.success("Moved to tasks.", { duration: 2000 });
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const clearAll = () => {
    setEntries([]);
    setActiveTag(null);
    toast.info("Brain dump cleared.", { duration: 2000 });
  };

  // ── AI Categorise ──
  const [aiResults, setAiResults] = useState<Array<{
    original: string;
    category: "task" | "worry" | "idea" | "reminder" | "other";
    action: "add_to_tasks" | "archive" | "keep";
    rewritten: string;
    emoji: string;
  }> | null>(null);
  const [aiDismissed, setAiDismissed] = useState(false);

  const categorizeMutation = trpc.ai.categorizeDump.useMutation({
    onSuccess: (data) => {
      setAiResults(data.items);
      setAiDismissed(false);
      toast.success("AI sorted your thoughts!", { duration: 2500 });
    },
    onError: () => {
      toast.error("AI couldn't categorise right now. Try again.", { duration: 3000 });
    },
  });

  const handleAiCategorise = () => {
    const unconverted = entries.filter((e) => !e.converted);
    if (unconverted.length === 0) {
      toast.info("No entries to categorise yet.", { duration: 2000 });
      return;
    }
    categorizeMutation.mutate({ entries: unconverted.map((e) => e.text) });
  };

  const applyAiAction = (item: typeof aiResults extends Array<infer T> | null ? T : never) => {
    if (!item) return;
    if (item.action === "add_to_tasks") {
      onConvertToTask({
        id: nanoid(), text: item.rewritten, priority: "focus",
        context: "work", done: false, createdAt: new Date(),
      });
      // Mark original entry as converted
      setEntries((prev) => prev.map((e) =>
        e.text === item.original ? { ...e, converted: true } : e
      ));
      toast.success("Added to tasks.", { duration: 2000 });
    } else if (item.action === "archive") {
      setEntries((prev) => prev.filter((e) => e.text !== item.original));
      toast.info("Archived.", { duration: 1500 });
    }
    // Remove from AI results
    setAiResults((prev) => prev ? prev.filter((r) => r.original !== item.original) : null);
  };

  const pushItemToTask = (item: typeof aiResults extends Array<infer T> | null ? T : never) => {
    if (!item) return;
    const rawText = item.rewritten || item.original;
    const text = rawText.replace(/(?:^|\s)#[a-zA-Z0-9\u4e00-\u9fa5_-]+/g, " ").replace(/\s{2,}/g, " ").trim() || rawText.trim();
    onConvertToTask({
      id: nanoid(), text, priority: "focus",
      context: "work", done: false, createdAt: new Date(),
    });
    setEntries((prev) => prev.map((e) =>
      e.text === item.original ? { ...e, converted: true } : e
    ));
    setAiResults((prev) => prev ? prev.filter((r) => r.original !== item.original) : null);
    toast.success("Added to tasks.", { duration: 2000 });
  };

  const pushAllToTasks = () => {
    if (!aiResults) return;
    const taskItems = aiResults.filter((r) => r.action === "add_to_tasks" || r.category === "task");
    taskItems.forEach((item) => {
      const rawText = item.rewritten || item.original;
      const text = rawText.replace(/(?:^|\s)#[a-zA-Z0-9\u4e00-\u9fa5_-]+/g, " ").replace(/\s{2,}/g, " ").trim() || rawText.trim();
      onConvertToTask({
        id: nanoid(), text, priority: "focus",
        context: "work", done: false, createdAt: new Date(),
      });
      setEntries((prev) => prev.map((e) =>
        e.text === item.original ? { ...e, converted: true } : e
      ));
    });
    setAiResults((prev) => prev ? prev.filter((r) => r.action !== "add_to_tasks" && r.category !== "task") : null);
    toast.success(`${taskItems.length} item${taskItems.length !== 1 ? "s" : ""} added to tasks.`, { duration: 2500 });
  };

  const sendToAgent = (item: typeof aiResults extends Array<infer T> | null ? T : never) => {
    if (!item) return;
    const text = item.rewritten || item.original;
    onCreateAgent?.(text);
    setAiResults((prev) => prev ? prev.filter((r) => r.original !== item.original) : null);
    toast.success("Sent to AI Agents.", { duration: 2000 });
  };

  // Auto-dump initialText (from quick-capture bar) once on mount
  useEffect(() => {
    if (initialText && initialText.trim()) {
      const tags = extractTags(initialText);
      setEntries((prev) => [
        { id: nanoid(), text: initialText.trim(), tags, createdAt: new Date(), converted: false },
        ...prev,
      ]);
      const tagMsg = tags.length > 0 ? ` Tagged: ${tags.map((t) => `#${t}`).join(", ")}` : "";
      toast.success(`Thought captured.${tagMsg}`, { duration: 2500 });
      onInitialTextConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live tag preview while typing
  const liveTagsInInput = extractTags(currentThought);

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Header — minimal, geometric */}
      <div className="flex items-center gap-3 mb-1">
        {/* Pixel brain icon */}
        <PixelBrain size={28} color={M.coral} />
        <div>
          <p className="text-sm font-semibold italic" style={{ color: M.ink, fontFamily: "'Playfair Display', serif" }}>Brain Dump</p>
          <p className="editorial-label" style={{ color: M.muted }}>Use <span style={{ color: M.coral }}>#tags</span> to organise</p>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <Textarea
          value={currentThought}
          onChange={(e) => setCurrentThought(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) dump(); }}
          placeholder={"What's on your mind? Use #tags to label ideas…"}
          className="resize-none min-h-[100px]"
          style={{ background: M.card, border: `1px solid ${M.border}`, color: M.ink, fontFamily: "'DM Sans', sans-serif" }}
          rows={4}
        />

        {/* Live tag preview */}
        {liveTagsInInput.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3 h-3 shrink-0" style={{ color: M.muted }} />
            <span className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Detected:</span>
            {liveTagsInInput.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium"
                style={{ background: M.tagBg, border: `1px solid ${M.tagBdr}`, color: M.coral, fontFamily: "'DM Sans', sans-serif" }}
              >
                <Hash className="w-2.5 h-2.5" />
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>⌘ + Enter to capture</span>
          <button onClick={dump} className="m-btn-primary">
            Dump It
          </button>
        </div>
      </div>

      {/* AI Results Panel */}
      {aiResults && !aiDismissed && aiResults.length > 0 && (
        <div
          className="flex flex-col gap-2 p-3"
          style={{ background: "oklch(0.55 0.09 35 / 0.05)", border: `1px solid oklch(0.55 0.09 35 / 0.20)`, borderRadius: 8 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: M.coral }} />
              <span className="text-xs font-semibold" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>AI sorted your thoughts</span>
            </div>
            <div className="flex items-center gap-2">
              {aiResults && aiResults.filter((r) => r.action === "add_to_tasks" || r.category === "task").length > 1 && (
                <button
                  onClick={pushAllToTasks}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium"
                  style={{ background: M.sage, color: "white", borderRadius: 4, fontFamily: "'DM Sans', sans-serif", border: "none" }}
                >
                  <ArrowRight className="w-3 h-3" /> Push all tasks
                </button>
              )}
              <button onClick={() => setAiDismissed(true)} style={{ color: M.muted, background: "none", border: "none", cursor: "pointer" }}><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {aiResults.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2"
                style={{ background: M.card, border: `1px solid ${M.border}`, borderRadius: 6 }}
              >
                <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.4 }}>{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
                    {item.action === "add_to_tasks" ? item.rewritten : item.original}
                  </p>
                  <span
                    className="inline-block mt-0.5 px-1.5 py-0.5 text-xs"
                    style={{
                      background: item.category === "task" ? "oklch(0.52 0.07 145 / 0.12)" : item.category === "worry" ? "oklch(0.55 0.09 35 / 0.10)" : "oklch(0.58 0.09 55 / 0.12)",
                      color: item.category === "task" ? M.sage : item.category === "worry" ? M.coral : "oklch(0.58 0.09 55)",
                      fontFamily: "'DM Sans', sans-serif",
                      borderRadius: 4,
                    }}
                  >
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Push to task — available for all items */}
                  <button
                    onClick={() => pushItemToTask(item)}
                    title="Add to tasks"
                    className="flex items-center gap-1 px-2 py-1 text-xs"
                    style={{ background: M.sage, color: "white", borderRadius: 4, fontFamily: "'DM Sans', sans-serif", border: "none" }}
                  >
                    <ArrowRight className="w-3 h-3" /> Task
                  </button>
                  {/* Send to AI Agent */}
                  {onCreateAgent && (
                    <button
                      onClick={() => sendToAgent(item)}
                      title="Create AI agent for this"
                      className="flex items-center gap-1 px-2 py-1 text-xs"
                      style={{ background: "oklch(0.52 0.14 35 / 0.12)", color: M.coral, borderRadius: 4, fontFamily: "'DM Sans', sans-serif", border: `1px solid oklch(0.52 0.14 35 / 0.25)` }}
                    >
                      <Sparkles className="w-3 h-3" /> Agent
                    </button>
                  )}
                  {item.action === "archive" && (
                    <button
                      onClick={() => applyAiAction(item)}
                      className="flex items-center gap-1 px-2 py-1 text-xs"
                      style={{ background: "oklch(0.88 0.014 75)", color: M.muted, borderRadius: 4, fontFamily: "'DM Sans', sans-serif", border: "none" }}
                    >
                      Archive
                    </button>
                  )}
                  <button onClick={() => setAiResults((prev) => prev ? prev.filter((_, j) => j !== i) : null)} style={{ color: M.muted, background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-medium"
              style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.10em", textTransform: "uppercase" }}
            >
              Filter by tag
            </span>
            <button
              onClick={() => setActiveTag(null)}
              className={cn("m-chip", !activeTag && "active")}
            >
              All ({entries.length})
            </button>
            {allTags.map((tag) => {
              const count = entries.filter((e) => e.tags.includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={cn("m-chip flex items-center gap-0.5", activeTag === tag && "active")}
                >
                  <Hash className="w-2.5 h-2.5" />
                  {tag} ({count})
                </button>
              );
            })}
          </div>
          {activeTag && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                Showing {visibleEntries.length} idea{visibleEntries.length !== 1 ? "s" : ""} tagged
              </span>
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium"
                style={{ background: M.coral, border: `1px solid ${M.coral}`, color: "oklch(0.97 0.005 80)", fontFamily: "'DM Sans', sans-serif" }}
              >
                <Hash className="w-2.5 h-2.5" />
                {activeTag}
              </span>
              <button onClick={() => setActiveTag(null)} className="p-0.5 transition-opacity hover:opacity-60" style={{ color: M.muted }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Entries header */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
            {activeTag ? `#${activeTag}` : "All thoughts"}{" "}
            <span style={{ color: M.muted }}>({visibleEntries.length})</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAiCategorise}
              disabled={categorizeMutation.isPending}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-all"
              style={{
                background: categorizeMutation.isPending ? "oklch(0.88 0.014 75)" : "oklch(0.55 0.09 35 / 0.10)",
                border: `1px solid oklch(0.55 0.09 35 / 0.28)`,
                color: M.coral,
                fontFamily: "'DM Sans', sans-serif",
                borderRadius: 6,
                cursor: categorizeMutation.isPending ? "not-allowed" : "pointer",
              }}
            >
              <Sparkles className="w-3 h-3" />
              {categorizeMutation.isPending ? "Sorting…" : "AI Sort"}
            </button>
            <button onClick={clearAll} className="m-btn-link">
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div style={{ opacity: 0.3 }}><PixelBrain size={40} color={M.muted} /></div>
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>Empty. Let your thoughts flow.</p>
          </div>
        )}

        {visibleEntries.length === 0 && entries.length > 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Tag className="w-8 h-8 mb-2" style={{ color: `${M.muted}50` }} />
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
              No ideas tagged <span style={{ color: M.coral }}>#{activeTag}</span> yet.
            </p>
          </div>
        )}

        {visibleEntries.map((entry) => (
          <div
            key={entry.id}
            className={cn("group flex flex-col gap-2 p-3 transition-all")}
            style={{
              background: entry.converted ? "oklch(0.93 0.012 78 / 0.5)" : M.card,
              border:     `1px solid ${M.border}`,
              opacity:    entry.converted ? 0.55 : 1,
            }}
            onMouseEnter={(e) => {
              if (!entry.converted) (e.currentTarget as HTMLDivElement).style.borderColor = M.coralBdr;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = M.border;
            }}
          >
            {/* Text with tags stripped (tags shown as chips below) */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p
                  className={cn("text-sm leading-relaxed", entry.converted && "line-through")}
                  style={{ color: entry.converted ? M.muted : M.ink, fontFamily: "'DM Sans', sans-serif" }}
                >
                  {entry.text.replace(/(?:^|\s)#[a-zA-Z0-9\u4e00-\u9fa5_-]+/g, "").trim()}
                </p>
                <p className="text-xs mt-1" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
                  {new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>

              {!entry.converted && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => convertToTask(entry)}
                    className="m-chip active"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Task
                  </button>
                  <button onClick={() => deleteEntry(entry.id)} className="p-1 transition-colors" style={{ color: M.muted }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {entry.converted && (
                <span className="text-xs shrink-0" style={{ color: M.sage, fontFamily: "'DM Sans', sans-serif" }}>→ Task</span>
              )}
            </div>

            {/* Tag chips row (only if entry has tags) */}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1" style={{ borderTop: `1px solid ${M.border}` }}>
                {entry.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={cn("m-chip", activeTag === tag && "active")}
                    style={{ fontSize: "0.58rem" }}
                  >
                    <Hash className="w-2 h-2" />
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
