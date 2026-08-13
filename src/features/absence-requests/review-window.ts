import { shiftIsoDate } from "@/features/attendance/constants";

/**
 * Cửa sổ "đơn xin nghỉ tuần này" của màn hình Giáo lý viên — TB-06 / AC-F13-1.
 *
 * ±7 ngày quanh hôm nay, đúng như `04_TO_BE_FLOWS` §TB-06 phương án A. Nhìn về
 * **trước** chứ không chỉ nhìn tới: một đơn cho Chúa nhật vừa rồi mà chưa ai
 * bấm "Ghi nhận" vẫn phải nằm trong tầm mắt, nếu không nó lặng lẽ rơi khỏi màn
 * hình đúng lúc phụ huynh đang chờ phản hồi — và đó chính là hình dạng của lỗi
 * F13-I2 mà đợt này đi chữa.
 *
 * Hàm **thuần**, nhận chuỗi ngày thay vì tự gọi `new Date()`: cùng lý do đã ghi
 * ở `mostRecentMeetingDate` (TB-01) — máy chủ chạy UTC, người dùng ở Việt Nam,
 * và một hàm đọc đồng hồ hệ thống chỉ test được bằng cách đổi đồng hồ.
 */
export function absenceReviewWindow(
  todayIso: string,
  days = 7,
): { start: string; end: string } {
  return { start: shiftIsoDate(todayIso, -days), end: shiftIsoDate(todayIso, days) };
}
