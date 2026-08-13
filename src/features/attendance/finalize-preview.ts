import {
  ATTENDANCE_STATUS_ORDER,
  type AttendanceStatus,
  type StaffAttendanceStatus,
} from "./constants";

/**
 * Bảng phân bố cho hộp xác nhận trước khi chốt — M05-C / TB-03, AC-F06-1.
 *
 * 🔴 Tính từ **bản nháp phía client**, không hỏi máy chủ. Đó là cả điểm của
 * TB-03: bản cũ chỉ hiện tổng kết **sau** khi chốt (`attendance-editor.tsx`
 * bản M05-B, thẻ "Tổng kết buổi") — đúng lúc mốc khóa 3 ngày đã được đặt và
 * không còn sửa nhẹ nhàng được nữa. Con số phải xuất hiện **trước** cú bấm cuối,
 * lúc người ta còn quay lại được.
 *
 * Máy chủ vẫn là chỗ chặn thật: `save_and_finalize_attendance` đếm lại sĩ số và
 * ném `ATTENDANCE_ROSTER_INCOMPLETE` nếu thiếu. Bảng này chỉ để người bấm nhìn.
 */

export interface FinalizeDraftStudent {
  enrollmentId: string;
  mass: AttendanceStatus;
  catechism: AttendanceStatus;
}

export interface FinalizeDraftStaff {
  status: StaffAttendanceStatus;
}

/** Chỉ hai trường — hộp thoại cần **tên riêng**, không cần cả roster entry. */
export interface FinalizeRosterInfo {
  enrollmentId: string;
  label: string;
  pendingAbsenceReason: string | null;
}

export interface FinalizePreview {
  studentTotal: number;
  /** Đếm theo đúng thứ tự `ATTENDANCE_STATUS_ORDER`, không bỏ trạng thái nào. */
  mass: Record<AttendanceStatus, number>;
  catechism: Record<AttendanceStatus, number>;
  staffTotal: number;
  staffPresent: number;
  /**
   * Em **có đơn xin nghỉ đang chờ** mà vẫn để "Có mặt" ở cả hai cột.
   *
   * Không phải lỗi — D-36 nói rõ quyết định cuối là của người điểm danh, và bỏ
   * qua đơn là một quyết định hợp lệ (em vẫn tới). Nhưng nó là chỗ *nhầm* nhiều
   * nhất, nên hộp thoại nêu **đúng tên em** thay vì một câu chung chung.
   */
  ignoredAbsenceRequests: string[];
}

function emptyCounts(): Record<AttendanceStatus, number> {
  return Object.fromEntries(
    ATTENDANCE_STATUS_ORDER.map((status) => [status, 0]),
  ) as Record<AttendanceStatus, number>;
}

export function buildFinalizePreview(
  students: readonly FinalizeDraftStudent[],
  staff: readonly FinalizeDraftStaff[],
  roster: readonly FinalizeRosterInfo[],
): FinalizePreview {
  const mass = emptyCounts();
  const catechism = emptyCounts();
  for (const entry of students) {
    mass[entry.mass] += 1;
    catechism[entry.catechism] += 1;
  }

  const draftByEnrollment = new Map(students.map((entry) => [entry.enrollmentId, entry]));
  const ignoredAbsenceRequests = roster
    .filter((entry) => {
      if (entry.pendingAbsenceReason === null) return false;
      const draft = draftByEnrollment.get(entry.enrollmentId);
      return draft?.mass === "present" && draft?.catechism === "present";
    })
    .map((entry) => entry.label);

  return {
    studentTotal: students.length,
    mass,
    catechism,
    staffTotal: staff.length,
    staffPresent: staff.filter((entry) => entry.status === "present").length,
    ignoredAbsenceRequests,
  };
}

/** Trạng thái nào thật sự có mặt trong buổi — hàng nào đếm 0 thì không in ra. */
export function usedStatuses(preview: FinalizePreview): AttendanceStatus[] {
  return ATTENDANCE_STATUS_ORDER.filter(
    (status) => preview.mass[status] > 0 || preview.catechism[status] > 0,
  );
}
