// Sliding-window per-IP limiter for /api/chat: 12 requests/minute AND 100 requests/hour.
// NOTE: in-memory and per server instance — limits reset on restart and are not shared between
// serverless instances. Good enough to stop casual abuse; use Redis/Upstash for strict global limits.

export interface ChatRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export const CHAT_RATE_WINDOWS = [
  { windowMs: 60_000, max: 12 },
  { windowMs: 3_600_000, max: 100 },
] as const;

const MAX_TRACKED_KEYS = 10_000;

export function createChatRateLimiter(
  windows: ReadonlyArray<{ windowMs: number; max: number }> = CHAT_RATE_WINDOWS,
  now: () => number = Date.now
) {
  const hits = new Map<string, number[]>();
  const longest = Math.max(...windows.map((w) => w.windowMs));

  return function check(key: string): ChatRateLimitResult {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((ts) => t - ts < longest);

    for (const { windowMs, max } of windows) {
      const inWindow = recent.filter((ts) => t - ts < windowMs);
      if (inWindow.length >= max) {
        const oldest = inWindow[0]!;
        hits.set(key, recent);
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - t) / 1000)) };
      }
    }

    recent.push(t);
    hits.set(key, recent);

    // Bound memory: drop the oldest-inserted key when tracking too many IPs
    if (hits.size > MAX_TRACKED_KEYS) {
      const firstKey = hits.keys().next().value;
      if (firstKey !== undefined) hits.delete(firstKey);
    }
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

/** First x-forwarded-for entry (set by the hosting proxy), else "unknown". */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip")?.trim() || "unknown";
}
