import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/auth/guards";
import type { Tables } from "@/types/database";

export type AcademicYearSummary = Pick<
  Tables<"academic_years">,
  "id" | "code" | "name" | "start_date" | "end_date" | "status"
> & { classCount: number };

export async function listAcademicYears(): Promise<AcademicYearSummary[]> {
  await requireAuthContext("/admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_years")
    .select("id, code, name, start_date, end_date, status, classes(count)")
    .order("start_date", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as Array<Omit<AcademicYearSummary, "classCount"> & { classes: Array<{ count: number }> }>).map(
    ({ classes, ...year }) => ({ ...year, classCount: classes[0]?.count ?? 0 }),
  );
}

export type AttendanceSettings = Pick<
  Tables<"academic_years">,
  | "id"
  | "code"
  | "attendance_lock_days"
  | "attendance_edit_lease_minutes"
  | "attendance_warning_consecutive_absences"
  | "attendance_warning_consecutive_sundays"
  | "attendance_warning_rate_threshold"
>;

/** Cấu hình điểm danh của năm học hiện hành (D-32, D-33, D-58). */
export async function getCurrentAttendanceSettings(): Promise<AttendanceSettings | null> {
  await requireAuthContext("/admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_years")
    .select(
      "id, code, attendance_lock_days, attendance_edit_lease_minutes, attendance_warning_consecutive_absences, attendance_warning_consecutive_sundays, attendance_warning_rate_threshold",
    )
    .eq("status", "current")
    .maybeSingle();
  return data ?? null;
}
