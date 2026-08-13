import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus, MeetingType } from "@/features/attendance/constants";
import type { PortalChildrenStatus, PortalDataStatus } from "../status";

/**
 * Portal phụ huynh/thiếu nhi ở Phase 3 chỉ làm phần điểm danh (D-60). Mọi truy
 * vấn ở đây giữ RLS làm hàng rào cuối: `students` chỉ trả những em người gọi
 * được phép đọc, `student_attendance_records` chỉ trả dòng đã chốt. Riêng câu
 * hỏi nghiệp vụ "con của tôi" và "chính em" còn được lọc tường minh theo
 * `profile_id`; RLS sai thì pgTAP phải đỏ, không thể dựa vào trang để che đi.
 */

export interface PortalChild {
  id: string;
  label: string;
}

export interface PortalChildrenDirectory {
  status: PortalChildrenStatus;
  children: PortalChild[];
}

/**
 * 🔴 D-75: **không có** `note`. Ghi chú Giáo lý viên nhập khi điểm danh là ghi
 * chú nội bộ; phụ huynh và thiếu nhi không đọc được, và điều đó được chặn ở
 * tầng cơ sở dữ liệu bằng quyền cột (`20260803000300`) chứ không phải bằng
 * việc trang này bỏ in ra. Thêm lại trường đó là làm cả truy vấn hỏng `42501`.
 */
export interface PortalAttendanceRow {
  recordId: string;
  attendanceDate: string;
  meetingType: MeetingType;
  massStatus: AttendanceStatus;
  catechismStatus: AttendanceStatus;
}

export interface PortalAttendanceSummary {
  sessionsCounted: number;
  massPresentCount: number;
  catechismPresentCount: number;
  massAttendanceScore: number | null;
  catechismAttendanceScore: number | null;
  catechismAbsenceStreak: number;
  sundayAbsenceStreak: number;
  warnConsecutiveAbsence: boolean;
  warnConsecutiveSunday: boolean;
  warnLowRate: boolean;
}

function personLabel(person: { saint_name: string | null; full_name: string }): string {
  return person.saint_name ? `${person.saint_name} ${person.full_name}` : person.full_name;
}

/**
 * M13-A / TB-M13-05 — mọi em phiên hiện tại đọc được.
 *
 * Tên này cố ý KHÔNG nói "con": với nhân sự, RLS có thể trả cả lớp/ngành.
 * Luồng đơn xin nghỉ đang dùng đúng ngữ nghĩa rộng này để nhân sự nộp hộ.
 */
export async function getAccessibleStudents(): Promise<PortalChild[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, saint_name, full_name")
    .order("full_name");
  if (error) throw error;
  return (data ?? []).map((item) => ({ id: item.id, label: personLabel(item) }));
}

/**
 * M13-A / BR-M13-01 — đúng "con của tôi", lọc tường minh theo hồ sơ người
 * giám hộ của chính tài khoản. RLS vẫn là chốt chặn cuối; bộ lọc này trả lời
 * câu hỏi nghiệp vụ và ngăn tài khoản nhân sự toàn cục dùng cổng như danh sách
 * thiếu nhi thứ hai.
 */
export async function getMyChildren(profileId: string): Promise<PortalChildrenDirectory> {
  const supabase = await createClient();
  const { data: guardian, error } = await supabase
    .from("guardians")
    .select("id, students(id, saint_name, full_name)")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  if (!guardian) return { status: "not_linked", children: [] };

  const children = guardian.students
    .map((item) => ({ id: item.id, label: personLabel(item) }))
    .sort((left, right) => left.label.localeCompare(right.label, "vi"));
  return { status: children.length === 0 ? "no_children" : "ok", children };
}

/** M13-A / BR-M13-05 — hồ sơ của chính thiếu nhi, không lấy phần tử đầu tiên. */
export async function getSelfStudent(profileId: string): Promise<PortalChild | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, saint_name, full_name")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, label: personLabel(data) } : null;
}

/**
 * Danh sách con để dựng LINK trên Trang chủ — M14 A-07.
 *
 * Guard bằng chính route đang dựng (`/dashboard`) chứ không mượn guard của
 * `/parent/*`: đây là dữ liệu của trang chủ. Nhân sự không có hồ sơ người giám
 * hộ trả mảng rỗng; nhân sự đồng thời là phụ huynh (D-25) nhận đúng con mình.
 * `getAuthContext` được `cache()` theo request nên lần guard thứ hai trong cùng
 * một lần dựng trang không tốn thêm truy vấn nào.
 */
export async function getGuardianChildLinks(): Promise<PortalChildrenDirectory> {
  const context = await requireRouteAccess("/dashboard");
  return getMyChildren(context.profileId);
}

/**
 * Trang danh sách con — M14 A-08, đích của mục điều hướng "Con của tôi".
 *
 * `/parent` **cố ý không giới hạn `roles`** (D-25: một Giáo lý viên vẫn có thể
 * là phụ huynh), nhưng danh sách vẫn đi qua `getMyChildren`: tài khoản nhân sự
 * toàn cục không thể biến cổng này thành danh sách thiếu nhi thứ hai. Nhân sự
 * không có con vào thẳng URL sẽ gặp trạng thái "chưa gắn hồ sơ".
 */
export async function getChildrenPageData() {
  const context = await requireRouteAccess("/parent/children");
  const directory = await getMyChildren(context.profileId);
  return { context, ...directory };
}

export async function getPortalAttendance(studentId: string): Promise<{
  status: Extract<PortalDataStatus, "no_enrollment" | "no_data" | "ok">;
  yearCode: string | null;
  summary: PortalAttendanceSummary | null;
  rows: PortalAttendanceRow[];
}> {
  const supabase = await createClient();

  const { data: currentYear, error: yearError } = await supabase
    .from("academic_years")
    .select("id, code")
    .eq("status", "current")
    .maybeSingle();
  if (yearError) throw yearError;
  if (!currentYear) {
    return { status: "no_data", yearCode: null, summary: null, rows: [] };
  }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("academic_year_id", currentYear.id)
    .eq("student_id", studentId)
    .limit(1)
    .maybeSingle();
  if (enrollmentError) throw enrollmentError;
  if (!enrollment) {
    return {
      status: "no_enrollment",
      yearCode: currentYear.code,
      summary: null,
      rows: [],
    };
  }

  const [summaryResult, recordResult] = await Promise.all([
    supabase
      .from("v_student_attendance_summary")
      .select(
        "sessions_counted, mass_present_count, catechism_present_count, mass_attendance_score, catechism_attendance_score, catechism_absence_streak, sunday_absence_streak, warn_consecutive_absence, warn_consecutive_sunday, warn_low_rate",
      )
      .eq("student_id", studentId)
      .eq("academic_year_id", currentYear.id)
      .maybeSingle(),
    supabase
      .from("student_attendance_records")
      .select(
        "id, mass_status, catechism_status, attendance_sessions!inner(attendance_date, meeting_type)",
      )
      .eq("student_id", studentId)
      .eq("attendance_sessions.academic_year_id", currentYear.id)
      .not("session_finalized_at", "is", null)
      .order("attendance_date", { referencedTable: "attendance_sessions", ascending: false })
      .limit(60),
  ]);
  if (summaryResult.error) throw summaryResult.error;
  if (recordResult.error) throw recordResult.error;

  const summaryRow = summaryResult.data;
  const rows = ((recordResult.data ?? []) as unknown as Array<{
    id: string;
    mass_status: AttendanceStatus;
    catechism_status: AttendanceStatus;
    attendance_sessions: { attendance_date: string; meeting_type: MeetingType } | null;
  }>)
    .filter((row) => row.attendance_sessions !== null)
    .map((row) => ({
      recordId: row.id,
      attendanceDate: row.attendance_sessions!.attendance_date,
      meetingType: row.attendance_sessions!.meeting_type,
      massStatus: row.mass_status,
      catechismStatus: row.catechism_status,
    }))
    .sort((left, right) => right.attendanceDate.localeCompare(left.attendanceDate));

  return {
    status: summaryRow === null ? "no_data" : "ok",
    yearCode: currentYear.code,
    summary: summaryRow
      ? {
          sessionsCounted: summaryRow.sessions_counted ?? 0,
          massPresentCount: summaryRow.mass_present_count ?? 0,
          catechismPresentCount: summaryRow.catechism_present_count ?? 0,
          massAttendanceScore: summaryRow.mass_attendance_score,
          catechismAttendanceScore: summaryRow.catechism_attendance_score,
          catechismAbsenceStreak: summaryRow.catechism_absence_streak ?? 0,
          sundayAbsenceStreak: summaryRow.sunday_absence_streak ?? 0,
          warnConsecutiveAbsence: summaryRow.warn_consecutive_absence ?? false,
          warnConsecutiveSunday: summaryRow.warn_consecutive_sunday ?? false,
          warnLowRate: summaryRow.warn_low_rate ?? false,
        }
      : null,
    rows,
  };
}

export interface PortalAbsenceRequest {
  id: string;
  studentLabel: string;
  absenceDate: string;
  meetingType: MeetingType;
  reason: string;
  status: "pending" | "acknowledged" | "cancelled";
  staffNote: string | null;
}

export async function getAbsenceRequestsPageData() {
  const context = await requireRouteAccess("/parent/absence-requests");
  const supabase = await createClient();

  const directory = context.audience === "guardian"
    ? await getMyChildren(context.profileId)
    : {
        status: "ok" as const,
        children: await getAccessibleStudents(),
      };
  const { data, error } = await supabase
    .from("absence_requests")
    .select("id, student_id, absence_date, meeting_type, reason, status, staff_note, students(saint_name, full_name)")
    .order("absence_date", { ascending: false })
    .limit(50);
  if (error) throw error;

  const requests = ((data ?? []) as unknown as Array<{
    id: string;
    absence_date: string;
    meeting_type: MeetingType;
    reason: string;
    status: PortalAbsenceRequest["status"];
    staff_note: string | null;
    students: { saint_name: string | null; full_name: string } | null;
  }>).map((row) => ({
    id: row.id,
    studentLabel: row.students ? personLabel(row.students) : "—",
    absenceDate: row.absence_date,
    meetingType: row.meeting_type,
    reason: row.reason,
    status: row.status,
    staffNote: row.staff_note,
  }));

  return { context, ...directory, requests };
}

export async function getChildAttendancePageData(studentId: string) {
  const context = await requireRouteAccess(`/parent/children/${studentId}`);
  const { children } = await getMyChildren(context.profileId);
  const student = children.find((item) => item.id === studentId) ?? null;
  if (!student) {
    return {
      context,
      student: null,
      status: "not_linked" as const,
      yearCode: null,
      summary: null,
      rows: [] as PortalAttendanceRow[],
    };
  }
  const attendance = await getPortalAttendance(student.id);
  return { context, student, ...attendance };
}

export async function getStudentSelfAttendancePageData() {
  // 🔴 `requireRouteAccess`, KHÔNG phải `requireAuthContext` — M14 A-03.
  // `ROUTE_RULES` khai `/student` chỉ cho vai trò `student`, nhưng bản cũ chỉ
  // kiểm "đã đăng nhập chưa" nên luật đó không bao giờ được thi hành: bất kỳ
  // ai có phiên hợp lệ gõ thẳng địa chỉ đều vào được. RLS che phần dữ liệu,
  // nhưng luật route đã tuyên bố một điều mà mã nguồn không làm — đúng kiểu hở
  // quyền lặng lẽ nhất.
  const context = await requireRouteAccess("/student/attendance");
  const self = await getSelfStudent(context.profileId);
  if (!self) {
    return {
      context,
      student: null,
      status: "not_linked" as const,
      yearCode: null,
      summary: null,
      rows: [] as PortalAttendanceRow[],
    };
  }
  const attendance = await getPortalAttendance(self.id);
  return { context, student: self, ...attendance };
}
