"use client";

import * as React from "react";

/**
 * Năm yêu cầu a11y của một lớp nổi kiểu modal (`05` §3.2) gom về một chỗ.
 *
 * `Dialog` (0.6) và drawer điều hướng (0.7) là hai lớp nổi khác nhau về hình
 * dáng nhưng **giống hệt nhau về hành vi**. Bản đầu của `Dialog` cài thẳng hai
 * `useEffect` vào trong component; nếu drawer chép lại thì sẽ có hai bản luật
 * bẫy focus tiến hoá lệch nhau. Tách ra đây để sửa một lần là cả hai cùng đúng.
 *
 *   1. Đưa focus vào lớp nổi khi mở
 *   2. Bẫy focus (`Tab` và `Shift+Tab` đều không thoát ra được)
 *   3. `Escape` đóng
 *   4. Đóng thì TRẢ FOCUS về nơi vừa rời đi
 *   5. Khoá cuộn body
 *
 * Yêu cầu thứ sáu — lớp phủ phải là `<div aria-hidden>` chứ không phải
 * `<button>` — nằm ở phần dựng hình của từng component, không phải ở đây.
 */

export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Phần tử nhận focus đầu tiên khi lớp nổi mở ra. */
export type InitialFocus =
  /** Chính khung chứa. Dùng khi khung có tiêu đề riêng để trình đọc màn hình đọc trước. */
  | "panel"
  /**
   * Phần tử bấm được đầu tiên bên trong. Dùng cho drawer điều hướng: phần tử
   * đó là nút Đóng, đúng yêu cầu D3.a của `M14/06_UI_UX_RECOMMENDATIONS.md`.
   */
  | "first";

export function focusableWithin(panel: HTMLElement): HTMLElement[] {
  const candidates = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  const laidOut = candidates.filter((element) => element.offsetParent !== null);

  // jsdom không dựng bố cục nên `offsetParent` LUÔN null. Thiếu nhánh dự phòng
  // này thì mọi test bàn phím của lớp nổi đều xanh giả: bẫy focus tưởng như
  // không có gì để bẫy. Ở trình duyệt thật nhánh này chỉ chạy khi đúng là mọi
  // phần tử đều đang ẩn — khi đó `focus()` vào phần tử ẩn là lệnh vô hiệu,
  // focus ở nguyên trên khung chứa, đúng bằng nhánh "không có gì bấm được".
  return laidOut.length > 0 ? laidOut : candidates;
}

export function useModalBehavior({
  open,
  onClose,
  panelRef,
  initialFocus = "panel",
}: {
  open: boolean;
  onClose: () => void;
  panelRef: React.RefObject<HTMLElement | null>;
  initialFocus?: InitialFocus;
}): void {
  // Yêu cầu 1 + 4 + 5.
  React.useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    if (panel) {
      const target = initialFocus === "first" ? focusableWithin(panel)[0] : null;
      (target ?? panel).focus();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, panelRef, initialFocus]);

  // Yêu cầu 2 + 3.
  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = focusableWithin(panel);

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, panelRef]);
}
