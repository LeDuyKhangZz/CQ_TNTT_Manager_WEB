import { describe, expect, it } from "vitest";
import type { AuthContext } from "@/lib/auth/types";
import { canAccessRoute, getRouteRule } from "@/lib/permissions/route-map";
import { getAudienceForRole, getScopeKindForRole, isAppRole } from "@/lib/permissions/roles";

function context(role: AuthContext["role"]): AuthContext {
  return {
    userId: "00000000-0000-0000-0000-000000000001",
    profileId: "00000000-0000-0000-0000-000000000001",
    username: "TEST001",
    displayName: "Tài khoản test",
    accountStatus: "active",
    mustChangePassword: false,
    role,
    audience: role ? getAudienceForRole(role) : null,
    scopeKind: role ? getScopeKindForRole(role) : null,
    academicYearId: null,
    sectorId: null,
    classId: null,
  };
}

describe("role và route permission foundation", () => {
  it("phân loại audience/scope đúng", () => {
    expect(getAudienceForRole("guardian")).toBe("guardian");
    expect(getScopeKindForRole("sector_leader")).toBe("sector");
    expect(getScopeKindForRole("class_teacher")).toBe("class");
    expect(isAppRole("super_admin")).toBe(true);
    expect(isAppRole("unknown")).toBe(false);
  });

  it("fail closed với route không khai báo và user chưa đăng nhập", () => {
    expect(getRouteRule("/camps")).toBeNull();
    expect(canAccessRoute(null, "/dashboard")).toBe(false);
    expect(canAccessRoute(null, "/login")).toBe(true);
  });

  it("chỉ Super Admin vào route quản trị", () => {
    expect(canAccessRoute(context("super_admin"), "/admin")).toBe(true);
    expect(canAccessRoute(context("group_leader"), "/admin")).toBe(false);
    expect(canAccessRoute(context("guardian"), "/students")).toBe(false);
  });
});
