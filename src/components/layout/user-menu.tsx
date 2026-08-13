import Link from "next/link";
import { UserRound } from "lucide-react";
import { Dropdown, DropdownSeparator } from "@/components/ui/dropdown";
import { dropdownItemClassName } from "@/components/ui/dropdown-item";
import type { ShellViewer } from "@/lib/auth/types";
import { ROLE_LABELS } from "@/lib/permissions/roles";
import { SignOutButton } from "./sign-out-button";

/**
 * Menu tài khoản trên thanh đầu trang.
 *
 * Nâng lên `Dropdown` của Mốc 0B mục 0.8 (`05` §3.2) thay cho `<details>` tự
 * dựng: được thêm `Escape` đóng **và trả focus**, bấm ra ngoài đóng, phím mũi
 * tên đi giữa các mục — trong khi vẫn mở/đóng được lúc JS chưa tải, đúng yêu
 * cầu vì menu này chứa nút **Đăng xuất**.
 *
 * Đây cũng là chỗ trả một phần nợ #7: `Dropdown` là component đầu tiên của Đợt
 * 0-UI được đưa vào một menu chạy trong trang thật.
 */
export function UserMenu({ viewer }: { viewer: ShellViewer }) {
  const roleLabel = viewer.role ? ROLE_LABELS[viewer.role] : "Chưa gán vai trò";
  return (
    <Dropdown
      align="end"
      ariaLabel={`Menu tài khoản của ${viewer.displayName}`}
      triggerClassName="px-2"
      label={
        <>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-muted text-ink">
            <UserRound className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="hidden max-w-32 truncate md:inline">{viewer.displayName}</span>
        </>
      }
    >
      <div className="border-b border-line px-3 pb-2 pt-1">
        <p className="truncate text-sm font-medium text-ink">{viewer.displayName}</p>
        <p className="truncate text-2xs text-ink-muted">{roleLabel}</p>
      </div>
      {/* `next/link` chứ không phải `<a>` trần để giữ điều hướng phía client;
          lớp CSS lấy từ chính `Dropdown` nên không lệch với các mục khác. */}
      <Link
        href="/account"
        role="menuitem"
        data-dropdown-item="true"
        className={`${dropdownItemClassName()} mt-1`}
      >
        Tài khoản
      </Link>
      <DropdownSeparator />
      <SignOutButton />
    </Dropdown>
  );
}
