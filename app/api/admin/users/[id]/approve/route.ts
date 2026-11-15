import { withAdminTx } from "@/lib/admin/withAdminTx";
import { makeAccessDecisionHandler } from "@/lib/admin/user-approval";

// PATCH /api/admin/users/:id/approve — pending_approval | rejected -> active (admins only)
export const PATCH = withAdminTx(makeAccessDecisionHandler("approve"), {
  action: "APPROVE_USER_ACCESS",
  roles: ["admin"],
});
