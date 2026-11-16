import { NextResponse } from "next/server";

/**
 * Fixed-window, in-memory rate limiter.
 *
 * State lives in this server instance's memory: it resets on restart/redeploy and is NOT
 * shared between serverless instances (each Vercel instance counts separately). That still
 * stops scripted attacks hitting a warm instance; for strict global limits, move the store to
 * Redis/Upstash behind the same functions.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default 15 minutes)
  max?: number; // Max requests allowed per window (default 10)
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 10;

/** Hard cap on tracked keys, so an attacker rotating emails/IPs can't grow memory forever. */
const MAX_KEYS = 50_000;
const SWEEP_INTERVAL_MS = 60 * 1000;

const rateLimitMap = new Map<string, RateLimitRecord>();
let lastSweep = 0;

/** Drop expired windows (at most once a minute), then evict oldest keys if still over the cap. */
function sweep(now: number) {
  if (now - lastSweep >= SWEEP_INTERVAL_MS) {
    lastSweep = now;
    for (const [key, record] of rateLimitMap) {
      if (now > record.resetAt) rateLimitMap.delete(key);
    }
  }
  // Map iterates in insertion order, so the first keys are the oldest windows.
  while (rateLimitMap.size > MAX_KEYS) {
    const oldest = rateLimitMap.keys().next().value;
    if (oldest === undefined) break;
    rateLimitMap.delete(oldest);
  }
}

function resolve(options: RateLimitOptions) {
  return { windowMs: options.windowMs ?? DEFAULT_WINDOW_MS, max: options.max ?? DEFAULT_MAX };
}

/**
 * Counts one hit against `key` and reports whether it is still within the limit.
 * Once the limit is reached, further calls are rejected (and not counted) until the window ends.
 */
export function checkRateLimit(key: string, options: RateLimitOptions = {}): RateLimitResult {
  const { windowMs, max } = resolve(options);
  const now = Date.now();
  sweep(now);

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitMap.delete(key); // re-insert so insertion order tracks window age
    rateLimitMap.set(key, { count: 1, resetAt });
    return { success: true, limit: max, remaining: max - 1, resetAt };
  }

  if (record.count >= max) {
    return { success: false, limit: max, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { success: true, limit: max, remaining: max - record.count, resetAt: record.resetAt };
}

/**
 * Reports the state of `key` WITHOUT counting a hit. Used where only failures should count
 * (login): check every limit first with peek, then `checkRateLimit` only when an attempt fails.
 */
export function peekRateLimit(key: string, options: RateLimitOptions = {}): RateLimitResult {
  const { windowMs, max } = resolve(options);
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    return { success: true, limit: max, remaining: max, resetAt: now + windowMs };
  }
  return {
    success: record.count < max,
    limit: max,
    remaining: Math.max(0, max - record.count),
    resetAt: record.resetAt,
  };
}

/** Resets rate limit for a specific key (e.g. upon successful authentication). */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

/** Seconds until the window ends (at least 1), for the Retry-After header. */
export function retryAfterSeconds(result: RateLimitResult): number {
  return Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
}

/** The blocked result whose window ends last, or null if none of them is blocked. */
export function firstBlocked(results: RateLimitResult[]): RateLimitResult | null {
  const blocked = results.filter((r) => !r.success);
  if (blocked.length === 0) return null;
  return blocked.reduce((a, b) => (b.resetAt > a.resetAt ? b : a));
}

/** Standard 429 response: human message + `retryAfter` (seconds) in the body and header. */
export function tooManyRequests(result: RateLimitResult, action = "requests"): NextResponse {
  const retryAfter = retryAfterSeconds(result);
  const minutes = Math.ceil(retryAfter / 60);
  const wait = retryAfter < 60 ? `${retryAfter} second(s)` : `${minutes} minute(s)`;
  return NextResponse.json(
    { error: `Too many ${action}. Please try again in ${wait}.`, retryAfter },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

/**
 * Client IP for rate limiting. On Vercel, `x-forwarded-for` is set by the platform edge
 * (client-supplied values are overwritten), so its first entry is the real client.
 * When self-hosting, make sure your proxy overwrites this header; otherwise clients can
 * spoof it, and only the per-account limits still hold.
 */
export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp && xRealIp.trim()) return xRealIp.trim();
  return "127.0.0.1";
}

/** Test-only: clear every counter. */
export function __resetAllRateLimits(): void {
  rateLimitMap.clear();
  lastSweep = 0;
}

/** Test-only: number of keys currently tracked. */
export function __rateLimitKeyCount(): number {
  return rateLimitMap.size;
}
