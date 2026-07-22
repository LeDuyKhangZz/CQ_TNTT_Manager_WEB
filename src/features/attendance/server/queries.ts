import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/types";
import type {
  AttendanceSessionStatus,
  AttendanceStatus,
  MeetingType,
  StaffAttendanceStatus,
} from "../constants";

function personLabel(person: { saint_name: string | null; full_name: string } | null): string {
  if (!person) return "—";
  return person.saint_name ? `${person.saint_name} ${person.full_name}` : person.full_name;
}

export interface AttendanceClassOption {
  id: string;
  displayName: string;
}

export interface AttendanceSessionCard {
  id: string;
  classId: string;
  className: string;
  attendanceDate: string;
  meetingType: MeetingType;
  status: AttendanceSessionStatus;
  finalizedAt: string | null;
  lockedAt: string | null;
  editorName: string | null;
  studentCount: number;
  absentCount: number;
}

interface RawSessionRow {
  id: string;
  class_id: string;
  attendance_date: string;
  meeting_type: MeetingType;
  status: AttendanceSessionStatus;
  finalized_at: string | null;
  locked_at: string | null;
  classes: { display_name: string } | null;
  profiles: { display_name: string } | null;
  student_attendance_records: Array<{ mass_status: AttendanceStatus; catechism_status: AttendanceStatus }>;
}

const ABSENT_STATUSES = new Set<AttendanceStatus>(["excused_absence", "unexcused_absence"]);

function toSessionCard(row: RawSessionRow): AttendanceSessionCard {
  return {
    id: row.id,
    classId: row.class_id,
    className: row.classes?.display_name ?? "—",
    attendanceDate: row.attendance_date,
    meetingType: row.meeting_type,
    status: row.status,
    finalizedAt: row.finalized_at,
    lockedAt: row.locked_at,
    editorName: row.profiles?.display_name ?? null,
    studentCount: row.student_attendance_records.length,
    absentCount: row.student_attendance_records.filter(
      (record) => ABSENT_STATUSES.has(record.mass_status) || ABSENT_STATUSES.has(record.catechism_status),
    ).length,
  };
}

/**
 * Lớp mà người đăng nhập được trực tiếp điểm danh. Khớp app.can_edit_attendance:
 * phân công GLV còn hiệu lực, lớp gắn với role lớp, hoặc Super Admin (docs/05 §4.6
 * chốt rõ trưởng ngành KHÔNG tự điểm danh mọi lớp trong ngành).
 */
async function getEditableClasses(
  context: AuthContext,
  academicYearId: string,
): Promise<AttendanceClassOption[]> {
  const supabase = await createClient();

  if (context.role === "super_admin") {
    const { data } = await supabase
      .from("classes")
      .select("id, display_name")
      .eq("academic_year_id", academicYearId)
      .eq("status", "active")
      .order("display_name");
    return (data ?? []).map((item) => ({ id: item.id, displayName: item.display_name }));
  }

  const { data: staffProfile } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("profile_id", context.profileId)
    .maybeSingle();

  const classIds = new Set<string>();
  if (context.classId) classIds.add(context.classId);
  if (staffProfile) {
    const { data } = await supabase
      .from("class_staff_assignments")
      .select("class_id")
      .eq("staff_profile_id", staffProfile.id)
      .eq("is_active", true);
    for (const item of data ?? []) classIds.add(item.class_id);
  }
  if (classIds.size === 0) return [];

  const { data } = await supabase
    .from("classes")
    .select("id, display_name")
    .in("id", [...classIds])
    .eq("academic_year_id", academicYearId)
    .eq("status", "active")
    .order("display_name");
  return (data ?? []).map((item) => ({ id: item.id, displayName: item.display_name }));
}

export async function getAttendanceHubData() {
  const context = await requireRouteAccess("/attendance");
  const supabase = await createClient();

  const { data: year } = await supabase
    .from("academic_years")
    .select("id, code, name, attendance_lock_days, attendance_edit_lease_minutes")
    .eq("status", "current")
    .maybeSingle();

  if (!year) {
    return { context, year: null, editableClasses: [], sessions: [] as AttendanceSessionCard[] };
  }

  const [editableClasses, sessionResult] = await Promise.all([
    getEditableClasses(context, year.id),
    supabase
      .from("attendance_sessions")
      .select(
        "id, class_id, attendance_date, meeting_type, status, finalized_at, locked_at, classes(display_name), profiles!attendance_sessions_editing_by_fkey(display_name), student_attendance_records(mass_status, catechism_status)",
      )
      .eq("academic_year_id", year.id)
      .order("attendance_date", { ascending: false })
      .limit(24),
  ]);

  const sessions = ((sessionResult.data ?? []) as unknown as RawSessionRow[]).map(toSessionCard);
  return { context, year, editableClasses, sessions };
}

export interface AttendanceRosterEntry {
  recordId: string;
  enrollmentId: string;
  studentId: string;
  label: string;
  massStatus: AttendanceStatus;
  catechismStatus: AttendanceStatus;
  note: string | null;
  /** Đơn xin nghỉ đang chờ cho đúng buổi này — chỉ để gợi ý (WF-10 bước 6). */
  pendingAbsenceReason: string | null;
}

export interface AttendanceStaffEntry {
  recordId: string;
  classStaffAssignmentId: string;
  label: string;
  capacity: string;
  status: StaffAttendanceStatus;
  note: string | null;
}

export interface AttendanceSessionDetail {
  id: string;
  classId: string;
  className: string;
  attendanceDate: string;
  meetingType: MeetingType;
  status: AttendanceSessionStatus;
  finalizedAt: string | null;
  lockedAt: string | null;
  unlockedAt: string | null;
  editorProfileId: string | null;
  editorName: string | null;
  lastActivityAt: string | null;
  leaseMinutes: number;
  isLocked: boolean;
  isEditor: boolean;
  canTakeover: boolean;
  canEdit: boolean;
  canUnlock: boolean;
  roster: AttendanceRosterEntry[];
  staff: AttendanceStaffEntry[];
}

export async function getAttendanceSessionDetail(
  sessionId: string,
): Promise<{ context: AuthContext; detail: AttendanceSessionDetail | null }> {
  const context = await requireRouteAccess(`/attendance/${sessionId}`);
  const supabase = await createClient();

  const { data } = await supabase
    .from("attendance_sessions")
    .select(
      "id, class_id, academic_year_id, attendance_date, meeting_type, status, finalized_at, locked_at, unlocked_at, editing_by, last_activity_at, classes(display_name), profiles!attendance_sessions_editing_by_fkey(display_name), academic_years(attendance_edit_lease_minutes)",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (!data) return { context, detail: null };

  const session = data as unknown as {
    id: string;
    class_id: string;
    attendance_date: string;
    meeting_type: MeetingType;
    status: AttendanceSessionStatus;
    finalized_at: string | null;
    locked_at: string | null;
    unlocked_at: string | null;
    editing_by: string | null;
    last_activity_at: string | null;
    classes: { display_name: string } | null;
    profiles: { display_name: string } | null;
    academic_years: { attendance_edit_lease_minutes: number } | null;
  };

  const editorStaffQuery = session.editing_by
    ? supabase
        .from("staff_profiles")
        .select("saint_name, full_name")
        .eq("profile_id", session.editing_by)
        .maybeSingle()
    : null;

  const [recordResult, staffResult, absenceResult, assignmentResult, editorStaffResult] = await Promise.all([
    supabase
      .from("student_attendance_records")
      .select(
        "id, enrollment_id, student_id, mass_status, catechism_status, note, students(saint_name, full_name)",
      )
      .eq("attendance_session_id", sessionId),
    supabase
      .from("staff_attendance_records")
      .select(
        "id, class_staff_assignment_id, status, note, class_staff_assignments(capacity), staff_profiles(saint_name, full_name)",
      )
      .eq("attendance_session_id", sessionId),
    supabase
      .from("absence_requests")
      .select("student_id, reason")
      .eq("class_id", session.class_id)
      .eq("absence_date", session.attendance_date)
      .eq("meeting_type", session.meeting_type)
      .neq("status", "cancelled"),
    supabase
      .from("class_staff_assignments")
      .select("class_id, staff_profiles!inner(profile_id)")
      .eq("class_id", session.class_id)
      .eq("is_active", true)
      .eq("staff_profiles.profile_id", context.profileId),
    editorStaffQuery,
  ]);

  const absenceByStudent = new Map(
    (absenceResult.data ?? []).map((item) => [item.student_id, item.reason]),
  );

  const roster = ((recordResult.data ?? []) as unknown as Array<{
    id: string;
    enrollment_id: string;
    student_id: string;
    mass_status: AttendanceStatus;
    catechism_status: AttendanceStatus;
    note: string | null;
    students: { saint_name: string | null; full_name: string } | null;
  }>)
    .map((record) => ({
      recordId: record.id,
      enrollmentId: record.enrollment_id,
      studentId: record.student_id,
      label: personLabel(record.students),
      massStatus: record.mass_status,
      catechismStatus: record.catechism_status,
      note: record.note,
      pendingAbsenceReason: absenceByStudent.get(record.student_id) ?? null,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "vi"));

  const staff = ((staffResult.data ?? []) as unknown as Array<{
    id: string;
    class_staff_assignment_id: string;
    status: StaffAttendanceStatus;
    note: string | null;
    class_staff_assignments: { capacity: string } | null;
    staff_profiles: { saint_name: string | null; full_name: string } | null;
  }>)
    .map((record) => ({
      recordId: record.id,
      classStaffAssignmentId: record.class_staff_assignment_id,
      label: personLabel(record.staff_profiles),
      capacity: record.class_staff_assignments?.capacity ?? "member",
      status: record.status,
      note: record.note,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "vi"));

  const leaseMinutes = session.academic_years?.attendance_edit_lease_minutes ?? 15;
  const now = Date.now();
  const leaseExpiresAt = session.last_activity_at
    ? new Date(session.last_activity_at).getTime() + leaseMinutes * 60_000
    : 0;
  const isLocked =
    session.status === "locked" ||
    (session.locked_at !== null && now >= new Date(session.locked_at).getTime());
  const isSuperAdmin = context.role === "super_admin";
  // Cùng luật với app.can_edit_attendance; server action và RLS vẫn là chỗ chặn
  // thật, đây chỉ để UI không mời gọi thao tác chắc chắn bị từ chối (AGENTS §5).
  const isClassStaff = (assignmentResult.data ?? []).length > 0 || context.classId === session.class_id;
  const canEdit = isSuperAdmin || (isClassStaff && !isLocked && session.unlocked_at === null);
  const editorStaff = editorStaffResult?.data as {
    saint_name: string | null;
    full_name: string;
  } | null | undefined;

  return {
    context,
    detail: {
      id: session.id,
      classId: session.class_id,
      className: session.classes?.display_name ?? "—",
      attendanceDate: session.attendance_date,
      meetingType: session.meeting_type,
      status: session.status,
      finalizedAt: session.finalized_at,
      lockedAt: session.locked_at,
      unlockedAt: session.unlocked_at,
      editorProfileId: session.editing_by,
      // profiles chỉ cho self/global đọc; hai GLV cùng lớp lấy tên qua
      // staff_profiles (RLS theo class) để vẫn thấy ai đang giữ buổi (D-32).
      editorName: editorStaff ? personLabel(editorStaff) : session.profiles?.display_name ?? null,
      lastActivityAt: session.last_activity_at,
      leaseMinutes,
      isLocked,
      isEditor: session.editing_by === context.profileId && leaseExpiresAt > now,
      canTakeover:
        canEdit
        && session.editing_by !== context.profileId
        && (session.editing_by === null || leaseExpiresAt <= now),
      canEdit,
      canUnlock: isSuperAdmin && (isLocked || session.locked_at !== null),
      roster,
      staff,
    },
  };
}
