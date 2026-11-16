import { NextResponse } from "next/server";
import crypto from "crypto";
import { User, ensureDbSynced } from "@/lib/db";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/lib/auth-rate-limits";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Identical reply whether or not the account exists (no account enumeration). */
const GENERIC_REPLY = { message: "If that email exists, a reset link has been sent." };

export async function POST(request: Request) {
  try {
    // Per-IP limit first: stops one client hammering the endpoint (429 is safe to reveal,
    // it says nothing about any account).
    const ipLimit = checkRateLimit(`forgot:ip:${getClientIp(request)}`, AUTH_LIMITS.forgotPassword.ip);
    if (!ipLimit.success) return tooManyRequests(ipLimit, "password reset requests");

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Per-address limit stops anyone flooding a victim's inbox. Over the limit we still send
    // the generic reply (a 429 here would hint the address was being targeted) but do no work,
    // so the last valid link stays the one in the user's inbox.
    const emailLimit = checkRateLimit(`forgot:email:${normalizedEmail}`, AUTH_LIMITS.forgotPassword.email);
    if (!emailLimit.success) {
      return NextResponse.json(GENERIC_REPLY);
    }

    await ensureDbSynced();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return NextResponse.json(GENERIC_REPLY);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.update({ resetToken, resetTokenExpiry });

    // Use the configured public URL, or the origin this request arrived on (works on any Vercel domain)
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const resetLink = `${origin.replace(/\/$/, "")}/reset-password?token=${resetToken}`;

    // TODO: send `resetLink` by email (no email provider is configured yet).
    // Never log the link in production: anyone with log access could reset this account.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Password reset link for ${normalizedEmail}: ${resetLink}`);
    }

    return NextResponse.json(GENERIC_REPLY);
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
