/**
 * Nhật ký quyết định chuyển lớp — **M08-B, D-157 / BR-M08-19 / AC-18**.
 *
 * `03_AUDIT_RESULTS` §4.3: gửi lại một đề xuất bị từ chối **ghi đè sạch**
 * `reviewed_by` · `reviewed_at` · `review_note`, nên câu *"Trưởng ngành A từ chối
 * ngày … vì chưa đủ chuyên cần"* biến mất không dấu vết. Chủ dự án chốt **bảng
 * riêng chỉ-ghi-thêm** (`public.promotion_review_events`) thay vì cột `history`
 * jsonb mà `04_TO_BE_FLOWS` khuyến nghị.
 *
 * File **thuần** — luật sắp xếp và câu chữ kiểm được bằng unit test thường.
 *
 * ✅ **M08-C — tên người đã hiện, và phụ thuộc mà M08-B để ngỏ đã được ĐO.**
 * Bản M08-B ghi ở đây: *"hạng mục 8 có một phụ thuộc chưa được đo: RLS của
 * `profiles` phải cho nhân sự đọc `display_name` của nhân sự khác"*. Đo rồi, và
 * câu trả lời là **KHÔNG** — `profiles_select_self_or_global` chỉ mở cho chính
 * mình hoặc `app.can_global_read()`, tức Trưởng ngành và Giáo lý viên đại diện,
 * hai người dùng chính của trang, **không đọc được tên ai cả**. Chủ dự án chốt
 * mở một **cửa sổ hẹp** (`public.list_promotion_actor_names`, migration
 * `20260808000100`) thay vì nới `profiles`.
 *
 * ⚠️ `actorName` vì thế **có thể vắng** ngay cả khi `actorId` có mặt: tài khoản
 * đã bị xoá (`actor_id` là `on delete set null`), hoặc dòng nhật ký thuộc một đề
 * xuất người xem đọc được nhưng người thao tác lại không nằm trong cửa sổ. Mọi
 * chỗ dùng phải chịu được `null` và in **vai trò của bước** thay cho một dấu `—`
 * trống, đúng cách `WeeklyPlanEditor` đã xử lý ở M09-A.
 */

export const PROMOTION_EVENT_TYPES = ["proposed", "approved", "rejected"] as const;
export type PromotionEventType = (typeof PROMOTION_EVENT_TYPES)[number];

export interface PromotionReviewEvent {
  eventNo: number;
  eventType: PromotionEventType;
  note: string | null;
  actorId: string | null;
  /** **M08-C** — tên hiển thị lấy từ cửa sổ hẹp; `null` khi không tra được. */
  actorName: string | null;
  occurredAt: string;
}

/** Câu mở đầu mỗi dòng nhật ký. Nói ra **việc đã xảy ra**, không phải trạng thái. */
export const PROMOTION_EVENT_LABELS: Readonly<Record<PromotionEventType, string>> = {
  proposed: "Đại diện lớp gửi đề xuất",
  approved: "Trưởng ngành duyệt",
  rejected: "Trưởng ngành từ chối",
};

export function promotionEventLabel(eventType: string): string {
  return PROMOTION_EVENT_LABELS[eventType as PromotionEventType] ?? "Thay đổi";
}

/**
 * Sắp theo `event_no` tăng dần — **thứ tự kể chuyện**, không phải mới nhất trước.
 *
 * Nhật ký này trả lời câu *"chuyện gì đã xảy ra với đề xuất của em"*, mà câu ấy
 * chỉ đọc được theo chiều thời gian: gửi → từ chối vì … → gửi lại → duyệt. Đảo
 * ngược lại là bắt người đọc dựng lại mạch chuyện trong đầu.
 *
 * `event_no` chứ không phải `occurred_at`: hai dòng của **cùng một giao dịch**
 * (đường "Chuyển lớp" một nút của D-159) có `now()` bằng nhau đúng tới micro giây,
 * nên sắp theo thời gian sẽ cho một thứ tự tuỳ hứng.
 */
export function sortPromotionEvents(
  events: readonly PromotionReviewEvent[],
): PromotionReviewEvent[] {
  return [...events].sort((left, right) => left.eventNo - right.eventNo);
}

/**
 * Có đáng hiện khối nhật ký không.
 *
 * Một dòng `proposed` duy nhất **không** đáng: nó chỉ lặp lại đúng thứ panel đã
 * ghi ngay phía trên ("Đề xuất hiện tại · Gửi ngày …"), và một khối lịch sử chỉ
 * kể lại hiện tại thì làm loãng đúng thứ nó sinh ra để làm nổi bật.
 */
export function hasPromotionHistory(events: readonly PromotionReviewEvent[]): boolean {
  return events.length > 1;
}

/**
 * Người của một dòng nhật ký — **M08-C, hạng mục 8**.
 *
 * 🔴 Khi không tra được tên, hàm trả `null` chứ **không** trả `"—"` hay
 * `"Không rõ"`. Lý do: chỗ gọi đã in sẵn **vai trò của bước** (*"Trưởng ngành
 * từ chối"*), nên thêm một dấu gạch vào sau nó là thêm nhiễu mà không thêm tin —
 * còn `"Không rõ"` thì tệ hơn một mức, vì nó **khẳng định** một điều sai: hệ
 * thống biết rõ ai, chỉ là người đang xem không có quyền đọc tên ấy.
 */
export function promotionEventActorName(event: PromotionReviewEvent): string | null {
  return event.actorName?.trim() ? event.actorName : null;
}
