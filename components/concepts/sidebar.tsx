"use client"

import { LayoutGrid, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CONCEPT_CATEGORIES, conceptsData, type Concept } from "@/lib/concepts/data"

function matches(c: Concept, q: string, categoryTitle: string) {
  if (!q) return true
  // Titles, category and level only — matching inside summaries gives surprising results
  const hay = `${c.title} ${c.shortTitle} ${categoryTitle} ${c.level}`.toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word))
}

export function ConceptSidebar({
  activeId,
  onSelect,
  query,
  onQueryChange,
  idPrefix = "sb",
}: {
  activeId: string | null
  onSelect: (id: string | null) => void
  query: string
  onQueryChange: (q: string) => void
  /** keeps ids unique when the sidebar is rendered twice (desktop + mobile drawer) */
  idPrefix?: string
}) {
  const groups = CONCEPT_CATEGORIES.map((cat) => ({
    ...cat,
    items: conceptsData.filter((c) => c.category === cat.id && matches(c, query.trim(), cat.title)),
  })).filter((g) => g.items.length > 0)

  return (
    <nav aria-label="Topics" className="flex h-full flex-col">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <label htmlFor={`${idPrefix}-search`} className="sr-only">
          Filter topics
        </label>
        <input
          id={`${idPrefix}-search`}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Filter topics"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button type="button" onClick={() => onQueryChange("")} aria-label="Clear filter" className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-current={activeId === null ? "page" : undefined}
        className={cn(
          "mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
          activeId === null ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
        )}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        Overview
      </button>

      <div className="mt-4 space-y-5">
        {groups.map((g) => {
          const CatIcon = g.icon
          return (
            <div key={g.id}>
              <p className="flex items-center gap-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <CatIcon className="h-3.5 w-3.5" aria-hidden />
                {g.title}
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {g.items.map((c) => {
                  const active = c.id === activeId
                  const Icon = c.icon
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(c.id)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex w-full items-center gap-2.5 rounded-lg border-l-2 py-2 pl-3 pr-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active ? "border-primary bg-primary/[0.07] font-semibold text-primary" : "border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-slate-400 group-hover:text-slate-600")} aria-hidden />
                        <span className="min-w-0 leading-snug">{c.shortTitle}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
        {groups.length === 0 && <p className="px-3 text-sm text-slate-500">No topics match &ldquo;{query}&rdquo;.</p>}
      </div>
    </nav>
  )
}
