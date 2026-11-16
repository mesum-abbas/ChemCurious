import { MolecularViewer } from "@/components/molecular-viewer"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"
import { Atom } from "lucide-react"

export default function MoleculesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <PageHeader
        width="max-w-7xl 2xl:max-w-[1550px]"
        eyebrow="3D Molecular Viewer"
        eyebrowIcon={Atom}
        title={
          <>
            Explore Molecules in <span className="text-primary">3D</span>
          </>
        }
        description="Interact directly with spatial molecular structures. Search any chemical name or formula, rotate conformers, inspect atomic bonds, and analyze 3D geometry."
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 2xl:max-w-[1550px]">
        <MolecularViewer />
      </main>

      <Footer />
    </div>
  )
}
