// Server-only chemistry news aggregator: fetch RSS feeds in parallel, merge, de-duplicate,
// sort newest-first, categorise, and cache in memory for 1 hour.
import crypto from "crypto"
import { parseFeed } from "./rss"
import { categorize, type NewsCategory } from "./categorize"

export interface NewsArticle {
  id: string
  title: string
  summary: string
  link: string
  pubDate: string // ISO 8601
  source: string
  category: NewsCategory
}

export interface NewsPayload {
  articles: NewsArticle[]
  /** "live": fresh fetch; "cached": within the 1-hour window; "stale": refresh failed, last good data;
   *  "fallback": no feed has loaded yet — articles are links to the sources' news pages. */
  status: "live" | "cached" | "stale" | "fallback"
  fetchedAt: string
  sources: Array<{ name: string; ok: boolean; count: number }>
}

const FEEDS = [
  { name: "ScienceDaily", url: "https://www.sciencedaily.com/rss/matter_energy/chemistry.xml" },
  { name: "ScienceDaily", url: "https://www.sciencedaily.com/rss/matter_energy/organic_chemistry.xml" },
  { name: "ScienceDaily", url: "https://www.sciencedaily.com/rss/matter_energy/inorganic_chemistry.xml" },
  { name: "Chemistry World", url: "https://www.chemistryworld.com/413.rss" },
  { name: "Phys.org", url: "https://phys.org/rss-feed/chemistry-news/" },
] as const

const CACHE_TTL_MS = 60 * 60 * 1000
const FEED_TIMEOUT_MS = 8000
const MAX_ARTICLES = 90
const MAX_SUMMARY = 320
// Honest client identification (no browser impersonation). Sites that refuse it are simply skipped.
const USER_AGENT = "ChemCuriousNews/1.0 (educational RSS reader)"

/** Shown only if no feed has ever loaded on this server: real links to each source's chemistry news page. */
const FALLBACK: NewsArticle[] = [
  {
    id: "fallback-physorg",
    title: "Browse today's chemistry headlines on Phys.org",
    summary: "Daily coverage of chemistry research — materials science, biochemistry, polymers, analytical and physical chemistry — from universities and labs worldwide.",
    link: "https://phys.org/chemistry-news/",
    source: "Phys.org",
    category: "General Discovery",
  },
  {
    id: "fallback-sciencedaily",
    title: "Explore the latest chemistry research news on ScienceDaily",
    summary: "Research summaries on organic, inorganic and environmental chemistry, written from university and institute press releases.",
    link: "https://www.sciencedaily.com/news/matter_energy/chemistry/",
    source: "ScienceDaily",
    category: "General Discovery",
  },
  {
    id: "fallback-chemistryworld",
    title: "Read news and features from Chemistry World",
    summary: "The Royal Society of Chemistry's magazine: research news, analysis and features across the chemical sciences.",
    link: "https://www.chemistryworld.com/news",
    source: "Chemistry World",
    category: "General Discovery",
  },
].map((a): NewsArticle => ({ ...a, category: "General Discovery", pubDate: new Date(0).toISOString() }))

let cache: { payload: NewsPayload; at: number } | null = null
let inflight: Promise<NewsPayload> | null = null

function shorten(text: string, max = MAX_SUMMARY): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40)).replace(/[,;:.\s]+$/, "")}…`
}

function normalizeLink(link: string): string {
  try {
    const u = new URL(link)
    u.hash = ""
    for (const p of [...u.searchParams.keys()]) if (/^utm_/i.test(p)) u.searchParams.delete(p)
    return u.toString()
  } catch {
    return link
  }
}

async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<NewsArticle[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS)
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8" },
      signal: controller.signal,
      cache: "no-store",
    })
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    return parseFeed(xml).map((item) => {
      const link = normalizeLink(item.link)
      const time = Date.parse(item.pubDate)
      return {
        id: crypto.createHash("sha1").update(link).digest("hex").slice(0, 16),
        title: item.title,
        summary: shorten(item.description),
        link,
        pubDate: new Date(Number.isNaN(time) ? Date.now() : time).toISOString(),
        source: feed.name,
        category: categorize(item.title, item.description, item.categories),
      }
    })
  } finally {
    clearTimeout(timer)
  }
}

async function refresh(): Promise<NewsPayload> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed))

  const byLink = new Map<string, NewsArticle>()
  const sourceStats = new Map<string, { ok: boolean; count: number }>()
  results.forEach((r, i) => {
    const name = FEEDS[i]!.name
    const stat = sourceStats.get(name) ?? { ok: false, count: 0 }
    if (r.status === "fulfilled") {
      stat.ok = true
      for (const a of r.value) {
        if (!byLink.has(a.link)) {
          byLink.set(a.link, a)
          stat.count++
        }
      }
    } else {
      console.warn(`[news] ${name} feed failed: ${(r.reason as Error)?.message ?? "error"}`)
    }
    sourceStats.set(name, stat)
  })

  const articles = [...byLink.values()]
    .sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate))
    .slice(0, MAX_ARTICLES)
  const sources = [...sourceStats].map(([name, s]) => ({ name, ...s }))

  if (articles.length === 0) {
    // Every feed failed: keep serving the last good data if we have it
    if (cache) return { ...cache.payload, status: "stale", sources }
    return { articles: FALLBACK, status: "fallback", fetchedAt: new Date().toISOString(), sources }
  }

  const payload: NewsPayload = { articles, status: "live", fetchedAt: new Date().toISOString(), sources }
  cache = { payload, at: Date.now() }
  return payload
}

/** Test helpers: clear the cache, or age it past the TTL so the next call refreshes. */
export const __newsCacheTestHooks = {
  reset: () => {
    cache = null
    inflight = null
  },
  expire: () => {
    if (cache) cache.at = 0
  },
}

export async function getChemistryNews(): Promise<NewsPayload> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return { ...cache.payload, status: "cached" }
  // Concurrent requests share one refresh
  inflight ??= refresh().finally(() => {
    inflight = null
  })
  return inflight
}
