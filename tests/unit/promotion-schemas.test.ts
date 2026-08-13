import { describe, expect, it } from "vitest";
import {
  promotionBatchProposalSchema,
  promotionProposalSchema,
  promotionReviewSchema,
} from "../../src/features/promotions/schemas";
import { PROMOTION_BATCH_LIMIT } from "../../src/features/promotions/constants";

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

/**
 * **AC-15 — từ chối phải nêu lý do, và server phải từ chối chứ không chỉ client.**
 *
 * AC-15 viết nguyên văn: *"hiện lỗi 'Vui lòng nêu lý do từ chối.' **và** server
 * cũng từ chối (Zod), không chỉ chặn ở client"*. Bộ test này là chỗ đo vế server.
 */
describe("AC-15 — lý do khi từ chối", () => {
  it("từ chối mà bỏ trống ô ý kiến thì KHÔNG hợp lệ", () => {
    expect(() => promotionReviewSchema.parse({
      reviewId: sourceEnrollmentId, decision: "reject", note: null,
    })).toThrow();
  });

  it("một ô toàn dấu cách cũng KHÔNG phải một lý do", () => {
    expect(() => promotionReviewSchema.parse({
      reviewId: sourceEnrollmentId, decision: "reject", note: "   ",
    })).toThrow();
  });

  it("câu lỗi là câu AC-15 viết sẵn, không phải một câu chung chung", () => {
    const result = promotionReviewSchema.safeParse({
      reviewId: sourceEnrollmentId, decision: "reject", note: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message))
        .toContain("Vui lòng nêu lý do từ chối.");
    }
  });

  it("từ chối có lý do thì hợp lệ", () => {
    expect(promotionReviewSchema.parse({
      reviewId: sourceEnrollmentId, decision: "reject", note: "Chưa đủ chuyên cần",
    }).note).toBe("Chưa đủ chuyên cần");
  });

  it("🔴 DUYỆT thì vẫn KHÔNG bắt buộc lý do — AC-15 chỉ nói về từ chối", () => {
    // Luật riêng cho ca thiếu bí tích (AC-16 vế ba) nằm ở `reviewPromotion` vì
    // nó phải đọc `warning_snapshot`; trộn vào đây là bắt mọi lượt duyệt phải
    // gõ một câu, thứ không tài liệu nào đòi.
    expect(promotionReviewSchema.parse({
      reviewId: sourceEnrollmentId, decision: "approve", note: null,
    }).decision).toBe("approve");
  });
});

/** **AC-20 / TO-BE 2** — đề xuất hàng loạt không được lỏng hơn đề xuất từng em. */
describe("schema đề xuất hàng loạt", () => {
  const ids = [sourceEnrollmentId, targetClassId];

  it("nhận danh sách có lớp đích", () => {
    expect(promotionBatchProposalSchema.parse({
      enrollmentIds: ids, proposedStatus: "recommended_promote", targetClassId,
    }).enrollmentIds).toHaveLength(2);
  });

  it("danh sách rỗng thì không hợp lệ", () => {
    expect(() => promotionBatchProposalSchema.parse({
      enrollmentIds: [], proposedStatus: "recommended_promote", targetClassId,
    })).toThrow();
  });

  it(`vượt trần ${PROMOTION_BATCH_LIMIT} em thì không hợp lệ`, () => {
    const tooMany = Array.from({ length: PROMOTION_BATCH_LIMIT + 1 }, () => sourceEnrollmentId);
    expect(() => promotionBatchProposalSchema.parse({
      enrollmentIds: tooMany, proposedStatus: "recommended_promote", targetClassId,
    })).toThrow();
  });

  it("lên lớp mà thiếu lớp đích thì không hợp lệ — cùng luật với đường từng em", () => {
    expect(() => promotionBatchProposalSchema.parse({
      enrollmentIds: ids, proposedStatus: "recommended_promote", targetClassId: null,
    })).toThrow();
  });

  it("Tạm nghỉ mà mang lớp đích thì không hợp lệ", () => {
    expect(() => promotionBatchProposalSchema.parse({
      enrollmentIds: ids, proposedStatus: "temporarily_pause", targetClassId,
    })).toThrow();
  });

  it("Tạm nghỉ không lớp đích thì hợp lệ", () => {
    expect(promotionBatchProposalSchema.parse({
      enrollmentIds: ids, proposedStatus: "temporarily_pause", targetClassId: null,
    }).proposedStatus).toBe("temporarily_pause");
  });

  it("id không phải UUID thì không hợp lệ, không chạm cơ sở dữ liệu", () => {
    expect(() => promotionBatchProposalSchema.parse({
      enrollmentIds: ["'; drop table --"], proposedStatus: "temporarily_pause", targetClassId: null,
    })).toThrow();
  });
});
