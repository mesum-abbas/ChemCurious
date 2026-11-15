import { NextResponse } from "next/server";
import { safeIsoDate } from "@/lib/api-utils";
import { User, AuditLog, type AccountStatus } from "@/lib/db";
import { getClientIp } from "@/lib/audit";
import type { AdminUser, CurrentUser } from "@/lib/admin/types";

type Decision = "approve" | "reject";

const RULES: Record<Decision, { from: AccountStatus[]; to: AccountStatus; verb: string }> = {
  // A previously rejected request can still be approved later
  approve: { from: ["pending_approval", "rejected"], to: "active", verb: "approved" },
  reject: { from: ["pending_approval"], to: "rejected", verb: "rejected" },
};

/**
 * Builds the PATCH handler for /api/admin/users/[id]/approve and /reject.
 * Wrap with withAdminTx(..., { roles: ["admin"] }) so only administrators can decide.
 */
export function makeAccessDecisionHandler(decision: Decision) {
  const rule = RULES[decision];

  return async (
    req: Request,
    actor: CurrentUser,
    { params, tx }: { params: Promise<{ id: string }> | { id: string }; tx: any }
  ) => {
    const { id } = await params;
    const targetId = Number(id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    if (targetId === actor.id) {
      return NextResponse.json({ error: "You cannot approve or reject your own account." }, { status: 422 });
    }

    const target = await User.findByPk(targetId, { transaction: tx, lock: tx?.LOCK?.UPDATE });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!rule.from.includes(target.status)) {
      return NextResponse.json(
        {
          error: `Only accounts that are ${rule.from.join(" or ").replace(/_/g, " ")} can be ${rule.verb}. This account is ${target.status.replace(/_/g, " ")}.`,
        },
        { status: 409 }
      );
    }

    await User.update({ status: rule.to }, { where: { id: target.id }, transaction: tx });

    // Record exactly who decided on whose request (the generic withAdminTx log has no target)
    await AuditLog.create(
      {
        userId: actor.id,
        userEmail: actor.email,
        action: decision === "approve" ? "user_access_approved" : "user_access_rejected",
        entityType: "user",
        entityId: String(target.id),
        beforeState: { email: target.email, role: target.role, status: target.status },
        afterState: { email: target.email, role: target.role, status: rule.to },
        ipAddress: getClientIp(req),
      },
      { transaction: tx }
    );

    const body: AdminUser = {
      id: target.id,
      name: target.name,
      email: target.email,
      institution: target.institution,
      role: target.role,
      status: rule.to,
      createdAt: safeIsoDate(target.createdAt, new Date().toISOString())!,
      lastLoginAt: safeIsoDate(target.lastLoginAt, null),
      attemptCount: 0,
    };
    return NextResponse.json(body);
  };
}
