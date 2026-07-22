"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
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
  type AssessmentInput,
  type PublishAssessmentInput,
  type SaveAssessmentScoresInput,
  type ResetAttendanceOverrideInput,
  type StudentCommentInput,
  type LeaderboardInput,
  type LeaderboardOperationInput,
  type UpdateAssessmentInput,
} from "../schemas";
import { canCommentClass, canGradeClass, canManageLeaderboard } from "./permissions";

export type AssessmentActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function failure(error: unknown): AssessmentActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể lưu bảng điểm. Vui lòng thử lại." };
}

function mapDatabaseError(error: { code?: string; message?: string } | null): AppError {
  if (error?.message?.includes("GRADEBOOK_LOCKED")) return new AppError("GRADEBOOK_LOCKED");
  if (error?.code === "42501") return new AppError("FORBIDDEN");
  if (error?.code === "23503" || error?.code === "P0002") return new AppError("RESOURCE_NOT_FOUND");
  if (error?.code === "23514" || error?.code === "22023" || error?.code === "22P02") return new AppError("VALIDATION_ERROR");
  if (error?.code === "23505") return new AppError("CONFLICT");
  return new AppError("CONFLICT");
}

function revalidateGradebook(classId: string) {
  revalidatePath("/results");
  revalidatePath(`/results/${classId}`);
}

async function requireGradeClass(classId: string) {
  const context = await requireAuthContext(`/results/${classId}`);
  const supabase = await createClient();
  if (!(await canGradeClass(context, supabase, classId))) throw new AppError("FORBIDDEN");
  return { context, supabase };
}

async function requireGradeAssessment(assessmentId: string) {
  const context = await requireAuthContext("/results");
  const supabase = await createClient();
  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, class_id, academic_year_id")
    .eq("id", assessmentId)
    .maybeSingle();
  if (!assessment) throw new AppError("RESOURCE_NOT_FOUND");
  if (!(await canGradeClass(context, supabase, assessment.class_id))) throw new AppError("FORBIDDEN");
  return { context, supabase, assessment };
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
  try {
    const parsed = assessmentInputSchema.parse(input);
    const { context, supabase } = await requireGradeClass(parsed.classId);
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
    revalidateGradebook(parsed.classId);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function updateAssessment(input: UpdateAssessmentInput): Promise<AssessmentActionResult> {
  try {
    const parsed = updateAssessmentSchema.parse(input);
    const { context, supabase, assessment } = await requireGradeAssessment(parsed.assessmentId);
    if (assessment.class_id !== parsed.classId) throw new AppError("VALIDATION_ERROR");
    const payload = assessmentPayload(parsed, context.profileId, assessment.academic_year_id);
    const { error } = await supabase
      .from("assessments")
      .update({
        kind: payload.kind,
        title: payload.title,
        assessment_date: payload.assessment_date,
        weight: payload.weight,
        attendance_component: payload.attendance_component,
        updated_by: payload.updated_by,
      })
      .eq("id", parsed.assessmentId);
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(parsed.classId);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteAssessment(assessmentId: string): Promise<AssessmentActionResult> {
  try {
    const parsed = assessmentIdSchema.parse(assessmentId);
    const { supabase, assessment } = await requireGradeAssessment(parsed);
    const { error } = await supabase.from("assessments").delete().eq("id", parsed);
    if (error?.code === "23503") {
      throw new AppError("CONFLICT", "Cột đã có điểm nên không thể xóa. Hãy giữ lại để bảo toàn lịch sử.");
    }
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(assessment.class_id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function saveAssessmentScores(input: SaveAssessmentScoresInput): Promise<AssessmentActionResult<{ count: number }>> {
  try {
    const parsed = saveAssessmentScoresSchema.parse(input);
    const { supabase, assessment } = await requireGradeAssessment(parsed.assessmentId);
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

export async function setAssessmentPublished(input: PublishAssessmentInput): Promise<AssessmentActionResult> {
  try {
    const parsed = publishAssessmentSchema.parse(input);
    const { context, supabase, assessment } = await requireGradeAssessment(parsed.assessmentId);
    const { error } = await supabase
      .from("assessments")
      .update({ is_published: parsed.published, updated_by: context.profileId })
      .eq("id", parsed.assessmentId);
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(assessment.class_id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function refreshAttendanceScores(assessmentId: string): Promise<AssessmentActionResult<{ count: number }>> {
  try {
    const { assessmentId: parsed } = attendanceAssessmentActionSchema.parse({ assessmentId });
    const { supabase, assessment } = await requireGradeAssessment(parsed);
    const { data, error } = await supabase.rpc("refresh_attendance_assessment_scores", { p_assessment_id: parsed });
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(assessment.class_id);
    return { ok: true, data: { count: data } };
  } catch (error) {
    return failure(error);
  }
}

export async function resetAttendanceScoreOverride(input: ResetAttendanceOverrideInput): Promise<AssessmentActionResult> {
  try {
    const parsed = resetAttendanceOverrideSchema.parse(input);
    const { supabase, assessment } = await requireGradeAssessment(parsed.assessmentId);
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
  try {
    const parsed = studentCommentInputSchema.parse(input);
    const context = await requireAuthContext("/results");
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

export async function deleteStudentComment(commentId: string): Promise<AssessmentActionResult> {
  try {
    const parsed = studentCommentIdSchema.parse(commentId);
    const context = await requireAuthContext("/results");
    const supabase = await createClient();
    const { data: comment } = await supabase
      .from("student_comments")
      .select("class_id")
      .eq("id", parsed)
      .maybeSingle();
    if (!comment) throw new AppError("RESOURCE_NOT_FOUND");
    if (!(await canCommentClass(context, supabase, comment.class_id))) throw new AppError("FORBIDDEN");
    const { error } = await supabase.from("student_comments").delete().eq("id", parsed);
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(comment.class_id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function lockGradebook(classId: string): Promise<AssessmentActionResult> {
  try {
    const { classId: parsed } = gradebookLockInputSchema.parse({ classId });
    await requireAuthContext(`/results/${parsed}`);
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
  try {
    const { classId: parsed } = gradebookLockInputSchema.parse({ classId });
    const context = await requireAuthContext(`/results/${parsed}`);
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

async function requireManageLeaderboard(leaderboardId: string) {
  const context = await requireAuthContext("/results");
  const supabase = await createClient();
  const { data: leaderboard } = await supabase
    .from("leaderboards")
    .select("id, class_id, source_type")
    .eq("id", leaderboardId)
    .maybeSingle();
  if (!leaderboard) throw new AppError("RESOURCE_NOT_FOUND");
  if (!(await canManageLeaderboard(context, supabase, leaderboard.class_id))) throw new AppError("FORBIDDEN");
  return { context, supabase, leaderboard };
}

export async function createLeaderboard(input: LeaderboardInput): Promise<AssessmentActionResult<{ id: string }>> {
  try {
    const parsed = leaderboardInputSchema.parse(input);
    const context = await requireAuthContext(`/results/${parsed.classId}`);
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
    revalidateGradebook(parsed.classId);
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
  try {
    const parsed = leaderboardOperationSchema.parse(input);
    const { supabase } = await requireManageLeaderboard(parsed.leaderboardId);
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
  try {
    const parsed = leaderboardOperationSchema.parse(input);
    const { supabase, leaderboard } = await requireManageLeaderboard(parsed.leaderboardId);
    const { data, error } = await supabase.rpc("publish_leaderboard", {
      p_leaderboard_id: parsed.leaderboardId,
      p_custom_scores: customScoresPayload(parsed),
    });
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(leaderboard.class_id);
    return { ok: true, data: { count: data } };
  } catch (error) {
    return failure(error);
  }
}

export async function unpublishLeaderboard(leaderboardId: string): Promise<AssessmentActionResult> {
  try {
    const parsed = leaderboardIdSchema.parse(leaderboardId);
    const { context, supabase, leaderboard } = await requireManageLeaderboard(parsed);
    const { error } = await supabase.from("leaderboards").update({
      is_published: false,
      updated_by: context.profileId,
    }).eq("id", parsed);
    if (error) throw mapDatabaseError(error);
    revalidateGradebook(leaderboard.class_id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}
