import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import { UUID_PATTERN } from "@/lib/validation/uuid";

export const ACADEMIC_YEAR_COOKIE = "cq-academic-year";
export type ViewedAcademicYear = {
  id: string; code: string; name: string; status: string;
  start_date: string; end_date: string; semester_1_end_date: string | null;
};

/** A display preference only. RLS revalidates the selection on every request.
 * Keep the theme's getCurrentAcademicYearRow independent from this preference.
 */
export const getAcademicYearView = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("academic_years")
    .select("id, code, name, status, start_date, end_date, semester_1_end_date")
    .in("status", ["current", "closed", "archived"]).order("start_date", {ascending:false}).order("id");
  if (error) throw new AppError("CONFLICT", "Không thể tải danh sách năm học. Vui lòng thử lại.");
  const years: ViewedAcademicYear[] = data ?? [];
  const current = years.find(year => year.status === "current") ?? null;
  const selectedId = (await cookies()).get(ACADEMIC_YEAR_COOKIE)?.value;
  const year = selectedId && UUID_PATTERN.test(selectedId)
    ? years.find(item => item.id === selectedId) ?? current : current;
  return {year, current, years, readOnly: Boolean(year && year.id !== current?.id)};
});

/** Guard mutations while browsing history, including calls made without the UI. */
export async function assertWritableYearView() {
  if (!(await cookies()).has(ACADEMIC_YEAR_COOKIE)) return;
  const view = await getAcademicYearView();
  if (view.readOnly) throw new AppError("FORBIDDEN", "Năm học đang xem chỉ được đọc. Hãy trở về năm học hiện hành để chỉnh sửa.");
}

/** Explicit export context; validation never grants access beyond caller RLS. */
export async function getReadableAcademicYear(id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  return (await getAcademicYearView()).years.find(year => year.id === id) ?? null;
}
