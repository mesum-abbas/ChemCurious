// Auth hardening unit tests: run with  npx tsx scripts/test-auth-security.ts
// Covers the pure modules (no database / network): rate limiter, client IP, password
// policy, disposable-email check and the auth limit config.
import assert from "node:assert/strict"
import {
  checkRateLimit,
  peekRateLimit,
  resetRateLimit,
  firstBlocked,
  retryAfterSeconds,
  tooManyRequests,
  getClientIp,
  __resetAllRateLimits,
  __rateLimitKeyCount,
} from "../lib/rate-limit"
import { validatePassword, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "../lib/password-policy"
import { isDisposableEmail } from "../lib/disposable-email"
import { AUTH_LIMITS } from "../lib/auth-rate-limits"

let passed = 0
let failed = 0
const realNow = Date.now
async function test(name: string, fn: () => unknown | Promise<unknown>) {
  __resetAllRateLimits()
  Date.now = realNow
  try {
    await fn()
    passed++
    console.log(`  ok   ${name}`)
  } catch (err) {
    failed++
    console.log(`  FAIL ${name}\n       ${(err as Error).message}`)
  } finally {
    Date.now = realNow
  }
}
/** Freeze the clock at `t` (ms); returns a setter to move it. */
function fakeClock(t = 1_000_000) {
  let now = t
  Date.now = () => now
  return (next: number) => {
    now = next
  }
}
const req = (headers: Record<string, string> = {}) => new Request("http://localhost/api/x", { headers })

async function main() {
  console.log("rate-limit")
  await test("allows up to max, then blocks", () => {
    fakeClock()
    for (let i = 1; i <= 3; i++) assert.equal(checkRateLimit("k", { windowMs: 1000, max: 3 }).success, true)
    const r = checkRateLimit("k", { windowMs: 1000, max: 3 })
    assert.equal(r.success, false)
    assert.equal(r.remaining, 0)
  })
  await test("remaining counts down", () => {
    fakeClock()
    assert.equal(checkRateLimit("k", { max: 3 }).remaining, 2)
    assert.equal(checkRateLimit("k", { max: 3 }).remaining, 1)
    assert.equal(checkRateLimit("k", { max: 3 }).remaining, 0)
  })
  await test("window expiry starts a fresh window", () => {
    const set = fakeClock(1000)
    for (let i = 0; i < 2; i++) checkRateLimit("k", { windowMs: 500, max: 2 })
    assert.equal(checkRateLimit("k", { windowMs: 500, max: 2 }).success, false)
    set(1501)
    assert.equal(checkRateLimit("k", { windowMs: 500, max: 2 }).success, true)
  })
  await test("blocked calls are not counted (window does not extend)", () => {
    const set = fakeClock(0)
    checkRateLimit("k", { windowMs: 1000, max: 1 })
    const first = checkRateLimit("k", { windowMs: 1000, max: 1 })
    set(500)
    const second = checkRateLimit("k", { windowMs: 1000, max: 1 })
    assert.equal(first.resetAt, second.resetAt)
  })
  await test("keys are independent", () => {
    checkRateLimit("a", { max: 1 })
    assert.equal(checkRateLimit("a", { max: 1 }).success, false)
    assert.equal(checkRateLimit("b", { max: 1 }).success, true)
  })
  await test("peek never counts", () => {
    for (let i = 0; i < 10; i++) assert.equal(peekRateLimit("k", { max: 2 }).success, true)
    assert.equal(peekRateLimit("k", { max: 2 }).remaining, 2)
    checkRateLimit("k", { max: 2 })
    checkRateLimit("k", { max: 2 })
    assert.equal(peekRateLimit("k", { max: 2 }).success, false)
  })
  await test("reset clears a key", () => {
    checkRateLimit("k", { max: 1 })
    resetRateLimit("k")
    assert.equal(checkRateLimit("k", { max: 1 }).success, true)
  })
  await test("expired keys are swept from memory", () => {
    const set = fakeClock(0)
    for (let i = 0; i < 100; i++) checkRateLimit(`sweep-${i}`, { windowMs: 10, max: 5 })
    assert.equal(__rateLimitKeyCount(), 100)
    set(120_000) // past both the windows and the once-a-minute sweep interval
    checkRateLimit("trigger", { windowMs: 10, max: 5 })
    assert.equal(__rateLimitKeyCount(), 1)
  })
  await test("live windows survive a sweep", () => {
    const set = fakeClock(0)
    checkRateLimit("long", { windowMs: 10 * 60_000, max: 5 })
    set(120_000)
    checkRateLimit("trigger", { max: 5 })
    assert.equal(__rateLimitKeyCount(), 2)
    assert.equal(peekRateLimit("long", { max: 5 }).remaining, 4)
  })
  await test("firstBlocked picks the latest-ending blocked window", () => {
    const now = Date.now()
    const ok = { success: true, limit: 5, remaining: 3, resetAt: now + 999_999 }
    const a = { success: false, limit: 5, remaining: 0, resetAt: now + 1000 }
    const b = { success: false, limit: 5, remaining: 0, resetAt: now + 5000 }
    assert.equal(firstBlocked([ok]), null)
    assert.equal(firstBlocked([a, ok, b]), b)
  })
  await test("retryAfterSeconds rounds up and is at least 1", () => {
    fakeClock(0)
    assert.equal(retryAfterSeconds({ success: false, limit: 1, remaining: 0, resetAt: 1500 }), 2)
    assert.equal(retryAfterSeconds({ success: false, limit: 1, remaining: 0, resetAt: -5 }), 1)
  })
  await test("tooManyRequests: 429 + Retry-After header + body", async () => {
    fakeClock(0)
    const res = tooManyRequests({ success: false, limit: 5, remaining: 0, resetAt: 125_000 }, "sign-in attempts")
    assert.equal(res.status, 429)
    assert.equal(res.headers.get("Retry-After"), "125")
    assert.equal(res.headers.get("X-RateLimit-Limit"), "5")
    const body = await res.json()
    assert.equal(body.retryAfter, 125)
    assert.match(body.error, /Too many sign-in attempts\. Please try again in 3 minute\(s\)\./)
  })
  await test("tooManyRequests uses seconds under a minute", async () => {
    fakeClock(0)
    const body = await tooManyRequests({ success: false, limit: 1, remaining: 0, resetAt: 30_000 }).json()
    assert.match(body.error, /30 second\(s\)/)
  })

  console.log("getClientIp")
  await test("first x-forwarded-for entry", () => {
    assert.equal(getClientIp(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1, 10.0.0.2" })), "203.0.113.7")
  })
  await test("falls back to x-real-ip", () => {
    assert.equal(getClientIp(req({ "x-real-ip": " 198.51.100.4 " })), "198.51.100.4")
  })
  await test("empty x-forwarded-for falls through", () => {
    assert.equal(getClientIp(req({ "x-forwarded-for": " , ", "x-real-ip": "198.51.100.9" })), "198.51.100.9")
  })
  await test("defaults to 127.0.0.1", () => {
    assert.equal(getClientIp(req()), "127.0.0.1")
  })

  console.log("password policy")
  await test("accepts a reasonable password", () => {
    assert.equal(validatePassword("Benzene42ring"), null)
    assert.equal(validatePassword("molecule7"), null)
  })
  await test("too short", () => {
    assert.match(validatePassword("abc123")!, new RegExp(`at least ${PASSWORD_MIN_LENGTH}`))
  })
  await test("too long", () => {
    assert.match(validatePassword("a1".repeat(PASSWORD_MAX_LENGTH))!, /at most/)
  })
  await test("needs a letter and a number", () => {
    assert.match(validatePassword("onlyletters")!, /letter and one number/)
    assert.match(validatePassword("1234567890123")!, /letter and one number/)
  })
  await test("rejects common passwords (case-insensitive)", () => {
    assert.match(validatePassword("Password123")!, /too common/)
    assert.match(validatePassword("CHEMISTRY123")!, /too common/)
  })
  await test("rejects passwords containing the email name", () => {
    assert.match(validatePassword("sarah2024x", "sarah@example.com")!, /email/)
    assert.equal(validatePassword("Benzene42ring", "sarah@example.com"), null)
  })
  await test("short email names are not over-matched", () => {
    // 'al' is too short to be meaningful; 'royal123x' must stay valid
    assert.equal(validatePassword("royal123x", "al@example.com"), null)
  })
  await test("non-string input is rejected safely", () => {
    assert.notEqual(validatePassword(undefined as unknown as string), null)
  })

  console.log("disposable email")
  await test("blocks known throwaway domains", () => {
    assert.equal(isDisposableEmail("bot@mailinator.com"), true)
    assert.equal(isDisposableEmail("bot@YOPMAIL.com"), true)
    assert.equal(isDisposableEmail("x@guerrillamail.com"), true)
  })
  await test("blocks subdomains of throwaway domains", () => {
    assert.equal(isDisposableEmail("bot@inbox.mailinator.com"), true)
  })
  await test("allows normal providers and look-alikes", () => {
    assert.equal(isDisposableEmail("student@gmail.com"), false)
    assert.equal(isDisposableEmail("teacher@neduet.edu.pk"), false)
    assert.equal(isDisposableEmail("me@notmailinator.com"), false)
  })
  await test("malformed input does not throw", () => {
    assert.equal(isDisposableEmail("no-at-sign"), false)
    assert.equal(isDisposableEmail(""), false)
  })

  console.log("config sanity")
  await test("every auth limit has a positive window and max", () => {
    for (const [route, limits] of Object.entries(AUTH_LIMITS)) {
      for (const [name, opt] of Object.entries(limits)) {
        assert.ok(opt.windowMs > 0 && opt.max > 0, `${route}.${name}`)
      }
    }
  })
  await test("per account+IP login limit is tighter than per-account and per-IP", () => {
    const l = AUTH_LIMITS.login
    assert.ok(l.ipAccount.max < l.account.max && l.ipAccount.max < l.ip.max)
  })

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main()
