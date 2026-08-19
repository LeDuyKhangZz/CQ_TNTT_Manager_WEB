/**
 * Hồ sơ nhân sự còn thiếu gì — IMP-BULK-002.
 *
 * 🔴 Vì sao có file này. Chủ dự án chốt 2026-08-19: nhập hàng loạt **không được
 * chặn** người thiếu thông tin, đổi lại *"khi họ có tài khoản cá nhân thì hệ
 * thống báo và họ tự nhập lại đầy đủ"*. Nửa sau của lời hứa ấy cần một chỗ duy
 * nhất trả lời câu "còn thiếu gì" — nếu không, trang Tài khoản và mọi màn hình
 * nhắc về sau sẽ mỗi nơi đếm một kiểu.
 *
 * Hàm THUẦN, không đụng Supabase ⇒ kiểm được bằng unit test thường.
 */

export interface StaffContact {
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  email: string | null;
}

export type StaffContactField = keyof StaffContact;

/**
 * Nhãn tiếng Việt của từng ô, dùng chung cho câu nhắc và cho nhãn biểu mẫu —
 * hai chỗ gọi khác tên một ô là người đọc đi tìm một ô không tồn tại.
 */
export const STAFF_CONTACT_LABELS: Readonly<Record<StaffContactField, string>> = {
  phone: "Số điện thoại",
  dateOfBirth: "Ngày sinh",
  address: "Địa chỉ",
  email: "Email",
};

/**
 * Thứ tự cố ý: **số điện thoại đứng đầu** vì nó là ô duy nhất có hệ quả vận
 * hành thật (không có số thì không ai gọi được khi cần gấp). Email đứng cuối vì
 * hệ thống không gửi thư — nó chỉ là chỗ ghi lại.
 */
const ORDER: readonly StaffContactField[] = ["phone", "dateOfBirth", "address", "email"];

function isBlank(value: string | null): boolean {
  return value === null || value.trim() === "";
}

/** Các ô còn trống, theo thứ tự ưu tiên nhắc. */
export function missingStaffContactFields(contact: StaffContact): StaffContactField[] {
  return ORDER.filter((field) => isBlank(contact[field]));
}

/**
 * Câu nhắc gọn cho trang Tài khoản. Trả `null` khi không thiếu gì — chỗ gọi
 * dùng chính `null` đó để **không hiện khối nhắc**, thay vì hiện một khối rỗng
 * hay một câu "bạn không thiếu gì cả" mà chẳng ai cần đọc.
 */
export function staffContactReminder(contact: StaffContact): string | null {
  const missing = missingStaffContactFields(contact);
  if (missing.length === 0) return null;
  const names = missing.map((field) => STAFF_CONTACT_LABELS[field].toLowerCase());
  const listed =
    names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} và ${names[names.length - 1]}`;
  return `Hồ sơ của bạn còn thiếu ${listed}.`;
}
