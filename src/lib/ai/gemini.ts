import "server-only";

/**
 * Models are tried in order. If one fails (quota exhausted, not yet
 * available on this key/tier, transient error after retries, etc.) we
 * fall back to the next one instead of failing the whole call — only
 * give up once every model in the chain has failed.
 */
const MODEL_FALLBACK_CHAIN = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
];

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

class GeminiQuotaExhaustedError extends Error {}

/** Runs the call against a single model, retrying on transient 429/503s. */
async function callModel<T>(
  model: string,
  { systemInstruction, prompt, responseSchema, temperature }: Omit<GenerateJSONOptions, "model">,
  apiKey: string
): Promise<T> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const maxAttempts = 3;
  let lastError: Error = new Error(`Gemini call failed for model ${model}.`);

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
        throw new Error(`Gemini (${model}) returned no content. Response: ` + JSON.stringify(data).slice(0, 500));
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error(`Gemini (${model}) response was not valid JSON: ` + text.slice(0, 500));
      }
    }

    const text = await res.text().catch(() => "");
    lastError = new Error(`Gemini API error (${model}, ${res.status}): ${text.slice(0, 500)}`);

    // Model doesn't exist / isn't enabled for this key — no point retrying, bail to the next model.
    if (res.status === 404 || res.status === 400) throw lastError;

    const isRetryable = res.status === 429 || res.status === 503;
    if (!isRetryable) throw lastError;

    const retryDelay = parseRetryDelayMs(text);

    // 429 with no/long cooldown means this model's quota for the window
    // is gone — don't burn retries on it, fall back to the next model.
    if (res.status === 429 && (retryDelay === null || retryDelay > 10_000)) {
      throw lastError;
    }

    if (attempt === maxAttempts) throw lastError;

    const delay = retryDelay !== null ? Math.min(retryDelay, 10_000) : attempt * 1500;
    await sleep(delay);
  }

  throw lastError;
}

export async function generateJSON<T>({
  systemInstruction,
  prompt,
  responseSchema,
  model,
  temperature = 0.2,
}: GenerateJSONOptions): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  // Explicit `model` arg or GEMINI_MODEL env pins a single model (no fallback).
  // Otherwise walk the chain so one model's quota/availability issue doesn't stall everything.
  const chain = model ? [model] : process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : MODEL_FALLBACK_CHAIN;

  let lastError: Error = new Error("Gemini call failed.");

  for (let i = 0; i < chain.length; i++) {
    const currentModel = chain[i];
    if (!currentModel) continue;
    try {
      return await callModel<T>(currentModel, { systemInstruction, prompt, responseSchema, temperature }, apiKey);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const nextModel = chain[i + 1];
      if (nextModel) {
        console.warn(
          `Gemini model "${currentModel}" failed — falling back to "${nextModel}". (${lastError.message.slice(0, 200)})`
        );
      }
    }
  }

  // Every model in the chain failed. If the final failure was a rate-limit
  // issue, surface it as GeminiQuotaExhaustedError so the batch loop in
  // classify.ts stops the batch early instead of grinding through every
  // remaining email with the same failure.
  if (lastError.message.includes(", 429)")) {
    throw new GeminiQuotaExhaustedError(lastError.message);
  }
  throw lastError;
}

export { GeminiQuotaExhaustedError };