"use client"

import { useEffect, useRef, useState } from "react"
import { Zap } from "lucide-react"
import { ControlButton, LabWindow, useAnimationLoop, type VisualProps } from "../shared"

// viewBox 0 0 600 300. Anode (+) on the left, perforated cathode (−) at CATHODE_X.
const CATHODE_X = 300
const HOLES = [124, 150, 176]
const FIELD_X0 = 360
const FIELD_X1 = 470
const SCREEN_X = 548
const D_H = 13 // deflection at end of field for H⁺ (q/m = 1); He⁺ (q/m = 1/4) gets a quarter — all rays stay on the screen

const GASES = {
  hydrogen: { label: "Hydrogen (H₂)", ion: "H⁺", mass: 1, color: "#e11d48", glow: "#fda4af" },
  helium: { label: "Helium (He)", ion: "He⁺", mass: 4, color: "#d97706", glow: "#fcd34d" },
} as const
type Gas = keyof typeof GASES

type Ion = { x: number; hole: number }
type Electron = { x: number; y: number }

function ionY(x: number, holeY: number, d: number) {
  if (x <= FIELD_X0) return holeY
  const L = FIELD_X1 - FIELD_X0
  if (x <= FIELD_X1) {
    const u = x - FIELD_X0
    return holeY + (d * u * u) / (L * L)
  }
  return holeY + d + ((2 * d) / L) * (x - FIELD_X1)
}

export function CanalVisual({ activeStep, stepNonce }: VisualProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [gas, setGas] = useState<Gas>("hydrogen")
  const [field, setField] = useState(false)
  const [, setFrame] = useState(0)
  const ions = useRef<Ion[]>([])
  const electrons = useRef<Electron[]>([])
  const d = useRef(0)
  const timers = useRef({ ion: 0, e: 0 })

  useEffect(() => {
    if (activeStep === 0) setField(false)
    if (activeStep === 1) setField(false)
    if (activeStep === 2) setField(true)
  }, [activeStep, stepNonce])

  const g = GASES[gas]
  // Positive ions bend towards the negative (lower) plate; deflection ∝ q/m
  const target = field ? D_H / g.mass : 0

  useAnimationLoop((dt) => {
    d.current += (target - d.current) * Math.min(1, dt * 6)
    timers.current.ion += dt
    timers.current.e += dt
    while (timers.current.ion > 0.06) {
      timers.current.ion -= 0.06
      ions.current.push({ x: 90 + Math.random() * 180, hole: Math.floor(Math.random() * HOLES.length) })
    }
    while (timers.current.e > 0.05) {
      timers.current.e -= 0.05
      electrons.current.push({ x: CATHODE_X - 8, y: 100 + Math.random() * 100 })
    }
    ions.current = ions.current.map((i) => ({ ...i, x: i.x + 150 * dt })).filter((i) => i.x < SCREEN_X)
    electrons.current = electrons.current.map((e) => ({ ...e, x: e.x - 260 * dt })).filter((e) => e.x > 80)
    setFrame((f) => (f + 1) % 1_000_000)
  }, svgRef)

  const dNow = d.current
  const raysBehind = HOLES.map((hy) =>
    Array.from({ length: 30 }, (_, i) => {
      const x = CATHODE_X + 8 + ((SCREEN_X - CATHODE_X - 8) * i) / 29
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ionY(x, hy, dNow).toFixed(1)}`
    }).join(" ")
  )
  const highlightHoles = activeStep === 0

  return (
    <LabWindow
      title="goldstein · canal-ray-tube"
      badge={
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1" style={{ color: g.color, backgroundColor: `${g.glow}33`, borderColor: g.glow }}>
          {g.ion} · {g.mass} u
        </span>
      }
      footer={
        <p className="text-xs leading-relaxed text-slate-600" aria-live="polite">
          {field
            ? `${g.ion} ions (mass ${g.mass} u) bend towards the negative plate. ${gas === "hydrogen" ? "Hydrogen ions are the lightest, so they bend the most: H⁺ is a single proton." : "Helium ions are four times heavier than H⁺, so they bend only a quarter as much."}`
            : "Positive ions pass through the holes in the cathode and travel the opposite way to the electrons (blue). Apply the field to measure their deflection."}
        </p>
      }
    >
      <svg ref={svgRef} viewBox="0 0 600 300" className="block w-full" role="img" aria-label={`Canal ray tube with ${g.label}. ${field ? "Field on." : "Field off."}`}>
        <path d="M 60 80 H 480 Q 565 72 570 150 Q 565 228 480 220 H 60 Q 28 220 28 150 Q 28 80 60 80 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth={2} />
        <rect x={34} y={86} width={CATHODE_X - 38} height={128} rx={30} fill={g.glow} opacity={0.12} />
        <text x={160} y={262} textAnchor="middle" className="fill-slate-400 text-[11px] font-semibold">low-pressure {gas} gas</text>

        {/* anode */}
        <rect x={70} y={112} width={8} height={76} rx={2} fill="#64748b" />
        <text x={74} y={104} textAnchor="middle" className="fill-slate-700 text-[13px] font-bold">+</text>
        <text x={74} y={204} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">anode</text>

        {/* electrons (cathode rays) heading left */}
        {electrons.current.map((e, i) => (
          <circle key={`e${i}`} cx={e.x} cy={e.y} r={1.8} fill="#3b82f6" opacity={0.7} />
        ))}
        {/* positive ions heading right, before the cathode */}
        {ions.current
          .filter((ion) => ion.x < CATHODE_X)
          .map((ion, i) => (
            <circle key={`i${i}`} cx={ion.x} cy={HOLES[ion.hole]} r={3} fill={g.color} />
          ))}

        {/* perforated cathode */}
        {[[92, HOLES[0]! - 7], [HOLES[0]! + 7, HOLES[1]! - 7], [HOLES[1]! + 7, HOLES[2]! - 7], [HOLES[2]! + 7, 208]].map(([y0, y1], i) => (
          <rect key={i} x={CATHODE_X} y={y0} width={8} height={y1! - y0!} rx={1.5} fill="#334155" />
        ))}
        {highlightHoles &&
          HOLES.map((hy) => <circle key={hy} cx={CATHODE_X + 4} cy={hy} r={10} fill="none" stroke="var(--primary)" strokeWidth={2} />)}
        <text x={CATHODE_X + 4} y={84} textAnchor="middle" className="fill-slate-700 text-[13px] font-bold">−</text>
        <text x={CATHODE_X + 4} y={228} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">perforated cathode</text>

        {/* field plates behind the cathode */}
        <rect x={FIELD_X0} y={96} width={FIELD_X1 - FIELD_X0} height={6} rx={2} fill={field ? "#ef4444" : "#cbd5e1"} />
        <rect x={FIELD_X0} y={202} width={FIELD_X1 - FIELD_X0} height={6} rx={2} fill={field ? "#3b82f6" : "#cbd5e1"} />
        {field && (
          <>
            <text x={FIELD_X1 + 6} y={103} className="fill-red-600 text-[14px] font-bold">+</text>
            <text x={FIELD_X1 + 6} y={209} className="fill-blue-600 text-[14px] font-bold">−</text>
          </>
        )}

        {/* canal rays behind the cathode */}
        {raysBehind.map((p, i) => (
          <g key={i}>
            <path d={p} fill="none" stroke={g.glow} strokeWidth={6} opacity={0.35} strokeLinecap="round" />
            <path d={p} fill="none" stroke={g.color} strokeWidth={1.5} opacity={0.8} />
          </g>
        ))}
        {ions.current
          .filter((ion) => ion.x >= CATHODE_X)
          .map((ion, i) => (
            <circle key={`ib${i}`} cx={ion.x} cy={ionY(ion.x, HOLES[ion.hole]!, dNow)} r={2.6} fill="white" stroke={g.color} strokeWidth={1.2} />
          ))}

        {/* screen */}
        <rect x={SCREEN_X} y={88} width={6} height={124} rx={2} fill="#fef2f2" stroke={g.glow} />
        <text x={SCREEN_X - 2} y={78} textAnchor="end" className="fill-slate-600 text-[10px] font-semibold">canal rays →</text>
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200/70 px-4 py-3">
        <div role="radiogroup" aria-label="Gas in the tube" className="flex gap-2">
          {(Object.keys(GASES) as Gas[]).map((k) => (
            <ControlButton key={k} role="radio" aria-checked={gas === k} active={gas === k} onClick={() => setGas(k)}>
              {GASES[k].label}
            </ControlButton>
          ))}
        </div>
        <ControlButton active={field} onClick={() => setField((v) => !v)}>
          <Zap className="h-4 w-4" />
          {field ? "Field on" : "Apply field"}
        </ControlButton>
      </div>
    </LabWindow>
  )
}
