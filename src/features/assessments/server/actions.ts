"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireRouteAccess } from "@/lib/auth/guards";
import type { AuthContext } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";
import { classifyAssessmentDbError, describeAssessmentZodIssues } from "../db-errors";
import {
  assessmentIdSchema,
  assessmentInputSchema,
  attendanceAssessmentActionSchema,
  gradebookLockInputSchema,
  leaderboardIdSchema,
  leaderboardInputSchema,
  leaderboardOperationSchema,
  publishAssessmentSchema,
  saveAssessmentScoresSchema,
  resetAttendanceOverrideSchema,
  studentCommentIdSchema,
  studentCommentInputSchema,
  updateAssessmentSchema,
  updateStudentCommentSchema,
  type AssessmentInput,
  type PublishAssessmentInput,
  type SaveAssessmentScoresInput,
  type ResetAttendanceOverrideInput,
  type StudentCommentInput,
  type LeaderboardInput,
  type LeaderboardOperationInput,
  type UpdateAssessmentInput,
  type UpdateStudentCommentInput,
} from "../schemas";
import {
  canCommentClass,
  canGradeClass,
  canLockGradebook,
  canManageLeaderboard,
  canModerateComment,
} from "./permissions";

export type AssessmentActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

/**
 * 🔴 **`ZodError` không còn bị nuốt** — M07-A.
 *
 * Bản cũ chỉ giữ `message` của `AppError`, nên **mọi** lỗi validation của sáu
 * luồng F02 · F03 · F06 · F09 · F13 · F15 rơi vào một câu duy nhất *"Không thể
 * lưu bảng điểm. Vui lòng thử lại."* — xem `db-errors.ts`.
 */
function failure(error: unknown): AssessmentActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  if (error instanceof z.ZodError) {
    return { ok: false, code: "VALIDATION_ERROR", message: describeAssessmentZodIssues(error.issues) };
  }
  return { ok: false, code: "CONFLICT", message: "Không thể lưu bảng điểm. Vui lòng thử lại." };
}

function mapDatabaseError(error: { code?: string; message?: string; details?: string } | null): AppError {
  const { appCode, message } = classifyAssessmentDbError(error ?? null);
  return new AppError(appCode, message);
}

function revalidateGradebook(classId: string) {
  void classId;
  revalidatePath("/results");
}

/**
 * Invalidate the detail page in a separate Server Action, after the mutation
 * response has already settled in the client.
 */
export async function refreshGradebookPage(classId: string): Promise<void> {
  const actor = await assessmentsRouteContext();
  const parsed = gradebookLockInputSchema.parse({ classId });
  await requireGradeClass(actor, parsed.classId);
  revalidatePath(`/results/${parsed.classId}`);
}

/**
 * Nợ #14 / D-96 — guard gọi **NGOÀI `try`**, và bằng `requireRouteAccess`.
 *
 * Hai lỗi cùng lúc ở bản cũ, đúng hình dạng đã trả ở `attendance` (M05-A) và
 * `teaching-plans` (M06-A):
 * (1) `requireAuthContext` chỉ hỏi *"đã đăng nhập chưa"*, nên luật `ROUTE_RULES`
 * của `/results` chỉ được thi hành ở tầng trang, không ở tầng action;
 * (2) nó nằm **trong** `try`, mà `redirect()` của Next báo hiệu bằng cách **ném**
 * — nên `catch` nuốt mất, và người vừa hết phiên đăng nhập đọc *"Không thể lưu
 * bảng điểm. Vui lòng thử lại."* rồi thử lại mãi thay vì được đưa về `/login`.
 *
 * ⚠️ Bài học M12-A: **đọc cả hàm bọc, đừng chỉ grep tên hàm.** Ở module này
 * `requireAuthContext` nấp trong ba hàm bọc `requireGradeClass` /
 * `requireGradeAssessment` / `requireManageLeaderboard`, nên grep tên hàm ở tầng
 * action chỉ thấy **năm** trong mười lăm thao tác.
 */
async function assessmentsRouteContext(pathname = "/results") {
  return requireRouteAccess(pathname);
}

/**
 * SW-04 — một lượt ghi trả về **0 dòng** không phải là thành công.
 *
 * 🔴 Cả bốn policy ghi của module mang điều kiện `not app.is_gradebook_locked(...)`
 * ngay trong mệnh đề `using`, mà `using` **lọc dòng trước khi trigger chạy**: một
 * lượt UPDATE lên bảng điểm vừa bị người khác khóa không ném `GRADEBOOK_LOCKED`
 * mà chỉ đơn giản đổi **0 dòng**. Không đếm thì màn hình báo *"Đã cập nhật cột
 * điểm."* trong khi cơ sở dữ liệu không nhúc nhích.
 */
const WRITE_REJECTED_MESSAGE =
  "Không ghi được. Bảng điểm có thể vừa bị khóa, hoặc bạn không còn quyền trên lớp này. " +
  "Hãy tải lại trang để xem trạng thái mới nhất.";

function assertRowsAffected(rows: ReadonlyArray<unknown> | null) {
  if (!rows || rows.length === 0) throw new AppError("FORBIDDEN", WRITE_REJECTED_MESSAGE);
}

/**
 * M07-B · **BR-M07-33 / D-152** — chặn ở tầng ứng dụng **thêm một lần nữa**,
 * dù policy đã chặn.
 *
 * Không phải thừa: policy chặn bằng cách **lọc dòng** (`using`), nên một lượt
 * xóa không đủ quyền trả về **0 dòng** chứ không ném lỗi — `assertRowsAffected`
 * sẽ dịch nó thành câu chung *"Không ghi được. Bảng điểm có thể vừa bị khóa…"*,
 * đúng cái bẫy SW-04 mà M07-A vừa đi qua. Kiểm ở đây để người dùng đọc được
 * **lý do thật**.
 */
function assertCanModerate(
  context: AuthContext,
  comment: { class_id: string; author_profile_id: string | null },
) {
  if (canModerateComment(context, comment.class_id, comment.author_profile_id)) return;
  throw new AppError(
    "FORBIDDEN",
    "Chỉ người viết, Giáo lý viên đại diện lớp hoặc Ban điều hành xứ đoàn mới sửa/xóa được nhận xét này.",
  );
}

async function requireGradeClass(context: AuthContext, classId: string) {
  const supabase = await createClient();
  if (!(await canGradeClass(context, supabase, classId))) throw new AppError("FORBIDDEN");
  return { supabase };
}

async function requireGradeAssessment(context: AuthContext, assessmentId: string) {
  const supabase = await createClient();
  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, class_id, academic_year_id")
    .eq("id", assessmentId)
    .maybeSingle();
  if (!assessment) throw new AppError("RESOURCE_NOT_FOUND");
  if (!(await canGradeClass(context, supabase, assessment.class_id))) throw new AppError("FORBIDDEN");
  return { supabase, assessment };
}

async function requireManageLeaderboard(context: AuthContext, leaderboardId: string) {
  const supabase = await createClient();
  const { data: leaderboard } = await supabase
    .from("leaderboards")
    .select("id, class_id, source_type")
    .eq("id", leaderboardId)
    .maybeSingle();
  if (!leaderboard) throw new AppError("RESOURCE_NOT_FOUND");
  if (!(await canManageLeaderboard(context, supabase, leaderboard.class_id))) throw new AppError("FORBIDDEN");
  return { supabase, leaderboard };
}

function assessmentPayload(input: AssessmentInput, profileId: string, academicYearId: string) {
  return {
    class_id: input.classId,
    academic_year_id: academicYearId,
    kind: input.kind,
    title: input.title,
    assessment_date: input.assessmentDate ?? null,
    max_score: 10,
    weight: input.weight,
    attendance_component: input.kind === "attendance" ? input.attendanceComponent ?? null : null,
    updated_by: profileId,
  };
}

export async function createAssessment(
  input: AssessmentInput,
): Promise<AssessmentActionResult<{ id: string }>> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = assessmentInputSchema.parse(input);
    const { supabase } = await requireGradeClass(context, parsed.classId);
    const { data: classRow } = await supabase
      .from("classes")
      .select("academic_year_id")
      .eq("id", parsed.classId)
      .maybeSingle();
    if (!classRow) throw new AppError("RESOURCE_NOT_FOUND");
    const { data, error } = await supabase
      .from("assessments")
      .insert({
        ...assessmentPayload(parsed, context.profileId, classRow.academic_year_id),
        created_by: context.profileId,
      })
      .select("id")
      .single();
    if (error || !data) throw mapDatabaseError(error);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function updateAssessment(input: UpdateAssessmentInput): Promise<AssessmentActionResult> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = updateAssessmentSchema.parse(input);
    const { supabase, assessment } = await requireGradeAssessment(context, parsed.assessmentId);
    if (assessment.class_id !== parsed.classId) throw new AppError("VALIDATION_ERROR");
    const payload = assessmentPayload(parsed, context.profileId, assessment.academic_year_id);
    const { data: updated, error } = await supabase
      .from("assessments")
      .update({
        kind: payload.kind,
        title: payload.title,
        assessment_date: payload.assessment_date,
        weight: payload.weight,
        attendance_component: payload.attendance_component,
        updated_by: payload.updated_by,
      })
      .eq("id", parsed.assessmentId)
      .select("id");
    if (error) throw mapDatabaseError(error);
    assertRowsAffected(updated);
    revalidateGradebook(parsed.classId);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

/**
 * M07-B · **TB-M07-01 / BR-M07-26 / AC-01-01 · AC-01-02** — xóa **cứng** một cột
 * điểm chưa có điểm thật, dọn luôn các dòng rỗng của nó.
 *
 * 🔴 Đổi ruột sang RPC, giữ nguyên tên. Bản cũ là một lệnh `delete` trần, nên nó
 * để **khoá ngoại trả lời hộ**: `assessment_scores.assessment_id` là
 * `on delete restrict`, và trước M07-A biểu mẫu ghi cả roster nên cột nào cũng
 * có sẵn 50 dòng rỗng ⇒ **không cột nào xóa được**, với câu lỗi *"Cột đã có
 * điểm"* trong khi chưa ai nhập điểm nào (F04 = 50/75).
 *
 * Trả về **số dòng rỗng đã dọn** — không phải trang trí: đây là chỗ dữ liệu rác
 * do lỗi cũ sinh ra biến mất, và nó đáng được nói ra chứ không nên im lặng.
 */
export async function deleteAssessment(
  assessmentId: string,
): Promise<AssessmentActionResult<{ removedEmptyScores: number }>> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = assessmentIdSchema.parse(assessmentId);
    const { supabase, assessment } = await requireGradeAssessment(context, parsed);
    const { data, error } = await supabase.rpc("delete_assessment", { p_assessment_id: parsed });
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(assessment.class_id);
    return { ok: true, data: { removedEmptyScores: data ?? 0 } };
  } catch (error) {
    return failure(error);
  }
}

/**
 * M07-B · **TB-M07-01 bước 3 / BR-M07-27 · BR-M07-28 / AC-01-03** — ẩn mềm một
 * cột **đã có điểm**.
 *
 * `assessments.is_active` có từ Phase 5 nhưng là **cột chết** — không đường nào
 * đặt nó thành `false`. Từ đây nó thành cột nghiệp vụ, và migration của đợt này
 * làm cho việc ẩn **có hiệu lực thật**: cột ẩn biến khỏi bảng điểm, bản xuất,
 * trung bình có trọng số, Top 5 **và cổng phụ huynh** — kể cả khi phụ huynh gọi
 * thẳng Data API.
 *
 * Đi qua policy `assessments_update_grader` (không cần RPC): quyền, hàng rào
 * khóa và hàng rào năm học đều đã nằm sẵn ở đó.
 */
export async function archiveAssessment(assessmentId: string): Promise<AssessmentActionResult> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = assessmentIdSchema.parse(assessmentId);
    const { supabase, assessment } = await requireGradeAssessment(context, parsed);
    const { data: updated, error } = await supabase
      .from("assessments")
      .update({ is_active: false, updated_by: context.profileId })
      .eq("id", parsed)
      .select("id");
    if (error) throw mapDatabaseError(error);
    assertRowsAffected(updated);
    revalidateGradebook(assessment.class_id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function saveAssessmentScores(input: SaveAssessmentScoresInput): Promise<AssessmentActionResult<{ count: number }>> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = saveAssessmentScoresSchema.parse(input);
    const { supabase, assessment } = await requireGradeAssessment(context, parsed.assessmentId);
    const { data, error } = await supabase.rpc("save_assessment_scores", {
      p_assessment_id: parsed.assessmentId,
      p_scores: parsed.scores.map((item) => ({
        enrollmentId: item.enrollmentId,
        score: item.score,
        note: item.note ?? null,
      })),
    });
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(assessment.class_id);
    return { ok: true, data: { count: data } };
  } catch (error) {
    return failure(error);
  }
}

/**
 * M07-C · **TB-M07-02 / BR-M07-29 / D-154** — bật/tắt công bố một cột điểm,
 * chạy được **cả khi bảng điểm đã khóa**.
 *
 * 🔴 Đổi ruột sang RPC, giữ nguyên tên và nguyên nhóm người được làm. Bản cũ là
 * một lệnh `update` thẳng qua policy `assessments_update_grader`, mà policy ấy
 * mang `not app.is_gradebook_locked(...)` — nên sau khi khóa, muốn công bố kết
 * quả cho phụ huynh thì phải nhờ Quản trị viên hệ thống **mở khóa cả bảng
 * điểm**, tức mở luôn quyền sửa điểm và hệ số của cả lớp. Đúng thứ
 * `07_IMPLEMENTATION_IMPACT` §3.2 gọi là hạng mục rủi ro nghiệp vụ cao nhất
 * module, và chủ dự án chốt tách ra (2026-08-06).
 *
 * Policy **giữ nguyên** — đó là điều phương án A của `04_TO_BE_FLOWS` đòi:
 * `authenticated` gửi thẳng lệnh vào cơ sở dữ liệu vẫn bị chặn khi đã khóa
 * (AC-02-02). Ngoại lệ chỉ tồn tại bên trong hàm `security definer` này.
 *
 * ⚠️ **0 rows KHÔNG phải thất bại ở đây**, khác mọi thao tác ghi còn lại của
 * module (SW-04). RPC ném ngoại lệ ở **mọi** đường từ chối — không quyền, năm
 * học đã đóng, cột đã ẩn — nên `changed = 0` chỉ còn đúng một nghĩa: cột đã ở
 * sẵn trạng thái ấy vì người khác vừa bấm. Gọi đó là lỗi thì hai người cùng bấm
 * "Công bố" sẽ có một người đọc câu báo hỏng cho một việc **đã thành**.
 */
export async function setAssessmentPublished(
  input: PublishAssessmentInput,
): Promise<AssessmentActionResult<{ changed: boolean }>> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = publishAssessmentSchema.parse(input);
    const { supabase, assessment } = await requireGradeAssessment(context, parsed.assessmentId);
    const { data, error } = await supabase.rpc("set_assessment_published", {
      p_assessment_id: parsed.assessmentId,
      p_published: parsed.published,
    });
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(assessment.class_id);
    return { ok: true, data: { changed: (data ?? 0) > 0 } };
  } catch (error) {
    return failure(error);
  }
}

/**
 * M07-C · **nợ #21** — hiện lại một cột đã ẩn.
 *
 * M07-B mở ra món nợ này khi biến `is_active` thành cột nghiệp vụ: ẩn được mà
 * **không có đường hiện lại**, nên ẩn nhầm là phải nhờ Quản trị viên hệ thống
 * can thiệp thẳng vào cơ sở dữ liệu. Điểm chưa bao giờ mất — `delete_assessment`
 * vẫn từ chối xóa cứng cột có điểm — nhưng mọi truy vấn đều lọc `is_active` nên
 * cột ấy không còn bề mặt nào để bấm vào.
 *
 * Đi qua đúng policy `assessments_update_grader` như đường ẩn: cùng quyền, cùng
 * hàng rào khóa, cùng hàng rào năm học. Không cần RPC và **không** cần đổi một
 * dòng phân quyền nào.
 */
export async function restoreAssessment(assessmentId: string): Promise<AssessmentActionResult> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = assessmentIdSchema.parse(assessmentId);
    const { supabase, assessment } = await requireGradeAssessment(context, parsed);
    const { data: updated, error } = await supabase
      .from("assessments")
      .update({ is_active: true, updated_by: context.profileId })
      .eq("id", parsed)
      .select("id");
    if (error) throw mapDatabaseError(error);
    assertRowsAffected(updated);
    revalidateGradebook(assessment.class_id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

/**
 * M07-B · **TB-M07-04 / AC-04-01** — lấy lại đề xuất chuyên cần, và **nói ra số
 * ô bị giữ nguyên**.
 *
 * 🔴 Con số cũ vô nghĩa và im lặng theo cách tệ nhất: RPC đếm **mọi** dòng nó
 * chạm tới, kể cả dòng bị bỏ qua vì đang chỉnh tay. Người dùng đọc *"Đã cập nhật
 * 50 đề xuất"*, mở bảng ra thấy **không ô nào đổi**, và không có gì giải thích.
 * Ghép với lỗi đóng dấu vô điều kiện (đã chữa ở migration đợt này) thì đó là
 * trạng thái **thường gặp**, không phải ca hiếm.
 *
 * RPC nay trả hai số nên phải `drop` + `create` — xem migration.
 */
export async function refreshAttendanceScores(
  assessmentId: string,
): Promise<AssessmentActionResult<{ refreshed: number; skippedManual: number }>> {
  const context = await assessmentsRouteContext();
  try {
    const { assessmentId: parsed } = attendanceAssessmentActionSchema.parse({ assessmentId });
    const { supabase, assessment } = await requireGradeAssessment(context, parsed);
    const { data, error } = await supabase.rpc("refresh_attendance_assessment_scores", { p_assessment_id: parsed });
    if (error) throw mapDatabaseError(error);
    const row = data?.[0];
    revalidateGradebook(assessment.class_id);
    return {
      ok: true,
      data: { refreshed: row?.out_refreshed ?? 0, skippedManual: row?.out_skipped_manual ?? 0 },
    };
  } catch (error) {
    return failure(error);
  }
}

export async function resetAttendanceScoreOverride(input: ResetAttendanceOverrideInput): Promise<AssessmentActionResult> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = resetAttendanceOverrideSchema.parse(input);
    const { supabase, assessment } = await requireGradeAssessment(context, parsed.assessmentId);
    const { error } = await supabase.rpc("reset_attendance_score_override", {
      p_assessment_id: parsed.assessmentId,
      p_enrollment_id: parsed.enrollmentId,
    });
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(assessment.class_id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function createStudentComment(input: StudentCommentInput): Promise<AssessmentActionResult<{ id: string }>> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = studentCommentInputSchema.parse(input);
    const supabase = await createClient();
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("class_id, academic_year_id, student_id")
      .eq("id", parsed.enrollmentId)
      .maybeSingle();
    if (!enrollment) throw new AppError("RESOURCE_NOT_FOUND");
    if (!(await canCommentClass(context, supabase, enrollment.class_id))) throw new AppError("FORBIDDEN");
    const { data, error } = await supabase
      .from("student_comments")
      .insert({
        enrollment_id: parsed.enrollmentId,
        class_id: enrollment.class_id,
        academic_year_id: enrollment.academic_year_id,
        student_id: enrollment.student_id,
        visibility: parsed.visibility,
        content: parsed.content,
        author_profile_id: context.profileId,
        updated_by: context.profileId,
      })
      .select("id")
      .single();
    if (error || !data) throw mapDatabaseError(error);
    revalidateGradebook(enrollment.class_id);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}

/**
 * M07-B · **TB-M07-05 bước 2** — sửa một nhận xét thay vì xóa rồi viết lại.
 *
 * Đường xóa-viết-lại không chỉ tốn hai thao tác: nó **đổi tác giả và ngày** của
 * một nhận xét vốn chỉ cần sửa một chữ, và với D-152 thì người không được xóa
 * cũng không sửa nổi lỗi chính tả của chính mình… nếu không có action này.
 *
 * Policy `student_comments_update_grader` đã tồn tại từ Phase 5; đợt này nó được
 * gắn thêm đúng luật D-152 — nếu không thì ai bị chặn ở cửa xóa vẫn **sửa nội
 * dung thành bất cứ thứ gì**, cùng một thiệt hại qua một cái cửa khác.
 */
export async function updateStudentComment(input: UpdateStudentCommentInput): Promise<AssessmentActionResult> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = updateStudentCommentSchema.parse(input);
    const supabase = await createClient();
    const { data: comment } = await supabase
      .from("student_comments")
      .select("class_id, author_profile_id")
      .eq("id", parsed.commentId)
      .maybeSingle();
    if (!comment) throw new AppError("RESOURCE_NOT_FOUND");
    if (!(await canCommentClass(context, supabase, comment.class_id))) throw new AppError("FORBIDDEN");
    assertCanModerate(context, comment);
    const { data: updated, error } = await supabase
      .from("student_comments")
      .update({
        visibility: parsed.visibility,
        content: parsed.content,
        updated_by: context.profileId,
      })
      .eq("id", parsed.commentId)
      .select("id");
    if (error) throw mapDatabaseError(error);
    assertRowsAffected(updated);
    revalidateGradebook(comment.class_id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteStudentComment(commentId: string): Promise<AssessmentActionResult> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = studentCommentIdSchema.parse(commentId);
    const supabase = await createClient();
    const { data: comment } = await supabase
      .from("student_comments")
      .select("class_id, author_profile_id")
      .eq("id", parsed)
      .maybeSingle();
    if (!comment) throw new AppError("RESOURCE_NOT_FOUND");
    if (!(await canCommentClass(context, supabase, comment.class_id))) throw new AppError("FORBIDDEN");
    assertCanModerate(context, comment);
    const { data: removed, error } = await supabase
      .from("student_comments")
      .delete()
      .eq("id", parsed)
      .select("id");
    if (error) throw mapDatabaseError(error);
    assertRowsAffected(removed);
    revalidateGradebook(comment.class_id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

/**
 * M07-B · **TB-M07-10 bước 1 + D-74/D-151** — kiểm quyền **tường minh** ở tầng
 * ứng dụng trước khi gọi RPC, đúng như `unlockGradebook` vẫn làm.
 *
 * Không thay hàng rào — hàng rào là `app.can_lock_gradebook` trong cơ sở dữ liệu
 * (AC-10-01) — mà để **câu trả lời đúng nghĩa**: RPC ném `42501`, và bộ dịch lỗi
 * biến nó thành câu chung *"Bạn không có quyền thao tác trên bảng điểm của lớp
 * này"*, trong khi lý do thật cụ thể hơn nhiều và người dùng cần biết đúng nó
 * để đi tìm đúng người.
 */
export async function lockGradebook(classId: string): Promise<AssessmentActionResult> {
  const context = await assessmentsRouteContext();
  try {
    const { classId: parsed } = gradebookLockInputSchema.parse({ classId });
    if (!canLockGradebook(context, parsed)) {
      throw new AppError(
        "FORBIDDEN",
        "Chỉ Giáo lý viên đại diện hoặc Giáo lý viên của chính lớp này mới khóa được bảng điểm.",
      );
    }
    const supabase = await createClient();
    const { error } = await supabase.rpc("lock_gradebook", { p_class_id: parsed });
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(parsed);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function unlockGradebook(classId: string): Promise<AssessmentActionResult> {
  const context = await assessmentsRouteContext();
  try {
    const { classId: parsed } = gradebookLockInputSchema.parse({ classId });
    if (context.role !== "super_admin") throw new AppError("FORBIDDEN");
    const supabase = await createClient();
    const { error } = await supabase.rpc("unlock_gradebook", { p_class_id: parsed });
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(parsed);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function createLeaderboard(input: LeaderboardInput): Promise<AssessmentActionResult<{ id: string }>> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = leaderboardInputSchema.parse(input);
    const supabase = await createClient();
    if (!(await canManageLeaderboard(context, supabase, parsed.classId))) throw new AppError("FORBIDDEN");
    const { data: classRow } = await supabase.from("classes").select("academic_year_id").eq("id", parsed.classId).maybeSingle();
    if (!classRow) throw new AppError("RESOURCE_NOT_FOUND");
    const { data, error } = await supabase.from("leaderboards").insert({
      class_id: parsed.classId,
      academic_year_id: classRow.academic_year_id,
      title: parsed.title,
      source_type: parsed.sourceType,
      source_assessment_id: parsed.sourceType === "assessment" ? parsed.sourceAssessmentId ?? null : null,
      created_by: context.profileId,
      updated_by: context.profileId,
    }).select("id").single();
    if (error || !data) throw mapDatabaseError(error);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}

export interface LeaderboardPreviewEntry {
  enrollmentId: string;
  saintName: string;
  fullName: string;
  score: number | null;
  rank: number;
}

function customScoresPayload(input: LeaderboardOperationInput) {
  return input.customScores?.map((item) => ({ enrollmentId: item.enrollmentId, score: item.score })) ?? null;
}

export async function previewLeaderboard(input: LeaderboardOperationInput): Promise<AssessmentActionResult<LeaderboardPreviewEntry[]>> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = leaderboardOperationSchema.parse(input);
    const { supabase } = await requireManageLeaderboard(context, parsed.leaderboardId);
    const { data, error } = await supabase.rpc("preview_leaderboard", {
      p_leaderboard_id: parsed.leaderboardId,
      p_custom_scores: customScoresPayload(parsed),
    });
    if (error) throw mapDatabaseError(error);
    return { ok: true, data: data.map((entry) => ({
      enrollmentId: entry.out_enrollment_id,
      saintName: entry.out_saint_name,
      fullName: entry.out_full_name,
      score: entry.out_score === null ? null : Number(entry.out_score),
      rank: entry.out_rank,
    })) };
  } catch (error) {
    return failure(error);
  }
}

export async function publishLeaderboard(input: LeaderboardOperationInput): Promise<AssessmentActionResult<{ count: number }>> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = leaderboardOperationSchema.parse(input);
    const { supabase } = await requireManageLeaderboard(context, parsed.leaderboardId);
    const { data, error } = await supabase.rpc("publish_leaderboard", {
      p_leaderboard_id: parsed.leaderboardId,
      p_custom_scores: customScoresPayload(parsed),
    });
    if (error) throw mapDatabaseError(error);
    return { ok: true, data: { count: data } };
  } catch (error) {
    return failure(error);
  }
}

export async function unpublishLeaderboard(leaderboardId: string): Promise<AssessmentActionResult> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = leaderboardIdSchema.parse(leaderboardId);
    const { supabase } = await requireManageLeaderboard(context, parsed);
    const { data: updated, error } = await supabase.from("leaderboards").update({
      is_published: false,
      updated_by: context.profileId,
    }).eq("id", parsed).select("id");
    if (error) throw mapDatabaseError(error);
    assertRowsAffected(updated);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

/**
 * M07-C · **TB-M07-06 / D-155** — hiện lại **đúng bản đang có**, không tính lại.
 *
 * 🔴 Đây là nửa quan trọng của D-155, và nó không có trong `04_TO_BE_FLOWS`.
 * Chủ dự án chọn phương án B (cho tính lại + lưu lịch sử), nhưng nếu *"công bố
 * lại"* là **đường duy nhất** thì một cú bấm "Ẩn khỏi cổng" nhầm sẽ kéo theo
 * một lượt tính lại: danh sách 5 em có thể đổi, và bản cũ tuy còn trong lịch sử
 * nhưng **không còn là bản đang hiển thị**. Hai đường tách bạch thì người dùng
 * chọn được đúng thứ họ muốn, và câu chữ trên nút nói ra khác biệt ấy.
 *
 * Chỉ bật cờ: entries vẫn nằm nguyên trong `leaderboard_entries` suốt lúc ẩn
 * (bản cũ chỉ bị xóa bên trong `publish_leaderboard`), nên đây thật sự là một
 * lượt đổi khả năng nhìn thấy, không phải một lượt dựng lại.
 */
export async function republishLeaderboard(leaderboardId: string): Promise<AssessmentActionResult> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = leaderboardIdSchema.parse(leaderboardId);
    const { supabase } = await requireManageLeaderboard(context, parsed);
    const { data: updated, error } = await supabase.from("leaderboards").update({
      is_published: true,
      updated_by: context.profileId,
    }).eq("id", parsed).select("id");
    if (error) throw mapDatabaseError(error);
    assertRowsAffected(updated);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

/**
 * M07-C · **TB-M07-06 bước 4 / BR-M07-35** — xóa một bảng Top 5 **chưa từng
 * công bố**.
 *
 * `06_UI_UX_RECOMMENDATIONS` §3 ghi *"bản nháp Top 5 không có nút xóa dù policy
 * cho phép"* — tạo nhầm một bảng là nó nằm đó vĩnh viễn.
 *
 * 🔴 Phép thử là `published_at is null`, **không** phải `is_published`. Sau một
 * lượt "Ẩn khỏi cổng" thì `is_published` về `false` trong khi bảng đã có
 * snapshot: điều kiện cũ của policy cho qua, rồi khoá ngoại `on delete restrict`
 * của `leaderboard_entries` **trả lời hộ** bằng `23503` — đúng hình dạng F04 mà
 * đợt B vừa chữa ở cột điểm. Migration đợt này siết policy theo `published_at`;
 * lượt kiểm ở đây tồn tại để người dùng đọc được **lý do thật** thay vì câu
 * chung của `assertRowsAffected`.
 */
export async function deleteLeaderboard(leaderboardId: string): Promise<AssessmentActionResult> {
  const context = await assessmentsRouteContext();
  try {
    const parsed = leaderboardIdSchema.parse(leaderboardId);
    const { supabase } = await requireManageLeaderboard(context, parsed);
    const { data: row } = await supabase
      .from("leaderboards")
      .select("published_at")
      .eq("id", parsed)
      .maybeSingle();
    if (row?.published_at) {
      throw new AppError(
        "CONFLICT",
        "Bảng Top 5 này đã từng công bố nên không xóa được — danh sách đã chốt phải giữ lại. "
        + "Bạn có thể ẩn nó khỏi cổng phụ huynh.",
      );
    }
    const { data: removed, error } = await supabase
      .from("leaderboards")
      .delete()
      .eq("id", parsed)
      .select("id");
    if (error) throw mapDatabaseError(error);
    assertRowsAffected(removed);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}
