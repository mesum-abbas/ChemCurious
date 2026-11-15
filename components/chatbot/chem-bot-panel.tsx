"use client"

import type React from "react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { FlaskConical, Loader2, RotateCcw, SendHorizontal, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { MessageContent } from "./message-content"
import { loadChat, saveChat, type StoredMessage } from "./storage"

interface ChatItem extends StoredMessage {
  /** Error bubbles are local-only: never sent to the API and never stored. */
  error?: boolean
}

interface ChemBotPanelProps {
  open: boolean
  onClose: () => void
  storageKey: string
  authReady: boolean
  page: string
  onThreadChange?: (count: number) => void
}

const MAX_INPUT = 1000
const CLIENT_TIMEOUT_MS = 35_000
const SUGGESTIONS = [
  { icon: "🧪", text: "How to balance chemical equations?" },
  { icon: "⚛️", text: "Explain Bohr's Atomic Model" },
  { icon: "💧", text: "What is an ionic bond?" },
]

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

function friendlyError(status: number | null, serverMessage?: string): string {
  if (status === null) return "Couldn't reach ChemBot. Check your internet connection and try again."
  if (status === 408) return "ChemBot is taking too long to answer. Please try again."
  if (status === 429) return serverMessage || "You're sending messages too fast. Please wait a moment."
  if (status === 400) return serverMessage || "That message couldn't be sent. Try shortening it."
  return serverMessage || "Chemistry AI is temporarily busy. Please try again in a few seconds."
}

export function ChemBotPanel({ open, onClose, storageKey, authReady, page, onThreadChange }: ChemBotPanelProps) {
  const [items, setItems] = useState<ChatItem[]>([])
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inflight = useRef<AbortController | null>(null)
  const sendingRef = useRef(false) // guards against double-send before state updates land
  const onThreadChangeRef = useRef(onThreadChange)
  onThreadChangeRef.current = onThreadChange

  // Load the thread for the current account (after mount; switches when the user logs in/out)
  useEffect(() => {
    if (!authReady) return
    inflight.current?.abort()
    sendingRef.current = false
    setLoading(false)
    setConfirmClear(false)
    setItems(loadChat(storageKey))
    setLoadedKey(storageKey)
  }, [storageKey, authReady])

  // Persist (without error bubbles) and report thread size to the launcher
  useEffect(() => {
    if (loadedKey !== storageKey) return
    const persistable = items.filter((m) => !m.error)
    saveChat(storageKey, persistable)
    onThreadChangeRef.current?.(persistable.length)
  }, [items, loadedKey, storageKey])

  // Abort any request when the panel unmounts
  useEffect(() => () => inflight.current?.abort(), [])

  // Focus the input on open; Esc closes
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        if (confirmClear) setConfirmClear(false)
        else onClose()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose, confirmClear])

  // Auto-scroll to the newest message / typing indicator
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [items, loading, open])

  // Auto-grow the textarea between 1 and 4 rows
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 4 * 22 + 18)}px`
  }, [input])

  const request = useCallback(
    async (thread: ChatItem[]) => {
      if (sendingRef.current) return
      sendingRef.current = true
      setLoading(true)

      const controller = new AbortController()
      inflight.current = controller
      let timedOut = false
      const timer = window.setTimeout(() => {
        timedOut = true
        controller.abort()
      }, CLIENT_TIMEOUT_MS)

      const pushError = (text: string) =>
        setItems((prev) => [...prev, { id: newId(), role: "assistant", content: text, ts: Date.now(), error: true }])

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: thread.filter((m) => !m.error).map(({ role, content }) => ({ role, content })),
            page,
          }),
          signal: controller.signal,
        })
        const data = await res.json().catch(() => ({}))
        if (controller.signal.aborted && !timedOut) return // cleared / switched account meanwhile
        if (res.ok && typeof data.reply === "string" && data.reply.trim()) {
          setItems((prev) => [...prev, { id: newId(), role: "assistant", content: data.reply, ts: Date.now() }])
        } else {
          pushError(friendlyError(res.ok ? 503 : res.status, typeof data.error === "string" ? data.error : undefined))
        }
      } catch {
        if (timedOut) pushError(friendlyError(408))
        else if (!controller.signal.aborted) pushError(friendlyError(null))
      } finally {
        window.clearTimeout(timer)
        if (inflight.current === controller) {
          inflight.current = null
          sendingRef.current = false
          setLoading(false)
        }
      }
    },
    [page]
  )

  const send = (raw: string) => {
    const text = raw.trim().slice(0, MAX_INPUT)
    if (!text || sendingRef.current) return
    const userMsg: ChatItem = { id: newId(), role: "user", content: text, ts: Date.now() }
    // Drop stale error bubbles once the student moves on
    const next = [...items.filter((m) => !m.error), userMsg]
    setItems(next)
    setInput("")
    setConfirmClear(false)
    void request(next)
  }

  const retry = () => {
    const thread = items.filter((m) => !m.error)
    setItems(thread)
    void request(thread)
  }

  const clearChat = () => {
    inflight.current?.abort()
    inflight.current = null
    sendingRef.current = false
    setLoading(false)
    setItems([])
    setConfirmClear(false)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(input)
    }
  }

  const lastIsError = items[items.length - 1]?.error === true
  const nearLimit = input.length >= MAX_INPUT - 200

  return (
    <section
      role="dialog"
      aria-label="ChemBot AI Tutor"
      className="flex h-[500px] max-h-[80dvh] w-[92vw] flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 sm:w-[380px]"
    >
      {/* Header */}
      <header className="flex items-center gap-2.5 border-b bg-primary/5 px-3.5 py-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <FlaskConical className="h-[18px] w-[18px]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-serif text-sm font-bold leading-tight">ChemBot AI Tutor</h2>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            Online · Chemistry help
          </p>
        </div>

        {confirmClear ? (
          <div className="flex items-center gap-1" role="group" aria-label="Confirm clearing the chat">
            <span className="text-xs font-medium">Clear chat?</span>
            <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={clearChat}>
              Yes
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setConfirmClear(false)}>
              No
            </Button>
          </div>
        ) : (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmClear(true)}
              disabled={items.length === 0 && !loading}
              aria-label="Clear chat"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground"
              onClick={onClose}
              aria-label="Close ChemBot"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </header>

      {/* Thread */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3.5 py-3" aria-live="polite">
        {items.length === 0 && !loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FlaskConical className="h-6 w-6" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="font-serif text-sm font-semibold">Hi! I'm ChemBot 👋</p>
              <p className="text-xs text-muted-foreground">
                Ask me anything about chemistry: reactions, bonding, the periodic table and more.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 pt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => send(s.text)}
                  className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-left text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span aria-hidden>{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          items.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground [overflow-wrap:anywhere]">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex justify-start">
                <div
                  className={cn(
                    "max-w-[90%] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm leading-relaxed",
                    m.error
                      ? "border border-destructive/30 bg-destructive/10 text-destructive"
                      : "bg-muted text-foreground"
                  )}
                >
                  {m.error ? <p>{m.content}</p> : <MessageContent text={m.content} />}
                  {m.error && m === items[items.length - 1] && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 gap-1.5 border-destructive/40 bg-background px-2.5 text-xs text-destructive hover:text-destructive"
                      onClick={retry}
                      disabled={loading}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            )
          )
        )}

        {loading && (
          <div className="flex justify-start" role="status" aria-label="ChemBot is typing">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 motion-safe:animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        className="border-t bg-card px-3 pb-2 pt-2.5"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <div className="flex items-end gap-2">
          <label htmlFor="chembot-input" className="sr-only">
            Ask ChemBot a chemistry question
          </label>
          <Textarea
            id="chembot-input"
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={MAX_INPUT}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={lastIsError ? "Try again or ask something else…" : "Ask a chemistry question…"}
            className="max-h-[106px] min-h-10 resize-none py-2 text-base leading-[22px] md:text-sm"
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[10.5px] text-muted-foreground">
          <span>AI can make mistakes. Don&apos;t share personal information.</span>
          {nearLimit && (
            <span className={cn("shrink-0 tabular-nums", input.length >= MAX_INPUT && "font-semibold text-destructive")}>
              {input.length}/{MAX_INPUT}
            </span>
          )}
        </div>
      </form>
    </section>
  )
}
