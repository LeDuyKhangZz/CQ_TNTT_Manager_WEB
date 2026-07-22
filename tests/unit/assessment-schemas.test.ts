import { describe, expect, it } from "vitest";
import { assessmentInputSchema, saveAssessmentScoresSchema } from "../../src/features/assessments/schemas";

const ID = "10000000-0000-4000-8000-000000000001";

describe("assessment schemas", () => {
  it("cho phép lớp chỉ tạo giữa kỳ và cuối kỳ với hệ số riêng", () => {
    expect(assessmentInputSchema.safeParse({ classId: ID, kind: "midterm", title: "Giữa kỳ", weight: 2 }).success).toBe(true);
    expect(assessmentInputSchema.safeParse({ classId: ID, kind: "final", title: "Cuối kỳ", weight: 3 }).success).toBe(true);
  });

  it("cho phép lặp loại kiểm tra và hệ số thập phân dương", () => {
    expect(assessmentInputSchema.safeParse({ classId: ID, kind: "custom", title: "Đợt 1", weight: 1.5 }).success).toBe(true);
    expect(assessmentInputSchema.safeParse({ classId: ID, kind: "custom", title: "Đợt 2", weight: 0.25 }).success).toBe(true);
  });

  it("chặn hệ số bằng 0 hoặc âm", () => {
    expect(assessmentInputSchema.safeParse({ classId: ID, kind: "midterm", title: "Giữa kỳ", weight: 0 }).success).toBe(false);
    expect(assessmentInputSchema.safeParse({ classId: ID, kind: "midterm", title: "Giữa kỳ", weight: -1 }).success).toBe(false);
  });

  it("cột chuyên cần bắt buộc chọn riêng Lễ hoặc Giáo lý", () => {
    expect(assessmentInputSchema.safeParse({ classId: ID, kind: "attendance", title: "Chuyên cần", weight: 1 }).success).toBe(false);
    expect(assessmentInputSchema.safeParse({ classId: ID, kind: "attendance", title: "Chuyên cần Lễ", weight: 1, attendanceComponent: "mass" }).success).toBe(true);
  });

  it("giữ điểm 0 khác null và chặn điểm ngoài thang 10", () => {
    expect(saveAssessmentScoresSchema.parse({ assessmentId: ID, scores: [{ enrollmentId: ID, score: 0 }] }).scores[0]?.score).toBe(0);
    expect(saveAssessmentScoresSchema.parse({ assessmentId: ID, scores: [{ enrollmentId: ID, score: null }] }).scores[0]?.score).toBeNull();
    expect(saveAssessmentScoresSchema.safeParse({ assessmentId: ID, scores: [{ enrollmentId: ID, score: 10.01 }] }).success).toBe(false);
  });
});
