"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
    <div className="pointer-events-auto flex h-[500px] max-h-[80dvh] w-[92vw] items-center justify-center rounded-xl border bg-card shadow-lg sm:w-[380px]">
      <FlaskConical className="h-6 w-6 animate-pulse text-primary" aria-hidden />
      <span className="sr-only">Loading ChemBot…</span>
    </div>
  ),
})

export function ChemBot() {
  const pathname = usePathname() || "/"
  const { user, isLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [threadEmpty, setThreadEmpty] = useState(true)
  const launcherRef = useRef<HTMLButtonElement>(null)

  const storageKey = chatStorageKey(user?.id)

  // Pulse only when there's no saved conversation (checked after mount: no hydration mismatch)
  useEffect(() => {
    if (!isLoading && !hasOpened) setThreadEmpty(!hasStoredChat(storageKey))
  }, [storageKey, isLoading, hasOpened])

  const close = useCallback(() => {
    setOpen(false)
    // Return focus to the launcher for keyboard users
    requestAnimationFrame(() => launcherRef.current?.focus())
  }, [])

  const toggle = () => {
    if (open) return close()
    setHasOpened(true)
    setOpen(true)
  }

  // The admin portal has its own layout and no tutor
  if (pathname.startsWith("/admin")) return null

  return (
    <div
      className="pointer-events-none fixed right-4 z-50 flex flex-col items-end gap-3 sm:right-5"
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {hasOpened && (
        <div className={cn("pointer-events-auto", !open && "hidden")}>
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
        aria-label={open ? "Close ChemBot AI Tutor" : "Open ChemBot AI Tutor"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="group pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 active:scale-95"
      >
        {!open && threadEmpty && (
          <span aria-hidden className="absolute inset-0 rounded-full bg-primary/40 motion-safe:animate-ping" />
        )}
        {open ? (
          <X className="relative h-6 w-6" aria-hidden />
        ) : (
          <FlaskConical className="relative h-6 w-6 transition-transform group-hover:-rotate-12" aria-hidden />
        )}
      </button>
    </div>
  )
}
