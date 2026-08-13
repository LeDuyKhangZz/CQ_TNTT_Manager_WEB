/**
 * Lựa chọn ngữ cảnh "phụ huynh đang xem con nào" — 10 §2 và §7.
 *
 * Cookie chỉ lưu LỰA CHỌN (id của em), tuyệt đối không lưu màu. Resolver xác
 * thực lại giá trị này ở MỖI request theo bốn bước của 10 §7. File này giữ
 * **bước 1** (đúng dạng UUID) để `decideThemeContext` và `ChildSwitcher` dùng
 * CHUNG một luật: hai bản sao lệch nhau nghĩa là bộ chọn nhận một giá trị mà
 * resolver từ chối — người dùng bấm chọn con, trang dựng lại, màu và nội dung
 * không đổi, và không có lời giải thích nào.
 *
 * Bước 2 (còn hiệu lực) và bước 3 (có quyền) KHÔNG nằm ở đây: chúng cần dữ liệu
 * đã qua RLS nên thuộc về resolver. RLS vẫn là chốt chặn cuối.
 */

/** Chỉ nhận UUID v1–v5 đúng chuẩn, không nhận chuỗi 36 ký tự bất kỳ. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-9a-f][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Tên cookie. Chỉ máy chủ đọc — không có bản sao nào ở local storage (10 §2). */
export const THEME_CHILD_COOKIE = "cq_theme_child";

/**
 * Cookie PHIÊN: không đặt `maxAge`/`expires` nên trình duyệt xoá khi đóng.
 * Máy phòng học là máy dùng chung — lựa chọn "đang xem con nào" của phụ huynh
 * này không được nằm lại cho người đăng nhập kế tiếp.
 */
export const THEME_CHILD_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
} as const;

/**
 * Đọc giá trị người dùng gửi lên từ biểu mẫu chọn con.
 * Trả `null` khi sai dạng — chỗ gọi phải coi đó là "không chọn gì", không được
 * ghi bừa vào cookie một chuỗi mà resolver sẽ vứt đi.
 */
export function parseChildSelection(value: unknown): string | null {
  return isUuid(value) ? value : null;
}
