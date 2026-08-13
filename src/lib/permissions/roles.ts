export const APP_ROLES = [
  "super_admin",
  "parish_priest",
  "chaplain",
  "group_leader",
  "deputy_group_leader",
  "secretary",
  "treasurer",
  "sector_leader",
  "sector_deputy",
  "class_representative",
  "class_teacher",
  "trainee_assistant",
  "guardian",
  "student",
] as const;

export type AppRole = (typeof APP_ROLES)[number];
export type AppAudience = "staff" | "guardian" | "student";
export type AppScopeKind = "global" | "sector" | "class" | "ownership";

export const ROLE_LABELS: Readonly<Record<AppRole, string>> = {
  super_admin: "Quản trị viên hệ thống",
  parish_priest: "Cha sở",
  chaplain: "Cha phó/Tuyên úy",
  group_leader: "Xứ đoàn trưởng",
  deputy_group_leader: "Phó Xứ đoàn",
  secretary: "Thư ký",
  treasurer: "Thủ quỹ",
  sector_leader: "Trưởng ngành",
  sector_deputy: "Phó ngành",
  class_representative: "Giáo lý viên đại diện",
  class_teacher: "Giáo lý viên lớp",
  trainee_assistant: "Dự trưởng phụ tá",
  guardian: "Phụ huynh",
  student: "Thiếu nhi",
};

export const GLOBAL_ROLES: readonly AppRole[] = [
  "super_admin",
  "parish_priest",
  "chaplain",
  "group_leader",
  "deputy_group_leader",
  "secretary",
  "treasurer",
];

/**
 * Nhóm cấp xứ đoàn **ghi được** — gương soi của `app.can_global_write()` trong
 * cơ sở dữ liệu. Hẹp hơn `GLOBAL_ROLES` đúng ba cái tên: Cha sở · Cha phó ·
 * Thủ quỹ có phạm vi **toàn cục nhưng chỉ đọc**.
 *
 * 🔴 M08-A, hạng mục 9 của `07_IMPLEMENTATION_IMPACT`. Luật này ra đời ở module
 * Bảng điểm (`features/assessments/gradebook-permissions.ts`) dưới cái tên
 * `hasGlobalResultWrite`, rồi module Chuyển lớp **mượn thẳng qua biên giới
 * feature** (`promotions/server/permissions.ts` cũ import từ
 * `@/features/assessments/server/permissions`). Đó là một phụ thuộc **sai ngữ
 * nghĩa**: quyền chuyển lớp không phải một loại quyền chấm điểm, và mọi lượt sửa
 * luật khoá bảng điểm về sau sẽ lặng lẽ đổi luôn ai được đề xuất chuyển lớp.
 *
 * ⚠️ Chỉ quyết định **hiện nút hay không**. Hàng rào thật là `app.can_global_write()`
 * bên trong RPC và policy — ẩn nút không phải authorization (`AGENTS` §5).
 */
export const GLOBAL_WRITE_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
];

export function hasGlobalWrite(role: AppRole | null): boolean {
  return role !== null && GLOBAL_WRITE_ROLES.includes(role);
}

export const SECTOR_ROLES: readonly AppRole[] = ["sector_leader", "sector_deputy"];
export const CLASS_ROLES: readonly AppRole[] = [
  "class_representative",
  "class_teacher",
  "trainee_assistant",
];

export const STAFF_PROFILE_ROLES: readonly AppRole[] = [
  "group_leader",
  "deputy_group_leader",
  "secretary",
  "treasurer",
  "sector_leader",
  "sector_deputy",
  ...CLASS_ROLES,
];

/**
 * Trần vai trò (D-102). Số lớn = quyền cao hơn. Dùng để chặn "cấp/nâng vai trò
 * cao hơn HOẶC ngang mình". Ở v1 người thao tác cấp/đổi tài khoản LUÔN là Super
 * Admin (màn hình chỉ Super Admin vào được), nên thứ hạng của các vai trò thấp
 * hơn hiện chỉ là lưới dự phòng cho tương lai — điều quan sát được ở v1 là "không
 * bao giờ cấp super_admin". Bậc theo phạm vi quyền của `docs/05`: toàn cục-ghi >
 * toàn cục-đọc > ngành > lớp > sở hữu.
 */
export const ROLE_RANK: Readonly<Record<AppRole, number>> = {
  super_admin: 100,
  group_leader: 80,
  deputy_group_leader: 75,
  secretary: 70,
  parish_priest: 60,
  chaplain: 60,
  treasurer: 55,
  sector_leader: 40,
  sector_deputy: 35,
  class_representative: 25,
  class_teacher: 20,
  trainee_assistant: 15,
  guardian: 5,
  student: 5,
};

/**
 * Người mang `actorRole` có được cấp/đổi một tài khoản sang `targetRole` không
 * (D-102): KHÔNG bao giờ cấp `super_admin` (trần tuyệt đối), và không cấp vai trò
 * cao hơn hoặc ngang mình.
 */
export function canActorAssignRole(actorRole: AppRole | null, targetRole: AppRole): boolean {
  if (!actorRole) return false;
  if (targetRole === "super_admin") return false;
  return ROLE_RANK[targetRole] < ROLE_RANK[actorRole];
}

/** Danh sách vai trò `actorRole` được phép cấp, giữ nguyên thứ tự `APP_ROLES`. */
export function assignableRolesForActor(actorRole: AppRole | null): AppRole[] {
  return APP_ROLES.filter((role) => canActorAssignRole(actorRole, role));
}

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

export function getAudienceForRole(role: AppRole): AppAudience {
  if (role === "guardian") return "guardian";
  if (role === "student") return "student";
  return "staff";
}

export function getScopeKindForRole(role: AppRole): AppScopeKind {
  if (SECTOR_ROLES.includes(role)) return "sector";
  if (CLASS_ROLES.includes(role)) return "class";
  if (role === "guardian" || role === "student") return "ownership";
  return "global";
}
