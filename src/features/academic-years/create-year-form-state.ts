/**
 * Trạng thái của biểu mẫu "Tạo năm học" — M02-A, D-61.
 *
 * D-61 chia biểu mẫu làm hai loại. Ba thao tác còn lại của `/admin` là **biểu mẫu
 * ngắn** (một nút, không có gì để mất khi tải lại) nên đi đường chuyển hướng kèm
 * mã kết quả. Riêng biểu mẫu này có **bảy ô**, trong đó hai ô ngày và ba ô số —
 * bắt gõ lại toàn bộ chỉ vì gõ trùng mã năm học là đúng thứ D-61 sinh ra để cấm.
 * Vì vậy nó giữ nguyên dữ liệu đã nhập và hiện lỗi tại chỗ.
 *
 * 🔴 Vì sao là file RIÊNG chứ không nằm trong `server/actions.ts`: một module
 * `"use server"` chỉ được export **hàm bất đồng bộ**. Export một hằng số từ đó
 * làm `next build` đỏ mà `tsc --noEmit` không bắt được — cùng họ với cái bẫy
 * `"use client"` đã vấp ở M14-C. Cùng khuôn với `staff/create-form-state.ts`.
 */

export interface CreateYearFormValues {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  /** D-71 / D-116 — không bắt buộc; chuỗi rỗng nghĩa là chưa khai báo. */
  semester1EndDate: string;
  top5Enabled: boolean;
  attendanceLockDays: string;
  attendanceEditLeaseMinutes: string;
}

export interface CreateYearFormState {
  status: "idle" | "error" | "success";
  message: string | null;
  values: CreateYearFormValues;
}

export const CREATE_YEAR_INITIAL_STATE: CreateYearFormState = {
  status: "idle",
  message: null,
  values: {
    code: "",
    name: "",
    startDate: "",
    endDate: "",
    semester1EndDate: "",
    top5Enabled: false,
    attendanceLockDays: "3",
    attendanceEditLeaseMinutes: "15",
  },
};

/** Đọc lại đúng những gì người dùng vừa gõ, để pha lỗi không bắt gõ lại. */
export function createYearValuesFromForm(formData: FormData): CreateYearFormValues {
  const text = (key: string, fallback = "") => String(formData.get(key) ?? fallback);
  return {
    code: text("code"),
    name: text("name"),
    startDate: text("startDate"),
    endDate: text("endDate"),
    semester1EndDate: text("semester1EndDate"),
    top5Enabled: formData.get("top5Enabled") === "on",
    attendanceLockDays: text("attendanceLockDays", "3"),
    attendanceEditLeaseMinutes: text("attendanceEditLeaseMinutes", "15"),
  };
}
