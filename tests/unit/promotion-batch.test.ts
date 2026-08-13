import { describe, expect, it } from "vitest";
import {
  batchCandidatesOf,
  batchTargetScope,
  describeBatchConsequence,
  describeBatchOverflow,
  describeMixedGrades,
  isBatchEligible,
  summarizeBatchOutcome,
  takeBatchSelection,
  type BatchEligibleRow,
  type PromotionBatchCandidate,
} from "@/features/promotions/batch-proposal";
import { PROMOTION_BATCH_LIMIT } from "@/features/promotions/constants";

/**
 * M08-C — luật của đề xuất hàng loạt (**TO-BE 2 / AC-20**).
 *
 * Bốn điều được canh ở đây, mỗi điều chữa một cách hỏng khác nhau:
 *
 *   · **Ai được chọn** (BR-M08-16) — đề xuất **đã duyệt** không được đưa vào một
 *     lượt ghi đè; ghi danh đã đóng cũng không, vì RPC sẽ ném `ENROLLMENT_NOT_OPEN`.
 *   · **Trần 60 không cắt im lặng** — cắt mà không nói là để người dùng tưởng đã
 *     đề xuất cho cả xứ đoàn trong khi mới được 60 em (bài học M12-B).
 *   · **Trộn nhiều cấp** — "Chọn tất cả" trên bộ lọc *"Tất cả lớp"* gom em của
 *     nhiều cấp, và **không có lớp đích nào đúng cho tất cả**.
 *   · **Kết quả nêu TÊN, không nêu số** — AC-20 vế hai đòi những em bị bỏ qua
 *     phải được liệt kê tên.
 */

function makeRow(overrides: Partial<BatchEligibleRow> = {}): BatchEligibleRow {
  return {
    enrollmentId: "enr-1",
    studentName: "Maria Nguyễn Thị An",
    className: "Ấu 1B",
    classId: "class-au-1b",
    gradeLevelId: "grade-au-1",
    nextGradeLevelId: "grade-au-2",
    sectionCode: "B",
    yearStart: "2080-08-01",
    canPropose: true,
    enrollmentOpen: true,
    finalStatus: null,
    ...overrides,
  };
}

function makeCandidate(overrides: Partial<PromotionBatchCandidate> = {}): PromotionBatchCandidate {
  return {
    enrollmentId: "enr-1",
    studentName: "Maria Nguyễn Thị An",
    className: "Ấu 1B",
    classId: "class-au-1b",
    gradeLevelId: "grade-au-1",
    nextGradeLevelId: "grade-au-2",
    sectionCode: "B",
    yearStart: "2080-08-01",
    overwrites: false,
    ...overrides,
  };
}

describe("ai được đưa vào lượt hàng loạt", () => {
  it("em chưa đề xuất thì được", () => {
    expect(isBatchEligible(makeRow())).toBe(true);
  });

  it("BR-M08-16: đề xuất ĐÃ DUYỆT bị loại — không có đường ghi đè hàng loạt", () => {
    expect(isBatchEligible(makeRow({ finalStatus: "approved" }))).toBe(false);
  });

  it("đề xuất đang chờ hoặc bị từ chối vẫn được (BR-M08-16)", () => {
    expect(isBatchEligible(makeRow({ finalStatus: "pending" }))).toBe(true);
    expect(isBatchEligible(makeRow({ finalStatus: "rejected" }))).toBe(true);
  });

  it("ghi danh đã đóng bị loại — RPC sẽ ném ENROLLMENT_NOT_OPEN", () => {
    expect(isBatchEligible(makeRow({ enrollmentOpen: false }))).toBe(false);
  });

  it("người không phải đại diện lớp bị loại", () => {
    expect(isBatchEligible(makeRow({ canPropose: false }))).toBe(false);
  });

  it("đánh dấu em nào sẽ bị GHI ĐÈ đề xuất cũ", () => {
    const candidates = batchCandidatesOf([
      makeRow({ enrollmentId: "a", finalStatus: null }),
      makeRow({ enrollmentId: "b", finalStatus: "pending" }),
      makeRow({ enrollmentId: "c", finalStatus: "approved" }),
    ]);
    expect(candidates.map((item) => item.enrollmentId)).toEqual(["a", "b"]);
    expect(candidates.map((item) => item.overwrites)).toEqual([false, true]);
  });

  it("mang theo cấp lớp và nhánh — dữ liệu mà em ở TRANG SAU không có chỗ nào khác để lấy", () => {
    const [candidate] = batchCandidatesOf([makeRow()]);
    expect(candidate.gradeLevelId).toBe("grade-au-1");
    expect(candidate.nextGradeLevelId).toBe("grade-au-2");
    expect(candidate.sectionCode).toBe("B");
  });
});

describe("trần 60 em một lượt", () => {
  it("dưới trần thì không cắt gì và không nói gì", () => {
    const candidates = Array.from({ length: 10 }, (_, index) =>
      makeCandidate({ enrollmentId: `enr-${index}` }));
    const taken = takeBatchSelection(candidates);
    expect(taken.ids).toHaveLength(10);
    expect(taken.dropped).toBe(0);
    expect(describeBatchOverflow(taken.dropped)).toBeNull();
  });

  it("vượt trần thì cắt VÀ NÓI RA số em còn lại", () => {
    const candidates = Array.from({ length: PROMOTION_BATCH_LIMIT + 7 }, (_, index) =>
      makeCandidate({ enrollmentId: `enr-${index}` }));
    const taken = takeBatchSelection(candidates);
    expect(taken.ids).toHaveLength(PROMOTION_BATCH_LIMIT);
    expect(taken.dropped).toBe(7);
    expect(describeBatchOverflow(taken.dropped)).toContain("còn 7 em nữa");
  });
});

describe("lớp đích chung", () => {
  it("mọi em cùng một cấp và cùng nhánh thì giữ nguyên cả hai", () => {
    const scope = batchTargetScope([
      makeCandidate({ enrollmentId: "a" }),
      makeCandidate({ enrollmentId: "b" }),
    ]);
    expect(scope?.mixedGrades).toBe(false);
    expect(scope?.sectionCode).toBe("B");
    expect(describeMixedGrades(scope)).toBeNull();
  });

  it("cùng cấp nhưng khác nhánh thì KHÔNG đoán hộ nhánh nào", () => {
    const scope = batchTargetScope([
      makeCandidate({ enrollmentId: "a", sectionCode: "A" }),
      makeCandidate({ enrollmentId: "b", sectionCode: "B" }),
    ]);
    expect(scope?.mixedGrades).toBe(false);
    expect(scope?.sectionCode).toBeNull();
  });

  it("🔴 trộn nhiều CẤP thì nói ra ngay, không để 55 lượt gọi hỏng rồi mới báo", () => {
    const scope = batchTargetScope([
      makeCandidate({ enrollmentId: "a", gradeLevelId: "grade-au-1" }),
      makeCandidate({ enrollmentId: "b", gradeLevelId: "grade-thieu-2" }),
    ]);
    expect(scope?.mixedGrades).toBe(true);
    expect(describeMixedGrades(scope)).toContain("nhiều cấp lớp khác nhau");
  });

  it("chưa chọn ai thì không có phạm vi nào", () => {
    expect(batchTargetScope([])).toBeNull();
    expect(describeMixedGrades(null)).toBeNull();
  });
});

describe("câu hậu quả của hộp xem lại", () => {
  it("nêu trạng thái và lớp đích bằng tên", () => {
    const text = describeBatchConsequence({
      count: 28,
      statusLabel: "Đề nghị lên lớp",
      targetLabel: "Ấu 2B · 2081-2082",
      overwriteCount: 0,
    });
    expect(text).toContain("Đề nghị lên lớp");
    expect(text).toContain("Ấu 2B · 2081-2082");
    expect(text).toContain("28 em");
    expect(text).not.toContain("GHI ĐÈ");
  });

  it("🔴 nói ra khi lượt này sẽ GHI ĐÈ đề xuất đang chờ của người khác", () => {
    const text = describeBatchConsequence({
      count: 28,
      statusLabel: "Đề nghị lên lớp",
      targetLabel: "Ấu 2B · 2081-2082",
      overwriteCount: 3,
    });
    expect(text).toContain("3 em đã có đề xuất");
    expect(text).toContain("GHI ĐÈ");
  });

  it("trạng thái không có lớp đích thì không bịa ra một lớp", () => {
    const text = describeBatchConsequence({
      count: 4,
      statusLabel: "Tạm nghỉ",
      targetLabel: null,
      overwriteCount: 0,
    });
    expect(text).not.toContain("sang lớp");
  });
});

describe("câu kết quả", () => {
  it("thành công hết thì nêu CON SỐ THẬT, không nói 'Đã lưu'", () => {
    const summary = summarizeBatchOutcome({ succeeded: 28, failed: [] });
    expect(summary.tone).toBe("success");
    expect(summary.text).toContain("28 đề xuất");
  });

  it("AC-20 vế hai: em bị bỏ qua được nêu ĐÍCH DANH kèm lý do", () => {
    const summary = summarizeBatchOutcome({
      succeeded: 26,
      failed: [
        { studentName: "Anna Trần Thị Bích", message: "Đề xuất của em này đã được duyệt." },
        { studentName: "Gioan Lê Văn Cường", message: "Ghi danh của em này không còn mở." },
      ],
    });
    expect(summary.tone).toBe("danger");
    expect(summary.text).toContain("Đã gửi 26 đề xuất");
    expect(summary.text).toContain("Anna Trần Thị Bích");
    expect(summary.text).toContain("Gioan Lê Văn Cường");
    expect(summary.text).toContain("đã được duyệt");
  });

  it("danh sách lỗi dài thì nêu 5 tên rồi gộp phần còn lại, không cắt im lặng", () => {
    const failed = Array.from({ length: 9 }, (_, index) => ({
      studentName: `Em số ${index}`,
      message: "Không hợp lệ.",
    }));
    const summary = summarizeBatchOutcome({ succeeded: 0, failed });
    expect(summary.text).toContain("Không gửi được đề xuất nào");
    expect(summary.text).toContain("Em số 4");
    expect(summary.text).not.toContain("Em số 5");
    expect(summary.text).toContain("và 4 em khác");
  });
});
