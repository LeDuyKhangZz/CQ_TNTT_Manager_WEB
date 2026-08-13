import { describe, expect, it } from "vitest";
import {
  classifyPromotionDbError,
  describePromotionZodIssue,
  describePromotionZodIssues,
} from "@/features/promotions/db-errors";
import { promotionProposalSchema, promotionReviewSchema } from "@/features/promotions/schemas";

/**
 * M08-A — câu lỗi của module Chuyển lớp.
 *
 * 🔴 Đóng phần trừ điểm của `03_AUDIT_RESULTS` tiêu chí 6. Trước đợt này người
 * dùng đọc đúng **hai** câu cho **mười một** tên luật khác nhau mà RPC ném ra:
 * *"Lớp đích hoặc trạng thái chuyển lớp không hợp lệ."* (gộp sáu nguyên nhân) và
 * *"Không thể xử lý chuyển lớp. Vui lòng thử lại."* (nuốt mọi `ZodError`).
 *
 * Ca đáng giá nhất là `ENROLLMENT_NOT_OPEN`: câu cũ chỉ thẳng vào ô "Lớp đích",
 * nhưng lớp đích **không phải chỗ hỏng** — ghi danh đã đóng thì không đề xuất
 * nào hợp lệ cả. Người dùng đọc câu cũ sẽ đổi lớp đích rồi bấm lại, hỏng y hệt.
 */

describe("dịch lỗi cơ sở dữ liệu", () => {
  it("ghi danh đã đóng KHÔNG còn đọc thành 'lớp đích không hợp lệ'", () => {
    const result = classifyPromotionDbError({ code: "23514", message: "ENROLLMENT_NOT_OPEN" });
    expect(result.appCode).toBe("CONFLICT");
    expect(result.message).toContain("không còn mở");
    expect(result.message).not.toContain("Lớp đích");
  });

  it("lớp đích sai cấp vẫn nói về lớp đích — ca duy nhất câu cũ nói đúng", () => {
    const result = classifyPromotionDbError({ code: "23514", message: "PROMOTION_TARGET_INVALID" });
    expect(result.appCode).toBe("VALIDATION_ERROR");
    expect(result.message).toContain("Lớp đích");
  });

  it("đề xuất Dự trưởng sai chỗ nói ra ĐIỀU KIỆN, không nói 'dữ liệu không hợp lệ'", () => {
    const result = classifyPromotionDbError({ code: "23514", message: "TRAINEE_PROPOSAL_INVALID" });
    expect(result.message).toContain("Dự trưởng");
  });

  it("hai tên cùng tiền tố ENROLLMENT_NOT_ không đọc nhầm sang nhau", () => {
    expect(classifyPromotionDbError({ code: "P0002", message: "ENROLLMENT_NOT_FOUND" }).appCode)
      .toBe("RESOURCE_NOT_FOUND");
    expect(classifyPromotionDbError({ code: "23514", message: "ENROLLMENT_NOT_OPEN" }).appCode)
      .toBe("CONFLICT");
  });

  it("đã duyệt rồi thì nói ra hệ quả: ghi danh mới đã được tạo", () => {
    const result = classifyPromotionDbError({ code: "23505", message: "PROMOTION_ALREADY_APPROVED" });
    expect(result.message).toContain("đã được duyệt");
    expect(result.message).toContain("Ghi danh mới");
  });

  it("42501 trần (không kèm tên luật) vẫn ra câu quyền", () => {
    expect(classifyPromotionDbError({ code: "42501" }).appCode).toBe("FORBIDDEN");
  });

  it("lỗi lạ hoàn toàn không rò tên bảng/cột/SQL ra màn hình — SEC-14", () => {
    const result = classifyPromotionDbError({
      code: "XX000",
      message: 'relation "public.promotion_reviews" does not exist',
      details: "SELECT * FROM promotion_reviews",
    });
    expect(result.message).not.toContain("promotion_reviews");
    expect(result.message).not.toContain("SELECT");
  });

  it("không có lỗi nào thì vẫn trả một câu tiếng Việt, không trả undefined", () => {
    expect(classifyPromotionDbError(null).message.length).toBeGreaterThan(0);
  });
});

describe("câu lỗi Zod không còn bị nuốt", () => {
  it("ba câu tự viết trong schemas.ts được giữ NGUYÊN VĂN", () => {
    const result = promotionProposalSchema.safeParse({
      sourceEnrollmentId: "11111111-1111-4111-8111-111111111111",
      proposedStatus: "recommended_promote",
      targetClassId: null,
      proposeTrainee: false,
      note: null,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(describePromotionZodIssues(result.error.issues)).toBe("Vui lòng chọn lớp đích.");
  });

  it("đề xuất Dự trưởng kèm lớp đích nói đúng lý do bị chặn", () => {
    const result = promotionProposalSchema.safeParse({
      sourceEnrollmentId: "11111111-1111-4111-8111-111111111111",
      proposedStatus: "recommended_promote",
      targetClassId: "22222222-2222-4222-8222-222222222222",
      proposeTrainee: true,
      note: null,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(describePromotionZodIssues(result.error.issues)).toContain("Dự trưởng");
  });

  it("id không phải UUID cho câu nêu TÊN TRƯỜNG, không phải 'Vui lòng thử lại'", () => {
    const result = promotionReviewSchema.safeParse({ reviewId: "abc", decision: "approve" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const message = describePromotionZodIssues(result.error.issues);
    expect(message).toContain("Đề xuất");
    expect(message).not.toContain("thử lại");
  });

  it("ghi chú quá dài nói ra giới hạn bằng số", () => {
    const result = promotionProposalSchema.safeParse({
      sourceEnrollmentId: "11111111-1111-4111-8111-111111111111",
      proposedStatus: "temporarily_pause",
      targetClassId: null,
      proposeTrainee: false,
      note: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(describePromotionZodIssues(result.error.issues)).toContain("1000");
  });

  it("gộp tối đa ba câu rồi ĐẾM phần còn lại, không giấu đi", () => {
    const many = [
      { code: "invalid_type", path: ["proposedStatus"] },
      { code: "invalid_type", path: ["targetClassId"] },
      { code: "invalid_type", path: ["decision"] },
      { code: "invalid_type", path: ["note"] },
    ];
    expect(describePromotionZodIssues(many)).toContain("và 1 lỗi khác");
  });

  it("trường lạ vẫn ra tiếng Việt chứ không ra chuỗi tiếng Anh của zod", () => {
    const text = describePromotionZodIssue({
      code: "invalid_type",
      path: ["somethingUnknown"],
      message: "Expected string, received number",
    });
    expect(text).not.toContain("Expected");
  });
});
