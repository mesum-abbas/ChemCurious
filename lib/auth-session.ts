import { cookies } from "next/headers";
import type { User, AccountStatus, Role } from "./db";
import {
  signToken,
  verifyToken,
  ADMIN_SESSION_COOKIE,
  STUDENT_SESSION_COOKIE,
  LEGACY_SESSION_COOKIE,
} from "./auth";

const SESSION_MAX_AGE_SECONDS = 86400;

/** User-facing reason a non-active account cannot sign in. */
export const BLOCKED_STATUS_MESSAGES: Record<Exclude<AccountStatus, "active">, string> = {
  suspended: "Your account has been suspended. Please contact the administrator.",
  pending_approval:
    "Your admin access request is currently pending administrator approval. Please wait for verification.",
  rejected: "Your account request was declined. Please contact support.",
};

export function isPortalRole(role: Role | string | null | undefined): role is "admin" | "staff" {
  return role === "admin" || role === "staff";
}

/**
 * Issues the session cookie that matches the user's role:
 * admin/staff -> admin session cookie, student -> student session cookie.
 * The other portal's cookies are cleared so the two sessions never overlap.
 */
export async function issueSessionForUser(user: Pick<User, "id" | "email" | "name" | "role">) {
  const token = signToken(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    SESSION_MAX_AGE_SECONDS
  );

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  };

  if (isPortalRole(user.role)) {
    cookieStore.set(ADMIN_SESSION_COOKIE, token, cookieOptions);
    cookieStore.delete(STUDENT_SESSION_COOKIE);
    cookieStore.delete(LEGACY_SESSION_COOKIE);
  } else {
    cookieStore.set(STUDENT_SESSION_COOKIE, token, cookieOptions);
    cookieStore.delete(ADMIN_SESSION_COOKIE);
  }
}

/**
 * Verified payload of the current student session, or null when signed out / invalid.
 * Single place that knows which cookies carry a student session (current + legacy name).
 */
export async function getStudentSession(): Promise<any | null> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(STUDENT_SESSION_COOKIE)?.value || cookieStore.get(LEGACY_SESSION_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}
