import "server-only";

import { AppError } from "@/lib/errors";
import { requireAuthContext, requireRouteAccess } from "@/lib/auth/guards";
import type { AppRole } from "@/lib/permissions/roles";

// Importing creates students, guardians and enrollments in bulk, so it is
// restricted to the global-write roles — the same set the DB enforces through
// app.can_global_write() on import_batches/import_rows (docs/09 §9).
export const IMPORT_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
];

export function canImport(role: AppRole | null): boolean {
  return role !== null && IMPORT_ROLES.includes(role);
}

export async function requireImportAccess(nextPath = "/imports") {
  const context = await requireAuthContext(nextPath);
  if (!canImport(context.role)) throw new AppError("FORBIDDEN");
  return context;
}

/**
 * Guard cho Server Component của /imports. Khác {@link requireImportAccess} ở
 * chỗ sai vai trò thì chuyển hướng sang /access-denied giống mọi trang khác,
 * thay vì ném lỗi và rơi vào error boundary. Server Action vẫn dùng
 * requireImportAccess vì redirect trong action sẽ phá kiểu trả về của action.
 */
export async function requireImportPage(pathname = "/imports") {
  const context = await requireRouteAccess(pathname);
  if (!canImport(context.role)) throw new AppError("FORBIDDEN");
  return context;
}
