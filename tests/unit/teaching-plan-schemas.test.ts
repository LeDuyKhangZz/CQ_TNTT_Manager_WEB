import { describe, expect, it } from "vitest";
import {
  ensureTeachingPlanSchema,
  teachingPlanItemInputSchema,
  updateTeachingPlanItemSchema,
} from "../../src/features/teaching-plans/schemas";
import { TEACHING_MATERIAL_ACCEPT, TEACHING_MATERIAL_MAX_BYTES } from "../../src/features/teaching-plans/constants";

const PLAN_ID = "10000000-0000-4000-8000-000000000001";
const ITEM_ID = "10000000-0000-4000-8000-000000000002";
const STAFF_ID = "10000000-0000-4000-8000-000000000003";

describe("teaching plan schemas", () => {
  it("nhận bài học đủ ngày, tên và người dạy", () => {
    expect(teachingPlanItemInputSchema.safeParse({
      teachingPlanId: PLAN_ID,
      plannedDate: "2026-09-06",
      title: "Bài mở đầu",
      teacherStaffId: STAFF_ID,
      itemType: "lesson",
    }).success).toBe(true);
  });

  it("chặn bài học chưa có người dạy", () => {
    const result = teachingPlanItemInputSchema.safeParse({
      teachingPlanId: PLAN_ID,
      plannedDate: "2026-09-06",
      title: "Bài mở đầu",
      itemType: "lesson",
    });
    expect(result.success).toBe(false);
  });

  it("cho phép mục kiểm tra chưa phân công", () => {
    expect(teachingPlanItemInputSchema.safeParse({
      teachingPlanId: PLAN_ID,
      plannedDate: "2026-09-13",
      title: "Kiểm tra đầu kỳ",
      itemType: "assessment",
    }).success).toBe(true);
  });

  it("chuẩn hóa text trống thành null", () => {
    const result = teachingPlanItemInputSchema.parse({
      teachingPlanId: PLAN_ID,
      plannedDate: "2026-09-06",
      title: "Bài mở đầu",
      teacherStaffId: STAFF_ID,
      itemType: "lesson",
      preparation: "   ",
    });
    expect(result.preparation).toBeNull();
  });

  it("update bắt buộc item id hợp lệ", () => {
    expect(updateTeachingPlanItemSchema.safeParse({
      itemId: ITEM_ID,
      teachingPlanId: PLAN_ID,
      plannedDate: "2026-09-06",
      title: "Bài sửa",
      teacherStaffId: STAFF_ID,
      itemType: "lesson",
    }).success).toBe(true);
  });

  it("tên giáo án tối đa 150 ký tự", () => {
    expect(ensureTeachingPlanSchema.safeParse({ classId: PLAN_ID, title: "a".repeat(151) }).success).toBe(false);
  });

  it("allowlist tài liệu khớp giới hạn Phase 4", () => {
    expect(TEACHING_MATERIAL_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(TEACHING_MATERIAL_ACCEPT).toContain("application/pdf");
    expect(TEACHING_MATERIAL_ACCEPT).toContain("text/plain");
  });
});
