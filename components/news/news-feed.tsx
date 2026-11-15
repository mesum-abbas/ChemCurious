"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowRight, ArrowUpRight, Clock, Info, RefreshCw, Search, SearchX, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NewsArticle, NewsPayload } from "@/lib/news/feed"
import { NEWS_CATEGORIES } from "@/lib/news/categorize"

const PAGE_SIZE = 9
const FILTERS = ["All Discoveries", ...NEWS_CATEGORIES] as const
type Filter = (typeof FILTERS)[number]

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const

const SOURCE_TONE: Record<string, string> = {
  ScienceDaily: "bg-sky-50 text-sky-700 ring-sky-200",
  "Phys.org": "bg-violet-50 text-violet-700 ring-violet-200",
  "Chemistry World": "bg-teal-50 text-teal-700 ring-teal-200",
}
const CATEGORY_TONE: Record<string, string> = {
  "Elements & Materials": "bg-blue-50 text-blue-700",
  "Organic & Synthesis": "bg-purple-50 text-purple-700",
  Biochemistry: "bg-rose-50 text-rose-700",
  "Green Chemistry": "bg-emerald-50 text-emerald-700",
  "General Discovery": "bg-slate-100 text-slate-600",
}

function relativeTime(iso: string, now: number): string {
  const diff = now - Date.parse(iso)
  const min = Math.round(diff / 60_000)
  if (min < 1) return "Just now"
  if (min < 60) return `${min} min ago`
  const hours = Math.round(min / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.round(hours / 24)
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return shortDate(iso)
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

function SourcePill({ source, className }: { source: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1", SOURCE_TONE[source] ?? "bg-slate-50 text-slate-700 ring-slate-200", className)}>
      {source}
    </span>
  )
}

// ---------------------------------------------------------------------------

function FeaturedCard({ article, now, showDate }: { article: NewsArticle; now: number; showDate: boolean }) {
  return (
    <div className="relative">
      <div aria-hidden className="cc-glow-pulse absolute -inset-3 -z-10 rounded-[2rem] bg-primary/20 blur-2xl sm:-inset-5" />
      <a
        href={article.link}
        {...EXTERNAL}
        className="group relative block overflow-hidden rounded-2xl border border-primary/20 bg-white/90 p-6 shadow-[0_24px_60px_-28px_color-mix(in_oklch,var(--primary)_55%,transparent)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-8"
      >
        <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-sm shadow-primary/30">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Featured discovery
          </span>
          <SourcePill source={article.source} />
          {showDate && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              <time dateTime={article.pubDate}>{relativeTime(article.pubDate, now)}</time>
            </span>
          )}
        </div>
        <h2 className="relative mt-4 font-serif text-2xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-primary sm:text-3xl">
          {article.title}
        </h2>
        <p className="relative mt-3 line-clamp-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">{article.summary}</p>
        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3">
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", CATEGORY_TONE[article.category])}>{article.category}</span>
          <span className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all group-hover:shadow-xl group-hover:shadow-primary/40">
            Read Full Article
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </span>
        </div>
      </a>
    </div>
  )
}

function NewsCard({ article, showDate }: { article: NewsArticle; showDate: boolean }) {
  return (
    <a
      href={article.link}
      {...EXTERNAL}
      className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_-20px_color-mix(in_oklch,var(--primary)_45%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between gap-2">
        <SourcePill source={article.source} />
        {showDate && (
          <time dateTime={article.pubDate} className="shrink-0 text-xs text-slate-500">
            {shortDate(article.pubDate)}
          </time>
        )}
      </div>
      <h3 className="mt-3 line-clamp-3 font-serif text-[17px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-primary">
        {article.title}
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-500">{article.summary}</p>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <span className={cn("truncate rounded-full px-2.5 py-1 text-[11px] font-semibold", CATEGORY_TONE[article.category])}>{article.category}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
          Read Source
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </span>
      </div>
    </a>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm" aria-hidden>
      <div className="flex justify-between">
        <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-5 flex justify-between border-t border-slate-100 pt-4">
        <div className="h-5 w-28 animate-pulse rounded-full bg-slate-100" />
        <div className="h-5 w-20 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export function NewsFeed() {
  const [data, setData] = useState<NewsPayload | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("All Discoveries")
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [now, setNow] = useState(() => Date.now())

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/chemistry-news")
      if (!res.ok) throw new Error(String(res.status))
      setData((await res.json()) as NewsPayload)
      setNow(Date.now())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Reset pagination whenever the result set changes
  useEffect(() => setVisible(PAGE_SIZE), [query, filter])

  const articles = data?.articles ?? []
  const isFallback = data?.status === "fallback"

  const counts = useMemo(() => {
    const c: Record<string, number> = { "All Discoveries": articles.length }
    for (const a of articles) c[a.category] = (c[a.category] ?? 0) + 1
    return c
  }, [articles])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return articles.filter(
      (a) =>
        (filter === "All Discoveries" || a.category === filter) &&
        (!q || `${a.title} ${a.summary} ${a.source} ${a.category}`.toLowerCase().includes(q))
    )
  }, [articles, filter, query])

  const [featured, ...rest] = results
  const shown = rest.slice(0, visible)

  return (
    <div>
      {/* ---------- Controls ---------- */}
      <div className="mx-auto max-w-3xl">
        <div className="relative">
          {/* z-10: the input's backdrop-blur creates a stacking context that would paint over the icon */}
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
          <label htmlFor="news-search" className="sr-only">
            Search chemistry news
          </label>
          <input
            id="news-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search discoveries, elements, or topics..."
            className="h-14 w-full rounded-full border border-slate-200 bg-white/90 pl-12 pr-12 text-base text-slate-900 shadow-sm backdrop-blur placeholder:text-slate-400 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/15 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div role="tablist" aria-label="Filter by category" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => {
          const active = f === filter
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "border border-slate-200 bg-white/80 text-slate-600 hover:border-primary/40 hover:text-primary"
              )}
            >
              {f}
              {data && !isFallback && (
                <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-white/20" : "bg-slate-100 text-slate-500")}>
                  {counts[f] ?? 0}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ---------- Status notices ---------- */}
      {isFallback && (
        <div className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>Live news feeds are temporarily unavailable. In the meantime, browse the latest headlines directly on our sources below.</p>
        </div>
      )}
      {data?.status === "stale" && (
        <p className="mt-4 text-center text-xs text-slate-500">Showing the most recent saved headlines — live feeds will refresh shortly.</p>
      )}

      {/* ---------- Content ---------- */}
      <div className="mt-10" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="space-y-8">
            <div className="h-64 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80" aria-hidden />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <span className="sr-only">Loading the latest chemistry news…</span>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-slate-900">Couldn&apos;t load the news right now.</p>
            <p className="mt-1 text-sm text-slate-500">Check your connection and try again.</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-transform hover:-translate-y-0.5"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Try again
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
            <SearchX className="mx-auto h-8 w-8 text-slate-400" aria-hidden />
            <p className="mt-3 font-semibold text-slate-900">No discoveries match {query ? <>&ldquo;{query}&rdquo;</> : "this filter"}.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setFilter("All Discoveries")
              }}
              className="mt-4 text-sm font-semibold text-primary hover:underline"
            >
              Clear search and filters
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {featured && <FeaturedCard article={featured} now={now} showDate={!isFallback} />}

            {shown.length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {shown.map((a) => (
                  <NewsCard key={a.id} article={a} showDate={!isFallback} />
                ))}
              </div>
            )}

            {rest.length > visible ? (
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-300 bg-white px-7 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Load More Discoveries
                </button>
                <p className="text-xs text-slate-500">
                  Showing {shown.length + 1} of {results.length}
                </p>
              </div>
            ) : (
              results.length > 1 && <p className="text-center text-xs text-slate-500">You&apos;re all caught up — {results.length} discoveries shown.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
