import { Menu } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { buildBreadcrumbTrail } from "@/config/navigation";
import { AcademicYearSwitcher, type AcademicYearOption } from "./academic-year-switcher";
import { UserMenu } from "./user-menu";
import type { ShellViewer } from "@/lib/auth/types";

/**
 * Thanh trên cùng của vỏ ứng dụng.
 *
 * 🔴 Tên trang ở đây là `<p>`, KHÔNG phải `<h1>` — M14 D3.c. Bản cũ đặt `<h1>`
 * ở đây và `PageHeader` đặt `<h2>` **cùng một chuỗi chữ**, nên mọi trang có hai
 * tiêu đề trùng nguyên văn. `<h1>` nay thuộc về `PageHeader` bên trong `<main>`.
 *
 * "Hệ thống / <tên trang>" tĩnh (và ẩn trên mobile) được thay bằng breadcrumb
 * thật, hiện ở **mọi** cỡ màn hình.
 */
export function AppHeader({ viewer, title, pathname, notificationBell, academicYear, onOpenMenu }: { viewer: ShellViewer; title: string; pathname: string; notificationBell: React.ReactNode; academicYear: AcademicYearOption | null; onOpenMenu: () => void }) {
  return (
    // 🔴 Nền ĐẶC, không phải `bg-page/95`. Token màu là `var()` trần nên
    // Tailwind KHÔNG sinh nổi lớp có bổ ngữ độ mờ: `.bg-page\/95` của bản
    // cũ không hề có trong CSS xuất ra (kiểm bằng grep vào `.next/static/css`),
    // tức header dính trên cùng đang trong suốt và chữ đè lên nội dung cuộn bên
    // dưới. `backdrop-blur` cũng bỏ luôn vì sau nền đặc nó không làm gì.
    <header className="sticky top-0 z-header bg-page">
      <div className="flex min-h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onOpenMenu} className="grid min-h-11 min-w-11 place-items-center rounded-md text-ink-muted hover:bg-surface-muted lg:hidden" aria-label="Mở menu">
          <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <Breadcrumb items={buildBreadcrumbTrail(pathname)} />
          <p className="truncate text-base font-semibold text-ink sm:text-lg">{title}</p>
        </div>
        <AcademicYearSwitcher current={academicYear} />
        {/* Nút chuông đi vào đây dưới dạng node dựng sẵn ở máy chủ (M14 A-16),
            nên header không cần biết con số chưa đọc và không phải chờ nó. */}
        {notificationBell}
        <UserMenu viewer={viewer} />
      </div>
      {/* Dải màu ngành 4px — hướng thiết kế "Sân Giáo Xứ" đã duyệt (`11` §1) và
          là **nơi số 1** trong 12 nơi được dùng `--theme-*` (09 §4.4). Đây là
          tín hiệu ngữ cảnh rẻ nhất: nó nằm ngay dưới tên trang, hiện ở mọi cỡ
          màn hình, và không chiếm chỗ của bất cứ nội dung nào. Màu KHÔNG bao giờ
          đứng một mình — `ContextIndicator` ở đầu thanh bên nói cùng điều đó
          bằng chữ (09 §10 điều 5). */}
      <div className="h-1 w-full bg-theme-primary" aria-hidden="true" />
    </header>
  );
}
