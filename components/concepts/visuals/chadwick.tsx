"use client"

import { useEffect, useRef, useState } from "react"
import { RotateCcw, Zap, Sparkles } from "lucide-react"
import { ControlButton, LabWindow, useAnimationLoop, type VisualProps } from "../shared"

// viewBox 0 0 600 280: Po source → Be sheet → neutrons → paraffin wax → protons → detector
const Y = 140
const BE_X = 150
const WAX_X0 = 380
const WAX_X1 = 410
const DET_X = 528
const FIELD_X0 = 196
const FIELD_X1 = 500
const PROTON_BEND = 34 // vertical deflection of protons across the field region (towards − plate)

type Kind = "alpha" | "neutron" | "proton"
type Particle = { kind: Kind; x: number; y: number; vy: number }

export function ChadwickVisual({ activeStep, stepNonce }: VisualProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [field, setField] = useState(false)
  const fieldRef = useRef(field)
  fieldRef.current = field
  const [, setFrame] = useState(0)
  const particles = useRef<Particle[]>([])
  const queue = useRef<number[]>([]) // scheduled alpha launch times
  const clock = useRef(0)
  const [stats, setStats] = useState({ alphas: 0, neutrons: 0, protons: 0 })
  const flash = useRef(0)

  const burst = (n = 6) => {
    for (let i = 0; i < n; i++) queue.current.push(clock.current + i * 0.16)
  }

  useEffect(() => {
    if (activeStep === 0) { setField(false); burst() }
    if (activeStep === 1) { setField(true); burst() }
    if (activeStep === 2) burst(8)
  }, [activeStep, stepNonce])

  useAnimationLoop((dt) => {
    clock.current += dt
    const add = { alphas: 0, neutrons: 0, protons: 0 }
    queue.current = queue.current.filter((t) => {
      if (t > clock.current) return true
      particles.current.push({ kind: "alpha", x: 72, y: Y + (Math.random() - 0.5) * 16, vy: 0 })
      add.alphas++
      return false
    })

    const next: Particle[] = []
    for (const p of particles.current) {
      const speed = p.kind === "alpha" ? 170 : p.kind === "neutron" ? 230 : 260
      p.x += speed * dt
      if (p.kind === "proton" && fieldRef.current && p.x < FIELD_X1) {
        // charged: accelerates towards the negative (lower) plate
        p.vy += (2 * PROTON_BEND * 260 * 260) / ((FIELD_X1 - WAX_X1) ** 2) * dt
      }
      p.y += p.vy * dt
      if (p.kind === "alpha" && p.x >= BE_X) {
        // ⁹Be + ⁴He → ¹²C + n (most alphas in the model release a neutron)
        if (Math.random() < 0.85) {
          next.push({ kind: "neutron", x: BE_X + 6, y: p.y, vy: (Math.random() - 0.5) * 6 })
          add.neutrons++
        }
        continue
      }
      if (p.kind === "neutron" && p.x >= WAX_X0) {
        // neutron knocks a proton out of the hydrogen-rich wax
        if (Math.random() < 0.9) next.push({ kind: "proton", x: WAX_X1, y: p.y, vy: (Math.random() - 0.5) * 10 })
        continue
      }
      if (p.kind === "proton" && p.x >= DET_X) {
        add.protons++
        flash.current = clock.current
        continue
      }
      next.push(p)
    }
    particles.current = next
    if (add.alphas || add.neutrons || add.protons) {
      setStats((s) => ({ alphas: s.alphas + add.alphas, neutrons: s.neutrons + add.neutrons, protons: s.protons + add.protons }))
    }
    setFrame((f) => (f + 1) % 1_000_000)
  }, svgRef)

  const detGlow = Math.max(0, 1 - (clock.current - flash.current) / 0.5)
  const highlightWax = activeStep === 2

  return (
    <LabWindow
      title="chadwick · beryllium-radiation"
      badge={<span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">{stats.protons} protons detected</span>}
      footer={
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2" aria-live="polite">
            {[
              ["Alphas fired", stats.alphas, "bg-amber-400"],
              ["Neutrons", stats.neutrons, "bg-slate-400"],
              ["Protons detected", stats.protons, "bg-rose-500"],
            ].map(([label, value, dot]) => (
              <div key={label as string} className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200/80">
                <p className="flex items-center gap-1.5 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
                  {label}
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            {field ? "Field on: the neutral neutron beam goes straight through, while the charged protons bend towards the negative plate." : "Switch the field on to test whether the new radiation carries a charge."}
          </p>
        </div>
      }
    >
      <svg ref={svgRef} viewBox="0 0 600 280" className="block w-full" role="img" aria-label={`Chadwick's experiment. ${stats.alphas} alpha particles fired, ${stats.protons} protons detected. Field ${field ? "on" : "off"}.`}>
        <rect x={0} y={0} width={600} height={280} fill="#f8fafc" />

        {/* field plates */}
        <rect x={FIELD_X0} y={70} width={FIELD_X1 - FIELD_X0} height={6} rx={2} fill={field ? "#ef4444" : "#e2e8f0"} />
        <rect x={FIELD_X0} y={210} width={FIELD_X1 - FIELD_X0} height={6} rx={2} fill={field ? "#3b82f6" : "#e2e8f0"} />
        {field && (
          <>
            <text x={FIELD_X0 - 14} y={78} className="fill-red-600 text-[14px] font-bold">+</text>
            <text x={FIELD_X0 - 14} y={218} className="fill-blue-600 text-[14px] font-bold">−</text>
            <text x={(FIELD_X0 + WAX_X0) / 2} y={62} textAnchor="middle" className="fill-slate-600 text-[10px] font-semibold">electric field</text>
          </>
        )}

        {/* polonium source */}
        <rect x={20} y={Y - 26} width={50} height={52} rx={6} fill="#475569" />
        <rect x={62} y={Y - 8} width={12} height={16} fill="#334155" />
        <text x={45} y={Y + 5} textAnchor="middle" className="fill-white text-[13px] font-bold">Po</text>
        <text x={45} y={Y + 44} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">polonium</text>
        <text x={45} y={Y + 56} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">(α source)</text>

        {/* beryllium */}
        <rect x={BE_X} y={Y - 44} width={6} height={88} rx={1.5} fill="#94a3b8" stroke="#64748b" />
        <text x={BE_X + 3} y={Y - 52} textAnchor="middle" className="fill-slate-700 text-[12px] font-bold">Be</text>
        <text x={BE_X + 3} y={Y + 60} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">beryllium</text>

        {/* paraffin wax */}
        <rect x={WAX_X0} y={Y - 46} width={WAX_X1 - WAX_X0} height={92} rx={4} fill="#fefce8" stroke={highlightWax ? "var(--primary)" : "#d6d3d1"} strokeWidth={highlightWax ? 2.5 : 1.5} />
        <text x={(WAX_X0 + WAX_X1) / 2} y={Y - 54} textAnchor="middle" className="fill-slate-700 text-[11px] font-bold">paraffin</text>
        <text x={(WAX_X0 + WAX_X1) / 2} y={Y + 62} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">(hydrogen-rich)</text>

        {/* detector */}
        <rect x={DET_X} y={Y - 60} width={42} height={120} rx={8} fill={`rgba(244,63,94,${0.08 + detGlow * 0.35})`} stroke="#fb7185" strokeWidth={1.5} />
        <text x={DET_X + 21} y={Y} textAnchor="middle" transform={`rotate(-90 ${DET_X + 21} ${Y})`} dy={4} className="fill-rose-700 text-[11px] font-bold tracking-wide">DETECTOR</text>

        {/* particles */}
        {particles.current.map((p, i) =>
          p.kind === "alpha" ? (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5} fill="#f59e0b" />
              <text x={p.x} y={p.y + 3} textAnchor="middle" className="fill-white text-[7px] font-bold">α</text>
            </g>
          ) : p.kind === "neutron" ? (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5} fill="white" stroke="#64748b" strokeWidth={1.5} />
              <text x={p.x} y={p.y + 3} textAnchor="middle" className="fill-slate-600 text-[7px] font-bold">n</text>
            </g>
          ) : (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4.5} fill="#f43f5e" />
              <text x={p.x} y={p.y + 3} textAnchor="middle" className="fill-white text-[7px] font-bold">p</text>
            </g>
          )
        )}

        {/* labels */}
        <text x={(BE_X + WAX_X0) / 2} y={Y + 92} textAnchor="middle" className="fill-slate-600 text-[11px] font-semibold">neutral radiation (neutrons)</text>
        <text x={(WAX_X1 + DET_X) / 2} y={Y + 92} textAnchor="middle" className="fill-rose-600 text-[11px] font-semibold">protons</text>
      </svg>

      <div className="flex flex-wrap justify-center gap-2 border-t border-slate-200/70 px-4 py-3">
        <ControlButton variant="primary" onClick={() => burst()}>
          <Sparkles className="h-4 w-4" />
          Fire Alpha Burst
        </ControlButton>
        <ControlButton active={field} onClick={() => setField((v) => !v)}>
          <Zap className="h-4 w-4" />
          Electric / magnetic field
        </ControlButton>
        <ControlButton variant="ghost" onClick={() => setStats({ alphas: 0, neutrons: 0, protons: 0 })}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </ControlButton>
      </div>
    </LabWindow>
  )
}
