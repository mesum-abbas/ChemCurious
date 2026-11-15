"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { ControlButton, LabWindow, useAnimationLoop, type VisualProps } from "../shared"

// viewBox 0 0 600 320. Cylinder inner: x 74..286, floor y 290; 60 px per litre.
const FLOOR = 290
const PX_PER_L = 60
const LEFT = 74
const RIGHT = 286
const PV = 4.0 // atm·L — fixed amount of gas at constant temperature
const V_MIN = 1.0
const V_MAX = 4.0
const N = 26
const SPEED = 125 // constant temperature → constant particle speed
const R = 5

type P = { x: number; y: number; vx: number; vy: number }

function makeParticles(top: number): P[] {
  return Array.from({ length: N }, () => {
    const a = Math.random() * Math.PI * 2
    return { x: LEFT + R + Math.random() * (RIGHT - LEFT - 2 * R), y: top + R + Math.random() * (FLOOR - top - 2 * R), vx: Math.cos(a) * SPEED, vy: Math.sin(a) * SPEED }
  })
}

export function BoyleVisual({ activeStep, stepNonce }: VisualProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [volume, setVolume] = useState(4.0)
  const shown = useRef(4.0) // piston eases towards the target volume
  const parts = useRef<P[]>(makeParticles(FLOOR - 4 * PX_PER_L))
  const hits = useRef<number[]>([]) // timestamps of wall collisions (last 1 s)
  const clock = useRef(0)
  const [rate, setRate] = useState(0)
  const [, setFrame] = useState(0)
  const dragging = useRef(false)

  useEffect(() => {
    if (activeStep === 0) setVolume(4.0)
    if (activeStep === 1) setVolume(2.0)
    if (activeStep === 2) setVolume(1.0)
  }, [activeStep, stepNonce])

  useAnimationLoop((dt) => {
    clock.current += dt
    shown.current += (volume - shown.current) * Math.min(1, dt * 8)
    const top = FLOOR - shown.current * PX_PER_L
    for (const p of parts.current) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.x < LEFT + R) { p.x = LEFT + R; p.vx = Math.abs(p.vx); hits.current.push(clock.current) }
      if (p.x > RIGHT - R) { p.x = RIGHT - R; p.vx = -Math.abs(p.vx); hits.current.push(clock.current) }
      if (p.y > FLOOR - R) { p.y = FLOOR - R; p.vy = -Math.abs(p.vy); hits.current.push(clock.current) }
      if (p.y < top + R) { p.y = top + R; p.vy = Math.abs(p.vy); hits.current.push(clock.current) }
    }
    hits.current = hits.current.filter((t) => clock.current - t < 1)
    setRate((r) => r + (hits.current.length - r) * Math.min(1, dt * 3))
    setFrame((f) => (f + 1) % 1_000_000)
  }, svgRef)

  // Drag the piston handle (converted to viewBox coordinates)
  const toVolume = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    const v = Math.min(V_MAX, Math.max(V_MIN, (FLOOR - pt.y) / PX_PER_L))
    setVolume(Math.round(v * 10) / 10)
  }

  const top = FLOOR - shown.current * PX_PER_L
  const pressure = PV / volume
  // Gauge: 0–5 atm over a 240° sweep
  const angle = -120 + (Math.min(5, pressure) / 5) * 240

  return (
    <LabWindow
      title="boyle · piston-and-gauge"
      badge={<span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">T constant</span>}
      footer={
        <div className="grid grid-cols-4 gap-2" aria-live="polite">
          {[
            ["Volume", `${volume.toFixed(1)} L`],
            ["Pressure", `${pressure.toFixed(2)} atm`],
            ["P × V", `${(pressure * volume).toFixed(2)} atm·L`],
            ["Wall hits", `${Math.round(rate)} /s`],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0 rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200/80">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{k}</p>
              <p className="truncate font-mono text-sm font-bold text-slate-900">{v}</p>
            </div>
          ))}
        </div>
      }
    >
      <svg
        ref={svgRef}
        viewBox="0 0 600 320"
        className="block w-full touch-pan-y select-none"
        role="img"
        aria-label={`Sealed cylinder at ${volume.toFixed(1)} litres; pressure ${pressure.toFixed(2)} atmospheres.`}
        onPointerMove={(e) => dragging.current && toVolume(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerLeave={() => (dragging.current = false)}
      >
        {/* scale */}
        {[1, 2, 3, 4].map((l) => (
          <g key={l}>
            <path d={`M 292 ${FLOOR - l * PX_PER_L} h 10`} stroke="#94a3b8" strokeWidth={1.5} />
            <text x={306} y={FLOOR - l * PX_PER_L + 4} className="fill-slate-500 text-[11px] font-semibold">{l}.0 L</text>
          </g>
        ))}

        {/* cylinder */}
        <path d={`M ${LEFT - 4} 36 V ${FLOOR + 4} H ${RIGHT + 4} V 36`} fill="#f8fafc" stroke="#64748b" strokeWidth={3} />
        <rect x={LEFT} y={top} width={RIGHT - LEFT} height={FLOOR - top} fill="#ecfeff" />
        {parts.current.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={R} fill="#0d9488" />
        ))}

        {/* piston + rod + handle (draggable) */}
        <rect x={(LEFT + RIGHT) / 2 - 6} y={8} width={12} height={top - 8} fill="#cbd5e1" />
        <g
          className="cursor-ns-resize"
          onPointerDown={(e) => {
            dragging.current = true
            ;(e.currentTarget.ownerSVGElement as SVGSVGElement | null)?.setPointerCapture?.(e.pointerId)
          }}
        >
          <rect x={LEFT} y={top - 14} width={RIGHT - LEFT} height={14} rx={2} fill="#475569" />
          <rect x={(LEFT + RIGHT) / 2 - 34} y={top - 34} width={68} height={16} rx={8} fill="#334155" />
          <text x={(LEFT + RIGHT) / 2} y={top - 22} textAnchor="middle" className="fill-white text-[9px] font-bold">DRAG</text>
        </g>

        {/* pressure gauge */}
        <g transform="translate(455 160)">
          <circle r={92} fill="white" stroke="#cbd5e1" strokeWidth={3} />
          {Array.from({ length: 11 }, (_, i) => {
            const a = ((-120 + i * 24 - 90) * Math.PI) / 180
            const major = i % 2 === 0
            return (
              <g key={i}>
                <path d={`M ${Math.cos(a) * (major ? 70 : 76)} ${Math.sin(a) * (major ? 70 : 76)} L ${Math.cos(a) * 84} ${Math.sin(a) * 84}`} stroke={i >= 8 ? "#e11d48" : "#64748b"} strokeWidth={major ? 2.5 : 1.5} />
                {major && (
                  <text x={Math.cos(a) * 56} y={Math.sin(a) * 56 + 4} textAnchor="middle" className="fill-slate-600 text-[12px] font-bold">
                    {i / 2}
                  </text>
                )}
              </g>
            )
          })}
          <text y={40} textAnchor="middle" className="fill-slate-500 text-[11px] font-semibold">atm</text>
          <g style={{ transform: `rotate(${angle}deg)`, transition: "transform 0.4s cubic-bezier(.3,1.4,.6,1)" }}>
            <path d="M -3 8 L 0 -74 L 3 8 Z" fill="#0f172a" />
          </g>
          <circle r={7} fill="#0f172a" />
          <text y={68} textAnchor="middle" className="fill-slate-900 font-mono text-[15px] font-bold">{pressure.toFixed(2)}</text>
        </g>
      </svg>

      <div className="space-y-3 border-t border-slate-200/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <label htmlFor="boyle-volume" className="w-24 shrink-0 text-sm font-semibold text-slate-700">
            V <span className="font-mono text-lg font-bold tabular-nums text-slate-900">{volume.toFixed(1)}</span> L
          </label>
          <input
            id="boyle-volume"
            type="range"
            min={V_MIN}
            max={V_MAX}
            step={0.1}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-valuetext={`${volume.toFixed(1)} litres, pressure ${pressure.toFixed(2)} atmospheres`}
            className="h-2 w-full cursor-pointer accent-primary"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {[4.0, 2.0, 1.0].map((v) => (
            <ControlButton key={v} active={volume === v} onClick={() => setVolume(v)}>
              {v.toFixed(1)} L → {(PV / v).toFixed(1)} atm
            </ControlButton>
          ))}
        </div>
      </div>
    </LabWindow>
  )
}
