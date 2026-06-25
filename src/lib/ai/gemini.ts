import "server-only";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

interface GenerateJSONOptions {
  systemInstruction: string;
  prompt: string;
  responseSchema: Record<string, unknown>;
  model?: string;
  temperature?: number;
}

/**
 * Calls Gemini's generateContent endpoint in structured-output ("JSON
 * mode") so we get back exactly the shape we ask for, without needing
 * to hand-parse fenced code blocks out of free text.
 * Docs: https://ai.google.dev/gemini-api/docs/structured-output
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parses Gemini's "Please retry in 651.39504ms." / "...in 57.948274064s." hint out of an error body. */
function parseRetryDelayMs(errorText: string): number | null {
  const msMatch = errorText.match(/retry in ([\d.]+)ms/i);
  if (msMatch?.[1]) return Math.ceil(parseFloat(msMatch[1]));
  const sMatch = errorText.match(/retry in ([\d.]+)s/i);
  if (sMatch?.[1]) return Math.ceil(parseFloat(sMatch[1]) * 1000);
  return null;
}

class GeminiQuotaExhaustedError extends Error { }

export async function generateJSON<T>({
  systemInstruction,
  prompt,
  responseSchema,
  model = DEFAULT_MODEL,
  temperature = 0.2,
}: GenerateJSONOptions): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const maxAttempts = 3;

  let lastError: Error = new Error("Gemini call failed.");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    }).catch((err) => {
      throw err instanceof Error ? err : new Error(String(err));
    });

    if (res.ok) {
      const data = await res.json();
      const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Gemini returned no content. Response: " + JSON.stringify(data).slice(0, 500));
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error("Gemini response was not valid JSON: " + text.slice(0, 500));
      }
    }

    const text = await res.text().catch(() => "");
    lastError = new Error(`Gemini API error (${res.status}): ${text.slice(0, 500)}`);

    const isRetryable = res.status === 429 || res.status === 503;
    if (!isRetryable || attempt === maxAttempts) {
      // 429 with a long cooldown means this minute's quota is gone —
      // no point retrying inside this call; let the caller (the batch
      // loop in classify.ts) decide to stop early instead of grinding
      // through every remaining email with the same failure.
      const retryDelay = parseRetryDelayMs(text);
      if (res.status === 429 && (retryDelay === null || retryDelay > 10_000)) {
        throw new GeminiQuotaExhaustedError(lastError.message);
      }
      throw lastError;
    }

    const retryDelay = parseRetryDelayMs(text);
    const delay = retryDelay !== null ? Math.min(retryDelay, 10_000) : attempt * 1500;
    await sleep(delay);
  }

  throw lastError;
}

export { GeminiQuotaExhaustedError };
