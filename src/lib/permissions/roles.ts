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
