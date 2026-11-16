import type { RateLimitOptions } from "@/lib/rate-limit";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * Every auth rate limit in one place. Login limits count FAILED attempts only, so a
 * classroom signing in from one school IP isn't throttled by its own successful logins.
 */
export const AUTH_LIMITS = {
  login: {
    /** Guessing one account from one IP. Cleared on successful sign-in. */
    ipAccount: { windowMs: 15 * MINUTE, max: 5 },
    /** One account attacked from many IPs (distributed brute force). Cleared on success. */
    account: { windowMs: HOUR, max: 20 },
    /** One IP trying many accounts (credential stuffing). Not cleared by a success. */
    ip: { windowMs: 15 * MINUTE, max: 30 },
  },
  signup: {
    /** Bot account creation. Counts every attempt (also slows email-existence probing via 409). */
    ip: { windowMs: HOUR, max: 10 },
  },
  forgotPassword: {
    /** Requests from one IP, answered with 429. */
    ip: { windowMs: 15 * MINUTE, max: 5 },
    /** Reset emails per address; beyond this the generic reply is returned with no new token. */
    email: { windowMs: HOUR, max: 3 },
  },
  resetPassword: {
    /** Token submissions from one IP. */
    ip: { windowMs: 15 * MINUTE, max: 10 },
  },
} as const satisfies Record<string, Record<string, RateLimitOptions>>;
