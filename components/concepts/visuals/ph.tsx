"use client"

import { useEffect, useRef, useState } from "react"
import { FlaskRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { ControlButton, LabWindow, useAnimationLoop, type VisualProps } from "../shared"

// Universal-indicator style colour stops
const STOPS: Array<[number, [number, number, number]]> = [
  [0, [220, 38, 38]],
  [2, [249, 115, 22]],
  [4, [250, 204, 21]],
  [6, [163, 230, 53]],
  [7, [34, 197, 94]],
  [8, [20, 184, 166]],
  [10, [59, 130, 246]],
  [12, [99, 102, 241]],
  [14, [124, 58, 237]],
]
function indicatorColor(pH: number, alpha = 1) {
  const p = Math.min(14, Math.max(0, pH))
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i]!
    const [p0, c0] = STOPS[i - 1]!
    if (p <= p1) {
      const t = (p - p0) / (p1 - p0)
      const c = c0.map((v, k) => Math.round(v + (c1[k]! - v) * t))
      return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`
    }
  }
  return `rgba(124, 58, 237, ${alpha})`
}

const SUPER: Record<string, string> = { "-": "⁻", ".": "·", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" }
/** 10^-x as "3.2 × 10⁻⁵" */
function concentration(exp: number) {
  const value = Math.pow(10, -exp)
  const e = Math.floor(Math.log10(value))
  const m = value / Math.pow(10, e)
  const mant = m.toFixed(1).replace(/\.0$/, "")
  return `${mant === "1" ? "1" : mant} × 10${String(e).split("").map((ch) => SUPER[ch] ?? ch).join("")}`
}

function classify(pH: number) {
  if (pH < 3) return { label: "Strongly acidic", tone: "text-red-600 bg-red-50 ring-red-200" }
  if (pH < 6.5) return { label: "Weakly acidic", tone: "text-orange-600 bg-orange-50 ring-orange-200" }
  if (pH <= 7.5) return { label: "Neutral", tone: "text-green-700 bg-green-50 ring-green-200" }
  if (pH <= 11) return { label: "Weakly basic", tone: "text-blue-600 bg-blue-50 ring-blue-200" }
  return { label: "Strongly basic", tone: "text-violet-700 bg-violet-50 ring-violet-200" }
}

const PRESETS = [
  { label: "Lemon Juice", pH: 2 },
  { label: "Pure Water", pH: 7 },
  { label: "Baking Soda", pH: 9 },
  { label: "Bleach", pH: 13 },
]

const ION_SLOTS = 24
// Ion positions: a 6×4 grid inside the liquid with deterministic jitter, so ions spread evenly
// and never pile up (stable between renders, no hydration mismatch). Rows alternate H⁺/OH⁻ fill order.
const SLOTS = Array.from({ length: ION_SLOTS }, (_, i) => {
  const col = i % 6
  const row = Math.floor(i / 6)
  const j1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1
  const j2 = Math.abs(Math.sin(i * 78.233) * 12345.6789) % 1
  return { x: 136 + col * 33 + (row % 2) * 12 + (j1 - 0.5) * 10, y: 162 + row * 40 + (j2 - 0.5) * 12, phase: j1 * Math.PI * 2 }
})
// Fill order spreads each ion type across the beaker instead of filling row by row
const ORDER = [...SLOTS.keys()].sort((a, b) => ((a * 7) % ION_SLOTS) - ((b * 7) % ION_SLOTS))

export function PhVisual({ activeStep, stepNonce }: VisualProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [pH, setPH] = useState(2)
  const [time, setTime] = useState(0)
  const timeRef = useRef(0)
  const neutral = useRef<{ from: number; start: number } | null>(null)
  const [neutralising, setNeutralising] = useState(false)

  const startNeutralisation = () => {
    const from = Math.abs(pH - 7) < 0.5 ? 2 : pH // start from an acid if already neutral
    setPH(from)
    neutral.current = { from, start: timeRef.current + 0.3 }
    setNeutralising(true)
  }

  // Steps: 0 = acid preset, 1 = base preset, 2 = neutralisation demo
  useEffect(() => {
    if (activeStep === 0) { neutral.current = null; setNeutralising(false); setPH(2) }
    if (activeStep === 1) { neutral.current = null; setNeutralising(false); setPH(13) }
    if (activeStep === 2) startNeutralisation()
  }, [activeStep, stepNonce])

  useAnimationLoop((dt) => {
    timeRef.current += dt
    setTime(timeRef.current)
    const n = neutral.current
    if (n) {
      const t = Math.min(1, Math.max(0, (timeRef.current - n.start) / 2.6))
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      setPH(Number((n.from + (7 - n.from) * e).toFixed(2)))
      if (t >= 1) {
        neutral.current = null
        setNeutralising(false)
      }
    }
  }, svgRef)

  const nH = Math.round(ION_SLOTS / (1 + Math.exp((pH - 7) * 0.75)))
  const liquid = indicatorColor(pH, 0.78)
  const liquidDeep = indicatorColor(pH, 0.95)
  const cls = classify(pH)
  const wave = (offset: number) =>
    Array.from({ length: 13 }, (_, i) => {
      const x = 112 + i * 18.5
      const y = 132 + Math.sin(time * 2 + i * 0.9 + offset) * 2.5
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(" ")

  return (
    <LabWindow
      title="ph-lab · indicator-beaker"
      badge={<span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1", cls.tone)}>{cls.label}</span>}
      footer={
        <div className="grid grid-cols-3 gap-2" aria-live="polite">
          {[
            { k: "pH", v: pH.toFixed(1) },
            { k: "[H⁺] mol/L", v: concentration(pH) },
            { k: "[OH⁻] mol/L", v: concentration(14 - pH) },
          ].map((s) => (
            <div key={s.k} className="min-w-0 rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200/80">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{s.k}</p>
              <p className="truncate font-mono text-sm font-bold text-slate-900">{s.v}</p>
            </div>
          ))}
        </div>
      }
    >
      <svg ref={svgRef} viewBox="0 0 600 340" className="block w-full" role="img" aria-label={`Beaker of solution at pH ${pH.toFixed(1)}, ${cls.label.toLowerCase()}, with ${nH} hydrogen ions and ${ION_SLOTS - nH} hydroxide ions shown.`}>
        <defs>
          <linearGradient id="ph-scale" x1="0" y1="1" x2="0" y2="0">
            {STOPS.map(([p]) => (
              <stop key={p} offset={`${(p / 14) * 100}%`} stopColor={indicatorColor(p)} />
            ))}
          </linearGradient>
          <clipPath id="ph-beaker-clip">
            <path d="M 112 60 V 302 a 18 18 0 0 0 18 18 H 320 a 18 18 0 0 0 18 -18 V 60 Z" />
          </clipPath>
          <linearGradient id="ph-glass" x1="0" x2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="18%" stopColor="white" stopOpacity="0" />
            <stop offset="85%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* dropper + drops during neutralisation */}
        {neutralising && (
          <g>
            <path d="M 214 4 h 22 v 22 l -6 14 h -10 l -6 -14 z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1.5} />
            <text x={248} y={22} className="fill-blue-600 text-[12px] font-bold">+ base (OH⁻)</text>
            {[0, 0.33, 0.66].map((o) => {
              const k = (time * 1.4 + o) % 1
              return <circle key={o} cx={225} cy={44 + k * 86} r={4} fill="#3b82f6" opacity={1 - k * 0.6} />
            })}
          </g>
        )}

        {/* liquid */}
        <g clipPath="url(#ph-beaker-clip)">
          <path d={`${wave(0)} L 340 330 L 110 330 Z`} fill={liquid} style={{ transition: "fill 0.4s" }} />
          <path d={`${wave(1.7)} L 340 330 L 110 330 Z`} fill={liquidDeep} opacity={0.35} transform="translate(0 6)" style={{ transition: "fill 0.4s" }} />
          {SLOTS.map((s, i) => {
            const isH = ORDER.indexOf(i) < nH
            const y = s.y + Math.sin(time * 1.3 + s.phase) * 5
            const x = s.x + Math.cos(time * 0.9 + s.phase) * 3
            return (
              <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                <circle r={isH ? 10 : 12} fill={isH ? "#fff1f2" : "#eff6ff"} stroke={isH ? "#e11d48" : "#2563eb"} strokeWidth={1.75} style={{ transition: "fill 0.3s, stroke 0.3s" }} />
                <text y={3.5} textAnchor="middle" className={cn("text-[10px] font-bold", isH ? "fill-rose-600" : "fill-blue-600")}>
                  {isH ? "H⁺" : "OH⁻"}
                </text>
              </g>
            )
          })}
        </g>

        {/* glass */}
        <path d="M 104 56 h 242" stroke="#94a3b8" strokeWidth={3} strokeLinecap="round" />
        <path d="M 112 60 V 302 a 18 18 0 0 0 18 18 H 320 a 18 18 0 0 0 18 -18 V 60" fill="url(#ph-glass)" stroke="#64748b" strokeWidth={3} />
        {[100, 160, 220, 280].map((y) => (
          <path key={y} d={`M 322 ${y} h 12`} stroke="#94a3b8" strokeWidth={1.5} />
        ))}

        {neutralising && (
          <g>
            <rect x={130} y={84} width={190} height={26} rx={13} fill="white" opacity={0.92} />
            <text x={225} y={102} textAnchor="middle" className="fill-slate-800 text-[13px] font-bold">H⁺ + OH⁻ → H₂O</text>
          </g>
        )}

        {/* pH scale */}
        <g>
          <rect x={430} y={40} width={26} height={280} rx={13} fill="url(#ph-scale)" />
          {[0, 7, 14].map((v) => (
            <text key={v} x={466} y={320 - (v / 14) * 280 + 4} className="fill-slate-500 text-[11px] font-semibold">
              {v}
            </text>
          ))}
          <text x={490} y={88} className="fill-violet-600 text-[11px] font-bold">BASIC</text>
          <text x={490} y={184} className="fill-green-600 text-[11px] font-bold">NEUTRAL</text>
          <text x={490} y={284} className="fill-red-600 text-[11px] font-bold">ACIDIC</text>
          {/* marker */}
          <g transform={`translate(0 ${(320 - (pH / 14) * 280).toFixed(1)})`} style={{ transition: neutralising ? "none" : "transform 0.35s ease-out" }}>
            <path d="M 418 0 l -10 -7 v 14 z" fill="#0f172a" />
            <rect x={366} y={-11} width={40} height={22} rx={11} fill="#0f172a" />
            <text x={386} y={4} textAnchor="middle" className="fill-white text-[11px] font-bold">{pH.toFixed(1)}</text>
          </g>
        </g>
      </svg>

      <div className="space-y-3 border-t border-slate-200/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <label htmlFor="ph-slider" className="w-16 shrink-0 text-sm font-semibold text-slate-700">
            pH <span className="font-mono text-lg font-bold tabular-nums text-slate-900">{pH.toFixed(1)}</span>
          </label>
          <input
            id="ph-slider"
            type="range"
            min={0}
            max={14}
            step={0.1}
            value={pH}
            onChange={(e) => {
              neutral.current = null
              setNeutralising(false)
              setPH(Number(e.target.value))
            }}
            aria-valuetext={`pH ${pH.toFixed(1)}, ${cls.label}`}
            className="h-2 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:shadow-md"
            style={{ background: `linear-gradient(to right, ${STOPS.map(([p]) => `${indicatorColor(p)} ${(p / 14) * 100}%`).join(", ")})` }}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {PRESETS.map((p) => (
            <ControlButton
              key={p.label}
              active={Math.abs(pH - p.pH) < 0.05 && !neutralising}
              onClick={() => {
                neutral.current = null
                setNeutralising(false)
                setPH(p.pH)
              }}
              className="px-3"
            >
              {p.label} <span className="text-xs opacity-70">pH {p.pH}</span>
            </ControlButton>
          ))}
          <ControlButton variant="primary" onClick={startNeutralisation} disabled={neutralising}>
            <FlaskRound className="h-4 w-4" />
            Neutralise
          </ControlButton>
        </div>
        <p className="text-center text-[11px] text-slate-500">Ion counts are illustrative: real H⁺ : OH⁻ ratios change by a factor of 10 for every pH unit.</p>
      </div>
    </LabWindow>
  )
}
