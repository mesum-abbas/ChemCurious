import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FloatingChemIcons, type FloatingItem } from "./chem-icons"
import { FaqAccordion } from "./faq-accordion"
import { FAQ_ITEMS } from "./faq-data"

// Icons live in the side gutters (and are hidden on small screens) so they never sit behind the text.
const FAQ_ITEMS_BG: FloatingItem[] = [
  // Desktop (lg+): the FAQ column is max-w-3xl, leaving side gutters for the line-art
  { kind: "bubblingFlask", className: "hidden lg:block left-[4%] top-[14%] w-20", dur: 16, delay: -2, rot: -8 },
  { kind: "tube", className: "hidden lg:block right-[5%] top-[10%] w-14", dur: 18, delay: -6, rot: 28, spin: 10 },
  { kind: "benzene", className: "hidden lg:block left-[6%] top-[58%] w-14", dur: 22, delay: -9, rot: 12, spin: 24 },
  { kind: "atom", className: "hidden lg:block right-[3%] top-[48%] w-20", dur: 24, delay: -4, spin: 40 },
  { kind: "beaker", className: "hidden lg:block right-[7%] bottom-[8%] w-12", dur: 17, delay: -11, rot: -10 },
  { kind: "text", text: "H₂O", className: "hidden lg:block left-[8%] bottom-[10%] text-2xl", dur: 19, delay: -5, rot: -6 },
  { kind: "text", text: "NaCl", className: "hidden lg:block right-[10%] top-[30%] text-xl", dur: 21, delay: -13, rot: 8 },
  { kind: "text", text: "CH₄", className: "hidden lg:block left-[2%] top-[38%] text-xl", dur: 20, delay: -8, rot: 4 },
  // Phones & tablets: two small ones in the top corners, beside the centred label
  { kind: "bubblingFlask", className: "lg:hidden left-[4%] top-[16px] w-9", dur: 16, delay: -3, rot: -12 },
  { kind: "text", text: "H₂O", className: "lg:hidden right-[5%] top-[22px] text-base", dur: 19, delay: -7 },
]

export function FaqSection() {
  // FAQPage structured data (same text as the visible answers) for search-engine rich results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  }

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative overflow-hidden border-t border-slate-200/70 bg-white px-4 py-16 sm:py-24"
    >
      <FloatingChemIcons items={FAQ_ITEMS_BG} />

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-10 text-center sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Got questions?</p>
          <h2 id="faq-heading" className="mt-3 font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
            Everything you need to know about learning chemistry with ChemCurious.
          </p>
        </div>

        <FaqAccordion items={FAQ_ITEMS} />

        <p className="mt-10 text-center text-sm text-slate-600">
          Built for students, educators &amp; enthusiasts — carrying forward a legacy of inspiring chemistry education.{" "}
          <Link href="/about" className="group inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            Read our story
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </p>
      </div>

      <script
        type="application/ld+json"
        // Static, developer-authored content (no user input) — safe to inline as JSON.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </section>
  )
}
