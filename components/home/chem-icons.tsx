import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"

// Reusable chemistry line-art (stroke = currentColor) + a floating layer that animates them.
// Pure SVG/CSS — no client JS. Animation: .cc-float in app/globals.css (off for reduced motion).

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

/** Liquid inside glassware: soft tint of the icon colour (on top of the item's own opacity). */
const liquid = { fill: "currentColor", fillOpacity: 0.32, stroke: "none" }

export const CHEM_ICONS = {
  flask: (
    <svg viewBox="0 0 48 48" {...stroke}>
      <path d="M14 30h20l5 8a4 4 0 0 1-3.6 6H12.6A4 4 0 0 1 9 38z" {...liquid} />
      <path d="M18 6h12M20 6v12L9 38a4 4 0 0 0 3.6 6h22.8A4 4 0 0 0 39 38L28 18V6" />
      <path d="M14 30h20" />
      <circle cx="21" cy="36" r="1.6" />
      <circle cx="28" cy="33" r="1.1" />
    </svg>
  ),
  /** Erlenmeyer flask with bubbles that rise (CSS) */
  bubblingFlask: (
    <svg viewBox="0 0 48 56" {...stroke}>
      <path d="M13 38h22l4 8a4 4 0 0 1-3.6 6H12.6A4 4 0 0 1 9 46z" {...liquid} />
      <path d="M18 14h12M20 14v10L9 46a4 4 0 0 0 3.6 6h22.8A4 4 0 0 0 39 46L28 24V14" />
      <path d="M13 38h22" />
      <circle className="cc-bubble" cx="22" cy="44" r="1.8" style={{ "--cc-bubble-delay": "0s" } as CSSProperties} />
      <circle className="cc-bubble" cx="27" cy="46" r="1.2" style={{ "--cc-bubble-delay": "1.1s" } as CSSProperties} />
      <circle className="cc-bubble" cx="24" cy="10" r="1.5" style={{ "--cc-bubble-delay": "0.6s" } as CSSProperties} />
      <circle className="cc-bubble" cx="27" cy="5" r="1" style={{ "--cc-bubble-delay": "1.7s" } as CSSProperties} />
    </svg>
  ),
  benzene: (
    <svg viewBox="0 0 48 48" {...stroke}>
      <path d="M24 5l16.5 9.5v19L24 43 7.5 33.5v-19z" />
      <circle cx="24" cy="24" r="9" />
    </svg>
  ),
  dna: (
    <svg viewBox="0 0 48 48" {...stroke}>
      <path d="M14 4c0 10 20 10 20 20s-20 10-20 20" />
      <path d="M34 4c0 10-20 10-20 20s20 10 20 20" />
      <path d="M17 10h14M16 18h16M16 30h16M17 38h14" opacity="0.7" />
    </svg>
  ),
  atom: (
    <svg viewBox="0 0 48 48" {...stroke}>
      <ellipse cx="24" cy="24" rx="20" ry="8" />
      <ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(60 24 24)" />
      <ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(120 24 24)" />
      <circle cx="24" cy="24" r="2.5" fill="currentColor" />
    </svg>
  ),
  tube: (
    <svg viewBox="0 0 48 48" {...stroke}>
      <path d="M19 24h10v12a5 5 0 0 1-10 0z" {...liquid} />
      <path d="M17 4h14M19 4v32a5 5 0 0 0 10 0V4" />
      <path d="M19 24h10" />
      <circle cx="24" cy="31" r="1.4" />
    </svg>
  ),
  beaker: (
    <svg viewBox="0 0 48 48" {...stroke}>
      <path d="M13 26h22v14a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2z" {...liquid} />
      <path d="M10 6h28M13 6v34a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6" />
      <path d="M13 26h22M17 14h5M17 20h3" />
    </svg>
  ),
  /** Ball-and-stick molecule fragment */
  molecule: (
    <svg viewBox="0 0 48 48" {...stroke}>
      <path d="M16 18l10 6M26 24l10-8M26 24v12" />
      <circle cx="13" cy="16" r="5" />
      <circle cx="26" cy="24" r="4" />
      <circle cx="38" cy="14" r="4" />
      <circle cx="26" cy="39" r="4" />
    </svg>
  ),
} satisfies Record<string, ReactNode>

export type ChemIconKind = keyof typeof CHEM_ICONS

export type FloatingItem = {
  kind: ChemIconKind | "text"
  text?: string
  /** position + size + responsive visibility, e.g. "left-[4%] top-[14%] w-14 hidden sm:block" */
  className: string
  dur: number
  delay: number
  rot?: number
  dx?: number
  dy?: number
  spin?: number
  /** 0–1; defaults: 0.26 for icons, 0.2 for formula text (text reads heavier) */
  opacity?: number
}

export function FloatingChemIcons({
  items,
  className,
  itemClassName = "text-teal-600",
  defaultOpacity,
}: {
  items: FloatingItem[]
  className?: string
  /** colour for every item (icons use currentColor); opacity is per item */
  itemClassName?: string
  /** override the default opacity for every item in this layer (item.opacity still wins) */
  defaultOpacity?: number
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className={cn("cc-float absolute", itemClassName, item.className)}
          style={
            {
              "--cc-dur": `${item.dur}s`,
              "--cc-delay": `${item.delay}s`,
              "--cc-rot": `${item.rot ?? 0}deg`,
              "--cc-dx": `${item.dx ?? 6}px`,
              "--cc-dy": `${item.dy ?? -18}px`,
              "--cc-spin": `${item.spin ?? 8}deg`,
              opacity: item.opacity ?? defaultOpacity ?? (item.kind === "text" ? 0.2 : 0.26),
            } as CSSProperties
          }
        >
          {item.kind === "text" ? (
            <span className="font-serif font-bold tracking-tight">{item.text}</span>
          ) : (
            CHEM_ICONS[item.kind]
          )}
        </div>
      ))}
    </div>
  )
}
