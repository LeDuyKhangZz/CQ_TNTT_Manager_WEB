import { describe, expect, it } from "vitest";
import {
  ensureTeachingPlanSchema,
  expectedUpdatedAtSchema,
  teachingPlanItemInputSchema,
  updateTeachingPlanItemSchema,
} from "../../src/features/teaching-plans/schemas";
import { TEACHING_MATERIAL_ACCEPT } from "../../src/features/teaching-plans/constants";

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

  /**
   * 🔴 **M06-B / D-146 — bài này đổi kỳ vọng, và đó là chủ ý.**
   *
   * `07_IMPLEMENTATION_IMPACT` §1 hạng mục 4 gọi thẳng `updateTeachingPlanItem`
   * là thay đổi **breaking**: từ nay lượt sửa phải mang theo phiên bản mình đang
   * giữ. Một lượt sửa **không** có `expectedUpdatedAt` chính là lượt ghi đè mù mà
   * D-146 sinh ra để chặn, nên nó phải bị từ chối ngay ở biên.
   */
  const VERSION = "2026-09-01T08:30:00.123456+00:00";

  it("update bắt buộc item id hợp lệ và phiên bản đang giữ", () => {
    expect(updateTeachingPlanItemSchema.safeParse({
      itemId: ITEM_ID,
      teachingPlanId: PLAN_ID,
      plannedDate: "2026-09-06",
      title: "Bài sửa",
      teacherStaffId: STAFF_ID,
      itemType: "lesson",
      expectedUpdatedAt: VERSION,
    }).success).toBe(true);
  });

  it("thiếu phiên bản thì từ chối — đó chính là lượt ghi đè mù (D-146)", () => {
    expect(updateTeachingPlanItemSchema.safeParse({
      itemId: ITEM_ID,
      teachingPlanId: PLAN_ID,
      plannedDate: "2026-09-06",
      title: "Bài sửa",
      teacherStaffId: STAFF_ID,
      itemType: "lesson",
    }).success).toBe(false);
  });

  /**
   * PostgREST trả `timestamptz` kèm **hậu tố lệch giờ** (`+00:00`), không phải
   * `Z`. `z.string().datetime()` mặc định chỉ nhận `Z` ⇒ thiếu `offset: true`
   * thì **mọi** lượt sửa hợp lệ đều chết ở biên, và câu lỗi sẽ nói về một trường
   * mà người dùng chưa từng nhìn thấy.
   */
  it("nhận đúng dạng thời gian PostgREST trả về, kể cả micro giây", () => {
    expect(expectedUpdatedAtSchema.safeParse(VERSION).success).toBe(true);
    expect(expectedUpdatedAtSchema.safeParse("2026-09-01T08:30:00+00:00").success).toBe(true);
    expect(expectedUpdatedAtSchema.safeParse("2026-09-01T08:30:00.123Z").success).toBe(true);
    expect(expectedUpdatedAtSchema.safeParse("2026-09-01 08:30:00").success).toBe(false);
    expect(expectedUpdatedAtSchema.safeParse("").success).toBe(false);
  });

  it("tên giáo án tối đa 150 ký tự", () => {
    expect(ensureTeachingPlanSchema.safeParse({ classId: PLAN_ID, title: "a".repeat(151) }).success).toBe(false);
  });

  // 🔴 Khẳng định `TEACHING_MATERIAL_MAX_BYTES === 5 MB` đã bị **xoá khỏi bài
  // này**, không phải nới ra cho qua: trần dời sang `material-limits.ts` với
  // con số 4 MB (M06-A), và bài canh trần mới — cùng bài canh nó phải nằm dưới
  // trần nền tảng — nằm ở `teaching-plan-material-limits.test.ts`.
  it("allowlist tài liệu giữ nguyên từ Phase 4", () => {
    expect(TEACHING_MATERIAL_ACCEPT).toContain("application/pdf");
    expect(TEACHING_MATERIAL_ACCEPT).toContain("text/plain");
  });
});
