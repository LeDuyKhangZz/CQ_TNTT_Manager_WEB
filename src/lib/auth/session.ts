import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAudienceForRole, getScopeKindForRole, isAppRole } from "@/lib/permissions/roles";
import type { Tables } from "@/types/database";
import type { AuthContext } from "./types";

type ProfileIdentity = Pick<
  Tables<"profiles">,
  "id" | "username" | "display_name" | "account_status" | "must_change_password"
>;
type ActiveAssignment = Pick<
  Tables<"role_assignments">,
  "role" | "academic_year_id" | "sector_id" | "class_id"
>;

export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const [profileResult, assignmentResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, account_status, must_change_password")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("role_assignments")
      .select("role, academic_year_id, sector_id, class_id")
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .maybeSingle(),
  ]);
  const profile = profileResult.data as ProfileIdentity | null;
  const assignment = assignmentResult.data as ActiveAssignment | null;

  if (!profile) return null;
  const role = isAppRole(assignment?.role) ? assignment.role : null;

  return {
    userId: user.id,
    profileId: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    accountStatus: profile.account_status,
    mustChangePassword: profile.must_change_password,
    role,
    audience: role ? getAudienceForRole(role) : null,
    scopeKind: role ? getScopeKindForRole(role) : null,
    academicYearId: assignment?.academic_year_id ?? null,
    sectorId: assignment?.sector_id ?? null,
    classId: assignment?.class_id ?? null,
  };
});
