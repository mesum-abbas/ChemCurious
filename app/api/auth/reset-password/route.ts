import { NextResponse } from "next/server";
import { User, ensureDbSynced } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/lib/auth-rate-limits";
import { validatePassword } from "@/lib/password-policy";

/** Reset tokens are 32 random bytes rendered as 64 hex characters. */
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit(`reset:ip:${getClientIp(request)}`, AUTH_LIMITS.resetPassword.ip);
    if (!limit.success) return tooManyRequests(limit, "password reset attempts");

    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }
    // Malformed tokens can never match: answer without a database lookup.
    if (!TOKEN_PATTERN.test(token)) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    await ensureDbSynced();
    const user = await User.findOne({ where: { resetToken: token } });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    // Validated after the token so the email-based rule can use the account's address.
    const passwordError = validatePassword(newPassword, user.email);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    await user.update({
      passwordHash: hashPassword(newPassword),
      resetToken: null,
      resetTokenExpiry: null,
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
