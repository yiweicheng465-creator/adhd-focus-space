/* ============================================================
   ADHD FOCUS SPACE — Brain Dump v4.0 (Morandi + #tags)
   Auto-detect #tags on capture, filter by tag, highlight inline
   ============================================================ */

import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowRight, Brain, Hash, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Task } from "./TaskManager";

interface BrainDumpEntry {
  id: string;
  text: string;
  tags: string[];       // extracted from #hashtags
  createdAt: Date;
  converted: boolean;
}

interface BrainDumpProps {
  onConvertToTask: (task: Task) => void;
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
  const matches = text.match(/#([a-zA-Z0-9\u4e00-\u9fa5_-]+)/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((t) => t.slice(1).toLowerCase())));
}

/** Render text with #tags highlighted as inline coral chips */
function HighlightedText({ text, activeTag }: { text: string; activeTag: string | null }) {
  const parts = text.split(/(#[a-zA-Z0-9\u4e00-\u9fa5_-]+)/g);
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

export function BrainDump({ onConvertToTask }: BrainDumpProps) {
  const [currentThought, setCurrentThought] = useState("");
  const [entries,        setEntries]        = useState<BrainDumpEntry[]>([]);
  const [activeTag,      setActiveTag]      = useState<string | null>(null);

  // All unique tags across all entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [entries]);

  // Entries filtered by active tag
  const visibleEntries = useMemo(() => {
    if (!activeTag) return entries;
    return entries.filter((e) => e.tags.includes(activeTag));
  }, [entries, activeTag]);

  const dump = () => {
    if (!currentThought.trim()) return;
    const tags = extractTags(currentThought);
    setEntries([
      { id: nanoid(), text: currentThought.trim(), tags, createdAt: new Date(), converted: false },
      ...entries,
    ]);
    setCurrentThought("");
    const tagMsg = tags.length > 0 ? ` Tagged: ${tags.map((t) => `#${t}`).join(", ")}` : "";
    toast.success(`Thought captured.${tagMsg}`, { duration: 2500 });
  };

  const convertToTask = (entry: BrainDumpEntry) => {
    onConvertToTask({
      id: nanoid(), text: entry.text, priority: "focus",
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

  // Live tag preview while typing
  const liveTagsInInput = extractTags(currentThought);

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Header */}
      <div className="flex items-start gap-3 p-4" style={{ background: M.coralBg, border: `1px solid ${M.coralBdr}` }}>
        <Brain className="w-5 h-5 mt-0.5 shrink-0" style={{ color: M.coral }} />
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>
            Capture racing thoughts
          </p>
          <p className="text-xs mt-0.5" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
            Add <span style={{ color: M.coral, fontWeight: 600 }}>#tags</span> anywhere in your text to organise ideas. e.g. "Build a landing page <span style={{ color: M.coral }}>#work</span> <span style={{ color: M.coral }}>#design</span>"
          </p>
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
            <Brain className="w-3.5 h-3.5" />
            Dump It
          </button>
        </div>
      </div>

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
          <button onClick={clearAll} className="m-btn-link">
            Clear all
          </button>
        </div>
      )}

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="w-10 h-10 mb-3" style={{ color: `${M.muted}50` }} />
            <p className="text-sm" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
              Your brain dump is empty. Let your thoughts flow!
            </p>
            <p className="text-xs mt-1" style={{ color: `${M.muted}80`, fontFamily: "'DM Sans', sans-serif" }}>
              Tip: use #tags to organise as you go
            </p>
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
            {/* Text with highlighted tags */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p
                  className={cn("text-sm leading-relaxed", entry.converted && "line-through")}
                  style={{ color: entry.converted ? M.muted : M.ink, fontFamily: "'DM Sans', sans-serif" }}
                >
                  <HighlightedText text={entry.text} activeTag={activeTag} />
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
