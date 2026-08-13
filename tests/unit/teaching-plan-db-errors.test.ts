import { describe, expect, it } from "vitest";
import {
  classifyTeachingPlanDbError,
  describeZodIssue,
  describeZodIssues,
} from "../../src/features/teaching-plans/db-errors";
import {
  ensureTeachingPlanSchema,
  teachingPlanItemInputSchema,
} from "../../src/features/teaching-plans/schemas";

const PLAN_ID = "10000000-0000-4000-8000-000000000001";

describe("dịch lỗi cơ sở dữ liệu của giáo án (M06-A · TB-M06-02)", () => {
  it("ngày ngoài năm học nói đúng việc phải làm — AC-06", () => {
    const result = classifyTeachingPlanDbError({
      code: "23514",
      message: 'TEACHING_PLAN_DATE_OUTSIDE_YEAR',
    });
    expect(result.appCode).toBe("VALIDATION_ERROR");
    expect(result.message).toContain("năm học");
    expect(result.message).not.toContain("Vui lòng thử lại");
  });

  it("người dạy ngoài đội ngũ lớp nói đúng việc phải làm — AC-07", () => {
    const result = classifyTeachingPlanDbError({
      code: "23514",
      message: 'TEACHING_PLAN_TEACHER_OUT_OF_CLASS',
    });
    expect(result.message).toContain("đội ngũ lớp");
    expect(result.message).toContain("Nhân sự");
  });

  it("trùng ngày vẫn giữ câu cũ — AC-05", () => {
    const result = classifyTeachingPlanDbError({
      code: "23505",
      message: 'duplicate key value violates unique constraint "teaching_plan_items_one_per_date"',
    });
    expect(result.appCode).toBe("CONFLICT");
    expect(result.message).toContain("Ngày này đã có một mục giáo án");
  });

  /**
   * 🔴 TB-04 — đây là lỗi hình thức "câu trả lời đúng cho câu hỏi khác".
   * Bản cũ gán cứng câu về **ngày** cho mọi mã `23505`, nên hai người cùng bấm
   * "Tạo giáo án" thì người sau đọc *"Ngày này đã có một mục giáo án."* trong
   * khi biểu mẫu tạo giáo án **chỉ có đúng một ô tên**, không có ô ngày nào.
   */
  it("trùng kế hoạch của lớp KHÔNG nói về ngày — TB-04", () => {
    const result = classifyTeachingPlanDbError({
      code: "23505",
      message: 'duplicate key value violates unique constraint "teaching_plans_class_id_key"',
    });
    expect(result.message).toContain("kế hoạch giảng dạy");
    expect(result.message).not.toContain("Ngày");
  });

  it("bài học thiếu người dạy ở tầng ràng buộc DB", () => {
    const result = classifyTeachingPlanDbError({
      code: "23514",
      message: 'new row violates check constraint "teaching_plan_lesson_has_teacher"',
    });
    expect(result.message).toBe("Bài học phải có người dạy.");
  });

  it("42501 thành FORBIDDEN có câu riêng của module", () => {
    const result = classifyTeachingPlanDbError({ code: "42501", message: "permission denied" });
    expect(result.appCode).toBe("FORBIDDEN");
    expect(result.message).toContain("quyền");
  });

  it("lỗi lạ vẫn có mã ổn định, không ném ra ngoài", () => {
    expect(classifyTeachingPlanDbError(null).appCode).toBe("VALIDATION_ERROR");
    expect(classifyTeachingPlanDbError({ code: "XX000" }).appCode).toBe("VALIDATION_ERROR");
  });

  it("đọc được cả trường `details` của PostgREST", () => {
    // PostgREST hay đặt tên ràng buộc ở `details` chứ không ở `message`.
    const result = classifyTeachingPlanDbError({
      code: "23505",
      message: "duplicate key value violates unique constraint",
      details: "Key (class_id)=(…) already exists — teaching_plans_class_id_key",
    });
    expect(result.message).toContain("kế hoạch giảng dạy");
  });
});

describe("dịch lỗi Zod của giáo án (M06-A · TB-03)", () => {
  /**
   * 🔴 Bài chạy qua **schema thật**, không dựng `issue` bằng tay: thứ cần chứng
   * minh là *"câu đã viết trong `schemas.ts` từ Phase 4 nay ra được tới màn
   * hình"*, mà một `issue` tự chế thì chứng minh nhầm chuyện khác.
   */
  it("giữ nguyên văn câu nghiệp vụ đã viết trong schema", () => {
    const parsed = teachingPlanItemInputSchema.safeParse({
      teachingPlanId: PLAN_ID,
      plannedDate: "2026-09-06",
      title: "Bài mở đầu",
      itemType: "lesson",
    });
    expect(parsed.success).toBe(false);
    expect(describeZodIssues(parsed.error!.issues)).toBe("Bài học phải có người dạy.");
  });

  it("thiếu tên bài thì GỌI TÊN trường, không nói 'Vui lòng thử lại'", () => {
    const parsed = teachingPlanItemInputSchema.safeParse({
      teachingPlanId: PLAN_ID,
      plannedDate: "2026-09-06",
      title: "   ",
      teacherStaffId: "10000000-0000-4000-8000-000000000003",
      itemType: "lesson",
    });
    expect(parsed.success).toBe(false);
    const message = describeZodIssues(parsed.error!.issues);
    expect(message).toContain("Tên bài");
    expect(message).not.toContain("Vui lòng thử lại");
  });

  it("tên giáo án quá dài nói ra con số giới hạn", () => {
    const parsed = ensureTeachingPlanSchema.safeParse({ classId: PLAN_ID, title: "a".repeat(151) });
    expect(parsed.success).toBe(false);
    expect(describeZodIssues(parsed.error!.issues)).toContain("150");
  });

  it("nhiều lỗi thì gộp tối đa ba câu và ĐẾM RA phần còn lại", () => {
    const issues = [
      { code: "too_small", path: ["title"] },
      { code: "invalid_string", path: ["plannedDate"] },
      { code: "too_big", path: ["objectives"], maximum: 4000 },
      { code: "too_big", path: ["game"], maximum: 2000 },
      { code: "too_big", path: ["song"], maximum: 1000 },
    ];
    const message = describeZodIssues(issues);
    expect(message).toContain("và 2 lỗi khác");
  });

  it("trường lạ không sinh ra câu tiếng Anh của zod", () => {
    const message = describeZodIssue({ code: "too_small", path: ["khongCoTrongBang"] });
    expect(message).toBe("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.");
  });
});
