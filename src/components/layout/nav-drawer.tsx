"use client";

import * as React from "react";
import { useModalBehavior } from "@/components/ui/modal-behavior";

/**
 * Drawer điều hướng của `AppShell` — Mốc 0B mục 0.7, sửa D3.a của
 * `modules/M14-NAVIGATION-SHELL/06_UI_UX_RECOMMENDATIONS.md`.
 *
 * Bản cũ chỉ là một `<div className="fixed inset-0">` với lớp phủ là `<button>`
 * phủ kín màn hình: thiếu cả năm yêu cầu của một dialog thật, và trình đọc màn
 * hình gặp "một cái nút khổng lồ" chen giữa nút mở menu và nội dung drawer.
 *
 * Không dùng thẳng `Dialog` vì drawer trượt từ cạnh trái, cao hết màn hình và
 * mượn nút Đóng của `AppSidebar` — nhưng **hành vi a11y thì dùng chung
 * `useModalBehavior`**, không cài lại.
 */
export function NavDrawer({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Nhãn cho trình đọc màn hình. Drawer không có tiêu đề nhìn thấy được. */
  label: string;
  children: React.ReactNode;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  // `first` = nút Đóng ở đầu `AppSidebar` — đúng chữ của D3.a.
  useModalBehavior({ open, onClose, panelRef, initialFocus: "first" });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-drawer lg:hidden">
      {/* Lớp phủ là `div aria-hidden`, KHÔNG phải `<button>`. */}
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-overlay" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="relative h-full w-[min(82vw,320px)] shadow-md outline-none"
      >
        {children}
      </div>
    </div>
  );
}
