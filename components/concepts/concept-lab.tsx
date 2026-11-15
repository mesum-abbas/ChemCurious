"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle2, ChevronRight, Eye, Lightbulb, ListTree, MousePointerClick, Sigma } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CONCEPT_CATEGORIES, findConcept, type Concept } from "@/lib/concepts/data"
import { VISUALS } from "./visual-registry"
import { ConceptSidebar } from "./sidebar"
import { ConceptOverview } from "./overview"

function readConceptFromUrl(): string | null {
  const id = new URLSearchParams(window.location.search).get("concept")
  return findConcept(id) ? id : null
}

export function ConceptLab() {
  const [conceptId, setConceptId] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [stepNonce, setStepNonce] = useState(0)
  const [query, setQuery] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const workspaceRef = useRef<HTMLDivElement>(null)

  // URL is the source of truth: ?concept=<id>, or the Overview when absent. Back/forward work too.
  useEffect(() => {
    setConceptId(readConceptFromUrl())
    const onPop = () => {
      setConceptId(readConceptFromUrl())
      setActiveStep(null)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const select = useCallback((id: string | null) => {
    setDrawerOpen(false)
    setActiveStep(null)
    setConceptId(id)
    const url = new URL(window.location.href)
    if (id) url.searchParams.set("concept", id)
    else url.searchParams.delete("concept")
    if (url.toString() !== window.location.href) window.history.pushState(null, "", url)
    // Bring the workspace into view if the user is scrolled further down (e.g. on mobile)
    const el = workspaceRef.current
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const concept = findConcept(conceptId)
  const sidebarProps = { activeId: concept?.id ?? null, onSelect: select, query, onQueryChange: setQuery }

  return (
    <div className="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur [scrollbar-width:thin]">
          <ConceptSidebar {...sidebarProps} idPrefix="desk" />
        </div>
      </aside>

      {/* Mobile topic picker */}
      <div className="mb-5 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
          aria-haspopup="dialog"
        >
          <ListTree className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Topic</span>
            <span className="block truncate font-semibold text-slate-900">{concept ? concept.shortTitle : "Overview"}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        </button>
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" className="w-[86%] max-w-xs overflow-y-auto p-4">
            <SheetHeader className="p-0 pb-3 text-left">
              <SheetTitle className="font-serif text-lg">Topics</SheetTitle>
              <SheetDescription className="sr-only">Choose a chemistry topic</SheetDescription>
            </SheetHeader>
            <ConceptSidebar {...sidebarProps} idPrefix="mob" />
          </SheetContent>
        </Sheet>
      </div>

      {/* Workspace */}
      <div ref={workspaceRef} className="min-w-0 scroll-mt-24">
        {concept ? (
          <Lesson key={concept.id} concept={concept} activeStep={activeStep} stepNonce={stepNonce} onStep={(i) => { setActiveStep(i); setStepNonce((n) => n + 1) }} />
        ) : (
          <ConceptOverview onSelect={select} />
        )}
      </div>
    </div>
  )
}

function Lesson({ concept, activeStep, stepNonce, onStep }: { concept: Concept; activeStep: number | null; stepNonce: number; onStep: (i: number) => void }) {
  const Visual = VISUALS[concept.visual]
  const Icon = concept.icon
  const category = CONCEPT_CATEGORIES.find((c) => c.id === concept.category)

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8">
      {/* Left: explanation */}
      <article className="min-w-0">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-7">
          <p className="text-xs font-semibold text-slate-500">{category?.title}</p>
          <div className="mt-2 flex items-start gap-3">
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", concept.accent)}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{concept.title}</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">{concept.level}</p>
            </div>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{concept.summary}</p>

          <div className="mt-6">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
              Step by step — tap a step to see it in the lab
            </p>
            <ol className="mt-3 space-y-2.5">
              {concept.steps.map((s, i) => {
                const active = activeStep === i
                return (
                  <li key={s.title}>
                    <button
                      type="button"
                      onClick={() => onStep(i)}
                      aria-pressed={active}
                      className={cn(
                        "group flex w-full gap-3 rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "border-primary/40 bg-primary/[0.05]" : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors", active ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600")}>
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block font-semibold", active ? "text-primary" : "text-slate-900")}>{s.title}</span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-slate-600">{s.body}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          {concept.formula && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Sigma className="h-3.5 w-3.5" aria-hidden />
                Key formula
              </p>
              <p className="mt-2 font-serif text-xl font-bold text-slate-900">{concept.formula.expression}</p>
              <p className="mt-1 text-sm text-slate-600">{concept.formula.caption}</p>
            </div>
          )}

          <div className="mt-6">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Eye className="h-3.5 w-3.5" aria-hidden />
              Key observations
            </p>
            <ul className="mt-3 space-y-2">
              {concept.observations.map((o) => (
                <li key={o} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {o}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 border-l-4 border-amber-400 bg-amber-50/70 py-3 pl-4 pr-3">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
              <Lightbulb className="h-4 w-4" aria-hidden />
              Key takeaway
            </p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-800">{concept.takeaway}</p>
          </div>
        </div>
      </article>

      {/* Right: interactive lab */}
      <div className="min-w-0">
        <div className="xl:sticky xl:top-24">
          <p className="mb-3 text-sm text-slate-600">{concept.tryIt}</p>
          <Visual activeStep={activeStep} stepNonce={stepNonce} />
        </div>
      </div>
    </div>
  )
}
