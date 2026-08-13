/**
 * Trạng thái của biểu mẫu "Thêm thiếu nhi" — M03-A (AC-F14-03) và M03-B
 * (TB-F13 cảnh báo trùng, D-123 ô chọn lớp).
 *
 * AC-F14-03 đòi: gõ thiếu một ô thì **các ô đã nhập vẫn còn nguyên**, không phải gõ
 * lại. Biểu mẫu này có **mười một ô**, trong đó hai ô ngày — bắt gõ lại toàn bộ chỉ
 * vì quên ngày sinh là đúng thứ D-61 sinh ra để cấm. Cùng khuôn với
 * `academic-years/create-year-form-state.ts` (M02-A) và `staff/create-form-state.ts`.
 *
 * M03-B thêm **pha hai**: khi server thấy hồ sơ nghi trùng thì KHÔNG tạo mà trả
 * danh sách về cùng nguyên vẹn dữ liệu đã gõ; người nhập hoặc mở hồ sơ đã có,
 * hoặc bấm "Vẫn tạo hồ sơ mới" (BR-M03-N08 — cảnh báo mềm, không chặn).
 *
 * 🔴 Vì sao là file RIÊNG chứ không nằm trong `server/actions.ts`: một module
 * `"use server"` chỉ được export **hàm bất đồng bộ**. Export một hằng số từ đó làm
 * `next build` đỏ mà `tsc --noEmit` **không** bắt được.
 *
 * ⚠️ Giá trị đi trong **thân phản hồi**, không qua query string: các ô này có ngày
 * sinh, địa chỉ và số điện thoại của một trẻ em, không được để lại trên thanh địa
 * chỉ của một máy dùng chung.
 */

import type { DuplicateMatch } from "@/lib/students/duplicate";
import type { StudentFeedback } from "./student-feedback";

export interface CreateStudentFormValues {
  guardianId: string;
  saintName: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  patronFeastDate: string;
  phone: string;
  address: string;
  hardshipFlag: boolean;
  /** D-123 — bắt buộc với Trưởng/Phó ngành, tuỳ chọn với vai trò xứ đoàn. */
  classId: string;
}

export interface CreateStudentFormState {
  feedback: StudentFeedback | null;
  /**
   * Rỗng ở pha một. Có phần tử nghĩa là **đang chờ người dùng quyết**: biểu mẫu
   * hiện danh sách nghi trùng và nút gửi đổi chữ thành "Vẫn tạo hồ sơ mới".
   */
  duplicates: DuplicateMatch[];
  /** Chỉ giữ lại khi thất bại; thành công thì trả về rỗng để biểu mẫu sạch cho em kế tiếp. */
  values: CreateStudentFormValues;
}

export const EMPTY_CREATE_STUDENT_VALUES: CreateStudentFormValues = {
  guardianId: "",
  saintName: "",
  fullName: "",
  gender: "male",
  dateOfBirth: "",
  patronFeastDate: "",
  phone: "",
  address: "",
  hardshipFlag: false,
  classId: "",
};

export const CREATE_STUDENT_INITIAL_STATE: CreateStudentFormState = {
  feedback: null,
  duplicates: [],
  values: EMPTY_CREATE_STUDENT_VALUES,
};

/** Đọc lại đúng những gì người dùng vừa gõ, để pha lỗi không bắt gõ lại. */
export function createStudentValuesFromForm(formData: FormData): CreateStudentFormValues {
  const text = (key: string, fallback = "") => String(formData.get(key) ?? fallback);
  return {
    guardianId: text("guardianId"),
    saintName: text("saintName"),
    fullName: text("fullName"),
    gender: text("gender", "male"),
    dateOfBirth: text("dateOfBirth"),
    patronFeastDate: text("patronFeastDate"),
    phone: text("phone"),
    address: text("address"),
    hardshipFlag: formData.get("hardshipFlag") === "on",
    classId: text("classId"),
  };
}

/**
 * Trạng thái của biểu mẫu "Thêm người giám hộ" — BR-M03-N09, cùng cơ chế hai pha.
 *
 * Cảnh báo trùng ở đây quan trọng không kém bên hồ sơ em, và lý do là **phân
 * quyền** chứ không phải gọn gàng: một gia đình bị nhập thành hai bản ghi giám
 * hộ mà chỉ một bản có tài khoản ⇒ phụ huynh đăng nhập chỉ thấy **một phần số
 * con của mình** (`app.own_student_ids()` nối theo `guardians.profile_id`).
 */
export interface GuardianDuplicate {
  id: string;
  fullName: string;
  phone: string;
  reason: string;
}

export interface CreateGuardianFormValues {
  fullName: string;
  phone: string;
  address: string;
}

export interface CreateGuardianFormState {
  feedback: StudentFeedback | null;
  duplicates: GuardianDuplicate[];
  values: CreateGuardianFormValues;
}

export const EMPTY_CREATE_GUARDIAN_VALUES: CreateGuardianFormValues = {
  fullName: "",
  phone: "",
  address: "",
};

export const CREATE_GUARDIAN_INITIAL_STATE: CreateGuardianFormState = {
  feedback: null,
  duplicates: [],
  values: EMPTY_CREATE_GUARDIAN_VALUES,
};

export function createGuardianValuesFromForm(formData: FormData): CreateGuardianFormValues {
  const text = (key: string) => String(formData.get(key) ?? "");
  return { fullName: text("fullName"), phone: text("phone"), address: text("address") };
}
