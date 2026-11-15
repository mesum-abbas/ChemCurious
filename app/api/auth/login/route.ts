import { NextResponse } from "next/server";
import { User, ensureDbSynced } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { BLOCKED_STATUS_MESSAGES, issueSessionForUser } from "@/lib/auth-session";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";

/**
 * Unified login for every role. The role is read from the database (never from the client):
 * admin/staff receive the admin session cookie, students receive the student session cookie.
 * `/api/auth/admin-login` re-exports this handler for backward compatibility.
 */
export async function POST(request: Request) {
  try {
    await ensureDbSynced();

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Brute-force protection (per IP + email), reset on successful sign-in
    const clientIp = getClientIp(request) || "127.0.0.1";
    const rateLimitKey = `login:${clientIp}:${normalizedEmail}`;
    const rateLimit = checkRateLimit(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 10 });
    if (!rateLimit.success) {
      const waitMinutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many failed login attempts. Please try again in ${waitMinutes} minute(s).` },
        { status: 429 }
      );
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });

    // Same message for unknown email and wrong password (no account enumeration)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Account status is only revealed after the password is proven correct
    if (user.status !== "active") {
      const message =
        BLOCKED_STATUS_MESSAGES[user.status as keyof typeof BLOCKED_STATUS_MESSAGES] ??
        "Your account is not active. Please contact the administrator.";
      return NextResponse.json({ error: message, status: user.status }, { status: 403 });
    }

    resetRateLimit(rateLimitKey);

    user.lastLoginAt = new Date();
    await user.save();

    await issueSessionForUser(user);

    const role = user.role || "student";
    return NextResponse.json({
      success: true,
      role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        institution: user.institution || "",
        role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
