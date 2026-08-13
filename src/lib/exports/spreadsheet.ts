/**
 * Chống Excel formula injection (AGENTS §5): ô bắt đầu bằng `=`, `+`, `-`, `@`
 * bị Excel coi là công thức. Thêm dấu nháy đơn để giữ nguyên chuỗi hiển thị.
 *
 * 🔴 **M12-C thêm TAB và CR vào danh sách** — đúng chữ của `04_TO_BE_FLOWS`
 * TO-BE 5 bước 3 (*"`= + - @ TAB CR`"*) và **BR-M12-37**. Hai ký tự này lọt lưới
 * cũ vì `trimStart()` **cắt chúng đi trước khi kiểm**: chuỗi `"\t=cmd|…"` sau khi
 * cắt còn `"=cmd|…"` nên vẫn bị bắt, nhưng `"\t"` đứng đầu một ô lại là cách
 * Excel bắt đầu đọc ô như một ô mới khi người dùng dán vào — nên nó phải được
 * vô hiệu ngay tại chỗ. Kiểm trên **chuỗi gốc**, không kiểm trên bản đã cắt.
 *
 * ⚠️ Ghi cho phiên sau khỏi tưởng đây là thừa: một ô chuỗi trong `.xlsx` vốn
 * **không** bị Excel diễn giải thành công thức (công thức nằm ở phần tử `<f>`
 * riêng). Dấu nháy đơn ở đây canh đúng hai đường còn lại — người dùng **lưu lại
 * thành CSV**, hoặc **chép ô sang bảng tính khác** — và nó là điều **AC-23** viết
 * thành lời: *"ô tương ứng phải bắt đầu bằng dấu nháy đơn"*.
 */
export function safeSpreadsheetText(value: string): string {
  return /^\s*[=+\-@]|^[\t\r]/.test(value) ? `'${value}` : value;
}
