import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpenCheck,
  ChartNoAxesCombined,
  CircleUserRound,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  PanelsTopLeft,
  School,
  Settings,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import type { AuthContext } from "@/lib/auth/types";
import type { AppAudience, AppRole } from "@/lib/permissions/roles";

export type NavigationAudience = AppAudience;
export type NavigationScope = "global" | "sector" | "class" | "ownership" | "none";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "Chung" | "Mục vụ" | "Điều hành";
  audiences: readonly NavigationAudience[];
  scopes: readonly NavigationScope[];
  roles?: readonly AppRole[];
}

const staffOnly = ["staff"] as const;
const allStaffScopes = ["global", "sector", "class"] as const;

/**
 * Metadata trình bày navigation. Server guard + RLS mới là authorization.
 */
export const platformNavigation: readonly NavigationItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard, group: "Chung", audiences: ["staff", "guardian", "student"], scopes: ["global", "sector", "class", "ownership"] },
  { href: "/students", label: "Thiếu nhi", icon: UsersRound, group: "Mục vụ", audiences: staffOnly, scopes: allStaffScopes },
  { href: "/classes", label: "Lớp học", icon: School, group: "Mục vụ", audiences: staffOnly, scopes: allStaffScopes },
  { href: "/staff", label: "Huynh trưởng/Giáo lý viên", icon: UserRoundCog, group: "Mục vụ", audiences: staffOnly, scopes: ["global", "sector", "class"] },
  { href: "/attendance", label: "Điểm danh", icon: ClipboardCheck, group: "Mục vụ", audiences: staffOnly, scopes: allStaffScopes },
  { href: "/teaching-plan", label: "Giáo án", icon: BookOpenCheck, group: "Mục vụ", audiences: ["staff", "guardian", "student"], scopes: ["global", "sector", "class", "ownership"] },
  { href: "/results", label: "Kết quả học tập", icon: GraduationCap, group: "Mục vụ", audiences: ["staff", "guardian", "student"], scopes: ["global", "sector", "class", "ownership"] },
  { href: "/committees", label: "Ban", icon: PanelsTopLeft, group: "Điều hành", audiences: staffOnly, scopes: allStaffScopes },
  { href: "/notifications", label: "Thông báo", icon: Bell, group: "Chung", audiences: ["staff", "guardian", "student"], scopes: ["global", "sector", "class", "ownership"] },
  { href: "/reports", label: "Báo cáo", icon: ChartNoAxesCombined, group: "Điều hành", audiences: staffOnly, scopes: allStaffScopes },
  { href: "/admin", label: "Quản trị hệ thống", icon: Settings, group: "Điều hành", audiences: staffOnly, scopes: ["global"], roles: ["super_admin"] },
];

export const accountNavigationItem: NavigationItem = {
  href: "/account",
  label: "Tài khoản",
  icon: CircleUserRound,
  group: "Chung",
  audiences: ["staff", "guardian", "student"],
  scopes: ["none"],
};

export const classStaffMobileNavigation: readonly NavigationItem[] = [
  { ...platformNavigation[0], label: "Trang chủ" },
  platformNavigation[4],
  { ...platformNavigation[2], label: "Lớp" },
  platformNavigation[8],
  accountNavigationItem,
];

const guardianMobileNavigation: readonly NavigationItem[] = [
  { ...platformNavigation[0], label: "Trang chủ" },
  { ...platformNavigation[5], label: "Lịch học" },
  platformNavigation[6],
  platformNavigation[8],
  accountNavigationItem,
];

const studentMobileNavigation = guardianMobileNavigation;

function isItemVisible(item: NavigationItem, context: AuthContext): boolean {
  if (context.role === null || context.audience === null || context.scopeKind === null) {
    return item.href === "/dashboard" || item.href === "/notifications" || item.href === "/account";
  }
  if (!item.audiences.includes(context.audience)) return false;
  if (item.roles && !item.roles.includes(context.role)) return false;
  return item.scopes.includes(context.scopeKind) || item.scopes.includes("none");
}

export function getDesktopNavigation(context: AuthContext): readonly NavigationItem[] {
  return platformNavigation.filter((item) => isItemVisible(item, context));
}

export function getMobileNavigation(context: AuthContext): readonly NavigationItem[] {
  const preset = context.audience === "guardian"
    ? guardianMobileNavigation
    : context.audience === "student"
      ? studentMobileNavigation
      : classStaffMobileNavigation;
  return preset.filter((item) => isItemVisible(item, context)).slice(0, 5);
}

export function getPageTitle(pathname: string): string {
  if (pathname === "/account") return "Tài khoản";
  const item = platformNavigation.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  return item?.label ?? "Thiếu Nhi Chợ Quán";
}

export function isNavigationItemActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}
