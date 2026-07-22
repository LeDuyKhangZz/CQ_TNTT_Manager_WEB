import { describe, expect, it } from "vitest";
import { promotionProposalSchema, promotionReviewSchema } from "../../src/features/promotions/schemas";

const sourceEnrollmentId = "00000000-0000-4000-8000-000000000001";
const targetClassId = "00000000-0000-4000-8000-000000000002";

describe("promotion schemas", () => {
  it("nhận đề xuất lên lớp có lớp đích", () => {
    expect(promotionProposalSchema.parse({
      sourceEnrollmentId, proposedStatus: "recommended_promote",
      targetClassId, proposeTrainee: false,
    }).targetClassId).toBe(targetClassId);
  });

  it("từ chối lên lớp thường nếu thiếu lớp đích", () => {
    expect(() => promotionProposalSchema.parse({
      sourceEnrollmentId, proposedStatus: "recommended_promote",
      targetClassId: null, proposeTrainee: false,
    })).toThrow();
  });

  it("nhận đề xuất Dự trưởng không có lớp đích", () => {
    expect(promotionProposalSchema.parse({
      sourceEnrollmentId, proposedStatus: "recommended_promote",
      targetClassId: null, proposeTrainee: true,
    }).proposeTrainee).toBe(true);
  });

  it("tạm nghỉ không được mang lớp đích", () => {
    expect(() => promotionProposalSchema.parse({
      sourceEnrollmentId, proposedStatus: "temporarily_pause",
      targetClassId, proposeTrainee: false,
    })).toThrow();
  });

  it("giới hạn ghi chú duyệt", () => {
    expect(() => promotionReviewSchema.parse({
      reviewId: sourceEnrollmentId, decision: "approve", note: "x".repeat(1001),
    })).toThrow();
  });
});
