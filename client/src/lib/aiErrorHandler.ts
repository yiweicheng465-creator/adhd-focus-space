import { toast } from "sonner";

/**
 * Detects a NO_API_KEY error from tRPC and dispatches the openFxPanel event.
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
 * Both NO_API_KEY and quota errors open the Settings panel on the API Key tab.
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
    window.dispatchEvent(new CustomEvent("openFxPanel"));
    toast("No API key set — opening Settings for you.", { duration: 4000 });
    return true;
  }
  if (isQuotaError(err)) {
    window.dispatchEvent(new CustomEvent("openFxPanel"));
    toast.error("API quota exceeded — opening Settings so you can switch to a Manus key.", { duration: 6000 });
    return false;
  }
  toast.error(fallbackMessage, { duration: 3000 });
  return false;
}
