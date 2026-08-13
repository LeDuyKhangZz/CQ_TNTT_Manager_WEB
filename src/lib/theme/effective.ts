import { formatInTimeZone } from "date-fns-tz";
import { APP_TIME_ZONE } from "@/lib/dates";

/**
 * Điều kiện "đang có hiệu lực" — docs/.../10_APPROVED_THEME_RULES.md §4.
 *
 * 🔴 Điều kiện ngày PHẢI tính theo giờ Việt Nam, không theo giờ máy chủ.
 * SW-08 ghi nhận lỗi giờ máy chủ đã lặp ở 3 module — không được lặp lại ở đây.
 * Máy chủ đặt ở UTC: lúc 07:00 giờ VN ngày 5/9 thì UTC vẫn đang 00:00 ngày 5/9,
 * nhưng lúc 06:00 giờ VN ngày 5/9 thì UTC là 23:00 ngày 4/9 — phân công có
 * `starts_on = 2026-09-05` sẽ bị coi là chưa hiệu lực suốt buổi sáng.
 */

/** Hôm nay theo giờ Việt Nam, dạng `yyyy-MM-dd`. */
export function todayInVietnam(now: Date = new Date()): string {
  return formatInTimeZone(now, APP_TIME_ZONE, "yyyy-MM-dd");
}

/** Chuẩn hoá `date` hoặc `timestamptz` từ Postgres về `yyyy-MM-dd`. */
function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

/** `starts_on <= hôm nay` theo giờ Việt Nam. So sánh chuỗi ISO là đủ và đúng. */
export function hasStarted(startsOn: string, now?: Date): boolean {
  return toDateOnly(startsOn) <= todayInVietnam(now);
}

export type AssignmentLike = {
  is_active: boolean;
  starts_on: string;
  ends_on: string | null;
};

/**
 * Phân công (`role_assignments`, `class_staff_assignments`) đang có hiệu lực.
 * Điều kiện 4 (thuộc năm học `current`) và 5 (hồ sơ chưa lưu trữ) do tầng truy
 * vấn lọc — không kiểm được ở đây vì không có dữ liệu đó trong hàng phân công.
 */
export function isEffectiveAssignment(
  assignment: AssignmentLike,
  now?: Date,
): boolean {
  return (
    assignment.is_active === true &&
    assignment.ends_on === null &&
    hasStarted(assignment.starts_on, now)
  );
}

export type EnrollmentLike = {
  status: string;
  enrolled_on: string;
  ended_on: string | null;
};

/**
 * Ghi danh đang mở. `paused` VẪN tính — em vẫn thuộc lớp, chỉ tạm nghỉ, và
 * theme giữ nguyên ngành đó kèm badge "Tạm nghỉ" (10 §8).
 */
export const OPEN_ENROLLMENT_STATUSES = ["active", "paused"] as const;

export function isEffectiveEnrollment(
  enrollment: EnrollmentLike,
  now?: Date,
): boolean {
  return (
    (OPEN_ENROLLMENT_STATUSES as readonly string[]).includes(enrollment.status) &&
    enrollment.ended_on === null &&
    hasStarted(enrollment.enrolled_on, now)
  );
}
