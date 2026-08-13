/**
 * Tương phản WCAG 2.1 — dùng cho unit test canh bảng màu (docs/09 §4.5)
 * và cho script kiểm tra. KHÔNG dùng để tính màu lúc chạy: mọi hex đã chốt sẵn
 * ở `sector-palette.ts`, tính lại lúc chạy là thừa và dễ lệch.
 *
 * Công thức: WCAG 2.1 relative luminance + contrast ratio.
 * Đối chiếu được với docs/system-workflow-redesign/ui-redesign/scripts/palette.mjs.
 */

/** `#RGB` hoặc `#RRGGBB` → [r, g, b] trong khoảng 0..255. */
export function parseHex(hex: string): [number, number, number] {
  const value = hex.trim().replace(/^#/, "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Mã màu không hợp lệ: ${hex}`);
  }

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Độ sáng tương đối theo WCAG 2.1. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Tỷ lệ tương phản giữa hai màu, 1..21. Thứ tự tham số không quan trọng. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Ngưỡng AA cho chữ thường và cho thành phần giao diện (WCAG 1.4.11). */
export const AA_TEXT = 4.5;
export const AA_NON_TEXT = 3;
