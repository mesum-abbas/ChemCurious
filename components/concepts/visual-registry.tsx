"use client"

import dynamic from "next/dynamic"
import type { ComponentType } from "react"
import type { VisualKey } from "@/lib/concepts/data"
import type { VisualProps } from "./shared"

function VisualSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80" aria-hidden>
      <div className="h-10 border-b border-slate-200/70 bg-slate-50/80" />
      <div className="aspect-[8/5] animate-pulse bg-slate-100/80" />
      <div className="h-16 border-t border-slate-200/70" />
    </div>
  )
}

// Each visual is code-split: only the selected topic's simulation is downloaded.
const load = <K extends string>(loader: () => Promise<Record<K, ComponentType<VisualProps>>>, name: K) =>
  dynamic(() => loader().then((m) => m[name]), { ssr: false, loading: VisualSkeleton })

export const VISUALS: Record<VisualKey, ComponentType<VisualProps>> = {
  cathode: load(() => import("./visuals/cathode"), "CathodeVisual"),
  canal: load(() => import("./visuals/canal"), "CanalVisual"),
  rutherford: load(() => import("./visuals/rutherford"), "RutherfordVisual"),
  chadwick: load(() => import("./visuals/chadwick"), "ChadwickVisual"),
  bonding: load(() => import("./visuals/bonding"), "BondingVisual"),
  states: load(() => import("./visuals/states"), "StatesVisual"),
  boyle: load(() => import("./visuals/boyle"), "BoyleVisual"),
  charles: load(() => import("./visuals/charles"), "CharlesVisual"),
  ph: load(() => import("./visuals/ph"), "PhVisual"),
}
