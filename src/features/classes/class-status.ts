/**
 * Trạng thái lớp và mốc học kỳ 1 — M02-B, TB-F08 / BR-M02-N12, D-71 / D-115.
 *
 * File thuần (không import gì) để kiểm được bằng unit test. Cùng khuôn với
 * `academic-years/admin-feedback.ts` và `year-lifecycle.ts`.
 */

export const CLASS_STATUS_LABELS: Record<string, string> = {
  active: "Đang hoạt động",
  inactive: "Tạm ngưng",
  closed: "Đã đóng",
};

/** Nhãn tiếng Việt; giá trị lạ thì trả nguyên văn thay vì bịa. */
export function classStatusLabel(status: string): string {
  return CLASS_STATUS_LABELS[status] ?? status;
}

export type ClassStatusBadgeVariant = "success" | "warning" | "secondary";

export function classStatusBadgeVariant(status: string): ClassStatusBadgeVariant {
  if (status === "active") return "success";
  if (status === "inactive") return "warning";
  return "secondary";
}

/**
 * Lớp nào cần huy hiệu trạng thái trong danh sách `/classes` (BR-M02-N12).
 *
 * Chỉ lớp **lệch chuẩn**. 19/19 lớp đều `active` là chuyện thường ngày; gắn huy
 * hiệu "Đang hoạt động" lên cả 19 thẻ thì huy hiệu mất hết giá trị báo hiệu, đúng
 * lúc cần nó nhất — lớp bị tạm ngưng nằm lẫn giữa 18 lớp đang chạy.
 */
export function needsStatusBadge(status: string): boolean {
  return status !== "active";
}

/**
 * Đã qua mốc kết thúc học kỳ 1 chưa. Cả hai tham số là `yyyy-MM-dd` nên so sánh
 * chuỗi là so sánh ngày — dạng này xếp theo thứ tự từ điển trùng với thứ tự thời
 * gian, và tránh hẳn việc dựng `Date` rồi lệch múi giờ.
 *
 * `null` (chưa khai báo mốc — D-116 cho phép) ⇒ **false**: chưa biết mốc thì không
 * được cảnh báo. Cảnh báo bịa còn tệ hơn không cảnh báo.
 */
export function isPastSemester1(
  semester1EndDate: string | null | undefined,
  today: string,
): boolean {
  if (!semester1EndDate) return false;
  return today > semester1EndDate;
}

/**
 * Câu cảnh báo cho lớp Dự trưởng khi đã qua mốc học kỳ 1 — **D-115**.
 *
 * 🔴 Chủ dự án chốt 2026-07-25: qua mốc thì **chỉ cảnh báo, không tự đóng lớp**,
 * theo nguyên tắc "không tự động quyết định mục vụ thay người phụ trách"
 * (`docs/03` §1). Vì vậy hàm này trả **câu chữ**, không trả một hành động — và
 * không có trigger hay tác vụ nền nào đứng sau nó.
 *
 * Câu chữ phải nói ra **việc phải làm** chứ không chỉ nêu sự kiện: người đọc cần
 * biết mình được quyền quyết định và quyết định ở đâu.
 */
export function semester1Notice(
  semester1EndDate: string | null | undefined,
  today: string,
  formatDate: (value: string) => string,
): { title: string; detail: string } | null {
  if (!isPastSemester1(semester1EndDate, today)) return null;
  return {
    title: `Đã qua mốc kết thúc học kỳ 1 (${formatDate(semester1EndDate!)})`,
    detail:
      "Lớp Dự trưởng chỉ sinh hoạt trong học kỳ 1. Hệ thống không tự đóng lớp — nếu lớp đã kết thúc, hãy chuyển trạng thái trong mục Cài đặt lớp.",
  };
}
