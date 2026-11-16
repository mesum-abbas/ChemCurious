"use client"

import type React from "react"
import { useState } from "react"
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react"
import { FloatingChemIcons, type FloatingItem } from "@/components/home/chem-icons"

const BG_ICONS: FloatingItem[] = [
  { kind: "flask", className: "left-[4%] top-[14px] w-10 sm:left-[6%] sm:top-[20%] sm:w-16 lg:w-20", dur: 17, delay: -3, rot: -14 },
  { kind: "tube", className: "right-[5%] top-[16px] w-8 sm:right-[8%] sm:top-[14%] sm:w-12", dur: 19, delay: -7, rot: 24 },
  { kind: "molecule", className: "hidden lg:block left-[12%] bottom-[12%] w-20", dur: 22, delay: -1, spin: 20 },
  { kind: "beaker", className: "right-[4%] bottom-[12px] w-9 sm:right-[10%] sm:bottom-[14%] sm:w-14", dur: 20, delay: -10, rot: -8 },
  { kind: "atom", className: "hidden md:block right-[30%] -bottom-6 w-20", dur: 26, delay: -12, spin: 40 },
]

type State = { kind: "idle" } | { kind: "loading" } | { kind: "done"; email: string } | { kind: "error"; message: string }

export function NewsletterBanner() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<State>({ kind: "idle" })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state.kind === "loading") return
    setState({ kind: "loading" })
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not subscribe right now.")
      setState({ kind: "done", email: email.trim() })
      setEmail("")
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Could not subscribe right now." })
    }
  }

  return (
    <section aria-labelledby="digest-heading" className="relative isolate overflow-hidden bg-primary">
      <FloatingChemIcons items={BG_ICONS} className="-z-10" itemClassName="text-white" defaultOpacity={0.18} />

      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
          <Mail className="h-3.5 w-3.5" aria-hidden />
          Weekly Chemistry Digest
        </span>
        <h2 id="digest-heading" className="mt-5 font-serif text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
          The week&apos;s best chemistry, in your inbox
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-teal-50/90">
          A short weekly roundup of breakthroughs and discoveries — written for learners and educators.
        </p>

        <div className="mx-auto mt-8 max-w-lg" aria-live="polite">
          {state.kind === "done" ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/25 bg-white/15 px-5 py-4 text-left text-white backdrop-blur motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-200" aria-hidden />
              <div>
                <p className="font-semibold">You&apos;re on the list!</p>
                <p className="text-sm text-teal-50/90">
                  We&apos;ll send the digest to <span className="font-medium text-white">{state.email}</span>.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row" noValidate={false}>
              <label htmlFor="digest-email" className="sr-only">
                Email address
              </label>
              <input
                id="digest-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (state.kind === "error") setState({ kind: "idle" })
                }}
                placeholder="you@example.com"
                className="h-12 min-w-0 flex-1 rounded-full border border-white/30 bg-white px-5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-white/40"
              />
              <button
                type="submit"
                disabled={state.kind === "loading"}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-teal-800 px-6 text-base font-semibold text-white shadow-sm ring-1 ring-white/20 transition-all hover:-translate-y-0.5 hover:bg-teal-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:translate-y-0 disabled:opacity-80"
              >
                {state.kind === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                Subscribe Free
                {state.kind !== "loading" && <ArrowRight className="h-4 w-4" aria-hidden />}
              </button>
            </form>
          )}
          {state.kind === "error" && (
            <p role="alert" className="mt-3 text-sm font-medium text-amber-100">
              {state.message}
            </p>
          )}
          {state.kind !== "done" && <p className="mt-3 text-xs text-teal-50/75">No spam — just chemistry. We only use your email for the digest.</p>}
        </div>
      </div>
    </section>
  )
}
