import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"
import { Award, BookOpen, GraduationCap, Heart, Users } from "lucide-react"

const LEGACY = [
  {
    icon: GraduationCap,
    title: "Aga Khan Higher Secondary School",
    text: "Lecturer in Chemistry for many years, shaping academic excellence.",
  },
  {
    icon: Award,
    title: "Lifelong Mentorship",
    text: "A guiding pillar who spent decades mentoring students toward university success and scientific discovery.",
  },
  {
    icon: BookOpen,
    title: "Interactive Learning",
    text: "Carrying forward his mission to make chemistry intuitive, visual, and accessible.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <PageHeader
        align="center"
        width="max-w-4xl"
        eyebrow="Open interactive learning platform"
        eyebrowIcon={Heart}
        title={
          <>
            Dedicated in Loving <span className="text-primary">Memory</span>
          </>
        }
        description="Honoring the life, passion, and teaching legacy of a master educator."
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        {/* Tribute */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm md:p-10">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="mb-2 h-32 w-32 overflow-hidden rounded-full border-4 border-teal-100 bg-slate-100 shadow-sm md:h-36 md:w-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sirFayyaz.jpeg" alt="Late Sir Fayyaz" className="h-full w-full object-cover object-center" />
            </div>

            <h2 className="font-serif text-2xl font-bold text-slate-900 md:text-3xl">Late Sir Fayyaz</h2>

            <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">
              Master Chemistry Lecturer &amp; Mentor
            </p>

            <div className="my-2 h-1 w-16 rounded-full bg-teal-200" />

            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
              ChemCurious was crafted as a dedicated tribute to
              <strong className="text-slate-900"> Sir Fayyaz</strong>, who devoted years of his life to nurturing
              generations of chemistry students with academic distinction as well as serving as an esteemed lecturer
              at Aga Khan Higher Secondary School.
            </p>

            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
              His unwavering passion for explaining complex chemical structures and reactions with clarity and warmth
              inspired us to build a digital platform where students can visualize, explore, and master chemistry
              seamlessly.
            </p>
          </div>
        </section>

        {/* Legacy highlights */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {LEGACY.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex flex-col items-center space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-xs leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>

        {/* Note to learners */}
        <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50/60 p-6 text-center">
          <div className="mb-1 flex items-center justify-center gap-2 text-base font-bold text-slate-900">
            <Users className="h-4 w-4 text-teal-600" aria-hidden />
            <span>Empowering Chemistry Learners Everywhere</span>
          </div>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600">
            This platform is open and accessible to students, educators, and chemistry enthusiasts worldwide. Use these
            3D tools to explore molecular geometry, balance reactions, and carry forward Sir Fayyaz&rsquo;s passion for
            visual learning.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
