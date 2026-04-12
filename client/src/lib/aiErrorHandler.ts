import { toast } from "sonner";

/**
 * Handles an AI error by showing a toast notification.
 * AI features now use the built-in Manus LLM — no API key required.
 *
 * @param err - The tRPC error object
 * @param fallbackMessage - Optional custom message for errors
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleAiError(
  err: any,
  fallbackMessage = "AI feature unavailable. Try again."
): boolean {
  console.error("[AI Error]", err?.message ?? err);
  toast.error(fallbackMessage, { duration: 3000 });
  return false;
}

/**
 * @deprecated No longer needed — AI uses built-in Manus LLM.
 * Kept for compatibility, always returns false.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNoApiKeyError(_err: any): boolean {
  return false;
}
