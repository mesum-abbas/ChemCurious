"use client"

import type { ReactNode } from "react"
import { useLinkStatus } from "next/link"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Render inside a <Link>. Shows a spinner while that link's navigation is in flight,
 * otherwise renders `children` (e.g. an arrow icon). Gives instant tap feedback on
 * slow networks instead of a button that appears to do nothing.
 */
export function LinkPendingIcon({ children, className }: { children?: ReactNode; className?: string }) {
  const { pending } = useLinkStatus()
  if (pending) {
    return <Loader2 className={cn("h-4 w-4 animate-spin", className)} aria-label="Loading" />
  }
  return <>{children}</>
}
