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

/**
 * Trạng thái **hiển thị** của một buổi — M05-A / TB-02.
 *
 * Khác `attendance_session_status` của cơ sở dữ liệu ở hai điểm, và cả hai đều
 * cố ý: khóa là **hàm của thời gian** (`locked_at` so với bây giờ) nên không
 * code path nào ghi `status='locked'`; còn `unlocked` không có trong enum vì mở
 * khóa chỉ đặt `unlocked_at`, `status` vẫn là `completed`.
 */
export type AttendanceSessionState = AttendanceSessionStatus | "unlocked";

export const SESSION_STATE_LABELS: Readonly<Record<AttendanceSessionState, string>> = {
  ...SESSION_STATUS_LABELS,
  unlocked: "Đã mở khóa",
};

export interface SessionStateInput {
  status: AttendanceSessionStatus;
  lockedAt: string | null;
  unlockedAt: string | null;
  /** Mốc so sánh, tính bằng mili giây. Truyền vào để hàm thuần và test được. */
  now: number;
}

/**
 * Suy ra trạng thái hiển thị ở **một chỗ duy nhất** (TB-02, gốc rễ F07-I1).
 *
 * 🔴 Trước M05-A, luật này nằm rải ba nơi: hub in thẳng `session.status` nên một
 * buổi đã quá mốc khóa vẫn hiện *"Đã chốt"*, trang chi tiết tự suy ra nên hiện
 * *"Đã khóa"*, còn RPC lặp lại biểu thức ấy lần thứ ba. Cùng một buổi, hai màn
 * hình nói hai điều khác nhau — người dùng không biết mình còn sửa được không.
 *
 * Thứ tự nhánh có ý nghĩa: `unlocked` phải thắng `completed`, vì mở khóa **giữ
 * nguyên** `status='completed'` và chỉ xóa `locked_at`.
 */
export function deriveSessionState({
  status,
  lockedAt,
  unlockedAt,
  now,
}: SessionStateInput): AttendanceSessionState {
  if (status === "locked") return "locked";
  if (unlockedAt !== null) return "unlocked";
  if (lockedAt !== null && now >= new Date(lockedAt).getTime()) return "locked";
  return status;
}

/** Buổi đã khóa hay chưa — cùng một nguồn với nhãn hiển thị. */
export function isSessionLocked(input: SessionStateInput): boolean {
  return deriveSessionState(input) === "locked";
}

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

/**
 * Nhãn NGẮN cho hàng nút bấm — M05-C / U-10, **D-142**.
 *
 * Chỉ khác `ATTENDANCE_STATUS_LABELS` ở hai trạng thái vắng, và chỉ vì bề ngang:
 * "Vắng có phép" + "Vắng không phép" cạnh nhau trên máy 360px đẩy hàng nút
 * xuống ba dòng, đúng cái mà U-21 đang tìm cách bỏ đi. Chữ "Vắng" không mất
 * nghĩa vì nó đã nằm trong tên nhóm (`legend` = "Thánh lễ của {tên}") và trình
 * đọc màn hình vẫn nghe câu đầy đủ qua `ariaLabel` của từng ô.
 */
export const ATTENDANCE_STATUS_SHORT_LABELS: Readonly<Record<AttendanceStatus, string>> = {
  present: "Có mặt",
  late: "Đi trễ",
  left_early: "Về sớm",
  excused_absence: "Có phép",
  unexcused_absence: "Không phép",
};

/**
 * **D-142** — ba trạng thái luôn hiện, hai trạng thái còn lại nằm sau nút "…".
 *
 * Chủ dự án chốt 2026-08-03. Cân nhắc đã bỏ: phương án hai nút *"Có mặt · Vắng"*
 * mà `06_UI_UX_RECOMMENDATIONS` U-10 đề xuất — nó buộc phải chọn hộ người dùng
 * một trong hai loại vắng, và dù chọn loại nào cũng sai với một nửa số ca. Chọn
 * "không phép" thì người đang vội ghi oan cho em có đơn xin nghỉ, mà con số ấy
 * chảy thẳng vào điểm chuyên cần (M07); chọn "có phép" thì kỷ luật của lớp
 * biến mất khỏi sổ. Ba nút giữ cả hai loại vắng ở mức **một cú chạm** và không
 * phải đoán ý ai.
 */
export const ATTENDANCE_STATUS_PRIMARY: readonly AttendanceStatus[] = [
  "present",
  "excused_absence",
  "unexcused_absence",
];

export const ATTENDANCE_STATUS_SECONDARY: readonly AttendanceStatus[] = ["late", "left_early"];

/**
 * Bốn cờ cảnh báo của `v_student_attendance_summary` (TB-09 / BR-M05-20).
 *
 * Tên cột giữ nguyên tiếng Anh như cơ sở dữ liệu; câu tiếng Việt nói **lý do**
 * chứ không nói "có cảnh báo" — một badge không kèm lý do thì người điểm danh
 * không biết phải làm gì với nó.
 */
export const ATTENDANCE_WARNING_LABELS = {
  warn_consecutive_sunday: "Vắng lễ Chúa nhật nhiều buổi liên tiếp",
  warn_consecutive_absence: "Vắng giáo lý nhiều buổi liên tiếp",
  warn_low_rate: "Tỷ lệ chuyên cần dưới ngưỡng của năm học",
  warn_mass_catechism_mismatch: "Có buổi đi lễ mà không học giáo lý (hoặc ngược lại)",
} as const;

export type AttendanceWarningKey = keyof typeof ATTENDANCE_WARNING_LABELS;

export const ATTENDANCE_WARNING_KEYS = Object.keys(
  ATTENDANCE_WARNING_LABELS,
) as AttendanceWarningKey[];

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

/** Cộng/trừ ngày trên chuỗi `yyyy-MM-dd`, neo bằng UTC nên không lệch múi giờ. */
export function shiftIsoDate(isoDate: string, days: number): string {
  const anchor = new Date(`${isoDate}T00:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return anchor.toISOString().slice(0, 10);
}

/**
 * Thứ Năm hoặc Chúa nhật gần nhất tính tới `todayIso` (D-29, TB-01).
 *
 * 🔴 Nhận **chuỗi ngày** chứ không tự gọi `new Date()`. Bản cũ ở
 * `attendance/page.tsx` dùng `today.getDay()` rồi `toISOString()` — cả hai đều
 * theo múi giờ của process Node, mà Vercel chạy UTC. 06:00 sáng Chúa nhật giờ
 * Việt Nam là 23:00 thứ Bảy UTC, nên form đổ sẵn **buổi thứ Năm tuần trước**
 * đúng vào lúc Giáo lý viên tới nhà thờ điểm danh sớm. Chỗ gọi truyền
 * `todayVi()` vào; hàm này thuần nên test được mà không phải đổi đồng hồ máy.
 */
export function mostRecentMeetingDate(todayIso: string): string {
  for (let back = 0; back < 7; back += 1) {
    const candidate = shiftIsoDate(todayIso, -back);
    if (meetingTypeForDate(candidate) !== null) return candidate;
  }
  return todayIso;
}
