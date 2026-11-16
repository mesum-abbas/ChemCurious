import Link from "next/link";
import { Atom, ArrowRight, FlaskConical, Grid3x3, Microscope, Newspaper, Sparkles, Users, Zap, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { LinkPendingIcon } from "@/components/link-pending-icon";
import { ChemBackground } from "@/components/home/chem-background";
import { MoleculeShowcase } from "@/components/home/molecule-showcase";
import { FaqSection } from "@/components/home/faq-section";
import { CtaBanner } from "@/components/home/cta-banner";

const HERO_STATS = [
  { icon: Grid3x3, value: "118", label: "Elements" },
  { icon: Box, value: "3D", label: "Models" },
  { icon: Zap, value: "Real-Time", label: "Reactions" },
];

// Each pillar has its own soft pastel tone. Full class strings (not interpolated) so Tailwind sees them.
const FEATURE_CARDS = [
  {
    href: "/molecules",
    tone: {
      card: "bg-blue-50/70 border-blue-200/80 hover:border-blue-300",
      icon: "bg-blue-100 text-blue-600 ring-blue-200/70 group-hover:bg-blue-600 group-hover:text-white",
      badge: "bg-blue-100 text-blue-700",
      link: "text-blue-600 hover:text-blue-700 group-hover:text-blue-700",
    },
    title: "3D Molecular Viewer",
    description:
      "Visualize and manipulate molecular structures in full 3D space. Rotate, zoom, examine atomic bonds, and inspect spatial geometries interactively.",
    badge: "Spatial Engine",
    icon: Atom,
  },
  {
    href: "/periodic",
    tone: {
      card: "bg-emerald-50/70 border-emerald-200/80 hover:border-emerald-300",
      icon: "bg-emerald-100 text-emerald-600 ring-emerald-200/70 group-hover:bg-emerald-600 group-hover:text-white",
      badge: "bg-emerald-100 text-emerald-700",
      link: "text-emerald-600 hover:text-emerald-700 group-hover:text-emerald-700",
    },
    title: "Interactive Periodic Table",
    description:
      "Explore elemental properties, electron configurations, ionization energies, and periodic trends across all 118 known elements dynamically.",
    badge: "118 Elements",
    iconLetter: "H",
  },
  {
    href: "/reactions",
    tone: {
      card: "bg-purple-50/70 border-purple-200/80 hover:border-purple-300",
      icon: "bg-purple-100 text-purple-600 ring-purple-200/70 group-hover:bg-purple-600 group-hover:text-white",
      badge: "bg-purple-100 text-purple-700",
      link: "text-purple-600 hover:text-purple-700 group-hover:text-purple-700",
    },
    title: "Reaction Simulator",
    description:
      "Simulate chemical reactions, balance stoichiometric equations, and observe atomic rearrangements and reaction kinetics in real-time.",
    badge: "Real-time Lab",
    icon: FlaskConical,
  },
  {
    href: "/quizzes",
    tone: {
      card: "bg-amber-50/70 border-amber-200/80 hover:border-amber-300",
      icon: "bg-amber-100 text-amber-600 ring-amber-200/70 group-hover:bg-amber-600 group-hover:text-white",
      badge: "bg-amber-100 text-amber-700",
      link: "text-amber-600 hover:text-amber-700 group-hover:text-amber-700",
    },
    title: "Interactive Quizzes",
    description:
      "Test and solidify your chemical knowledge with chapter-based adaptive quizzes, real-time scoring, and comprehensive explanations.",
    badge: "Self Assessment",
    icon: Users,
  },
  {
    href: "/concepts",
    tone: {
      card: "bg-rose-50/70 border-rose-200/80 hover:border-rose-300",
      icon: "bg-rose-100 text-rose-600 ring-rose-200/70 group-hover:bg-rose-600 group-hover:text-white",
      badge: "bg-rose-100 text-rose-700",
      link: "text-rose-600 hover:text-rose-700 group-hover:text-rose-700",
    },
    title: "Concept Lab",
    description:
      "Explore classic atomic discoveries, gas laws, and particle behavior through step-by-step explanations and interactive 2D simulations.",
    badge: "Visual Labs",
    icon: Microscope,
  },
  {
    href: "/news",
    tone: {
      card: "bg-cyan-50/70 border-cyan-200/80 hover:border-cyan-300",
      icon: "bg-cyan-100 text-cyan-600 ring-cyan-200/70 group-hover:bg-cyan-600 group-hover:text-white",
      badge: "bg-cyan-100 text-cyan-700",
      link: "text-cyan-600 hover:text-cyan-700 group-hover:text-cyan-700",
    },
    title: "Chemistry News",
    description:
      "Stay updated with daily breakthroughs, newly synthesized elements, and global research headlines curated from trusted science news sources.",
    badge: "Live Pulse",
    icon: Newspaper,
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      {/* ================= HERO =================
          Pulled up under the floating navbar (-mt / pt = nav height) so the glass pill floats over the hero. */}
      <section className="relative -mt-[68px] overflow-hidden bg-white pt-[68px]">
        <ChemBackground />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-24 lg:pt-20">
          {/* ---- Left: copy & CTAs ---- */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Interactive 3D Chemistry Lab
            </span>

            <h1 className="mt-6 font-serif text-4xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Explore Chemistry in{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="text-primary">3D Space</span>
                {/* Curved underline accent */}
                <svg
                  aria-hidden
                  viewBox="0 0 220 16"
                  preserveAspectRatio="none"
                  className="absolute -bottom-2 left-0 h-3 w-full text-primary/45 sm:-bottom-3 sm:h-4"
                >
                  <path d="M3 11 C 55 3, 120 3, 217 9" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
              Discover molecular structures, master the periodic table, and simulate chemical reactions in an
              intuitive, interactive environment designed for learners and educators everywhere.
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="h-12 gap-2 rounded-full px-7 text-base shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
              >
                <Link href="/molecules">
                  Start Exploring
                  <LinkPendingIcon>
                    <ArrowRight className="h-4 w-4" />
                  </LinkPendingIcon>
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 gap-2 rounded-full px-7 text-base transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <Link href="/periodic">
                  Periodic Table
                  <LinkPendingIcon />
                </Link>
              </Button>
            </div>

            {/* Quick stats */}
            <dl className="mx-auto mt-10 grid max-w-md grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200/80 bg-white py-3 shadow-sm lg:mx-0">
              {HERO_STATS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5 px-2">
                  <dt className="sr-only">{label}</dt>
                  <Icon className="mb-1 h-4 w-4 text-primary" aria-hidden />
                  <dd className="font-serif text-base font-black text-slate-900 sm:text-lg">{value}</dd>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500" aria-hidden>
                    {label}
                  </span>
                </div>
              ))}
            </dl>
          </div>

          {/* ---- Right: interactive preview ---- */}
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <MoleculeShowcase />
          </div>
        </div>
      </section>

      {/* ================= FOUR CORE PILLARS ================= */}
      <section className="relative flex-1 border-t border-slate-200/70 bg-background px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">What you can do</p>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Six Core Pillars of Interactive Chemistry
            </h2>
            <p className="text-sm text-slate-600 sm:text-base">
              Comprehensive tools designed to transform textbook concepts into spatial, memorable visual models.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURE_CARDS.map((f) => {
              const Icon = f.icon;
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  className={`group relative flex h-full flex-col rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0 active:scale-[0.99] ${f.tone.card}`}
                >

                  <div className="relative flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-colors duration-300 ${f.tone.icon}`}
                    >
                      {Icon ? <Icon className="h-6 w-6" aria-hidden /> : <span className="text-lg font-black">{f.iconLetter}</span>}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${f.tone.badge}`}>
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="relative mt-5 font-serif text-lg font-bold text-slate-900">{f.title}</h3>
                  <p className="relative mt-2 flex-1 text-sm leading-relaxed text-slate-600">{f.description}</p>

                  <span className={`relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${f.tone.link}`}>
                    Launch Tool
                    <LinkPendingIcon className="h-4 w-4">
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden />
                    </LinkPendingIcon>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <FaqSection />

      {/* ================= CTA BANNER ================= */}
      <CtaBanner />

      <Footer />
    </div>
  );
}
