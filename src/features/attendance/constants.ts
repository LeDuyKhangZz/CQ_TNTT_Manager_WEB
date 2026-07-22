import type { Enums } from "@/types/database";

export type AttendanceStatus = Enums<"attendance_status">;
export type StaffAttendanceStatus = Enums<"staff_attendance_status">;
export type MeetingType = Enums<"meeting_type">;
export type AttendanceSessionStatus = Enums<"attendance_session_status">;

// DB enum tiếng Anh, label tiếng Việt (AGENTS §7).
export const ATTENDANCE_STATUS_LABELS: Readonly<Record<AttendanceStatus, string>> = {
  present: "Có mặt",
  late: "Đi trễ",
  left_early: "Về sớm",
  excused_absence: "Vắng có phép",
  unexcused_absence: "Vắng không phép",
};

export const STAFF_ATTENDANCE_STATUS_LABELS: Readonly<Record<StaffAttendanceStatus, string>> = {
  present: "Có mặt",
  excused_absence: "Vắng có phép",
  unexcused_absence: "Vắng không phép",
};

export const MEETING_TYPE_LABELS: Readonly<Record<MeetingType, string>> = {
  thursday: "Thứ Năm",
  sunday: "Chúa nhật",
};

export const SESSION_STATUS_LABELS: Readonly<Record<AttendanceSessionStatus, string>> = {
  open: "Chưa điểm danh",
  in_progress: "Đang điểm danh",
  completed: "Đã chốt",
  locked: "Đã khóa",
};

export const ATTENDANCE_STATUS_ORDER: readonly AttendanceStatus[] = [
  "present",
  "late",
  "left_early",
  "excused_absence",
  "unexcused_absence",
];

export const STAFF_ATTENDANCE_STATUS_ORDER: readonly StaffAttendanceStatus[] = [
  "present",
  "excused_absence",
  "unexcused_absence",
];

/** Vắng theo nghĩa thống kê: có phép hay không phép đều là vắng. */
export function isAbsent(status: AttendanceStatus): boolean {
  return status === "excused_absence" || status === "unexcused_absence";
}

/** D-29: chỉ thứ Năm và Chúa nhật có sinh hoạt. */
export function meetingTypeForDate(isoDate: string): MeetingType | null {
  const day = new Date(`${isoDate}T00:00:00`).getDay();
  if (day === 4) return "thursday";
  if (day === 0) return "sunday";
  return null;
}
