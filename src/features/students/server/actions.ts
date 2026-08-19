"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { todayVi } from "@/lib/dates";
import { findStudentDuplicates, type DuplicateMatch } from "@/lib/students/duplicate";
import { enrollStudent } from "@/features/enrollments/server/actions";
import type { EnrollStudentInput } from "@/features/enrollments/schemas";
import {
  assertSacramentDelete,
  assertSensitiveWrite,
  assertStudentWrite,
  canArchiveStudent,
  studentRouteContext,
} from "./permissions";
import { findStudentDuplicateCandidates } from "./queries";
import { sacramentLabel } from "../student-status";
import { isClosingStudentStatus, studentStatusSavedText } from "../student-lifecycle";
import {
  healthSavedFeedback,
  sacramentDeletedFeedback,
  sacramentSavedFeedback,
  studentCreatedFeedback,
  studentCreatedUnassignedFeedback,
  studentFailureFeedback,
  studentSavedFeedback,
  type StudentFailedCode,
  type StudentFeedback,
} from "../student-feedback";
import {
  createStudentValuesFromForm,
  EMPTY_CREATE_STUDENT_VALUES,
  type CreateStudentFormState,
} from "../create-student-form-state";
import {
  createStudentSchema,
  deleteSacramentSchema,
  healthProfileSchema,
  setStudentStatusSchema,
  updateStudentSchema,
  upsertSacramentSchema,
  type CreateStudentInput,
  type DeleteSacramentInput,
  type HealthProfileInput,
  type SetStudentStatusInput,
  type UpdateStudentInput,
  type UpsertSacramentInput,
} from "../schemas";

export type StudentActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string; failed: StudentFailedCode };

function failure(error: unknown, failed: StudentFailedCode = "invalid"): StudentActionResult<never> {
  if (error instanceof AppError) {
    return { ok: false, code: error.code, message: error.message, failed };
  }
  // Cùng vá gốc với M02-A: bản cũ gán **mọi** lỗi lạ thành `CONFLICT`, nên lỗi Zod
  // "Vui lòng nhập tên thánh." hiện ra thành "Thao tác bị xung đột, vui lòng thử
  // lại" — vừa sai vừa dẫn người dùng đi thử lại đúng thứ vừa hỏng.
  if (error instanceof ZodError) {
    const first = error.issues[0]?.message ?? "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
    return { ok: false, code: "VALIDATION_ERROR", message: first, failed: "invalid" };
  }
  return {
    ok: false,
    code: "CONFLICT",
    message: "Không thể lưu dữ liệu thiếu nhi. Vui lòng thử lại.",
    failed: "invalid",
  };
}

function failedFromAppError(error: unknown, fallback: StudentFailedCode): StudentFailedCode {
  if (!(error instanceof AppError)) return fallback;
  switch (error.code) {
    case "FORBIDDEN":
      return "forbidden";
    case "RESOURCE_NOT_FOUND":
      return "not_found";
    default:
      return fallback;
  }
}

/**
 * Cùng phép ánh xạ, nhưng `FORBIDDEN` ra câu của **sức khoẻ/bí tích**.
 *
 * Cần một hàm riêng vì từ D-63 hai cổng quyền đã tách: một Trưởng ngành sửa
 * được hồ sơ ngay bên cạnh mà không ghi được tab sức khoẻ. Đưa họ câu "việc này
 * dành cho Xứ đoàn trưởng…" chung là nói rằng họ không có quyền gì cả.
 */
function sensitiveFailedFromAppError(error: unknown): StudentFailedCode {
  if (error instanceof AppError && error.code === "FORBIDDEN") return "forbidden_sensitive";
  return failedFromAppError(error, "invalid");
}

function studentLabel(row: { saint_name: string | null; full_name: string } | null): string {
  if (!row) return "thiếu nhi";
  return row.saint_name ? `${row.saint_name} ${row.full_name}` : row.full_name;
}

export type CreateStudentResult =
  | {
      ok: true;
      data: { id: string; studentCode: string; studentName: string; className: string | null };
    }
  | { ok: false; code: AppErrorCode; message: string; failed: StudentFailedCode }
  /**
   * TB-F13 — **không phải một lỗi** mà là một trạng thái chờ người dùng quyết
   * (BR-M03-N08). Tách khỏi nhánh `ok:false` để chỗ gọi không thể nhầm nó với
   * thất bại và in ra một câu đỏ.
   */
  | { ok: false; duplicates: DuplicateMatch[] };

/**
 * TB-F02/F09 + TB-F13 + D-123 — tạo hồ sơ thiếu nhi.
 *
 * Ba điều đổi so với M03-A:
 *
 *   1. **Dò trùng trước khi ghi** (TB-F13). Cảnh báo MỀM: thấy ứng viên trùng
 *      thì dừng lại hỏi, nhưng `confirmDuplicate` là qua ngay — không thêm một
 *      ràng buộc `unique` nào, vì hai em trùng tên là chuyện bình thường ở một
 *      xứ đoàn 900 em (WF-03 bước 4).
 *   2. **Ghi qua `create_student_with_enrollment`** thay vì `insert` thẳng, để
 *      hồ sơ và ghi danh nằm trong **một giao dịch** (D-123). Trước đợt này
 *      WF-03 mô tả một luồng liền mà thực tế phải đi qua ba đến bốn màn hình.
 *   3. Vai trò ngành ghi được (D-63) — nhưng phạm vi "trong ngành mình" do cơ
 *      sở dữ liệu giữ, không phải do danh sách vai trò ở đây.
 */
export async function createStudent(input: CreateStudentInput): Promise<CreateStudentResult> {
  const actor = await studentRouteContext();
  try {
    assertStudentWrite(actor);
    const parsed = createStudentSchema.parse(input);

    if (!parsed.confirmDuplicate) {
      const { candidates, guardianPhone } = await findStudentDuplicateCandidates({
        fullName: parsed.fullName,
        guardianId: parsed.guardianId,
      });
      const duplicates = findStudentDuplicates(
        { fullName: parsed.fullName, dateOfBirth: parsed.dateOfBirth, guardianPhone },
        candidates,
      );
      if (duplicates.length > 0) return { ok: false, duplicates };
    }

    const supabase = await createClient();
    // Tham số có `default null` sinh ra kiểu **tuỳ chọn** ở phía TypeScript, nên
    // ô trống phải gửi `undefined` chứ không phải `null`.
    const { data, error } = await supabase.rpc("create_student_with_enrollment", {
      p_guardian_id: parsed.guardianId,
      p_saint_name: parsed.saintName,
      p_full_name: parsed.fullName,
      p_gender: parsed.gender,
      p_date_of_birth: parsed.dateOfBirth,
      p_patron_feast_date: parsed.patronFeastDate ?? undefined,
      p_address: parsed.address ?? undefined,
      p_phone: parsed.phone ?? undefined,
      p_hardship_flag: parsed.hardshipFlag,
      p_general_notes: parsed.generalNotes ?? undefined,
      p_class_id: parsed.classId ?? undefined,
    });
    const created = (data ?? [])[0];
    if (error || !created) {
      const failed = createFailureCode(error);
      return {
        ok: false,
        code: failed === "not_found" ? "RESOURCE_NOT_FOUND" : "VALIDATION_ERROR",
        // Rỗng để `studentFailureFeedback` dùng câu chuẩn của `failed` — không
        // bao giờ ném thông điệp thô của Postgres lên màn hình người dùng.
        message: "",
        failed,
      };
    }

    revalidatePath("/students");
    if (parsed.classId) {
      revalidatePath("/classes");
      revalidatePath(`/classes/${parsed.classId}`);
    }
    return {
      ok: true,
      data: {
        id: created.student_id,
        studentCode: created.student_code,
        studentName: studentLabel({ saint_name: parsed.saintName, full_name: parsed.fullName }),
        className: created.class_name,
      },
    };
  } catch (error) {
    return failure(error, failedFromAppError(error, "invalid"));
  }
}

/**
 * Lỗi của `create_student_with_enrollment` → mã câu chữ tiếng Việt.
 *
 * `SECTOR_ROLE_NEEDS_CLASS` cố ý **không** thành "bạn không có quyền": người
 * dùng có quyền, họ chỉ chưa chọn lớp. Hai câu dẫn tới hai hành động khác nhau
 * — một câu bảo họ đi tìm người khác, câu kia bảo họ chọn lớp.
 *
 * Nhận dạng bằng thông điệp chứ không bằng `SQLSTATE`, vì `raise exception …
 * using errcode` gói cả ba ca `CLASS_INACTIVE`/`YEAR_NOT_WRITABLE` vào chung
 * `23514`. Hàm RPC là chỗ duy nhất phát ra các chuỗi này nên không có nguy cơ
 * bắt nhầm lỗi của người khác.
 */
function createFailureCode(error: { code?: string; message?: string } | null): StudentFailedCode {
  const message = error?.message ?? "";
  if (message.includes("SECTOR_ROLE_NEEDS_CLASS")) return "needs_class";
  if (message.includes("CLASS_INACTIVE") || message.includes("YEAR_NOT_WRITABLE")) {
    return "class_unavailable";
  }
  if (message.includes("CLASS_NOT_FOUND")) return "not_found";
  if (error?.code === "42501") return "forbidden";
  return "invalid";
}

/**
 * 🔴 `.select("id")` — BR-M03-N11 / SW-04, và đây là chỗ lỗi F05 (C9 = 2) nằm.
 *
 * Bản cũ là `.update(payload).eq("id", id)` **không** kèm `.select()`. PostgREST trả
 * 204 với 0 dòng khi RLS lọc hết, `error === null`, nên mã kết luận **thành công**.
 * Nghĩa là: người không đủ quyền bấm "Lưu thay đổi" và nhận đúng thứ người đủ quyền
 * nhận. Trong mô hình RLS, **quyền bị từ chối biểu hiện dưới dạng 0 dòng, không phải
 * exception** — bài học đã ghi cho luồng *đọc* từ Phase 2 nhưng chưa từng áp cho
 * luồng *ghi* (5W-F05/F08).
 */
export async function updateStudent(
  input: UpdateStudentInput,
): Promise<StudentActionResult<{ studentName: string }>> {
  const actor = await studentRouteContext();
  try {
    assertStudentWrite(actor);
    const parsed = updateStudentSchema.parse(input);
    const { id, ...changes } = parsed;
    const payload = {
      ...(changes.guardianId !== undefined ? { guardian_id: changes.guardianId } : {}),
      ...(changes.saintName !== undefined ? { saint_name: changes.saintName } : {}),
      ...(changes.fullName !== undefined ? { full_name: changes.fullName } : {}),
      ...(changes.gender !== undefined ? { gender: changes.gender } : {}),
      ...(changes.dateOfBirth !== undefined ? { date_of_birth: changes.dateOfBirth } : {}),
      ...(changes.patronFeastDate !== undefined ? { patron_feast_date: changes.patronFeastDate } : {}),
      ...(changes.address !== undefined ? { address: changes.address } : {}),
      ...(changes.phone !== undefined ? { phone: changes.phone } : {}),
      ...(changes.hardshipFlag !== undefined ? { hardship_flag: changes.hardshipFlag } : {}),
      ...(changes.generalNotes !== undefined ? { general_notes: changes.generalNotes } : {}),
      // `status` KHÔNG còn ở đây — TB-F06 tách nó thành `setStudentStatus`.
      updated_by: actor.profileId,
    };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("students")
      .update(payload)
      .eq("id", id)
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
    revalidatePath(`/students/${id}`);
    return { ok: true, data: { studentName: studentLabel(data) } };
  } catch (error) {
    return failure(error, failedFromAppError(error, "invalid"));
  }
}

/**
 * BR-M03-23 — `upsert` trên khoá chính `student_id` là lựa chọn đúng và idempotent.
 * Thêm `.select()` vì `upsert` bị RLS chặn cũng trả 0 dòng, y hệt `update`.
 */
export async function saveHealthProfile(input: HealthProfileInput): Promise<StudentActionResult> {
  const actor = await studentRouteContext();
  try {
    // 🔴 `assertSensitiveWrite`, KHÔNG phải `assertStudentWrite`. D-63 nới quyền
    // ghi **hồ sơ** cho vai trò ngành, nhưng policy `student_health_*` vẫn là
    // `app.can_global_write()` vì Q-M03-02 chưa chốt (đợt M03-C). Dùng chung
    // một cổng là để Trưởng ngành bấm "Lưu" rồi nhận "0 dòng được cập nhật" —
    // đúng loại thất bại M03-A vừa diệt xong.
    assertSensitiveWrite(actor);
    const parsed = healthProfileSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("student_health_profiles")
      .upsert(
        {
          student_id: parsed.studentId,
          allergies: parsed.allergies,
          medical_conditions: parsed.medicalConditions,
          medications: parsed.medications,
          emergency_notes: parsed.emergencyNotes,
          updated_by: actor.profileId,
        },
        { onConflict: "student_id" },
      )
      .select("student_id")
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
    revalidatePath(`/students/${parsed.studentId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, sensitiveFailedFromAppError(error));
  }
}

/**
 * **TB-F08 / AC-F08-01 · AC-F08-02** — thêm **hoặc sửa** một bản ghi bí tích.
 *
 * Trước M03-C chỉ có `createSacrament`: nhập sai ngày rửa tội một lần là **vĩnh
 * viễn** (C1 = 3 của luồng F08), dù `docs/11` §3 đòi `upsertStudentSacrament`
 * ngay từ đầu và cơ sở dữ liệu đã cấp sẵn `grant update` từ
 * `20260716000100:176-179`. Cái thiếu chỉ là một `id` tuỳ chọn và một nút.
 *
 * `insert` và `update` là **hai câu lệnh**, không phải một `upsert`: `upsert`
 * trên bảng này sẽ đụng unique index `(student_id, sacrament_type)` và biến một
 * lượt sửa nhầm loại thành một lượt ghi đè im lặng lên bản ghi khác của cùng em.
 * Nhánh `update` cũng phải neo theo `student_id`, nếu không một `id` bịa ra từ
 * client có thể sửa bản ghi của em khác trong phạm vi người gọi.
 */
export async function upsertSacrament(
  input: UpsertSacramentInput,
): Promise<StudentActionResult<{ label: string }>> {
  const actor = await studentRouteContext();
  try {
    assertSensitiveWrite(actor);
    const parsed = upsertSacramentSchema.parse(input);
    const supabase = await createClient();
    const payload = {
      student_id: parsed.studentId,
      sacrament_type: parsed.sacramentType,
      sacrament_name: parsed.sacramentName,
      sacrament_date: parsed.sacramentDate,
      place: parsed.place,
      registry_number: parsed.registryNumber,
      godparent_name: parsed.godparentName,
      notes: parsed.notes,
      updated_by: actor.profileId,
    };

    const { data, error } = parsed.id
      ? await supabase
          .from("student_sacraments")
          .update(payload)
          .eq("id", parsed.id)
          .eq("student_id", parsed.studentId)
          .select("id")
          .maybeSingle()
      : await supabase.from("student_sacraments").insert(payload).select("id").maybeSingle();

    if (error) {
      // AC-F08-02 — unique index chống trùng loại chạy đúng từ đầu
      // (`20260716000100:101-103`); chỉ là mã `23505` từng bị nuốt nên trải
      // nghiệm là "bấm không có gì xảy ra".
      if (error.code === "23505") {
        return { ok: false, code: "CONFLICT", message: "", failed: "duplicate_sacrament" };
      }
      if (error.code === "42501") throw new AppError("FORBIDDEN");
      throw new AppError("VALIDATION_ERROR");
    }
    if (!data) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "",
        failed: "no_change",
      };
    }
    return {
      ok: true,
      data: { label: sacramentLabel(parsed.sacramentType, parsed.sacramentName) },
    };
  } catch (error) {
    return failure(error, sensitiveFailedFromAppError(error));
  }
}

/**
 * **D-128 / Q-M03-05** — xoá một bản ghi bí tích, chỉ bốn vai trò xứ đoàn.
 *
 * Ca duy nhất cần đến nó là ca không sửa nổi: một bí tích lỡ thêm vào hồ sơ
 * **nhầm em** thì không có đường nào chuyển sang em đúng. `assertSacramentDelete`
 * hẹp hơn `assertSensitiveWrite` một bậc — Giáo lý viên vừa được D-127 trao
 * quyền ghi vẫn không xoá được, và câu từ chối nói đúng điều đó.
 *
 * `.select()` như mọi thao tác ghi khác của module: `delete` bị RLS chặn cũng
 * trả 0 dòng, `error === null` — đúng cái bẫy BR-M03-N11 của M03-A.
 */
export async function deleteSacrament(
  input: DeleteSacramentInput,
): Promise<StudentActionResult<{ label: string }>> {
  const actor = await studentRouteContext();
  try {
    assertSacramentDelete(actor);
    const parsed = deleteSacramentSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("student_sacraments")
      .delete()
      .eq("id", parsed.id)
      .eq("student_id", parsed.studentId)
      .select("sacrament_type, sacrament_name")
      .maybeSingle();
    if (error) throw new AppError(error.code === "42501" ? "FORBIDDEN" : "VALIDATION_ERROR");
    if (!data) {
      return { ok: false, code: "FORBIDDEN", message: "", failed: "no_change" };
    }
    return {
      ok: true,
      data: { label: sacramentLabel(data.sacrament_type, data.sacrament_name) },
    };
  } catch (error) {
    return failure(
      error,
      error instanceof AppError && error.code === "FORBIDDEN"
        ? "forbidden_delete_sacrament"
        : failedFromAppError(error, "invalid"),
    );
  }
}

/**
 * 🔴 **TB-F06 / D-130 — đóng lỗ hổng F06 (42/75).**
 *
 * Trước đợt này "Lưu trữ" là **một mục trong `<select>`** ghi thẳng vào
 * `students.status` và **không đụng gì tới ghi danh**: em đã lưu trữ vẫn nằm
 * trong sĩ số, vẫn có tên trong danh sách điểm danh, và Giáo lý viên vẫn đọc
 * được hồ sơ sức khoẻ của em (5W-F06 — hệ quả phân quyền dễ bị bỏ sót nhất).
 *
 * Nay một RPC đổi **cả hai trục trong một giao dịch** (AC-F06-02). Ba điều cần
 * nhớ về cách gọi:
 *
 *   1. `set_student_status` là `security invoker` — RLS vẫn chạy, nên hàng rào
 *      năm học đã đóng (D-117/D-118) và phạm vi ngành (D-123) tự áp dụng. Ở đây
 *      chỉ cần dịch mã lỗi ra tiếng Việt.
 *   2. `closeEnrollment` phải do **người dùng tick**, không mặc định `true`
 *      (BR-M03-N12): họ phải nhìn thấy tên lớp trước.
 *   3. Làm mới cả `/classes` và `/classes/[id]`: sĩ số đổi ở đó chứ không phải
 *      ở trang hồ sơ — cùng bài học của `revalidateEnrollmentPaths` ở M03-A.
 */
export async function setStudentStatus(
  input: SetStudentStatusInput,
): Promise<StudentActionResult<{ studentName: string; className: string | null; action: string }>> {
  const actor = await studentRouteContext();
  try {
    const parsed = setStudentStatusSchema.parse(input);
    // `docs/05` §5 — "Archive student: SA/global-write". Kiểm ở đây để câu từ
    // chối nói được thành lời; cơ sở dữ liệu vẫn kiểm lại y hệt (ẩn nút không
    // phải authorization, AGENTS §5).
    if (isClosingStudentStatus(parsed.status)) {
      if (!canArchiveStudent(actor.role)) {
        return { ok: false, code: "FORBIDDEN", message: "", failed: "forbidden_archive" };
      }
    } else {
      assertStudentWrite(actor);
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("set_student_status", {
      p_student_id: parsed.studentId,
      p_status: parsed.status,
      p_close_enrollment: parsed.closeEnrollment,
      p_reason: parsed.reason,
      p_ended_on: parsed.endedOn ?? undefined,
    });
    const row = (data ?? [])[0];
    if (error || !row) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "",
        failed: statusFailureCode(error),
      };
    }

    revalidatePath("/students");
    revalidatePath(`/students/${parsed.studentId}`);
    revalidatePath("/classes");
    return {
      ok: true,
      data: {
        studentName: row.student_name,
        className: row.class_name,
        action: row.enrollment_action,
      },
    };
  } catch (error) {
    return failure(error, failedFromAppError(error, "invalid"));
  }
}

/**
 * Lỗi của `set_student_status` → mã câu chữ tiếng Việt.
 *
 * Nhận dạng bằng thông điệp chứ không bằng `SQLSTATE`, cùng lý do đã ghi ở
 * `createFailureCode`: `raise … using errcode` gói nhiều ca vào chung một mã.
 */
function statusFailureCode(error: { code?: string; message?: string } | null): StudentFailedCode {
  const message = error?.message ?? "";
  if (message.includes("STUDENT_HAS_OPEN_ENROLLMENT")) return "open_enrollment";
  if (message.includes("ARCHIVE_IS_GLOBAL_WRITE")) return "forbidden_archive";
  if (message.includes("ENROLLMENT_NOT_WRITABLE")) return "enrollment_locked";
  if (message.includes("STUDENT_NOT_FOUND")) return "not_found";
  if (message.includes("STUDENT_NOT_WRITABLE")) return "no_change";
  if (error?.code === "42501") return "forbidden";
  return "invalid";
}

// --- Adapter cho `<form action={…}>` qua `useActionState` -------------------
//
// 🔴 **Không dùng `redirect()`** — D-114 / nợ #16: `redirect()` về chính route đang
// đứng làm Next 15.5 bỏ luôn lượt dựng lại trang (`<main>` trắng vĩnh viễn, log sạch
// trơn). Cả bốn biểu mẫu dưới đây đều phải quay về đúng trang đang đứng.
//
// Bản cũ của bốn hàm này trả `Promise<void>`: chúng **gọi** action rồi **vứt kết quả
// đi** (BR-M03-38). Đó là lý do sáu thao tác ghi của module im lặng như nhau.

export async function createStudentFormAction(
  _previous: CreateStudentFormState,
  formData: FormData,
): Promise<CreateStudentFormState> {
  const values = createStudentValuesFromForm(formData);
  const result = await createStudent({
    guardianId: values.guardianId,
    saintName: values.saintName,
    fullName: values.fullName,
    gender: values.gender,
    dateOfBirth: values.dateOfBirth,
    patronFeastDate: values.patronFeastDate,
    address: values.address,
    phone: values.phone,
    hardshipFlag: values.hardshipFlag,
    generalNotes: "",
    status: "active",
    classId: values.classId,
    // TB-F13 pha hai — ô ẩn `confirmDuplicate`, không phải state React, để pha
    // hai **cũng gửi được khi chưa có JavaScript** (09 §11).
    confirmDuplicate: formData.get("confirmDuplicate") === "1",
  } as unknown as CreateStudentInput);

  if (!result.ok) {
    if ("duplicates" in result) {
      // AC-F13-01/02 — chưa tạo gì cả, chỉ hỏi. Không có `feedback` màu đỏ: đây
      // không phải một lỗi, và tô nó thành lỗi là dạy người dùng bỏ qua cảnh báo.
      return { feedback: null, duplicates: result.duplicates, values };
    }
    // AC-F14-03 — giữ nguyên các ô đã nhập. Thư ký nhập liền một mạch vài chục em;
    // bắt gõ lại cả hồ sơ vì quên ngày sinh là cách nhanh nhất để họ bỏ dùng.
    return {
      feedback: studentFailureFeedback(result.failed, result.message),
      duplicates: [],
      values,
    };
  }
  return {
    feedback: result.data.className
      ? studentCreatedFeedback(result.data.studentName, result.data.studentCode, result.data.className)
      : studentCreatedUnassignedFeedback(result.data.studentName, result.data.studentCode),
    duplicates: [],
    values: EMPTY_CREATE_STUDENT_VALUES,
  };
}

export async function updateStudentFormAction(
  _previous: StudentFeedback | null,
  formData: FormData,
): Promise<StudentFeedback> {
  const result = await updateStudent({
    id: String(formData.get("id") ?? ""),
    saintName: String(formData.get("saintName") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    // 🔴 IMP-BULK-002 — `?? "male"` cũ là đúng thứ bẫy mà ghi chú `status` bên
    // dưới kể lại: một ô không chọn gì mà lại có mặc định thì nó ghi đè dữ liệu
    // thật. Nay ô có lựa chọn "chưa rõ" và chuỗi rỗng đi thẳng thành null.
    gender: String(formData.get("gender") ?? "") || null,
    dateOfBirth: String(formData.get("dateOfBirth") ?? "") || null,
    patronFeastDate: String(formData.get("patronFeastDate") ?? ""),
    address: String(formData.get("address") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    hardshipFlag: formData.get("hardshipFlag") === "on",
    generalNotes: String(formData.get("generalNotes") ?? ""),
    // 🔴 KHÔNG gửi `status`. Biểu mẫu này không còn ô đó (TB-F06), và bản cũ
    // `formData.get("status") ?? "active"` sẽ **âm thầm đặt mọi em về "Đang sinh
    // hoạt"** mỗi lần ai đó sửa số điện thoại.
  } as unknown as UpdateStudentInput);
  return result.ok
    ? studentSavedFeedback(result.data.studentName)
    : studentFailureFeedback(result.failed, result.message);
}

export async function saveHealthProfileFormAction(
  _previous: StudentFeedback | null,
  formData: FormData,
): Promise<StudentFeedback> {
  const result = await saveHealthProfile({
    studentId: String(formData.get("studentId") ?? ""),
    allergies: String(formData.get("allergies") ?? ""),
    medicalConditions: String(formData.get("medicalConditions") ?? ""),
    medications: String(formData.get("medications") ?? ""),
    emergencyNotes: String(formData.get("emergencyNotes") ?? ""),
  } as unknown as HealthProfileInput);
  return result.ok ? healthSavedFeedback() : studentFailureFeedback(result.failed, result.message);
}

/**
 * BR-M03-N19 / TB-F09 — ghi danh ngay từ trang hồ sơ của một em chưa xếp lớp.
 *
 * Uỷ quyền cho `enrollStudent` của module Ghi danh chứ không viết lại: mọi luật
 * (lớp còn hoạt động · năm học còn ghi được · một ghi danh mở mỗi năm) đã nằm ở
 * đó, và bản chép thứ hai của một luật là hình dạng của lỗi F10.
 */
export async function enrollStudentFromProfileAction(
  _previous: StudentFeedback | null,
  formData: FormData,
): Promise<StudentFeedback> {
  const studentId = String(formData.get("studentId") ?? "");
  const classId = String(formData.get("classId") ?? "");
  if (classId === "") {
    return studentFailureFeedback("invalid", "Vui lòng chọn lớp để ghi danh.");
  }
  const result = await enrollStudent({
    studentId,
    classId,
    enrolledOn: todayVi(),
    notes: "",
  } as unknown as EnrollStudentInput);
  revalidatePath(`/students/${studentId}`);
  return result.ok
    ? { tone: "success", text: `Đã ghi danh ${result.data.studentName} vào lớp ${result.data.className}.` }
    : { tone: "danger", text: result.message };
}

/**
 * 🔴 **MỘT adapter cho cả ba thao tác bí tích**, phân nhánh bằng ô ẩn `intent` —
 * cùng khuôn `enrollmentRowFormAction` của M03-A, và vì đúng lý do đã đo được ở
 * đó: `useActionState` **giữ lại** kết quả lượt trước, nên ba `useActionState`
 * riêng sẽ để câu *"Đã lưu bí tích Rửa tội"* đứng nguyên sau khi người dùng vừa
 * **xoá** bản ghi ấy — nói sai trạng thái hiện tại của hồ sơ.
 *
 * `intent` là ô ẩn nên **không có JavaScript vẫn gửi đúng nhánh** (09 §11).
 */
export async function sacramentFormAction(
  _previous: StudentFeedback | null,
  formData: FormData,
): Promise<StudentFeedback> {
  const studentId = String(formData.get("studentId") ?? "");

  if (String(formData.get("intent") ?? "") === "delete") {
    const result = await deleteSacrament({
      id: String(formData.get("id") ?? ""),
      studentId,
    } as DeleteSacramentInput);
    return result.ok
      ? sacramentDeletedFeedback(result.data.label)
      : studentFailureFeedback(result.failed, result.message);
  }

  const result = await upsertSacrament({
    // Rỗng ⇒ thêm mới; có ⇒ sửa (AC-F08-01).
    id: String(formData.get("id") ?? ""),
    studentId,
    sacramentType: String(formData.get("sacramentType") ?? "baptism"),
    sacramentName: String(formData.get("sacramentName") ?? ""),
    sacramentDate: String(formData.get("sacramentDate") ?? ""),
    place: String(formData.get("place") ?? ""),
    registryNumber: String(formData.get("registryNumber") ?? ""),
    godparentName: String(formData.get("godparentName") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  } as unknown as UpsertSacramentInput);
  return result.ok
    ? sacramentSavedFeedback(result.data.label)
    : studentFailureFeedback(result.failed, result.message);
}

/**
 * TB-F06 — adapter của khối "Trạng thái hồ sơ".
 *
 * `closeEnrollment` đọc từ một ô tick thật (`"on"` khi được tick), không phải
 * một mặc định trong mã: BR-M03-N12 đòi người dùng **nhìn thấy tên lớp rồi mới
 * đồng ý**, và một mặc định `true` nằm ở đây sẽ đóng ghi danh của một em vì họ
 * quên bỏ tick.
 */
export async function setStudentStatusFormAction(
  _previous: StudentFeedback | null,
  formData: FormData,
): Promise<StudentFeedback> {
  const result = await setStudentStatus({
    studentId: String(formData.get("studentId") ?? ""),
    status: String(formData.get("status") ?? "active"),
    closeEnrollment: formData.get("closeEnrollment") === "on",
    reason: String(formData.get("reason") ?? "withdrawn"),
    endedOn: String(formData.get("endedOn") ?? ""),
  } as unknown as SetStudentStatusInput);
  return result.ok
    ? {
        tone: "success",
        text: studentStatusSavedText(
          String(formData.get("status") ?? "active"),
          result.data.studentName,
          result.data.className,
          result.data.action,
        ),
      }
    : studentFailureFeedback(result.failed, result.message);
}
