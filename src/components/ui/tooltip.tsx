"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Chú thích ngắn — 05 §3.3 #16. Dùng để giải thích cách tính trung bình, hệ số,
 * và ý nghĩa từng trạng thái.
 *
 * Bốn điều một tooltip hay hỏng, đã xử ở đây:
 *   1. **Chỉ hiện khi rê chuột** ⇒ máy bảng của giáo lý viên không bao giờ thấy.
 *      Nút mở là `<button>` thật: **bấm cũng mở**, không riêng rê chuột.
 *   2. **Không nhận focus** ⇒ người dùng bàn phím không đọc được. Đã là nút nên
 *      `Tab` tới được, và `focus`/`blur` mở/đóng.
 *   3. **`Escape` không đóng** — WCAG 1.4.13 bắt buộc đóng được mà không phải
 *      rời chuột.
 *   4. **Nội dung không gắn với nút** ⇒ trình đọc màn hình đọc nút trống rỗng.
 *      Dùng `aria-describedby` trỏ vào phần tử `role="tooltip"`.
 *
 * ⚠️ Tooltip **không được chứa thông tin bắt buộc** để hoàn thành thao tác —
 * chỉ chứa lời giải thích thêm. Thông tin bắt buộc phải nằm ở nhãn hoặc dòng
 * gợi ý dưới ô nhập.
 */

export type TooltipProps = {
  /** Nội dung giải thích. Giữ trong một hai câu. */
  content: React.ReactNode;
  /**
   * Nhãn cho trình đọc màn hình của nút mở, ví dụ "Giải thích cách tính điểm
   * trung bình". Không được là "Trợ giúp" chung chung khi trang có nhiều cái.
   */
  label: string;
  /** Nút mở tuỳ biến. Bỏ trống thì dùng icon dấu hỏi. */
  children?: React.ReactNode;
  className?: string;
};

export function Tooltip({ content, label, children, className }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const tooltipId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink"
      >
        {children ?? (
          <HelpCircle className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>

      {open ? (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            "absolute bottom-full left-1/2 z-dropdown mb-1 w-64 -translate-x-1/2",
            "rounded-md border border-line bg-surface p-3 text-xs text-ink shadow-md",
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
