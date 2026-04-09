/* ============================================================
   ADHD FOCUS SPACE — Daily Wrap-Up v3.0 (Morandi)
   End-of-day digest: agents, tasks, wins
   Coral/sage/slumber palette, English text
   ============================================================ */

import { useState } from "react";
import { CheckCircle2, ClipboardCopy, Sparkles, X } from "lucide-react";
import { PixelAgents } from "@/components/PixelIcons";
import { toast } from "sonner";
import type { Task } from "./TaskManager";
import type { Win } from "./DailyWins";
import type { Agent } from "./AgentTracker";

// ── Win category colours (must match DailyWins WIN_ICONS order) ──
const WIN_CAT_COLORS = [
  "oklch(0.60 0.10 15)",   // health
  "oklch(0.52 0.08 230)",  // study
  "oklch(0.50 0.07 145)",  // work
  "oklch(0.58 0.09 55)",   // social
  "oklch(0.55 0.10 300)",  // creative
  "oklch(0.55 0.07 185)",  // mindful
  "oklch(0.53 0.09 35)",   // fitness
  "oklch(0.52 0.10 130)",  // nutrition
];
const WIN_CAT_LABELS = ["Health","Study","Work","Social","Creative","Mindful","Fitness","Nutrition"];

// Inline SVG icons matching DailyWins (simplified)
function WinSvgIcon({ idx, size = 22, color }: { idx: number; size?: number; color: string }) {
  const icons = [
    // 0 health: heart
    <svg key="h" viewBox="0 0 20 20" width={size} height={size} fill="none">
      <path d="M10 16s-7-4.5-7-8.5A4 4 0 0110 4a4 4 0 017 3.5C17 11.5 10 16 10 16z" fill={color} opacity="0.9"/>
    </svg>,
    // 1 study: open book
    <svg key="s" viewBox="0 0 20 20" width={size} height={size} fill="none">
      <path d="M3 5h6v11H3z" fill={color} opacity="0.85"/>
      <path d="M11 5h6v11h-6z" fill={color} opacity="0.6"/>
      <line x1="9" y1="5" x2="11" y2="5" stroke={color} strokeWidth="1.5"/>
      <line x1="9" y1="16" x2="11" y2="16" stroke={color} strokeWidth="1.5"/>
    </svg>,
    // 2 work: briefcase
    <svg key="w" viewBox="0 0 20 20" width={size} height={size} fill="none">
      <rect x="2" y="7" width="16" height="10" rx="2" fill={color} opacity="0.85"/>
      <path d="M7 7V5a1 1 0 011-1h4a1 1 0 011 1v2" stroke={color} strokeWidth="1.5" fill="none"/>
      <line x1="2" y1="12" x2="18" y2="12" stroke="white" strokeWidth="1" opacity="0.6"/>
    </svg>,
    // 3 social: two people
    <svg key="so" viewBox="0 0 20 20" width={size} height={size} fill="none">
      <circle cx="7" cy="6" r="3" fill={color} opacity="0.85"/>
      <circle cx="13" cy="6" r="3" fill={color} opacity="0.6"/>
      <path d="M1 17c0-3 2.5-5 6-5s6 2 6 5" fill={color} opacity="0.85"/>
      <path d="M13 12c2.5 0 5 1.5 5 5" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6"/>
    </svg>,
    // 4 creative: star
    <svg key="cr" viewBox="0 0 20 20" width={size} height={size} fill="none">
      <polygon points="10,2 12.4,7.5 18.5,8 14,12 15.5,18 10,15 4.5,18 6,12 1.5,8 7.6,7.5" fill={color} opacity="0.9"/>
    </svg>,
    // 5 mindful: lotus
    <svg key="m" viewBox="0 0 20 20" width={size} height={size} fill="none">
      <path d="M10 16 C10 16 4 12 4 7 C4 4 7 3 10 6 C13 3 16 4 16 7 C16 12 10 16 10 16Z" fill={color} opacity="0.85"/>
      <path d="M10 16 C6 14 2 10 3 6" stroke={color} strokeWidth="1" fill="none" opacity="0.5"/>
      <path d="M10 16 C14 14 18 10 17 6" stroke={color} strokeWidth="1" fill="none" opacity="0.5"/>
    </svg>,
    // 6 fitness: lightning
    <svg key="f" viewBox="0 0 20 20" width={size} height={size} fill="none">
      <polygon points="12,2 5,11 10,11 8,18 15,9 10,9" fill={color} opacity="0.9"/>
    </svg>,
    // 7 nutrition: apple
    <svg key="n" viewBox="0 0 20 20" width={size} height={size} fill="none">
      <path d="M10 5 C6 5 3 8 3 12 C3 16 6 18 10 18 C14 18 17 16 17 12 C17 8 14 5 10 5Z" fill={color} opacity="0.85"/>
      <path d="M10 5 C10 3 12 2 13 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>,
  ];
  return icons[idx % icons.length] ?? icons[0];
}

// ── Grouped arc-segment wins ring (like health score reference) ──
function WinsRing({ wins }: { wins: Win[] }) {
  const [hoveredCat, setHoveredCat] = useState<number | null>(null);
  const [hoveredWin, setHoveredWin] = useState<string | null>(null);

  if (wins.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: "oklch(0.55 0.018 70)", fontFamily: "'DM Sans', sans-serif" }}>
        No wins logged yet — completing tasks adds them automatically.
      </p>
    );
  }

  const total = wins.length;
  // Larger SVG to give room for icons outside the arc
  const SIZE = 280;
  const cx = 140, cy = 140;
  const arcR = 80;   // arc stroke center radius

  // Group wins by category index
  const groups: { idx: number; wins: Win[] }[] = [];
  wins.forEach((w) => {
    const idx = typeof w.iconIdx === "number" ? w.iconIdx % WIN_CAT_COLORS.length : 0;
    const existing = groups.find((g) => g.idx === idx);
    if (existing) existing.wins.push(w);
    else groups.push({ idx, wins: [w] });
  });

  // Sort groups by category index for consistent ordering
  groups.sort((a, b) => a.idx - b.idx);

  // Compute arc spans — proportional to win count, with LARGER gaps to prevent overlap
  // Minimum arc size ensures even single wins get a visible segment
  const MIN_ARC_DEG = 18; // minimum degrees per segment so it's always visible
  const GAP_DEG = groups.length > 1 ? 10 : 0; // generous gap between arcs
  const totalGap = GAP_DEG * groups.length;
  const totalMinArc = MIN_ARC_DEG * groups.length;
  const availableDeg = Math.max(0, 360 - totalGap - totalMinArc);

  let currentAngle = -90; // start at top
  const arcSegments = groups.map((g) => {
    const proportion = g.wins.length / total;
    const arcDeg = MIN_ARC_DEG + availableDeg * proportion;
    const startAngle = currentAngle + GAP_DEG / 2; // center the gap
    const endAngle = startAngle + arcDeg;
    const midAngle = (startAngle + endAngle) / 2;
    currentAngle = endAngle + GAP_DEG / 2;
    return { ...g, startAngle, endAngle, midAngle, arcDeg };
  });

  // Convert degrees to SVG arc path
  function polarToXY(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function describeArc(startDeg: number, endDeg: number, radius: number) {
    const start = polarToXY(startDeg, radius);
    const end = polarToXY(endDeg, radius);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const STROKE = 14; // thinner arc so icons don't overlap the stroke
  // Icons sit OUTSIDE the arc ring to avoid overlapping segments
  const ICON_ORBIT_R = arcR + STROKE / 2 + 16; // outside the arc

  return (
    <div className="flex flex-col items-center gap-3">
      <div style={{ position: "relative", width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {/* Background guide ring */}
          <circle cx={cx} cy={cy} r={arcR} fill="none" stroke="oklch(0.90 0.010 75)" strokeWidth="1" strokeDasharray="3 5" />

          {/* Arc segments — use butt caps so gaps are clean */}
          {arcSegments.map((seg) => {
            const color = WIN_CAT_COLORS[seg.idx];
            const isHov = hoveredCat === seg.idx;
            const arcPath = describeArc(seg.startAngle, seg.endAngle, arcR);
            return (
              <path
                key={seg.idx}
                d={arcPath}
                fill="none"
                stroke={color}
                strokeWidth={isHov ? STROKE + 3 : STROKE}
                strokeLinecap="butt"
                opacity={isHov ? 1 : 0.80}
                style={{ transition: "stroke-width 0.2s, opacity 0.2s", cursor: "pointer" }}
                onMouseEnter={() => setHoveredCat(seg.idx)}
                onMouseLeave={() => setHoveredCat(null)}
              />
            );
          })}

          {/* Center count */}
          <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fill: "oklch(0.28 0.018 65)", fontWeight: 700 }}>{total}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fill: "oklch(0.55 0.018 70)", textTransform: "uppercase", letterSpacing: 2 }}>wins</text>
        </svg>

        {/* Category icons — positioned OUTSIDE the arc ring, fixed small size */}
        {arcSegments.map((seg) => {
          const color = WIN_CAT_COLORS[seg.idx];
          const label = WIN_CAT_LABELS[seg.idx];
          const isHov = hoveredCat === seg.idx;
          const { x, y } = polarToXY(seg.midAngle, ICON_ORBIT_R);
          // Fixed small icon size — no scaling to prevent overlap
          const iconSize = 14;
          const circleR = 13; // fixed bubble radius

          return (
            <div
              key={seg.idx}
              style={{
                position: "absolute",
                left: x - circleR,
                top: y - circleR,
                width: circleR * 2,
                height: circleR * 2,
                zIndex: isHov ? 20 : 5,
              }}
              onMouseEnter={() => setHoveredCat(seg.idx)}
              onMouseLeave={() => setHoveredCat(null)}
            >
              {/* Icon bubble */}
              <div style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `${color}18`,
                border: `2.5px solid ${color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.2s, box-shadow 0.2s",
                transform: isHov ? "scale(1.2)" : "scale(1)",
                boxShadow: isHov ? `0 3px 14px ${color}55` : "none",
                cursor: "default",
                backdropFilter: "blur(2px)",
              }}>
                <WinSvgIcon idx={seg.idx} size={iconSize} color={color} />
                {/* Count badge */}
                {seg.wins.length > 1 && (
                  <div style={{
                    position: "absolute",
                    top: -4, right: -4,
                    width: 16, height: 16,
                    borderRadius: "50%",
                    background: color,
                    color: "white",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'DM Sans', sans-serif",
                    border: "1.5px solid white",
                  }}>{seg.wins.length}</div>
                )}
              </div>

              {/* Hover tooltip showing all wins in category */}
              {isHov && (
                <div style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "oklch(0.18 0.01 60 / 0.94)",
                  color: "white",
                  borderRadius: 8,
                  padding: "7px 12px",
                  whiteSpace: "nowrap",
                  fontSize: 11,
                  fontFamily: "'DM Sans', sans-serif",
                  pointerEvents: "none",
                  zIndex: 30,
                  maxWidth: 200,
                  textAlign: "left",
                  lineHeight: 1.5,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    {label} · {seg.wins.length} {seg.wins.length === 1 ? "win" : "wins"}
                  </div>
                  {seg.wins.map((w) => (
                    <div key={w.id} style={{ paddingLeft: 6, borderLeft: `2px solid ${color}`, marginBottom: 2, opacity: 0.9 }}>
                      {w.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const M = {
  coral:    "oklch(0.55 0.09 35)",
  coralBg:  "oklch(0.55 0.09 35 / 0.08)",
  coralBdr: "oklch(0.55 0.09 35 / 0.28)",
  sage:     "oklch(0.52 0.07 145)",
  sageBg:   "oklch(0.52 0.07 145 / 0.08)",
  sageBdr:  "oklch(0.52 0.07 145 / 0.28)",
  pink:     "oklch(0.62 0.06 20)",
  pinkBg:   "oklch(0.62 0.06 20 / 0.08)",
  pinkBdr:  "oklch(0.62 0.06 20 / 0.28)",
  slumber:  "oklch(0.55 0.018 70)",
  ink:      "oklch(0.28 0.018 65)",
  muted:    "oklch(0.55 0.018 70)",
  border:   "oklch(0.88 0.014 75)",
  card:     "oklch(0.975 0.012 80)",
  bg:       "oklch(0.972 0.010 78)",
};

interface DailyWrapUpProps {
  tasks: Task[];
  wins: Win[];
  agents: Agent[];
  quitCount?: number;
  onClose: () => void;
}

export function DailyWrapUp({ tasks, wins, agents, quitCount = 0, onClose }: DailyWrapUpProps) {
  const [copied, setCopied] = useState(false);

  const today    = new Date().toDateString();
  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const doneTasks     = tasks.filter((t) => t.done);
  const activeTasks   = tasks.filter((t) => !t.done);
  const todayWins     = wins.filter((w) => new Date(w.createdAt).toDateString() === today);
  const todayAgents   = agents.filter((a) => new Date(a.startedAt).toDateString() === today);
  const doneAgents    = todayAgents.filter((a) => a.status === "done");
  const runningAgents = todayAgents.filter((a) => a.status === "running");
  const workDone      = doneTasks.filter((t) => t.context === "work");
  const personalDone  = doneTasks.filter((t) => t.context === "personal");

  const rawScore   = Math.min(100, doneTasks.length * 15 + todayWins.length * 10 + doneAgents.length * 10);
  const quitPenalty = Math.min(quitCount * 10, 40);
  const score      = Math.max(0, rawScore - quitPenalty);
  const scoreLabel = score >= 80 ? "Supercharged day! 🚀" : score >= 50 ? "Solid work today 💪" : score >= 20 ? "Progress made — keep going 🌱" : quitCount > 0 ? `${quitCount} quit${quitCount !== 1 ? 's' : ''} today — tomorrow is a new page ☁️` : "Rest is productive too ☕";

  const generateDigest = () => {
    const lines = [
      `📋 Daily Wrap-Up — ${todayStr}`,
      "─".repeat(32),
      "",
      `✅ Tasks completed (${doneTasks.length})`,
      ...doneTasks.map((t) => `  • [${t.context}] ${t.text}`),
      "",
      `🤖 AI Agents today (${todayAgents.length})`,
      ...todayAgents.map((a) => `  • ${a.name}: ${a.task} [${a.status}]${a.notes ? `\n    → ${a.notes}` : ""}`),
      "",
      `🌟 Wins (${todayWins.length})`,
      ...todayWins.map((w) => `  • ${w.text}`),
      "",
      activeTasks.length > 0
        ? `⏳ Still pending (${activeTasks.length})\n${activeTasks.slice(0, 5).map((t) => `  • ${t.text}`).join("\n")}`
        : "🎉 All tasks cleared!",
      "",
      runningAgents.length > 0 ? `⚠️  Still running: ${runningAgents.map((a) => a.name).join(", ")}` : "",
    ];
    return lines.filter(Boolean).join("\n");
  };

  const copyDigest = async () => {
    try {
      await navigator.clipboard.writeText(generateDigest());
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Copy failed — please select text manually.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0.18 0.01 60 / 0.30)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        style={{ background: M.card, border: `1px solid ${M.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5" style={{ borderBottom: `1px solid ${M.border}`, background: M.coralBg }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>{todayStr}</p>
              <h2 className="text-xl font-bold italic mt-0.5" style={{ fontFamily: "'Playfair Display', serif", color: M.ink }}>
                Daily Wrap-Up
              </h2>
              <p className="text-sm mt-1" style={{ color: M.coral, fontFamily: "'DM Sans', sans-serif" }}>{scoreLabel}</p>
            </div>
            <button onClick={onClose} className="p-1 transition-colors" style={{ color: M.muted }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Score bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>
              <span>Today's score</span>
              <span className="font-medium" style={{ color: M.ink }}>{score} / 100</span>
            </div>
            <div className="h-1.5 w-full" style={{ background: M.border }}>
              <div className="h-full transition-all duration-700" style={{ width: `${score}%`, background: M.coral }} />
            </div>
            {quitCount > 0 && (
              <p className="text-xs mt-1" style={{ color: "#C8603A", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }}>
                −{quitPenalty} penalty · {quitCount} session{quitCount !== 1 ? 's' : ''} quit today
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Tasks */}
          <Section icon={<CheckCircle2 className="w-4 h-4" />} title={`Tasks completed (${doneTasks.length})`} color={M.sage}>
            {doneTasks.length === 0 ? (
              <p className="text-sm italic" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>No tasks completed yet — tomorrow's a new start.</p>
            ) : (
              <div className="space-y-2">
                {workDone.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: M.sage, fontFamily: "'DM Sans', sans-serif" }}>Work</p>
                    {workDone.map((t) => <TaskRow key={t.id} text={t.text} color={M.sage} />)}
                  </div>
                )}
                {personalDone.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: M.pink, fontFamily: "'DM Sans', sans-serif" }}>Personal</p>
                    {personalDone.map((t) => <TaskRow key={t.id} text={t.text} color={M.pink} />)}
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Agents */}
          <Section icon={<PixelAgents size={16} active={true} color={M.coral} />} title={`AI Agents today (${todayAgents.length})`} color={M.coral}>
            {todayAgents.length === 0 ? (
              <p className="text-sm italic" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>No agents logged today.</p>
            ) : (
              <div className="space-y-2">
                {todayAgents.map((a) => {
                  const sc: Record<string, string> = { running: M.coral, paused: M.slumber, done: M.sage, failed: "oklch(0.55 0.09 35)" };
                  return (
                    <div key={a.id} className="flex items-start gap-2 p-2.5" style={{ background: M.bg, border: `1px solid ${M.border}` }}>
                      <div className="w-2 h-2 mt-1.5 shrink-0" style={{ background: sc[a.status] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: M.ink, fontFamily: "'DM Sans', sans-serif" }}>{a.name}</span>
                          <span className="text-xs capitalize" style={{ color: sc[a.status], fontFamily: "'DM Sans', sans-serif" }}>{a.status}</span>
                        </div>
                        <p className="text-xs truncate" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>{a.task}</p>
                        {a.notes && (
                          <p className="text-xs mt-1 p-1.5" style={{ color: M.ink, background: M.card, border: `1px solid ${M.border}`, fontFamily: "'DM Sans', sans-serif" }}>
                            → {a.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Wins */}
          <Section icon={<Sparkles className="w-4 h-4" />} title={`Wins today (${todayWins.length})`} color={M.pink}>
            <WinsRing wins={todayWins} />
          </Section>

          {/* Pending */}
          {activeTasks.length > 0 && (
            <Section icon={<span className="text-base">⏳</span>} title={`Still pending (${activeTasks.length})`} color={M.slumber}>
              <div className="space-y-1.5">
                {activeTasks.slice(0, 6).map((t) => <TaskRow key={t.id} text={t.text} color={M.slumber} />)}
                {activeTasks.length > 6 && <p className="text-xs" style={{ color: M.muted, fontFamily: "'DM Sans', sans-serif" }}>…and {activeTasks.length - 6} more</p>}
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 flex gap-3" style={{ borderTop: `1px solid ${M.border}` }}>
          <button onClick={onClose} className="m-btn-ghost flex-1">
            Close
          </button>
          <button onClick={copyDigest} className="m-btn-primary flex-1 justify-center">
            <ClipboardCopy className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Copy summary"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <p className="text-sm font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function TaskRow({ text, color }: { text: string; color: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color }} />
      <span className="text-sm" style={{ color: "oklch(0.28 0.018 65)", fontFamily: "'DM Sans', sans-serif" }}>{text}</span>
    </div>
  );
}
