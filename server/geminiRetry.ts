import { GoogleGenAI } from "@google/genai";

const RETRYABLE = /\b(429|500|503|UNAVAILABLE|RESOURCE_EXHAUSTED|INTERNAL|overloaded|high demand)\b/i;

/**
 * generateContent with retries for transient Gemini errors (503 "high demand",
 * 429 rate limits, 500s). Non-transient errors are thrown immediately.
 */
export async function generateContentWithRetry(
  client: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["generateContent"]>[0],
  delaysMs: number[] = [2000, 5000, 10000]
) {
  let lastErr: any;
  for (let attempt = 0; attempt <= delaysMs.length; attempt++) {
    try {
      return await client.models.generateContent(params);
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || err);
      if (attempt === delaysMs.length || !RETRYABLE.test(msg)) break;
      console.warn(`[Gemini] transient error (attempt ${attempt + 1}), retrying in ${delaysMs[attempt]}ms: ${msg.slice(0, 160)}`);
      await new Promise((r) => setTimeout(r, delaysMs[attempt]));
    }
  }
  throw lastErr;
}
