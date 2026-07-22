import "server-only";

import { AppError } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import type { AppRole } from "@/lib/permissions/roles";

// P2-T2: student/guardian direct writes are limited to global-write roles.
// Sector-scoped creation (sector leader/deputy) is enabled in P2-T3 once
// enrollments give students a sector context to authorize against.
export const STUDENT_WRITE_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
];

// Roles allowed to view sensitive health/sacrament data (matrix docs/05 §3).
// Sector leaders/deputies and class staff see it only for students enrolled in
// their scope — the DB (app.can_view_student_sensitive) enforces the per-student
// check; this list only decides whether the tab renders at all.
export const SENSITIVE_READ_ROLES: readonly AppRole[] = [
  "super_admin",
  "parish_priest",
  "chaplain",
  "group_leader",
  "deputy_group_leader",
  "secretary",
  "sector_leader",
  "sector_deputy",
  "class_representative",
  "class_teacher",
  "trainee_assistant",
];

export function canWriteStudents(role: AppRole | null): boolean {
  return role !== null && STUDENT_WRITE_ROLES.includes(role);
}

export function canViewSensitive(role: AppRole | null): boolean {
  return role !== null && SENSITIVE_READ_ROLES.includes(role);
}

export async function requireStudentWrite(nextPath = "/students") {
  const context = await requireAuthContext(nextPath);
  if (!canWriteStudents(context.role)) throw new AppError("FORBIDDEN");
  return context;
}
