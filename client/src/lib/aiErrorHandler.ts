import { toast } from "sonner";

/**
 * Detects a NO_API_KEY error from tRPC.
 * Returns true if the error was a NO_API_KEY error, false otherwise.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNoApiKeyError(err: any): boolean {
  if (err?.message === "NO_API_KEY") return true;
  if (err?.data?.code === "PRECONDITION_FAILED" && err?.message?.includes("NO_API_KEY")) return true;
  return false;
}

/**
 * Detects a quota exceeded / billing error from the LLM provider.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isQuotaError(err: any): boolean {
  const msg: string = err?.message ?? "";
  return msg.includes("insufficient_quota") || msg.includes("quota") || msg.includes("429") || msg.includes("billing");
}

/**
 * Handles an AI error with specific messages for common failure modes.
 * - NO_API_KEY: opens the centered ApiKeyDialog modal for seamless key entry
 * - Quota errors: opens the SET panel so the user can switch provider
 *
 * @param err - The tRPC error object
 * @param fallbackMessage - Optional custom message for unrecognised errors
 * @returns true if it was a NO_API_KEY error
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleAiError(
  err: any,
  fallbackMessage = "AI feature unavailable. Try again."
): boolean {
  if (isNoApiKeyError(err)) {
    // Open the centered ApiKeyDialog modal for a seamless key-entry experience
    window.dispatchEvent(new CustomEvent("openApiKeyDialog"));
    toast("No API key set — add your Manus key to unlock AI features.", { duration: 4000 });
    return true;
  }
  if (isQuotaError(err)) {
    // Quota errors open the SET panel so the user can switch provider
    window.dispatchEvent(new CustomEvent("openFxPanel"));
    toast.error("API quota exceeded — opening Settings so you can switch to a Manus key.", { duration: 6000 });
    return false;
  }
  toast.error(fallbackMessage, { duration: 3000 });
  return false;
}
