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

// Full class strings (not interpolated) so Tailwind can see every accent class.
const FEATURE_CARDS = [
  {
    href: "/molecules",
    title: "3D Molecular Viewer",
    description:
      "Visualize and manipulate molecular structures in full 3D space. Rotate, zoom, examine atomic bonds, and inspect spatial geometries interactively.",
    badge: "Spatial Engine",
    icon: Atom,
    card: "bg-blue-50/80 border-blue-200/80 hover:border-blue-400 hover:shadow-[0_20px_45px_-18px_rgba(37,99,235,0.45)]",
    iconWrap: "bg-blue-500/10 text-blue-600 ring-blue-500/20 group-hover:bg-blue-600 group-hover:text-white",
    badgeTone: "bg-blue-100 text-blue-700",
    accent: "text-blue-600",
    glow: "bg-blue-400/25",
  },
  {
    href: "/periodic",
    title: "Interactive Periodic Table",
    description:
      "Explore elemental properties, electron configurations, ionization energies, and periodic trends across all 118 known elements dynamically.",
    badge: "118 Elements",
    iconLetter: "H",
    card: "bg-emerald-50/80 border-emerald-200/80 hover:border-emerald-400 hover:shadow-[0_20px_45px_-18px_rgba(5,150,105,0.45)]",
    iconWrap: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white",
    badgeTone: "bg-emerald-100 text-emerald-700",
    accent: "text-emerald-600",
    glow: "bg-emerald-400/25",
  },
  {
    href: "/reactions",
    title: "Reaction Simulator",
    description:
      "Simulate chemical reactions, balance stoichiometric equations, and observe atomic rearrangements and reaction kinetics in real-time.",
    badge: "Real-time Lab",
    icon: FlaskConical,
    card: "bg-purple-50/80 border-purple-200/80 hover:border-purple-400 hover:shadow-[0_20px_45px_-18px_rgba(147,51,234,0.45)]",
    iconWrap: "bg-purple-500/10 text-purple-600 ring-purple-500/20 group-hover:bg-purple-600 group-hover:text-white",
    badgeTone: "bg-purple-100 text-purple-700",
    accent: "text-purple-600",
    glow: "bg-purple-400/25",
  },
  {
    href: "/quizzes",
    title: "Interactive Quizzes",
    description:
      "Test and solidify your chemical knowledge with chapter-based adaptive quizzes, real-time scoring, and comprehensive explanations.",
    badge: "Self Assessment",
    icon: Users,
    card: "bg-amber-50/80 border-amber-200/80 hover:border-amber-400 hover:shadow-[0_20px_45px_-18px_rgba(217,119,6,0.45)]",
    iconWrap: "bg-amber-500/10 text-amber-600 ring-amber-500/20 group-hover:bg-amber-500 group-hover:text-white",
    badgeTone: "bg-amber-100 text-amber-800",
    accent: "text-amber-600",
    glow: "bg-amber-400/25",
  },
  {
    href: "/concepts",
    title: "Concept Lab",
    description:
      "Explore classic atomic discoveries, gas laws, and particle behavior through step-by-step explanations and interactive 2D simulations.",
    badge: "Visual Labs",
    icon: Microscope,
    card: "bg-rose-50/70 border-rose-200/80 hover:border-rose-400 hover:shadow-[0_20px_45px_-18px_rgba(225,29,72,0.4)]",
    iconWrap: "bg-rose-100 text-rose-600 ring-rose-500/20 group-hover:bg-rose-600 group-hover:text-white",
    badgeTone: "bg-rose-100 text-rose-700",
    accent: "text-rose-600",
    glow: "bg-rose-400/25",
  },
  {
    href: "/news",
    title: "Chemistry News",
    description:
      "Stay updated with daily breakthroughs, newly synthesized elements, and global research headlines curated from trusted science news sources.",
    badge: "Live Pulse",
    icon: Newspaper,
    card: "bg-cyan-50/70 border-cyan-200/80 hover:border-cyan-400 hover:shadow-[0_20px_45px_-18px_rgba(8,145,178,0.45)]",
    iconWrap: "bg-cyan-100 text-cyan-600 ring-cyan-500/20 group-hover:bg-cyan-600 group-hover:text-white",
    badgeTone: "bg-cyan-100 text-cyan-700",
    accent: "text-cyan-600",
    glow: "bg-cyan-400/25",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      {/* ================= HERO =================
          Pulled up under the floating navbar (-mt / pt = nav height) so the glass pill floats over the gradient. */}
      <section className="relative -mt-[68px] overflow-hidden bg-gradient-to-b from-[color-mix(in_oklch,var(--primary)_6%,white)] via-white to-white pt-[68px]">
        <ChemBackground />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-24 lg:pt-20">
          {/* ---- Left: copy & CTAs ---- */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Interactive 3D Chemistry Lab
            </span>

            <h1 className="mt-6 font-serif text-4xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Explore Chemistry in{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="bg-gradient-to-r from-primary via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                  3D Space
                </span>
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
                className="h-12 gap-2 rounded-full px-7 text-base shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 active:translate-y-0 active:scale-[0.98]"
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
                className="h-12 gap-2 rounded-full border-slate-300 bg-white/70 px-7 text-base backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white active:translate-y-0 active:scale-[0.98]"
              >
                <Link href="/periodic">
                  Periodic Table
                  <LinkPendingIcon />
                </Link>
              </Button>
            </div>

            {/* Quick stats */}
            <dl className="mx-auto mt-10 grid max-w-md grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200/80 bg-white/60 py-3 shadow-sm backdrop-blur lg:mx-0">
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
      <section className="relative flex-1 border-y border-slate-200/70 bg-slate-50/70 px-4 py-16 sm:py-20">
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
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0 active:scale-[0.99] ${f.card}`}
                >
                  {/* Corner glow that blooms on hover */}
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 ${f.glow}`}
                  />

                  <div className="relative flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-colors duration-300 ${f.iconWrap}`}
                    >
                      {Icon ? <Icon className="h-6 w-6" aria-hidden /> : <span className="text-lg font-black">{f.iconLetter}</span>}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${f.badgeTone}`}>
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="relative mt-5 font-serif text-lg font-bold text-slate-900">{f.title}</h3>
                  <p className="relative mt-2 flex-1 text-sm leading-relaxed text-slate-600">{f.description}</p>

                  <span className={`relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${f.accent}`}>
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
