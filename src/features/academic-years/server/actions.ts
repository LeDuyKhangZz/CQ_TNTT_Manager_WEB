"use server";

import { addYears, format } from "date-fns";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  academicYearIdSchema,
  academicYearInputSchema,
  archiveAcademicYearSchema,
  attendanceSettingsSchema,
  closeAcademicYearSchema,
  semesterMilestoneSchema,
  type AcademicYearInput,
  type AttendanceSettingsInput,
  type CloseAcademicYearInput,
  type SemesterMilestoneInput,
} from "../schemas";
import {
  doneFeedback,
  failureFeedback,
  generationFeedback,
  openWorkFeedback,
  type AdminFailedCode,
  type AdminFeedback,
} from "../admin-feedback";
import {
  classifyAcademicYearDbError,
  parseGenerateClassesResult,
  parseOpenWorkFromMessage,
  type GenerateClassesResult,
} from "../db-errors";
import {
  createYearValuesFromForm,
  CREATE_YEAR_INITIAL_STATE,
  type CreateYearFormState,
} from "../create-year-form-state";
import { academicYearRouteContext, assertAcademicYearAdmin } from "./permissions";

export type AcademicActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string; failed: AdminFailedCode };

/**
 * 🔴 Bản cũ gán **mọi** lỗi không phải `AppError` thành `CONFLICT` (5W-F01), nên
 * một lỗi Zod ("Ngày kết thúc phải sau ngày bắt đầu") hiện ra cho người dùng
 * thành "Thao tác bị xung đột. Vui lòng thử lại." — vừa sai vừa dẫn họ đi thử
 * lại đúng thứ vừa hỏng. Zod nay được nhận diện riêng và **giữ nguyên câu tiếng
 * Việt đã viết trong schema**.
 */
function failure(error: unknown, failed: AdminFailedCode = "invalid"): AcademicActionResult<never> {
  if (error instanceof AppError) {
    return { ok: false, code: error.code, message: error.message, failed };
  }
  if (error instanceof ZodError) {
    const first = error.issues[0]?.message ?? "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
    return { ok: false, code: "VALIDATION_ERROR", message: first, failed: "invalid" };
  }
  return {
    ok: false,
    code: "CONFLICT",
    message: "Không thể lưu dữ liệu năm học. Vui lòng thử lại.",
    failed: "invalid",
  };
}

export async function createAcademicYear(
  input: AcademicYearInput,
): Promise<AcademicActionResult<{ id: string }>> {
  const actor = await academicYearRouteContext();
  try {
    assertAcademicYearAdmin(actor);
    const parsed = academicYearInputSchema.parse(input);
    const supabase = await createClient();
    const retentionUntil = format(addYears(new Date(`${parsed.endDate}T00:00:00Z`), 5), "yyyy-MM-dd");
    const { data, error } = await supabase.from("academic_years").insert({
      code: parsed.code,
      name: parsed.name,
      start_date: parsed.startDate,
      end_date: parsed.endDate,
      // D-71 / D-116 — để trống được; `null` nghĩa là "chưa khai báo mốc học kỳ 1"
      // và hệ thống không cảnh báo gì cho lớp Dự trưởng.
      semester_1_end_date: parsed.semester1EndDate,
      retention_until: retentionUntil,
      top5_enabled: parsed.top5Enabled,
      attendance_lock_days: parsed.attendanceLockDays,
      attendance_edit_lease_minutes: parsed.attendanceEditLeaseMinutes,
      status: "draft",
      updated_by: actor.profileId,
    }).select("id").single();
    if (error || !data) {
      const classified = classifyAcademicYearDbError(error ?? {});
      throw new AppError(
        classified.appCode,
        classified.failed === "year_code_taken"
          ? `Mã năm học ${parsed.code} đã tồn tại. Mỗi năm học chỉ có một mã.`
          : undefined,
      );
    }
    return { ok: true, data: { id: (data as { id: string }).id } };
  } catch (error) {
    // `failed` lấy lại từ chính lỗi vừa phân loại: `AppError` không mang theo
    // khoá câu chữ, nên suy ngược từ mã ổn định.
    return failure(error, failedFromAppError(error));
  }
}

function failedFromAppError(error: unknown): AdminFailedCode {
  if (!(error instanceof AppError)) return "invalid";
  switch (error.code) {
    case "FORBIDDEN":
      return "forbidden";
    case "RESOURCE_NOT_FOUND":
      return "not_found";
    case "CONFLICT":
      return "year_code_taken";
    case "REFERENCE_DATA_MISSING":
      return "reference_data_missing";
    default:
      return "invalid";
  }
}

export async function setCurrentAcademicYear(input: string): Promise<AcademicActionResult> {
  const actor = await academicYearRouteContext();
  try {
    assertAcademicYearAdmin(actor);
    const academicYearId = academicYearIdSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.rpc("set_current_academic_year", {
      target_academic_year_id: academicYearId,
    });
    if (error) {
      const classified = classifyAcademicYearDbError(error);
      throw new AppError(classified.appCode);
    }
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, failedFromAppError(error));
  }
}

/**
 * TB-F02 — sinh cơ cấu lớp chuẩn.
 *
 * Đây là luồng đã gây sự cố production (5W-F02). Hai thay đổi cốt lõi nằm ở phía
 * cơ sở dữ liệu (ném lỗi khi thiếu danh mục, chặn năm đã đóng); phần của tầng này
 * là **không được nuốt kết quả nữa**: trả về đủ `inserted`/`expected` để giao
 * diện phân biệt "vừa tạo đủ" với "đã có sẵn từ trước", và coi một hình dạng dữ
 * liệu lạ là **thất bại**, không phải số 0.
 */
export async function generateDefaultClasses(
  input: string,
): Promise<AcademicActionResult<GenerateClassesResult>> {
  const actor = await academicYearRouteContext();
  try {
    assertAcademicYearAdmin(actor);
    const academicYearId = academicYearIdSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("generate_default_classes", {
      target_academic_year_id: academicYearId,
    });
    if (error) {
      const classified = classifyAcademicYearDbError(error);
      throw new AppError(classified.appCode);
    }
    const result = parseGenerateClassesResult(data);
    if (!result) throw new AppError("CONFLICT");
    revalidatePath("/classes");
    return { ok: true, data: result };
  } catch (error) {
    return failure(error, failedFromAppError(error));
  }
}

/**
 * **D-71 / D-116** — sửa mốc kết thúc học kỳ 1 của một năm học đã tồn tại.
 *
 * Vì sao có action riêng thay vì nhét vào `updateAttendanceSettings`: hai thứ này
 * trả lời hai câu hỏi khác nhau (*"khoá điểm danh sau bao nhiêu ngày"* so với
 * *"học kỳ 1 kết thúc ngày nào"*), và cấu hình điểm danh chỉ áp cho **năm hiện
 * hành** trong khi mốc HK1 phải sửa được cho cả **năm nháp**. Gộp lại là buộc người
 * dùng lưu nhầm sáu ô để đổi một ô.
 *
 * `.select("id")` cùng lý do với `updateAttendanceSettings`: RLS chặn `update` bằng
 * cách trả 0 dòng, không lỗi (SW-04).
 */
export async function updateSemesterMilestone(
  input: SemesterMilestoneInput,
): Promise<AcademicActionResult> {
  const actor = await academicYearRouteContext();
  try {
    assertAcademicYearAdmin(actor);
    const parsed = semesterMilestoneSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("academic_years")
      .update({
        semester_1_end_date: parsed.semester1EndDate,
        updated_by: actor.profileId,
      })
      .eq("id", parsed.academicYearId)
      .select("id")
      .maybeSingle();
    if (error) {
      const classified = classifyAcademicYearDbError(error);
      throw new AppError(classified.appCode);
    }
    if (!data) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Không có dòng nào được cập nhật.",
        failed: "no_change",
      };
    }
    revalidatePath("/classes");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, failedFromAppError(error));
  }
}

/**
 * **I7 / TB-F09 / D-73** — chốt sổ năm học.
 *
 * 5W-F09: `docs/03` WF-16 mô tả sáu bước chốt sổ cuối năm mà hệ thống **chưa cài
 * bước nào**. Năm học chỉ rơi sang `closed` như tác dụng phụ của
 * `set_current_academic_year`, nên không ai từng thấy một màn hình nói "năm học này
 * đã chốt sổ", không đối chiếu việc còn dở, không nhập lý do, không có dấu thời gian.
 *
 * 🔴 `force` **không nhận từ biểu mẫu**, mà suy ra từ việc người dùng có ghi lý do
 * hay không. Lý do: cơ sở dữ liệu là chỗ duy nhất biết còn bao nhiêu việc tồn đọng
 * **vào đúng thời điểm bấm nút** (nó đếm sau khi khoá dòng). Nhận `force` từ client
 * là để giao diện tự quyết một điều nó không có đủ thông tin để quyết.
 *   · không lý do  ⇒ `force = false` ⇒ còn việc dở thì RPC từ chối và **trả về con
 *     số thật** để trang nói ra;
 *   · có lý do     ⇒ `force = true`  ⇒ chốt sổ và lưu lý do.
 */
export async function closeAcademicYear(
  input: CloseAcademicYearInput,
): Promise<AcademicActionResult<{ forced: boolean }>> {
  const actor = await academicYearRouteContext();
  try {
    assertAcademicYearAdmin(actor);
    const parsed = closeAcademicYearSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("close_academic_year", {
      p_year_id: parsed.academicYearId,
      p_confirm_code: parsed.confirmCode,
      p_force: parsed.reason.length > 0,
      p_reason: parsed.reason.length > 0 ? parsed.reason : undefined,
    });
    if (error) {
      const classified = classifyAcademicYearDbError(error);
      // 🔴 Trả THẲNG, không đi qua `AppError`: `AppError` chỉ mang mã ổn định
      // (`CONFLICT`) chứ không mang khoá câu chữ, nên `failedFromAppError` sẽ suy
      // ngược `CONFLICT` thành "mã năm học đã tồn tại" — một câu vô nghĩa ở đây.
      // Con số của bảng kiểm đi kèm chính lỗi từ chối (RPC đếm sau khi khoá dòng).
      if (classified.failed === "year_has_open_work") {
        return {
          ok: false,
          code: classified.appCode,
          message: openWorkFeedback(parseOpenWorkFromMessage(error.message)).text,
          failed: classified.failed,
        };
      }
      return {
        ok: false,
        code: classified.appCode,
        message: failureFeedback(classified.failed).text,
        failed: classified.failed,
      };
    }
    revalidatePath("/classes");
    revalidatePath("/admin");
    const forced = Boolean((data as { forced?: boolean } | null)?.forced);
    return { ok: true, data: { forced } };
  } catch (error) {
    return failure(error, failedFromAppError(error));
  }
}

/** **D-120 / BR-M02-N07** — lưu trữ năm đã đóng. Hạn giữ dữ liệu do cơ sở dữ liệu kiểm. */
export async function archiveAcademicYear(input: string): Promise<AcademicActionResult> {
  const actor = await academicYearRouteContext();
  try {
    assertAcademicYearAdmin(actor);
    const parsed = archiveAcademicYearSchema.parse({ academicYearId: input });
    const supabase = await createClient();
    const { error } = await supabase.rpc("archive_academic_year", {
      p_year_id: parsed.academicYearId,
    });
    if (error) {
      // Cùng lý do với `closeAcademicYear`: giữ nguyên khoá câu chữ đã phân loại.
      const classified = classifyAcademicYearDbError(error);
      return {
        ok: false,
        code: classified.appCode,
        message: failureFeedback(classified.failed).text,
        failed: classified.failed,
      };
    }
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, failedFromAppError(error));
  }
}

export async function updateAttendanceSettings(
  input: AttendanceSettingsInput,
): Promise<AcademicActionResult> {
  const actor = await academicYearRouteContext();
  try {
    assertAcademicYearAdmin(actor);
    const parsed = attendanceSettingsSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("academic_years")
      .update({
        attendance_lock_days: parsed.attendanceLockDays,
        attendance_edit_lease_minutes: parsed.attendanceEditLeaseMinutes,
        attendance_warning_consecutive_absences: parsed.warningConsecutiveAbsences,
        attendance_warning_consecutive_sundays: parsed.warningConsecutiveSundays,
        // UI nhập phần trăm cho dễ đọc; DB lưu tỷ lệ 0..1.
        attendance_warning_rate_threshold: parsed.warningRatePercent / 100,
        updated_by: actor.profileId,
      })
      .eq("id", parsed.academicYearId)
      // Cùng lý do với `updateClass`: không có dòng nào đổi thì đây là thất bại.
      .select("id")
      .maybeSingle();
    if (error) {
      const classified = classifyAcademicYearDbError(error);
      throw new AppError(classified.appCode);
    }
    if (!data) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Không có dòng nào được cập nhật.",
        failed: "no_change",
      };
    }
    revalidatePath("/attendance");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, failedFromAppError(error));
  }
}

// ---------------------------------------------------------------------------
// Adapter cho `<form action={…}>` — TB-F12 / AC-M02-04.
//
// 🔴 **Cả bốn đều đi `useActionState`, KHÔNG dùng `redirect()`** — và đây là một
// lỗi đo được, không phải sở thích. D-61 chỉ định "chuyển hướng kèm mã kết quả"
// cho biểu mẫu ngắn, nhưng cả bốn biểu mẫu này đều nằm trên `/admin` và phải
// chuyển hướng về **chính route đang đứng**. Next 15.5 gặp `redirect()` về đúng
// route hiện tại thì đổi thanh địa chỉ rồi **bỏ luôn lượt dựng lại trang**:
// `<main>` trắng vĩnh viễn, không lỗi máy chủ, không lỗi trình duyệt, log sạch
// trơn. Đo ở đợt M02-A trên cùng một bản build:
//     · chuyển hướng sang route KHÁC   → dựng xong sau 749 ms
//     · chuyển hướng về chính `/admin` → treo quá 120 giây
//     · thêm `RedirectType.push`       → 1 279 ms một lượt, rồi lại treo ở lượt sau
// Các module trước không vấp vì chúng luôn chuyển hướng sang **trang khác**
// (`/staff` → `/staff/<id>`).
//
// `useActionState` giữ được điều D-61 thật sự đòi (mọi thao tác ghi phải nói ra
// kết quả) **và** giữ được ràng buộc 09 §11 (biểu mẫu chạy khi chưa có JS): React
// gửi thẳng tới Server Action rồi dựng lại trang bằng state trả về.
//
// Guard vẫn theo D-96 — `academicYearRouteContext()` nằm ngoài `try` trong từng
// hàm nghiệp vụ phía trên, nên `redirect()` về `/login` của người hết phiên vẫn
// không bị `catch` nuốt.
// ---------------------------------------------------------------------------

export async function updateAttendanceSettingsFormAction(
  _previous: AdminFeedback | null,
  formData: FormData,
): Promise<AdminFeedback> {
  const result = await updateAttendanceSettings({
    academicYearId: String(formData.get("academicYearId") ?? ""),
    attendanceLockDays: Number(formData.get("attendanceLockDays") ?? 3),
    attendanceEditLeaseMinutes: Number(formData.get("attendanceEditLeaseMinutes") ?? 15),
    warningConsecutiveAbsences: Number(formData.get("warningConsecutiveAbsences") ?? 3),
    warningConsecutiveSundays: Number(formData.get("warningConsecutiveSundays") ?? 3),
    warningRatePercent: Number(formData.get("warningRatePercent") ?? 80),
  });
  return result.ok ? doneFeedback("settings_saved") : failureFeedback(result.failed);
}

export async function setCurrentAcademicYearFormAction(
  _previous: AdminFeedback | null,
  formData: FormData,
): Promise<AdminFeedback> {
  const result = await setCurrentAcademicYear(String(formData.get("academicYearId") ?? ""));
  return result.ok ? doneFeedback("current_set") : failureFeedback(result.failed);
}

export async function updateSemesterMilestoneFormAction(
  _previous: AdminFeedback | null,
  formData: FormData,
): Promise<AdminFeedback> {
  const result = await updateSemesterMilestone({
    academicYearId: String(formData.get("academicYearId") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    semester1EndDate: String(formData.get("semester1EndDate") ?? ""),
  } as unknown as SemesterMilestoneInput);
  // Xoá mốc cũng là một kết quả cần nói ra, và nó khác hẳn "đã lưu ngày X".
  if (!result.ok) return failureFeedback(result.failed);
  return doneFeedback(
    String(formData.get("semester1EndDate") ?? "") ? "milestone_saved" : "milestone_cleared",
  );
}

/** Refresh dependent class views only after the form has received feedback. */
export async function refreshSemesterMilestoneViews(academicYearId: string): Promise<void> {
  const actor = await academicYearRouteContext();
  assertAcademicYearAdmin(actor);
  academicYearIdSchema.parse(academicYearId);
  revalidatePath("/classes");
}

/**
 * I7 — chốt sổ. Câu từ chối *"còn việc tồn đọng"* mang theo **con số thật** nên nó
 * đi bằng `result.message`, không qua từ điển mã lỗi.
 */
export async function closeAcademicYearFormAction(
  _previous: AdminFeedback | null,
  formData: FormData,
): Promise<AdminFeedback> {
  const result = await closeAcademicYear({
    academicYearId: String(formData.get("academicYearId") ?? ""),
    confirmCode: String(formData.get("confirmCode") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  } as unknown as CloseAcademicYearInput);
  if (!result.ok) {
    return result.failed === "year_has_open_work"
      ? { tone: "danger", text: result.message }
      : failureFeedback(result.failed);
  }
  return doneFeedback(result.data.forced ? "year_closed_forced" : "year_closed");
}

export async function archiveAcademicYearFormAction(
  _previous: AdminFeedback | null,
  formData: FormData,
): Promise<AdminFeedback> {
  const result = await archiveAcademicYear(String(formData.get("academicYearId") ?? ""));
  return result.ok ? doneFeedback("year_archived") : failureFeedback(result.failed);
}

export async function generateDefaultClassesFormAction(
  _previous: AdminFeedback | null,
  formData: FormData,
): Promise<AdminFeedback> {
  const result = await generateDefaultClasses(String(formData.get("academicYearId") ?? ""));
  return result.ok
    ? generationFeedback(result.data.inserted, result.data.expected)
    : failureFeedback(result.failed);
}

/**
 * Biểu mẫu dài (7 ô): lỗi thì giữ nguyên dữ liệu đã gõ, thành công thì xoá trắng
 * biểu mẫu và báo bước tiếp theo (D-61).
 */
export async function createAcademicYearFormAction(
  _previous: CreateYearFormState,
  formData: FormData,
): Promise<CreateYearFormState> {
  const values = createYearValuesFromForm(formData);
  const result = await createAcademicYear({
    code: values.code,
    name: values.name,
    startDate: values.startDate,
    endDate: values.endDate,
    semester1EndDate: values.semester1EndDate,
    top5Enabled: values.top5Enabled,
    attendanceLockDays: Number(values.attendanceLockDays || 3),
    attendanceEditLeaseMinutes: Number(values.attendanceEditLeaseMinutes || 15),
  });
  if (!result.ok) return { status: "error", message: result.message, values };
  return {
    status: "success",
    message: doneFeedback("year_created").text,
    values: CREATE_YEAR_INITIAL_STATE.values,
  };
}
