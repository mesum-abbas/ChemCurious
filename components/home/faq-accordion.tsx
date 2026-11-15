"use client"

import { useId, useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FaqItem } from "./faq-data"

/**
 * Single-open accordion. Height animates with the grid-rows 0fr→1fr technique
 * (smooth, no measuring, works with any answer length).
 */
export function FaqAccordion({ items, defaultOpen = 0 }: { items: FaqItem[]; defaultOpen?: number | null }) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen)
  const baseId = useId()

  return (
    <ul className="space-y-3">
      {items.map((item, i) => {
        const open = openIndex === i
        const buttonId = `${baseId}-q${i}`
        const panelId = `${baseId}-a${i}`
        return (
          <li
            key={item.q}
            className={cn(
              "rounded-2xl border bg-white shadow-sm transition-[border-color,box-shadow] duration-300",
              open ? "border-primary/30 shadow-md shadow-primary/5" : "border-slate-200/80 hover:border-slate-300"
            )}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6 sm:py-5"
              >
                <span className={cn("text-[15px] font-semibold leading-snug sm:text-base", open ? "text-primary" : "text-slate-800")}>
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    open ? "rotate-45 bg-primary text-primary-foreground" : "bg-slate-100 text-slate-500"
                  )}
                >
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden" inert={!open}>
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6 sm:text-[15px]">{item.a}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
