// localStorage persistence for ChemBot threads, scoped per account so people sharing a browser
// don't see each other's chats. Every access is guarded: storage can be unavailable (private mode).

export interface StoredMessage {
  id: string
  role: "user" | "assistant"
  content: string
  ts: number
}

const MAX_STORED = 40
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export function chatStorageKey(userId?: string | number | null): string {
  return `chembot:v1:${userId ?? "guest"}`
}

export function loadChat(key: string, now = Date.now()): StoredMessage[] {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (m): m is StoredMessage =>
          !!m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          typeof m.id === "string" &&
          typeof m.ts === "number" &&
          now - m.ts < MAX_AGE_MS
      )
      .slice(-MAX_STORED)
  } catch {
    return []
  }
}

export function saveChat(key: string, messages: StoredMessage[], now = Date.now()) {
  try {
    const keep = messages.filter((m) => now - m.ts < MAX_AGE_MS).slice(-MAX_STORED)
    if (keep.length) window.localStorage.setItem(key, JSON.stringify(keep))
    else window.localStorage.removeItem(key)
  } catch {
    // quota exceeded / storage disabled — chat still works for this session
  }
}

export function hasStoredChat(key: string): boolean {
  return loadChat(key).length > 0
}
