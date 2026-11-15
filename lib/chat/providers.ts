// Gemini-first, Groq-fallback chat generation. Server-only.
// Keys are read from env and only ever sent in request headers — never in URLs, logs or responses.
import type { ChatMessage } from "./validate";
import { buildSystemPrompt } from "./system-prompt";

export type ProviderName = "Gemini" | "Groq";

export interface ChatDeps {
  fetch: typeof fetch;
  now: () => number;
  env: Record<string, string | undefined>;
  log: Pick<Console, "warn" | "error">;
}

export type ReplyResult =
  | { ok: true; reply: string; provider: ProviderName }
  | { ok: false; reason: "not_configured" | "all_failed" };

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
// llama-3.3-70b-versatile is not offered on Groq anymore (verified 15 Nov 2026); gpt-oss-20b is.
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_REPLY_CHARS = 4000;
const GEMINI_429_COOLDOWN_MS = 30_000;

/** Raised for any provider failure; carries only a status and a short reason (safe to log). */
class ProviderError extends Error {
  constructor(
    readonly status: number | null,
    readonly reason: string,
    readonly retryAfterMs?: number
  ) {
    super(reason);
  }
}

// --- module state (per server instance) ---
let geminiCooldownUntil = 0;
const warnedMissingKey = new Set<ProviderName>();

/** Test helper: reset cooldown / one-time warnings between test cases. */
export function __resetChatProviderState() {
  geminiCooldownUntil = 0;
  warnedMissingKey.clear();
}

export const defaultChatDeps: ChatDeps = {
  fetch: (...args) => fetch(...args),
  now: () => Date.now(),
  env: process.env,
  log: console,
};

function timeoutMs(env: ChatDeps["env"]): number {
  const n = Number(env.CHAT_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 1000 && n <= 60_000 ? n : DEFAULT_TIMEOUT_MS;
}

function parseRetryAfterMs(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds, 600) * 1000;
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, Math.min(date - Date.now(), 600_000));
}

async function postJson(deps: ChatDeps, url: string, headers: Record<string, string>, body: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs(deps.env));
  try {
    const res = await deps.fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      // Body is intentionally not read into logs: it may echo the prompt
      throw new ProviderError(res.status, `http_${res.status}`, parseRetryAfterMs(res.headers.get("retry-after")));
    }
    return await res.json().catch(() => {
      throw new ProviderError(res.status, "invalid_json");
    });
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    const aborted = (err as { name?: string })?.name === "AbortError";
    throw new ProviderError(null, aborted ? "timeout" : "network_error");
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(messages: ChatMessage[], system: string, deps: ChatDeps, key: string): Promise<string> {
  const model = deps.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const data = await postJson(
    deps,
    url,
    { "x-goog-api-key": key },
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
    }
  );

  if (data?.promptFeedback?.blockReason) throw new ProviderError(200, "blocked_prompt");
  const candidate = data?.candidates?.[0];
  const finish: string | undefined = candidate?.finishReason;
  if (finish && !["STOP", "MAX_TOKENS"].includes(finish)) throw new ProviderError(200, `finish_${finish.toLowerCase()}`);
  const text = (candidate?.content?.parts ?? [])
    .map((p: { text?: unknown; thought?: unknown }) => (typeof p?.text === "string" && !p.thought ? p.text : ""))
    .join("")
    .trim();
  if (!text) throw new ProviderError(200, "empty_output");
  return text;
}

async function callGroq(messages: ChatMessage[], system: string, deps: ChatDeps, key: string): Promise<string> {
  const model = deps.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
  // gpt-oss models are reasoning models: keep reasoning short and out of the reply.
  // Other Groq models reject these fields, so they are only sent for gpt-oss.
  const reasoning = model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low", include_reasoning: false } : {};
  const data = await postJson(
    deps,
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${key}` },
    {
      model,
      messages: [{ role: "system", content: system }, ...messages],
      temperature: 0.4,
      max_tokens: 700,
      ...reasoning,
    }
  );
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new ProviderError(200, "empty_output");
  return text.trim();
}

/** Normalises a model reply for display: trim, cap length, ASCII arrows -> Unicode. */
export function postProcessReply(text: string): string {
  let out = text.trim().replace(/<=>|<->/g, "⇌").replace(/->/g, "→");
  if (out.length > MAX_REPLY_CHARS) out = `${out.slice(0, MAX_REPLY_CHARS).trimEnd()}…`;
  return out;
}

export async function generateReply(
  messages: ChatMessage[],
  page: string | undefined,
  deps: ChatDeps = defaultChatDeps
): Promise<ReplyResult> {
  const system = buildSystemPrompt(page);
  const geminiKey = deps.env.GEMINI_API_KEY?.trim();
  const groqKey = deps.env.GROQ_API_KEY?.trim();

  if (!geminiKey && !groqKey) {
    deps.log.error("[chat] chat is not configured: set GEMINI_API_KEY and/or GROQ_API_KEY");
    return { ok: false, reason: "not_configured" };
  }

  const providers: Array<{ name: ProviderName; key?: string; call: typeof callGemini }> = [
    { name: "Gemini", key: geminiKey, call: callGemini },
    { name: "Groq", key: groqKey, call: callGroq },
  ];

  for (const { name, key, call } of providers) {
    if (!key) {
      if (!warnedMissingKey.has(name)) {
        warnedMissingKey.add(name);
        deps.log.warn(`[chat] ${name.toLowerCase()} skipped: API key not configured`);
      }
      continue;
    }
    if (name === "Gemini" && deps.now() < geminiCooldownUntil) continue; // recent 429: don't wait on it again

    try {
      const reply = await call(messages, system, deps, key);
      return { ok: true, reply: postProcessReply(reply), provider: name };
    } catch (err) {
      const e = err instanceof ProviderError ? err : new ProviderError(null, "unexpected_error");
      // Status + short reason only (no body, keys or message text). Kept in the string itself because
      // some log sinks (e.g. Next's dev log file) drop object arguments.
      deps.log.warn(`[chat] ${name.toLowerCase()} failed (status=${e.status ?? "none"}, reason=${e.reason})`);
      if (name === "Gemini" && e.status === 429) {
        geminiCooldownUntil = deps.now() + (e.retryAfterMs ?? GEMINI_429_COOLDOWN_MS);
      }
    }
  }

  return { ok: false, reason: "all_failed" };
}
