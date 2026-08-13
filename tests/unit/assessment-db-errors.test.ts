import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  classifyAssessmentDbError,
  describeAssessmentZodIssues,
} from "@/features/assessments/db-errors";
import {
  assessmentInputSchema,
  leaderboardInputSchema,
  saveAssessmentScoresSchema,
} from "@/features/assessments/schemas";

function issuesOf(schema: z.ZodTypeAny, value: unknown) {
  const result = schema.safeParse(value);
  if (result.success) throw new Error("Dữ liệu này lẽ ra phải bị từ chối");
  return result.error.issues;
}

/**
 * M07-A — đóng phần trừ điểm *"`ZodError` bị nuốt"* của `03_AUDIT_RESULTS`
 * (ảnh hưởng F02 · F03 · F06 · F09 · F13 · F15).
 */
describe("assessment db errors", () => {
  it("giữ NGUYÊN VĂN câu tiếng Việt đã viết trong schemas.ts", () => {
    const issues = issuesOf(assessmentInputSchema, {
      classId: "11111111-1111-4111-8111-111111111111",
      kind: "attendance",
      title: "Chuyên cần HK1",
      weight: 1,
      attendanceComponent: null,
    });
    expect(describeAssessmentZodIssues(issues)).toContain("Điểm chuyên cần phải chọn Thánh lễ hoặc Giáo lý.");
  });

  it("câu đặt ở tham số thứ hai của .min()/.positive() cũng được giữ — chỗ khuôn của M06 bỏ sót", () => {
    const issues = issuesOf(assessmentInputSchema, {
      classId: "11111111-1111-4111-8111-111111111111",
      kind: "quiz_15m",
      title: "   ",
      weight: 0,
    });
    const message = describeAssessmentZodIssues(issues);
    expect(message).toContain("Vui lòng nhập tên cột điểm.");
    expect(message).toContain("Hệ số phải lớn hơn 0.");
  });

  it("lỗi zod sinh bằng tiếng Anh được dịch theo tên trường người dùng đang nhìn", () => {
    const issues = issuesOf(leaderboardInputSchema, {
      classId: "11111111-1111-4111-8111-111111111111",
      title: "x".repeat(121),
      sourceType: "final_average",
    });
    expect(describeAssessmentZodIssues(issues)).toBe("Tên không được vượt quá 120.");
  });

  it("ô điểm sai trong mảng lồng gọi tên 'Điểm', không gọi tên 'Bảng điểm'", () => {
    const issues = issuesOf(saveAssessmentScoresSchema, {
      assessmentId: "11111111-1111-4111-8111-111111111111",
      scores: [
        { enrollmentId: "22222222-2222-4222-8222-222222222222", score: 4 },
        { enrollmentId: "33333333-3333-4333-8333-333333333333", score: 42 },
      ],
    });
    expect(describeAssessmentZodIssues(issues)).toBe("Điểm không được vượt quá 10.");
  });

  it("gộp tối đa ba câu và ĐẾM RA phần còn lại thay vì giấu đi", () => {
    const message = describeAssessmentZodIssues([
      { code: "custom", message: "Lỗi một." },
      { code: "custom", message: "Lỗi hai." },
      { code: "custom", message: "Lỗi ba." },
      { code: "custom", message: "Lỗi bốn." },
      { code: "custom", message: "Lỗi năm." },
    ]);
    expect(message).toBe("Lỗi một. Lỗi hai. Lỗi ba. (và 2 lỗi khác)");
  });

  it("không lặp lại một câu giống nhau cho 50 ô cùng sai", () => {
    const issues = Array.from({ length: 50 }, () => ({ code: "custom", message: "Điểm phải từ 0 đến 10." }));
    expect(describeAssessmentZodIssues(issues)).toBe("Điểm phải từ 0 đến 10.");
  });

  it("dịch tên luật do migration ném ra", () => {
    expect(classifyAssessmentDbError({ message: "GRADEBOOK_LOCKED", code: "42501" })).toEqual({
      appCode: "GRADEBOOK_LOCKED",
      message: "Bảng điểm đã bị khóa. Chỉ Quản trị viên hệ thống mở lại được.",
    });
    expect(classifyAssessmentDbError({ message: "TOP5_DISABLED", code: "42501" }).appCode).toBe("FORBIDDEN");
    expect(classifyAssessmentDbError({ message: "LEADERBOARD_NO_DATA", code: "23514" }).message)
      .toContain("Chưa đủ dữ liệu để xếp hạng");
  });

  it("ATTENDANCE_ASSESSMENT_NOT_FOUND không bị nuốt bởi ASSESSMENT_NOT_FOUND", () => {
    // Chuỗi thứ hai là **chuỗi con** của chuỗi thứ nhất; đảo thứ tự trong bảng dò
    // là mọi lỗi cột chuyên cần đọc thành câu của cột điểm thường.
    expect(classifyAssessmentDbError({ message: "ATTENDANCE_ASSESSMENT_NOT_FOUND", code: "P0002" }).message)
      .toContain("cột điểm chuyên cần");
    expect(classifyAssessmentDbError({ message: "ASSESSMENT_NOT_FOUND", code: "P0002" }).message)
      .not.toContain("chuyên cần");
  });

  it("GRADEBOOK_NOT_LOCKED không bị nhầm thành GRADEBOOK_LOCKED", () => {
    expect(classifyAssessmentDbError({ message: "GRADEBOOK_NOT_LOCKED", code: "P0002" }).appCode).toBe("CONFLICT");
  });

  it("lỗi lạ hoàn toàn vẫn có câu tiếng Việt, không lộ SQL", () => {
    const failure = classifyAssessmentDbError({ code: "XX000", message: "cache lookup failed for relation 1234" });
    expect(failure.message).toBe("Không thể lưu bảng điểm. Vui lòng thử lại.");
    expect(failure.message).not.toContain("relation");
  });
});
