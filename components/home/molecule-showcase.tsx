"use client"

import type React from "react"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Move3d, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Data — approximate equilibrium geometries in ångströms (textbook values)
// ---------------------------------------------------------------------------
type Element = "H" | "C" | "O"
type AtomDef = { el: Element; x: number; y: number; z: number }
type BondDef = [from: number, to: number, order: 1 | 2]
type MoleculeDef = {
  id: string
  label: string // pill label with subscripts
  name: string
  geometry: string
  bondAngle: string
  mass: string
  atoms: AtomDef[]
  bonds: BondDef[]
}

const ELEMENTS: Record<Element, { name: string; z: number; mass: string; radius: number; light: string; dark: string; min: number; max: number }> = {
  H: { name: "Hydrogen", z: 1, mass: "1.008", radius: 0.3, light: "#ffffff", dark: "#b8c4d2", min: 9, max: 19 },
  C: { name: "Carbon", z: 6, mass: "12.011", radius: 0.42, light: "#64748b", dark: "#1e293b", min: 12, max: 28 },
  O: { name: "Oxygen", z: 8, mass: "15.999", radius: 0.4, light: "#fb7185", dark: "#be123c", min: 12, max: 28 },
}

const benzene = (() => {
  const atoms: AtomDef[] = []
  const bonds: BondDef[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i
    atoms.push({ el: "C", x: 1.39 * Math.cos(a), y: 1.39 * Math.sin(a), z: 0 })
  }
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i
    atoms.push({ el: "H", x: 2.47 * Math.cos(a), y: 2.47 * Math.sin(a), z: 0 })
    bonds.push([i, (i + 1) % 6, i % 2 === 0 ? 2 : 1]) // Kekulé structure
    bonds.push([i, i + 6, 1])
  }
  return { atoms, bonds }
})()

const MOLECULES: MoleculeDef[] = [
  {
    id: "h2o",
    label: "H₂O",
    name: "Water",
    geometry: "Bent",
    bondAngle: "104.5°",
    mass: "18.02 g/mol",
    atoms: [
      { el: "O", x: 0, y: -0.12, z: 0 },
      { el: "H", x: 0.757, y: 0.47, z: 0 },
      { el: "H", x: -0.757, y: 0.47, z: 0 },
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
    ],
  },
  {
    id: "ch4",
    label: "CH₄",
    name: "Methane",
    geometry: "Tetrahedral",
    bondAngle: "109.5°",
    mass: "16.04 g/mol",
    atoms: [
      { el: "C", x: 0, y: 0, z: 0 },
      { el: "H", x: 0.629, y: 0.629, z: 0.629 },
      { el: "H", x: -0.629, y: -0.629, z: 0.629 },
      { el: "H", x: -0.629, y: 0.629, z: -0.629 },
      { el: "H", x: 0.629, y: -0.629, z: -0.629 },
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
    ],
  },
  {
    id: "c6h6",
    label: "C₆H₆",
    name: "Benzene",
    geometry: "Planar ring",
    bondAngle: "120°",
    mass: "78.11 g/mol",
    ...benzene,
  },
  {
    id: "co2",
    label: "CO₂",
    name: "Carbon dioxide",
    geometry: "Linear",
    bondAngle: "180°",
    mass: "44.01 g/mol",
    atoms: [
      { el: "O", x: -1.16, y: 0, z: 0 },
      { el: "C", x: 0, y: 0, z: 0 },
      { el: "O", x: 1.16, y: 0, z: 0 },
    ],
    bonds: [
      [0, 1, 2],
      [1, 2, 2],
    ],
  },
]

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------
const VIEW = 300 // viewBox is -150..150
const FIT_RADIUS = 100 // px the outermost atom centre may reach

type Projected = { i: number; el: Element; x: number; y: number; z: number; r: number }

function project(mol: MoleculeDef, rx: number, ry: number): Projected[] {
  const maxR = Math.max(...mol.atoms.map((a) => Math.hypot(a.x, a.y, a.z)), 0.8)
  const scale = FIT_RADIUS / maxR
  const camera = maxR * 5
  const [cx, sx, cy, sy] = [Math.cos(rx), Math.sin(rx), Math.cos(ry), Math.sin(ry)]

  return mol.atoms.map((a, i) => {
    // rotate around Y, then X
    const x1 = a.x * cy + a.z * sy
    const z1 = -a.x * sy + a.z * cy
    const y1 = a.y * cx - z1 * sx
    const z2 = a.y * sx + z1 * cx
    const p = camera / (camera - z2) // closer (z>0) => larger
    const info = ELEMENTS[a.el]
    const r = Math.min(info.max, Math.max(info.min, info.radius * scale)) * p
    return { i, el: a.el, x: x1 * scale * p, y: -y1 * scale * p, z: z2, r }
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MoleculeShowcase() {
  const uid = useId().replace(/:/g, "")
  const [molId, setMolId] = useState("h2o")
  const [rot, setRot] = useState({ rx: -0.35, ry: 0.6 })
  const [selected, setSelected] = useState<number | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const visibleRef = useRef(true)
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null)

  const mol = MOLECULES.find((m) => m.id === molId)!
  const projected = useMemo(() => project(mol, rot.rx, rot.ry), [mol, rot])

  // Respect reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  // Pause the loop while the card is off-screen
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry?.isIntersecting ?? true
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Auto-rotation loop (time-based so speed is identical at 60/120 Hz)
  useEffect(() => {
    if (!autoRotate || reducedMotion) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64)
      last = now
      if (visibleRef.current && !drag.current && document.visibilityState === "visible") {
        // Spin around Y plus a gentle tilt wobble so flat molecules (H₂O, C₆H₆) never sit edge-on for long
        setRot((r) => ({
          rx: r.rx + (-0.45 + Math.sin(now * 0.0007) * 0.3 - r.rx) * Math.min(1, dt * 0.003),
          ry: r.ry + dt * 0.00045,
        }))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoRotate, reducedMotion])

  // --- pointer rotation (touch-action: pan-y keeps vertical page scrolling on phones)
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) < 4) return
    if (!d.moved) {
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    d.x = e.clientX
    d.y = e.clientY
    setRot((r) => ({
      rx: Math.max(-1.3, Math.min(1.3, r.rx + dy * 0.01)),
      ry: r.ry + dx * 0.012,
    }))
  }
  const endDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag.current?.id === e.pointerId) {
      // Let the atom's click handler see whether this was a drag
      const wasDrag = drag.current.moved
      window.setTimeout(() => {
        if (drag.current?.id === e.pointerId) drag.current = null
      }, 0)
      if (!wasDrag) drag.current = null
    }
  }

  const selectAtom = (i: number) => {
    if (drag.current?.moved) return
    setSelected((s) => (s === i ? null : i))
  }

  const onKeyRotate = (e: React.KeyboardEvent) => {
    const step = 0.15
    const map: Record<string, [number, number]> = {
      ArrowLeft: [0, -step],
      ArrowRight: [0, step],
      ArrowUp: [-step, 0],
      ArrowDown: [step, 0],
    }
    const delta = map[e.key]
    if (!delta) return
    e.preventDefault()
    setRot((r) => ({ rx: Math.max(-1.3, Math.min(1.3, r.rx + delta[0])), ry: r.ry + delta[1] }))
  }

  // Draw far-to-near: bonds use the average depth of their atoms
  const items = useMemo(() => {
    const list: Array<{ kind: "atom"; z: number; a: Projected } | { kind: "bond"; z: number; b: BondDef }> = []
    for (const a of projected) list.push({ kind: "atom", z: a.z, a })
    for (const b of mol.bonds) list.push({ kind: "bond", z: (projected[b[0]]!.z + projected[b[1]]!.z) / 2 - 0.01, b })
    return list.sort((p, q) => p.z - q.z)
  }, [projected, mol])

  const selectedAtom = selected !== null ? mol.atoms[selected] : undefined
  const selectedInfo = selectedAtom ? ELEMENTS[selectedAtom.el] : undefined

  return (
    <div className="relative">
      {/* Ambient teal glow */}
      <div aria-hidden className="cc-glow-pulse absolute -inset-6 -z-10 rounded-[2.5rem] bg-primary/25 blur-3xl sm:-inset-10" />

      <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_24px_60px_-20px_color-mix(in_oklch,var(--primary)_45%,transparent)] ring-1 ring-black/5 backdrop-blur-md">
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-slate-200/70 bg-slate-50/80 px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <span className="truncate rounded-md bg-white px-3 py-0.5 font-mono text-[11px] text-slate-500 ring-1 ring-slate-200">
              chemcurious · molecule-lab
            </span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" aria-hidden />
            Live
          </span>
        </div>

        {/* Molecule switcher */}
        <div className="flex items-center justify-between gap-2 px-4 pt-4">
          <div role="radiogroup" aria-label="Choose a molecule" className="flex flex-wrap gap-1.5">
            {MOLECULES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={m.id === molId}
                onClick={() => {
                  setMolId(m.id)
                  setSelected(null)
                }}
                className={cn(
                  "min-h-9 rounded-full px-3.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  m.id === molId
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            disabled={reducedMotion}
            aria-label={autoRotate && !reducedMotion ? "Pause rotation" : "Resume rotation"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            {autoRotate && !reducedMotion ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>

        {/* Stage */}
        <div className="relative px-2">
          <svg
            ref={svgRef}
            viewBox={`${-VIEW / 2} ${-VIEW / 2} ${VIEW} ${VIEW}`}
            className="mx-auto block aspect-square w-full max-w-[340px] cursor-grab touch-pan-y select-none focus-visible:outline-none active:cursor-grabbing"
            role="img"
            aria-label={`${mol.name} (${mol.label}) 3D model. Drag or use arrow keys to rotate.`}
            tabIndex={0}
            onKeyDown={onKeyRotate}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <defs>
              {(Object.keys(ELEMENTS) as Element[]).map((el) => (
                <radialGradient key={el} id={`${uid}-${el}`} cx="35%" cy="32%" r="70%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={el === "H" ? 1 : 0.85} />
                  <stop offset="28%" stopColor={ELEMENTS[el].light} />
                  <stop offset="100%" stopColor={ELEMENTS[el].dark} />
                </radialGradient>
              ))}
              <radialGradient id={`${uid}-floor`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Soft "floor" shadow */}
            <ellipse cx="0" cy="122" rx="95" ry="12" fill={`url(#${uid}-floor)`} />

            {items.map((item) => {
              if (item.kind === "bond") {
                const [i, j, order] = item.b
                const a = projected[i]!
                const b = projected[j]!
                const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
                const ux = (b.x - a.x) / len
                const uy = (b.y - a.y) / len
                // Trim the stick to the atom surfaces so it never crosses an atom's face
                const startCut = a.r * 0.8
                const endCut = b.r * 0.8
                if (len <= startCut + endCut) return null // bond points at the viewer: hidden behind atoms
                const [x1, y1, x2, y2] = [a.x + ux * startCut, a.y + uy * startCut, b.x - ux * endCut, b.y - uy * endCut]
                const nx = -uy * 3.4
                const ny = ux * 3.4
                const offsets = order === 2 ? [-1, 1] : [0]
                return (
                  <g key={`b-${i}-${j}`} stroke="#94a3b8" strokeWidth={order === 2 ? 3.2 : 5} strokeLinecap="round">
                    {offsets.map((o) => (
                      <line key={o} x1={x1 + nx * o} y1={y1 + ny * o} x2={x2 + nx * o} y2={y2 + ny * o} />
                    ))}
                  </g>
                )
              }
              const a = item.a
              const isSel = selected === a.i
              return (
                <g
                  key={`a-${a.i}`}
                  className="cursor-pointer"
                  onClick={() => selectAtom(a.i)}
                  role="button"
                  aria-label={`${ELEMENTS[a.el].name} atom`}
                  aria-pressed={isSel}
                >
                  {isSel && <circle cx={a.x} cy={a.y} r={a.r + 5} fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeDasharray="4 3" />}
                  <circle cx={a.x} cy={a.y} r={a.r} fill={`url(#${uid}-${a.el})`} stroke="rgba(15,23,42,0.18)" strokeWidth={0.75} />
                  {a.r > 13 && (
                    <text
                      x={a.x}
                      y={a.y + 4}
                      textAnchor="middle"
                      className="pointer-events-none select-none font-sans text-[11px] font-bold"
                      fill={a.el === "H" ? "#475569" : "#ffffff"}
                      opacity={0.9}
                    >
                      {a.el}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Hint / selected atom info */}
          <div className="pointer-events-none absolute inset-x-0 top-1 flex justify-center px-4" aria-live="polite">
            {selectedInfo && selectedAtom ? (
              <span className="rounded-full bg-slate-900/85 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur">
                {selectedInfo.name} ({selectedAtom.el}) · Z = {selectedInfo.z} · {selectedInfo.mass} u
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                <Move3d className="h-3.5 w-3.5" aria-hidden />
                Drag to rotate · tap an atom
              </span>
            )}
          </div>
        </div>

        {/* Stat badges */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-200/70 bg-slate-50/60 px-4 py-3">
          {[
            { label: "Bond angle", value: mol.bondAngle },
            { label: "Molar mass", value: mol.mass },
            { label: "Geometry", value: mol.geometry },
          ].map((s) => (
            <div key={s.label} className="min-w-0 rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200/80">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="truncate text-sm font-bold text-slate-800">{s.value}</p>
            </div>
          ))}
        </div>

        <Link
          href="/molecules"
          className="group flex items-center justify-between border-t border-slate-200/70 px-4 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          <span>
            Explore {mol.name} and thousands more in the full 3D viewer
          </span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
