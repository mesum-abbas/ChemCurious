"use client"

import { useEffect, useRef, useState } from "react"
import { Snowflake, Droplet, Wind } from "lucide-react"
import { cn } from "@/lib/utils"
import { ControlButton, LabWindow, prepareCanvas, useAnimationLoop, type VisualProps } from "../shared"

// One continuous particle model; the temperature (modelled on water) blends three regimes:
// solid  = particles tied to lattice sites (vibration only)
// liquid = gravity + short-range attraction (particles pool and slide past each other)
// gas    = fast, free particles filling the container
const W = 600
const H = 360
const BOX = { l: 24, r: 576, t: 24, b: 336 }
const R = 9
const N = 42
const COLS = 7
const SPACING = 19.5
const T_MIN = -20
const T_MAX = 150

type P = { x: number; y: number; vx: number; vy: number; sx: number; sy: number }

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

function phaseOf(T: number) {
  const solid = 1 - smooth(-3, 3, T)
  const gas = smooth(97, 103, T)
  return { solid, gas, liquid: Math.max(0, 1 - solid - gas) }
}

function makeParticles(): P[] {
  const rows = Math.ceil(N / COLS)
  const x0 = (W - (COLS - 1) * SPACING) / 2
  return Array.from({ length: N }, (_, i) => {
    const c = i % COLS
    const r = Math.floor(i / COLS)
    const sx = x0 + c * SPACING
    const sy = BOX.b - R - 1 - (rows - 1 - r) * SPACING
    return { x: sx, y: sy, vx: 0, vy: 0, sx, sy }
  })
}

function particleColor(T: number) {
  // cold blue → teal → warm orange
  const k = (T - T_MIN) / (T_MAX - T_MIN)
  const hue = k < 0.45 ? 205 - (k / 0.45) * 30 : 175 - ((k - 0.45) / 0.55) * 155
  return `hsl(${hue.toFixed(0)} 75% 52%)`
}

export function StatesVisual({ activeStep, stepNonce }: VisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [temp, setTemp] = useState(-10)
  const tempRef = useRef(temp)
  tempRef.current = temp
  const parts = useRef<P[]>(makeParticles())
  const avgSpeed = useRef(0)
  const [speedReadout, setSpeedReadout] = useState(0)
  const frame = useRef(0)

  // Steps: 0 = solid, 1 = liquid, 2 = gas
  useEffect(() => {
    if (activeStep === 0) setTemp(-10)
    if (activeStep === 1) setTemp(25)
    if (activeStep === 2) setTemp(130)
  }, [activeStep, stepNonce])

  useAnimationLoop((dt) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const T = tempRef.current
    const { solid, liquid, gas } = phaseOf(T)
    const vTarget = (18 + (T - T_MIN) * 0.85) * (1 + 1.7 * gas)
    const gravity = 160 * (liquid + solid) + 6 * gas
    const spring = 170 * solid
    const cohesion = 210 * liquid
    const ps = parts.current

    const sub = 2
    const h = dt / sub
    for (let s = 0; s < sub; s++) {
      // pair forces (n = 42 → 861 pairs, cheap)
      for (let i = 0; i < ps.length; i++) {
        const a = ps[i]!
        for (let j = i + 1; j < ps.length; j++) {
          const b = ps[j]!
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d2 = dx * dx + dy * dy
          if (d2 > 36 * 36) continue
          const d = Math.sqrt(d2) || 0.01
          let f = 0
          if (d < 2 * R) f = -2600 * (2 * R - d) // overlap: push apart
          else if (cohesion > 0 && d < 34) f = cohesion // short-range attraction
          const fx = (f * dx) / d
          const fy = (f * dy) / d
          a.vx += fx * h
          a.vy += fy * h
          b.vx -= fx * h
          b.vy -= fy * h
        }
      }
      let sum = 0
      for (const p of ps) {
        if (spring > 0) {
          p.vx += (p.sx - p.x) * spring * h
          p.vy += (p.sy - p.y) * spring * h
        }
        p.vy += gravity * h
        // thermal kicks (keep particles jiggling, strongest when solid)
        const kick = vTarget * (6 + 10 * solid) * h
        p.vx += (Math.random() - 0.5) * kick
        p.vy += (Math.random() - 0.5) * kick
        sum += Math.hypot(p.vx, p.vy)
      }
      // thermostat: steer the average speed towards the target for this temperature
      const avg = sum / ps.length || 1
      const scale = 1 + (vTarget / avg - 1) * Math.min(1, 4 * h)
      for (const p of ps) {
        p.vx *= scale
        p.vy *= scale
        p.x += p.vx * h
        p.y += p.vy * h
        if (p.x < BOX.l + R) { p.x = BOX.l + R; p.vx = Math.abs(p.vx) }
        if (p.x > BOX.r - R) { p.x = BOX.r - R; p.vx = -Math.abs(p.vx) }
        if (p.y < BOX.t + R) { p.y = BOX.t + R; p.vy = Math.abs(p.vy) }
        if (p.y > BOX.b - R) { p.y = BOX.b - R; p.vy = -Math.abs(p.vy) * (gas > 0.5 ? 1 : 0.6) }
      }
      avgSpeed.current = avg
    }
    if (++frame.current % 10 === 0) setSpeedReadout(avgSpeed.current)

    // draw
    const ctx = prepareCanvas(canvas, W, H)
    ctx.clearRect(0, 0, W, H)
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, "#f8fafc")
    bg.addColorStop(1, "#ecfeff")
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
    // container
    ctx.strokeStyle = "#94a3b8"
    ctx.lineWidth = 3
    ctx.strokeRect(BOX.l - 2, BOX.t - 2, BOX.r - BOX.l + 4, BOX.b - BOX.t + 4)
    // heat glow at the base
    const heat = (T - T_MIN) / (T_MAX - T_MIN)
    const base = ctx.createLinearGradient(0, BOX.b - 40, 0, BOX.b)
    base.addColorStop(0, "rgba(251,146,60,0)")
    base.addColorStop(1, `rgba(251,146,60,${0.05 + heat * 0.25})`)
    ctx.fillStyle = base
    ctx.fillRect(BOX.l, BOX.b - 40, BOX.r - BOX.l, 40)

    const color = particleColor(T)
    // faint bonds between close neighbours (strong in solids, fading in liquids)
    const bondAlpha = 0.45 * solid + 0.15 * liquid
    if (bondAlpha > 0.02) {
      ctx.strokeStyle = `rgba(13,148,136,${bondAlpha})`
      ctx.lineWidth = 1.5
      for (let i = 0; i < ps.length; i++)
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i]!
          const b = ps[j]!
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 23) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
    }
    for (const p of ps) {
      if (gas > 0.3) {
        // motion streaks for fast gas particles
        ctx.strokeStyle = `rgba(251,146,60,${0.25 * gas})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04)
        ctx.stroke()
      }
      const g = ctx.createRadialGradient(p.x - 3, p.y - 3, 1, p.x, p.y, R)
      g.addColorStop(0, "rgba(255,255,255,0.95)")
      g.addColorStop(0.35, color)
      g.addColorStop(1, color)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(p.x, p.y, R, 0, Math.PI * 2)
      ctx.fill()
    }
  }, canvasRef)

  const { solid, gas } = phaseOf(temp)
  const phase = solid > 0.5 ? "Solid" : gas > 0.5 ? "Gas" : "Liquid"
  const forces = phase === "Solid" ? "Strong — particles held in place" : phase === "Liquid" ? "Moderate — particles stay close" : "Negligible — particles move freely"
  const ke = Math.min(100, Math.round((speedReadout / 460) * 100))
  const PhaseIcon = phase === "Solid" ? Snowflake : phase === "Liquid" ? Droplet : Wind

  return (
    <LabWindow
      title="particle-box · kinetic-model"
      badge={
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1", phase === "Solid" ? "bg-sky-50 text-sky-700 ring-sky-200" : phase === "Liquid" ? "bg-teal-50 text-teal-700 ring-teal-200" : "bg-orange-50 text-orange-700 ring-orange-200")}>
          <PhaseIcon className="h-3 w-3" aria-hidden />
          {phase}
        </span>
      }
      footer={
        <div className="grid grid-cols-2 gap-2 text-xs" aria-live="polite">
          <div className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200/80">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Average kinetic energy</p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-teal-400 to-orange-400 transition-[width] duration-300" style={{ width: `${Math.max(4, ke)}%` }} />
            </div>
          </div>
          <div className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200/80">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Intermolecular forces</p>
            <p className="mt-0.5 font-semibold text-slate-800">{forces}</p>
          </div>
        </div>
      }
    >
      <canvas ref={canvasRef} className="block aspect-[5/3] w-full" role="img" aria-label={`Particles in a container at ${temp} degrees Celsius, behaving as a ${phase.toLowerCase()}.`} />

      <div className="space-y-3 border-t border-slate-200/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <label htmlFor="temp-slider" className="w-24 shrink-0 text-sm font-semibold text-slate-700">
            <span className="font-mono text-lg font-bold tabular-nums text-slate-900">{temp}</span> °C
          </label>
          <input
            id="temp-slider"
            type="range"
            min={T_MIN}
            max={T_MAX}
            step={1}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
            aria-valuetext={`${temp} degrees Celsius, ${phase}`}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-sky-400 via-teal-400 to-orange-400 accent-primary [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
          />
        </div>
        <div className="flex justify-between px-1 text-[10px] font-medium text-slate-400" aria-hidden>
          <span>−20 °C</span>
          <span>0 °C melts</span>
          <span>100 °C boils</span>
          <span>150 °C</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <ControlButton active={phase === "Solid"} onClick={() => setTemp(-10)}>
            <Snowflake className="h-4 w-4" /> Solid
          </ControlButton>
          <ControlButton active={phase === "Liquid"} onClick={() => setTemp(25)}>
            <Droplet className="h-4 w-4" /> Liquid
          </ControlButton>
          <ControlButton active={phase === "Gas"} onClick={() => setTemp(130)}>
            <Wind className="h-4 w-4" /> Gas
          </ControlButton>
        </div>
      </div>
    </LabWindow>
  )
}
