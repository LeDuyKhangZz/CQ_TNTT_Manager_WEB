/**
 * Bỏ dấu tiếng Việt + chuẩn hóa để so khớp chữ.
 *
 * Dùng cho MỌI ô tìm kiếm và mọi phép "hai chuỗi này có phải cùng một tên
 * không". Ba việc, mỗi việc chữa một lỗi thật đã gặp:
 *
 *   1. `normalize("NFD")` + bỏ dấu phụ — tên gõ từ máy Mac vào bằng tệp Excel ở
 *      dạng PHÂN RÃ (`"A" + U+0300` thay vì `"À"`); so chuỗi thẳng thì hai cách
 *      viết của cùng một tên không bao giờ khớp nhau (lỗi `initialsFromName`
 *      bắt được ở mục 0.8).
 *   2. `đ`/`Đ` phải thay tay — chúng KHÔNG phải "d + dấu phụ" trong Unicode nên
 *      bước 1 không đụng tới, và "Dung"/"Đúng" là hai người khác nhau mà người
 *      tìm thì gõ "dung" cho cả hai.
 *   3. Gộp khoảng trắng thừa — "Nguyễn  Văn A" và "Nguyễn Văn A" là một người.
 */
export function foldVietnamese(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
