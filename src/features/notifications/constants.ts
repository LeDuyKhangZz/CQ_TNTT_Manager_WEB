export const NOTIFICATION_TARGET_TYPES = [
  "all",
  "sector",
  "class",
  "committee",
  "user",
  "guardians",
  "students",
] as const;
export type NotificationTargetType = (typeof NOTIFICATION_TARGET_TYPES)[number];

export const NOTIFICATION_TARGET_LABELS: Readonly<Record<NotificationTargetType, string>> = {
  all: "Toàn hệ thống",
  sector: "Theo ngành",
  class: "Theo lớp",
  committee: "Theo Ban",
  user: "Một người",
  guardians: "Tất cả phụ huynh",
  students: "Tất cả thiếu nhi",
};

/** Target cần chọn đối tượng cụ thể; các target còn lại là nhóm cố định. */
export const NOTIFICATION_TARGETS_NEEDING_ID: readonly NotificationTargetType[] = [
  "sector",
  "class",
  "committee",
  "user",
];

/**
 * Deep-link chỉ được trỏ tới route đã tồn tại (AGENTS §8). Danh sách này phải
 * khớp với CHECK `notifications_link_known_route` ở migration
 * 20260723000400_notifications.sql — đổi một bên thì đổi cả hai.
 */
export const NOTIFICATION_LINK_ROUTES = [
  "/dashboard",
  "/notifications",
  "/account",
  "/students",
  "/classes",
  "/staff",
  "/attendance",
  "/teaching-plan",
  "/results",
  "/promotions",
  "/committees",
  "/reports",
  "/imports",
  "/admin",
  "/parent/absence-requests",
  "/parent/children",
  "/student/attendance",
] as const;

export function isKnownNotificationLink(link: string | null | undefined): boolean {
  if (!link) return true;
  return NOTIFICATION_LINK_ROUTES.some((route) => link === route || link.startsWith(`${route}/`));
}
