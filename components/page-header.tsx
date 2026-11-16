import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { FloatingChemBackground } from "@/components/floating-chem-background"

/**
 * Shared page header band for every public route: flat white surface with a faint teal tint,
 * the floating line-art, a bottom border, and consistent title/description type.
 * It is pulled up under the floating navbar (-mt / pt = nav height, 68px) so the pill floats over it.
 */
export function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  description,
  align = "left",
  width = "max-w-7xl",
  children,
  className,
}: {
  eyebrow?: string
  eyebrowIcon?: LucideIcon
  /** Wrap the highlighted word in <span className="text-primary"> */
  title: ReactNode
  description?: ReactNode
  align?: "left" | "center"
  /** Container width class, matched to the page body below */
  width?: string
  /** Optional row under the description (actions, stats, back link…) */
  children?: ReactNode
  className?: string
}) {
  const centered = align === "center"
  return (
    <section className={cn("relative -mt-[68px] overflow-hidden border-b border-slate-200/70 bg-white pt-[68px]", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-teal-50/30" />
      <FloatingChemBackground align={align} />

      <div className={cn("relative mx-auto px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-12", width)}>
        <div className={cn("max-w-3xl", centered && "mx-auto text-center")}>
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">
              {EyebrowIcon && <EyebrowIcon className="h-3.5 w-3.5" aria-hidden />}
              {eyebrow}
            </span>
          )}
          <h1
            className={cn(
              "font-serif text-3xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl",
              eyebrow && "mt-5"
            )}
          >
            {title}
          </h1>
          {description && (
            <p className={cn("mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg", centered && "mx-auto")}>
              {description}
            </p>
          )}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </section>
  )
}
