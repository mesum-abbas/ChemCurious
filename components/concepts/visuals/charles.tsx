"use client"

import { useEffect, useRef, useState } from "react"
import { Flame, Snowflake, Sun } from "lucide-react"
import { ControlButton, LabWindow, useAnimationLoop, type VisualProps } from "../shared"

// viewBox 0 0 600 350. Constant pressure 1.0 atm; V = T / 150 (L) → 2.0 L at 300 K.
const FLOOR = 262
const LEFT = 120
const RIGHT = 300
const PX_PER_L = 50
const K_PER_L = 150
const T_MIN = 100
const T_MAX = 600
const N = 24
const R = 5

type P = { x: number; y: number; vx: number; vy: number }

function makeParticles(): P[] {
  return Array.from({ length: N }, () => {
    const a = Math.random() * Math.PI * 2
    return { x: LEFT + 10 + Math.random() * (RIGHT - LEFT - 20), y: FLOOR - 10 - Math.random() * 90, vx: Math.cos(a), vy: Math.sin(a) }
  })
}

export function CharlesVisual({ activeStep, stepNonce }: VisualProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [temp, setTemp] = useState(300)
  const shownV = useRef(temp / K_PER_L)
  const parts = useRef<P[]>(makeParticles())
  const clock = useRef(0)
  const [, setFrame] = useState(0)

  useEffect(() => {
    if (activeStep === 0) setTemp(273)
    if (activeStep === 1) setTemp(450)
    if (activeStep === 2) setTemp(600)
  }, [activeStep, stepNonce])

  const volume = temp / K_PER_L

  useAnimationLoop((dt) => {
    clock.current += dt
    // Free piston drifts to the new equilibrium volume
    shownV.current += (volume - shownV.current) * Math.min(1, dt * 2.5)
    const top = FLOOR - shownV.current * PX_PER_L
    const speed = 110 * Math.sqrt(temp / 300) // rms speed ∝ √T
    for (const p of parts.current) {
      p.x += p.vx * speed * dt
      p.y += p.vy * speed * dt
      if (p.x < LEFT + R) { p.x = LEFT + R; p.vx = Math.abs(p.vx) }
      if (p.x > RIGHT - R) { p.x = RIGHT - R; p.vx = -Math.abs(p.vx) }
      if (p.y > FLOOR - R) { p.y = FLOOR - R; p.vy = -Math.abs(p.vy) }
      if (p.y < top + R) { p.y = top + R; p.vy = Math.abs(p.vy) }
    }
    setFrame((f) => (f + 1) % 1_000_000)
  }, svgRef)

  const top = FLOOR - shownV.current * PX_PER_L
  const heat = Math.max(0, (temp - 300) / 300) // burner intensity
  const cold = Math.max(0, (300 - temp) / 200) // cooling-bath intensity
  const t = clock.current
  // V–T graph (inset): T 0–600 K on x, V 0–4 L on y
  const gx = (k: number) => 400 + (k / 600) * 170
  const gy = (l: number) => 250 - (l / 4) * 170

  return (
    <LabWindow
      title="charles · free-piston-cylinder"
      badge={<span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">P = 1.0 atm (constant)</span>}
      footer={
        <div className="grid grid-cols-4 gap-2" aria-live="polite">
          {[
            ["Temperature", `${temp} K`],
            ["In Celsius", `${temp - 273} °C`],
            ["Volume", `${volume.toFixed(2)} L`],
            ["Pressure", "1.00 atm"],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0 rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200/80">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{k}</p>
              <p className="truncate font-mono text-sm font-bold text-slate-900">{v}</p>
            </div>
          ))}
        </div>
      }
    >
      <svg ref={svgRef} viewBox="0 0 600 350" className="block w-full" role="img" aria-label={`Gas at ${temp} kelvin occupying ${volume.toFixed(2)} litres at a constant 1 atmosphere.`}>
        {/* cylinder */}
        <path d={`M ${LEFT - 4} 22 V ${FLOOR + 4} H ${RIGHT + 4} V 22`} fill="#f8fafc" stroke="#64748b" strokeWidth={3} />
        {[1, 2, 3, 4].map((l) => (
          <g key={l}>
            <path d={`M ${RIGHT + 6} ${FLOOR - l * PX_PER_L} h 8`} stroke="#94a3b8" strokeWidth={1.5} />
            <text x={RIGHT + 18} y={FLOOR - l * PX_PER_L + 4} className="fill-slate-500 text-[10px] font-semibold">{l} L</text>
          </g>
        ))}
        <rect x={LEFT} y={top} width={RIGHT - LEFT} height={FLOOR - top} fill={heat > 0 ? `rgba(254,215,170,${0.25 + heat * 0.35})` : `rgba(186,230,253,${0.3 + cold * 0.4})`} />
        {parts.current.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={R} fill="#0d9488" />
        ))}

        {/* free piston with constant external pressure */}
        <rect x={LEFT} y={top - 14} width={RIGHT - LEFT} height={14} rx={2} fill="#475569" />
        <path d={`M ${(LEFT + RIGHT) / 2} ${top - 42} V ${top - 18}`} stroke="#334155" strokeWidth={2.5} />
        <path d={`M ${(LEFT + RIGHT) / 2 - 6} ${top - 25} L ${(LEFT + RIGHT) / 2} ${top - 17} L ${(LEFT + RIGHT) / 2 + 6} ${top - 25}`} fill="none" stroke="#334155" strokeWidth={2.5} />
        <text x={(LEFT + RIGHT) / 2} y={top - 48} textAnchor="middle" className="fill-slate-600 text-[10px] font-semibold">1.0 atm outside</text>

        {/* burner or cooling bath */}
        <rect x={LEFT - 20} y={FLOOR + 8} width={RIGHT - LEFT + 40} height={6} rx={3} fill="#94a3b8" />
        {heat > 0.01 &&
          [0, 1, 2].map((k) => {
            const cx = (LEFT + RIGHT) / 2 + (k - 1) * 36
            const h = 18 + heat * 34 + Math.sin(t * 9 + k * 2) * 4
            return (
              <g key={k}>
                <path d={`M ${cx - 10} ${FLOOR + 50} Q ${cx - 12} ${FLOOR + 50 - h * 0.6} ${cx} ${FLOOR + 50 - h} Q ${cx + 12} ${FLOOR + 50 - h * 0.6} ${cx + 10} ${FLOOR + 50} Z`} fill="#fb923c" opacity={0.85} />
                <path d={`M ${cx - 5} ${FLOOR + 50} Q ${cx - 6} ${FLOOR + 50 - h * 0.35} ${cx} ${FLOOR + 50 - h * 0.6} Q ${cx + 6} ${FLOOR + 50 - h * 0.35} ${cx + 5} ${FLOOR + 50} Z`} fill="#3b82f6" opacity={0.7} />
              </g>
            )
          })}
        {heat > 0.01 && <rect x={(LEFT + RIGHT) / 2 - 22} y={FLOOR + 50} width={44} height={18} rx={3} fill="#64748b" />}
        {cold > 0.01 && (
          <g opacity={Math.min(1, 0.4 + cold)}>
            <rect x={LEFT - 30} y={FLOOR + 18} width={RIGHT - LEFT + 60} height={44} rx={8} fill="#bae6fd" stroke="#38bdf8" />
            {[0, 1, 2, 3].map((k) => (
              <rect key={k} x={LEFT - 10 + k * 52} y={FLOOR + 26 + (k % 2) * 8} width={20} height={16} rx={4} fill="white" stroke="#7dd3fc" transform={`rotate(${k * 13 - 15} ${LEFT + k * 52} ${FLOOR + 34})`} />
            ))}
          </g>
        )}
        <text x={(LEFT + RIGHT) / 2} y={FLOOR + 80} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">
          {heat > 0.01 ? "Bunsen burner" : cold > 0.01 ? "cooling bath" : "room temperature"}
        </text>

        {/* V–T graph */}
        <g>
          <path d={`M ${gx(0)} ${gy(0)} V ${gy(4)} M ${gx(0)} ${gy(0)} H ${gx(600)}`} stroke="#94a3b8" strokeWidth={1.5} />
          <path d={`M ${gx(0)} ${gy(0)} L ${gx(T_MIN)} ${gy(T_MIN / K_PER_L)}`} stroke="#0d9488" strokeWidth={2} strokeDasharray="4 4" />
          <path d={`M ${gx(T_MIN)} ${gy(T_MIN / K_PER_L)} L ${gx(T_MAX)} ${gy(T_MAX / K_PER_L)}`} stroke="#0d9488" strokeWidth={2.5} />
          <circle cx={gx(temp)} cy={gy(volume)} r={6} fill="#0d9488" stroke="white" strokeWidth={2} />
          <text x={gx(300)} y={gy(0) + 20} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">T (K)</text>
          <text x={gx(0) - 8} y={gy(4) - 8} className="fill-slate-500 text-[10px] font-semibold">V (L)</text>
          <text x={gx(0) + 4} y={gy(0) - 6} className="fill-slate-400 text-[9px]">0 K</text>
          <text x={gx(600)} y={gy(0) + 12} textAnchor="end" className="fill-slate-400 text-[9px]">600</text>
          <text x={gx(0) - 4} y={gy(4) + 4} textAnchor="end" className="fill-slate-400 text-[9px]">4</text>
          <text x={gx(120)} y={gy(3.4)} className="fill-teal-700 text-[11px] font-semibold">V ∝ T</text>
        </g>
      </svg>

      <div className="space-y-3 border-t border-slate-200/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <label htmlFor="charles-temp" className="w-24 shrink-0 text-sm font-semibold text-slate-700">
            <span className="font-mono text-lg font-bold tabular-nums text-slate-900">{temp}</span> K
          </label>
          <input
            id="charles-temp"
            type="range"
            min={T_MIN}
            max={T_MAX}
            step={5}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
            aria-valuetext={`${temp} kelvin, volume ${volume.toFixed(2)} litres`}
            className="h-2 w-full cursor-pointer accent-primary"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <ControlButton active={temp === 150} onClick={() => setTemp(150)}>
            <Snowflake className="h-4 w-4" /> Cooling bath 150 K
          </ControlButton>
          <ControlButton active={temp === 300} onClick={() => setTemp(300)}>
            <Sun className="h-4 w-4" /> Room 300 K
          </ControlButton>
          <ControlButton active={temp === 600} onClick={() => setTemp(600)}>
            <Flame className="h-4 w-4" /> Burner 600 K
          </ControlButton>
        </div>
      </div>
    </LabWindow>
  )
}
