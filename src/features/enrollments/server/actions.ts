"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { isAcademicYearWritable } from "@/features/academic-years/year-lifecycle";
import {
  enrollmentFailureFeedback,
  enrolledFeedback,
  closedFeedback,
  pausedFeedback,
  resumedFeedback,
  PENDING_PROMOTION_MESSAGE,
  type EnrollmentFailedCode,
  type EnrollmentFeedback,
} from "../enrollment-feedback";
import {
  closeEnrollmentSchema,
  enrollStudentSchema,
  pauseEnrollmentSchema,
  resumeEnrollmentSchema,
  type CloseEnrollmentInput,
  type EnrollStudentInput,
  type PauseEnrollmentInput,
  type ResumeEnrollmentInput,
} from "../schemas";
import { ENROLLMENT_WRITE_ROLES } from "../permissions";

export type EnrollmentResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string; failed: EnrollmentFailedCode };

function failure(error: unknown, failed: EnrollmentFailedCode = "invalid"): EnrollmentResult<never> {
  if (error instanceof AppError) {
    return { ok: false, code: error.code, message: error.message, failed };
  }
  // Cùng vá gốc với M02-A: bản cũ gán **mọi** lỗi lạ thành `CONFLICT`, nên một lỗi
  // Zod ("Ngày không hợp lệ.") hiện ra thành "Thao tác bị xung đột, vui lòng thử
  // lại" — vừa sai vừa dẫn người dùng đi thử lại đúng thứ vừa hỏng.
  if (error instanceof ZodError) {
    const first = error.issues[0]?.message ?? "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
    return { ok: false, code: "VALIDATION_ERROR", message: first, failed: "invalid" };
  }
  return {
    ok: false,
    code: "CONFLICT",
    message: "Không thể lưu ghi danh. Vui lòng thử lại.",
    failed: "invalid",
  };
}

/**
 * M08-B / BR-M08-20 — tên luật do trigger `enrollments_pending_promotion_guard`
 * ném ra. Nhận ra bằng **thông điệp** chứ không bằng `error.code`: trigger ném
 * `42501`, **cùng mã** với "không đủ quyền", nên phân biệt bằng mã là gộp hai
 * chuyện khác hẳn nhau vào một câu trả lời sai.
 */
const PENDING_PROMOTION_RULE = "ENROLLMENT_HAS_PENDING_PROMOTION";

function failedFromAppError(error: unknown, fallback: EnrollmentFailedCode): EnrollmentFailedCode {
  if (!(error instanceof AppError)) return fallback;
  if (error.message === PENDING_PROMOTION_MESSAGE) return "pending_promotion";
  switch (error.code) {
    case "FORBIDDEN":
      return "forbidden";
    case "RESOURCE_NOT_FOUND":
      return "not_found";
    case "DUPLICATE_ENROLLMENT":
      return "duplicate";
    default:
      return fallback;
  }
}

/**
 * **D-96 / nợ #14 — trả cho `enrollments`.** Hai điều cùng một chỗ:
 *
 *   1. Guard gọi **ngoài `try`**. `redirect()` của Next báo hiệu bằng cách **ném
 *      lỗi**; nằm trong `try` là `catch` nuốt mất chuyển hướng, và người hết phiên
 *      bấm mãi một nút không chạy thay vì được đưa về `/login`.
 *   2. `requireRouteAccess` thay `requireAuthContext`. Bản cũ chỉ hỏi "đã đăng nhập
 *      chưa", nên luật `ROUTE_RULES` khai `/classes` dành cho nhân sự **chưa từng
 *      được thi hành ở tầng action** — đúng hình dạng lỗi A-03 của M14.
 */
async function enrollmentRouteContext() {
  return requireRouteAccess("/classes");
}

function assertEnrollmentWrite(context: { role: string | null }) {
  if (!context.role || !(ENROLLMENT_WRITE_ROLES as readonly string[]).includes(context.role)) {
    throw new AppError("FORBIDDEN");
  }
}

interface EnrollmentRow {
  id: string;
  status: string;
  class_id: string;
  student_id: string;
  students: { saint_name: string | null; full_name: string } | null;
  classes: { display_name: string } | null;
  academic_years: { status: string } | null;
}

const ENROLLMENT_SELECT =
  "id, status, class_id, student_id, students(saint_name, full_name), classes(display_name), academic_years(status)";

function studentLabel(row: EnrollmentRow | null): string {
  const student = row?.students;
  if (!student) return "thiếu nhi";
  return student.saint_name ? `${student.saint_name} ${student.full_name}` : student.full_name;
}

/**
 * Đọc ghi danh **trước khi ghi** để làm hai việc: chặn năm học đã đóng bằng một câu
 * nói được thành lời, và lấy tên em cho câu phản hồi.
 *
 * BR-M02-N09 nói "ghi danh **và kết thúc ghi danh**", nên chốt chặn phải có ở cả
 * hai. Sửa ghi danh của một năm đã đóng là sửa quá khứ: nó đổi sĩ số của báo cáo năm
 * cũ mà không để lại dấu vết nào trên màn hình. Từ M02-C, RLS **cũng** biết trạng
 * thái năm học (`app.writable_academic_year_ids`, `20260726000200`) — kiểm ở đây vẫn
 * giữ và vẫn cần: RLS từ chối bằng mã `42501` khô khốc, còn câu dưới đây nói ra vì sao.
 */
async function loadWritableEnrollment(enrollmentId: string): Promise<EnrollmentRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(ENROLLMENT_SELECT)
    .eq("id", enrollmentId)
    .maybeSingle();
  if (error || !data) throw new AppError("RESOURCE_NOT_FOUND");
  const row = data as unknown as EnrollmentRow;
  if (!isAcademicYearWritable(row.academic_years?.status)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Năm học của lớp này đã đóng nên không sửa được ghi danh.",
    );
  }
  return row;
}

/**
 * 🔴 `.select("id")` sau mọi `update` — BR-M03-N05 / SW-04.
 *
 * Trong mô hình RLS, **quyền bị từ chối biểu hiện dưới dạng 0 dòng, không phải
 * exception**. Thiếu dòng này thì một lượt ghi bị hàng rào chặn vẫn báo thành công.
 */
async function applyEnrollmentUpdate(
  enrollmentId: string,
  payload: Database["public"]["Tables"]["enrollments"]["Update"],
): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .update(payload)
    .eq("id", enrollmentId)
    .select("id")
    .maybeSingle();
  if (error) {
    // D-158 tầng hai. Trigger ném đúng mã `42501` của "không đủ quyền", nên nếu
    // không dịch riêng thì người dùng đọc *"Bạn không có quyền sửa ghi danh"* —
    // sai hẳn nguyên nhân, và họ sẽ đi xin cấp quyền cho một việc quyền không
    // liên quan.
    if (`${error.message} ${error.details ?? ""}`.includes(PENDING_PROMOTION_RULE)) {
      throw new AppError("CONFLICT", PENDING_PROMOTION_MESSAGE);
    }
    throw new AppError(error.code === "42501" ? "FORBIDDEN" : "VALIDATION_ERROR");
  }
  if (!data) {
    throw new AppError(
      "FORBIDDEN",
      "Không có dòng nào được cập nhật. Ghi danh có thể thuộc một năm học đã đóng, hoặc bạn không đủ quyền sửa nó.",
    );
  }
}

export async function enrollStudent(
  input: EnrollStudentInput,
): Promise<EnrollmentResult<{ id: string; studentName: string; className: string }>> {
  const actor = await enrollmentRouteContext();
  try {
    assertEnrollmentWrite(actor);
    const parsed = enrollStudentSchema.parse(input);
    const supabase = await createClient();

    const { data: classRow, error: classError } = await supabase
      .from("classes")
      .select("id, display_name, academic_year_id, status, academic_years(status)")
      .eq("id", parsed.classId)
      .maybeSingle();
    if (classError || !classRow) throw new AppError("RESOURCE_NOT_FOUND");
    if (classRow.status !== "active") {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Lớp này không còn hoạt động nên không nhận ghi danh mới.",
        failed: "class_inactive",
      };
    }
    // TB-F07 / BR-M02-N09 — ẩn biểu mẫu không phải authorization (AGENTS §5):
    // gọi thẳng action thì không đi qua giao diện.
    const yearStatus = (classRow as unknown as { academic_years: { status: string } | null })
      .academic_years?.status;
    if (!isAcademicYearWritable(yearStatus)) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Năm học của lớp này đã đóng nên không ghi danh thêm được.",
        failed: "year_closed",
      };
    }

    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        student_id: parsed.studentId,
        class_id: parsed.classId,
        academic_year_id: classRow.academic_year_id,
        enrolled_on: parsed.enrolledOn,
        notes: parsed.notes,
        updated_by: actor.profileId,
      })
      .select("id, students(saint_name, full_name)")
      .single();
    if (error || !data) {
      if (error?.code === "23505") throw new AppError("DUPLICATE_ENROLLMENT");
      if (error?.code === "42501") throw new AppError("FORBIDDEN");
      // BR-M03-N13 / AC-F06-04 (M03-C) — trigger `enrollments_need_active_student`
      // chặn ghi danh một em đã rút / đã lưu trữ / đang tạm nghỉ. Không dịch mã
      // này ra thì người dùng chỉ nhận "Dữ liệu không hợp lệ" trên một biểu mẫu
      // họ đã điền đúng.
      if ((error?.message ?? "").includes("STUDENT_NOT_ACTIVE")) {
        return {
          ok: false,
          code: "VALIDATION_ERROR",
          message: "",
          failed: "student_not_active",
        };
      }
      throw new AppError("VALIDATION_ERROR");
    }
    revalidatePath("/classes");
    revalidatePath(`/classes/${parsed.classId}`);
    revalidatePath(`/students/${parsed.studentId}`);
    return {
      ok: true,
      data: {
        id: data.id,
        studentName: studentLabel(data as unknown as EnrollmentRow),
        className: classRow.display_name,
      },
    };
  } catch (error) {
    return failure(error, failedFromAppError(error, "invalid"));
  }
}

/**
 * TB-F10 / AC-F10-01 — **"Tạm nghỉ" lần đầu tiên chạy được.**
 *
 * `ended_on: null` là điều kiện sống còn chứ không phải dọn dẹp: `paused` nằm trong
 * nhóm trạng thái **mở**, mà CHECK `enrollments_open_has_no_end` bắt trạng thái mở
 * phải có `ended_on IS NULL`. Ghi đè về `null` ngay tại đây cũng dọn luôn trường hợp
 * một ghi danh đã đóng được mở lại thành tạm nghỉ.
 */
export async function pauseEnrollment(
  input: PauseEnrollmentInput,
): Promise<EnrollmentResult<{ studentName: string }>> {
  const actor = await enrollmentRouteContext();
  try {
    assertEnrollmentWrite(actor);
    const parsed = pauseEnrollmentSchema.parse(input);
    const row = await loadWritableEnrollment(parsed.enrollmentId);
    await applyEnrollmentUpdate(parsed.enrollmentId, {
      status: "paused",
      ended_on: null,
      updated_by: actor.profileId,
    });
    revalidateEnrollmentPaths(row);
    return { ok: true, data: { studentName: studentLabel(row) } };
  } catch (error) {
    return failure(error, failedFromAppError(error, "invalid"));
  }
}

/**
 * TB-F10 / AC-F10-02 / BR-M03-N03 — **khôi phục**, chức năng chưa từng tồn tại
 * (`resumeEnrollment` được `docs/11` §3 yêu cầu từ đầu).
 *
 * Không tạo bản ghi thứ hai: `paused` vốn đã chiếm suất "một ghi danh mở mỗi năm"
 * của partial unique index, nên đưa nó về `active` **không thể** đụng ràng buộc đó.
 */
export async function resumeEnrollment(
  input: ResumeEnrollmentInput,
): Promise<EnrollmentResult<{ studentName: string }>> {
  const actor = await enrollmentRouteContext();
  try {
    assertEnrollmentWrite(actor);
    const parsed = resumeEnrollmentSchema.parse(input);
    const row = await loadWritableEnrollment(parsed.enrollmentId);
    await applyEnrollmentUpdate(parsed.enrollmentId, {
      status: "active",
      ended_on: null,
      updated_by: actor.profileId,
    });
    revalidateEnrollmentPaths(row);
    return { ok: true, data: { studentName: studentLabel(row) } };
  } catch (error) {
    return failure(error, failedFromAppError(error, "invalid"));
  }
}

/**
 * TB-F10 / AC-F10-03 — đóng ghi danh. Đổi tên từ `endEnrollment`: hàm cũ nhận cả
 * `paused` nên cái tên "kết thúc" nói dối về một nửa số lượt gọi.
 *
 * `docs/11` §3 gọi bốn việc này là `pauseEnrollment` · `resumeEnrollment` ·
 * `withdrawEnrollment` · `transferEnrollment`; ở đây gộp hai việc cuối thành một hàm
 * nhận **lý do**, vì chúng khác nhau đúng một giá trị enum và tách ra là chép ba lần
 * cùng một khối kiểm tra.
 */
export async function closeEnrollment(
  input: CloseEnrollmentInput,
): Promise<EnrollmentResult<{ studentName: string; reason: string }>> {
  const actor = await enrollmentRouteContext();
  try {
    assertEnrollmentWrite(actor);
    const parsed = closeEnrollmentSchema.parse(input);
    const row = await loadWritableEnrollment(parsed.enrollmentId);

    /*
      🔴 **BR-M08-20 / D-158 — tầng một của hai tầng.**

      `04_TO_BE_FLOWS` TO-BE 5 khuyến nghị *"phương án A cho v1"* (chỉ chặn ở đây);
      chủ dự án chốt **cả hai tầng**, đúng bài học M07-B — *"một điều chỉ đúng trên
      màn hình không phải một bảo đảm"*. Tầng này tồn tại vì tầng cơ sở dữ liệu
      trả lời bằng một mã lỗi khô khốc; câu ở đây nói ra **việc phải làm trước**.

      **D-162 (chủ dự án chốt 2026-08-07): chỉ chặn "Kết thúc ghi danh".** Không
      đặt phép kiểm này vào `loadWritableEnrollment` — hàm đó dùng chung với "Tạm
      nghỉ"/"Khôi phục", mà `paused` là trạng thái **mở**: nó không sinh đề xuất mồ
      côi, và chặn nó là chặn một việc chính đáng (em ốm dài ngày đúng lúc đề xuất
      cuối năm đang chờ duyệt) bằng một nút "không ăn" không ai hiểu vì sao.
    */
    const supabase = await createClient();
    const { data: pendingReview } = await supabase
      .from("promotion_reviews")
      .select("id")
      .eq("source_enrollment_id", parsed.enrollmentId)
      .eq("final_status", "pending")
      .maybeSingle();
    if (pendingReview) {
      return { ok: false, code: "CONFLICT", message: "", failed: "pending_promotion" };
    }

    await applyEnrollmentUpdate(parsed.enrollmentId, {
      status: parsed.status,
      ended_on: parsed.endedOn,
      updated_by: actor.profileId,
    });
    revalidateEnrollmentPaths(row);
    return { ok: true, data: { studentName: studentLabel(row), reason: parsed.status } };
  } catch (error) {
    return failure(error, failedFromAppError(error, "invalid"));
  }
}

/**
 * TB-F10 bước 5 — làm mới **cả ba** nơi con số sĩ số xuất hiện. Bản cũ chỉ gọi
 * `revalidatePath("/classes")`, nên trang chi tiết lớp và trang hồ sơ em vẫn hiện
 * trạng thái cũ cho tới lượt tải sau.
 */
function revalidateEnrollmentPaths(row: EnrollmentRow): void {
  revalidatePath("/classes");
  revalidatePath(`/classes/${row.class_id}`);
  revalidatePath(`/students/${row.student_id}`);
}

// --- Adapter cho `<form action={…}>` qua `useActionState` -------------------
//
// 🔴 **Không dùng `redirect()`** — D-114 / nợ #16. `redirect()` về **chính route
// đang đứng** làm Next 15.5 đổi thanh địa chỉ rồi bỏ luôn lượt dựng lại trang:
// `<main>` trắng vĩnh viễn, log máy chủ sạch trơn. Cả bốn biểu mẫu dưới đây nằm trên
// `/classes/[classId]` và phải quay về chính nó, tức đúng vào cái bẫy đó.
// `useActionState` giữ được điều D-61 thật sự đòi (mọi thao tác ghi phải nói ra kết
// quả) **và** giữ `<form action={…}>` thật nên biểu mẫu vẫn chạy khi chưa có
// JavaScript (09 §11).

export async function enrollStudentFormAction(
  _previous: EnrollmentFeedback | null,
  formData: FormData,
): Promise<EnrollmentFeedback> {
  const result = await enrollStudent({
    studentId: String(formData.get("studentId") ?? ""),
    classId: String(formData.get("classId") ?? ""),
    enrolledOn: String(formData.get("enrolledOn") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  } as unknown as EnrollStudentInput);
  return result.ok
    ? enrolledFeedback(result.data.studentName, result.data.className)
    : enrollmentFailureFeedback(result.failed, result.message);
}

/**
 * 🔴 **MỘT adapter cho cả ba thao tác của một dòng**, phân nhánh bằng ô ẩn `intent`.
 *
 * Lý do không phải thẩm mỹ mà là một lỗi đo được: bản đầu của đợt này dùng **ba**
 * `useActionState` riêng cho ba nút, rồi hiển thị câu đầu tiên khác `null`. Nhưng
 * `useActionState` **giữ lại** kết quả của lượt trước, nên sau khi bấm "Tạm nghỉ"
 * rồi "Khôi phục", dòng thông báo vẫn đứng nguyên ở câu *"Đã chuyển … sang Tạm
 * nghỉ"* — tức là **nói sai trạng thái hiện tại của em**, đúng loại lỗi cả đợt này
 * sinh ra để diệt. E2E bắt được ở cả ba viewport.
 *
 * Một `useActionState` cho cả dòng thì câu chữ **luôn** là kết quả của thao tác vừa
 * làm. Ba biểu mẫu vẫn là `<form action={…}>` thật nên vẫn chạy khi chưa có
 * JavaScript (09 §11); `intent` là ô ẩn nên không có JS vẫn gửi đúng nhánh.
 */
export async function enrollmentRowFormAction(
  _previous: EnrollmentFeedback | null,
  formData: FormData,
): Promise<EnrollmentFeedback> {
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const intent = String(formData.get("intent") ?? "");

  if (intent === "pause") {
    const result = await pauseEnrollment({ enrollmentId } as PauseEnrollmentInput);
    return result.ok
      ? pausedFeedback(result.data.studentName)
      : enrollmentFailureFeedback(result.failed, result.message);
  }

  if (intent === "resume") {
    const result = await resumeEnrollment({ enrollmentId } as ResumeEnrollmentInput);
    return result.ok
      ? resumedFeedback(result.data.studentName)
      : enrollmentFailureFeedback(result.failed, result.message);
  }

  if (intent === "close") {
    const result = await closeEnrollment({
      enrollmentId,
      status: String(formData.get("status") ?? "withdrawn"),
      endedOn: String(formData.get("endedOn") ?? ""),
    } as unknown as CloseEnrollmentInput);
    return result.ok
      ? closedFeedback(result.data.studentName, result.data.reason)
      : enrollmentFailureFeedback(result.failed, result.message);
  }

  // Ô ẩn bị sửa hoặc thiếu: từ chối, không đoán ý. Đoán ở đây nghĩa là một biểu mẫu
  // hỏng có thể đóng ghi danh của một em.
  return enrollmentFailureFeedback("invalid");
}
