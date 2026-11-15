import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { FloatingChemIcons, type FloatingItem } from "@/components/home/chem-icons"
import { ConceptLab } from "@/components/concepts/concept-lab"

export const metadata: Metadata = {
  title: "Concept Lab — ChemCurious",
  description:
    "Learn core chemistry visually: Rutherford's gold foil experiment, ionic vs covalent bonding, states of matter and the pH scale — with interactive simulations.",
}

// Header band only (the header text is left-aligned, so the line-art lives on the right)
const HEADER_ICONS: FloatingItem[] = [
  { kind: "atom", className: "hidden lg:block right-[3%] top-[34%] w-16", dur: 24, delay: -7, spin: 36 },
  { kind: "bubblingFlask", className: "hidden lg:block right-[13%] top-[46%] w-12", dur: 16, delay: -2, rot: -10 },
  { kind: "benzene", className: "hidden xl:block right-[24%] top-[30%] w-12", dur: 20, delay: -5, rot: 12, spin: 22 },
  { kind: "text", text: "NaCl", className: "hidden xl:block right-[31%] top-[62%] text-xl", dur: 22, delay: -10, rot: 8 },
  { kind: "text", text: "H₂O", className: "hidden xl:block right-[20%] top-[72%] text-2xl", dur: 19, delay: -4, rot: -6 },
  { kind: "flask", className: "lg:hidden right-[5%] top-[80px] w-9", dur: 16, delay: -2, rot: -10 },
  { kind: "text", text: "CO₂", className: "lg:hidden right-[20%] top-[88px] text-lg", dur: 21, delay: -8 },
]

// Side gutters next to the studio on very wide screens only
const CONTENT_ICONS: FloatingItem[] = [
  { kind: "beaker", className: "hidden 2xl:block left-[1.5%] top-[14%] w-12", dur: 17, delay: -3, rot: -8 },
  { kind: "dna", className: "hidden 2xl:block right-[1.5%] top-[30%] w-12", dur: 21, delay: -8, rot: 14 },
  { kind: "text", text: "CH₄", className: "hidden 2xl:block left-[2%] top-[56%] text-xl", dur: 20, delay: -6 },
]

export default function ConceptsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="relative -mt-[68px] flex-1 overflow-x-clip bg-gradient-to-b from-[color-mix(in_oklch,var(--primary)_7%,white)] via-white to-slate-50/60 pt-[68px]">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[290px]">
          <FloatingChemIcons items={HEADER_ICONS} />
        </div>
        <FloatingChemIcons items={CONTENT_ICONS} className="top-[300px]" />

        <div className="relative mx-auto max-w-[88rem] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
          <header className="max-w-3xl">
            <h1 className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
              Concept <span className="text-primary">Lab</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Short lessons on the experiments and laws that shaped chemistry, each with a working model you can test for yourself.
            </p>
          </header>

          <div className="mt-8 sm:mt-10">
            <ConceptLab />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
