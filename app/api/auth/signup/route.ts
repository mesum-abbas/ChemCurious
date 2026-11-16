import { NextResponse } from "next/server";
import { UniqueConstraintError } from "sequelize";
import { User, ensureDbSynced, type Role, type AccountStatus } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { issueSessionForUser } from "@/lib/auth-session";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";
import { AUTH_LIMITS } from "@/lib/auth-rate-limits";
import { validatePassword } from "@/lib/password-policy";
import { isDisposableEmail } from "@/lib/disposable-email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 100;
const MAX_INSTITUTION_LENGTH = 150;

/**
 * Self-registration.
 *  - role "student" (default): active immediately, student session issued.
 *  - role "staff" | "admin": created as pending_approval, NO session issued;
 *    an existing administrator must approve the request in /admin/users.
 * (The old `/api/auth/register` alias was removed: nothing called it.)
 */
export async function POST(request: Request) {
  try {
    // Bot account creation: every attempt from an IP counts (also throttles probing which
    // emails exist via the 409 response). Checked before parsing or touching the database.
    const limit = checkRateLimit(`signup:ip:${getClientIp(request)}`, AUTH_LIMITS.signup.ip);
    if (!limit.success) return tooManyRequests(limit, "sign-up attempts");

    await ensureDbSynced();

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const institution = typeof body?.institution === "string" ? body.institution.trim() : "";
    const requestedRole = body?.role;

    if (!email || !password || !name || !institution) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, name, or institution" },
        { status: 400 }
      );
    }
    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: "Temporary or disposable email addresses aren't accepted. Please use your regular email." },
        { status: 400 }
      );
    }
    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: `Name must be at most ${MAX_NAME_LENGTH} characters.` }, { status: 400 });
    }
    if (institution.length > MAX_INSTITUTION_LENGTH) {
      return NextResponse.json(
        { error: `Institution must be at most ${MAX_INSTITUTION_LENGTH} characters.` },
        { status: 400 }
      );
    }
    const passwordError = validatePassword(password, email);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // Anything other than an explicit staff/admin request is a student account
    const role: Role = requestedRole === "admin" || requestedRole === "staff" ? requestedRole : "student";
    const status: AccountStatus = role === "student" ? "active" : "pending_approval";

    const existing = await User.findOne({ where: { email }, attributes: ["id"] });
    if (existing) {
      return NextResponse.json(
        { error: "EMAIL_ALREADY_EXISTS", message: "This email is already registered." },
        { status: 409 }
      );
    }

    const newUser = await User.create({
      email,
      passwordHash: hashPassword(password),
      name,
      institution,
      role,
      status,
    });

    if (status === "pending_approval") {
      return NextResponse.json(
        {
          success: true,
          requiresApproval: true,
          message:
            "Admin registration request submitted. An active administrator must approve your account before you can log in.",
        },
        { status: 201 }
      );
    }

    newUser.lastLoginAt = new Date();
    await newUser.save();
    await issueSessionForUser(newUser);

    return NextResponse.json(
      {
        success: true,
        requiresApproval: false,
        role: newUser.role,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          institution: newUser.institution,
          role: newUser.role,
          status: newUser.status,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Race: two sign-ups with the same email at the same moment
    if (error instanceof UniqueConstraintError) {
      return NextResponse.json(
        { error: "EMAIL_ALREADY_EXISTS", message: "This email is already registered." },
        { status: 409 }
      );
    }

    console.error("Signup API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
