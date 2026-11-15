"use client"

import { useRef, useState } from "react"
import { Minus, Plus, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { LabWindow, useAnimationLoop } from "./shared"

// First 20 elements: [symbol, name, neutrons in the most abundant isotope]
const ELEMENTS: Array<[string, string, number]> = [
  ["H", "Hydrogen", 0], ["He", "Helium", 2], ["Li", "Lithium", 4], ["Be", "Beryllium", 5], ["B", "Boron", 6],
  ["C", "Carbon", 6], ["N", "Nitrogen", 7], ["O", "Oxygen", 8], ["F", "Fluorine", 10], ["Ne", "Neon", 10],
  ["Na", "Sodium", 12], ["Mg", "Magnesium", 12], ["Al", "Aluminium", 14], ["Si", "Silicon", 14], ["P", "Phosphorus", 16],
  ["S", "Sulfur", 16], ["Cl", "Chlorine", 18], ["Ar", "Argon", 22], ["K", "Potassium", 20], ["Ca", "Calcium", 20],
]
const SHELL_CAPACITY = [2, 8, 8, 2] // Bohr–Bury filling, valid for Z ≤ 20
const SHELL_RADII = [52, 78, 104, 128]
const LIMITS = { p: [1, 20], n: [0, 26], e: [0, 20] } as const

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻" }
const round2 = (v: number) => Math.round(v * 100) / 100
const sup = (s: string) => s.split("").map((c) => SUP[c] ?? c).join("")

function shells(electrons: number) {
  const out: number[] = []
  let left = electrons
  for (const cap of SHELL_CAPACITY) {
    if (left <= 0) break
    out.push(Math.min(cap, left))
    left -= cap
  }
  return out
}

function Stepper({ label, value, set, k, color }: { label: string; value: number; set: (v: number) => void; k: keyof typeof LIMITS; color: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200/80">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className={cn("h-3 w-3 rounded-full", color)} aria-hidden />
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        <button type="button" aria-label={`Remove a ${label.toLowerCase().replace(/s$/, "")}`} disabled={value <= LIMITS[k][0]} onClick={() => set(value - 1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center font-mono text-base font-bold tabular-nums text-slate-900" aria-live="polite">
          {value}
        </span>
        <button type="button" aria-label={`Add a ${label.toLowerCase().replace(/s$/, "")}`} disabled={value >= LIMITS[k][1]} onClick={() => set(value + 1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  )
}

export function AtomBuilder() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [p, setP] = useState(6)
  const [n, setN] = useState(6)
  const [e, setE] = useState(6)
  const [rot, setRot] = useState(0)

  useAnimationLoop((dt) => setRot((r) => r + dt * 0.6), svgRef)

  const [symbol, name, commonN] = ELEMENTS[p - 1]!
  const mass = p + n
  const charge = p - e
  const chargeText = charge === 0 ? "" : `${Math.abs(charge) === 1 ? "" : Math.abs(charge)}${charge > 0 ? "+" : "-"}`
  const notation = `${sup(String(mass))}${symbol}${sup(chargeText)}`
  const config = shells(e)
  const kind = charge === 0 ? "Neutral atom" : charge > 0 ? `Positive ion (cation), charge ${sup(chargeText)}` : `Negative ion (anion), charge ${sup(chargeText)}`
  const isotope = n === commonN ? `${name}-${mass} is the most common isotope of ${name.toLowerCase()}.` : `${name}-${mass} is a less common isotope (the most common is ${name}-${p + commonN}).`

  // Nucleus: protons and neutrons packed on a sunflower spiral
  const nucleons = Array.from({ length: mass }, (_, i) => {
    const r = 4.2 * Math.sqrt(i + 0.5)
    const a = i * 2.39996
    // interleave protons and neutrons so both are visible throughout the nucleus
    const isProton = mass > 0 && Math.floor(((i + 1) * p) / mass) > Math.floor((i * p) / mass)
    // rounded: server and browser Math.cos can differ in the last digit (hydration mismatch)
    return { x: round2(Math.cos(a) * r), y: round2(Math.sin(a) * r), isProton }
  })

  return (
    <LabWindow
      title="warm-up · atom-builder"
      badge={
        <button
          type="button"
          onClick={() => { setP(6); setN(6); setE(6) }}
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <RotateCcw className="h-3 w-3" aria-hidden /> Reset
        </button>
      }
      footer={
        <div className="space-y-1 text-xs leading-relaxed text-slate-600" aria-live="polite">
          <p>
            <span className="font-semibold text-slate-800">{kind}.</span> The number of protons decides the element; changing neutrons makes an isotope; changing electrons makes an ion.
          </p>
          <p>{isotope}</p>
        </div>
      }
    >
      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <svg ref={svgRef} viewBox="-150 -150 300 300" className="mx-auto block w-full max-w-[300px]" role="img" aria-label={`Bohr model of ${name}: ${p} protons, ${n} neutrons, ${e} electrons arranged ${config.join(", ") || "none"}.`}>
          {SHELL_RADII.slice(0, Math.max(config.length, 1)).map((r) => (
            <circle key={r} r={r} fill="none" stroke="#cbd5e1" strokeWidth={1.25} strokeDasharray="3 4" />
          ))}
          {nucleons.map((nu, i) => (
            <circle key={i} cx={nu.x} cy={nu.y} r={4.6} fill={nu.isProton ? "#f43f5e" : "#94a3b8"} stroke="white" strokeWidth={0.8} />
          ))}
          {config.map((count, s) =>
            Array.from({ length: count }, (_, i) => {
              const a = (s % 2 ? -rot : rot) * (1 - s * 0.15) + (Math.PI * 2 * i) / count
              return <circle key={`${s}-${i}`} cx={round2(Math.cos(a) * SHELL_RADII[s]!)} cy={round2(Math.sin(a) * SHELL_RADII[s]!)} r={5} fill="#0d9488" stroke="white" strokeWidth={1.5} />
            })
          )}
        </svg>

        <div className="space-y-3 sm:w-56">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-center">
            <p className="font-serif text-3xl font-bold text-slate-900">{notation}</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-700">{name}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Mass number {mass} · Shells {config.join(", ") || "—"}
            </p>
          </div>
          <Stepper label="Protons" value={p} set={(v) => setP(v)} k="p" color="bg-rose-500" />
          <Stepper label="Neutrons" value={n} set={setN} k="n" color="bg-slate-400" />
          <Stepper label="Electrons" value={e} set={setE} k="e" color="bg-teal-600" />
        </div>
      </div>
    </LabWindow>
  )
}
