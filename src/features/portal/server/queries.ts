import "server-only";

import { requireAuthContext, requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus, MeetingType } from "@/features/attendance/constants";

/**
 * Portal phụ huynh/thiếu nhi ở Phase 3 chỉ làm phần điểm danh (D-60). Mọi truy
 * vấn ở đây dựa hoàn toàn vào RLS: `students` trả về con của phụ huynh hoặc
 * chính em đó, `student_attendance_records` chỉ trả dòng đã chốt của mình.
 * Không có bộ lọc `guardian_id` nào ở tầng ứng dụng — nếu RLS sai thì test
 * pgTAP 012 phải đỏ, chứ không phải trang này che đi.
 */

export interface PortalChild {
  id: string;
  label: string;
}

export interface PortalAttendanceRow {
  recordId: string;
  attendanceDate: string;
  meetingType: MeetingType;
  massStatus: AttendanceStatus;
  catechismStatus: AttendanceStatus;
  note: string | null;
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

export async function getPortalChildren(): Promise<PortalChild[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, saint_name, full_name")
    .order("full_name");
  return (data ?? []).map((item) => ({ id: item.id, label: personLabel(item) }));
}

export async function getPortalAttendance(studentId: string): Promise<{
  summary: PortalAttendanceSummary | null;
  rows: PortalAttendanceRow[];
}> {
  const supabase = await createClient();

  const [summaryResult, recordResult] = await Promise.all([
    supabase
      .from("v_student_attendance_summary")
      .select(
        "sessions_counted, mass_present_count, catechism_present_count, mass_attendance_score, catechism_attendance_score, catechism_absence_streak, sunday_absence_streak, warn_consecutive_absence, warn_consecutive_sunday, warn_low_rate",
      )
      .eq("student_id", studentId)
      .maybeSingle(),
    supabase
      .from("student_attendance_records")
      .select(
        "id, mass_status, catechism_status, note, attendance_sessions!inner(attendance_date, meeting_type)",
      )
      .eq("student_id", studentId)
      .not("session_finalized_at", "is", null)
      .order("attendance_date", { referencedTable: "attendance_sessions", ascending: false })
      .limit(60),
  ]);

  const summaryRow = summaryResult.data;
  const rows = ((recordResult.data ?? []) as unknown as Array<{
    id: string;
    mass_status: AttendanceStatus;
    catechism_status: AttendanceStatus;
    note: string | null;
    attendance_sessions: { attendance_date: string; meeting_type: MeetingType } | null;
  }>)
    .filter((row) => row.attendance_sessions !== null)
    .map((row) => ({
      recordId: row.id,
      attendanceDate: row.attendance_sessions!.attendance_date,
      meetingType: row.attendance_sessions!.meeting_type,
      massStatus: row.mass_status,
      catechismStatus: row.catechism_status,
      note: row.note,
    }))
    .sort((left, right) => right.attendanceDate.localeCompare(left.attendanceDate));

  return {
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

  const children = await getPortalChildren();
  const { data } = await supabase
    .from("absence_requests")
    .select("id, student_id, absence_date, meeting_type, reason, status, staff_note, students(saint_name, full_name)")
    .order("absence_date", { ascending: false })
    .limit(50);

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

  return { context, children, requests };
}

export async function getChildAttendancePageData(studentId: string) {
  const context = await requireRouteAccess(`/parent/children/${studentId}`);
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, saint_name, full_name")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return { context, student: null, summary: null, rows: [] as PortalAttendanceRow[] };
  const { summary, rows } = await getPortalAttendance(student.id);
  return { context, student: { id: student.id, label: personLabel(student) }, summary, rows };
}

export async function getStudentSelfAttendancePageData() {
  const context = await requireAuthContext("/student/attendance");
  const children = await getPortalChildren();
  const self = children[0] ?? null;
  if (!self) return { context, student: null, summary: null, rows: [] as PortalAttendanceRow[] };
  const { summary, rows } = await getPortalAttendance(self.id);
  return { context, student: self, summary, rows };
}
