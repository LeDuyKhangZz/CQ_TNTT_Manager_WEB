import * as React from "react";
import { cn } from "@/lib/utils";
import { themeCssVariables, type ThemeKey } from "@/lib/theme/sector-palette";

/**
 * Ảnh đại diện chữ cái đầu — 05 §3.3 #17. Cần cho bộ chọn con của cổng phụ
 * huynh (0.9) và cho danh sách nhân sự.
 *
 * Nền dùng bậc `pastel` + chữ `--text` — **nơi số 12** trong 12 nơi được dùng
 * `--theme-*` (09 §4.4). Đo được 8,51–10,33:1 (09 §4.3). Không bao giờ để chữ
 * trắng trên `pastel`: 1,38–1,46:1, là điều CẤM ở 09 §4.3.
 *
 * Hệ thống **không lưu ảnh người dùng** (Storage private, không có luồng tải
 * ảnh đại diện) nên component này cố ý không có nhánh `<img>`.
 */

/**
 * Chữ cái đầu từ tên tiếng Việt: chữ đầu của **họ** + chữ đầu của **tên gọi**.
 * "Nguyễn Văn An" → "NA". Tên một chữ → một chữ cái. Tên rỗng → "?".
 *
 * 🔴 Phải `normalize("NFC")` TRƯỚC khi cắt. Tiếng Việt có hai cách mã hoá cùng
 * một chữ: "À" là một ký tự dựng sẵn (U+00C0), hoặc "A" + dấu huyền tổ hợp
 * (U+0041 U+0300). Dạng phân rã đi vào hệ thống qua tệp Excel xuất từ máy Mac
 * và qua vài bộ gõ. Cắt ký tự đầu của dạng phân rã ra "A" trần — avatar của
 * "Àn" hiện thành "A", tức là **hiện sai tên người**. NFC gộp lại trước khi cắt.
 */
export function initialsFromName(name: string): string {
  const words = name.normalize("NFC").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";

  const firstOf = (word: string) => [...word][0] ?? "";
  const initials =
    words.length === 1
      ? firstOf(words[0])
      : firstOf(words[0]) + firstOf(words[words.length - 1]);

  return initials.toLocaleUpperCase("vi-VN");
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-2xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

export type AvatarProps = {
  /** Tên đầy đủ. Dùng để sinh chữ cái đầu và làm nhãn khi `decorative={false}`. */
  name: string;
  /** Ngành để lấy bậc `pastel`. Bỏ trống thì theo `ThemeScope` bao ngoài. */
  themeKey?: ThemeKey;
  size?: keyof typeof SIZE_CLASSES;
  /**
   * Mặc định `true`: avatar đứng cạnh tên đã hiện bằng chữ, nên đọc lại tên là
   * thừa. Đặt `false` khi avatar đứng **một mình** (ví dụ nút chọn con).
   */
  decorative?: boolean;
  className?: string;
};

export function Avatar({
  name,
  themeKey,
  size = "md",
  decorative = true,
  className,
}: AvatarProps) {
  return (
    <span
      data-theme-key={themeKey}
      style={
        themeKey
          ? (themeCssVariables(themeKey) as React.CSSProperties)
          : undefined
      }
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative ? "true" : undefined}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full",
        "bg-theme-pastel font-semibold text-ink",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initialsFromName(name)}
    </span>
  );
}
