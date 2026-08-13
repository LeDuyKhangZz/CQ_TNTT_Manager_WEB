"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { dropdownItemClassName } from "./dropdown-item";

/**
 * Menu thả xuống — 05 §3.3 #14 và §3.2. Dùng cho menu tài khoản và menu thao
 * tác trên từng hàng.
 *
 * 🔴 Dựng trên `<details>`/`<summary>`, **không** trên `useState` thuần. `05`
 * §3.2 nói rõ: nâng `UserMenu` lên `Dropdown` mới nhưng **"giữ khả năng chạy
 * không cần JS"** — `<details>` mở/đóng được bằng chính trình duyệt, còn một
 * menu dựng bằng state thì khi JS chưa tải là một cái nút chết, và trong menu
 * tài khoản có nút **Đăng xuất**.
 *
 * Ba khiếm khuyết của `<details>` trần được JS vá thêm, mất JS thì chỉ mất
 * phần tiện, không mất chức năng:
 *   1. `Escape` đóng và **trả focus** về nút mở
 *   2. Bấm ra ngoài thì đóng
 *   3. `ArrowDown`/`ArrowUp`/`Home`/`End` đi giữa các mục
 *
 * ⚠️ Lệch có chủ ý so với mẫu ARIA menu: các mục **vẫn nhận `Tab`** thay vì
 * dùng roving tabindex. Roving tabindex cần JS mới đặt được `tabindex`, nên khi
 * JS chưa tải người dùng bàn phím sẽ không vào được mục nào. Ở đây thà để `Tab`
 * đi qua từng mục — dài hơn một nhịp nhưng không bao giờ chết.
 */

const ITEM_SELECTOR = '[data-dropdown-item="true"]:not([disabled])';

export type DropdownProps = {
  /** Chữ trên nút mở, ví dụ "Nguyễn Văn A" hoặc "Thao tác". */
  label: React.ReactNode;
  /** Nhãn cho trình đọc màn hình khi `label` là icon hoặc tên riêng. */
  ariaLabel?: string;
  children: React.ReactNode;
  /** Cạnh canh của tấm menu. Mặc định canh phải để không tràn ở 360px. */
  align?: "start" | "end";
  className?: string;
  triggerClassName?: string;
};

export function Dropdown({
  label,
  ariaLabel,
  children,
  align = "end",
  className,
  triggerClassName,
}: DropdownProps) {
  const detailsRef = React.useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = React.useState(false);

  const close = React.useCallback((returnFocus: boolean) => {
    const details = detailsRef.current;
    if (!details?.open) return;
    details.open = false;
    setOpen(false);
    if (returnFocus) {
      details.querySelector("summary")?.focus();
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const details = detailsRef.current;
      if (details && !details.contains(event.target as Node)) close(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      const details = detailsRef.current;
      if (!details) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }

      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

      const items = Array.from(details.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
      if (items.length === 0) return;
      event.preventDefault();

      const current = items.indexOf(document.activeElement as HTMLElement);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : event.key === "ArrowDown"
              ? (current + 1 + items.length) % items.length
              : (current - 1 + items.length) % items.length;

      items[next]?.focus();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <details
      ref={detailsRef}
      className={cn("relative", className)}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      {/* 🔴 KHÔNG đặt `aria-expanded` ở đây. HTML-AAM đã quy định `<summary>`
          của `<details>` được phơi ra là button và **trạng thái mở lấy thẳng từ
          `details.open`** — trình duyệt tự làm. Nếu tự đặt `aria-expanded` theo
          state React thì khi JS chưa tải, người dùng mở menu bằng chính trình
          duyệt mà thuộc tính vẫn kẹt ở `false`: trình đọc màn hình đọc "đã thu
          gọn" trong lúc menu đang mở. Thà không có còn hơn có mà sai. */}
      <summary
        aria-label={ariaLabel}
        aria-haspopup="menu"
        className={cn(
          "inline-flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-md px-3 text-sm font-medium",
          "text-ink hover:bg-surface-muted [&::-webkit-details-marker]:hidden",
          triggerClassName,
        )}
      >
        {label}
        <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      </summary>

      <div
        role="menu"
        aria-label={typeof label === "string" ? label : ariaLabel}
        className={cn(
          "absolute z-dropdown mt-1 min-w-56 rounded-lg border border-line bg-surface p-1 shadow-md",
          align === "end" ? "right-0" : "left-0",
        )}
      >
        {children}
      </div>
    </details>
  );
}

export type DropdownItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** `danger` cho thao tác phá huỷ. Vẫn phải kèm `ConfirmDialog` (05 §5.1). */
  tone?: "default" | "danger";
};

/**
 * Mục bấm được trong menu. Mục điều hướng thì dùng `DropdownLink` để giữ đúng
 * ngữ nghĩa link (chuột giữa mở tab mới, chép được địa chỉ).
 */
export const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, tone = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      role="menuitem"
      data-dropdown-item="true"
      className={cn(itemClassName(tone), className)}
      {...props}
    />
  ),
);
DropdownItem.displayName = "DropdownItem";

export type DropdownLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  tone?: "default" | "danger";
};

export const DropdownLink = React.forwardRef<HTMLAnchorElement, DropdownLinkProps>(
  ({ className, tone = "default", ...props }, ref) => (
    <a
      ref={ref}
      role="menuitem"
      data-dropdown-item="true"
      className={cn(itemClassName(tone), className)}
      {...props}
    />
  ),
);
DropdownLink.displayName = "DropdownLink";

/** Đường kẻ chia nhóm. Trang trí thuần tuý nên không vào cây a11y. */
export function DropdownSeparator({ className }: { className?: string }) {
  return <hr aria-hidden="true" className={cn("my-1 border-t border-line", className)} />;
}

/**
 * 🔴 `dropdownItemClassName` cố ý **không** được xuất lại từ đây.
 *
 * File này mang `"use client"`, nên mọi export của nó là *client reference*;
 * một Server Component gọi phải sẽ ném lỗi lúc dựng trang. Chỗ nào cần lớp CSS
 * của mục menu thì nhập thẳng từ `@/components/ui/dropdown-item` — module đó
 * không có `"use client"` nên dùng được ở cả hai phía. Lý do đầy đủ nằm trong
 * chính file đó.
 */
function itemClassName(tone: "default" | "danger") {
  return dropdownItemClassName(tone);
}
