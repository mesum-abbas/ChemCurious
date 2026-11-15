// ChemBot tests — run with: npx tsx scripts/test-chat.ts   (no test framework / network needed)
import assert from "node:assert/strict"
import { generateReply, postProcessReply, __resetChatProviderState, type ChatDeps } from "../lib/chat/providers"
import { validateChatBody, isBodyTooLarge, CHAT_LIMITS, type ChatMessage } from "../lib/chat/validate"
import { createChatRateLimiter, clientIpFrom } from "../lib/chat/rate-limit"
import { parseMessage, parseInline, inlineToText, type Block } from "../lib/chat/format"
import { createChatHandler, CHAT_ERRORS } from "../lib/chat/handler"
import { buildSystemPrompt } from "../lib/chat/system-prompt"

// ---------- tiny runner ----------
const results: Array<{ group: string; name: string; ok: boolean; err?: unknown }> = []
let currentGroup = ""
const queue: Array<() => Promise<void>> = []
function group(name: string, fn: () => void) {
  queue.push(async () => {
    currentGroup = name
  })
  fn()
}
function test(name: string, fn: () => unknown | Promise<unknown>) {
  queue.push(async () => {
    const g = currentGroup
    try {
      __resetChatProviderState()
      await fn()
      results.push({ group: g, name, ok: true })
    } catch (err) {
      results.push({ group: g, name, ok: false, err })
    }
  })
}

// ---------- helpers ----------
const GEMINI_KEY = "test-gemini-SECRET-123"
const GROQ_KEY = "test-groq-SECRET-456"
const USER: ChatMessage[] = [{ role: "user", content: "What is an ionic bond?" }]

type Call = { url: string; init: RequestInit; body: any }
type Responder = (url: string) => Response | Promise<Response> | "network" | "hang"

function jsonRes(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } })
}
const geminiOk = (text = "Gemini answer -> done") =>
  jsonRes(200, { candidates: [{ content: { parts: [{ text }] }, finishReason: "STOP" }] })
const groqOk = (text = "Groq answer") => jsonRes(200, { choices: [{ message: { content: text } }] })

function makeDeps(opts: { gemini?: Responder; groq?: Responder; env?: Record<string, string | undefined>; now?: () => number }) {
  const calls: Call[] = []
  const logs: string[] = []
  const fakeFetch = (async (input: any, init: RequestInit = {}) => {
    const url = String(input)
    calls.push({ url, init, body: init.body ? JSON.parse(String(init.body)) : undefined })
    const responder = url.includes("googleapis.com") ? opts.gemini : opts.groq
    const r = responder ? await responder(url) : jsonRes(500, {})
    if (r === "network") throw new TypeError("fetch failed")
    if (r === "hang") {
      return new Promise<Response>((_, reject) => {
        init.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))
      })
    }
    return r
  }) as typeof fetch
  const deps: ChatDeps = {
    fetch: fakeFetch,
    now: opts.now ?? (() => 1_000_000),
    env: { GEMINI_API_KEY: GEMINI_KEY, GROQ_API_KEY: GROQ_KEY, CHAT_TIMEOUT_MS: "1000", ...opts.env },
    log: {
      warn: (...a: unknown[]) => logs.push(JSON.stringify(a)),
      error: (...a: unknown[]) => logs.push(JSON.stringify(a)),
    },
  }
  return { deps, calls, logs }
}
function assertNoSecrets(...texts: string[]) {
  for (const t of texts) {
    assert.ok(!t.includes(GEMINI_KEY) && !t.includes(GROQ_KEY), "a key leaked into output")
    assert.ok(!t.includes("What is an ionic bond?"), "user message text leaked into logs")
  }
}

// =====================================================================
group("Failover", () => {
  test("Gemini OK -> provider Gemini, Groq not called", async () => {
    const { deps, calls } = makeDeps({ gemini: () => geminiOk() })
    const r = await generateReply(USER, undefined, deps)
    assert.deepEqual(r, { ok: true, reply: "Gemini answer → done", provider: "Gemini" })
    assert.equal(calls.length, 1)
  })
  for (const status of [429, 500, 503, 401, 403, 404, 400]) {
    test(`Gemini HTTP ${status} -> Groq`, async () => {
      const { deps, logs } = makeDeps({ gemini: () => jsonRes(status, { error: { message: `leak ${GEMINI_KEY}` } }), groq: () => groqOk() })
      const r = await generateReply(USER, undefined, deps)
      assert.equal(r.ok && r.provider, "Groq")
      assert.ok(logs.some((l) => l.includes("gemini failed") && l.includes(`status=${status}`)))
      assertNoSecrets(...logs)
    })
  }
  test("Gemini network error -> Groq", async () => {
    const { deps, logs } = makeDeps({ gemini: () => "network", groq: () => groqOk() })
    const r = await generateReply(USER, undefined, deps)
    assert.equal(r.ok && r.provider, "Groq")
    assert.ok(logs.some((l) => l.includes("network_error")))
  })
  test("Gemini timeout -> Groq (AbortController fires)", async () => {
    const { deps, logs } = makeDeps({ gemini: () => "hang", groq: () => groqOk() })
    const t = Date.now()
    const r = await generateReply(USER, undefined, deps)
    assert.equal(r.ok && r.provider, "Groq")
    assert.ok(Date.now() - t < 5000, "timeout did not abort")
    assert.ok(logs.some((l) => l.includes("timeout")))
  })
  test("Gemini 200 with empty candidates -> Groq", async () => {
    const { deps } = makeDeps({ gemini: () => jsonRes(200, { candidates: [] }), groq: () => groqOk() })
    const r = await generateReply(USER, undefined, deps)
    assert.equal(r.ok && r.provider, "Groq")
  })
  test("Gemini safety block (finishReason SAFETY / promptFeedback) -> Groq", async () => {
    for (const body of [
      { candidates: [{ content: { parts: [{ text: "partial" }] }, finishReason: "SAFETY" }] },
      { promptFeedback: { blockReason: "SAFETY" } },
    ]) {
      __resetChatProviderState()
      const { deps } = makeDeps({ gemini: () => jsonRes(200, body), groq: () => groqOk() })
      const r = await generateReply(USER, undefined, deps)
      assert.equal(r.ok && r.provider, "Groq")
    }
  })
  test("Groq empty output also counts as failure", async () => {
    const { deps } = makeDeps({ gemini: () => jsonRes(500, {}), groq: () => jsonRes(200, { choices: [{ message: { content: "  " } }] }) })
    assert.deepEqual(await generateReply(USER, undefined, deps), { ok: false, reason: "all_failed" })
  })
  test("Both fail -> all_failed (route turns this into 503)", async () => {
    const { deps, logs } = makeDeps({ gemini: () => jsonRes(503, {}), groq: () => "network" })
    assert.deepEqual(await generateReply(USER, undefined, deps), { ok: false, reason: "all_failed" })
    assert.ok(logs.some((l) => l.includes("groq failed")))
  })
  test("Gemini key missing -> Groq directly, one warning only", async () => {
    const { deps, calls, logs } = makeDeps({ groq: () => groqOk(), env: { GEMINI_API_KEY: undefined } })
    assert.equal((await generateReply(USER, undefined, deps)).ok, true)
    await generateReply(USER, undefined, deps)
    assert.ok(calls.every((c) => c.url.includes("groq.com")))
    assert.equal(logs.filter((l) => l.includes("gemini skipped")).length, 1)
  })
  test("Both keys missing -> not_configured + clear server log", async () => {
    const { deps, calls, logs } = makeDeps({ env: { GEMINI_API_KEY: "", GROQ_API_KEY: "" } })
    assert.deepEqual(await generateReply(USER, undefined, deps), { ok: false, reason: "not_configured" })
    assert.equal(calls.length, 0)
    assert.ok(logs.some((l) => l.includes("not configured")))
  })
  test("Cooldown: after Gemini 429, Gemini is skipped until it expires", async () => {
    let now = 1_000_000
    const { deps, calls } = makeDeps({ gemini: () => jsonRes(429, {}), groq: () => groqOk(), now: () => now })
    await generateReply(USER, undefined, deps)
    const geminiCalls = () => calls.filter((c) => c.url.includes("googleapis")).length
    assert.equal(geminiCalls(), 1)
    now += 10_000
    await generateReply(USER, undefined, deps)
    assert.equal(geminiCalls(), 1, "Gemini should be skipped during cooldown")
    now += 25_000
    await generateReply(USER, undefined, deps)
    assert.equal(geminiCalls(), 2, "Gemini should be retried after 30 s")
  })
  test("Cooldown honours Retry-After", async () => {
    let now = 1_000_000
    const { deps, calls } = makeDeps({ gemini: () => jsonRes(429, {}, { "Retry-After": "5" }), groq: () => groqOk(), now: () => now })
    await generateReply(USER, undefined, deps)
    now += 6_000
    await generateReply(USER, undefined, deps)
    assert.equal(calls.filter((c) => c.url.includes("googleapis")).length, 2)
  })
  test("Request mapping: assistant->model, systemInstruction, Groq system first, headers", async () => {
    const history: ChatMessage[] = [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
      { role: "user", content: "what is pH?" },
    ]
    const { deps, calls } = makeDeps({ gemini: () => jsonRes(500, {}), groq: () => groqOk() })
    await generateReply(history, "/reactions", deps)
    const g = calls[0]!
    assert.deepEqual(g.body.contents.map((c: any) => c.role), ["user", "model", "user"])
    assert.ok(g.body.systemInstruction.parts[0].text.includes("ChemBot"))
    assert.ok(g.body.systemInstruction.parts[0].text.includes("reaction simulator"))
    assert.equal(g.body.generationConfig.maxOutputTokens, 700)
    assert.equal((g.init.headers as Record<string, string>)["x-goog-api-key"], GEMINI_KEY)
    const q = calls[1]!
    assert.equal(q.body.messages[0].role, "system")
    assert.deepEqual(q.body.messages.slice(1), history)
    assert.equal((q.init.headers as Record<string, string>).Authorization, `Bearer ${GROQ_KEY}`)
    assert.equal(q.body.model, "openai/gpt-oss-20b")
    assert.equal(q.body.reasoning_effort, "low")
  })
  test("Non gpt-oss Groq model gets no reasoning params; models are env-configurable", async () => {
    const { deps, calls } = makeDeps({ gemini: () => jsonRes(500, {}), groq: () => groqOk(), env: { GROQ_MODEL: "llama-x", GEMINI_MODEL: "gemini-test" } })
    await generateReply(USER, undefined, deps)
    assert.ok(calls[0]!.url.includes("/models/gemini-test:generateContent"))
    assert.equal(calls[1]!.body.model, "llama-x")
    assert.equal(calls[1]!.body.reasoning_effort, undefined)
  })
  test("Gemini URL never contains key=, keys never in logs", async () => {
    const { deps, calls, logs } = makeDeps({ gemini: () => jsonRes(401, { error: GEMINI_KEY }), groq: () => jsonRes(401, { error: GROQ_KEY }) })
    await generateReply(USER, undefined, deps)
    for (const c of calls) {
      assert.ok(!c.url.includes("key="), `URL contains key=: ${c.url}`)
      assert.ok(!c.url.includes(GEMINI_KEY) && !c.url.includes(GROQ_KEY))
    }
    assertNoSecrets(...logs)
  })
  test("Post-processing: arrows, trimming, 4000-char cap", () => {
    assert.equal(postProcessReply("  A -> B <=> C <-> D  "), "A → B ⇌ C ⇌ D")
    const long = postProcessReply("x".repeat(5000))
    assert.ok(long.length <= 4001 && long.endsWith("…"))
  })
  test("System prompt adds page context (incl. /periodic alias)", () => {
    assert.ok(buildSystemPrompt("/molecules").includes("3D molecule viewer"))
    assert.ok(buildSystemPrompt("/periodic").includes("periodic table"))
    assert.ok(buildSystemPrompt("/about").includes("general"))
    assert.ok(buildSystemPrompt().includes("general"))
  })
})

// =====================================================================
group("Validation", () => {
  const u = (content: unknown, role: unknown = "user") => ({ role, content })
  test("missing body / messages", () => {
    assert.equal(validateChatBody(null).ok, false)
    assert.equal(validateChatBody({}).ok, false)
    assert.equal(validateChatBody({ messages: [] }).ok, false)
    assert.equal(validateChatBody({ messages: "hi" }).ok, false)
  })
  test("empty last user message rejected", () => {
    assert.equal(validateChatBody({ messages: [u("   ")] }).ok, false)
  })
  test("last message must be user", () => {
    assert.equal(validateChatBody({ messages: [u("hi"), u("hello", "assistant")] }).ok, false)
  })
  test("bad role rejected (system / tool)", () => {
    assert.equal(validateChatBody({ messages: [u("x", "system")] }).ok, false)
    assert.equal(validateChatBody({ messages: [u("x", "tool")] }).ok, false)
  })
  test("non-string content rejected", () => {
    assert.equal(validateChatBody({ messages: [u(42)] }).ok, false)
    assert.equal(validateChatBody({ messages: [u({ text: "x" })] }).ok, false)
  })
  test("content over 1500 chars rejected; exactly 1500 accepted", () => {
    assert.equal(validateChatBody({ messages: [u("a".repeat(1501))] }).ok, false)
    assert.equal(validateChatBody({ messages: [u("a".repeat(1500))] }).ok, true)
  })
  test("more than 12 messages trimmed to the last 12", () => {
    const msgs = Array.from({ length: 20 }, (_, i) => u(`m${i}`, i % 2 === 0 ? "assistant" : "user"))
    const r = validateChatBody({ messages: msgs })
    assert.ok(r.ok)
    if (r.ok) {
      assert.equal(r.messages.length, 12)
      assert.equal(r.messages[11]!.content, "m19")
    }
  })
  test("control characters stripped, newlines kept, trimmed", () => {
    const r = validateChatBody({ messages: [u("  H\u0000\u0007ello\nworld\u001F\u007F  ")] })
    assert.ok(r.ok && r.messages[0]!.content === "Hello\nworld")
  })
  test("total over 8000 chars rejected", () => {
    const msgs = Array.from({ length: 7 }, (_, i) => u("b".repeat(1400), i % 2 ? "assistant" : "user"))
    assert.equal(validateChatBody({ messages: msgs }).ok, false)
  })
  test("oversized raw body detected (>32 KB)", () => {
    assert.equal(isBodyTooLarge("x".repeat(CHAT_LIMITS.maxBodyBytes + 1)), true)
    assert.equal(isBodyTooLarge("x".repeat(1000)), false)
  })
  test("page whitelist accepts valid paths", () => {
    const r = validateChatBody({ messages: [u("hi")], page: "/periodic-table" })
    assert.ok(r.ok && r.page === "/periodic-table")
  })
  test("page whitelist ignores unsafe values", () => {
    for (const page of ["https://evil.com", "/Molecules", "/a b", "/x?y=1", "/" + "a".repeat(70), 123, "../etc"]) {
      const r = validateChatBody({ messages: [u("hi")], page })
      assert.ok(r.ok && r.page === undefined, `accepted ${String(page)}`)
    }
  })
  test("empty assistant turns are dropped, not fatal", () => {
    const r = validateChatBody({ messages: [u("hi"), u("", "assistant"), u("again")] })
    assert.ok(r.ok && r.messages.length === 2)
  })
})

// =====================================================================
group("Rate limiter", () => {
  test("allows 12 per minute, blocks the 13th with Retry-After", () => {
    let t = 0
    const check = createChatRateLimiter(undefined, () => t)
    for (let i = 0; i < 12; i++) assert.equal(check("ip").allowed, true)
    const r = check("ip")
    assert.equal(r.allowed, false)
    assert.ok(r.retryAfterSeconds >= 1 && r.retryAfterSeconds <= 60)
  })
  test("minute window slides", () => {
    let t = 0
    const check = createChatRateLimiter(undefined, () => t)
    for (let i = 0; i < 12; i++) check("ip")
    t += 60_001
    assert.equal(check("ip").allowed, true)
  })
  test("hourly cap of 100", () => {
    let t = 0
    const check = createChatRateLimiter(undefined, () => t)
    let allowed = 0
    for (let i = 0; i < 130; i++) {
      t += 6_000 // 10/min, under the minute cap
      if (check("ip").allowed) allowed++
    }
    assert.equal(allowed, 100)
  })
  test("keys are independent", () => {
    const check = createChatRateLimiter([{ windowMs: 60_000, max: 1 }], () => 0)
    assert.equal(check("a").allowed, true)
    assert.equal(check("b").allowed, true)
    assert.equal(check("a").allowed, false)
  })
  test("client IP = first x-forwarded-for entry, else unknown", () => {
    assert.equal(clientIpFrom(new Headers({ "x-forwarded-for": " 1.2.3.4 , 5.6.7.8" })), "1.2.3.4")
    assert.equal(clientIpFrom(new Headers()), "unknown")
  })
})

// =====================================================================
group("Format parser", () => {
  const types = (blocks: Block[]) => blocks.map((b) => (b.type === "list" ? (b.ordered ? "ol" : "ul") : "p"))
  test("plain paragraphs split on blank lines", () => {
    assert.deepEqual(types(parseMessage("One\n\nTwo")), ["p", "p"])
  })
  test("single newline = line break inside a paragraph", () => {
    const [p] = parseMessage("Line 1\nLine 2")
    assert.ok(p!.type === "paragraph" && p!.lines.length === 2)
  })
  test("**bold** parsed", () => {
    assert.deepEqual(parseInline("a **b** c"), [
      { type: "text", value: "a " },
      { type: "bold", children: [{ type: "text", value: "b" }] },
      { type: "text", value: " c" },
    ])
  })
  test("unmatched ** stays literal", () => {
    assert.deepEqual(parseInline("2 ** 3 is power"), [{ type: "text", value: "2 ** 3 is power" }])
  })
  test("`code` parsed and ** inside code is literal", () => {
    assert.deepEqual(parseInline("use `a**b`"), [{ type: "text", value: "use " }, { type: "code", value: "a**b" }])
  })
  test("bullets with - * •", () => {
    const [l] = parseMessage("- a\n* b\n• c")
    assert.ok(l!.type === "list" && !l!.ordered && l!.items.length === 3)
  })
  test("numbered list keeps start number", () => {
    const [l] = parseMessage("3. three\n4. four")
    assert.ok(l!.type === "list" && l!.ordered && l!.start === 3 && l!.items.length === 2)
  })
  test("nested list by indentation", () => {
    const [l] = parseMessage("1. Count atoms\n   - Fe: 1\n   - O: 2\n2. Balance")
    assert.ok(l!.type === "list" && l!.items.length === 2)
    const nested = l!.type === "list" ? l!.items[0]!.children[0] : undefined
    assert.ok(nested?.type === "list" && !nested.ordered && nested.items.length === 2)
  })
  test("<img onerror> stays literal text (no HTML parsing)", () => {
    const xss = "<img src=x onerror=alert(1)>"
    const [p] = parseMessage(xss)
    assert.ok(p!.type === "paragraph")
    assert.equal(inlineToText(p!.lines[0]!), xss)
  })
  test("<script> inside bold is still literal text", () => {
    const [p] = parseMessage("**<script>alert(1)</script>**")
    assert.ok(p!.type === "paragraph" && p!.lines[0]![0]!.type === "bold")
    assert.equal(inlineToText(p!.lines[0]!), "<script>alert(1)</script>")
  })
  test("paragraph then list then paragraph", () => {
    assert.deepEqual(types(parseMessage("Intro:\n- a\n- b\n\nOutro")), ["p", "ul", "p"])
  })
  test("unicode chemistry survives (H₂SO₄, ⇌)", () => {
    const [p] = parseMessage("N₂ + 3H₂ ⇌ 2NH₃")
    assert.ok(p!.type === "paragraph" && inlineToText(p!.lines[0]!) === "N₂ + 3H₂ ⇌ 2NH₃")
  })
})

// =====================================================================
group("Route handler", () => {
  const post = (handler: ReturnType<typeof createChatHandler>, body: unknown, headers: Record<string, string> = {}) =>
    handler.POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "9.9.9.9", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      })
    )
  const okBody = { messages: USER }
  const allow = () => ({ allowed: true, retryAfterSeconds: 0 })

  test("200 with reply + provider, Cache-Control no-store", async () => {
    const h = createChatHandler({ generate: async () => ({ ok: true, reply: "hi", provider: "Gemini" }), rateLimit: allow })
    const res = await post(h, okBody)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { reply: "hi", provider: "Gemini" })
    assert.equal(res.headers.get("cache-control"), "no-store")
  })
  test("400 on invalid JSON and invalid messages", async () => {
    const h = createChatHandler({ generate: async () => assert.fail("should not be called"), rateLimit: allow })
    assert.equal((await post(h, "{not json")).status, 400)
    const res = await post(h, { messages: [{ role: "system", content: "x" }] })
    assert.equal(res.status, 400)
    assert.equal(res.headers.get("cache-control"), "no-store")
  })
  test("400 on oversized body", async () => {
    const h = createChatHandler({ generate: async () => assert.fail("should not be called"), rateLimit: allow })
    assert.equal((await post(h, { messages: USER, pad: "x".repeat(40_000) })).status, 400)
  })
  test("405 for other methods with Allow header", async () => {
    const h = createChatHandler({ generate: async () => ({ ok: false, reason: "all_failed" }), rateLimit: allow })
    const res = h.methodNotAllowed()
    assert.equal(res.status, 405)
    assert.equal(res.headers.get("allow"), "POST")
  })
  test("429 with Retry-After when rate limited (keyed by first XFF IP)", async () => {
    let seenKey = ""
    const h = createChatHandler({
      generate: async () => assert.fail("should not be called"),
      rateLimit: (k) => ((seenKey = k), { allowed: false, retryAfterSeconds: 17 }),
    })
    const res = await post(h, okBody, { "x-forwarded-for": "7.7.7.7, 10.0.0.1" })
    assert.equal(res.status, 429)
    assert.equal(res.headers.get("retry-after"), "17")
    assert.equal((await res.json()).error, CHAT_ERRORS.rateLimited)
    assert.equal(seenKey, "7.7.7.7")
  })
  test("503 when providers fail or are not configured", async () => {
    for (const reason of ["all_failed", "not_configured"] as const) {
      const h = createChatHandler({ generate: async () => ({ ok: false, reason }), rateLimit: allow })
      const res = await post(h, okBody)
      assert.equal(res.status, 503)
      assert.deepEqual(await res.json(), { error: CHAT_ERRORS.busy })
    }
  })
  test("thrown provider errors never reach the client", async () => {
    const h = createChatHandler({
      generate: async () => {
        throw new Error(`Gemini 401: API key ${GEMINI_KEY} invalid; raw payload {...}`)
      },
      rateLimit: allow,
    })
    const res = await post(h, okBody)
    const text = await res.text()
    assert.equal(res.status, 503)
    assert.ok(!text.includes(GEMINI_KEY) && !text.includes("raw payload") && !text.includes("401"))
  })
  test("end-to-end with real providers module + mocked fetch: failover reaches client as Groq", async () => {
    const { deps } = makeDeps({ gemini: () => jsonRes(429, {}), groq: () => groqOk("NaCl is ionic") })
    const h = createChatHandler({ generate: (m, p) => generateReply(m, p, deps), rateLimit: allow })
    const res = await post(h, { messages: USER, page: "/periodic" })
    assert.deepEqual(await res.json(), { reply: "NaCl is ionic", provider: "Groq" })
  })
})

// ---------- run ----------
;(async () => {
  for (const step of queue) await step()
  const byGroup = new Map<string, { pass: number; fail: number }>()
  for (const r of results) {
    const g = byGroup.get(r.group) ?? { pass: 0, fail: 0 }
    r.ok ? g.pass++ : g.fail++
    byGroup.set(r.group, g)
    if (!r.ok) console.log(`FAIL  [${r.group}] ${r.name}\n      ${(r.err as Error)?.message ?? r.err}`)
  }
  for (const [g, c] of byGroup) console.log(`${g.padEnd(16)} ${c.pass} passed${c.fail ? `, ${c.fail} FAILED` : ""}`)
  const failed = results.filter((r) => !r.ok).length
  console.log(`\nTOTAL: ${results.length - failed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
})()
