// Chemistry news tests — run with: npx tsx scripts/test-news.ts  (mocked fetch, no network)
import assert from "node:assert/strict"
import { parseFeed, htmlToText } from "../lib/news/rss"
import { categorize } from "../lib/news/categorize"

let pass = 0
let fail = 0
async function test(name: string, fn: () => unknown | Promise<unknown>) {
  try {
    await fn()
    pass++
    console.log(`PASS  ${name}`)
  } catch (e) {
    fail++
    console.log(`FAIL  ${name}\n      ${(e as Error).message}`)
  }
}

const rss = (items: string) => `<?xml version="1.0"?><rss version="2.0"><channel><title>T</title>${items}</channel></rss>`
const item = (title: string, link: string, date: string, desc = "Summary") =>
  `<item><title>${title}</title><link>${link}</link><description>${desc}</description><pubDate>${date}</pubDate></item>`

;(async () => {
  // ---------------- parser ----------------
  await test("parses RSS 2.0 items (title, link, description, pubDate, categories)", () => {
    const items = parseFeed(rss(`<item><title>A</title><link>https://x.org/a</link><description>D</description><pubDate>Fri, 13 Nov 2026 20:20:01 EST</pubDate><category>Materials Science</category></item>`))
    assert.equal(items.length, 1)
    assert.deepEqual(items[0], { title: "A", link: "https://x.org/a", description: "D", pubDate: "Fri, 13 Nov 2026 20:20:01 EST", guid: undefined, categories: ["Materials Science"] })
  })
  await test("CDATA + HTML in description is stripped to plain text", () => {
    const [i] = parseFeed(rss(item("T", "https://x.org/t", "Fri, 13 Nov 2026 00:00:00 GMT", "<![CDATA[<p>Hello <b>world</b><img src=x onerror=alert(1)></p><script>bad()</script>]]>")))
    assert.equal(i!.description, "Hello world")
  })
  await test("numeric + named entities decoded (&#039; &amp; &#x2192; &deg;)", () => {
    assert.equal(htmlToText("device&#039;s A &amp; B &#x2192; 25&deg;C"), "device's A & B → 25°C")
  })
  await test("entity-encoded markup (&lt;p&gt;) is decoded then stripped", () => {
    assert.equal(htmlToText("&lt;p&gt;New &lt;em&gt;catalyst&lt;/em&gt;&lt;/p&gt;"), "New catalyst")
  })
  await test("Atom feeds are supported", () => {
    const xml = `<feed><entry><title>Atom A</title><link rel="alternate" href="https://x.org/atom"/><summary>S</summary><published>2026-11-14T10:00:00Z</published></entry></feed>`
    const [i] = parseFeed(xml)
    assert.equal(i!.link, "https://x.org/atom")
    assert.equal(i!.pubDate, "2026-11-14T10:00:00Z")
  })
  await test("items without a title or with a non-http link are dropped", () => {
    assert.equal(parseFeed(rss(item("", "https://x.org/a", "x") + item("B", "javascript:alert(1)", "x"))).length, 0)
  })

  // ---------------- categoriser ----------------
  await test("categorises materials / organic / biochem / green / general", () => {
    assert.equal(categorize("New perovskite crystal boosts semiconductor efficiency", ""), "Elements & Materials")
    assert.equal(categorize("Chemists achieve one-step synthesis of chiral molecules", "using a new catalyst"), "Organic & Synthesis")
    assert.equal(categorize("Enzyme reveals how proteins fold inside cells", ""), "Biochemistry")
    assert.equal(categorize("Turning plastic waste into clean hydrogen fuel", "a sustainable recycling route"), "Green Chemistry")
    assert.equal(categorize("Researchers win award", "ceremony held in Paris"), "General Discovery")
  })
  await test("feed <category> tags weigh in", () => {
    assert.equal(categorize("A surprising result", "", ["Materials Science"]), "Elements & Materials")
  })

  // ---------------- aggregator (mocked fetch) ----------------
  const realFetch = globalThis.fetch
  const now = Date.now()
  const d = (hoursAgo: number) => new Date(now - hoursAgo * 3600_000).toUTCString()
  let mode: "ok" | "fail" = "ok"
  let calls = 0
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls++
    const url = String(input)
    if (mode === "fail" || url.includes("chemistryworld")) return new Response("", { status: 202 }) // like the real CW response
    if (url.includes("phys.org"))
      return new Response(rss(item("Phys newest", "https://phys.org/n1?utm_source=rss", d(1)) + item("Shared story", "https://example.org/shared", d(5))))
    return new Response(rss(item("SD older", "https://www.sciencedaily.com/r1.htm#frag", d(3)) + item("Shared story", "https://example.org/shared", d(5))))
  }) as typeof fetch

  const feed = await import("../lib/news/feed")

  await test("merges feeds, de-duplicates, sorts newest-first, strips utm/hash, skips failed source", async () => {
    const p = await feed.getChemistryNews()
    assert.equal(p.status, "live")
    assert.deepEqual(p.articles.map((a) => a.title), ["Phys newest", "SD older", "Shared story"])
    assert.equal(p.articles[0]!.link, "https://phys.org/n1")
    assert.equal(p.articles[1]!.link, "https://www.sciencedaily.com/r1.htm")
    assert.equal(p.sources.find((s) => s.name === "Chemistry World")!.ok, false)
    assert.ok(p.articles.every((a) => /^[0-9a-f]{16}$/.test(a.id)))
  })
  await test("second call within an hour is served from cache (no new fetches)", async () => {
    const before = calls
    const p = await feed.getChemistryNews()
    assert.equal(p.status, "cached")
    assert.equal(calls, before)
  })

  await test("refresh failure after expiry serves the last good data as 'stale'", async () => {
    feed.__newsCacheTestHooks.expire()
    mode = "fail"
    const p = await feed.getChemistryNews()
    assert.equal(p.status, "stale")
    assert.equal(p.articles[0]!.title, "Phys newest")
  })
  await test("no feed ever loaded -> clearly-labelled fallback links to real source pages", async () => {
    feed.__newsCacheTestHooks.reset()
    mode = "fail"
    const p = await feed.getChemistryNews()
    assert.equal(p.status, "fallback")
    assert.equal(p.articles.length, 3)
    for (const a of p.articles) {
      assert.match(a.link, /^https:\/\/(phys\.org|www\.sciencedaily\.com|www\.chemistryworld\.com)\//)
      assert.equal(a.category, "General Discovery")
    }
  })
  await test("feed timeouts are aborted (no hanging request)", async () => {
    feed.__newsCacheTestHooks.reset()
    globalThis.fetch = ((_: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_, reject) => init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))))) as typeof fetch
    const t = Date.now()
    const p = await feed.getChemistryNews()
    assert.equal(p.status, "fallback")
    assert.ok(Date.now() - t < 9500, `took ${Date.now() - t}ms`)
  })

  globalThis.fetch = realFetch
  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
})()
