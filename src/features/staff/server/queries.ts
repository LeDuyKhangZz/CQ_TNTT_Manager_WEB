import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export interface StaffListItem {
  id: string;
  staffCode: string;
  title: string;
  saintName: string | null;
  fullName: string;
  phone: string;
  formationLevel: string;
  assignment: null | { id: string; capacity: string; className: string; startsOn: string };
}

export async function getStaffPageData() {
  const context = await requireRouteAccess("/staff");
  const supabase = await createClient();
  const [staffResult, classesResult] = await Promise.all([
    supabase.from("staff_profiles").select("id, staff_code, title, saint_name, full_name, phone, formation_level, class_staff_assignments(id, capacity, starts_on, is_active, classes(display_name))").order("full_name"),
    supabase.from("classes").select("id, display_name, academic_year_id").eq("status", "active").order("display_name"),
  ]);
  const rows = (staffResult.data ?? []) as unknown as Array<{
    id: string; staff_code: string; title: string; saint_name: string | null; full_name: string; phone: string; formation_level: string;
    class_staff_assignments: Array<{ id: string; capacity: string; starts_on: string; is_active: boolean; classes: { display_name: string } | null }>;
  }>;
  return {
    context,
    staff: rows.map((row): StaffListItem => {
      const assignment = row.class_staff_assignments.find((item) => item.is_active);
      return {
        id: row.id, staffCode: row.staff_code, title: row.title, saintName: row.saint_name,
        fullName: row.full_name, phone: row.phone, formationLevel: row.formation_level,
        assignment: assignment ? { id: assignment.id, capacity: assignment.capacity, className: assignment.classes?.display_name ?? "Lớp", startsOn: assignment.starts_on } : null,
      };
    }),
    classes: (classesResult.data ?? []).map((item) => ({ id: item.id, name: item.display_name })),
  };
}
