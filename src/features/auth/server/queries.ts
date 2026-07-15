import "server-only";

import { AppError } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/permissions/roles";

export interface AccountSummary {
  id: string;
  username: string;
  displayName: string;
  status: "active" | "locked" | "disabled";
  role: AppRole | null;
}

export interface AccountAdminOptions {
  accounts: AccountSummary[];
  academicYears: Array<{ id: string; name: string }>;
  sectors: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; academicYearId: string; displayName: string }>;
  staffProfiles: Array<{ id: string; label: string }>;
}

export async function getAccountAdminOptions(): Promise<AccountAdminOptions> {
  const context = await requireAuthContext("/admin");
  if (context.role !== "super_admin") throw new AppError("FORBIDDEN");
  const supabase = await createClient();
  const [profilesResult, yearsResult, sectorsResult, classesResult, staffResult] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, account_status, role_assignments(role, is_active)").order("username"),
    supabase.from("academic_years").select("id, name").order("start_date", { ascending: false }),
    supabase.from("sectors").select("id, name").order("sort_order"),
    supabase.from("classes").select("id, academic_year_id, display_name").order("display_name"),
    supabase.from("staff_profiles").select("id, staff_code, full_name").is("profile_id", null).order("full_name"),
  ]);

  const profiles = (profilesResult.data ?? []) as unknown as Array<{
    id: string;
    username: string;
    display_name: string;
    account_status: AccountSummary["status"];
    role_assignments: Array<{ role: AppRole; is_active: boolean }>;
  }>;

  return {
    accounts: profiles.map((profile) => ({
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      status: profile.account_status,
      role: profile.role_assignments.find((assignment) => assignment.is_active)?.role ?? null,
    })),
    academicYears: (yearsResult.data ?? []).map((year) => ({ id: year.id, name: year.name })),
    sectors: (sectorsResult.data ?? []).map((sector) => ({ id: sector.id, name: sector.name })),
    classes: (classesResult.data ?? []).map((item) => ({
      id: item.id,
      academicYearId: item.academic_year_id,
      displayName: item.display_name,
    })),
    staffProfiles: (staffResult.data ?? []).map((staff) => ({
      id: staff.id,
      label: `${staff.staff_code} · ${staff.full_name}`,
    })),
  };
}
