"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

/** Props every concept visual receives from the Concept Lab shell. */
export interface VisualProps {
  /** Index of the step the student clicked in the explanation panel (null = none) */
  activeStep: number | null
  /** A step-click counter so re-clicking the same step can re-trigger its demo */
  stepNonce: number
}

/**
 * requestAnimationFrame loop that pauses while the element is off-screen or the tab is hidden.
 * The callback gets the elapsed time in seconds (clamped so a background tab can't cause a huge jump).
 */
export function useAnimationLoop(callback: (dt: number, now: number) => void, target: React.RefObject<Element | null>, enabled = true) {
  const cb = useRef(callback)
  cb.current = callback

  useEffect(() => {
    if (!enabled) return
    let raf = 0
    let last = performance.now()
    let visible = true
    const el = target.current
    const io =
      el && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([e]) => {
            visible = e?.isIntersecting ?? true
          })
        : null
    if (el && io) io.observe(el)

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (visible && document.visibilityState === "visible") cb.current(dt, now)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
    }
  }, [enabled, target])
}

/** True when the user prefers reduced motion (read after mount). */
export function usePrefersReducedMotion(): React.RefObject<boolean> {
  const ref = useRef(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    ref.current = mq.matches
    const on = () => (ref.current = mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return ref
}

/** Lab-window frame shared by all visuals (matches the home page preview card). */
export function LabWindow({
  title,
  badge,
  children,
  footer,
  className,
}: {
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.35)] ring-1 ring-black/5 backdrop-blur-md", className)}>
      <div className="flex items-center gap-3 border-b border-slate-200/70 bg-slate-50/80 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <span className="min-w-0 flex-1 truncate text-center font-mono text-[11px] text-slate-500">{title}</span>
        {badge}
      </div>
      {children}
      {footer && <div className="border-t border-slate-200/70 bg-slate-50/60 px-4 py-3">{footer}</div>}
    </div>
  )
}

export function ControlButton({
  children,
  onClick,
  active,
  variant = "default",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; variant?: "default" | "primary" | "ghost" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        variant === "default" &&
          (active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "border border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary"),
        variant === "ghost" && "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Set up a HiDPI canvas that matches its CSS size; returns the 2D context scaled to logical units. */
export function prepareCanvas(canvas: HTMLCanvasElement, logicalW: number, logicalH: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const cssW = canvas.clientWidth || logicalW
  const scale = cssW / logicalW
  const w = Math.round(logicalW * scale * dpr)
  const h = Math.round(logicalH * scale * dpr)
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  const ctx = canvas.getContext("2d")!
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
  return ctx
}
