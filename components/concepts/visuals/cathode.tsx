"use client"

import { useEffect, useRef, useState } from "react"
import { Magnet, Zap } from "lucide-react"
import { ControlButton, LabWindow, useAnimationLoop, type VisualProps } from "../shared"

// Geometry (viewBox 0 0 600 300)
const Y0 = 150
const PLATE_X0 = 250
const PLATE_X1 = 380
const SCREEN_X = 545
const D_FIELD = 12 // vertical offset at the end of the plates for one field (beam stays on the screen)
const SPEED = 330 // px/s

/** y position of the beam at x for a given deflection d (negative = up). */
function beamY(x: number, d: number) {
  if (x <= PLATE_X0) return Y0
  const L = PLATE_X1 - PLATE_X0
  if (x <= PLATE_X1) {
    const u = x - PLATE_X0
    return Y0 + (d * u * u) / (L * L)
  }
  return Y0 + d + ((2 * d) / L) * (x - PLATE_X1)
}

export function CathodeVisual({ activeStep, stepNonce }: VisualProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [electric, setElectric] = useState(false)
  const [magnetic, setMagnetic] = useState(false)
  const [frame, setFrame] = useState(0)
  const d = useRef(0)
  const dots = useRef<number[]>([]) // x positions of electrons in flight
  const spawn = useRef(0)

  useEffect(() => {
    if (activeStep === 0) { setElectric(false); setMagnetic(false) }
    if (activeStep === 1) { setElectric(true); setMagnetic(false) }
    if (activeStep === 2) { setElectric(true); setMagnetic(true) }
  }, [activeStep, stepNonce])

  // E pulls electrons up (towards +); B (into the page) pushes them down. Both on: balanced.
  const target = (electric ? -D_FIELD : 0) + (magnetic ? D_FIELD : 0)

  useAnimationLoop((dt) => {
    d.current += (target - d.current) * Math.min(1, dt * 6)
    spawn.current += dt
    while (spawn.current > 0.045) {
      spawn.current -= 0.045
      dots.current.push(70)
    }
    dots.current = dots.current.map((x) => x + SPEED * dt).filter((x) => x < SCREEN_X)
    setFrame((f) => (f + 1) % 1_000_000)
  }, svgRef)

  const dNow = d.current
  const path = Array.from({ length: 50 }, (_, i) => {
    const x = 160 + ((SCREEN_X - 160) * i) / 49
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${beamY(x, dNow).toFixed(1)}`
  }).join(" ")
  const hitY = beamY(SCREEN_X, dNow)
  const status = electric && magnetic ? "Fields balanced: beam straight" : electric ? "Bent towards the + plate" : magnetic ? "Bent by the magnetic field" : "No field: beam straight"

  return (
    <LabWindow
      title="thomson · cathode-ray-tube"
      badge={<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">{status}</span>}
      footer={
        <p className="text-xs leading-relaxed text-slate-600" aria-live="polite">
          {electric && magnetic
            ? "The electric force (up) and magnetic force (down) cancel. Thomson balanced them like this to measure the electron's charge-to-mass ratio."
            : electric
              ? "The beam curves up towards the positive plate: opposite charges attract, so the particles are negative."
              : magnetic
                ? "A magnetic field into the page pushes the moving negative particles downwards."
                : "With no field the beam travels in a straight line from the cathode to the glowing screen."}
        </p>
      }
    >
      <svg ref={svgRef} viewBox="0 0 600 300" className="block w-full" role="img" aria-label={`Cathode ray tube. ${status}.`} data-frame={frame}>
        <defs>
          <linearGradient id="crt-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <radialGradient id="crt-spot">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="60%" stopColor="#4ade80" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* glass tube */}
        <path d="M 60 80 H 470 Q 560 70 565 150 Q 560 230 470 220 H 60 Q 28 220 28 150 Q 28 80 60 80 Z" fill="url(#crt-glass)" stroke="#94a3b8" strokeWidth={2} />
        <text x={300} y={262} textAnchor="middle" className="fill-slate-400 text-[11px] font-semibold">evacuated glass tube (very low pressure)</text>

        {/* magnetic field region */}
        {magnetic && (
          <g opacity={0.55}>
            {Array.from({ length: 4 }, (_, r) =>
              Array.from({ length: 5 }, (_, c) => (
                <g key={`${r}-${c}`} transform={`translate(${PLATE_X0 + 13 + c * 26} ${118 + r * 22})`}>
                  <circle r={5} fill="none" stroke="#6366f1" strokeWidth={1.2} />
                  <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke="#6366f1" strokeWidth={1.2} />
                </g>
              ))
            )}
            <text x={(PLATE_X0 + PLATE_X1) / 2} y={250} textAnchor="middle" className="fill-indigo-600 text-[10px] font-semibold">magnetic field into page</text>
          </g>
        )}

        {/* deflection plates */}
        <g>
          <rect x={PLATE_X0} y={98} width={PLATE_X1 - PLATE_X0} height={7} rx={2} fill={electric ? "#ef4444" : "#cbd5e1"} />
          <rect x={PLATE_X0} y={195} width={PLATE_X1 - PLATE_X0} height={7} rx={2} fill={electric ? "#3b82f6" : "#cbd5e1"} />
          {electric && (
            <>
              <text x={PLATE_X1 + 8} y={106} className="fill-red-600 text-[15px] font-bold">+</text>
              <text x={PLATE_X1 + 8} y={204} className="fill-blue-600 text-[15px] font-bold">−</text>
            </>
          )}
        </g>

        {/* cathode + anode */}
        <rect x={62} y={118} width={8} height={64} rx={2} fill="#334155" />
        <text x={66} y={110} textAnchor="middle" className="fill-slate-700 text-[13px] font-bold">−</text>
        <text x={66} y={200} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">cathode</text>
        <rect x={150} y={104} width={7} height={40} rx={2} fill="#64748b" />
        <rect x={150} y={156} width={7} height={40} rx={2} fill="#64748b" />
        <text x={153} y={96} textAnchor="middle" className="fill-slate-700 text-[13px] font-bold">+</text>
        <text x={153} y={212} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">anode (slit)</text>

        {/* beam */}
        <path d={`M 70 ${Y0} L 160 ${Y0}`} stroke="#22c55e" strokeWidth={6} opacity={0.18} strokeLinecap="round" />
        <path d={`M 70 ${Y0} L 160 ${Y0}`} stroke="#4ade80" strokeWidth={2} />
        <path d={path} fill="none" stroke="#22c55e" strokeWidth={7} opacity={0.18} strokeLinecap="round" />
        <path d={path} fill="none" stroke="#4ade80" strokeWidth={2} />
        {dots.current.map((x, i) => (
          <circle key={i} cx={x} cy={beamY(x, dNow)} r={2.2} fill="#f0fdf4" />
        ))}

        {/* fluorescent screen */}
        <rect x={SCREEN_X} y={88} width={6} height={124} rx={2} fill="#bbf7d0" stroke="#4ade80" />
        <circle cx={SCREEN_X + 3} cy={hitY} r={14} fill="url(#crt-spot)" />
        <text x={SCREEN_X - 2} y={78} textAnchor="end" className="fill-emerald-700 text-[10px] font-semibold">fluorescent screen</text>
      </svg>

      <div className="flex flex-wrap justify-center gap-2 border-t border-slate-200/70 px-4 py-3">
        <ControlButton active={electric} onClick={() => setElectric((v) => !v)}>
          <Zap className="h-4 w-4" />
          Electric field (+/− plates)
        </ControlButton>
        <ControlButton active={magnetic} onClick={() => setMagnetic((v) => !v)}>
          <Magnet className="h-4 w-4" />
          Magnetic field
        </ControlButton>
      </div>
    </LabWindow>
  )
}
