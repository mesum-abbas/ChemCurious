import { NextResponse } from "next/server";
import { User, ensureDbSynced } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { BLOCKED_STATUS_MESSAGES, issueSessionForUser } from "@/lib/auth-session";
import {
  checkRateLimit,
  firstBlocked,
  getClientIp,
  peekRateLimit,
  resetRateLimit,
  tooManyRequests,
} from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/lib/auth-rate-limits";
import { PASSWORD_MAX_LENGTH } from "@/lib/password-policy";

/**
 * Unified login for every role. The role is read from the database (never from the client):
 * admin/staff receive the admin session cookie, students receive the student session cookie.
 * (The old `/api/auth/admin-login` alias was removed: nothing called it.)
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

    // Oversized input is never a real credential; reject before any hashing work.
    if (email.length > 254 || password.length > PASSWORD_MAX_LENGTH) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Brute-force protection: three failure counters, all checked BEFORE the DB lookup and
    // password hash. Unknown emails count exactly like real ones, so a 429 reveals nothing.
    const clientIp = getClientIp(request);
    const keys = {
      ipAccount: `login:ip-acct:${clientIp}:${normalizedEmail}`,
      account: `login:acct:${normalizedEmail}`,
      ip: `login:ip:${clientIp}`,
    } as const;
    const L = AUTH_LIMITS.login;

    const blocked = firstBlocked([
      peekRateLimit(keys.ipAccount, L.ipAccount),
      peekRateLimit(keys.account, L.account),
      peekRateLimit(keys.ip, L.ip),
    ]);
    if (blocked) return tooManyRequests(blocked, "failed sign-in attempts");

    const user = await User.findOne({ where: { email: normalizedEmail } });

    // Same message for unknown email and wrong password (no account enumeration)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      checkRateLimit(keys.ipAccount, L.ipAccount);
      checkRateLimit(keys.account, L.account);
      checkRateLimit(keys.ip, L.ip);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Correct password: clear this account's counters (the per-IP counter keeps running,
    // so one valid login can't be used to reset a stuffing run across other accounts).
    resetRateLimit(keys.ipAccount);
    resetRateLimit(keys.account);

    // Account status is only revealed after the password is proven correct
    if (user.status !== "active") {
      const message =
        BLOCKED_STATUS_MESSAGES[user.status as keyof typeof BLOCKED_STATUS_MESSAGES] ??
        "Your account is not active. Please contact the administrator.";
      return NextResponse.json({ error: message, status: user.status }, { status: 403 });
    }

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
