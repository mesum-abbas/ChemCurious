"use client"

import { useEffect, useRef, useState } from "react"
import { Crosshair, Pause, RotateCcw, Zap } from "lucide-react"
import { ControlButton, LabWindow, prepareCanvas, useAnimationLoop, type VisualProps } from "../shared"

// ---- Model (logical canvas units). Constants tuned offline over 20k particles:
// ~89% straight (<4°), ~9% slightly deflected, ~1.5% bounced back (>90°).
// Real foil: ~1 in 8,000 bounce back — rates are exaggerated so the rare event is visible.
const W = 640
const H = 400
const CX = 330
const CY = 200
const DETECTOR_R = 205
const SPEED = 260 // px/s
const K = 4e5 // repulsion strength
const SCREEN = 0.9 // screening length: electrons screen the nucleus beyond this distance
const NUCLEI = Array.from({ length: 7 }, (_, i) => ({ x: CX, y: 50 + i * 50 }))
const STRAIGHT_DEG = 4
const SUBSTEP = 1 / 600
const TRAIL = 22

type Kind = "straight" | "slight" | "back"
type Particle = { x: number; y: number; vx: number; vy: number; trail: number[]; inside: boolean }
type Hit = { x: number; y: number; kind: Kind; t: number }

const KIND_COLOR: Record<Kind, string> = { straight: "#34d399", slight: "#fbbf24", back: "#fb7185" }

export function RutherfordVisual({ activeStep, stepNonce }: VisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const hits = useRef<Hit[]>([])
  const streamTimer = useRef(0)
  const timeRef = useRef(0)
  const [streaming, setStreaming] = useState(false)
  const [counts, setCounts] = useState({ straight: 0, slight: 0, back: 0 })
  const stepRef = useRef<number | null>(activeStep)
  stepRef.current = activeStep

  const spawn = (y = 56 + Math.random() * 288) => {
    if (particles.current.length > 80) return
    particles.current.push({ x: 46, y, vx: SPEED, vy: 0, trail: [], inside: false })
  }

  // Step demos: re-run every time a step is clicked
  useEffect(() => {
    if (activeStep === null) return
    const timers: number[] = []
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
    if (activeStep === 0) for (let i = 0; i < 6; i++) later(i * 140, () => spawn())
    if (activeStep === 1) NUCLEI.slice(0, -1).forEach((n, i) => later(i * 160, () => spawn(n.y + 25))) // through the gaps
    if (activeStep === 2) [0.05, -0.12, 0.25, -0.4, 0.6].forEach((b, i) => later(i * 420, () => spawn(NUCLEI[1 + (i % 5)]!.y + b))) // near-head-on
    return () => timers.forEach(clearTimeout)
  }, [activeStep, stepNonce])

  useAnimationLoop((dt) => {
    const canvas = canvasRef.current
    if (!canvas) return
    timeRef.current += dt
    const t = timeRef.current

    if (streaming) {
      streamTimer.current += dt
      while (streamTimer.current > 0.07) {
        streamTimer.current -= 0.07
        spawn()
      }
    }

    // ---- physics
    const done: Kind[] = []
    const steps = Math.max(1, Math.round(dt / SUBSTEP))
    const h = dt / steps
    particles.current = particles.current.filter((p) => {
      for (let s = 0; s < steps; s++) {
        let ax = 0
        let ay = 0
        for (const n of NUCLEI) {
          const dx = p.x - n.x
          const dy = p.y - n.y
          const r2 = dx * dx + dy * dy
          if (r2 > 900) continue
          const r = Math.sqrt(r2) + 0.05
          const f = (K * Math.exp(-r / SCREEN)) / (r * r * r)
          ax += f * dx
          ay += f * dy
        }
        p.vx += ax * h
        p.vy += ay * h
        const sp = Math.hypot(p.vx, p.vy)
        p.vx *= SPEED / sp
        p.vy *= SPEED / sp
        p.x += p.vx * h
        p.y += p.vy * h
      }
      p.trail.push(p.x, p.y)
      if (p.trail.length > TRAIL * 2) p.trail.splice(0, 2)

      const dist = Math.hypot(p.x - CX, p.y - CY)
      if (dist < DETECTOR_R) p.inside = true
      const out = p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10
      if ((p.inside && dist >= DETECTOR_R) || out) {
        const ang = (Math.abs(Math.atan2(p.vy, p.vx)) * 180) / Math.PI
        const kind: Kind = ang < STRAIGHT_DEG ? "straight" : ang < 90 ? "slight" : "back"
        done.push(kind)
        if (!out) hits.current.push({ x: p.x, y: p.y, kind, t })
        return false
      }
      return true
    })
    if (hits.current.length > 400) hits.current.splice(0, hits.current.length - 400)
    if (done.length) {
      setCounts((c) => {
        const next = { ...c }
        for (const k of done) next[k]++
        return next
      })
    }

    // ---- draw
    const ctx = prepareCanvas(canvas, W, H)
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, "#0b1220")
    bg.addColorStop(1, "#111c2e")
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // detector ring (zinc sulfide screen)
    ctx.save()
    ctx.strokeStyle = "rgba(45, 212, 191, 0.35)"
    ctx.lineWidth = 6
    ctx.setLineDash([2, 5])
    ctx.beginPath()
    ctx.arc(CX, CY, DETECTOR_R, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    ctx.fillStyle = "rgba(94, 234, 212, 0.75)"
    ctx.font = "600 10px 'Open Sans', sans-serif"
    ctx.fillText("DETECTOR SCREEN", CX + 118, 22)

    // hits: bright flash fading into a faint persistent mark
    for (const hp of hits.current) {
      const age = t - hp.t
      const flash = Math.max(0, 1 - age / 0.8)
      ctx.fillStyle = KIND_COLOR[hp.kind]
      ctx.globalAlpha = 0.28 + 0.7 * flash
      ctx.beginPath()
      ctx.arc(hp.x, hp.y, 2.2 + 4 * flash, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // gold foil band + atoms
    ctx.fillStyle = "rgba(251, 191, 36, 0.06)"
    ctx.fillRect(CX - 14, 22, 28, H - 44)
    ctx.fillStyle = "rgba(253, 230, 138, 0.8)"
    ctx.fillText("GOLD FOIL", CX - 26, H - 8)
    const step = stepRef.current
    for (const n of NUCLEI) {
      const cloud = ctx.createRadialGradient(n.x, n.y, 2, n.x, n.y, 23)
      cloud.addColorStop(0, "rgba(253, 224, 71, 0.22)")
      cloud.addColorStop(1, "rgba(253, 224, 71, 0)")
      ctx.fillStyle = cloud
      ctx.beginPath()
      ctx.arc(n.x, n.y, 23, 0, Math.PI * 2)
      ctx.fill()
      const pulse = step === 2 ? 4 + Math.sin(t * 6) * 2 : 0
      const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 9 + pulse)
      glow.addColorStop(0, "rgba(251, 146, 60, 0.95)")
      glow.addColorStop(1, "rgba(251, 146, 60, 0)")
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(n.x, n.y, 9 + pulse, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#fff7ed"
      ctx.beginPath()
      ctx.arc(n.x, n.y, 2.6, 0, Math.PI * 2)
      ctx.fill()
    }

    // emitter
    const ePulse = step === 0 ? 0.5 + 0.5 * Math.sin(t * 5) : 0
    ctx.fillStyle = `rgba(251, 191, 36, ${0.18 + ePulse * 0.35})`
    roundRect(ctx, 16, 40, 26, 320, 8)
    ctx.fill()
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.6 + ePulse * 0.4})`
    ctx.lineWidth = 1.5
    roundRect(ctx, 16, 40, 26, 320, 8)
    ctx.stroke()
    ctx.save()
    ctx.translate(33, 200)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = "#fde68a"
    ctx.font = "700 10px 'Open Sans', sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("α  EMITTER", 0, 3)
    ctx.restore()

    // step annotations
    ctx.font = "600 11px 'Open Sans', sans-serif"
    if (step === 0) label(ctx, 56, 30, "α particles (He²⁺) → foil", "#fde68a")
    if (step === 1) {
      ctx.fillStyle = "rgba(52, 211, 153, 0.10)"
      for (let i = 0; i < NUCLEI.length - 1; i++) ctx.fillRect(CX - 40, NUCLEI[i]!.y + 9, 80, 32)
      label(ctx, CX + 46, 128, "mostly empty space", "#6ee7b7")
    }
    if (step === 2) label(ctx, CX + 18, 92, "tiny, dense + nucleus", "#fdba74")

    // particles
    for (const p of particles.current) {
      const tr = p.trail
      for (let i = 2; i < tr.length; i += 2) {
        ctx.strokeStyle = `rgba(252, 211, 77, ${(i / tr.length) * 0.55})`
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(tr[i - 2]!, tr[i - 1]!)
        ctx.lineTo(tr[i]!, tr[i + 1]!)
        ctx.stroke()
      }
      ctx.fillStyle = "rgba(253, 230, 138, 0.35)"
      ctx.beginPath()
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#fef3c7"
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, canvasRef)

  const total = counts.straight + counts.slight + counts.back
  const pct = (n: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : "—")

  return (
    <LabWindow
      title="gold-foil · scattering-chamber"
      badge={
        <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
          {total} fired
        </span>
      }
      footer={
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2" aria-live="polite">
            {(
              [
                ["straight", "Passed straight", "bg-emerald-500"],
                ["slight", "Slightly deflected", "bg-amber-400"],
                ["back", "Bounced back", "bg-rose-500"],
              ] as const
            ).map(([k, label, dot]) => (
              <div key={k} className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200/80">
                <p className="flex items-center gap-1.5 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
                  {label}
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
                  {counts[k]} <span className="text-xs font-medium text-slate-400">{pct(counts[k])}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="text-[11px] leading-snug text-slate-500">
            Deflections are exaggerated so you can see them: in the real experiment only about 1 in 8,000 alpha particles bounced back.
          </p>
        </div>
      }
    >
      <canvas
        ref={canvasRef}
        className="block aspect-[8/5] w-full"
        role="img"
        aria-label="Alpha particles fired from an emitter at a column of gold atoms. Most pass straight through; a few deflect or bounce back from the nuclei and hit the detector screen."
      />
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200/70 px-4 py-3">
        <ControlButton variant={streaming ? "default" : "primary"} active={streaming} onClick={() => setStreaming((s) => !s)}>
          {streaming ? <Pause className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
          {streaming ? "Stop Beam" : "Fire Beam"}
        </ControlButton>
        <ControlButton onClick={() => spawn()}>
          <Crosshair className="h-4 w-4" />
          Fire Single α
        </ControlButton>
        <ControlButton
          variant="ghost"
          onClick={() => {
            setCounts({ straight: 0, slight: 0, back: 0 })
            hits.current = []
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Reset Counter
        </ControlButton>
      </div>
    </LabWindow>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function label(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
  const w = ctx.measureText(text).width + 14
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)"
  roundRect(ctx, x - 7, y - 13, w, 20, 10)
  ctx.fill()
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.6
  ctx.lineWidth = 1
  roundRect(ctx, x - 7, y - 13, w, 20, 10)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = color
  ctx.fillText(text, x, y + 1)
}
