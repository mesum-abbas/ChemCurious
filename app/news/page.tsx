import type { Metadata } from "next"
import { Microscope } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { FloatingChemIcons, type FloatingItem } from "@/components/home/chem-icons"
import { NewsFeed } from "@/components/news/news-feed"
import { NewsletterBanner } from "@/components/news/newsletter-banner"

export const metadata: Metadata = {
  title: "Chemistry News & Discoveries — ChemCurious",
  description:
    "Daily chemistry breakthroughs from ScienceDaily, Chemistry World and Phys.org: new materials, synthesis, biochemistry and green chemistry.",
}

// Header band only: desktop icons sit in the side gutters, phones get small corner icons.
const HEADER_ICONS: FloatingItem[] = [
  { kind: "bubblingFlask", className: "hidden lg:block left-[4%] top-[22%] w-16", dur: 16, delay: -2, rot: -10 },
  { kind: "benzene", className: "hidden lg:block right-[6%] top-[18%] w-14", dur: 20, delay: -6, rot: 12, spin: 22 },
  { kind: "atom", className: "hidden lg:block left-[9%] top-[62%] w-16", dur: 24, delay: -9, spin: 36 },
  { kind: "tube", className: "hidden lg:block right-[3%] top-[58%] w-12", dur: 18, delay: -4, rot: 26 },
  { kind: "text", text: "H₂O", className: "hidden lg:block left-[20%] top-[12%] text-2xl", dur: 19, delay: -5, rot: -6 },
  { kind: "text", text: "CO₂", className: "hidden lg:block right-[18%] top-[9%] text-2xl", dur: 21, delay: -11, rot: 8 },
  { kind: "text", text: "NaCl", className: "hidden xl:block right-[6%] top-[80%] text-xl", dur: 22, delay: -13, rot: -8 },
  { kind: "benzene", className: "lg:hidden left-[4%] top-[80px] w-9", dur: 20, delay: -6, spin: 22 },
  { kind: "text", text: "CO₂", className: "lg:hidden right-[5%] top-[86px] text-lg", dur: 21, delay: -11 },
]

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

      <main className="relative -mt-[68px] flex-1 overflow-hidden bg-gradient-to-b from-[color-mix(in_oklch,var(--primary)_7%,white)] via-white to-slate-50/60 pt-[68px]">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px]">
          <FloatingChemIcons items={HEADER_ICONS} />
        </div>
        <FloatingChemIcons items={CONTENT_ICONS} className="top-[560px]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
          <header className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur">
              <Microscope className="h-3.5 w-3.5" aria-hidden />
              Live chemistry pulse
            </span>
            <h1 className="mt-6 font-serif text-4xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
              Latest Discoveries in{" "}
              <span className="bg-gradient-to-r from-primary via-teal-500 to-cyan-500 bg-clip-text text-transparent">Chemistry</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Stay updated with daily breakthroughs, newly synthesized elements, material science milestones, and global research.
            </p>
          </header>

          <div className="mt-10">
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
