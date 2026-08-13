"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { useModalBehavior } from "./modal-behavior";
import { cn } from "@/lib/utils";

/**
 * Hộp thoại — 05 §3.3 #2. Thay 7 lần `window.confirm` (điều cấm thứ 8).
 *
 * Năm yêu cầu bắt buộc của một dialog thật (05 §3.2):
 *   1. `role="dialog"` + `aria-modal` + `aria-labelledby`
 *   2. Đưa focus vào dialog khi mở
 *   3. Bẫy focus trong dialog (Tab và Shift+Tab đều không thoát ra được)
 *   4. `Escape` đóng và TRẢ FOCUS về nơi vừa rời đi
 *   5. Khoá cuộn body; lớp phủ là `<div aria-hidden>`, không phải `<button>`
 *
 * Yêu cầu 2–5 nằm ở `useModalBehavior` — drawer điều hướng (0.7) dùng chung
 * đúng hook đó, nên hai lớp nổi không thể tiến hoá lệch nhau.
 */

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Hàng nút cuối hộp thoại. */
  footer?: React.ReactNode;
  className?: string;
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  // Yêu cầu 2–5. Dialog có tiêu đề riêng nên focus vào chính khung chứa để
  // trình đọc màn hình đọc tiêu đề trước, không nhảy thẳng vào nút Đóng.
  useModalBehavior({ open, onClose, panelRef, initialFocus: "panel" });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-dialog flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Yêu cầu 5: lớp phủ là div + aria-hidden, KHÔNG phải <button>. Trình
          đọc màn hình không được đọc nó như một nút bấm được. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-overlay"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-lg rounded-t-xl bg-surface p-5 shadow-md outline-none sm:rounded-xl",
          "max-h-[90vh] overflow-y-auto",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-semibold text-ink">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="-mr-2 -mt-2 shrink-0 px-2"
          >
            <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        </div>

        {description ? (
          <div id={descriptionId} className="mt-2 text-sm text-ink-muted">
            {description}
          </div>
        ) : null}

        {children ? <div className="mt-4">{children}</div> : null}

        {footer ? (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
