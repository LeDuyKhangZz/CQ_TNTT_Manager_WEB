import { formatInTimeZone } from "date-fns-tz";

// DB lưu UTC; UI hiển thị Asia/Ho_Chi_Minh, định dạng dd/MM/yyyy (docs/04 §7, README).
export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

type DateInput = Date | string | number;

/** Định dạng ngày kiểu Việt Nam: dd/MM/yyyy theo giờ Asia/Ho_Chi_Minh. */
export function formatDateVi(value: DateInput): string {
  return formatInTimeZone(new Date(value), APP_TIME_ZONE, "dd/MM/yyyy");
}

/** Định dạng ngày giờ: dd/MM/yyyy HH:mm theo giờ Asia/Ho_Chi_Minh. */
export function formatDateTimeVi(value: DateInput): string {
  return formatInTimeZone(new Date(value), APP_TIME_ZONE, "dd/MM/yyyy HH:mm");
}
