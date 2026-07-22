"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
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

function fail(error: unknown): AbsenceResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  if (error instanceof Error && error.name === "ZodError") {
    return { ok: false, code: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ." };
  }
  return { ok: false, code: "CONFLICT", message: "Không gửi được đơn. Vui lòng thử lại." };
}

export async function createAbsenceRequest(
  input: CreateAbsenceRequestInput,
): Promise<AbsenceResult<{ id: string }>> {
  try {
    const actor = await requireAuthContext("/parent/absence-requests");
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
    if (error || !data) {
      if (error?.code === "23505") {
        throw new AppError("CONFLICT", "Đã có đơn xin nghỉ cho buổi này.");
      }
      if (error?.code === "42501") throw new AppError("FORBIDDEN");
      throw new AppError("VALIDATION_ERROR");
    }

    revalidatePath("/parent/absence-requests");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function cancelAbsenceRequest(requestId: string): Promise<AbsenceResult> {
  try {
    const actor = await requireAuthContext("/parent/absence-requests");
    const parsed = absenceRequestIdSchema.parse({ requestId });
    const supabase = await createClient();
    const { error } = await supabase
      .from("absence_requests")
      .update({ status: "cancelled", updated_by: actor.profileId })
      .eq("id", parsed.requestId);
    if (error) throw new AppError(error.code === "42501" ? "FORBIDDEN" : "VALIDATION_ERROR");
    revalidatePath("/parent/absence-requests");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

export async function acknowledgeAbsenceRequest(
  input: AcknowledgeAbsenceRequestInput,
): Promise<AbsenceResult> {
  try {
    const actor = await requireAuthContext("/attendance");
    const parsed = acknowledgeAbsenceRequestSchema.parse(input);
    const supabase = await createClient();
    // reviewed_by/reviewed_at do trigger đặt từ phiên đăng nhập, không nhận từ client.
    const { error } = await supabase
      .from("absence_requests")
      .update({ status: "acknowledged", staff_note: parsed.staffNote, updated_by: actor.profileId })
      .eq("id", parsed.requestId);
    if (error) throw new AppError(error.code === "42501" ? "FORBIDDEN" : "VALIDATION_ERROR");
    revalidatePath("/attendance");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

