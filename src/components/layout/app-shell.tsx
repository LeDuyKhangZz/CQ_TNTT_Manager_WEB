"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getDesktopNavigation, getMobileNavigation, getPageTitle } from "@/config/navigation";
import type { ShellViewer } from "@/lib/auth/types";
import type { AcademicYearOption } from "./academic-year-switcher";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { MobileBottomNavigation } from "./mobile-bottom-navigation";
import { NavDrawer } from "./nav-drawer";

/**
 * Vỏ ứng dụng.
 *
 * 🔴 Nhận `ShellViewer` (5 trường) chứ KHÔNG phải `AuthContext` — M14 NC-5.
 * Trường thứ năm chỉ là cờ D-25 "đồng thời là phụ huynh"; id người giám hộ và
 * id con vẫn ở máy chủ. Đây là client component nên bề mặt prop phải giữ nhỏ.
 *
 * Ba prop dạng `ReactNode` (`notificationBell`, `contextIndicator`,
 * `unassignedBanner`) được dựng sẵn ở máy chủ rồi truyền xuống: chúng cần truy
 * vấn hoặc cần `ThemeContext`, và cả hai thứ đó đều không nên đi qua client.
 */
export function AppShell({
  children,
  viewer,
  notificationBell,
  contextIndicator,
  unassignedBanner,
  academicYear,
}: {
  children: React.ReactNode;
  viewer: ShellViewer;
  notificationBell: React.ReactNode;
  contextIndicator?: React.ReactNode;
  unassignedBanner?: React.ReactNode;
  academicYear: AcademicYearOption | null;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const desktopItems = getDesktopNavigation(viewer);
  const mobileItems = getMobileNavigation(viewer);

  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-page">
      {/* Skip link — M14 D3.b. Người dùng bàn phím trước đây phải `Tab` qua tối
          đa 15 mục sidebar mới tới nội dung. Chỉ nhìn thấy khi được focus. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:border focus:border-line-strong focus:bg-surface focus:px-4 focus:text-sm focus:font-medium focus:text-ink focus:shadow-md"
      >
        Bỏ qua điều hướng
      </a>

      <AppSidebar items={desktopItems} pathname={pathname} contextIndicator={contextIndicator} />

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} label="Menu điều hướng">
        <AppSidebar
          items={desktopItems}
          pathname={pathname}
          contextIndicator={contextIndicator}
          mobile
          onClose={() => setDrawerOpen(false)}
        />
      </NavDrawer>

      <div className="min-h-screen lg:pl-[264px]">
        <AppHeader
          viewer={viewer}
          title={getPageTitle(pathname)}
          pathname={pathname}
          notificationBell={notificationBell}
          academicYear={academicYear}
          onOpenMenu={() => setDrawerOpen(true)}
        />
        {/* Mốc `main` duy nhất của trang, và là đích của skip link. `tabIndex`
            -1 để focus thật sự nhảy vào đây, không chỉ cuộn tới.
            `PageContainer` cố ý KHÔNG còn là `<main>` — hai `main` lồng nhau
            là hai vùng mốc, trình đọc màn hình đọc sai cấu trúc trang. */}
        <main id="main-content" tabIndex={-1} className="pb-24 outline-none lg:pb-0">
          {/* 🔴 Bản sao dành riêng cho màn hình hẹp. Thanh bên là `hidden lg:flex`,
              nên dưới 1024px dòng ngữ cảnh của nó **biến mất khỏi màn hình** và
              chỉ còn dải màu 4px — tức màu trở thành tín hiệu duy nhất, đúng
              điều 09 §10 điều 5 cấm. Điện thoại lại chính là thiết bị ưu tiên
              số 1 của dự án (`05` §2.5). */}
          {contextIndicator ? (
            <div className="px-4 pt-4 sm:px-6 lg:hidden">{contextIndicator}</div>
          ) : null}
          {/* Dải chữ "vì sao màn hình của bạn không có màu ngành" (10 §8) đứng
              TRƯỚC nội dung: nó giải thích cả cái vỏ vừa đổi màu lẫn việc lớp
              của người dùng không xuất hiện. */}
          {unassignedBanner}
          {children}
        </main>
      </div>

      <MobileBottomNavigation items={mobileItems} pathname={pathname} />
    </div>
  );
}
