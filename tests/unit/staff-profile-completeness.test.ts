import { describe, expect, it } from "vitest";
import {
  missingStaffContactFields,
  staffContactReminder,
  STAFF_CONTACT_LABELS,
} from "@/features/staff/profile-completeness";

/**
 * IMP-BULK-002 — nửa sau của quyết định "thiếu thông tin thì kệ, vẫn cho nhập".
 *
 * Nhận hồ sơ thiếu mà không nhắc thì dữ liệu thiếu ở lại thiếu vĩnh viễn, nên
 * hàm này là chỗ duy nhất trả lời "còn thiếu gì" cho trang Tài khoản và cho mọi
 * màn hình nhắc về sau.
 */
describe("missingStaffContactFields", () => {
  const FULL = {
    phone: "0909123456",
    dateOfBirth: "2001-09-01",
    address: "12 Trần Bình Trọng, Q.5",
    email: "a@b.vn",
  };

  it("hồ sơ đủ thì không thiếu gì và không có câu nhắc", () => {
    expect(missingStaffContactFields(FULL)).toEqual([]);
    expect(staffContactReminder(FULL)).toBeNull();
  });

  it("chuỗi trắng tính là trống — một ô toàn dấu cách không phải dữ liệu", () => {
    expect(missingStaffContactFields({ ...FULL, address: "   " })).toEqual(["address"]);
  });

  it("số điện thoại luôn đứng đầu danh sách nhắc", () => {
    expect(missingStaffContactFields({ phone: null, dateOfBirth: null, address: null, email: null })[0])
      .toBe("phone");
  });

  it("câu nhắc liệt kê đúng các ô trống, nối bằng chữ 'và'", () => {
    const text = staffContactReminder({ ...FULL, phone: null, email: null });
    expect(text).toBe(
      `Hồ sơ của bạn còn thiếu ${STAFF_CONTACT_LABELS.phone.toLowerCase()} và ${STAFF_CONTACT_LABELS.email.toLowerCase()}.`,
    );
  });

  it("thiếu đúng một ô thì không có dấu phẩy thừa", () => {
    expect(staffContactReminder({ ...FULL, phone: null })).toBe(
      "Hồ sơ của bạn còn thiếu số điện thoại.",
    );
  });
});
