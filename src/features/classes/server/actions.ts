"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { isAcademicYearWritable } from "@/features/academic-years/year-lifecycle";
import { classStatusLabel } from "../class-status";
import {
  classFailureFeedback,
  classSavedFeedback,
  type ClassFailedCode,
  type ClassFeedback,
} from "../class-feedback";
import { updateClassSchema, type UpdateClassInput } from "../schemas";
import { assertClassWrite, classRouteContext } from "./permissions";

export type ClassActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string; failed: ClassFailedCode };

function failure(error: unknown, failed: ClassFailedCode = "invalid"): ClassActionResult<never> {
  if (error instanceof AppError) {
    return { ok: false, code: error.code, message: error.message, failed };
  }
  // Cùng vá gốc với M02-A: bản cũ gán **mọi** lỗi lạ thành `CONFLICT`, nên một lỗi
  // Zod ("Ghi chú tối đa 1000 ký tự") hiện ra thành "Thao tác bị xung đột, vui lòng
  // thử lại" — vừa sai vừa dẫn người dùng đi thử lại đúng thứ vừa hỏng.
  if (error instanceof ZodError) {
    const first = error.issues[0]?.message ?? "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
    return { ok: false, code: "VALIDATION_ERROR", message: first, failed: "invalid" };
  }
  return {
    ok: false,
    code: "CONFLICT",
    message: "Không thể lưu cài đặt lớp. Vui lòng thử lại.",
    failed: "invalid",
  };
}

/**
 * TB-F08 / AC-M02-10 — sửa cài đặt lớp: trạng thái, phòng sinh hoạt, ghi chú.
 *
 * Hàm này **viết xong từ Phase 1 nhưng không màn hình nào gọi** (5W-F08, F08 =
 * 38/75 trong biên bản audit): đóng lớp, tạm ngưng lớp, ghi phòng sinh hoạt đều là
 * việc `docs/11` §3 liệt kê là bắt buộc, mà trên thực tế **không làm được**. Đợt
 * M02-B đưa nó vào dùng, và chuyển nó về `features/classes` cho đúng ranh giới.
 *
 * Ba chốt chặn, theo đúng thứ tự:
 *   1. `assertClassWrite` — cửa vào (ẩn nút không phải authorization, AGENTS §5).
 *   2. Năm học phải còn ghi được (BR-M02-N09) — **kiểm ở đây, không tin giao diện**.
 *      Giao diện có ẩn thẻ "Cài đặt lớp" ở năm đã đóng, nhưng gọi thẳng action thì
 *      không đi qua giao diện.
 *   3. `.select("id")` — RLS chặn `update` bằng cách trả **0 dòng, không lỗi**
 *      (SW-04). Thiếu dòng này thì người ngoài nhóm quyền bấm Lưu và nhận "đã lưu".
 */
export async function updateClass(input: UpdateClassInput): Promise<ClassActionResult<{ status: string }>> {
  const actor = await classRouteContext();
  try {
    assertClassWrite(actor);
    const parsed = updateClassSchema.parse(input);
    const supabase = await createClient();

    const { data: classRow, error: classError } = await supabase
      .from("classes")
      .select("id, academic_years(status)")
      .eq("id", parsed.id)
      .maybeSingle();
    if (classError || !classRow) throw new AppError("RESOURCE_NOT_FOUND");
    const yearStatus = (classRow as unknown as { academic_years: { status: string } | null })
      .academic_years?.status;
    if (!isAcademicYearWritable(yearStatus)) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Năm học của lớp này đã đóng.",
        failed: "year_closed",
      };
    }

    const { data, error } = await supabase
      .from("classes")
      .update({
        status: parsed.status,
        meeting_location: parsed.meetingLocation || null,
        notes: parsed.notes || null,
        updated_by: actor.profileId,
      })
      .eq("id", parsed.id)
      .select("id")
      .maybeSingle();
    if (error) throw new AppError("VALIDATION_ERROR");
    if (!data) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Không có dòng nào được cập nhật.",
        failed: "no_change",
      };
    }

    revalidatePath("/classes");
    revalidatePath(`/classes/${parsed.id}`);
    return { ok: true, data: { status: parsed.status } };
  } catch (error) {
    return failure(error, failedFromAppError(error));
  }
}

function failedFromAppError(error: unknown): ClassFailedCode {
  if (!(error instanceof AppError)) return "invalid";
  switch (error.code) {
    case "FORBIDDEN":
      return "forbidden";
    case "RESOURCE_NOT_FOUND":
      return "not_found";
    default:
      return "invalid";
  }
}

/**
 * Adapter cho `<form action={…}>` qua `useActionState`.
 *
 * 🔴 **Không dùng `redirect()`** — kể cả khi đích là một route khác. D-114 (nợ #16)
 * ghi lại kết quả đo của M02-A: `redirect()` về **chính route đang đứng** làm Next
 * 15.5 đổi thanh địa chỉ rồi bỏ luôn lượt dựng lại trang, `<main>` trắng vĩnh viễn,
 * log sạch trơn. Biểu mẫu này nằm trên `/classes/[classId]` và phải quay về chính
 * nó, tức đúng vào cái bẫy đó. `useActionState` giữ được điều D-61 thật sự đòi (mọi
 * thao tác ghi phải nói ra kết quả) **và** giữ `<form action={…}>` thật nên biểu mẫu
 * vẫn chạy khi chưa có JavaScript (09 §11).
 */
export async function updateClassFormAction(
  _previous: ClassFeedback | null,
  formData: FormData,
): Promise<ClassFeedback> {
  const result = await updateClass({
    id: String(formData.get("classId") ?? ""),
    status: String(formData.get("status") ?? ""),
    meetingLocation: String(formData.get("meetingLocation") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  } as unknown as UpdateClassInput);
  return result.ok ? classSavedFeedback(classStatusLabel(result.data.status)) : classFailureFeedback(result.failed);
}
