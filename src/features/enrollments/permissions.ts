import type { AppRole } from "@/lib/permissions/roles";

// Global-write plus sector leaders/deputies (WF-03). RLS (app.can_manage_class)
// enforces the sector match; this list only gates the UI and server entrypoints
// so guardian/student audiences never reach enrollment writes.
export const ENROLLMENT_WRITE_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
  "sector_leader",
  "sector_deputy",
];

export function canManageEnrollments(role: AppRole | null): boolean {
  return role !== null && ENROLLMENT_WRITE_ROLES.includes(role);
}
