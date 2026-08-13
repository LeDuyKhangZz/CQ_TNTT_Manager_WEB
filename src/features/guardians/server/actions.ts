"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { assertStudentWrite, studentRouteContext } from "@/features/students/server/permissions";
import { findGuardianDuplicateCandidates } from "@/features/students/server/queries";
import {
  createGuardianValuesFromForm,
  EMPTY_CREATE_GUARDIAN_VALUES,
  type CreateGuardianFormState,
  type GuardianDuplicate,
} from "@/features/students/create-student-form-state";
import {
  guardianChangedFeedback,
  guardianCreatedFeedback,
  guardianSavedFeedback,
  studentFailureFeedback,
  type StudentFailedCode,
  type StudentFeedback,
} from "@/features/students/student-feedback";
import {
  changeGuardianSchema,
  type ChangeGuardianInput,
} from "@/features/students/schemas";
import {
  createGuardianSchema,
  updateGuardianSchema,
  type CreateGuardianInput,
  type UpdateGuardianInput,
} from "../schemas";

export type GuardianActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string; failed: StudentFailedCode };

function failure(error: unknown, failed: StudentFailedCode = "invalid"): GuardianActionResult<never> {
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
    message: "Không thể lưu dữ liệu phụ huynh. Vui lòng thử lại.",
    failed: "invalid",
  };
}

function failedFromAppError(error: unknown, fallback: StudentFailedCode): StudentFailedCode {
  if (!(error instanceof AppError)) return fallback;
  if (error.code === "FORBIDDEN") return "forbidden";
  if (error.code === "RESOURCE_NOT_FOUND") return "not_found";
  return fallback;
}

export type CreateGuardianResult =
  | { ok: true; data: { id: string; guardianName: string } }
  | { ok: false; code: AppErrorCode; message: string; failed: StudentFailedCode }
  /** BR-M03-N09 — trạng thái chờ người dùng quyết, không phải một lỗi. */
  | { ok: false; duplicates: GuardianDuplicate[] };

/**
 * BR-M03-N09 / D-124 — tạo hồ sơ người giám hộ.
 *
 * Hai điều đổi so với M03-A:
 *
 *   1. **Dò trùng trước khi ghi.** Đây không phải chuyện gọn gàng mà là chuyện
 *      **phân quyền**: một gia đình bị nhập thành hai bản ghi giám hộ mà chỉ một
 *      bản có tài khoản ⇒ phụ huynh đăng nhập chỉ thấy **một phần số con của
 *      mình** (`app.own_student_ids()` nối theo `guardians.profile_id`), và
 *      không có chức năng gộp nào để chữa (5W-F01/F02).
 *   2. **Ghi qua `create_guardian_profile`** thay vì `insert` thẳng. Vai trò
 *      ngành ghi được nhưng ĐỌC LẠI không được — người giám hộ mới chưa gắn với
 *      em nào nên chưa nằm trong `app.sector_guardian_ids()` — nên
 *      `insert … returning` sẽ trả 0 dòng và báo "thất bại" trên một bản ghi đã
 *      được ghi. Hàm trả thẳng id + tên.
 */
export async function createGuardian(input: CreateGuardianInput): Promise<CreateGuardianResult> {
  const actor = await studentRouteContext();
  try {
    assertStudentWrite(actor);
    const parsed = createGuardianSchema.parse(input);

    if (!parsed.confirmDuplicate) {
      const duplicates = await findGuardianDuplicateCandidates({
        fullName: parsed.fullName,
        phone: parsed.phone,
      });
      if (duplicates.length > 0) return { ok: false, duplicates };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_guardian_profile", {
      p_full_name: parsed.fullName,
      p_phone: parsed.phone,
      p_address: parsed.address ?? undefined,
    });
    const created = (data ?? [])[0];
    if (error || !created) {
      if (error?.code === "42501") throw new AppError("FORBIDDEN");
      throw new AppError(error?.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR");
    }
    revalidatePath("/students");
    return { ok: true, data: { id: created.id, guardianName: created.full_name } };
  } catch (error) {
    return failure(error, failedFromAppError(error, "invalid"));
  }
}

/**
 * **TB-F12 / BR-M03-N15 — M03-C: hàm này CUỐI CÙNG cũng có màn hình gọi.**
 *
 * Đây là lỗi F12, luồng **31/75 — thấp nhất module**: `updateGuardian` viết xong
 * từ Phase 2 mà `src/features/guardians/` không có `queries.ts`, không có
 * component, không route nào. Hệ quả nghiệp vụ: nhập sai số điện thoại phụ huynh
 * thì **không có nơi nào sửa**, mà đó là số gọi khi em ốm giữa buổi học.
 *
 * Hệ quả kỹ thuật thì tinh vi hơn và đã được ghi ở M03-A: không màn hình nào gọi
 * nghĩa là **không ai phát hiện ra nó trả `ok:true` khi RLS chặn** suốt hai
 * Phase. `.select()` đã vá ở M03-A; đợt này chỉ thêm chỗ gọi và một mã lỗi.
 */
export async function updateGuardian(
  input: UpdateGuardianInput,
): Promise<GuardianActionResult<{ guardianName: string }>> {
  const actor = await studentRouteContext();
  try {
    assertStudentWrite(actor);
    const parsed = updateGuardianSchema.parse(input);
    const { id, ...changes } = parsed;
    const payload = {
      ...(changes.fullName !== undefined ? { full_name: changes.fullName } : {}),
      ...(changes.phone !== undefined ? { phone: changes.phone } : {}),
      ...(changes.address !== undefined ? { address: changes.address } : {}),
      ...(changes.status !== undefined ? { status: changes.status } : {}),
      updated_by: actor.profileId,
    };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("guardians")
      .update(payload)
      .eq("id", id)
      .select("full_name")
      .maybeSingle();
    if (error) {
      // BR-M03-N17 — lưới an toàn ở cơ sở dữ liệu nói ra bằng tiếng Việt.
      if ((error.message ?? "").includes("GUARDIAN_HAS_ACTIVE_STUDENTS")) {
        return {
          ok: false,
          code: "VALIDATION_ERROR",
          message: "",
          failed: "guardian_has_students",
        };
      }
      throw new AppError(error.code === "42501" ? "FORBIDDEN" : "VALIDATION_ERROR");
    }
    if (!data) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Không có dòng nào được cập nhật.",
        failed: "no_change",
      };
    }
    revalidatePath("/students");
    return { ok: true, data: { guardianName: data.full_name } };
  } catch (error) {
    return failure(error, failedFromAppError(error, "invalid"));
  }
}

/**
 * 🔴 **TB-F12 / BR-M03-N16 — thao tác có hệ quả PHÂN QUYỀN tức thì.**
 *
 * `students.guardian_id` là đường nối duy nhất giữa một em và tài khoản phụ
 * huynh: `app.own_student_ids()` (`20260721000200:101-106`) nối theo
 * `guardians.profile_id`. Đổi ô này là **phụ huynh cũ mất quyền đọc và phụ huynh
 * mới có quyền đọc, ngay lập tức** — không có màn hình nào khác trong hệ thống
 * làm điều đó, kể cả màn hình tài khoản của M01.
 *
 * Vì thế nó là một hàm RIÊNG chứ không phải một ô trong `updateStudent` (vốn đã
 * nhận `guardianId` từ Phase 2 nhưng chưa biểu mẫu nào gửi): một cửa vào riêng,
 * một hộp xác nhận riêng nêu **đủ ba cái tên**, một câu phản hồi riêng. Đi chung
 * đường với "sửa số điện thoại" là để nó trôi qua mà không ai xác nhận.
 *
 * Tên phụ huynh mới đọc qua cửa sổ hẹp `list_guardian_options` (D-124) — nguồn
 * duy nhất mà **cả** vai trò xứ đoàn lẫn vai trò ngành cùng đọc được.
 */
export async function changeStudentGuardian(
  input: ChangeGuardianInput,
): Promise<GuardianActionResult<{ studentName: string; guardianName: string }>> {
  const actor = await studentRouteContext();
  try {
    assertStudentWrite(actor);
    const parsed = changeGuardianSchema.parse(input);
    const supabase = await createClient();

    const { data: options } = await supabase.rpc("list_guardian_options", {});
    const target = (options ?? []).find((item) => item.id === parsed.guardianId);
    if (!target) throw new AppError("RESOURCE_NOT_FOUND");

    const { data, error } = await supabase
      .from("students")
      .update({ guardian_id: parsed.guardianId, updated_by: actor.profileId })
      .eq("id", parsed.studentId)
      .select("saint_name, full_name")
      .maybeSingle();
    if (error) throw new AppError(error.code === "42501" ? "FORBIDDEN" : "VALIDATION_ERROR");
    if (!data) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Không có dòng nào được cập nhật.",
        failed: "no_change",
      };
    }

    revalidatePath("/students");
    revalidatePath(`/students/${parsed.studentId}`);
    return {
      ok: true,
      data: {
        studentName: [data.saint_name, data.full_name].filter(Boolean).join(" ").trim(),
        guardianName: target.full_name,
      },
    };
  } catch (error) {
    return failure(error, failedFromAppError(error, "invalid"));
  }
}

export async function createGuardianFormAction(
  _previous: CreateGuardianFormState,
  formData: FormData,
): Promise<CreateGuardianFormState> {
  const values = createGuardianValuesFromForm(formData);
  const result = await createGuardian({
    fullName: values.fullName,
    phone: values.phone,
    address: values.address,
    status: "active",
    confirmDuplicate: formData.get("confirmDuplicate") === "1",
  } as CreateGuardianInput);

  if (!result.ok) {
    if ("duplicates" in result) {
      return { feedback: null, duplicates: result.duplicates, values };
    }
    return {
      feedback: studentFailureFeedback(result.failed, result.message),
      duplicates: [],
      values,
    };
  }
  return {
    feedback: guardianCreatedFeedback(result.data.guardianName),
    duplicates: [],
    values: EMPTY_CREATE_GUARDIAN_VALUES,
  };
}

/**
 * TB-F12 — **MỘT adapter cho cả hai thao tác** của khối người giám hộ, phân
 * nhánh bằng ô ẩn `intent`. Cùng khuôn và cùng lý do với `enrollmentRowFormAction`
 * của M03-A: `useActionState` giữ lại kết quả lượt trước, nên hai state riêng sẽ
 * để câu *"Đã lưu thông tin liên lạc của …"* đứng nguyên sau khi người dùng vừa
 * **đổi sang một phụ huynh khác** — nói sai ai đang là người giám hộ của em.
 */
export async function guardianPanelFormAction(
  _previous: StudentFeedback | null,
  formData: FormData,
): Promise<StudentFeedback> {
  if (String(formData.get("intent") ?? "") === "change") {
    const result = await changeStudentGuardian({
      studentId: String(formData.get("studentId") ?? ""),
      guardianId: String(formData.get("guardianId") ?? ""),
    } as ChangeGuardianInput);
    return result.ok
      ? guardianChangedFeedback(result.data.studentName, result.data.guardianName)
      : studentFailureFeedback(result.failed, result.message);
  }

  const result = await updateGuardian({
    id: String(formData.get("guardianId") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    status: String(formData.get("status") ?? "active"),
  } as unknown as UpdateGuardianInput);
  return result.ok
    ? guardianSavedFeedback(result.data.guardianName)
    : studentFailureFeedback(result.failed, result.message);
}
