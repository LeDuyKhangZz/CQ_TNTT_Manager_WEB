// @vitest-environment node
/**
 * M10-A · AC-02-01 / AC-02-02 — người gửi phải biết thông báo tới được bao
 * nhiêu người, và phải biết **ngay** khi nó không tới ai.
 */
import { describe, expect, it } from "vitest";
import { markAllFeedback, publishFeedback } from "@/features/notifications/publish-feedback";

describe("publishFeedback", () => {
  it("AC-02-01 — nói ra số người nhận thật", () => {
    const feedback = publishFeedback(37);
    expect(feedback.tone).toBe("success");
    expect(feedback.text).toContain("37");
    expect(feedback.resetForm).toBe(true);
  });

  it("AC-02-02 — gửi vào hư không KHÔNG được trông như một lần gửi thành công", () => {
    const feedback = publishFeedback(0);
    expect(feedback.tone).not.toBe("success");
    expect(feedback.text).toMatch(/chưa tới người nhận nào/i);
  });

  it("AC-02-02 — ca 0 người giữ lại chữ đã gõ để chọn lại phạm vi", () => {
    // Xoá trắng biểu mẫu ở đây là bắt người dùng gõ lại toàn bộ nội dung chỉ
    // vì họ chọn nhầm một ô.
    expect(publishFeedback(0).resetForm).toBe(false);
  });

  it("một người nhận vẫn nói ra con số, không dùng câu chung chung", () => {
    expect(publishFeedback(1).text).toContain("1");
  });

  it("đếm hụt thì không đoán bừa một con số", () => {
    const feedback = publishFeedback(-1);
    expect(feedback.tone).toBe("success");
    expect(feedback.text).toBe("Đã gửi thông báo.");
    expect(feedback.text).not.toMatch(/\d/);
  });
});

describe("markAllFeedback — SW-04", () => {
  it("nói ra số dòng thật sự đổi", () => {
    const feedback = markAllFeedback(5);
    expect(feedback.tone).toBe("success");
    expect(feedback.text).toContain("5");
  });

  it("không có gì để đánh dấu thì nói đúng như vậy, không báo thành công", () => {
    const feedback = markAllFeedback(0);
    expect(feedback.tone).toBe("info");
    expect(feedback.text).toMatch(/không có/i);
  });
});
