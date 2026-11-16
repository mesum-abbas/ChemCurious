import { PeriodicTable } from "@/components/periodic-table"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"
import { ELEMENT_CATEGORY_LEGEND } from "@/lib/element-categories"
import { Atom, Beaker, Grid3x3, Thermometer, Zap } from "lucide-react"

const HIGHLIGHTS = [
  { icon: Atom, title: "118 Elements", text: "Complete periodic table with all known elements" },
  { icon: Beaker, title: "Element Groups", text: "Color-coded by chemical properties and behavior" },
  { icon: Zap, title: "Properties", text: "Atomic mass, electron configuration, and more" },
  { icon: Thermometer, title: "States", text: "Solid, liquid, gas, and synthetic elements" },
]

const CARD = "rounded-2xl border border-slate-200/80 bg-white shadow-sm"

export default function PeriodicTablePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <PageHeader
        eyebrow="Interactive Periodic Table"
        eyebrowIcon={Grid3x3}
        title={
          <>
            Explore the <span className="text-primary">Elements</span>
          </>
        }
        description="Discover the properties, uses, and history of chemical elements. Click on any element to learn more about its characteristics and role in chemistry."
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 pb-16 pt-8 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className={`${CARD} p-4 sm:p-5`}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100">
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </span>
                <h2 className="font-serif text-sm font-bold text-slate-900">{title}</h2>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>

        <section className={`${CARD} p-5 sm:p-6`} aria-labelledby="legend-heading">
          <h2 id="legend-heading" className="font-serif text-lg font-bold text-slate-900">
            Element Categories
          </h2>
          <p className="mt-1 text-sm text-slate-500">Understanding the color-coded groups in the periodic table</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {ELEMENT_CATEGORY_LEGEND.map(({ name, swatch }) => (
              <li
                key={name}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${swatch}`} aria-hidden />
                {name}
              </li>
            ))}
          </ul>
        </section>

        <PeriodicTable />

        <section className={`${CARD} p-5 sm:p-6`} aria-labelledby="facts-heading">
          <h2 id="facts-heading" className="font-serif text-lg font-bold text-slate-900">
            Did You Know?
          </h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold text-slate-900">Periodic Law</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                The periodic table is organized by atomic number, and elements with similar properties appear at regular
                intervals.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-slate-900">New Elements</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Scientists continue to discover new superheavy elements, with the most recent additions being elements
                113-118.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
