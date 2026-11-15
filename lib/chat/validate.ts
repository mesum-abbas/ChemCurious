// Pure request validation for POST /api/chat (no I/O; unit-tested in scripts/test-chat.ts).

export type ChatRole = "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export const CHAT_LIMITS = {
  maxBodyBytes: 32 * 1024,
  maxMessages: 12,
  maxMessageChars: 1500,
  maxTotalChars: 8000,
} as const;

const PAGE_PATTERN = /^\/[a-z0-9/_-]{0,60}$/;
// C0/C1 control characters except tab (\t), newline (\n) and carriage return (\r)
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

export type ValidationResult =
  | { ok: true; messages: ChatMessage[]; page?: string }
  | { ok: false; error: string };

export function sanitizeContent(value: string): string {
  return value.replace(CONTROL_CHARS, "").replace(/\r\n?/g, "\n").trim();
}

/** Byte length of the raw body, checked before JSON.parse. */
export function isBodyTooLarge(raw: string): boolean {
  return new TextEncoder().encode(raw).length > CHAT_LIMITS.maxBodyBytes;
}

export function validateChatBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid request." };
  }
  const { messages, page } = body as { messages?: unknown; page?: unknown };

  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "Please type a question first." };
  }

  // Only the most recent turns are sent to the model
  const recent = messages.slice(-CHAT_LIMITS.maxMessages);
  const clean: ChatMessage[] = [];

  for (const m of recent) {
    if (!m || typeof m !== "object") return { ok: false, error: "Invalid message format." };
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return { ok: false, error: "Invalid message format." };
    if (typeof content !== "string") return { ok: false, error: "Invalid message format." };

    const text = sanitizeContent(content);
    if (text.length > CHAT_LIMITS.maxMessageChars) {
      return { ok: false, error: `Messages can be at most ${CHAT_LIMITS.maxMessageChars} characters.` };
    }
    // Empty assistant turns (e.g. a cancelled reply) are dropped; an empty user turn is only an
    // error if it is the last one (checked below).
    if (text) clean.push({ role, content: text });
    else if (role === "user" && m === recent[recent.length - 1]) {
      return { ok: false, error: "Please type a question first." };
    }
  }

  const last = clean[clean.length - 1];
  if (!last || last.role !== "user") {
    return { ok: false, error: "The last message must be your question." };
  }

  const total = clean.reduce((sum, m) => sum + m.content.length, 0);
  if (total > CHAT_LIMITS.maxTotalChars) {
    return { ok: false, error: "This conversation is too long. Please clear the chat and ask again." };
  }

  const safePage = typeof page === "string" && PAGE_PATTERN.test(page) ? page : undefined;
  return { ok: true, messages: clean, page: safePage };
}
