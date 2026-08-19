import type { AuthContext } from "@/lib/auth/types";
import type { AppRole } from "./roles";

const STAFF_ROLES: readonly AppRole[] = [
  "super_admin", "parish_priest", "chaplain", "group_leader",
  "deputy_group_leader", "secretary", "treasurer", "sector_leader",
  "sector_deputy", "class_representative", "class_teacher", "trainee_assistant",
];
/**
 * Nhân sự **đứng lớp/điều hành**, tức đã trừ Cha sở, Cha phó và Thủ quỹ.
 *
 * Xuất ra để `config/navigation.ts` dùng đúng danh sách này thay vì chép lại
 * (M14 A-11): bản cũ có mục `Điểm danh` không khai `roles` nào, nên ba vai trò
 * trên **thấy mục đó trong menu rồi bấm vào là bị đá sang `/access-denied`**.
 */
export const OPERATIONAL_STAFF_ROLES: readonly AppRole[] = STAFF_ROLES.filter(
  (role) => !["parish_priest", "chaplain", "treasurer"].includes(role),
);

/**
 * Cha sở và Cha phó — **xem** điểm danh nhưng không điểm danh (D-139, M05-A).
 *
 * `docs/05-permission-matrix.md:54` cho hai vị 👁 từ đầu, nhưng `/attendance` là
 * màn hình **ghi** nên M14 A-11 đã gộp hai ý niệm vào một route và khoá cả hai.
 * Nay tách ra: route mở, còn quyền ghi vẫn nằm nguyên chỗ cũ — `getEditableClasses`
 * trả rỗng nên form "Mở buổi" tự ẩn, và `app.can_edit_attendance` chặn mọi RPC.
 * **Không cần đụng cơ sở dữ liệu**: `app.can_global_read()` đã cho hai vai trò
 * này đọc `attendance_sessions` từ Phase 3.
 *
 * 🔴 **Thủ quỹ KHÔNG có trong danh sách.** `docs/05` ghi họ là *"👁 báo cáo"* —
 * xem qua trang Báo cáo, không qua màn hình điểm danh — và `app.can_global_read()`
 * cũng không có họ, nên mở route cho Thủ quỹ chỉ dẫn tới một trang trắng.
 */
export const ATTENDANCE_VIEW_ONLY_ROLES: readonly AppRole[] = ["parish_priest", "chaplain"];

export const ATTENDANCE_VIEW_ROLES: readonly AppRole[] = [
  ...OPERATIONAL_STAFF_ROLES,
  ...ATTENDANCE_VIEW_ONLY_ROLES,
];

export interface RouteRule {
  path: string;
  public: boolean;
  roles?: readonly AppRole[];
}

export const ROUTE_RULES: readonly RouteRule[] = [
  { path: "/login", public: true },
  { path: "/change-password", public: false },
  { path: "/dashboard", public: false },
  { path: "/notifications", public: false },
  { path: "/account", public: false },
  { path: "/access-denied", public: false },
  { path: "/students", public: false, roles: STAFF_ROLES },
  { path: "/classes", public: false, roles: STAFF_ROLES },
  // IMP-BULK-002 — chủ dự án thu quyền nhập hàng loạt về **đúng một người**
  // (2026-08-19). Một lượt dán tạo hàng trăm hồ sơ và phân công lớp trong một cú
  // bấm, nên nó không còn đứng chung nhóm với việc sửa từng hồ sơ ở `/staff`.
  // `getRouteRule` chọn luật có `path` dài nhất nên luật này thắng `/staff`.
  { path: "/staff/bulk", public: false, roles: ["super_admin"] },
  { path: "/staff", public: false, roles: STAFF_ROLES },
  { path: "/attendance", public: false, roles: ATTENDANCE_VIEW_ROLES },
  { path: "/teaching-plan", public: false },
  { path: "/results", public: false },
  { path: "/promotions", public: false, roles: STAFF_ROLES.filter((role) => role !== "treasurer") },
  // Portal phụ huynh không giới hạn theo role: một GLV vẫn có thể là phụ huynh
  // và phải vào được mục "con của tôi" (D-25). Quyền thật nằm ở RLS — trang chỉ
  // hiện những em mà `students`/`absence_requests` cho phép đọc.
  { path: "/parent", public: false },
  { path: "/student", public: false, roles: ["student"] },
  { path: "/committees", public: false, roles: STAFF_ROLES },
  { path: "/reports", public: false, roles: STAFF_ROLES },
  // IMP-BULK-002 — cùng một quyết định với `/staff/bulk`: nhập hàng loạt là
  // việc của riêng Super Admin, và cả hai chỉ còn lối vào từ trang `/admin`
  // (`platformNavigation` không còn mục nào cho chúng). RLS của
  // `import_batches`/`import_rows` đã siết theo ở 20260819000100.
  { path: "/imports", public: false, roles: ["super_admin"] },
  { path: "/admin", public: false, roles: ["super_admin"] },
];

export function getRouteRule(pathname: string): RouteRule | null {
  return [...ROUTE_RULES]
    .sort((left, right) => right.path.length - left.path.length)
    .find(({ path }) => pathname === path || pathname.startsWith(`${path}/`)) ?? null;
}

/**
 * Chỉ hai trường được đọc thật. Khai đúng bấy nhiêu để chỗ gọi không phải dựng
 * một `AuthContext` giả đủ 12 trường chỉ để hỏi một câu về quyền — `resolveNextPath`
 * (M14 A-04) chạy ngay sau `signInWithPassword`, lúc đó chưa có context đầy đủ.
 */
export type RouteAccessSubject = Pick<AuthContext, "accountStatus" | "role">;

export function canAccessRoute(context: RouteAccessSubject | null, pathname: string): boolean {
  const rule = getRouteRule(pathname);
  if (!rule) return false;
  if (rule.public) return true;
  if (!context || context.accountStatus !== "active") return false;
  if (!rule.roles) return true;
  return context.role !== null && rule.roles.includes(context.role);
}
