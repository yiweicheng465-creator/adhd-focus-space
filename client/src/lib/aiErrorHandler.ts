import { toast } from "sonner";

/**
 * Detects a NO_API_KEY error from tRPC and dispatches the openFxPanel event.
 * Returns true if the error was a NO_API_KEY error, false otherwise.
 *
 * The error can come from two sources:
 * 1. getUserApiKey() throws TRPCError({ code: "PRECONDITION_FAILED", message: "NO_API_KEY" })
 * 2. invokeLLM() throws new Error("NO_API_KEY") which tRPC wraps as INTERNAL_SERVER_ERROR
 *
 * In both cases, err.message === "NO_API_KEY" on the client.
 * We also check err.data?.code as a fallback.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNoApiKeyError(err: any): boolean {
  if (err?.message === "NO_API_KEY") return true;
  if (err?.data?.code === "PRECONDITION_FAILED" && err?.message?.includes("NO_API_KEY")) return true;
  return false;
}

/**
 * Handles an AI error: if it's a NO_API_KEY error, opens the FX panel and shows a toast.
 * Otherwise shows a generic error toast.
 *
 * @param err - The tRPC error object
 * @param fallbackMessage - Optional custom message for non-NO_API_KEY errors
 * @returns true if it was a NO_API_KEY error
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleAiError(
  err: any,
  fallbackMessage = "AI feature unavailable. Try again."
): boolean {
  if (isNoApiKeyError(err)) {
    window.dispatchEvent(new CustomEvent("openFxPanel"));
    toast("No API key set — opening FX settings for you.", { duration: 4000 });
    return true;
  }
  toast.error(fallbackMessage, { duration: 3000 });
  return false;
}
