import { describe, expect, it } from "vitest";
import type { AuthContext } from "@/lib/auth/types";
import { canAccessRoute, getRouteRule } from "@/lib/permissions/route-map";
import { APP_ROLES, getAudienceForRole, getScopeKindForRole, isAppRole } from "@/lib/permissions/roles";

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

/**
 * M14 A-03 — `/student/*` chỉ dành cho thiếu nhi.
 *
 * `ROUTE_RULES` khai điều này từ đầu, nhưng `getStudentSelfAttendancePageData`
 * lại guard bằng `requireAuthContext` (chỉ hỏi "đã đăng nhập chưa") thay vì
 * `requireRouteAccess`, nên luật chưa từng được thi hành. Test dưới đây khoá
 * phần luật; phần thi hành khoá bằng E2E ở `authenticated-shell.spec.ts`.
 */
describe("A-03 — /student chỉ dành cho thiếu nhi", () => {
  it("thiếu nhi vào được trang điểm danh của chính mình", () => {
    expect(canAccessRoute(context("student"), "/student/attendance")).toBe(true);
  });

  it("🔴 mọi vai trò khác đều bị chặn, kể cả phụ huynh và Super Admin", () => {
    for (const role of APP_ROLES.filter((candidate) => candidate !== "student")) {
      expect(canAccessRoute(context(role), "/student/attendance"), role).toBe(false);
    }
  });

  it("tài khoản bị khoá không vào được dù đúng vai trò", () => {
    expect(
      canAccessRoute({ ...context("student"), accountStatus: "locked" }, "/student/attendance"),
    ).toBe(false);
  });
});

/**
 * M14 A-11 rồi **M05-A / D-139** — phạm vi của `/attendance`.
 *
 * A-11 đóng một lỗi thật (ba vai trò thấy mục điều hướng rồi bấm vào bị chặn)
 * bằng cách khoá cả ba. M05-A tách lại hai ý niệm mà một route đang gộp:
 * `/attendance` vừa là màn hình **ghi** vừa là màn hình **xem**, trong khi
 * `docs/05-permission-matrix.md:54` cho Cha sở 👁 và Cha phó 👁 từ đầu.
 *
 * Chủ dự án chốt 2026-08-03: mở **chế độ chỉ đọc** cho hai vị, giữ nguyên chặn
 * với Thủ quỹ — `docs/05` ghi họ là *"👁 báo cáo"*, và `app.can_global_read()`
 * cũng không có họ nên mở route chỉ dẫn tới một trang trắng.
 *
 * Quyền GHI không nhúc nhích: `app.can_edit_attendance` (Super Admin hoặc GLV
 * của chính lớp) là thứ chặn mọi RPC, và nó không đổi ở đợt này. pgTAP `041`
 * chứng minh điều đó bằng JWT thật của Cha sở.
 */
describe("A-11 + D-139 — phạm vi của /attendance", () => {
  it("Cha sở và Cha phó XEM được điểm danh (D-139)", () => {
    for (const role of ["parish_priest", "chaplain"] as const) {
      expect(canAccessRoute(context(role), "/attendance"), role).toBe(true);
      expect(canAccessRoute(context(role), "/attendance/abc"), role).toBe(true);
    }
  });

  it("🔴 Thủ quỹ vẫn bị chặn — họ xem chuyên cần qua Báo cáo", () => {
    expect(canAccessRoute(context("treasurer"), "/attendance")).toBe(false);
  });

  it("nhân sự đứng lớp và điều hành vẫn vào được", () => {
    for (const role of ["super_admin", "group_leader", "sector_leader", "class_teacher"] as const) {
      expect(canAccessRoute(context(role), "/attendance"), role).toBe(true);
    }
  });

  it("phụ huynh và thiếu nhi không bao giờ vào được màn hình điểm danh", () => {
    for (const role of ["guardian", "student"] as const) {
      expect(canAccessRoute(context(role), "/attendance"), role).toBe(false);
    }
  });

  /** U-08: duyệt trọn 14 vai trò để không ai lọt vào bằng cách vô tình. */
  it("đúng 11 trong 14 vai trò vào được", () => {
    const allowed = APP_ROLES.filter((role) => canAccessRoute(context(role), "/attendance"));
    expect(allowed).toHaveLength(11);
    expect(allowed).not.toContain("treasurer");
    expect(allowed).not.toContain("guardian");
    expect(allowed).not.toContain("student");
  });
});
