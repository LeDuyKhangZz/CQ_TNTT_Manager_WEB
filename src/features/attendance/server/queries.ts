import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/types";
import { absenceReviewWindow } from "@/features/absence-requests/review-window";
import { todayVi } from "@/lib/dates";
import {
  ATTENDANCE_WARNING_KEYS,
  ATTENDANCE_WARNING_LABELS,
  deriveSessionState,
} from "../constants";
import type {
  AttendanceSessionState,
  AttendanceSessionStatus,
  AttendanceStatus,
  AttendanceWarningKey,
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
  /** Trạng thái hiển thị đã suy ra (TB-02) — dùng cái này, đừng in `status`. */
  state: AttendanceSessionState;
  finalizedAt: string | null;
  lockedAt: string | null;
  unlockedAt: string | null;
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
  unlocked_at: string | null;
  classes: { display_name: string } | null;
  profiles: { display_name: string } | null;
  student_attendance_records: Array<{ mass_status: AttendanceStatus; catechism_status: AttendanceStatus }>;
}

const ABSENT_STATUSES = new Set<AttendanceStatus>(["excused_absence", "unexcused_absence"]);

function toSessionCard(row: RawSessionRow, now: number): AttendanceSessionCard {
  return {
    id: row.id,
    classId: row.class_id,
    className: row.classes?.display_name ?? "—",
    attendanceDate: row.attendance_date,
    meetingType: row.meeting_type,
    status: row.status,
    // TB-02: hub từng in thẳng `status`, nên một buổi đã quá mốc khóa vẫn hiện
    // "Đã chốt" ở đây trong khi trang chi tiết hiện "Đã khóa".
    state: deriveSessionState({
      status: row.status,
      lockedAt: row.locked_at,
      unlockedAt: row.unlocked_at,
      now,
    }),
    finalizedAt: row.finalized_at,
    lockedAt: row.locked_at,
    unlockedAt: row.unlocked_at,
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

/** Một đơn xin nghỉ đang chờ, đủ để Giáo lý viên quyết mà không phải mở buổi. */
export interface PendingAbsenceRequest {
  id: string;
  studentLabel: string;
  className: string;
  absenceDate: string;
  meetingType: MeetingType;
  reason: string;
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
    return {
      context,
      year: null,
      editableClasses: [],
      sessions: [] as AttendanceSessionCard[],
      pendingAbsences: [] as PendingAbsenceRequest[],
    };
  }

  // TB-06 / AC-F13-1: đơn phải thấy được **trước** khi mở buổi. Không lọc lớp ở
  // đây — `absence_requests_select_scope` (`20260721000400:140-147`) đã thu về
  // đúng lớp của người đang xem, và lọc thêm một lần ở tầng ứng dụng chỉ tạo ra
  // một định nghĩa "lớp của tôi" thứ hai để sau này lệch với cái thứ nhất.
  const window = absenceReviewWindow(todayVi());

  const [editableClasses, sessionResult, absenceResult] = await Promise.all([
    getEditableClasses(context, year.id),
    supabase
      .from("attendance_sessions")
      .select(
        "id, class_id, attendance_date, meeting_type, status, finalized_at, locked_at, unlocked_at, classes(display_name), profiles!attendance_sessions_editing_by_fkey(display_name), student_attendance_records(mass_status, catechism_status)",
      )
      .eq("academic_year_id", year.id)
      .order("attendance_date", { ascending: false })
      .limit(24),
    supabase
      .from("absence_requests")
      .select(
        "id, absence_date, meeting_type, reason, students(saint_name, full_name), classes(display_name)",
      )
      .eq("academic_year_id", year.id)
      .eq("status", "pending")
      .gte("absence_date", window.start)
      .lte("absence_date", window.end)
      .order("absence_date", { ascending: true })
      .limit(50),
  ]);

  const now = Date.now();
  const sessions = ((sessionResult.data ?? []) as unknown as RawSessionRow[]).map((row) =>
    toSessionCard(row, now),
  );
  const pendingAbsences = ((absenceResult.data ?? []) as unknown as Array<{
    id: string;
    absence_date: string;
    meeting_type: MeetingType;
    reason: string;
    students: { saint_name: string | null; full_name: string } | null;
    classes: { display_name: string } | null;
  }>).map((row) => ({
    id: row.id,
    studentLabel: personLabel(row.students),
    className: row.classes?.display_name ?? "—",
    absenceDate: row.absence_date,
    meetingType: row.meeting_type,
    reason: row.reason,
  }));

  return { context, year, editableClasses, sessions, pendingAbsences };
}

export interface AttendanceRosterEntry {
  recordId: string;
  enrollmentId: string;
  studentId: string;
  label: string;
  massStatus: AttendanceStatus;
  catechismStatus: AttendanceStatus;
  /** D-75: ghi chú **nội bộ**, đọc qua `attendance_session_notes`, không qua bảng. */
  note: string | null;
  /** Đơn xin nghỉ đang chờ cho đúng buổi này — chỉ để gợi ý (WF-10 bước 6). */
  pendingAbsenceReason: string | null;
  /** TB-09: lý do cảnh báo chuyên cần, đã dịch sang tiếng Việt. Rỗng = không có. */
  warnings: string[];
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
  state: AttendanceSessionState;
  finalizedAt: string | null;
  lockedAt: string | null;
  unlockedAt: string | null;
  editorProfileId: string | null;
  editorName: string | null;
  lastActivityAt: string | null;
  leaseMinutes: number;
  /** TB-05: mốc hết hạn phiên chỉnh sửa, suy ra từ giờ máy chủ. */
  leaseExpiresAt: string | null;
  isLocked: boolean;
  isEditor: boolean;
  canTakeover: boolean;
  canEdit: boolean;
  canUnlock: boolean;
  roster: AttendanceRosterEntry[];
  /** D-140: em tạm nghỉ KHÔNG có trong `roster`; hiện con số để không ai tưởng mất em. */
  pausedCount: number;
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
    academic_year_id: string;
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

  const [
    recordResult,
    staffResult,
    absenceResult,
    assignmentResult,
    editorStaffResult,
    pausedResult,
    noteResult,
    warningResult,
  ] = await Promise.all([
    supabase
      .from("student_attendance_records")
      // 🔴 D-75: KHÔNG có `note` trong danh sách cột — và đó không phải chuyện
      // gọn gàng. Từ migration `20260803000300`, `authenticated` không còn quyền
      // trên cột ấy, nên xin nó ở đây là làm cả câu truy vấn hỏng với `42501`.
      .select(
        "id, enrollment_id, student_id, mass_status, catechism_status, students(saint_name, full_name)",
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
    // D-140: đếm đúng nhóm mà `app.attendance_roster_enrollments` loại ra.
    // `paused` bị CHECK cấm mang `ended_on` (BR-M03 / pgTAP 036) nên chỉ cần
    // hai điều kiện này là khớp tuyệt đối với định nghĩa ở cơ sở dữ liệu.
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", session.class_id)
      .eq("status", "paused")
      .lte("enrolled_on", session.attendance_date),
    // D-75: đường đọc ghi chú duy nhất còn lại. Cửa sổ hẹp mang đúng ba nhánh
    // nhân sự của policy, nên ai đọc được dòng thì đọc được ghi chú của dòng —
    // phạm vi của nhân sự KHÔNG đổi, chỉ có phía phụ huynh bị đóng lại.
    supabase.rpc("attendance_session_notes", { p_session_id: sessionId }),
    // TB-09 — bốn cờ cảnh báo chuyên cần cho đúng lớp này.
    //
    // 🔴 Lọc bằng `class_id` chứ không bằng danh sách `student_id`: danh sách
    // ấy chỉ có SAU khi `recordResult` về, tức phải nối thêm một vòng gọi nữa
    // vào trang mà người ta mở ngay trước Thánh lễ. Cột `class_id` của view là
    // lớp của buổi **gần nhất** của em, nên em vừa chuyển vào lớp này thì có
    // mặt, em đã chuyển đi thì không — mà em đã chuyển đi cũng không còn trong
    // roster. Hai tập khớp nhau; dòng thừa (nếu có) không tra ra id nào.
    //
    // `v_student_attendance_summary` là `security_invoker` (`20260721000500:99`)
    // nên nó chạy bằng quyền của chính người đang xem — không mở thêm cửa nào.
    supabase
      .from("v_student_attendance_summary")
      .select(
        "student_id, warn_consecutive_sunday, warn_consecutive_absence, warn_low_rate, warn_mass_catechism_mismatch",
      )
      .eq("academic_year_id", session.academic_year_id)
      .eq("class_id", session.class_id),
  ]);

  const absenceByStudent = new Map(
    (absenceResult.data ?? []).map((item) => [item.student_id, item.reason]),
  );
  // Lỗi ở đây chỉ có thể là "người này không thuộc nhóm đọc được ghi chú" — mà
  // họ vẫn đọc được phần còn lại của trang. Để trang sống với danh sách rỗng
  // thay vì đổ cả màn hình vì một trường phụ.
  const noteByRecord = new Map(
    ((noteResult.data ?? []) as unknown as Array<{ record_id: string; note: string | null }>)
      .map((item) => [item.record_id, item.note] as const),
  );

  // TB-09: dịch cờ boolean thành câu tiếng Việt nói **lý do**. Một badge ghi
  // trống không "Cảnh báo" thì người điểm danh không biết phải làm gì với nó.
  const warningsByStudent = new Map(
    ((warningResult.data ?? []) as unknown as Array<
      { student_id: string } & Partial<Record<AttendanceWarningKey, boolean | null>>
    >).map((row) => [
      row.student_id,
      ATTENDANCE_WARNING_KEYS.filter((key) => row[key] === true).map(
        (key) => ATTENDANCE_WARNING_LABELS[key],
      ),
    ] as const),
  );

  const roster = ((recordResult.data ?? []) as unknown as Array<{
    id: string;
    enrollment_id: string;
    student_id: string;
    mass_status: AttendanceStatus;
    catechism_status: AttendanceStatus;
    students: { saint_name: string | null; full_name: string } | null;
  }>)
    .map((record) => ({
      recordId: record.id,
      enrollmentId: record.enrollment_id,
      studentId: record.student_id,
      label: personLabel(record.students),
      massStatus: record.mass_status,
      catechismStatus: record.catechism_status,
      note: noteByRecord.get(record.id) ?? null,
      pendingAbsenceReason: absenceByStudent.get(record.student_id) ?? null,
      warnings: warningsByStudent.get(record.student_id) ?? [],
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
  // TB-02: cùng một hàm với hub, không còn hai biểu thức song song.
  const state = deriveSessionState({
    status: session.status,
    lockedAt: session.locked_at,
    unlockedAt: session.unlocked_at,
    now,
  });
  const isLocked = state === "locked";
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
      state,
      finalizedAt: session.finalized_at,
      lockedAt: session.locked_at,
      unlockedAt: session.unlocked_at,
      editorProfileId: session.editing_by,
      // profiles chỉ cho self/global đọc; hai GLV cùng lớp lấy tên qua
      // staff_profiles (RLS theo class) để vẫn thấy ai đang giữ buổi (D-32).
      editorName: editorStaff ? personLabel(editorStaff) : session.profiles?.display_name ?? null,
      lastActivityAt: session.last_activity_at,
      leaseMinutes,
      // TB-05: cùng phép tính đã dùng cho `isEditor` ngay dưới đây, chỉ khác là
      // nay nó đi được ra tới màn hình thay vì chỉ sống trong một biến cục bộ.
      leaseExpiresAt: leaseExpiresAt > 0 ? new Date(leaseExpiresAt).toISOString() : null,
      isLocked,
      isEditor: session.editing_by === context.profileId && leaseExpiresAt > now,
      canTakeover:
        canEdit
        && session.editing_by !== context.profileId
        && (session.editing_by === null || leaseExpiresAt <= now),
      canEdit,
      canUnlock: isSuperAdmin && (isLocked || session.locked_at !== null),
      roster,
      pausedCount: pausedResult.count ?? 0,
      staff,
    },
  };
}
