import { NextResponse } from "next/server";
import { generateReply, type ReplyResult } from "./providers";
import { createChatRateLimiter, clientIpFrom, type ChatRateLimitResult } from "./rate-limit";
import { isBodyTooLarge, validateChatBody, type ChatMessage } from "./validate";

export const CHAT_ERRORS = {
  busy: "Chemistry AI is temporarily busy. Please try again in a few seconds.",
  rateLimited: "You're sending messages too fast. Please wait a moment.",
  tooLarge: "Your message is too long.",
  invalid: "Invalid request.",
  method: "Method not allowed.",
} as const;

export interface ChatHandlerDeps {
  generate: (messages: ChatMessage[], page?: string) => Promise<ReplyResult>;
  rateLimit: (key: string) => ChatRateLimitResult;
}

const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status: number, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...extraHeaders } });
}

export function createChatHandler(
  deps: ChatHandlerDeps = { generate: (m, p) => generateReply(m, p), rateLimit: createChatRateLimiter() }
) {
  async function POST(request: Request) {
    const rate = deps.rateLimit(clientIpFrom(request.headers));
    if (!rate.allowed) {
      return json({ error: CHAT_ERRORS.rateLimited }, 429, { "Retry-After": String(rate.retryAfterSeconds) });
    }

    let raw: string;
    try {
      raw = await request.text();
    } catch {
      return json({ error: CHAT_ERRORS.invalid }, 400);
    }
    if (isBodyTooLarge(raw)) return json({ error: CHAT_ERRORS.tooLarge }, 400);

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: CHAT_ERRORS.invalid }, 400);
    }

    const valid = validateChatBody(body);
    if (!valid.ok) return json({ error: valid.error }, 400);

    try {
      const result = await deps.generate(valid.messages, valid.page);
      if (result.ok) return json({ reply: result.reply, provider: result.provider }, 200);
      return json({ error: CHAT_ERRORS.busy }, 503);
    } catch {
      // Never forward provider/internal error text to the client
      return json({ error: CHAT_ERRORS.busy }, 503);
    }
  }

  function methodNotAllowed() {
    return json({ error: CHAT_ERRORS.method }, 405, { Allow: "POST" });
  }

  return { POST, methodNotAllowed };
}
