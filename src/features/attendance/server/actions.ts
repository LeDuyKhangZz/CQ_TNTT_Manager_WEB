"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  claimSessionSchema,
  saveAttendanceSchema,
  sessionIdSchema,
  type ClaimSessionInput,
  type SaveAttendanceInput,
} from "../schemas";

export type AttendanceResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

/**
 * RPC ném lỗi với *message* là mã ổn định (xem migration ...000300). Ánh xạ ở
 * đây để UI có câu tiếng Việt và không lộ SQL ra ngoài (AGENTS §7).
 */
const RPC_ERROR_CODES: Readonly<Record<string, AppErrorCode>> = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  FORBIDDEN: "FORBIDDEN",
  ATTENDANCE_LOCKED: "ATTENDANCE_LOCKED",
  ATTENDANCE_ALREADY_CLAIMED: "ATTENDANCE_ALREADY_CLAIMED",
  LEASE_NOT_EXPIRED: "LEASE_NOT_EXPIRED",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  ATTENDANCE_INVALID_MEETING_DAY: "VALIDATION_ERROR",
  ATTENDANCE_ROSTER_INCOMPLETE: "VALIDATION_ERROR",
  CLASS_NOT_ACTIVE: "VALIDATION_ERROR",
};

const EXTRA_MESSAGES_VI: Readonly<Record<string, string>> = {
  ATTENDANCE_INVALID_MEETING_DAY: "Chỉ điểm danh vào thứ Năm hoặc Chúa nhật.",
  ATTENDANCE_ROSTER_INCOMPLETE: "Danh sách chưa đủ. Vui lòng tải lại trang rồi chốt lại.",
  CLASS_NOT_ACTIVE: "Lớp này không còn hoạt động.",
};

function fromPostgrestError(message: string | undefined): AppError {
  const key = (message ?? "").trim();
  const code = RPC_ERROR_CODES[key];
  if (!code) return new AppError("CONFLICT");
  return new AppError(code, EXTRA_MESSAGES_VI[key]);
}

function fail(error: unknown): AttendanceResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không lưu được điểm danh. Vui lòng thử lại." };
}

function revalidateSession(sessionId: string) {
  revalidatePath("/attendance");
  revalidatePath(`/attendance/${sessionId}`);
}

export async function claimAttendanceSession(
  input: ClaimSessionInput,
): Promise<AttendanceResult<{ sessionId: string; claimed: boolean; editorName: string }>> {
  try {
    await requireAuthContext("/attendance");
    const parsed = claimSessionSchema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc("claim_attendance_session", {
        p_class_id: parsed.classId,
        p_date: parsed.date,
        p_meeting_type: parsed.meetingType,
      })
      .single();
    if (error || !data) throw fromPostgrestError(error?.message);

    revalidateSession(data.out_session_id);
    return {
      ok: true,
      data: {
        sessionId: data.out_session_id,
        claimed: data.out_claimed,
        editorName: data.out_editor_display_name,
      },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function heartbeatAttendanceSession(sessionId: string): Promise<AttendanceResult> {
  try {
    await requireAuthContext("/attendance");
    const parsed = sessionIdSchema.parse({ sessionId });
    const supabase = await createClient();
    const { error } = await supabase.rpc("heartbeat_attendance_session", {
      p_session_id: parsed.sessionId,
    });
    if (error) throw fromPostgrestError(error.message);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

export async function takeoverAttendanceSession(sessionId: string): Promise<AttendanceResult> {
  try {
    await requireAuthContext("/attendance");
    const parsed = sessionIdSchema.parse({ sessionId });
    const supabase = await createClient();
    const { error } = await supabase.rpc("takeover_attendance_session", {
      p_session_id: parsed.sessionId,
    });
    if (error) throw fromPostgrestError(error.message);
    revalidateSession(parsed.sessionId);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

export interface FinalizeSummary {
  status: string;
  finalizedAt: string | null;
  lockedAt: string | null;
  studentTotal: number;
  studentPresent: number;
  studentAbsent: number;
  staffTotal: number;
  staffPresent: number;
}

export async function saveAttendance(
  input: SaveAttendanceInput,
): Promise<AttendanceResult<FinalizeSummary>> {
  try {
    await requireAuthContext("/attendance");
    const parsed = saveAttendanceSchema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc("save_and_finalize_attendance", {
        p_session_id: parsed.sessionId,
        p_students: parsed.students.map((entry) => ({
          enrollment_id: entry.enrollmentId,
          mass_status: entry.massStatus,
          catechism_status: entry.catechismStatus,
          note: entry.note,
        })),
        p_staff: parsed.staff.map((entry) => ({
          class_staff_assignment_id: entry.classStaffAssignmentId,
          status: entry.status,
          note: entry.note,
        })),
        p_finalize: parsed.finalize,
      })
      .single();
    if (error || !data) throw fromPostgrestError(error?.message);

    revalidateSession(parsed.sessionId);
    return {
      ok: true,
      data: {
        status: data.out_status,
        finalizedAt: data.out_finalized_at,
        lockedAt: data.out_locked_at,
        studentTotal: data.out_student_total,
        studentPresent: data.out_student_present,
        studentAbsent: data.out_student_absent,
        staffTotal: data.out_staff_total,
        staffPresent: data.out_staff_present,
      },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function unlockAttendanceSession(sessionId: string): Promise<AttendanceResult> {
  try {
    const context = await requireAuthContext("/attendance");
    // Kiểm ở server chứ không chỉ ẩn nút (AGENTS §5); RPC vẫn kiểm lại lần nữa.
    if (context.role !== "super_admin") throw new AppError("FORBIDDEN");
    const parsed = sessionIdSchema.parse({ sessionId });
    const supabase = await createClient();
    const { error } = await supabase.rpc("unlock_attendance_session", {
      p_session_id: parsed.sessionId,
    });
    if (error) throw fromPostgrestError(error.message);
    revalidateSession(parsed.sessionId);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

// Chỉ redirect khi lỗi. Redirect về đúng đường đang đứng làm Next trả về một
// payload rỗng và trang rơi vào error boundary — đã thử và bỏ.
export async function unlockAttendanceSessionFromForm(formData: FormData): Promise<void> {
  const sessionId = String(formData.get("sessionId") ?? "");
  const result = await unlockAttendanceSession(sessionId);
  if (!result.ok) {
    redirect(`/attendance/${sessionId}?error=${encodeURIComponent(result.message)}`);
  }
}

/** Form mở buổi điểm danh ở `/attendance`: claim rồi đi thẳng vào trang buổi. */
export async function openAttendanceSessionFromForm(formData: FormData): Promise<void> {
  const result = await claimAttendanceSession({
    classId: String(formData.get("classId") ?? ""),
    date: String(formData.get("date") ?? ""),
    meetingType: String(formData.get("meetingType") ?? "") as ClaimSessionInput["meetingType"],
  });
  if (!result.ok) {
    redirect(`/attendance?error=${encodeURIComponent(result.message)}`);
  }
  redirect(`/attendance/${result.data.sessionId}`);
}
