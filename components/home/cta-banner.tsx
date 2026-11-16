import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"
import { LinkPendingIcon } from "@/components/link-pending-icon"
import { FloatingChemIcons, type FloatingItem } from "./chem-icons"

const CTA_BG: FloatingItem[] = [
  { kind: "flask", className: "left-[4%] top-[14px] w-10 sm:left-[6%] sm:top-[18%] sm:w-16 lg:w-20", dur: 17, delay: -3, rot: -14 },
  { kind: "tube", className: "right-[5%] top-[16px] w-8 sm:right-[8%] sm:top-[12%] sm:w-12 lg:w-14", dur: 19, delay: -7, rot: 24 },
  { kind: "molecule", className: "hidden lg:block left-[12%] bottom-[10%] w-20", dur: 22, delay: -1, spin: 20 },
  { kind: "molecule", className: "right-[4%] bottom-[12px] w-10 sm:right-[10%] sm:bottom-[12%] sm:w-14 lg:w-16", dur: 20, delay: -10, rot: 30, spin: -16 },
  { kind: "benzene", className: "hidden md:block left-[42%] -top-4 w-14", dur: 24, delay: -5, spin: 25 },
  { kind: "atom", className: "hidden md:block right-[34%] -bottom-6 w-20", dur: 26, delay: -12, spin: 40 },
]

export function CtaBanner() {
  return (
    <section aria-labelledby="cta-heading" className="relative isolate overflow-hidden bg-primary">
      <FloatingChemIcons items={CTA_BG} className="-z-10" itemClassName="text-white" defaultOpacity={0.18} />

      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
          <Zap className="h-3.5 w-3.5 fill-current text-amber-300" aria-hidden />
          Start experimenting today
        </span>

        <h2 id="cta-heading" className="mt-6 font-serif text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
          Ready to master chemistry in interactive 3D?
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-teal-50/90 sm:text-lg">
          Visualize complex molecular structures, explore all 118 elements, and run virtual lab reactions right from your
          browser.
        </p>

        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/molecules"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-teal-800 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 active:translate-y-0 active:scale-[0.98]"
          >
            Launch 3D Lab
            <LinkPendingIcon>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </LinkPendingIcon>
          </Link>
          <Link
            href="/periodic"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/60 bg-white/5 px-7 text-base font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 active:translate-y-0 active:scale-[0.98]"
          >
            Explore Periodic Table
            <LinkPendingIcon />
          </Link>
        </div>
      </div>
    </section>
  )
}
