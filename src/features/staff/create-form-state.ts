import type { DuplicateSuspect } from "./staff-duplicates";

/**
 * Trạng thái của form "Thêm nhân sự" giữa hai pha cảnh báo trùng (TB-M04-03).
 *
 * 🔴 Vì sao là file RIÊNG chứ không nằm trong `server/actions.ts`: một module
 * `"use server"` chỉ được export HÀM BẤT ĐỒNG BỘ. Export một hằng số từ đó làm
 * `next build` đỏ, và `tsc --noEmit` **không** bắt được — cùng họ với cái bẫy
 * "use client" đã vấp trước đây. Kiểu dữ liệu thì bị xoá lúc biên dịch nên
 * không sao, nhưng để cả bộ ở đây cho khỏi phải nhớ ngoại lệ.
 */

/**
 * Giá trị người dùng đã gõ, để pha hai không bắt gõ lại. Đi trong THÂN phản hồi
 * chứ không qua query string — bảy ô này có ngày sinh, địa chỉ và số điện thoại,
 * không được để lại trên thanh địa chỉ của một máy dùng chung.
 */
export interface CreateStaffFormValues {
  title: string;
  saintName: string;
  fullName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  formationLevel: string;
}

export interface CreateStaffFormState {
  status: "idle" | "duplicate" | "error";
  message: string | null;
  duplicates: DuplicateSuspect[];
  values: CreateStaffFormValues;
}

export const CREATE_STAFF_INITIAL_STATE: CreateStaffFormState = {
  status: "idle",
  message: null,
  duplicates: [],
  values: {
    title: "anh",
    saintName: "",
    fullName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    address: "",
    formationLevel: "none",
  },
};
