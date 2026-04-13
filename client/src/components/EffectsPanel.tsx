/* ============================================================
   ADHD FOCUS SPACE — Settings Panel v2.0
   Renamed from "effects.exe" → "settings.exe"
   Two tabs: EFFECTS (film grain + work mode) | API KEY
   openFxPanel event auto-opens on the API KEY tab
   ============================================================ */

import { useState, useEffect, useRef, useCallback } from "react";
import { useFilmGrain } from "@/components/FilmGrain";
import { useWorkMode } from "@/components/WorkModeToggle";
import { useHue, HUE_PRESETS } from "@/components/HueShift";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Tab = "effects" | "apikey";

/* ─── Horizontal range slider ─────────────────────────────── */
function HSlider({
  value,
  onChange,
  accentColor,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  accentColor: string;
  disabled?: boolean;
}) {
  return (
    <div style={{ position: "relative", width: "100%", height: 16, display: "flex", alignItems: "center" }}>
      <div style={{
        position: "absolute", left: 0, right: 0, height: 4,
        background: disabled ? "var(--c-light-divider)" : "var(--c-light-divider)",
        borderRadius: 2,
        border: `1px solid ${disabled ? "var(--c-light)" : "var(--c-mid-border)"}`,
        overflow: "hidden",
      }}>
        <div style={{
          width: `${value}%`, height: "100%",
          background: disabled ? "var(--c-mid)" : accentColor,
          borderRadius: 2,
          transition: "width 0.05s linear, background 0.2s",
        }} />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: "absolute", left: 0, right: 0, width: "100%",
          opacity: 0, cursor: disabled ? "not-allowed" : "ew-resize",
          height: 16, margin: 0, padding: 0,
        }}
      />
      <div style={{
        position: "absolute",
        left: `calc(${value}% - 6px)`,
        width: 12, height: 12,
        background: disabled ? "var(--c-light)" : "white",
        border: `2px solid ${disabled ? "var(--c-mid)" : accentColor}`,
        borderRadius: "50%",
        boxShadow: disabled ? "none" : `0 1px 3px ${accentColor}55`,
        transition: "left 0.05s linear, border-color 0.2s, background 0.2s",
        pointerEvents: "none",
      }} />
    </div>
  );
}

/* ─── 3D glossy traffic-light dots ─────────────────────────── */
function TitleDots() {
  const dots = [
    { base: "var(--c-light)",  hi: "var(--c-light)",  sh: "var(--c-deep)" },
    { base: "var(--c-light)",  hi: "var(--c-pale)",  sh: "var(--c-accent)" },
    { base: "var(--c-light)", hi: "var(--c-pale)", sh: "var(--c-accent)" },
  ];
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {dots.map((d, i) => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${d.hi} 0%, ${d.base} 55%, ${d.sh} 100%)`,
          boxShadow: `0 1px 2px ${d.sh}88, inset 0 1px 1px ${d.hi}99`,
          flexShrink: 0,
        }} />
      ))}
    </div>
  );
}

/* ─── Main SettingsPanel ─────────────────────────────────────── */
export function EffectsPanel() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("effects");
  const panelRef = useRef<HTMLDivElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);
  const { intensity, setIntensity, speed, setSpeed } = useFilmGrain();
  const { enabled: workMode, toggle: toggleWorkMode } = useWorkMode();
  const { hue, setHue, reset: resetHue } = useHue();

  // API key state (OpenAI only — Manus built-in is the default, OpenAI is optional fallback)
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [showSavedTick, setShowSavedTick] = useState(false);
  const [apiKeyValidating, setApiKeyValidating] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [dbSynced, setDbSynced] = useState(false);
  // AI signal: green = working (built-in or user key), red = credits exhausted + no key
  // Persisted in localStorage so it survives navigation
  const [aiAvailable, setAiAvailable] = useState<boolean>(() => {
    return localStorage.getItem("adhd-ai-available") !== "false";
  });
  const utils = trpc.useUtils();

  // Fetch existing key info from DB on mount to sync keyType + show masked key
  const { data: savedKeyData } = trpc.profile.getApiKey.useQuery(undefined, {
    staleTime: 30_000,
  });
  // Usage stats
  const { data: usageStats } = trpc.profile.getUsageStats.useQuery(undefined, {
    staleTime: 60_000,
    enabled: open && activeTab === "apikey",
  });

  // Sync from DB once on first load (just mark as synced — no keyType to set)
  useEffect(() => {
    if (savedKeyData && !dbSynced) {
      setDbSynced(true);
      // If user has their own OpenAI key, AI is definitely available — restore green
      if (savedKeyData.hasKey) {
        setAiAvailable(true);
        localStorage.setItem("adhd-ai-available", "true");
      }
    }
  }, [savedKeyData, dbSynced]);

  // Listen for aiCreditsExhausted event — flip dot red
  useEffect(() => {
    function onCreditsExhausted() {
      // Only go red if user has no OpenAI key saved as fallback
      if (!savedKeyData?.hasKey) {
        setAiAvailable(false);
        localStorage.setItem("adhd-ai-available", "false");
      }
    }
    window.addEventListener("aiCreditsExhausted", onCreditsExhausted);
    return () => window.removeEventListener("aiCreditsExhausted", onCreditsExhausted);
  }, [savedKeyData?.hasKey]);

  // Listen for aiKeyRestored event — flip dot back to green (key saved via ApiKeyDialog)
  useEffect(() => {
    function onKeyRestored() {
      setAiAvailable(true);
      localStorage.setItem("adhd-ai-available", "true");
    }
    window.addEventListener("aiKeyRestored", onKeyRestored);
    return () => window.removeEventListener("aiKeyRestored", onKeyRestored);
  }, []);

  const updateApiKey = trpc.profile.updateApiKey.useMutation({
    onSuccess: () => {
      setApiKeySaved(true);
      setApiKeyError(null);
      setApiKeyInput("");
      setApiKeyValidating(false);
      setShowSavedTick(true);
      setTimeout(() => { setApiKeySaved(false); setShowSavedTick(false); }, 1500);
      utils.profile.getApiKey.invalidate();
      // User saved their own OpenAI key — restore green signal
      setAiAvailable(true);
      localStorage.setItem("adhd-ai-available", "true");
    },
    onError: () => { setApiKeyValidating(false); toast.error("Failed to save API key."); },
  });

  const removeApiKey = trpc.profile.updateApiKey.useMutation({
    onSuccess: () => {
      utils.profile.getApiKey.invalidate();
      // Back to built-in AI — keep green (assume built-in still works)
    },
    onError: () => toast.error("Failed to remove API key."),
  });

  const handleRemoveKey = useCallback(() => {
    removeApiKey.mutate({ apiKey: "", keyType: "openai" });
  }, [removeApiKey]);

  const validateApiKey = trpc.profile.validateApiKey.useMutation({
    onSuccess: () => {
      updateApiKey.mutate({ apiKey: apiKeyInput.trim(), keyType: "openai" });
    },
    onError: (err) => {
      setApiKeyValidating(false);
      if (err.message === "INVALID_API_KEY") {
        setApiKeyError("Invalid API key — please check and try again.");
        toast.error("Invalid API key. Please check it and try again.", { duration: 4000 });
      } else {
        setApiKeyError(null);
          updateApiKey.mutate({ apiKey: apiKeyInput.trim(), keyType: "openai" });
        toast("Couldn't verify key (network issue) — saved anyway.", { duration: 3000 });
      }
    },
  });

  const handleSaveApiKey = useCallback(() => {
    const key = apiKeyInput.trim();
    if (!key) return;
    setApiKeyError(null);
    setApiKeyValidating(true);
    validateApiKey.mutate({ apiKey: key, keyType: "openai" });
  }, [apiKeyInput, validateApiKey, updateApiKey]);

  const isSaving = apiKeyValidating || validateApiKey.isPending || updateApiKey.isPending;

  const grainOn = intensity > 0;
  const iconColor = (open || grainOn || workMode)
    ? "var(--c-accent-text)"
    : "var(--c-accent-soft)";

  // Listen for global openFxPanel event — auto-open on API KEY tab
  useEffect(() => {
    function onOpenFx() {
      setOpen(true);
      setActiveTab("apikey");
      setTimeout(() => apiKeyInputRef.current?.focus(), 150);
    }
    window.addEventListener("openFxPanel", onOpenFx);
    return () => window.removeEventListener("openFxPanel", onOpenFx);
  }, []);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={panelRef} style={{ position: "relative", width: "100%" }}>
      {/* ── Sidebar button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Settings"
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px 0 5px",
          gap: 2,
          background: open ? "var(--c-accent-bg-sm)" : "none",
          border: "none",
          cursor: "pointer",
          transition: "background 0.15s",
          position: "relative",
        }}
      >
        {/* AI signal dot — green = AI working, red = credits exhausted + no fallback key */}
        <div
          title={aiAvailable
            ? (savedKeyData?.hasKey ? "AI ready — using your OpenAI key" : "AI ready — using built-in credits")
            : "AI unavailable — add OpenAI key in SET"}
          style={{
            position: "absolute",
            top: 5,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: aiAvailable ? "var(--c-accent)" : "var(--c-accent)",
            boxShadow: aiAvailable
              ? "0 0 4px var(--c-accent-bd-md)"
              : "0 0 4px var(--c-accent-bd-md)",
            flexShrink: 0,
            cursor: "help",
          }}
        />
        {/* Gear icon */}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span style={{
          fontSize: "0.40rem",
          fontFamily: "'Space Mono', monospace",
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: iconColor,
          lineHeight: 1,
        }}>
          SET
        </span>
      </button>

      {/* ── Popup panel ── */}
      {open && (
        <div style={{
          position: "fixed",
          left: 56,
          bottom: 80,
          width: 240,
          zIndex: 10000,
          fontFamily: "'Space Mono', monospace",
          filter: "drop-shadow(3px 3px 0 var(--c-accent-bd-lg))",
        }}>
          {/* Title bar */}
          <div style={{
            background: "#F9D6E8",
            borderRadius: "6px 6px 0 0",
            border: "1.5px solid var(--c-light-border)",
            borderBottom: "1px solid var(--c-light-border)",
            padding: "5px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <TitleDots />
              <span style={{ fontSize: "0.60rem", color: "var(--c-deep-text)", letterSpacing: "0.10em", textTransform: "lowercase" }}>
                settings.exe
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-accent-muted)", fontSize: "0.75rem", lineHeight: 1, padding: "0 2px" }}
            >×</button>
          </div>

          {/* Tab bar */}
          <div style={{
            display: "flex",
            background: "var(--c-pale-bg)",
            border: "1.5px solid var(--c-light-border)",
            borderTop: "none",
            borderBottom: "none",
          }}>
            {(["effects", "apikey"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  fontSize: "0.44rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: "'Space Mono', monospace",
                  border: "none",
                  borderBottom: activeTab === tab
                    ? "2px solid var(--c-accent)"
                    : "2px solid transparent",
                  borderRight: tab === "effects" ? "1px solid var(--c-light-divider)" : "none",
                  background: activeTab === tab ? "var(--c-pale-bg)" : "transparent",
                  color: activeTab === tab ? "var(--c-deep)" : "var(--c-accent-faint)",
                  cursor: "pointer",
                  fontWeight: activeTab === tab ? 700 : 400,
                  transition: "all 0.12s",
                }}
              >
                {tab === "effects" ? "Effects" : "API Key"}
              </button>
            ))}
          </div>

          {/* Body */}
          <div style={{
            background: "var(--c-pale-bg)",
            border: "1.5px solid var(--c-light-border)",
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            padding: "12px 14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}>

            {/* ── EFFECTS TAB ── */}
            {activeTab === "effects" && (
              <>
                {/* Film Grain section */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.55rem", color: "var(--c-deep)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      ▣ Film Grain
                    </span>
                    <button
                      onClick={() => setIntensity(grainOn ? 0 : 40)}
                      style={{
                        fontSize: "0.44rem",
                        fontFamily: "'Space Mono', monospace",
                        letterSpacing: "0.08em",
                        padding: "2px 6px",
                        borderRadius: 10,
                        border: `1px solid ${grainOn ? "var(--c-accent)" : "var(--c-mid)"}`,
                        background: grainOn ? "var(--c-accent)" : "transparent",
                        color: grainOn ? "white" : "var(--c-accent-soft)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {grainOn ? "ON" : "OFF"}
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.48rem", color: "var(--c-accent-icon)", letterSpacing: "0.06em" }}>INTENSITY</span>
                      <span style={{ fontSize: "0.48rem", color: "var(--c-accent-muted)", letterSpacing: "0.06em" }}>{intensity === 0 ? "OFF" : `${intensity}%`}</span>
                    </div>
                    <HSlider value={intensity} onChange={setIntensity} accentColor="var(--c-accent)" />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.48rem", color: "var(--c-accent-icon)", letterSpacing: "0.06em" }}>SPEED</span>
                      <span style={{ fontSize: "0.48rem", color: "var(--c-accent-muted)", letterSpacing: "0.06em" }}>{speed === 0 ? "FROZEN" : `${speed}%`}</span>
                    </div>
                    <HSlider value={speed} onChange={setSpeed} accentColor="var(--c-accent-muted)" disabled={!grainOn} />
                  </div>
                </div>

                 {/* Divider */}
                <div style={{ height: 1, background: "var(--c-light-divider)", margin: "0 -2px" }} />

                {/* ── Hue Shift section ── */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.55rem", color: "var(--c-deep)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      ◈ Theme Hue
                    </span>
                    <button
                      onClick={resetHue}
                      style={{
                        fontSize: "0.40rem",
                        fontFamily: "'Space Mono', monospace",
                        letterSpacing: "0.08em",
                        padding: "2px 6px",
                        borderRadius: 10,
                        border: "1px solid var(--c-mid)",
                        background: "transparent",
                        color: "var(--c-accent-soft)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      RESET
                    </button>
                  </div>
                  {/* Preset swatches */}
                  <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                    {HUE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        title={p.label}
                        onClick={() => setHue(p.hue)}
                        style={{
                          width: 18, height: 18,
                          borderRadius: "50%",
                          background: p.color,
                          border: Math.abs(hue - p.hue) < 10
                            ? "2.5px solid var(--c-ink-soft)"
                            : "2px solid transparent",
                          cursor: "pointer",
                          flexShrink: 0,
                          transition: "border-color 0.15s, transform 0.15s",
                          transform: Math.abs(hue - p.hue) < 10 ? "scale(1.25)" : "scale(1)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.20)",
                          outline: "none",
                        }}
                      />
                    ))}
                  </div>
                  {/* Hue range slider */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.48rem", color: "var(--c-accent-icon)", letterSpacing: "0.06em" }}>HUE</span>
                      <span style={{
                        fontSize: "0.48rem",
                        color: `hsl(${hue},60%,45%)`,
                        letterSpacing: "0.06em",
                        fontFamily: "'Space Mono', monospace",
                      }}>{hue}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={hue}
                      onChange={(e) => setHue(Number(e.target.value))}
                      style={{
                        width: "100%",
                        height: 6,
                        borderRadius: 3,
                        cursor: "pointer",
                        WebkitAppearance: "none",
                        appearance: "none",
                        background: `linear-gradient(to right,
                          hsl(0,65%,62%), hsl(45,65%,62%), hsl(90,65%,55%),
                          hsl(140,55%,52%), hsl(190,65%,55%), hsl(220,65%,62%),
                          hsl(270,60%,65%), hsl(310,65%,65%), hsl(330,65%,65%), hsl(360,65%,62%))`,
                        outline: "none",
                        border: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "var(--c-light-divider)", margin: "0 -2px" }} />
                {/* Work Mode section */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: "0.55rem", color: "var(--c-deep)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block" }}>
                        ▤ Work Mode
                      </span>
                      <span style={{ fontSize: "0.44rem", color: "var(--c-accent-faint)", letterSpacing: "0.04em", marginTop: 2, display: "block" }}>
                        strips all colour → greyscale
                      </span>
                    </div>
                    <button
                      onClick={toggleWorkMode}
                      style={{
                        width: 36, height: 20,
                        borderRadius: 10,
                        border: `1.5px solid ${workMode ? "var(--c-ink-soft)" : "var(--c-mid)"}`,
                        background: workMode ? "var(--c-ink)" : "var(--c-pale)",
                        cursor: "pointer",
                        position: "relative",
                        transition: "background 0.2s, border-color 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: "absolute",
                        top: 2, left: workMode ? 16 : 2,
                        width: 14, height: 14,
                        borderRadius: "50%",
                        background: workMode ? "white" : "var(--c-mid)",
                        transition: "left 0.2s, background 0.2s",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                      }} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── API KEY TAB ── */}
            {activeTab === "apikey" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: "0.55rem", color: "var(--c-deep)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block" }}>
                  ⬡ OpenAI Key (optional)
                </span>

                {/* AI status notice — changes based on whether user has a key saved */}
                <div style={{
                  background: savedKeyData?.hasKey ? "var(--c-pale)" : "var(--c-pale)",
                  border: `1px solid ${savedKeyData?.hasKey ? "var(--c-mid)" : "var(--c-mid)"}`,
                  padding: "5px 7px",
                  fontSize: "0.40rem",
                  color: savedKeyData?.hasKey ? "var(--c-ink)" : "var(--c-deep)",
                  letterSpacing: "0.03em",
                  lineHeight: 1.6,
                  fontFamily: "'Space Mono', monospace",
                }}>
                  {savedKeyData?.hasKey
                    ? "✓ Using your OpenAI key — AI calls are billed to your OpenAI account."
                    : "✓ AI is already active — powered by built-in credits. Add your own OpenAI key below only if the built-in AI stops working."}
                </div>

                {/* Usage stats */}
                {(usageStats?.total ?? 0) > 0 && (
                  <div style={{
                    display: "flex",
                    gap: 8,
                    padding: "4px 7px",
                    background: "var(--c-pale-bg)",
                    border: "1px solid var(--c-light-divider)",
                    fontSize: "0.38rem",
                    fontFamily: "'Space Mono', monospace",
                    color: "var(--c-accent-faint)",
                    letterSpacing: "0.04em",
                  }}>
                    <span>total: <strong style={{ color: "var(--c-deep-text)" }}>{usageStats?.total ?? 0}</strong></span>
                    <span style={{ opacity: 0.4 }}>|</span>
                    <span>this month: <strong style={{ color: "var(--c-deep-text)" }}>{usageStats?.thisMonth ?? 0}</strong></span>
                    <span style={{ opacity: 0.4 }}>|</span>
                    <span style={{ opacity: 0.7 }}>AI calls</span>
                  </div>
                )}
                {/* OpenAI key input */}
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <input
                    ref={apiKeyInputRef}
                    type={showApiKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => { setApiKeyInput(e.target.value); setApiKeyError(null); }}
                    placeholder="sk-..."
                    style={{
                      flex: 1,
                      fontSize: "0.50rem",
                      fontFamily: "'Space Mono', monospace",
                      padding: "4px 6px",
                      borderRadius: 3,
                      border: `1px solid ${apiKeyError ? "var(--c-deep)" : "var(--c-mid-border)"}`,
                      background: "var(--c-pale-bg)",
                      color: "var(--c-deep-text)",
                      outline: "none",
                      minWidth: 0,
                    }}
                  />
                  <button
                    onClick={() => setShowApiKey(v => !v)}
                    style={{ fontSize: "0.42rem", fontFamily: "'Space Mono', monospace", padding: "3px 5px", borderRadius: 3, border: "1px solid var(--c-mid-border)", background: "transparent", color: "var(--c-accent-icon)", cursor: "pointer", flexShrink: 0 }}
                  >
                    {showApiKey ? "hide" : "show"}
                  </button>
                </div>

                {apiKeyError && (
                  <p style={{ fontSize: "0.42rem", color: "var(--c-deep)", fontFamily: "'Space Mono', monospace", margin: 0, lineHeight: 1.4 }}>
                    ⚠ {apiKeyError}
                  </p>
                )}

                {savedKeyData?.hasKey ? (
                  /* Masked key preview — shown when a key is already saved */
                  <p style={{
                    fontSize: "0.40rem",
                    fontFamily: "'Space Mono', monospace",
                    color: "var(--c-accent-dim)",
                    margin: 0,
                    lineHeight: 1.5,
                    letterSpacing: "0.04em",
                  }}>
                    active key: <span style={{ letterSpacing: "0.06em" }}>{savedKeyData.maskedKey}</span>
                  </p>
                ) : (
                  /* Payment reminder + link — only shown when no key is saved */
                  <>
                    <p style={{
                      fontSize: "0.40rem",
                      fontFamily: "'Space Mono', monospace",
                      color: "var(--c-accent)",
                      margin: 0,
                      lineHeight: 1.5,
                      letterSpacing: "0.02em",
                    }}>
                      ⚠ Your OpenAI account must have a paid plan / credits — free-tier keys won't work.
                    </p>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        fontSize: "0.42rem",
                        fontFamily: "'Space Mono', monospace",
                        color: "var(--c-accent-muted)",
                        textDecoration: "underline",
                        textAlign: "center",
                        letterSpacing: "0.04em",
                      }}
                    >
                      → platform.openai.com/api-keys
                    </a>
                  </>
                )}




                {/* Save row: button + inline ✓ tick */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={handleSaveApiKey}
                    disabled={!apiKeyInput.trim() || isSaving}
                    style={{
                      flex: 1,
                      fontSize: "0.50rem",
                      fontFamily: "'Space Mono', monospace",
                      letterSpacing: "0.08em",
                      padding: "5px 0",
                      borderRadius: 3,
                      border: `1.5px solid ${apiKeyError ? "var(--c-deep)" : "var(--c-accent)"}`,
                      background: apiKeyError ? "var(--c-deep)" : "var(--c-accent)",
                      color: "white",
                      cursor: (apiKeyInput.trim() && !isSaving) ? "pointer" : "not-allowed",
                      opacity: (apiKeyInput.trim() && !isSaving) ? 1 : 0.5,
                      transition: "background 0.2s, border-color 0.2s",
                      textAlign: "center",
                    }}
                  >
                    {isSaving ? "SAVING..." : "SAVE"}
                  </button>
                  {/* Inline ✓ confirmation — fades in for 1.5s after save */}
                  <span
                    style={{
                      fontSize: "0.55rem",
                      fontFamily: "'Space Mono', monospace",
                      color: "var(--c-accent)",
                      opacity: showSavedTick ? 1 : 0,
                      transition: "opacity 0.3s ease",
                      flexShrink: 0,
                      letterSpacing: "0.04em",
                    }}
                  >
                    ✓ saved
                  </span>
                </div>
                {/* Remove key link — only shown when a key is already saved */}
                {savedKeyData?.hasKey && (
                  <button
                    onClick={handleRemoveKey}
                    disabled={removeApiKey.isPending}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: "0.40rem",
                      fontFamily: "'Space Mono', monospace",
                      color: "var(--c-accent)",
                      textDecoration: "underline",
                      cursor: "pointer",
                      letterSpacing: "0.04em",
                      opacity: removeApiKey.isPending ? 0.5 : 0.7,
                    }}
                  >
                    {removeApiKey.isPending ? "removing..." : "× remove key → use built-in AI"}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
