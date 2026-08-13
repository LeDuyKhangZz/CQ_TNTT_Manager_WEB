import { describe, expect, it } from "vitest";
import {
  hasPromotionHistory,
  promotionEventActorName,
  promotionEventLabel,
  sortPromotionEvents,
  type PromotionReviewEvent,
} from "@/features/promotions/review-journal";

/**
 * M08-B — **D-157 / BR-M08-19 / AC-18**, phần tầng ứng dụng của nhật ký quyết
 * định. Phần *"lịch sử có bị mất khi gửi lại không"* đo ở pgTAP `046`, vì nó là
 * một câu hỏi về cơ sở dữ liệu.
 */

function event(
  eventNo: number,
  eventType: PromotionReviewEvent["eventType"],
  occurredAt: string,
  note: string | null = null,
): PromotionReviewEvent {
  return { eventNo, eventType, occurredAt, note, actorId: "profile-1", actorName: "Anna Đại Diện" };
}

describe("thứ tự kể chuyện", () => {
  it("sắp tăng dần theo bước, không phải mới nhất trước", () => {
    const sorted = sortPromotionEvents([
      event(3, "proposed", "2081-05-10T00:00:00Z"),
      event(1, "proposed", "2081-05-01T00:00:00Z"),
      event(4, "approved", "2081-05-12T00:00:00Z"),
      event(2, "rejected", "2081-05-05T00:00:00Z", "Chưa đủ chuyên cần"),
    ]);
    expect(sorted.map((item) => item.eventType)).toEqual([
      "proposed",
      "rejected",
      "proposed",
      "approved",
    ]);
  });

  it("🔴 hai bước CÙNG một giao dịch (D-159) vẫn đúng thứ tự dù thời điểm bằng nhau", () => {
    // Đường "Chuyển lớp" một nút ghi cả `proposed` lẫn `approved` trong cùng một
    // giao dịch, nên `now()` của hai dòng bằng nhau tới micro giây. Sắp theo thời
    // gian ở đây sẽ cho một thứ tự tuỳ hứng.
    const sameInstant = "2081-05-20T03:04:05.123456Z";
    const sorted = sortPromotionEvents([
      event(2, "approved", sameInstant),
      event(1, "proposed", sameInstant),
    ]);
    expect(sorted.map((item) => item.eventNo)).toEqual([1, 2]);
  });

  it("không sửa mảng gốc", () => {
    const input = [event(2, "approved", "2081-05-12T00:00:00Z"), event(1, "proposed", "2081-05-01T00:00:00Z")];
    sortPromotionEvents(input);
    expect(input[0].eventNo).toBe(2);
  });
});

describe("khi nào đáng hiện khối nhật ký", () => {
  it("một bước duy nhất thì KHÔNG hiện — nó chỉ lặp lại đúng thứ panel vừa ghi ở trên", () => {
    expect(hasPromotionHistory([])).toBe(false);
    expect(hasPromotionHistory([event(1, "proposed", "2081-05-01T00:00:00Z")])).toBe(false);
  });

  it("từ hai bước trở lên là có chuyện để kể", () => {
    expect(hasPromotionHistory([
      event(1, "proposed", "2081-05-01T00:00:00Z"),
      event(2, "rejected", "2081-05-05T00:00:00Z", "Chưa đủ chuyên cần"),
    ])).toBe(true);
  });
});

describe("nhãn từng bước", () => {
  it("nói ra VIỆC ĐÃ XẢY RA, không phải trạng thái", () => {
    expect(promotionEventLabel("proposed")).toContain("gửi đề xuất");
    expect(promotionEventLabel("approved")).toContain("duyệt");
    expect(promotionEventLabel("rejected")).toContain("từ chối");
  });

  it("loại lạ không làm vỡ màn hình", () => {
    expect(promotionEventLabel("khong-biet")).toBe("Thay đổi");
  });
});

/**
 * **M08-C, hạng mục 8** — tên người của từng bước, lấy từ cửa sổ hẹp
 * `list_promotion_actor_names`.
 */
describe("tên người của một bước", () => {
  const base = event(1, "proposed", "2081-05-01T00:00:00Z");

  it("tra được thì trả nguyên tên", () => {
    expect(promotionEventActorName(base)).toBe("Anna Đại Diện");
  });

  it("🔴 KHÔNG tra được thì trả null, không trả 'Không rõ'", () => {
    // "Không rõ" khẳng định một điều sai: hệ thống biết rõ ai, chỉ là người đang
    // xem không có quyền đọc tên ấy. Chỗ gọi đã in sẵn vai trò của bước.
    expect(promotionEventActorName({ ...base, actorName: null })).toBeNull();
  });

  it("chuỗi rỗng hay toàn dấu cách cũng coi như không có tên", () => {
    expect(promotionEventActorName({ ...base, actorName: "" })).toBeNull();
    expect(promotionEventActorName({ ...base, actorName: "   " })).toBeNull();
  });
});
