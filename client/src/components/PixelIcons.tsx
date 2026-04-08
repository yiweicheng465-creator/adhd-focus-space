/* ============================================================
   ADHD FOCUS SPACE — PixelIcons
   Cute pixel-art style SVG icons for sidebar navigation.
   All icons use the same beige/terracotta Morandi palette.
   No colored backgrounds — just the pixel character on transparent.
   
   7 icons:
   - PixelHome      → cute laptop/computer with smiley face
   - PixelFocus     → pixel clock/timer with face
   - PixelTasks     → pixel notepad/checklist with face
   - PixelWins      → pixel trophy/star with face
   - PixelDump      → pixel brain/cloud with face
   - PixelGoals     → pixel target/flower with face
   - PixelAgents    → pixel robot/computer with face
   ============================================================ */

import React from "react";

// Shared pixel color — terracotta/dark beige, same as sidebar active color
const PX = "#5A4A3A";   // main pixel color (dark warm brown)
const PX2 = "#8C7B6B";  // lighter pixel for details

interface PixelIconProps {
  size?: number;
  active?: boolean;
  color?: string;
}

/* ── Pixel rect helper: draws a filled square at pixel grid position ── */
function P({ x, y, s = 2, c }: { x: number; y: number; s?: number; c?: string }) {
  return <rect x={x} y={y} width={s} height={s} fill={c || PX} />;
}

/* ════════════════════════════════════════════════════
   HOME — Cute pixel laptop with smiley face
   ════════════════════════════════════════════════════ */
export function PixelHome({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  const c2 = color || (active ? "#D4845A" : PX2);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Screen body */}
      <rect x="2" y="3" width="16" height="11" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Screen inner */}
      <rect x="4" y="5" width="12" height="7" fill={c} opacity="0.12" />
      {/* Smiley eyes */}
      <rect x="7" y="7" width="2" height="2" fill={c} />
      <rect x="11" y="7" width="2" height="2" fill={c} />
      {/* Smiley mouth — pixel curve */}
      <rect x="7" y="10" width="2" height="1" fill={c} />
      <rect x="9" y="11" width="2" height="1" fill={c} />
      <rect x="11" y="10" width="2" height="1" fill={c} />
      {/* Base/stand */}
      <rect x="6" y="14" width="8" height="1.5" fill={c} />
      <rect x="4" y="15.5" width="12" height="1.5" fill={c} />
      {/* Screen border highlight */}
      <rect x="2" y="3" width="16" height="1" fill={c2} opacity="0.3" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   FOCUS — Cute pixel alarm clock / timer with face
   ════════════════════════════════════════════════════ */
export function PixelFocus({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Clock body — rounded square */}
      <rect x="3" y="4" width="14" height="13" rx="1" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Bell bumps on top */}
      <rect x="5" y="2" width="3" height="2" fill={c} />
      <rect x="12" y="2" width="3" height="2" fill={c} />
      {/* Eyes */}
      <rect x="7" y="8" width="2" height="2" fill={c} />
      <rect x="11" y="8" width="2" height="2" fill={c} />
      {/* Smile */}
      <rect x="7" y="12" width="2" height="1" fill={c} />
      <rect x="9" y="13" width="2" height="1" fill={c} />
      <rect x="11" y="12" width="2" height="1" fill={c} />
      {/* Clock hands */}
      <rect x="9.5" y="6" width="1" height="3" fill={c} />
      <rect x="9.5" y="9" width="3" height="1" fill={c} />
      {/* Feet */}
      <rect x="5" y="17" width="2" height="1" fill={c} />
      <rect x="13" y="17" width="2" height="1" fill={c} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   TASKS — Cute pixel clipboard/notepad with face
   ════════════════════════════════════════════════════ */
export function PixelTasks({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Clipboard body */}
      <rect x="3" y="4" width="14" height="15" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Clip at top */}
      <rect x="7" y="2" width="6" height="3" fill={c} />
      <rect x="8" y="1" width="4" height="2" fill="none" stroke={c} strokeWidth="1" />
      {/* Eyes */}
      <rect x="7" y="9" width="2" height="2" fill={c} />
      <rect x="11" y="9" width="2" height="2" fill={c} />
      {/* Smile */}
      <rect x="7" y="13" width="2" height="1" fill={c} />
      <rect x="9" y="14" width="2" height="1" fill={c} />
      <rect x="11" y="13" width="2" height="1" fill={c} />
      {/* Lines (like list items) */}
      <rect x="5" y="7" width="10" height="1" fill={c} opacity="0.3" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   WINS — Cute pixel trophy / star with face
   ════════════════════════════════════════════════════ */
export function PixelWins({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Trophy cup body */}
      <rect x="5" y="3" width="10" height="9" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Cup handles */}
      <rect x="2" y="4" width="3" height="5" fill="none" stroke={c} strokeWidth="1" />
      <rect x="15" y="4" width="3" height="5" fill="none" stroke={c} strokeWidth="1" />
      {/* Eyes */}
      <rect x="7" y="7" width="2" height="2" fill={c} />
      <rect x="11" y="7" width="2" height="2" fill={c} />
      {/* Smile */}
      <rect x="8" y="10" width="4" height="1" fill={c} />
      {/* Stem */}
      <rect x="9" y="12" width="2" height="3" fill={c} />
      {/* Base */}
      <rect x="6" y="15" width="8" height="2" fill={c} />
      {/* Star above */}
      <rect x="9" y="1" width="2" height="2" fill={c} />
      <rect x="8" y="2" width="4" height="1" fill={c} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   BRAIN DUMP — Cute pixel brain/cloud with face
   ════════════════════════════════════════════════════ */
export function PixelDump({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Cloud/brain body — blocky pixel cloud */}
      <rect x="4" y="6" width="12" height="9" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Cloud bumps on top */}
      <rect x="4" y="4" width="4" height="3" fill="none" stroke={c} strokeWidth="1" />
      <rect x="8" y="3" width="4" height="4" fill="none" stroke={c} strokeWidth="1" />
      <rect x="12" y="4" width="4" height="3" fill="none" stroke={c} strokeWidth="1" />
      {/* Eyes */}
      <rect x="7" y="9" width="2" height="2" fill={c} />
      <rect x="11" y="9" width="2" height="2" fill={c} />
      {/* Wavy mouth — pixel style */}
      <rect x="7" y="12" width="2" height="1" fill={c} />
      <rect x="9" y="13" width="2" height="1" fill={c} />
      <rect x="11" y="12" width="2" height="1" fill={c} />
      {/* Brain squiggle lines */}
      <rect x="9" y="6" width="2" height="1" fill={c} opacity="0.4" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   GOALS — Cute pixel flower / target with face
   ════════════════════════════════════════════════════ */
export function PixelGoals({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Flower petals — pixel squares around center */}
      <rect x="8" y="1" width="4" height="4" fill={c} opacity="0.6" />
      <rect x="8" y="15" width="4" height="4" fill={c} opacity="0.6" />
      <rect x="1" y="8" width="4" height="4" fill={c} opacity="0.6" />
      <rect x="15" y="8" width="4" height="4" fill={c} opacity="0.6" />
      {/* Diagonal petals */}
      <rect x="3" y="3" width="3" height="3" fill={c} opacity="0.4" />
      <rect x="14" y="3" width="3" height="3" fill={c} opacity="0.4" />
      <rect x="3" y="14" width="3" height="3" fill={c} opacity="0.4" />
      <rect x="14" y="14" width="3" height="3" fill={c} opacity="0.4" />
      {/* Center circle */}
      <rect x="6" y="6" width="8" height="8" fill={c} opacity="0.15" stroke={c} strokeWidth="1" />
      {/* Eyes */}
      <rect x="8" y="9" width="1.5" height="1.5" fill={c} />
      <rect x="10.5" y="9" width="1.5" height="1.5" fill={c} />
      {/* Smile */}
      <rect x="8" y="11.5" width="4" height="1" fill={c} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   AGENTS — Cute pixel robot with face
   ════════════════════════════════════════════════════ */
export function PixelAgents({ size = 20, active, color }: PixelIconProps) {
  const c = color || (active ? "#C8603A" : PX);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" shapeRendering="crispEdges">
      {/* Robot head */}
      <rect x="3" y="4" width="14" height="11" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Antenna */}
      <rect x="9" y="1" width="2" height="3" fill={c} />
      <rect x="8" y="1" width="4" height="1.5" fill={c} />
      {/* Robot eyes — square */}
      <rect x="6" y="7" width="3" height="3" fill={c} opacity="0.8" />
      <rect x="11" y="7" width="3" height="3" fill={c} opacity="0.8" />
      {/* Eye shine */}
      <rect x="7" y="8" width="1" height="1" fill="white" opacity="0.6" />
      <rect x="12" y="8" width="1" height="1" fill="white" opacity="0.6" />
      {/* Mouth — pixel grid */}
      <rect x="6" y="12" width="2" height="1" fill={c} />
      <rect x="9" y="12" width="2" height="1" fill={c} />
      <rect x="12" y="12" width="2" height="1" fill={c} />
      {/* Neck + body */}
      <rect x="8" y="15" width="4" height="2" fill={c} />
      <rect x="5" y="17" width="10" height="2" fill={c} opacity="0.5" />
      {/* Ear bolts */}
      <rect x="1" y="7" width="2" height="2" fill={c} />
      <rect x="17" y="7" width="2" height="2" fill={c} />
    </svg>
  );
}
