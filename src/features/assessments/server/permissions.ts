import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthContext } from "@/lib/auth/types";
import type { AppRole } from "@/lib/permissions/roles";
import type { Database } from "@/types/database";
import { canLockGradebook, canModerateComment, hasGlobalResultWrite } from "../gradebook-permissions";

const GLOBAL_READ_ROLES: readonly AppRole[] = [
  "super_admin", "parish_priest", "chaplain", "group_leader",
  "deputy_group_leader", "secretary",
];

export function hasGlobalResultRead(role: AppRole | null): boolean {
  return role !== null && GLOBAL_READ_ROLES.includes(role);
}

/**
 * M07-B — ba luật **thuần** chuyển sang `../gradebook-permissions.ts` để unit
 * test nạp được: file này mang `import "server-only"` nên vitest không vào nổi.
 * Re-export để mọi chỗ gọi cũ không phải đổi đường dẫn.
 *
 * 🔴 Phải `import` rồi mới `export`, không dùng `export … from` một dòng:
 * `export … from` **không tạo ràng buộc cục bộ**, nên `canGradeClass` ngay bên
 * dưới sẽ không gọi được `hasGlobalResultWrite`.
 */
export { canLockGradebook, canModerateComment, hasGlobalResultWrite };

export async function getVisibleResultClassIds(
  context: AuthContext,
  supabase: SupabaseClient<Database>,
): Promise<Set<string> | null> {
  if (hasGlobalResultRead(context.role)) return null;
  const ids = new Set<string>();

  if (context.classId) ids.add(context.classId);
  if (context.sectorId && ["sector_leader", "sector_deputy"].includes(context.role ?? "")) {
    const { data: levels } = await supabase
      .from("grade_levels")
      .select("id")
      .eq("sector_id", context.sectorId);
    const levelIds = (levels ?? []).map((level) => level.id);
    if (levelIds.length > 0) {
      const { data: classes } = await supabase
        .from("classes")
        .select("id")
        .in("grade_level_id", levelIds);
      for (const item of classes ?? []) ids.add(item.id);
    }
  }

  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("profile_id", context.profileId)
    .maybeSingle();
  if (staff) {
    const { data: assignments } = await supabase
      .from("class_staff_assignments")
      .select("class_id")
      .eq("staff_profile_id", staff.id)
      .eq("is_active", true);
    for (const item of assignments ?? []) ids.add(item.class_id);
  }
  return ids;
}

export async function canGradeClass(
  context: AuthContext,
  supabase: SupabaseClient<Database>,
  classId: string,
): Promise<boolean> {
  if (hasGlobalResultWrite(context.role)) return true;
  if (context.role === "trainee_assistant") {
    const { data: classRow } = await supabase
      .from("classes")
      .select("academic_years(trainee_can_grade)")
      .eq("id", classId)
      .maybeSingle();
    if (!classRow?.academic_years?.trainee_can_grade) return false;
  }
  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("profile_id", context.profileId)
    .maybeSingle();
  if (!staff) return false;
  const { data: assignment } = await supabase
    .from("class_staff_assignments")
    .select("id")
    .eq("staff_profile_id", staff.id)
    .eq("class_id", classId)
    .eq("is_active", true)
    .maybeSingle();
  return assignment !== null;
}

export async function canCommentClass(
  context: AuthContext,
  supabase: SupabaseClient<Database>,
  classId: string,
): Promise<boolean> {
  if (hasGlobalResultWrite(context.role)) return true;
  if (context.role === "trainee_assistant") {
    const { data: classRow } = await supabase
      .from("classes")
      .select("academic_years(trainee_can_comment)")
      .eq("id", classId)
      .maybeSingle();
    if (!classRow?.academic_years?.trainee_can_comment) return false;
  }
  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("profile_id", context.profileId)
    .maybeSingle();
  if (!staff) return false;
  const { data: assignment } = await supabase
    .from("class_staff_assignments")
    .select("id")
    .eq("staff_profile_id", staff.id)
    .eq("class_id", classId)
    .eq("is_active", true)
    .maybeSingle();
  return assignment !== null;
}

export async function canManageLeaderboard(
  context: AuthContext,
  supabase: SupabaseClient<Database>,
  classId: string,
): Promise<boolean> {
  if (hasGlobalResultWrite(context.role)) return true;
  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("profile_id", context.profileId)
    .maybeSingle();
  if (!staff) return false;
  const { data: assignment } = await supabase
    .from("class_staff_assignments")
    .select("id")
    .eq("staff_profile_id", staff.id)
    .eq("class_id", classId)
    .eq("capacity", "representative")
    .eq("is_active", true)
    .maybeSingle();
  return assignment !== null;
}
