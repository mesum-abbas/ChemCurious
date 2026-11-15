import { NextResponse } from "next/server"
import { UniqueConstraintError } from "sequelize"
import { addSubscriber } from "@/lib/newsletter"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/audit"

// POST /api/newsletter { email } — subscribe to the Weekly Chemistry Digest.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: Request) {
  const ip = getClientIp(request) || "unknown"
  const limit = checkRateLimit(`newsletter:${ip}`, { windowMs: 60 * 60 * 1000, max: 8 })
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  try {
    await addSubscriber(email)
    // Identical response for new and existing emails, so the endpoint can't be used to check who is subscribed
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof UniqueConstraintError) return NextResponse.json({ ok: true })
    console.error("[newsletter] subscribe failed:", (err as Error)?.message)
    return NextResponse.json({ error: "Could not subscribe right now. Please try again." }, { status: 500 })
  }
}
