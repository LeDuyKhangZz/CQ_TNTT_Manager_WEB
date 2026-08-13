"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { meetingTypeForDate } from "@/features/attendance/constants";
import {
  absenceRequestIdSchema,
  acknowledgeAbsenceRequestSchema,
  createAbsenceRequestSchema,
  type AcknowledgeAbsenceRequestInput,
  type CreateAbsenceRequestInput,
} from "../schemas";

export type AbsenceResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

/**
 * Trigger `app.validate_absence_request` ném lỗi với *message* là mã ổn định.
 * Không dịch ở đây thì mọi mã rơi vào `VALIDATION_ERROR` với câu *"Dữ liệu
 * không hợp lệ. Vui lòng kiểm tra lại."* — một câu bảo người gửi đi soát lại
 * cái họ vừa gõ, trong khi thứ sai chẳng liên quan gì tới cái họ gõ.
 */
const TRIGGER_MESSAGES_VI: Readonly<Record<string, string>> = {
  // TB-11 / D-141 — hàng rào của đợt M05-B.
  ABSENCE_SESSION_ALREADY_FINALIZED:
    "Buổi này đã được chốt điểm danh nên không nhận đơn nữa. Vui lòng nhắn trực tiếp cho giáo lý viên của lớp.",
  ABSENCE_STUDENT_NOT_ENROLLED: "Em này chưa có lớp đang mở nên chưa xin nghỉ được.",
  ABSENCE_OWNER_CAN_ONLY_CANCEL: "Đơn đã được ghi nhận nên không rút lại được nữa.",
  ABSENCE_OWNER_CANNOT_EDIT: "Không sửa được nội dung đơn đã gửi.",
  ABSENCE_STAFF_CANNOT_CANCEL: "Chỉ người gửi mới rút được đơn.",
};

function fromPostgrestError(
  error: { code?: string; message?: string } | null | undefined,
): AppError {
  const key = (error?.message ?? "").trim();
  const translated = TRIGGER_MESSAGES_VI[key];
  if (translated) return new AppError("VALIDATION_ERROR", translated);
  if (error?.code === "23505") return new AppError("CONFLICT", "Đã có đơn xin nghỉ cho buổi này.");
  if (error?.code === "42501") return new AppError("FORBIDDEN");
  return new AppError("VALIDATION_ERROR");
}

function fail(error: unknown): AbsenceResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  if (error instanceof Error && error.name === "ZodError") {
    return { ok: false, code: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ." };
  }
  return { ok: false, code: "CONFLICT", message: "Không gửi được đơn. Vui lòng thử lại." };
}

/**
 * Nợ #14 / D-96 — guard gọi **NGOÀI `try`**, đúng khuôn M05-A đã áp cho
 * `attendance/server/actions.ts`. `redirect()` của Next báo hiệu bằng cách
 * **ném**, nên đặt guard trong `try` là để `catch` nuốt mất: người hết phiên
 * đăng nhập đọc *"Không gửi được đơn. Vui lòng thử lại."* rồi thử lại mãi thay
 * vì được đưa về `/login`. Cả ba thao tác của module này đều mắc lỗi ấy.
 */
async function parentRouteContext() {
  return requireRouteAccess("/parent/absence-requests");
}

export async function createAbsenceRequest(
  input: CreateAbsenceRequestInput,
): Promise<AbsenceResult<{ id: string }>> {
  const actor = await parentRouteContext();
  try {
    const parsed = createAbsenceRequestSchema.parse(input);
    const meetingType = meetingTypeForDate(parsed.absenceDate);
    if (!meetingType) throw new AppError("VALIDATION_ERROR");
    const supabase = await createClient();

    // RLS chỉ cho phụ huynh đọc ghi danh của con mình, nên không đọc được ở đây
    // nghĩa là em này không phải con họ. Trigger DB vẫn ghi đè hai cột này —
    // đây chỉ để câu insert đúng kiểu, không phải chỗ phân quyền.
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("class_id, academic_year_id")
      .eq("student_id", parsed.studentId)
      .in("status", ["active", "paused"])
      .maybeSingle();
    if (!enrollment) throw new AppError("RESOURCE_NOT_FOUND");

    const { data, error } = await supabase
      .from("absence_requests")
      .insert({
        student_id: parsed.studentId,
        class_id: enrollment.class_id,
        academic_year_id: enrollment.academic_year_id,
        absence_date: parsed.absenceDate,
        meeting_type: meetingType,
        reason: parsed.reason,
        created_by: actor.profileId,
      })
      .select("id")
      .single();
    if (error || !data) throw fromPostgrestError(error);

    revalidatePath("/parent/absence-requests");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function cancelAbsenceRequest(requestId: string): Promise<AbsenceResult> {
  const actor = await parentRouteContext();
  try {
    const parsed = absenceRequestIdSchema.parse({ requestId });
    const supabase = await createClient();
    const { error } = await supabase
      .from("absence_requests")
      .update({ status: "cancelled", updated_by: actor.profileId })
      .eq("id", parsed.requestId);
    if (error) throw fromPostgrestError(error);
    revalidatePath("/parent/absence-requests");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

/**
 * TB-06 / AC-F13-2 — **hàm này viết từ Phase 3 mà chưa màn hình nào gọi**, nên
 * trạng thái `acknowledged` và cột `staff_note` chưa bao giờ đạt tới được và
 * mọi đơn của phụ huynh nằm ở *"Đang chờ"* vĩnh viễn (audit F13-I2). Đợt M05-B
 * nối nó vào thẻ "Đơn xin nghỉ tuần này" ở `/attendance`.
 */
export async function acknowledgeAbsenceRequest(
  input: AcknowledgeAbsenceRequestInput,
): Promise<AbsenceResult> {
  const actor = await requireRouteAccess("/attendance");
  try {
    const parsed = acknowledgeAbsenceRequestSchema.parse(input);
    const supabase = await createClient();
    // reviewed_by/reviewed_at do trigger đặt từ phiên đăng nhập, không nhận từ client.
    // 🔴 `.select()` + đếm dòng (SW-04, bài học TB-F14 của M03-A): không có nó
    // thì RLS chặn xong vẫn trả `error === null`, và màn hình báo "Đã ghi nhận"
    // cho một thao tác không đổi dòng nào.
    const { data, error } = await supabase
      .from("absence_requests")
      .update({ status: "acknowledged", staff_note: parsed.staffNote, updated_by: actor.profileId })
      .eq("id", parsed.requestId)
      .eq("status", "pending")
      .select("id");
    if (error) throw fromPostgrestError(error);
    if (!data || data.length === 0) {
      throw new AppError(
        "CONFLICT",
        "Đơn này không còn ở trạng thái “Đang chờ”. Vui lòng tải lại trang.",
      );
    }
    revalidatePath("/attendance");
    revalidatePath("/parent/absence-requests");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

