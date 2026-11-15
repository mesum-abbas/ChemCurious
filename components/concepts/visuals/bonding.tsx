"use client"

import { useEffect, useRef, useState } from "react"
import { RotateCcw, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { ControlButton, LabWindow, useAnimationLoop, type VisualProps } from "../shared"

type Mode = "ionic" | "covalent"
const BOND_DURATION = 1.8 // s
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

function shellPoints(cx: number, cy: number, r: number, n: number, rot: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (Math.PI * 2 * i) / n
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
  })
}

export function BondingVisual({ activeStep, stepNonce }: VisualProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [mode, setMode] = useState<Mode>("ionic")
  const [time, setTime] = useState(0)
  const [bondStart, setBondStart] = useState<number | null>(null)
  const timeRef = useRef(0)

  useAnimationLoop((dt) => {
    timeRef.current += dt
    setTime(timeRef.current)
  }, svgRef)

  const progress = bondStart === null ? 0 : clamp01((time - bondStart) / BOND_DURATION)
  const bonded = progress >= 1
  const trigger = () => setBondStart(timeRef.current)
  const reset = () => setBondStart(null)

  // Steps: 0 = highlight valence shells, 1 = ionic transfer, 2 = covalent sharing
  useEffect(() => {
    if (activeStep === 1) {
      setMode("ionic")
      setBondStart(timeRef.current + 0.35)
    } else if (activeStep === 2) {
      setMode("covalent")
      setBondStart(timeRef.current + 0.35)
    } else if (activeStep === 0) {
      setBondStart(null)
    }
  }, [activeStep, stepNonce])

  const highlightValence = activeStep === 0
  const rot = time * 0.5

  return (
    <LabWindow
      title="bonding-studio · bohr-shells"
      badge={
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", bonded ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-500")}>
          {bonded ? "Bond formed" : progress > 0 ? "Bonding…" : "Separate atoms"}
        </span>
      }
      footer={
        <p className="text-xs leading-relaxed text-slate-600" aria-live="polite">
          {mode === "ionic"
            ? bonded
              ? "Sodium gave its valence electron to chlorine. Both ions now have full outer shells, and the opposite charges attract: that attraction is the ionic bond."
              : "Sodium has 1 valence electron and chlorine has 7. Press Trigger Bond to transfer an electron."
            : bonded
              ? "Each hydrogen shares its electron, so both atoms effectively have a full shell of 2. The shared pair is the covalent bond."
              : "Each hydrogen atom has 1 electron but wants 2. Press Trigger Bond to let them share."}
        </p>
      }
    >
      <div className="flex justify-center gap-2 px-4 pt-4" role="radiogroup" aria-label="Bond type">
        {(["ionic", "covalent"] as const).map((m) => (
          <ControlButton
            key={m}
            role="radio"
            aria-checked={mode === m}
            active={mode === m}
            onClick={() => {
              setMode(m)
              reset()
            }}
          >
            {m === "ionic" ? "Ionic (Na⁺ Cl⁻)" : "Covalent (H₂)"}
          </ControlButton>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox="80 62 440 250"
        className="block w-full"
        role="img"
        aria-label={mode === "ionic" ? "Sodium transferring an electron to chlorine to form ions" : "Two hydrogen atoms sharing a pair of electrons"}
      >
        <defs>
          <radialGradient id="bond-na" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#ddd6fe" />
            <stop offset="100%" stopColor="#7c3aed" />
          </radialGradient>
          <radialGradient id="bond-cl" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="100%" stopColor="#16a34a" />
          </radialGradient>
          <radialGradient id="bond-h" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>
        </defs>
        {mode === "ionic" ? <Ionic progress={progress} rot={rot} startRot={(bondStart ?? time) * 0.5} highlight={highlightValence} /> : <Covalent progress={progress} rot={rot} time={time} highlight={highlightValence} />}
      </svg>

      <div className="flex justify-center gap-2 border-t border-slate-200/70 px-4 py-3">
        <ControlButton variant="primary" onClick={trigger} disabled={progress > 0 && !bonded}>
          <Sparkles className="h-4 w-4" />
          Trigger Bond
        </ControlButton>
        <ControlButton variant="ghost" onClick={reset} disabled={bondStart === null}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </ControlButton>
      </div>
    </LabWindow>
  )
}

// ---------------------------------------------------------------------------

function Electron({ x, y, kind }: { x: number; y: number; kind: "inner" | "na" | "cl" | "h" }) {
  const fill = kind === "inner" ? "#cbd5e1" : kind === "na" ? "#f59e0b" : kind === "cl" ? "#0d9488" : "#f59e0b"
  return (
    <g>
      {kind !== "inner" && <circle cx={x} cy={y} r={8} fill={fill} opacity={0.2} />}
      <circle cx={x} cy={y} r={kind === "inner" ? 3 : 5} fill={fill} stroke="white" strokeWidth={kind === "inner" ? 0 : 1.5} />
    </g>
  )
}

function Shell({ cx, cy, r, opacity = 1, highlight = false }: { cx: number; cy: number; r: number; opacity?: number; highlight?: boolean }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={highlight ? "var(--primary)" : "#94a3b8"}
      strokeWidth={highlight ? 2.5 : 1.25}
      strokeDasharray={highlight ? "none" : "3 4"}
      opacity={opacity}
    />
  )
}

function Ionic({ progress, rot, startRot, highlight }: { progress: number; rot: number; startRot: number; highlight: boolean }) {
  const transfer = ease(clamp01(progress / 0.6)) // electron flight
  const after = ease(clamp01((progress - 0.55) / 0.45)) // ions settle
  const naX = lerp(185, 228, after)
  const clX = lerp(415, 384, after)
  const cy = 165

  // Na: 2, 8, (1). Na⁺ is smaller (outer shell lost); Cl⁻ slightly larger.
  const naInner = shellPoints(naX, cy, 24, 2, rot * 1.4)
  const naMid = shellPoints(naX, cy, 42, 8, -rot)
  const clInner = shellPoints(clX, cy, 24, 2, rot * 1.4)
  const clMid = shellPoints(clX, cy, 42, 8, -rot)
  const clOuterR = lerp(60, 64, after)
  const clSlots = shellPoints(clX, cy, clOuterR, 8, rot * 0.6) // slot 7 is empty until the electron arrives

  // The transferring electron leaves from exactly where it was orbiting when the bond was triggered
  const start = shellPoints(185, cy, 60, 1, startRot * 0.6)[0]!
  const end = clSlots[7]!
  const ctrl = { x: (start.x + end.x) / 2, y: cy - 135 }
  const e = (t: number) => ({
    x: (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * ctrl.x + t * t * end.x,
    y: (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * ctrl.y + t * t * end.y,
  })
  const flying = progress > 0 && transfer < 1
  const moving = e(transfer)
  const naValence = progress === 0 ? shellPoints(naX, cy, 60, 1, rot * 0.6)[0]! : null

  return (
    <g>
      {/* attraction arrows once ions form */}
      {after > 0.2 && (
        <g opacity={after} stroke="#0d9488" strokeWidth={2} fill="none" strokeLinecap="round">
          <path d={`M ${naX + 52} ${cy + 92} H ${clX - 70}`} />
          <path d={`M ${naX + 60} ${cy + 86} l -8 6 l 8 6`} />
          <path d={`M ${clX - 78} ${cy + 86} l 8 6 l -8 6`} />
          <text x={(naX + clX) / 2} y={cy + 118} textAnchor="middle" className="fill-teal-700 text-[12px] font-semibold" stroke="none">
            electrostatic attraction
          </text>
        </g>
      )}

      {/* Na */}
      <Shell cx={naX} cy={cy} r={24} />
      <Shell cx={naX} cy={cy} r={42} />
      <Shell cx={naX} cy={cy} r={60} opacity={1 - after} highlight={highlight} />
      <circle cx={naX} cy={cy} r={15} fill="url(#bond-na)" />
      <text x={naX} y={cy + 4.5} textAnchor="middle" className="fill-white text-[13px] font-bold">Na</text>
      {naInner.map((p, i) => <Electron key={`ni${i}`} {...p} kind="inner" />)}
      {naMid.map((p, i) => <Electron key={`nm${i}`} {...p} kind="inner" />)}
      {naValence && <Electron {...naValence} kind="na" />}

      {/* Cl */}
      <Shell cx={clX} cy={cy} r={24} />
      <Shell cx={clX} cy={cy} r={42} />
      <Shell cx={clX} cy={cy} r={clOuterR} highlight={highlight} />
      <circle cx={clX} cy={cy} r={15} fill="url(#bond-cl)" />
      <text x={clX} y={cy + 4.5} textAnchor="middle" className="fill-white text-[13px] font-bold">Cl</text>
      {clInner.map((p, i) => <Electron key={`ci${i}`} {...p} kind="inner" />)}
      {clMid.map((p, i) => <Electron key={`cm${i}`} {...p} kind="inner" />)}
      {clSlots.slice(0, 7).map((p, i) => <Electron key={`co${i}`} {...p} kind="cl" />)}
      {transfer >= 1 && <Electron {...end} kind="na" />}

      {/* electron in flight + its path */}
      {flying && (
        <g>
          <path d={`M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 5" opacity={0.6} />
          <Electron {...moving} kind="na" />
        </g>
      )}

      {/* charges */}
      {after > 0 && (
        <g opacity={after}>
          <ChargeBadge x={naX + 34} y={cy - 46} sign="+" color="#7c3aed" />
          <ChargeBadge x={clX + 52} y={cy - 56} sign="−" color="#16a34a" />
        </g>
      )}

      {/* labels */}
      <text x={naX} y={cy + 92} dy={after > 0.2 ? -14 : 0} textAnchor="middle" className="fill-slate-700 text-[13px] font-semibold">
        {after > 0.5 ? "Na⁺ (2, 8)" : "Na (2, 8, 1)"}
      </text>
      <text x={clX} y={cy + 92} dy={after > 0.2 ? -14 : 0} textAnchor="middle" className="fill-slate-700 text-[13px] font-semibold">
        {after > 0.5 ? "Cl⁻ (2, 8, 8)" : "Cl (2, 8, 7)"}
      </text>
    </g>
  )
}

function Covalent({ progress, rot, time, highlight }: { progress: number; rot: number; time: number; highlight: boolean }) {
  const approach = ease(clamp01(progress / 0.55))
  const share = ease(clamp01((progress - 0.5) / 0.5))
  const cy = 160
  const aX = lerp(190, 262, approach)
  const bX = lerp(410, 338, approach)
  const r = 48

  // Own-atom orbit positions
  const ownA = { x: aX + Math.cos(rot * 1.6) * r, y: cy + Math.sin(rot * 1.6) * r }
  const ownB = { x: bX + Math.cos(-rot * 1.6 + Math.PI) * r, y: cy + Math.sin(-rot * 1.6 + Math.PI) * r }
  // Shared orbit: an ellipse around both nuclei, electrons half a turn apart
  const mid = (aX + bX) / 2
  const sharedAt = (phase: number) => ({ x: mid + Math.cos(time * 1.8 + phase) * 92, y: cy + Math.sin(time * 1.8 + phase) * 40 })
  const eA = share > 0 ? mixPt(ownA, sharedAt(0), share) : ownA
  const eB = share > 0 ? mixPt(ownB, sharedAt(Math.PI), share) : ownB

  return (
    <g>
      {/* overlap lens = shared pair region */}
      {share > 0 && <ellipse cx={mid} cy={cy} rx={92} ry={40} fill="rgba(124,58,237,0.08)" stroke="#8b5cf6" strokeDasharray="4 5" strokeWidth={1.5} opacity={share} />}
      <Shell cx={aX} cy={cy} r={r} highlight={highlight} />
      <Shell cx={bX} cy={cy} r={r} highlight={highlight} />
      <circle cx={aX} cy={cy} r={15} fill="url(#bond-h)" stroke="#64748b" strokeWidth={0.75} />
      <circle cx={bX} cy={cy} r={15} fill="url(#bond-h)" stroke="#64748b" strokeWidth={0.75} />
      <text x={aX} y={cy + 5} textAnchor="middle" className="fill-slate-700 text-[14px] font-bold">H</text>
      <text x={bX} y={cy + 5} textAnchor="middle" className="fill-slate-700 text-[14px] font-bold">H</text>
      <Electron {...eA} kind="h" />
      <Electron {...eB} kind="h" />

      {share > 0.4 && (
        <text x={mid} y={cy - 56} textAnchor="middle" className="fill-violet-700 text-[12px] font-semibold" opacity={share}>
          shared electron pair
        </text>
      )}
      <text x={300} y={cy + 102} textAnchor="middle" className="fill-slate-700 text-[13px] font-semibold">
        {share > 0.5 ? "H–H  (H₂): one single covalent bond" : "H · (1 electron)        H · (1 electron)"}
      </text>
    </g>
  )
}

function mixPt(a: { x: number; y: number }, b: { x: number; y: number }, t: number) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }
}

function ChargeBadge({ x, y, sign, color }: { x: number; y: number; sign: string; color: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={13} fill="white" stroke={color} strokeWidth={2} />
      <text x={x} y={y + 5.5} textAnchor="middle" fontSize={17} fontWeight={800} fill={color}>
        {sign}
      </text>
    </g>
  )
}
