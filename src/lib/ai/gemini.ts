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
    // Classification calls are short; daily-brief/ask calls carry more
    // context. Either way, fail fast rather than hang a serverless fn.
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API error (${res.status}): ${text.slice(0, 500)}`);
  }

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
