import type { AppRole } from "@/lib/permissions/roles";

export function canManageAccounts(role: AppRole | null): boolean {
  return role === "super_admin";
}
