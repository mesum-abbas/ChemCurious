import { withAdminTx } from "@/lib/admin/withAdminTx";
import { makeAccessDecisionHandler } from "@/lib/admin/user-approval";

// PATCH /api/admin/users/:id/reject — pending_approval -> rejected (admins only)
export const PATCH = withAdminTx(makeAccessDecisionHandler("reject"), {
  action: "REJECT_USER_ACCESS",
  roles: ["admin"],
});
