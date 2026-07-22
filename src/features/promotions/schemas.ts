import { z } from "zod";
import { PROMOTION_PROPOSAL_STATUSES } from "./constants";

const optionalUuid = z.string().uuid().nullable().optional();
const optionalNote = z.string().trim().max(1000).nullable().optional();

export const promotionProposalSchema = z.object({
  sourceEnrollmentId: z.string().uuid(),
  proposedStatus: z.enum(PROMOTION_PROPOSAL_STATUSES),
  targetClassId: optionalUuid,
  proposeTrainee: z.boolean().default(false),
  note: optionalNote,
}).superRefine((value, context) => {
  const needsTarget = value.proposedStatus === "recommended_promote" || value.proposedStatus === "recommended_repeat";
  if (value.proposeTrainee && (value.proposedStatus !== "recommended_promote" || value.targetClassId)) {
    context.addIssue({ code: "custom", message: "Đề xuất Dự trưởng không chọn lớp đích." });
  } else if (needsTarget && !value.proposeTrainee && !value.targetClassId) {
    context.addIssue({ code: "custom", message: "Vui lòng chọn lớp đích." });
  } else if (!needsTarget && (value.targetClassId || value.proposeTrainee)) {
    context.addIssue({ code: "custom", message: "Trạng thái này không có lớp đích." });
  }
});

export const promotionReviewSchema = z.object({
  reviewId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  targetClassId: optionalUuid,
  note: optionalNote,
});

export type PromotionProposalInput = z.infer<typeof promotionProposalSchema>;
export type PromotionReviewInput = z.infer<typeof promotionReviewSchema>;

