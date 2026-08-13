// @vitest-environment node
/**
 * M10-C — câu lỗi tiếng Việt cho `ZodError`.
 *
 * 🔴 Lỗi này **giống hệt** thứ M07-A đã sửa cho module bảng điểm, và nó im
 * lặng: mọi câu chữ viết sẵn trong `schemas.ts` bị `failure()` nuốt thành
 * *"Không thể xử lý thông báo. Vui lòng thử lại."*. Không cửa kiểm nào bắt được
 * — lint, typecheck, build và cả bộ unit đều xanh, vì mã **chạy đúng**, chỉ nói
 * sai. Bài E2E của D-166 (bấm "Thu hồi" với ô lý do bỏ trống) là thứ tìm ra nó.
 */
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { describeNotificationZodIssues } from "@/features/notifications/zod-messages";
import {
  publishNotificationSchema,
  retractNotificationSchema,
} from "@/features/notifications/schemas";

function issuesOf(result: z.SafeParseReturnType<unknown, unknown>) {
  if (result.success) throw new Error("Mong đợi dữ liệu không hợp lệ");
  return result.error.issues;
}

describe("describeNotificationZodIssues", () => {
  it("giữ NGUYÊN câu do schemas.ts tự viết, không dịch lại", () => {
    const issues = issuesOf(retractNotificationSchema.safeParse({
      notificationId: "11111111-1111-4111-8111-111111111111",
      reason: "   ",
    }));
    expect(describeNotificationZodIssues(issues)).toBe("Vui lòng nêu lý do thu hồi.");
  });

  it("câu 'vui lòng chọn đối tượng nhận' cuối cùng cũng tới được người dùng", () => {
    const issues = issuesOf(publishNotificationSchema.safeParse({
      title: "Tiêu đề", content: "Nội dung", targetType: "class",
    }));
    expect(describeNotificationZodIssues(issues)).toContain("Vui lòng chọn đối tượng nhận.");
  });

  it("liên kết lạ nói rõ lý do thay vì 'thử lại'", () => {
    const issues = issuesOf(publishNotificationSchema.safeParse({
      title: "Tiêu đề", content: "Nội dung", targetType: "all", linkPath: "/sa-mac",
    }));
    expect(describeNotificationZodIssues(issues)).toContain("đã có trong hệ thống");
  });

  it("nhiều lỗi thì gộp, và không lặp lại cùng một câu", () => {
    const text = describeNotificationZodIssues([
      { path: ["title"], message: "Vui lòng nhập tiêu đề." },
      { path: ["content"], message: "Vui lòng nhập nội dung." },
      { path: ["title"], message: "Vui lòng nhập tiêu đề." },
    ]);
    expect(text).toBe("Vui lòng nhập tiêu đề. Vui lòng nhập nội dung.");
  });

  it("quá 3 lỗi thì nói ra phần bị cắt, không cắt im lặng", () => {
    const text = describeNotificationZodIssues([
      { path: ["title"], message: "Một." },
      { path: ["content"], message: "Hai." },
      { path: ["targetId"], message: "Ba." },
      { path: ["linkPath"], message: "Bốn." },
    ]);
    expect(text).toContain("và 1 lỗi khác");
  });

  it("câu sinh tự động của Zod được thay bằng nhãn ô tiếng Việt", () => {
    expect(describeNotificationZodIssues([{ path: ["reason"], message: "Required" }]))
      .toBe("Lý do thu hồi không hợp lệ.");
    expect(describeNotificationZodIssues([{ path: ["targetId"], message: "Invalid uuid" }]))
      .toBe("Đối tượng nhận không hợp lệ.");
  });

  it("ô không có nhãn vẫn ra một câu đọc được, không ra chuỗi rỗng", () => {
    expect(describeNotificationZodIssues([{ path: ["truong_la"], message: "Required" }]))
      .toBe("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.");
    expect(describeNotificationZodIssues([])).toBe("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.");
  });
});
