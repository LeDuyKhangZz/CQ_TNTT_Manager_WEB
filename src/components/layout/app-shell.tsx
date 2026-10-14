"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { saveShellPreference, type ShellPreferences } from "@/features/navigation/types";
import { usePathname } from "next/navigation";
import { getDesktopNavigation, getMobileNavigation, getPageTitle, type MyClassDestination } from "@/config/navigation";
import type { ShellViewer } from "@/lib/auth/types";
import type { AcademicYearOption } from "./academic-year-switcher";
import { AcademicYearControl, AcademicYearViewBanner, type YearViewPresentation } from "./academic-year-control";
import { AppHeader } from "./app-header";
import { AppSidebar, type NavigationBadges } from "./app-sidebar";
import { MobileBottomNavigation } from "./mobile-bottom-navigation";
import { MobileMenuSheet, type MobilePanel } from "./mobile-menu-sheet";

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
  yearView,
  selectYearAction,
  myClass,
  preferences,
  navigationBadges,
}: {
  children: React.ReactNode;
  viewer: ShellViewer;
  notificationBell: React.ReactNode;
  contextIndicator?: React.ReactNode;
  unassignedBanner?: React.ReactNode;
  academicYear: AcademicYearOption | null;
  yearView?: YearViewPresentation;
  selectYearAction?: (data:FormData)=>Promise<void>;
  myClass?: MyClassDestination | null;
  preferences?: ShellPreferences;
  navigationBadges?: NavigationBadges;
}) {
  const pathname = usePathname();
  const [focusFeatures, setFocusFeatures] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const drawerOpen = mobilePanel !== null;
  const [collapsed, setCollapsed] = useState(preferences?.collapsed ?? false);
  const desktopItems = getDesktopNavigation(viewer, myClass);
  const mobileItems = getMobileNavigation(viewer);

  useEffect(() => setMobilePanel(null), [pathname]);
  useEffect(() => {
    if (!focusFeatures || drawerOpen || pathname !== "/dashboard") return;
    // Run after the drawer restores its opener, including same-page hash links.
    const frame = requestAnimationFrame(() => {
      document.getElementById("all-features-title")?.focus({ preventScroll: true });
      setFocusFeatures(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusFeatures, drawerOpen, pathname]);
  const showAllFeatures = () => { setMobilePanel(null); setFocusFeatures(true); };
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = () => { if (desktop.matches) setMobilePanel(null); };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);
  const openMenu = () => {
    saveShellPreference(preferences?.key, "menu", true);
    setMobilePanel("menu");
  };
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    saveShellPreference(preferences?.key, "rail", !collapsed);
  };

  return (
    /* 🔴 `clip-x`, KHÔNG phải `overflow-x-hidden` (REDESIGN 2C R2.2). Lớp cũ
       biến vỏ này thành **vùng cuộn** (CSS Overflow §3.5: trục kia đang
       `visible` tự tính thành `auto`), và `position: sticky` bên trong neo vào
       vùng cuộn gần nhất — nên `sticky top-0` của `AppHeader` ngay bên dưới
       **không hề dính**: đo bằng Chromium, cuộn 1200px thì header đi theo tới
       `top = -1200`. `overflow-x: clip` kẹp tràn ngang y hệt mà không tạo vùng
       cuộn. Định nghĩa + đường lùi cho Safari cũ nằm ở `globals.css`. */
    <div className="min-h-screen clip-x bg-page">
      {/* Skip link — M14 D3.b. Người dùng bàn phím trước đây phải `Tab` qua tối
          đa 15 mục sidebar mới tới nội dung. Chỉ nhìn thấy khi được focus. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:border focus:border-line-strong focus:bg-surface focus:px-4 focus:text-sm focus:font-medium focus:text-ink focus:shadow-md"
      >
        Bỏ qua điều hướng
      </a>

      <AppSidebar items={desktopItems} pathname={pathname} contextIndicator={contextIndicator} collapsed={collapsed} badges={navigationBadges} onShowAllFeatures={showAllFeatures} />

      <MobileMenuSheet panel={mobilePanel} setPanel={setMobilePanel} viewer={viewer} pathname={pathname} myClass={myClass} badges={navigationBadges} />

      <div className={cn("min-h-screen", collapsed ? "lg:pl-[72px]" : "lg:pl-[264px]")}>
        <AppHeader
          viewer={viewer}
          title={getPageTitle(pathname)}
          pathname={pathname}
          notificationBell={notificationBell}
          academicYear={academicYear}
          yearControl={yearView && selectYearAction ? <AcademicYearControl view={yearView} selectYearAction={selectYearAction} /> : undefined}
          onOpenMenu={openMenu}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={collapsed}
          menuOpen={mobilePanel === "menu"}
          accountOpen={mobilePanel === "account"}
          onOpenAccount={() => setMobilePanel("account")}
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
            <div className={cn("px-4 pt-4 sm:px-6", collapsed ? "lg:px-8" : "lg:hidden")}>{contextIndicator}</div>
          ) : null}
          {/* Dải chữ "vì sao màn hình của bạn không có màu ngành" (10 §8) đứng
              TRƯỚC nội dung: nó giải thích cả cái vỏ vừa đổi màu lẫn việc lớp
              của người dùng không xuất hiện. */}
          <noscript><p className="px-4 pt-3 sm:px-6 lg:hidden"><Link href="/dashboard#all-features" className="inline-flex min-h-11 items-center text-sm font-medium underline">Tất cả chức năng</Link></p></noscript>
          {unassignedBanner}
          {yearView ? <AcademicYearViewBanner view={yearView} /> : null}
          {children}
        </main>
      </div>

      <MobileBottomNavigation items={mobileItems} pathname={pathname} onOpenAccount={() => setMobilePanel("account")} accountOpen={mobilePanel === "account"} />
    </div>
  );
}
