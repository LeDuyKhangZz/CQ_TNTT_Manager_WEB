import { formatInTimeZone } from "date-fns-tz";

// DB lưu UTC; UI hiển thị Asia/Ho_Chi_Minh, định dạng dd/MM/yyyy (docs/04 §7, README).
export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

type DateInput = Date | string | number;

/** Định dạng ngày kiểu Việt Nam: dd/MM/yyyy theo giờ Asia/Ho_Chi_Minh. */
export function formatDateVi(value: DateInput): string {
  return formatInTimeZone(new Date(value), APP_TIME_ZONE, "dd/MM/yyyy");
}

/**
 * Ngày **có thể chưa biết** — IMP-BULK-002 cho phép hồ sơ thiếu ngày sinh.
 *
 * 🔴 Không gộp vào `formatDateVi` bằng cách nới kiểu tham số: `new Date(null)`
 * ra 01/01/1970 chứ không ném lỗi, nên một chỗ gọi quên kiểm null sẽ in một ngày
 * **sai mà trông đúng** lên hồ sơ của một em thật. Tách hai hàm để trình biên
 * dịch bắt đúng chỗ nào đang cầm một ngày có thể trống.
 */
export function formatOptionalDateVi(
  value: DateInput | null | undefined,
  fallback = "chưa có",
): string {
  return value === null || value === undefined ? fallback : formatDateVi(value);
}

/** Định dạng ngày giờ: dd/MM/yyyy HH:mm theo giờ Asia/Ho_Chi_Minh. */
export function formatDateTimeVi(value: DateInput): string {
  return formatInTimeZone(new Date(value), APP_TIME_ZONE, "dd/MM/yyyy HH:mm");
}

/**
 * Hôm nay ở dạng `yyyy-MM-dd` theo giờ Việt Nam — dùng cho `<input type="date">`
 * và cho mọi phép so ngày với cột `date` của cơ sở dữ liệu.
 *
 * 🔴 KHÔNG dùng `new Date().toISOString().slice(0, 10)`: chuỗi đó là ngày **UTC**,
 * nên từ 00:00 tới 07:00 giờ Việt Nam nó trả về **ngày hôm qua**. Cột `date` trong
 * DB không mang múi giờ, và mốc kết thúc học kỳ 1 (D-71) là một ngày theo lịch
 * Việt Nam, nên so bằng UTC là lệch một ngày trong 7 giờ mỗi ngày.
 */
export function todayVi(): string {
  return formatInTimeZone(new Date(), APP_TIME_ZONE, "yyyy-MM-dd");
}

/**
 * Giá trị cho `<input type="datetime-local">`: `yyyy-MM-ddTHH:mm` theo giờ
 * Asia/Ho_Chi_Minh. Dùng khi nạp lại một mốc thời gian UTC vào form để sửa —
 * nếu để trình duyệt tự đổi thì nó dùng múi giờ máy, lệch với phần còn lại.
 */
export function toDateTimeLocalVi(value: DateInput): string {
  return formatInTimeZone(new Date(value), APP_TIME_ZONE, "yyyy-MM-dd'T'HH:mm");
}
