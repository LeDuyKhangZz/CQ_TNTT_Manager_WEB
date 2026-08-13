import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { isNavigationItemActive, type NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";

interface AppSidebarProps {
  items: readonly NavigationItem[];
  pathname: string;
  /** `ContextIndicator` dựng sẵn ở máy chủ — "Đang xem: Ngành Ấu Nhi · Năm học 2026-2027". */
  contextIndicator?: React.ReactNode;
  mobile?: boolean;
  onClose?: () => void;
}

const groups = ["Chung", "Mục vụ", "Điều hành"] as const;

export function AppSidebar({ items, pathname, contextIndicator, mobile = false, onClose }: AppSidebarProps) {
  // Bản mobile nằm BÊN TRONG `NavDrawer`, tức bên trong một `role="dialog"`.
  // Ở đó `<aside>` là một vùng mốc lồng trong lớp nổi — trình đọc màn hình
  // thông báo thừa một tầng. `<nav>` bên trong vẫn giữ nguyên cho cả hai bản.
  const Frame = mobile ? "div" : "aside";
  return (
    <Frame
      aria-label={mobile ? undefined : "Thanh bên ứng dụng"}
      className={cn(
        "flex h-full w-[264px] flex-col border-r border-line bg-surface",
        mobile ? "shadow-md" : "fixed inset-y-0 left-0 z-sidebar hidden lg:flex",
      )}
    >
      <div className="flex min-h-20 items-center gap-3 border-b border-line px-5">
        <Image src="/logo.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl object-contain" />
        <div className="min-w-0 flex-1">
          {/* Dòng này KHÔNG dùng token ngành. Nhãn tên giáo xứ không nằm trong
              12 nơi được phép của 09 §4.4, và nó cũng không được đổi màu theo
              ngành — tên xứ đoàn là một, ngữ cảnh làm việc mới là thứ đổi. */}
          <p className="truncate text-2xs font-semibold uppercase tracking-wider text-ink-muted">Giáo xứ Chợ Quán</p>
          <p className="truncate font-semibold text-ink">Thiếu Nhi Thánh Thể</p>
        </div>
        {mobile ? (
          <button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-md text-ink-muted hover:bg-surface-muted" aria-label="Đóng menu">
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Ngữ cảnh bằng CHỮ, ngay dưới logo (`13` §6). Màu vỏ vừa đổi theo ngành
          thì phải có một dòng nói ra bằng lời vì sao — người không phân biệt
          được màu, người đang in trang ra giấy và trình đọc màn hình đều cần
          câu này (09 §10 điều 5). */}
      {contextIndicator ? (
        <div className="border-b border-line px-5 py-3">{contextIndicator}</div>
      ) : null}

      <nav aria-label="Điều hướng chính" className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => {
          const groupItems = items.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;
          return (
            <div className="mb-5" key={group}>
              <p className="mb-1 px-3 text-2xs font-semibold uppercase tracking-wider text-ink-muted">{group}</p>
              <ul className="space-y-1">
                {groupItems.map((item) => {
                  const active = isNavigationItemActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      {/* Mục đang chọn mang BA tín hiệu (05 §3.2, 09 §4.4 nơi
                          số 2): thanh dọc 3px `primary` + nền `tint` + chữ
                          `accent-text`. Bản cũ chỉ có nền xám và chữ màu — hai
                          tín hiệu, và cả hai đều là màu. Viền trái luôn tồn tại
                          (trong suốt khi không active) để chữ không nhảy 3px
                          mỗi lần đổi trang. */}
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-md border-l-[3px] px-3 py-2 text-sm font-medium transition-colors duration-fast",
                          active
                            ? "border-theme-primary bg-theme-tint text-theme-accent-text"
                            : "border-transparent text-ink hover:bg-surface-muted",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Chỗ này trước đây là hai dòng chữ tạm nhắc tên một task nội bộ đã xong
          từ lâu (M14 A-06, nợ #6) — hiện trên MỌI trang cho MỌI người dùng, kể
          cả phụ huynh. Thay bằng thứ vỏ ứng dụng thật sự còn thiếu: nút Đăng
          xuất. Cố ý KHÔNG chép lại nguyên văn chuỗi cũ ở đây: AC-B1 nghiệm thu
          bằng `grep` trên toàn `src/`, một chú thích cũng làm nó khác 0. */}
      <div className="border-t border-line px-3 py-3">
        <SignOutButton variant="panel" />
      </div>
    </Frame>
  );
}
