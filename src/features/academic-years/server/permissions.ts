import "server-only";

import { AppError } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import type { AppRole } from "@/lib/permissions/roles";

const ACADEMIC_WRITE_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
];

export async function requireAcademicWrite() {
  const context = await requireAuthContext("/admin");
  if (!context.role || !ACADEMIC_WRITE_ROLES.includes(context.role)) {
    throw new AppError("FORBIDDEN");
  }
  return context;
}

export async function requireSetCurrentYear() {
  const context = await requireAuthContext("/admin");
  if (context.role !== "super_admin" && context.role !== "group_leader") {
    throw new AppError("FORBIDDEN");
  }
  return context;
}
