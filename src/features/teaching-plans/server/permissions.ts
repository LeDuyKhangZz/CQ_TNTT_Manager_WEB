import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthContext } from "@/lib/auth/types";
import type { AppRole } from "@/lib/permissions/roles";
import type { Database } from "@/types/database";

const GLOBAL_WRITE_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
];

export function hasGlobalTeachingPlanWrite(role: AppRole | null): boolean {
  return role !== null && GLOBAL_WRITE_ROLES.includes(role);
}

export async function getManageableTeachingClassIds(
  context: AuthContext,
  supabase: SupabaseClient<Database>,
): Promise<Set<string> | null> {
  if (hasGlobalTeachingPlanWrite(context.role)) return null;

  const classIds = new Set<string>();
  if (context.role === "class_representative" && context.classId) classIds.add(context.classId);

  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("profile_id", context.profileId)
    .maybeSingle();
  if (!staff) return classIds;

  const { data } = await supabase
    .from("class_staff_assignments")
    .select("class_id")
    .eq("staff_profile_id", staff.id)
    .eq("capacity", "representative")
    .eq("is_active", true);
  for (const assignment of data ?? []) classIds.add(assignment.class_id);
  return classIds;
}

export async function canManageTeachingClass(
  context: AuthContext,
  supabase: SupabaseClient<Database>,
  classId: string,
): Promise<boolean> {
  const classIds = await getManageableTeachingClassIds(context, supabase);
  return classIds === null || classIds.has(classId);
}

