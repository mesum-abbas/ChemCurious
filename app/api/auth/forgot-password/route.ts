import { NextResponse } from "next/server";
import crypto from "crypto";
import { User, ensureDbSynced } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await ensureDbSynced();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    // Always return success to avoid revealing whether the email exists
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
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

    return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
