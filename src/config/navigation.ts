import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Bell,
  BookOpenCheck,
  CalendarOff,
  ChartNoAxesCombined,
  CircleUserRound,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  PanelsTopLeft,
  School,
  Settings,
  Shuffle,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { ATTENDANCE_VIEW_ROLES } from "@/lib/permissions/route-map";
import type { AppAudience, AppRole } from "@/lib/permissions/roles";

export type NavigationAudience = AppAudience;
export type NavigationScope = "global" | "sector" | "class" | "ownership" | "none";

/**
 * Năm trường duy nhất mà điều hướng thật sự đọc — M14 NC-5 + M13-A/D-25.
 *
 * Bản cũ nhận nguyên `AuthContext` (12 trường, có `userId`, `profileId`,
 * `academicYearId`, `sectorId`, `classId`) chỉ để trả lời một câu hỏi về
 * hiển thị. Vỏ ứng dụng là client component nên toàn bộ chỗ đó bị **gửi xuống
 * trình duyệt** ở mọi trang. Không rò dữ liệu của người khác, nhưng trên một
 * máy phòng học dùng chung thì bề mặt càng nhỏ càng tốt.
 */
export interface NavigationViewer {
  role: AppRole | null;
  audience: NavigationAudience | null;
  scopeKind: NavigationScope | null;
  /** Chỉ là cờ tồn tại; không chứa id người giám hộ hay id con. */
  hasGuardianProfile?: boolean;
}

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "Chung" | "Mục vụ" | "Điều hành";
  audiences: readonly NavigationAudience[];
  scopes: readonly NavigationScope[];
  roles?: readonly AppRole[];
  /** Chỉ hiện cho guardian hoặc nhân sự đồng thời là phụ huynh (D-25). */
  requiresGuardianProfile?: boolean;
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
  // `roles` lấy thẳng từ `ROUTE_RULES` chứ không chép tay — M14 A-11. Bản cũ bỏ
  // trống, nên Cha sở, Cha phó và Thủ quỹ thấy mục này rồi bấm vào là bị chặn.
  // M05-A/D-139: Cha sở và Cha phó nay xem được (chỉ đọc); Thủ quỹ vẫn không.
  { href: "/attendance", label: "Điểm danh", icon: ClipboardCheck, group: "Mục vụ", audiences: staffOnly, scopes: allStaffScopes, roles: ATTENDANCE_VIEW_ROLES },
  { href: "/student/attendance", label: "Điểm danh của em", icon: ClipboardCheck, group: "Mục vụ", audiences: ["student"], scopes: ["ownership"] },
  // M14 A-08/B2.2: `docs/06` §5 đòi mục này từ đầu và nó chưa từng tồn tại, nên
  // `/parent/children/<id>` là một route mồ côi suốt bảy phase. Quyền thật ở RLS
  // (`/parent` không giới hạn `roles` — D-25: một GLV vẫn có thể là phụ huynh).
  { href: "/parent/children", label: "Con của tôi", icon: Baby, group: "Mục vụ", audiences: ["staff", "guardian"], scopes: ["global", "sector", "class", "ownership"], requiresGuardianProfile: true },
  { href: "/parent/absence-requests", label: "Đơn xin nghỉ", icon: CalendarOff, group: "Mục vụ", audiences: ["staff", "guardian"], scopes: ["global", "sector", "class", "ownership"], requiresGuardianProfile: true },
  { href: "/teaching-plan", label: "Giáo án", icon: BookOpenCheck, group: "Mục vụ", audiences: ["staff", "guardian", "student"], scopes: ["global", "sector", "class", "ownership"] },
  { href: "/results", label: "Kết quả học tập", icon: GraduationCap, group: "Mục vụ", audiences: ["staff", "guardian", "student"], scopes: ["global", "sector", "class", "ownership"] },
  { href: "/promotions", label: "Lên lớp/chuyển lớp", icon: Shuffle, group: "Mục vụ", audiences: staffOnly, scopes: allStaffScopes, roles: ["super_admin", "parish_priest", "chaplain", "group_leader", "deputy_group_leader", "secretary", "sector_leader", "sector_deputy", "class_representative", "class_teacher", "trainee_assistant"] },
  { href: "/committees", label: "Ban", icon: PanelsTopLeft, group: "Điều hành", audiences: staffOnly, scopes: allStaffScopes },
  { href: "/notifications", label: "Thông báo", icon: Bell, group: "Chung", audiences: ["staff", "guardian", "student"], scopes: ["global", "sector", "class", "ownership"] },
  { href: "/reports", label: "Báo cáo", icon: ChartNoAxesCombined, group: "Điều hành", audiences: staffOnly, scopes: allStaffScopes },
  { href: "/imports", label: "Nhập dữ liệu Excel", icon: FileSpreadsheet, group: "Điều hành", audiences: staffOnly, scopes: ["global"], roles: ["super_admin", "group_leader", "deputy_group_leader", "secretary"] },
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

/** Tra theo href thay vì chỉ số: thêm mục mới vào platformNavigation không được
 * làm lệch các preset mobile bên dưới. */
function navItem(href: string, overrides: Partial<NavigationItem> = {}): NavigationItem {
  const item = platformNavigation.find((entry) => entry.href === href);
  if (!item) throw new Error(`Navigation item not found: ${href}`);
  return { ...item, ...overrides };
}

/* ==========================================================================
   Preset thanh 5 ô dưới đáy màn hình — M14 A-08 (`04_TO_BE_FLOWS.md` F03)
   ==========================================================================

   Bản cũ dùng **một** preset chung cho cả 12 vai trò nhân sự, nên:
   · Cha sở · Cha phó · Thủ quỹ mang một ô `Điểm danh` **chết** (chạm →
     `/access-denied`) — mời người ta đi vào một cánh cửa đã khoá;
   · Super Admin không có `Quản trị hệ thống`, tức việc chính của họ nằm sau
     nút ba gạch;
   · Trưởng/Phó ngành không có `Lên lớp/chuyển lớp`, trong khi duyệt chuyển lớp
     chính là việc của họ.

   🔴 Preset `class` GIỮ NGUYÊN (`07` §6, rủi ro số 3): Giáo lý viên đứng lớp là
   nhóm đông nhất và đang dùng thật; đổi tab quen thuộc của họ là chi phí không
   có ai trả. */

export const classStaffMobileNavigation: readonly NavigationItem[] = [
  navItem("/dashboard", { label: "Trang chủ" }),
  navItem("/attendance"),
  navItem("/classes", { label: "Lớp" }),
  navItem("/notifications"),
  accountNavigationItem,
];

const superAdminMobileNavigation: readonly NavigationItem[] = [
  navItem("/dashboard", { label: "Trang chủ" }),
  navItem("/attendance"),
  navItem("/classes", { label: "Lớp" }),
  navItem("/admin", { label: "Quản trị" }),
  accountNavigationItem,
];

const globalStaffMobileNavigation: readonly NavigationItem[] = [
  navItem("/dashboard", { label: "Trang chủ" }),
  navItem("/students"),
  navItem("/attendance"),
  navItem("/reports"),
  accountNavigationItem,
];

const sectorStaffMobileNavigation: readonly NavigationItem[] = [
  navItem("/dashboard", { label: "Trang chủ" }),
  navItem("/attendance"),
  navItem("/promotions", { label: "Lên lớp" }),
  navItem("/notifications"),
  accountNavigationItem,
];

/** Cha sở · Cha phó · Thủ quỹ: xem số liệu, không điều hành lớp. */
const readOnlyStaffMobileNavigation: readonly NavigationItem[] = [
  navItem("/dashboard", { label: "Trang chủ" }),
  navItem("/students"),
  navItem("/results", { label: "Kết quả" }),
  navItem("/reports"),
  accountNavigationItem,
];

const guardianMobileNavigation: readonly NavigationItem[] = [
  navItem("/dashboard", { label: "Trang chủ" }),
  navItem("/parent/children"),
  navItem("/parent/absence-requests", { label: "Xin nghỉ" }),
  navItem("/notifications"),
  accountNavigationItem,
];

const studentMobileNavigation: readonly NavigationItem[] = [
  navItem("/dashboard", { label: "Trang chủ" }),
  navItem("/student/attendance", { label: "Điểm danh" }),
  navItem("/results"),
  navItem("/notifications"),
  accountNavigationItem,
];

/** Ba vai trò chỉ đọc — cùng danh sách `OPERATIONAL_STAFF_ROLES` loại ra. */
const READ_ONLY_STAFF_ROLES: readonly AppRole[] = ["parish_priest", "chaplain", "treasurer"];

function isItemVisible(item: NavigationItem, viewer: NavigationViewer): boolean {
  if (viewer.role === null || viewer.audience === null || viewer.scopeKind === null) {
    return item.href === "/dashboard" || item.href === "/notifications" || item.href === "/account";
  }
  if (!item.audiences.includes(viewer.audience)) return false;
  // Phụ huynh chưa được liên kết vẫn phải thấy đường vào để đọc đúng trạng
  // thái `not-linked`. Với nhân sự, chỉ hiện khi thật sự có hồ sơ người giám
  // hộ của chính họ — tránh mọc hai mục cổng trên menu của mọi GLV.
  if (
    item.requiresGuardianProfile &&
    viewer.audience !== "guardian" &&
    viewer.hasGuardianProfile !== true
  ) {
    return false;
  }
  if (item.roles && !item.roles.includes(viewer.role)) return false;
  return item.scopes.includes(viewer.scopeKind) || item.scopes.includes("none");
}

export function getDesktopNavigation(viewer: NavigationViewer): readonly NavigationItem[] {
  // `Tài khoản` có mặt ở cả thanh bên lẫn thanh dưới (AC-B3). Bản cũ chỉ có ở
  // thanh dưới, nên hai nền tảng hiện hai tập mục khác nhau cho cùng một người.
  return [...platformNavigation, accountNavigationItem].filter((item) => isItemVisible(item, viewer));
}

/** Preset thô theo vai trò, TRƯỚC khi lọc lại bằng quyền thật. */
function mobilePresetFor(viewer: NavigationViewer): readonly NavigationItem[] {
  if (viewer.audience === "guardian") return guardianMobileNavigation;
  if (viewer.audience === "student") return studentMobileNavigation;
  if (viewer.role === "super_admin") return superAdminMobileNavigation;
  if (viewer.role !== null && READ_ONLY_STAFF_ROLES.includes(viewer.role)) {
    return readOnlyStaffMobileNavigation;
  }
  if (viewer.scopeKind === "global") return globalStaffMobileNavigation;
  if (viewer.scopeKind === "sector") return sectorStaffMobileNavigation;
  return classStaffMobileNavigation;
}

export function getMobileNavigation(viewer: NavigationViewer): readonly NavigationItem[] {
  // Vẫn lọc lại bằng `isItemVisible` sau khi chọn preset: preset là **ý đồ trình
  // bày**, quyền mới là thứ quyết định. Bất biến AC-A3 (unit test duyệt 14 vai
  // trò) canh đúng chỗ này.
  return mobilePresetFor(viewer).filter((item) => isItemVisible(item, viewer)).slice(0, 5);
}

/** Tên ứng dụng — chỉ dùng khi thật sự không biết mình đang ở trang nào. */
const APP_NAME = "Thiếu Nhi Chợ Quán";

/**
 * Route nằm **trong vỏ ứng dụng** nhưng không có mục điều hướng riêng.
 *
 * 🔴 Một bảng tra duy nhất cho cả `getPageTitle` (M14 A-14) và
 * `buildBreadcrumbTrail` (Mốc 0B mục 0.7). Hai bảng riêng lệch nhau nghĩa là
 * breadcrumb nói "Hồ sơ con" còn dòng tiêu đề ngay dưới nó nói
 * "Thiếu Nhi Chợ Quán" — đúng lỗi A-14 đang phải sửa.
 */
const STANDALONE_PAGE_LABELS: readonly (readonly [string, string])[] = [
  // `/parent/children` từng nằm ở đây; từ M14 A-08 nó là một mục điều hướng
  // thật ("Con của tôi") nên đã có nhãn qua `platformNavigation`.
  ["/access-denied", "Không có quyền truy cập"],
];

function matchPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function standaloneLabel(pathname: string): string | null {
  return STANDALONE_PAGE_LABELS.find(([prefix]) => matchPrefix(pathname, prefix))?.[1] ?? null;
}

/**
 * Nhãn của trang đang mở, hiện ở thanh đầu trang ngay dưới breadcrumb.
 *
 * M14 A-14: bản cũ chỉ tra `platformNavigation`, nên `/access-denied` và
 * `/parent/children/<id>` rơi vào fallback và hiện **tên ứng dụng** thay vì tên
 * trang — thanh đầu trang không nói được người dùng đang đứng ở đâu, đúng lúc
 * họ cần biết nhất (một trang báo bị từ chối quyền, một trang hồ sơ con).
 */
export function getPageTitle(pathname: string): string {
  if (matchPrefix(pathname, accountNavigationItem.href)) return accountNavigationItem.label;
  const item = platformNavigation.find(({ href }) => matchPrefix(pathname, href));
  return item?.label ?? standaloneLabel(pathname) ?? APP_NAME;
}

export function isNavigationItemActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

/* ==========================================================================
   Breadcrumb — Mốc 0B mục 0.7 (`05` §3.2, M14 D3.c)
   ========================================================================== */

/**
 * Nhãn cho đoạn thứ ba của các route chi tiết.
 *
 * 🔴 Breadcrumb **không bao giờ in đoạn đường dẫn thô**: mọi route chi tiết ở
 * đây đều là UUID (`/students/<uuid>`), in ra vừa vô nghĩa với người dùng vừa
 * rải khoá hồ sơ thiếu nhi lên thanh header của một máy dùng chung.
 * Tên riêng của bản ghi nằm ở `<h1>` của `PageHeader` ngay dưới.
 */
const DETAIL_CRUMB_LABELS: Readonly<Record<string, string>> = {
  "/students": "Hồ sơ thiếu nhi",
  "/classes": "Chi tiết lớp",
  "/attendance": "Buổi điểm danh",
  "/results": "Bảng điểm lớp",
  "/teaching-plan": "Giáo án lớp",
  "/committees": "Chi tiết ban",
  "/imports": "Lần nhập",
  "/parent/children": "Hồ sơ con",
};

export interface BreadcrumbCrumb {
  label: string;
  href?: string;
}

/**
 * Đường dẫn phân cấp **tối đa ba cấp**: Trang chủ › mục điều hướng › trang chi tiết.
 * Đoạn cuối luôn không có `href` — nó là trang đang mở.
 */
export function buildBreadcrumbTrail(pathname: string): readonly BreadcrumbCrumb[] {
  if (pathname === "/dashboard") return [{ label: "Trang chủ" }];

  const home: BreadcrumbCrumb = { label: "Trang chủ", href: "/dashboard" };

  const section =
    platformNavigation.find(({ href }) => isNavigationItemActive(pathname, href)) ??
    (isNavigationItemActive(pathname, accountNavigationItem.href) ? accountNavigationItem : null);

  if (!section) return [home, { label: standaloneLabel(pathname) ?? getPageTitle(pathname) }];

  if (pathname === section.href) return [home, { label: section.label }];

  return [
    home,
    { label: section.label, href: section.href },
    { label: DETAIL_CRUMB_LABELS[section.href] ?? "Chi tiết" },
  ];
}
