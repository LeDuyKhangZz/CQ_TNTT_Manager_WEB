"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { promotionProposalSchema, promotionReviewSchema, type PromotionProposalInput, type PromotionReviewInput } from "../schemas";
import { canProposeForClass, canReviewSector } from "./permissions";

export type PromotionActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function failure(error: unknown): PromotionActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể xử lý chuyển lớp. Vui lòng thử lại." };
}

function mapDatabaseError(error: { code?: string; message?: string } | null): AppError {
  if (error?.code === "42501") return new AppError("FORBIDDEN");
  if (error?.code === "P0002" || error?.code === "23503") return new AppError("RESOURCE_NOT_FOUND");
  if (error?.code === "23505") return new AppError("CONFLICT", "Đề xuất này đã được xử lý.");
  if (error?.code === "23514" || error?.code === "22023") {
    return new AppError("VALIDATION_ERROR", "Lớp đích hoặc trạng thái chuyển lớp không hợp lệ.");
  }
  return new AppError("CONFLICT");
}

export async function proposePromotion(input: PromotionProposalInput): Promise<PromotionActionResult<{ id: string }>> {
  try {
    const parsed = promotionProposalSchema.parse(input);
    const context = await requireAuthContext("/promotions");
    const supabase = await createClient();
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("class_id")
      .eq("id", parsed.sourceEnrollmentId)
      .maybeSingle();
    if (!enrollment) throw new AppError("RESOURCE_NOT_FOUND");
    if (!(await canProposeForClass(context, supabase, enrollment.class_id))) throw new AppError("FORBIDDEN");
    const { data, error } = await supabase.rpc("propose_promotion", {
      p_source_enrollment_id: parsed.sourceEnrollmentId,
      p_proposed_status: parsed.proposedStatus,
      p_target_class_id: parsed.targetClassId ?? undefined,
      p_propose_trainee: parsed.proposeTrainee,
      p_note: parsed.note ?? undefined,
    });
    if (error || !data) throw mapDatabaseError(error);
    revalidatePath("/promotions");
    return { ok: true, data: { id: data } };
  } catch (error) {
    return failure(error);
  }
}

export async function reviewPromotion(input: PromotionReviewInput): Promise<PromotionActionResult<{ enrollmentId: string | null }>> {
  try {
    const parsed = promotionReviewSchema.parse(input);
    const context = await requireAuthContext("/promotions");
    const supabase = await createClient();
    const { data: review } = await supabase
      .from("promotion_reviews")
      .select("source_class_id, classes!promotion_reviews_source_class_id_fkey(grade_levels(sector_id))")
      .eq("id", parsed.reviewId)
      .maybeSingle();
    if (!review) throw new AppError("RESOURCE_NOT_FOUND");
    const sectorId = review.classes?.grade_levels?.sector_id ?? null;
    if (!canReviewSector(context, sectorId)) throw new AppError("FORBIDDEN");
    const { data, error } = await supabase.rpc("approve_promotion_review", {
      p_review_id: parsed.reviewId,
      p_decision: parsed.decision,
      p_target_class_id: parsed.targetClassId ?? undefined,
      p_note: parsed.note ?? undefined,
    });
    if (error) throw mapDatabaseError(error);
    revalidatePath("/promotions");
    revalidatePath("/students");
    return { ok: true, data: { enrollmentId: data } };
  } catch (error) {
    return failure(error);
  }
}

