import type { ReactNode } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { FloatingChemBackground } from "@/components/floating-chem-background"

/** Shared frame for sign-in, sign-up, forgot- and reset-password: site chrome + one centred card. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-teal-50/30" />
        <FloatingChemBackground />
        <div className="relative w-full max-w-md">{children}</div>
      </main>
      <Footer />
    </div>
  )
}

/** Card classes every auth form uses (white, rounded-2xl, soft slate border, shadow-sm). */
export const AUTH_CARD = "w-full rounded-2xl border-slate-200/80 bg-white shadow-sm"
