"use client"

import { ArrowRight } from "lucide-react"
import { conceptsData, POPULAR_CONCEPT_IDS } from "@/lib/concepts/data"
import { AtomBuilder } from "./atom-builder"

const GUIDE = [
  { title: "Pick a topic", body: "Choose an experiment or idea from the list of topics." },
  { title: "Follow the steps", body: "Read the breakdown and tap each step to see it happen in the lab." },
  { title: "Change the variables", body: "Use the sliders, switches and buttons, and watch what changes." },
]

export function ConceptOverview({ onSelect }: { onSelect: (id: string) => void }) {
  const popular = POPULAR_CONCEPT_IDS.map((id) => conceptsData.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c)

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8">
      <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm sm:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Start here</p>
        <h2 className="mt-2 font-serif text-2xl font-bold leading-tight text-slate-900">See the chemistry, then explain it</h2>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-600">
          <p>
            A textbook can tell you that most of an atom is empty space, or that squeezing a gas raises its pressure. It is much easier to
            believe — and remember — once you have watched it happen.
          </p>
          <p>
            Each topic here pairs a short explanation with a small working model. The models are simplified, but the behaviour is real:
            change a variable and the result follows the same rules the textbook describes.
          </p>
        </div>

        <ol className="mt-6 space-y-3">
          {GUIDE.map((g, i) => (
            <li key={g.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{i + 1}</span>
              <span>
                <span className="block font-semibold text-slate-900">{g.title}</span>
                <span className="block text-sm text-slate-600">{g.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-7 border-t border-slate-100 pt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Popular starting points</p>
          <ul className="mt-3 space-y-2">
            {popular.map((c) => {
              const Icon = c.icon
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-colors hover:border-primary/40 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.accent}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900 group-hover:text-primary">{c.title}</span>
                      <span className="block truncate text-xs text-slate-500">{c.level}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-3 text-sm text-slate-600">Warm up: build an atom, then turn it into an isotope or an ion.</p>
        <AtomBuilder />
      </div>
    </div>
  )
}
