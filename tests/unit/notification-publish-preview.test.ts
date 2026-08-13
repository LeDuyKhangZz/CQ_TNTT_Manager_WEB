// @vitest-environment node
/**
 * M10-B · AC-06-01 — hộp xem lại trước khi gửi.
 *
 * `11` §5: *"thao tác nguy hiểm có ConfirmDialog nêu hậu quả bằng tên riêng"*.
 * Gửi thông báo đúng là thao tác nguy hiểm: nó chạm tới người khác và cho tới
 * đợt C thì không lùi được.
 */
import { describe, expect, it } from "vitest";
import { publishConfirmation, sendButtonLabel } from "@/features/notifications/publish-preview";

describe("publishConfirmation", () => {
  it("AC-06-01 — nêu phạm vi bằng TÊN RIÊNG, không phải 'bạn có chắc không'", () => {
    const confirmation = publishConfirmation({
      targetType: "class",
      targetLabel: "Ấu 1A",
      audienceCount: 27,
    });
    expect(confirmation.scopeLine).toContain("Ấu 1A");
    expect(confirmation.scopeLine).toContain("27");
  });

  it("AC-06-01 — con số nói ra ngay trên nút xác nhận", () => {
    expect(publishConfirmation({
      targetType: "sector",
      targetLabel: "Ngành Thiếu",
      audienceCount: 88,
    }).confirmLabel).toContain("88");
  });

  it("AC-06-01 — luôn cảnh báo không thu hồi được", () => {
    for (const count of [0, 1, 500, null]) {
      expect(publishConfirmation({
        targetType: "all",
        targetLabel: null,
        audienceCount: count,
      }).warning).toMatch(/không thu hồi được/i);
    }
  });

  it("phạm vi rỗng đổi hẳn giọng hộp thoại, không lẫn với ca bình thường", () => {
    const empty = publishConfirmation({ targetType: "students", targetLabel: null, audienceCount: 0 });
    const normal = publishConfirmation({ targetType: "students", targetLabel: null, audienceCount: 4 });
    expect(empty.emptyAudience).toBe(true);
    expect(normal.emptyAudience).toBe(false);
    expect(empty.heading).not.toBe(normal.heading);
    expect(empty.scopeLine).toMatch(/không có tài khoản nào đang hoạt động/i);
  });

  it("đếm hụt thì KHÔNG bịa một con số", () => {
    const confirmation = publishConfirmation({
      targetType: "committee",
      targetLabel: "Ban Phụng vụ",
      audienceCount: null,
    });
    // Người dùng sắp bấm "Xác nhận" dựa vào câu này; một con số bịa còn tệ hơn
    // là không có con số nào.
    expect(confirmation.scopeLine).toMatch(/chưa đếm được/i);
    expect(confirmation.confirmLabel).not.toMatch(/\d/);
    expect(confirmation.emptyAudience).toBe(false);
  });

  it("phạm vi không cần đối tượng vẫn nêu đúng tên phạm vi", () => {
    expect(publishConfirmation({
      targetType: "guardians",
      targetLabel: null,
      audienceCount: 120,
    }).scopeLine).toMatch(/phụ huynh/i);
  });
});

describe("sendButtonLabel", () => {
  it("hiện số người nhận ngay trên nút gửi khi đã đếm được", () => {
    expect(sendButtonLabel(42, false)).toContain("42");
  });

  it("chưa đếm được thì nút vẫn dùng được, chỉ không có số", () => {
    expect(sendButtonLabel(null, false)).toBe("Gửi thông báo");
  });

  it("phạm vi rỗng nói thẳng trên nút, trước cả hộp xác nhận", () => {
    expect(sendButtonLabel(0, false)).toMatch(/chưa có ai/i);
  });

  it("đang gửi thì nhãn đổi để nút không bị bấm lại", () => {
    expect(sendButtonLabel(42, true)).toBe("Đang gửi…");
  });
});
