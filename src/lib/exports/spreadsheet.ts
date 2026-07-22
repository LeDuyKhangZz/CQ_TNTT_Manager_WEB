/**
 * Chống Excel formula injection (AGENTS §5): ô bắt đầu bằng `=`, `+`, `-`, `@`
 * bị Excel coi là công thức. Thêm dấu nháy đơn để giữ nguyên chuỗi hiển thị.
 */
export function safeSpreadsheetText(value: string): string {
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value;
}
