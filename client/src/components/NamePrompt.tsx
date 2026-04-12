/* ============================================================
   NamePrompt — one-time retro-styled name + API key input modal
   Shows on first visit (when no name is saved).
   Supports both OpenAI and Manus API keys.
   ============================================================ */

import { useState, useRef, useEffect } from "react";

type KeyType = "openai" | "manus";

interface NamePromptProps {
  onSave: (name: string, apiKey?: string, keyType?: KeyType) => void;
  onSkip: () => void;
}

const DARK   = "oklch(0.28 0.040 320)";
const ACCENT = "oklch(0.58 0.18 340)";
const BORDER = "oklch(0.78 0.060 340)";
const BG     = "oklch(0.970 0.022 355)";
const PANEL  = "oklch(0.960 0.018 350)";
const MUTED  = "oklch(0.55 0.06 340)";

const KEY_INFO: Record<KeyType, {
  placeholder: string;
  link: string;
  linkLabel: string;
  paymentNote: string;
}> = {
  openai: {
    placeholder: "sk-...",
    link: "https://platform.openai.com/api-keys",
    linkLabel: "platform.openai.com/api-keys",
    paymentNote: "⚠ Requires a paid OpenAI account with credits. ChatGPT Plus does NOT include API access — separate billing needed at platform.openai.com.",
  },
  manus: {
    placeholder: "manus-...",
    link: "https://manus.im/settings/api",
    linkLabel: "manus.im/settings/api",
    paymentNote: "⚠ Requires a paid Manus subscription ($20/month minimum). Free accounts cannot generate API keys.",
  },
};

export function NamePrompt({ onSave, onSkip }: NamePromptProps) {
  const [name, setName]       = useState("");
  const [apiKey, setApiKey]   = useState("");
  const [keyType, setKeyType] = useState<KeyType>("openai");
  const [showKey, setShowKey] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 80);
  }, []);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave(trimmedName, apiKey.trim() || undefined, apiKey.trim() ? keyType : undefined);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onSkip();
  };

  const info = KEY_INFO[keyType];

  return (
    /* Backdrop */
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "oklch(0.28 0.04 320 / 0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(2px)",
    }}>
      {/* Retro window */}
      <div style={{
        background: BG,
        border: `3px solid ${DARK}`,
        boxShadow: `5px 5px 0 ${DARK}`,
        width: 400,
        maxWidth: "92vw",
        fontFamily: "'JetBrains Mono', monospace",
        animation: "ft-fadeIn 0.3s ease forwards",
      }}>
        {/* Title bar */}
        <div style={{
          background: ACCENT,
          borderBottom: `2px solid ${DARK}`,
          padding: "5px 10px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 8, letterSpacing: "0.14em", color: "#FAF6F1", fontWeight: 700, textTransform: "uppercase" }}>
            hello.exe
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {["_", "□", "×"].map((c) => (
              <div key={c} style={{ width: 12, height: 12, background: "#FAF6F1", border: `1px solid ${DARK}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: DARK, cursor: c === "×" ? "pointer" : "default" }}
                onClick={c === "×" ? onSkip : undefined}
              >{c}</div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Emoji + heading */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}>✨</div>
            <p style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: 0, letterSpacing: "0.04em" }}>
              What should I call you?
            </p>
            <p style={{ fontSize: 9, color: BORDER, margin: "6px 0 0", letterSpacing: "0.06em", lineHeight: 1.5 }}>
              I'll use your name to greet you each day.
            </p>
          </div>

          {/* Name input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 7, letterSpacing: "0.16em", color: BORDER, textTransform: "uppercase" }}>
              Your name
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g. Alex"
              maxLength={50}
              style={{
                border: `2px solid ${name.trim() ? ACCENT : BORDER}`,
                background: PANEL,
                padding: "8px 10px",
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                color: DARK,
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
          </div>

          {/* API key section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 7, letterSpacing: "0.16em", color: BORDER, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
              AI API key
              <span style={{ fontSize: 7, color: MUTED, fontWeight: 400, letterSpacing: "0.04em", textTransform: "none" }}>(optional — can add later)</span>
            </label>

            {/* Key type tabs */}
            <div style={{ display: "flex", border: `2px solid ${DARK}`, overflow: "hidden" }}>
              {(["openai", "manus"] as KeyType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => { setKeyType(type); setApiKey(""); }}
                  style={{
                    flex: 1,
                    background: keyType === type ? ACCENT : "oklch(0.93 0.020 340)",
                    border: "none",
                    borderRight: type === "openai" ? `2px solid ${DARK}` : "none",
                    color: keyType === type ? "#FAF6F1" : MUTED,
                    padding: "6px 0",
                    fontSize: 8,
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: keyType === type ? 700 : 400,
                    transition: "background 0.15s",
                  }}
                >
                  {type === "openai" ? "OpenAI" : "Manus"}
                </button>
              ))}
            </div>

            {/* Payment warning */}
            <div style={{
              background: "oklch(0.96 0.030 60)",
              border: "1.5px solid oklch(0.75 0.12 60)",
              padding: "7px 9px",
              fontSize: 8,
              color: "oklch(0.38 0.10 60)",
              letterSpacing: "0.03em",
              lineHeight: 1.65,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {info.paymentNote}
            </div>

            {/* Key input */}
            <div style={{ position: "relative" }}>
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={handleKey}
                placeholder={info.placeholder}
                maxLength={512}
                style={{
                  border: `2px solid ${apiKey.trim() ? ACCENT : BORDER}`,
                  background: PANEL,
                  padding: "8px 36px 8px 10px",
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: DARK,
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", cursor: "pointer",
                  fontSize: 10, color: MUTED, padding: 2,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {showKey ? "hide" : "show"}
              </button>
            </div>
            <a
              href={info.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 8, color: ACCENT, textDecoration: "underline",
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em",
              }}
            >
              → {info.linkLabel}
            </a>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              onClick={onSkip}
              style={{
                background: "transparent",
                border: `1.5px solid ${BORDER}`,
                color: BORDER,
                padding: "6px 14px",
                fontSize: 8,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.10em",
              }}
            >
              skip for now
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              style={{
                background: name.trim() ? ACCENT : BORDER,
                border: "none",
                color: "#FAF6F1",
                padding: "6px 18px",
                fontSize: 8,
                cursor: name.trim() ? "pointer" : "not-allowed",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.12em",
                boxShadow: name.trim() ? `2px 2px 0 ${DARK}` : "none",
                transition: "background 0.15s, box-shadow 0.15s",
              }}
            >
              save ✦
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
