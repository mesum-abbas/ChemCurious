import type { Metadata } from "next"
import { Microscope } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { FloatingChemIcons, type FloatingItem } from "@/components/home/chem-icons"
import { PageHeader } from "@/components/page-header"
import { NewsFeed } from "@/components/news/news-feed"
import { NewsletterBanner } from "@/components/news/newsletter-banner"

export const metadata: Metadata = {
  title: "Chemistry News & Discoveries — ChemCurious",
  description:
    "Daily chemistry breakthroughs from ScienceDaily, Chemistry World and Phys.org: new materials, synthesis, biochemistry and green chemistry.",
}

// Content band: gutter icons beside the grid on wide screens only
const CONTENT_ICONS: FloatingItem[] = [
  { kind: "beaker", className: "hidden xl:block left-[1.5%] top-[18%] w-12", dur: 17, delay: -3, rot: -8 },
  { kind: "dna", className: "hidden xl:block right-[1.5%] top-[34%] w-12", dur: 21, delay: -8, rot: 14 },
  { kind: "flask", className: "hidden xl:block left-[1.5%] top-[58%] w-12", dur: 16, delay: -10, rot: -12 },
  { kind: "text", text: "CH₄", className: "hidden xl:block right-[2%] top-[72%] text-xl", dur: 20, delay: -6 },
]

export default function NewsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <PageHeader
        align="center"
        width="max-w-6xl"
        eyebrow="Live chemistry pulse"
        eyebrowIcon={Microscope}
        title={
          <>
            Latest Discoveries in <span className="text-primary">Chemistry</span>
          </>
        }
        description="Stay updated with daily breakthroughs, newly synthesized elements, material science milestones, and global research."
      />

      <main className="relative flex-1 overflow-hidden">
        <FloatingChemIcons items={CONTENT_ICONS} />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
          <div>
            <NewsFeed />
          </div>

          <p className="mt-12 text-center text-xs text-slate-400">
            Every headline links to its original publisher. Sources: ScienceDaily, Phys.org and Chemistry World (when its feed is reachable).
          </p>
        </div>
      </main>

      <NewsletterBanner />
      <Footer />
    </div>
  )
}
