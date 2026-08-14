import { LogOut } from "lucide-react";
// KHÔNG nhập từ `@/components/ui/dropdown` — file đó là `"use client"`, và
// `SignOutButton` nay còn được dựng ở phía máy chủ (trang `/account`).
import { dropdownItemClassName } from "@/components/ui/dropdown-item";
import { FormPendingBridge } from "@/components/loading/form-pending-bridge";
import { signOutAction } from "@/features/auth/server/actions";
import { cn } from "@/lib/utils";

/**
 * Nút Đăng xuất — M14 A-01, luồng F07 (`CRITICAL`, 16/75: tính năng chưa từng
 * tồn tại trong hệ thống).
 *
 * 🔴 `<form action={serverAction}>` chứ KHÔNG phải `<Link>` (AC-F3). Đăng xuất
 * làm thay đổi trạng thái, mà một link GET thì bị trình duyệt tải trước, bị
 * trình quét link trong Zalo/Messenger mở thử, và bị "mở trong tab mới" kích
 * hoạt ngoài ý muốn. Dạng form cũng là dạng **chạy được khi JS chưa tải** —
 * đúng ràng buộc `09` §11 cho máy phòng học mạng kém.
 *
 * Đặt ở hai chỗ theo F07 TO-BE §2: menu tài khoản trên thanh đầu trang, và chân
 * thanh bên (thanh bên này cũng chính là nội dung drawer trên điện thoại, nên
 * một lần đặt là có đủ cả 360px lẫn 1366px — AC-F1).
 */
export function SignOutButton({
  className,
  variant = "menu",
}: {
  className?: string;
  /** `menu` cho mục trong `Dropdown`; `panel` cho nút đứng riêng ở chân thanh bên. */
  variant?: "menu" | "panel";
}) {
  const inMenu = variant === "menu";
  return (
    // `role="none"` khi nằm trong `Dropdown`: con trực tiếp của `role="menu"`
    // phải là `menuitem`, một `<form>` chen vào giữa sẽ cắt quan hệ đó. Bỏ vai
    // trò của form đi thì nút bên trong lại là con trực tiếp của menu.
    <form action={signOutAction} role={inMenu ? "none" : undefined}>
      {/* Không render gì, nên không cắt quan hệ `menu` → `menuitem` ở trên. */}
      <FormPendingBridge />
      <button
        type="submit"
        data-dropdown-item={inMenu ? "true" : undefined}
        role={inMenu ? "menuitem" : undefined}
        className={cn(
          dropdownItemClassName("danger"),
          "font-medium",
          !inMenu && "justify-center border border-line",
          className,
        )}
      >
        <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span>Đăng xuất</span>
      </button>
    </form>
  );
}
