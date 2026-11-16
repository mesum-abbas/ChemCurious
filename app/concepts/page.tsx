import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { FloatingChemIcons, type FloatingItem } from "@/components/home/chem-icons"
import { PageHeader } from "@/components/page-header"
import { ConceptLab } from "@/components/concepts/concept-lab"

export const metadata: Metadata = {
  title: "Concept Lab — ChemCurious",
  description:
    "Learn core chemistry visually: Rutherford's gold foil experiment, ionic vs covalent bonding, states of matter and the pH scale — with interactive simulations.",
}

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

      <PageHeader
        width="max-w-[88rem]"
        title={
          <>
            Concept <span className="text-primary">Lab</span>
          </>
        }
        description="Short lessons on the experiments and laws that shaped chemistry, each with a working model you can test for yourself."
      />

      <main className="relative flex-1 overflow-x-clip">
        <FloatingChemIcons items={CONTENT_ICONS} />

        <div className="relative mx-auto max-w-[88rem] px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
          <div>
            <ConceptLab />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
