"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { FlaskConical, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { chatStorageKey, hasStoredChat } from "./storage"

// The panel (thread, input, formatter) is only downloaded after the first open.
const ChemBotPanel = dynamic(() => import("./chem-bot-panel").then((m) => m.ChemBotPanel), {
  ssr: false,
  loading: () => (
    <div className="pointer-events-auto flex h-full w-[calc(100vw-2rem)] items-center justify-center rounded-xl border bg-card shadow-lg sm:w-[380px]">
      <FlaskConical className="h-6 w-6 animate-pulse text-primary" aria-hidden />
      <span className="sr-only">Loading ChemBot…</span>
    </div>
  ),
})

// ---- Launcher geometry ----------------------------------------------------------------------
const SIZE = 56 // h-14 / w-14
const EDGE = 20 // resting gap from the left/right edge after snapping (default: right 20px)
const MARGIN = 16 // closest the button may get to any edge while dragging
const DRAG_THRESHOLD = 5 // px of movement before a press counts as a drag rather than a tap
const PANEL_GAP = 12 // space between the button and the chat panel
const PANEL_MAX_H = 500
const POSITION_KEY = "chembot:launcher:v1"

type Side = "left" | "right"
// Persisted resting place: which edge, and distance from the viewport bottom to the button bottom.
interface Placement {
  side: Side
  bottom: number
}
interface Viewport {
  w: number
  h: number
  insetTop: number
  insetBottom: number
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max))

// env(safe-area-inset-*) can't be read from JS directly, so measure it with a probe element.
function readViewport(): Viewport {
  const probe = document.createElement("div")
  probe.style.cssText =
    "position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)"
  document.body.appendChild(probe)
  const cs = getComputedStyle(probe)
  const insetTop = parseFloat(cs.paddingTop) || 0
  const insetBottom = parseFloat(cs.paddingBottom) || 0
  probe.remove()
  // clientWidth excludes the desktop scrollbar so the button never sits underneath it
  return { w: document.documentElement.clientWidth, h: window.innerHeight, insetTop, insetBottom }
}

function loadPlacement(): Placement | null {
  try {
    const raw = window.localStorage.getItem(POSITION_KEY)
    if (!raw) return null
    const p: unknown = JSON.parse(raw)
    if (
      p &&
      typeof p === "object" &&
      ((p as Placement).side === "left" || (p as Placement).side === "right") &&
      Number.isFinite((p as Placement).bottom)
    ) {
      return p as Placement
    }
  } catch {
    // storage unavailable / corrupt — fall back to default
  }
  return null
}

function savePlacement(p: Placement) {
  try {
    window.localStorage.setItem(POSITION_KEY, JSON.stringify(p))
  } catch {
    // private mode / quota — position just won't persist
  }
}

const bottomBounds = (vp: Viewport) => ({
  min: MARGIN + vp.insetBottom,
  max: vp.h - SIZE - MARGIN - vp.insetTop,
})

/** Top-left corner of the button when it rests at `place`. */
function restingPoint(place: Placement, vp: Viewport) {
  const { min, max } = bottomBounds(vp)
  const bottom = clamp(place.bottom, min, max)
  return {
    x: place.side === "left" ? EDGE : vp.w - SIZE - EDGE,
    y: vp.h - bottom - SIZE,
  }
}

/** Where the chat panel goes so it opens toward the larger free space and never clips. */
function panelStyle(btn: { x: number; y: number }, vp: Viewport): CSSProperties {
  const spaceAbove = btn.y - MARGIN - vp.insetTop - PANEL_GAP
  const spaceBelow = vp.h - (btn.y + SIZE) - MARGIN - vp.insetBottom - PANEL_GAP
  const openUp = spaceAbove >= spaceBelow
  const height = Math.max(0, Math.min(PANEL_MAX_H, vp.h * 0.8, openUp ? spaceAbove : spaceBelow))

  // Matches the panel's w-[calc(100vw-2rem)] sm:w-[380px]
  const panelW = vp.w >= 640 ? 380 : vp.w - 32
  const maxOffset = Math.max(MARGIN, vp.w - panelW - MARGIN)
  const onRight = btn.x + SIZE / 2 >= vp.w / 2

  return {
    position: "fixed",
    height,
    ...(openUp ? { bottom: vp.h - btn.y + PANEL_GAP } : { top: btn.y + SIZE + PANEL_GAP }),
    ...(onRight
      ? { right: clamp(vp.w - btn.x - SIZE, MARGIN, maxOffset) }
      : { left: clamp(btn.x, MARGIN, maxOffset) }),
  }
}

export function ChemBot() {
  const pathname = usePathname() || "/"
  const { user, isLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [threadEmpty, setThreadEmpty] = useState(true)
  const launcherRef = useRef<HTMLButtonElement>(null)

  // Position state. `vp` stays null until mount, so SSR + first paint use the CSS default corner.
  const [vp, setVp] = useState<Viewport | null>(null)
  const [place, setPlace] = useState<Placement | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const drag = useRef<{ id: number; startX: number; startY: number; originX: number; originY: number; moved: boolean; last: { x: number; y: number } | null } | null>(null)
  const suppressClick = useRef(false)

  const storageKey = chatStorageKey(user?.id)

  // Pulse only when there's no saved conversation (checked after mount: no hydration mismatch)
  useEffect(() => {
    if (!isLoading && !hasOpened) setThreadEmpty(!hasStoredChat(storageKey))
  }, [storageKey, isLoading, hasOpened])

  // Restore saved position and keep it on-screen on resize / rotation.
  useEffect(() => {
    const initial = readViewport()
    setVp(initial)
    setPlace(loadPlacement() ?? { side: "right", bottom: EDGE + initial.insetBottom })

    let frame = 0
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setVp(readViewport()))
    }
    window.addEventListener("resize", onResize)
    window.addEventListener("orientationchange", onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("orientationchange", onResize)
    }
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    // Return focus to the launcher for keyboard users
    requestAnimationFrame(() => launcherRef.current?.focus())
  }, [])

  const toggle = () => {
    // A drag ends with a click event on the button; swallow it so dragging doesn't toggle the chat.
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (open) return close()
    setHasOpened(true)
    setOpen(true)
  }

  const resting = vp && place ? restingPoint(place, vp) : null
  const btnPos = dragPos ?? resting

  // ---- Pointer drag (mouse, touch and pen) --------------------------------------------------
  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    suppressClick.current = false
    if (!btnPos || (e.pointerType === "mouse" && e.button !== 0)) return
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: btnPos.x,
      originY: btnPos.y,
      moved: false,
      last: null,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId || !vp) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    d.moved = true
    d.last = {
      x: clamp(d.originX + dx, MARGIN, vp.w - SIZE - MARGIN),
      y: clamp(d.originY + dy, MARGIN + vp.insetTop, vp.h - SIZE - MARGIN - vp.insetBottom),
    }
    setDragPos(d.last)
  }

  const endDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    const last = d.last
    if (!d.moved || !last || !vp) return

    suppressClick.current = true
    // Snap to the nearest side edge, keeping the chosen height.
    const { min, max } = bottomBounds(vp)
    const next: Placement = {
      side: last.x + SIZE / 2 < vp.w / 2 ? "left" : "right",
      bottom: clamp(vp.h - last.y - SIZE, min, max),
    }
    setPlace(next)
    setDragPos(null)
    savePlacement(next)
  }

  // The admin portal has its own layout and no tutor
  if (pathname.startsWith("/admin")) return null

  const dragging = dragPos !== null

  const buttonStyle: CSSProperties = btnPos
    ? { left: btnPos.x, top: btnPos.y }
    : { right: EDGE, bottom: `calc(${EDGE}px + env(safe-area-inset-bottom, 0px))` }

  const panelPos: CSSProperties =
    btnPos && vp
      ? panelStyle(btnPos, vp)
      : {
          position: "fixed",
          right: EDGE,
          bottom: `calc(${EDGE + SIZE + PANEL_GAP}px + env(safe-area-inset-bottom, 0px))`,
          height: `min(${PANEL_MAX_H}px, 80dvh)`,
        }

  return (
    <>
      {hasOpened && (
        <div className={cn("pointer-events-auto z-50", !open && "hidden")} style={panelPos}>
          <ChemBotPanel
            open={open}
            onClose={close}
            storageKey={storageKey}
            authReady={!isLoading}
            page={pathname}
            onThreadChange={(count) => setThreadEmpty(count === 0)}
          />
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={toggle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        style={buttonStyle}
        aria-label={open ? "Close ChemBot AI Tutor" : "Open ChemBot AI Tutor"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "group fixed z-50 flex h-14 w-14 touch-none select-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50",
          dragging
            ? "scale-110 cursor-grabbing shadow-xl transition-[transform,box-shadow] duration-150"
            : "cursor-grab transition-[left,top,transform,box-shadow] duration-300 ease-out hover:scale-105 active:scale-95 motion-reduce:transition-none"
        )}
      >
        {!open && threadEmpty && !dragging && (
          <span aria-hidden className="absolute inset-0 rounded-full bg-primary/40 motion-safe:animate-ping" />
        )}
        {open ? (
          <X className="relative h-6 w-6" aria-hidden />
        ) : (
          <FlaskConical className="relative h-6 w-6 transition-transform group-hover:-rotate-12" aria-hidden />
        )}
      </button>
    </>
  )
}
