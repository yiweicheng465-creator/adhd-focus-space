/* ============================================================
   ApiKeyDialog — centered modal that appears when an AI feature
   is triggered without an API key set.
   Supports both OpenAI and Manus API keys.
   ============================================================ */

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X, Key, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const DARK   = "oklch(0.28 0.040 320)";
const ACCENT = "oklch(0.58 0.18 340)";
const BORDER = "oklch(0.78 0.060 340)";
const BG     = "oklch(0.970 0.022 355)";
const MUTED  = "oklch(0.55 0.06 340)";
const GREEN  = "oklch(0.48 0.16 168)";
const RED    = "oklch(0.52 0.20 25)";
const TAB_ACTIVE_BG = ACCENT;
const TAB_INACTIVE_BG = "oklch(0.90 0.030 340)";

type KeyType = "openai" | "manus";

const KEY_INFO: Record<KeyType, {
  label: string;
  placeholder: string;
  link: string;
  linkLabel: string;
  paymentNote: string;
  howToGet: string;
}> = {
  openai: {
    label: "OpenAI API Key",
    placeholder: "sk-...",
    link: "https://platform.openai.com/api-keys",
    linkLabel: "platform.openai.com/api-keys",
    paymentNote: "⚠ Requires a paid OpenAI account with credits added. A ChatGPT Plus subscription does NOT include API access — you need a separate billing account at platform.openai.com.",
    howToGet: "Sign up at platform.openai.com → Billing → Add payment → API Keys",
  },
  manus: {
    label: "Manus API Key",
    placeholder: "sk-An...",
    link: "https://manus.im",
    linkLabel: "manus.im → Settings → Integrations",
    paymentNote: "Get your key: manus.im → click your profile icon → Settings → Integrations → API keys → Create new.",
    howToGet: "manus.im → Profile icon → Settings → Integrations → API keys → Create new",
  },
};

export function ApiKeyDialog() {
  const [open, setOpen] = useState(false);
  const [keyType, setKeyType] = useState<KeyType>("manus");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keySaved, setKeySaved] = useState(false);

  const utils = trpc.useUtils();

  const updateApiKey = trpc.profile.updateApiKey.useMutation({
    onSuccess: () => {
      setKeySaved(true);
      utils.profile.getApiKey.invalidate();
      toast.success(`${keyType === "openai" ? "OpenAI" : "Manus"} key saved! AI features are now unlocked.`, { duration: 3500 });
      setTimeout(() => {
        setOpen(false);
        setKeySaved(false);
        setApiKeyInput("");
      }, 1500);
    },
    onError: () => {
      toast.error("Failed to save API key. Please try again.");
    },
  });

  const validateApiKey = trpc.profile.validateApiKey.useMutation({
    onSuccess: () => {
      updateApiKey.mutate({ apiKey: apiKeyInput.trim(), keyType });
    },
    onError: (err) => {
      if (err.message === "INVALID_API_KEY") {
        setKeyError("Invalid API key — please check it and try again.");
        toast.error("Invalid API key. Please check it and try again.", { duration: 4000 });
      } else {
        // Network/timeout — save anyway
        setKeyError(null);
        updateApiKey.mutate({ apiKey: apiKeyInput.trim(), keyType });
        toast("Couldn't verify key (network issue) — saved anyway.", { duration: 3000 });
      }
    },
  });

  const isSaving = validateApiKey.isPending || updateApiKey.isPending;

  const handleSave = useCallback(() => {
    const key = apiKeyInput.trim();
    if (!key || isSaving) return;
    setKeyError(null);
    validateApiKey.mutate({ apiKey: key, keyType });
  }, [apiKeyInput, isSaving, keyType, validateApiKey]);

  // Listen for openApiKeyDialog event — auto-opens this centered modal
  useEffect(() => {
    function onOpen() {
      setOpen(true);
      setKeyType("manus");
      setApiKeyInput("");
      setKeyError(null);
      setKeySaved(false);
    }
    window.addEventListener("openApiKeyDialog", onOpen);
    return () => window.removeEventListener("openApiKeyDialog", onOpen);
  }, []);

  // Reset input when switching key type
  const handleKeyTypeChange = (type: KeyType) => {
    setKeyType(type);
    setApiKeyInput("");
    setKeyError(null);
  };

  if (!open) return null;

  const info = KEY_INFO[keyType];

  return (
    /* Backdrop */
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "oklch(0.28 0.04 320 / 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(3px)",
        animation: "ft-fadeIn 0.2s ease forwards",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      {/* Retro window */}
      <div style={{
        background: BG,
        border: `3px solid ${DARK}`,
        boxShadow: `6px 6px 0 ${DARK}`,
        width: 420,
        maxWidth: "92vw",
        fontFamily: "'JetBrains Mono', monospace",
        animation: "ft-fadeIn 0.25s ease forwards",
      }}>
        {/* Title bar */}
        <div style={{
          background: ACCENT,
          borderBottom: `2px solid ${DARK}`,
          padding: "6px 10px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Key size={11} color="#FAF6F1" />
            <span style={{ fontSize: 8, letterSpacing: "0.14em", color: "#FAF6F1", fontWeight: 700, textTransform: "uppercase" }}>
              api-key.exe
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: "#FAF6F1", display: "flex" }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 20px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Heading */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: 0, letterSpacing: "0.02em" }}>
              AI features need an API key
            </p>
            <p style={{ fontSize: 9, color: MUTED, margin: "5px 0 0", letterSpacing: "0.04em", lineHeight: 1.6 }}>
              Choose your provider and enter your key to unlock Brain Dump AI, Focus Reflections, Daily Summaries, and all other AI features.
            </p>
          </div>

          {/* Key type tabs */}
          <div style={{ display: "flex", gap: 0, border: `2px solid ${DARK}` }}>
            {(["openai", "manus"] as KeyType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleKeyTypeChange(type)}
                style={{
                  flex: 1,
                  background: keyType === type ? TAB_ACTIVE_BG : TAB_INACTIVE_BG,
                  border: "none",
                  borderRight: type === "openai" ? `2px solid ${DARK}` : "none",
                  color: keyType === type ? "#FAF6F1" : MUTED,
                  padding: "7px 0",
                  fontSize: 8,
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: keyType === type ? 700 : 400,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {type === "openai" ? "OpenAI" : "Manus"}
              </button>
            ))}
          </div>

          {/* Payment warning */}
          <div style={{
            background: "oklch(0.96 0.030 60)",
            border: `1.5px solid oklch(0.75 0.12 60)`,
            padding: "9px 11px",
            fontSize: 8,
            color: "oklch(0.38 0.10 60)",
            letterSpacing: "0.04em",
            lineHeight: 1.65,
          }}>
            {info.paymentNote}
          </div>

          {/* How to get key */}
          <div style={{ fontSize: 8, color: MUTED, letterSpacing: "0.04em", lineHeight: 1.6 }}>
            <span style={{ color: DARK, fontWeight: 700 }}>How to get it: </span>
            {info.howToGet}
          </div>

          {/* API key input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 7, letterSpacing: "0.16em", color: BORDER, textTransform: "uppercase" }}>
              {info.label}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => { setApiKeyInput(e.target.value); setKeyError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setOpen(false); }}
                placeholder={info.placeholder}
                autoFocus
                maxLength={512}
                style={{
                  border: `2px solid ${keyError ? RED : apiKeyInput.trim() ? ACCENT : BORDER}`,
                  background: "oklch(0.960 0.018 350)",
                  padding: "9px 44px 9px 10px",
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
                  fontSize: 9, color: MUTED, padding: 2,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {showKey ? "hide" : "show"}
              </button>
            </div>
            {keyError && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: RED }}>
                <AlertCircle size={10} />
                <span style={{ fontSize: 8, letterSpacing: "0.04em" }}>{keyError}</span>
              </div>
            )}
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
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 2 }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: `1.5px solid ${BORDER}`,
                color: MUTED,
                padding: "7px 14px",
                fontSize: 8,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.10em",
              }}
            >
              cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKeyInput.trim() || isSaving || keySaved}
              style={{
                background: keySaved ? GREEN : keyError ? RED : apiKeyInput.trim() ? ACCENT : BORDER,
                border: "none",
                color: "#FAF6F1",
                padding: "7px 18px",
                fontSize: 8,
                cursor: apiKeyInput.trim() && !isSaving && !keySaved ? "pointer" : "not-allowed",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.12em",
                boxShadow: apiKeyInput.trim() ? `2px 2px 0 ${DARK}` : "none",
                transition: "background 0.15s",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {keySaved ? (
                <><CheckCircle2 size={10} /> saved ✦</>
              ) : isSaving ? (
                <><Loader2 size={10} className="animate-spin" /> {validateApiKey.isPending ? "verifying..." : "saving..."}</>
              ) : (
                "save key ✦"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
