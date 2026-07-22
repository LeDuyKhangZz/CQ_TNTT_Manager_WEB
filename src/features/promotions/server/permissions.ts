import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthContext } from "@/lib/auth/types";
import type { Database } from "@/types/database";
import { hasGlobalResultWrite } from "@/features/assessments/server/permissions";

export async function canProposeForClass(
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
  const { data } = await supabase
    .from("class_staff_assignments")
    .select("id")
    .eq("staff_profile_id", staff.id)
    .eq("class_id", classId)
    .eq("capacity", "representative")
    .eq("is_active", true)
    .maybeSingle();
  return data !== null;
}

export function canReviewSector(
  context: AuthContext,
  sourceSectorId: string | null,
): boolean {
  if (hasGlobalResultWrite(context.role)) return true;
  return ["sector_leader", "sector_deputy"].includes(context.role ?? "")
    && context.sectorId !== null
    && context.sectorId === sourceSectorId;
}

