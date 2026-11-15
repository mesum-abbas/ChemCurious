import { NextResponse } from "next/server"
import { getChemistryNews } from "@/lib/news/feed"

// GET /api/chemistry-news — merged chemistry RSS (ScienceDaily, Chemistry World, Phys.org), cached 1 h in memory.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const payload = await getChemistryNews()
  const fresh = payload.status === "live" || payload.status === "cached"
  return NextResponse.json(payload, {
    headers: {
      // Let a CDN serve it too; don't let the CDN pin a fallback/stale response for long
      "Cache-Control": fresh
        ? "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
        : "public, max-age=60, s-maxage=120",
    },
  })
}
