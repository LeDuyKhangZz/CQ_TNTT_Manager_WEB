/**
 * Chuẩn hoá chữ để **so khớp**, không phải để hiển thị. Bản gốc luôn được giữ
 * nguyên khi in ra màn hình (`docs/09` §4).
 *
 * 🔴 **Chuyển từ `src/features/imports/normalize.ts` lên đây ở M03-B, không đổi
 * một dòng logic nào.** Lý do là nguyên nhân gốc của lỗi F13 (29/75, thấp nhất
 * module M03): phép dò trùng được viết **thuộc về module Nhập Excel** chứ không
 * thuộc về miền `students`, nên nó chỉ chạy trên đường vào bằng tệp; đường vào
 * bằng biểu mẫu tay — cùng bảng, cùng rủi ro — không được che.
 * `src/features/imports/normalize.ts` xuất lại hai hàm này nên M12 không phải
 * sửa một dòng nào.
 *
 * Khác với `foldVietnamese()` cùng thư mục ở đúng một điểm, và điểm ấy có chủ
 * đích: ở đây **dấu câu trở thành dấu cách** để `"cha/mẹ"` tách thành hai từ
 * `cha` · `me`; hàm kia giữ nguyên vì nó dùng cho ô tìm kiếm, nơi người ta gõ
 * cả dấu gạch nối trong tên.
 */

/** Unicode NFC + bỏ khoảng trắng thừa (kể cả xuống dòng). */
export function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  let raw: string;
  if (value instanceof Date) {
    // Sổ Excel thật có ô cho ra một Date không hợp lệ; `toISOString()` sẽ ném
    // RangeError và làm hỏng cả lượt nhập.
    if (Number.isNaN(value.getTime())) return "";
    raw = value.toISOString();
  } else {
    raw = String(value);
  }
  return raw.normalize("NFC").replace(/\s+/gu, " ").trim();
}

/** Bỏ dấu và hạ chữ thường, chỉ dùng cho phép so khớp trùng. */
export function normalizeForMatch(value: unknown): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/gu, "")
    .replace(/đ/gu, "d")
    // Dấu câu thành dấu TÁCH chứ không phải rỗng: "cha/mẹ" phải tách thành
    // "cha","me", nếu không nó dính lại thành "chame".
    .replace(/[^a-z0-9 ]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}
