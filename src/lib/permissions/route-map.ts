import type { AuthContext } from "@/lib/auth/types";
import type { AppRole } from "./roles";

const STAFF_ROLES: readonly AppRole[] = [
  "super_admin", "parish_priest", "chaplain", "group_leader",
  "deputy_group_leader", "secretary", "treasurer", "sector_leader",
  "sector_deputy", "class_representative", "class_teacher", "trainee_assistant",
];
const OPERATIONAL_STAFF_ROLES = STAFF_ROLES.filter(
  (role) => !["parish_priest", "chaplain", "treasurer"].includes(role),
);

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
  { path: "/staff", public: false, roles: STAFF_ROLES },
  { path: "/attendance", public: false, roles: OPERATIONAL_STAFF_ROLES },
  { path: "/teaching-plan", public: false },
  { path: "/results", public: false },
  { path: "/committees", public: false, roles: STAFF_ROLES },
  { path: "/reports", public: false, roles: STAFF_ROLES },
  { path: "/admin", public: false, roles: ["super_admin"] },
];

export function getRouteRule(pathname: string): RouteRule | null {
  return [...ROUTE_RULES]
    .sort((left, right) => right.path.length - left.path.length)
    .find(({ path }) => pathname === path || pathname.startsWith(`${path}/`)) ?? null;
}

export function canAccessRoute(context: AuthContext | null, pathname: string): boolean {
  const rule = getRouteRule(pathname);
  if (!rule) return false;
  if (rule.public) return true;
  if (!context || context.accountStatus !== "active") return false;
  if (!rule.roles) return true;
  return context.role !== null && rule.roles.includes(context.role);
}
