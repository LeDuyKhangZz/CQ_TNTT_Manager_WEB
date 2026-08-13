import * as React from "react";
import { cn } from "@/lib/utils";
import { themeCssVariables, type ThemeKey } from "@/lib/theme/sector-palette";
import type { ThemeContext } from "@/lib/theme/types";

/**
 * Bơm 13 CSS variable ngành vào một nhánh DOM — docs/.../10 §6.
 *
 * CSS variable INLINE, không dùng class theo ngành. Lý do quyết định: cho phép
 * LỒNG ngữ cảnh — trang `/classes` nền HUYNH_TRUONG chứa 19 thẻ lớp, mỗi thẻ
 * tự bọc `ThemeScope` của ngành mình.
 *
 * Đây là Server Component: theme tính ở máy chủ, render thẳng vào HTML đầu
 * tiên ⇒ KHÔNG nhấp nháy.
 */

type ThemeScopeProps = {
  /** Dùng khi đã có `ThemeContext` đầy đủ (shell, trang). */
  theme?: ThemeContext;
  /** Dùng khi chỉ cần đổi màu một mảng nhỏ (thẻ lớp trong danh sách). */
  themeKey?: ThemeKey;
  children: React.ReactNode;
  className?: string;
  /** Mặc định `div`. Truyền `"section"`, `"li"`… khi cần đúng ngữ nghĩa. */
  as?: React.ElementType;
} & Omit<React.HTMLAttributes<HTMLElement>, "style">;

export function ThemeScope({
  theme,
  themeKey,
  children,
  className,
  as: Component = "div",
  ...rest
}: ThemeScopeProps) {
  const key = theme?.themeKey ?? themeKey;

  if (!key) {
    throw new Error("ThemeScope cần `theme` hoặc `themeKey`.");
  }

  return (
    <Component
      data-theme-key={key}
      data-theme-source={theme?.sourceOfTheme}
      data-theme-fallback={theme?.fallbackReason ?? undefined}
      data-archived={theme?.isViewingArchivedData ? "true" : undefined}
      style={themeCssVariables(key) as React.CSSProperties}
      className={cn("theme-transition", className)}
      {...rest}
    >
      {children}
    </Component>
  );
}
