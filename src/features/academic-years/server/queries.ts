import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/auth/guards";
import type { Tables } from "@/types/database";
import { parseOpenWork } from "../db-errors";
import type { AcademicYearOpenWork } from "../year-lifecycle";

export type AcademicYearSummary = Pick<
  Tables<"academic_years">,
  | "id"
  | "code"
  | "name"
  | "start_date"
  | "end_date"
  | "status"
  | "semester_1_end_date"
  | "retention_until"
  | "closed_at"
  | "close_reason"
> & { classCount: number };

export async function listAcademicYears(): Promise<AcademicYearSummary[]> {
  await requireAuthContext("/admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_years")
    // `semester_1_end_date` (D-71) đi cùng để biểu mẫu sửa mốc có giá trị hiện tại
    // mà không phải thêm một lượt truy vấn cho mỗi năm học.
    // `retention_until` + `closed_at` + `close_reason` (I7/D-120): trang phải nói
    // được **khi nào** năm học bị chốt, **vì sao**, và **bao giờ** lưu trữ được.
    .select(
      "id, code, name, start_date, end_date, status, semester_1_end_date, retention_until, closed_at, close_reason, classes(count)",
    )
    .order("start_date", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as Array<Omit<AcademicYearSummary, "classCount"> & { classes: Array<{ count: number }> }>).map(
    ({ classes, ...year }) => ({ ...year, classCount: classes[0]?.count ?? 0 }),
  );
}

/**
 * Số mẫu lớp đang bật — tức "đủ lớp" nghĩa là bao nhiêu.
 *
 * 🔴 Trang cũ in thẳng chuỗi `/19` (`admin/page.tsx:47`). Con số đó đúng hôm nay
 * vì danh mục có đúng 19 dòng, nhưng nó là **chữ viết cứng cạnh một con số thật**:
 * ở một môi trường thiếu danh mục (5W-F11) màn hình vẫn dõng dạc "0/19 lớp" trong
 * khi sự thật là hệ thống không biết phải có bao nhiêu lớp. Trả `null` khi không
 * đọc được, để trang nói "chưa rõ" thay vì bịa.
 */
export async function getActiveClassTemplateCount(): Promise<number | null> {
  await requireAuthContext("/admin");
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("class_templates")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  if (error) return null;
  return count ?? null;
}

export type CurrentAcademicYear = Pick<Tables<"academic_years">, "id" | "code" | "name">;

/**
 * Năm học hiện hành cho thanh đầu trang — mọi vai trò đọc được.
 *
 * 🔴 KHÔNG có `requireAuthContext("/admin")` như các hàm khác trong file này:
 * thanh đầu trang hiện cho phụ huynh và thiếu nhi nữa. Chốt chặn là policy
 * `academic_years_select_scope` — và **D-70 (M02-C) đã siết policy đó**: phụ huynh
 * và thiếu nhi chỉ còn đọc được **năm hiện hành** cùng những năm con mình có ghi
 * danh. Nhánh `status = 'current'` của policy tồn tại **chính vì hàm này**: chặn
 * sạch là cổng phụ huynh hiện "Chưa đặt năm học", một câu sai.
 *
 * `cache()` để vỏ ứng dụng chỉ tốn 1 truy vấn/request, cùng khuôn mẫu với
 * `getAuthContext` và `resolveThemeContext` (10 §7).
 */
export const getCurrentAcademicYear = cache(
  async (): Promise<CurrentAcademicYear | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("academic_years")
      .select("id, code, name")
      .eq("status", "current")
      .maybeSingle();
    return data ?? null;
  },
);

/**
 * Bảng kiểm tiền điều kiện trước khi chốt sổ — **I7 / WF-16 bước 1–3**.
 *
 * 🔴 Gọi RPC `academic_year_close_checklist` thay vì tự đếm bằng ba truy vấn ở đây,
 * và đó là một quyết định có lý do: đếm ở tầng này là đếm **dưới RLS của người xem**
 * — một buổi điểm danh chưa chốt của lớp mà người xem không được đọc sẽ biến mất khỏi
 * phép đếm, và màn hình sẽ hứa "không còn việc tồn đọng" trước một RPC chắc chắn từ
 * chối. RPC `security definer` nhìn thấy mọi dòng, y như hàm đóng năm. Cùng khuôn
 * `staff_profile_delete_blockers` của M04-B.
 *
 * Trả `null` khi không đọc được — trang phải nói "chưa rõ", không được bịa số 0.
 */
export async function getAcademicYearCloseChecklist(
  academicYearId: string,
): Promise<AcademicYearOpenWork | null> {
  await requireAuthContext("/admin");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("academic_year_close_checklist", {
    p_year_id: academicYearId,
  });
  if (error) return null;
  return parseOpenWork(data);
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
