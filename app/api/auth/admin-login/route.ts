/**
 * @deprecated Use POST /api/auth/login — it detects the role from the database.
 * Kept as an alias so existing clients and bookmarks keep working.
 */
export { POST } from "../login/route";
