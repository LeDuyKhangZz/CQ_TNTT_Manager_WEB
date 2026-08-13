import { describe, expect, it } from "vitest";
import {
  accountNavigationItem,
  buildBreadcrumbTrail,
  classStaffMobileNavigation,
  getDesktopNavigation,
  getMobileNavigation,
  getPageTitle,
  isNavigationItemActive,
  platformNavigation,
} from "@/config/navigation";
import type { AuthContext } from "@/lib/auth/types";
import { canAccessRoute } from "@/lib/permissions/route-map";
import { APP_ROLES, getAudienceForRole, getScopeKindForRole, type AppRole } from "@/lib/permissions/roles";

describe("navigation config", () => {
  it("không chứa route Sa mạc và không lặp href", () => {
    const hrefs = platformNavigation.map(({ href }) => href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.some((href) => href.startsWith("/camps"))).toBe(false);
  });

  it("bottom navigation staff có tối đa 5 mục", () => {
    expect(classStaffMobileNavigation).toHaveLength(5);
    expect(classStaffMobileNavigation.map(({ label }) => label)).toEqual([
      "Trang chủ",
      "Điểm danh",
      "Lớp",
      "Thông báo",
      "Tài khoản",
    ]);
  });

  it("nhận diện tiêu đề và trạng thái active của route con", () => {
    expect(getPageTitle("/students/abc")).toBe("Thiếu nhi");
    expect(isNavigationItemActive("/students/abc", "/students")).toBe(true);
    expect(isNavigationItemActive("/dashboard-other", "/dashboard")).toBe(false);
  });
});

/**
 * M14 AC-A3 — **bất biến của cả module điều hướng**: không mục nào trong menu
 * được trỏ tới một route mà `canAccessRoute` từ chối cho chính vai trò đó.
 *
 * Đây là hàng rào thật cho A-11, và nó rộng hơn A-11: bản cũ chỉ có 3 test cho
 * `navigation.ts` và **không test `getDesktopNavigation` với bất kỳ vai trò
 * nào** (C15 = 3 ở audit F02). Vì thế mục `Điểm danh` thiếu `roles` nằm im
 * suốt bảy phase — Cha sở, Cha phó, Thủ quỹ thấy mục đó rồi bấm vào là bị đá
 * sang `/access-denied`, tức hệ thống mời họ đi vào một cánh cửa đã khoá.
 *
 * Test duyệt cả 14 vai trò × (menu desktop ∪ menu mobile), nên mục mới thêm sai
 * `roles`/`audiences` sẽ đỏ ngay tại đây thay vì lộ ra khi người dùng bấm.
 */
describe("AC-A3 — mọi mục menu đều nằm trong quyền của vai trò đang xem", () => {
  function contextFor(role: AppRole): AuthContext {
    return {
      userId: "00000000-0000-0000-0000-000000000001",
      profileId: "00000000-0000-0000-0000-000000000001",
      username: "TEST001",
      displayName: "Tài khoản test",
      accountStatus: "active",
      mustChangePassword: false,
      role,
      audience: getAudienceForRole(role),
      scopeKind: getScopeKindForRole(role),
      academicYearId: null,
      sectorId: null,
      classId: null,
    };
  }

  for (const role of APP_ROLES) {
    it(`${role}: không mục nào dẫn tới route bị chặn`, () => {
      const context = contextFor(role);
      const items = [...getDesktopNavigation(context), ...getMobileNavigation(context)];
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(canAccessRoute(context, item.href), `${role} → ${item.href}`).toBe(true);
      }
    });
  }

  it("🔴 A-11: Thủ quỹ không thấy mục Điểm danh", () => {
    const hrefs = getDesktopNavigation(contextFor("treasurer")).map(({ href }) => href);
    expect(hrefs).not.toContain("/attendance");
  });

  /**
   * M05-A / D-139 — hai Cha nay thấy mục này, và mục ấy KHÔNG còn là link chết.
   * Bất biến "menu ⊆ quyền" ở vòng lặp 14 vai trò bên trên là thứ canh điều đó:
   * `navigation.ts` đọc thẳng `ATTENDANCE_VIEW_ROLES` từ `route-map.ts` nên hai
   * bảng không thể lệch nhau lần nữa (đúng nguyên nhân gốc của NAV-I1).
   */
  it("Cha sở và Cha phó thấy mục Điểm danh sau D-139", () => {
    for (const role of ["parish_priest", "chaplain"] as const) {
      const hrefs = getDesktopNavigation(contextFor(role)).map(({ href }) => href);
      expect(hrefs, role).toContain("/attendance");
    }
  });

  it("nhân sự đứng lớp vẫn giữ nguyên mục Điểm danh", () => {
    for (const role of ["group_leader", "sector_leader", "class_teacher"] as const) {
      const hrefs = getDesktopNavigation(contextFor(role)).map(({ href }) => href);
      expect(hrefs, role).toContain("/attendance");
    }
  });

  /**
   * M14 A-08 — thanh 5 ô dưới đáy màn hình tách theo phạm vi công tác.
   *
   * Bản cũ dùng **một** preset cho cả 12 vai trò nhân sự. Hệ quả đo được ở audit
   * F03: 7/12 vai trò mang một thanh sai trọng tâm, trong đó ba vai trò chỉ đọc
   * có hẳn một ô dẫn thẳng tới `/access-denied`.
   */
  describe("AC-B4 — preset thanh dưới đúng trọng tâm từng vai trò", () => {
    const mobileHrefs = (role: AppRole) =>
      getMobileNavigation(contextFor(role)).map(({ href }) => href);

    it("Quản trị viên hệ thống có ô Quản trị", () => {
      expect(mobileHrefs("super_admin")).toContain("/admin");
    });

    it("Trưởng/Phó ngành có ô Lên lớp", () => {
      for (const role of ["sector_leader", "sector_deputy"] as const) {
        expect(mobileHrefs(role), role).toContain("/promotions");
      }
    });

    it("Phụ huynh có ô Con của tôi", () => {
      expect(mobileHrefs("guardian")).toContain("/parent/children");
    });

    it("D-25: GLV đồng thời là phụ huynh có mục Con của tôi trong menu đầy đủ", () => {
      const staffParent = { ...contextFor("class_teacher"), hasGuardianProfile: true };
      const ordinaryStaff = contextFor("class_teacher");

      expect(getDesktopNavigation(staffParent).map(({ href }) => href)).toContain(
        "/parent/children",
      );
      expect(getDesktopNavigation(ordinaryStaff).map(({ href }) => href)).not.toContain(
        "/parent/children",
      );
      // Thanh dưới của GLV giữ trọng tâm lớp; mục cổng nằm trong drawer dùng
      // cùng danh sách desktop, không đẩy một việc lớp ra khỏi năm ô chính.
      expect(getMobileNavigation(staffParent).map(({ href }) => href)).not.toContain(
        "/parent/children",
      );
    });

    it("Nhân sự toàn xứ đoàn có ô Thiếu nhi và Báo cáo", () => {
      for (const role of ["group_leader", "deputy_group_leader", "secretary"] as const) {
        expect(mobileHrefs(role), role).toContain("/students");
        expect(mobileHrefs(role), role).toContain("/reports");
      }
    });

    /**
     * Thanh dưới chỉ có 5 ô nên nó là **trọng tâm công việc**, không phải bản
     * sao của thanh bên. Sau D-139 hai Cha xem được điểm danh, nhưng đó vẫn
     * không phải việc thường ngày của hai vị — ô ấy sẽ đẩy Báo cáo ra ngoài.
     * Trên điện thoại họ vào qua nút ba gạch; không có link chết nào ở đây.
     */
    it("🔴 ba vai trò chỉ đọc giữ trọng tâm Báo cáo ở thanh dưới", () => {
      for (const role of ["parish_priest", "chaplain", "treasurer"] as const) {
        expect(mobileHrefs(role), role).not.toContain("/attendance");
        expect(mobileHrefs(role), role).toContain("/reports");
      }
    });

    it("preset của Giáo lý viên đứng lớp GIỮ NGUYÊN", () => {
      for (const role of ["class_representative", "class_teacher", "trainee_assistant"] as const) {
        expect(mobileHrefs(role), role).toEqual(
          classStaffMobileNavigation.map(({ href }) => href),
        );
      }
    });

    it("mọi vai trò đều có đúng 5 ô và ô cuối luôn là Tài khoản", () => {
      for (const role of APP_ROLES) {
        const hrefs = mobileHrefs(role);
        expect(hrefs.length, role).toBe(5);
        expect(hrefs[hrefs.length - 1], role).toBe(accountNavigationItem.href);
      }
    });
  });

  it("AC-B3 — Tài khoản có mặt ở CẢ thanh bên lẫn thanh dưới", () => {
    for (const role of APP_ROLES) {
      const context = contextFor(role);
      const desktop = getDesktopNavigation(context).map(({ href }) => href);
      const mobile = getMobileNavigation(context).map(({ href }) => href);
      expect(desktop, role).toContain(accountNavigationItem.href);
      expect(mobile, role).toContain(accountNavigationItem.href);
    }
  });

  it("AC-A6 — tài khoản chưa gán vai trò vẫn thấy lối đi tối thiểu", () => {
    const orphan: AuthContext = { ...contextFor("student"), role: null, audience: null, scopeKind: null };
    const hrefs = [
      ...getDesktopNavigation(orphan).map(({ href }) => href),
      ...getMobileNavigation(orphan).map(({ href }) => href),
    ];
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/notifications");
    expect(hrefs).toContain(accountNavigationItem.href);
  });
});

/**
 * M14 A-14 — thanh đầu trang phải nói đúng chỗ người dùng đang đứng.
 *
 * Bản cũ chỉ tra `platformNavigation`, nên hai trang **không có mục điều hướng**
 * rơi vào fallback và hiện tên ứng dụng: `/access-denied` (đúng lúc người dùng
 * cần biết chuyện gì vừa xảy ra) và `/parent/children/<id>` (hồ sơ một em cụ thể).
 */
describe("getPageTitle — M14 A-14", () => {
  const APP_NAME = "Thiếu Nhi Chợ Quán";

  /** Mọi route thật trong `src/app/(dashboard)`, kể cả trang chi tiết. */
  const DASHBOARD_ROUTES = [
    "/dashboard",
    "/students",
    "/students/6f1e0d7a-0000-4000-8000-000000000001",
    "/classes",
    "/classes/6f1e0d7a-0000-4000-8000-000000000002",
    "/staff",
    "/attendance",
    "/attendance/6f1e0d7a-0000-4000-8000-000000000003",
    "/student/attendance",
    "/parent/absence-requests",
    "/parent/children/6f1e0d7a-0000-4000-8000-000000000004",
    "/teaching-plan",
    "/teaching-plan/6f1e0d7a-0000-4000-8000-000000000005",
    "/results",
    "/results/6f1e0d7a-0000-4000-8000-000000000006",
    "/promotions",
    "/committees",
    "/committees/6f1e0d7a-0000-4000-8000-000000000007",
    "/notifications",
    "/reports",
    "/reports/snapshots",
    "/reports/snapshots/6f1e0d7a-0000-4000-8000-000000000008",
    "/imports",
    "/imports/template",
    "/imports/6f1e0d7a-0000-4000-8000-000000000009",
    "/admin",
    "/account",
    "/access-denied",
  ] as const;

  it("🔴 trang không có mục điều hướng vẫn có tên thật", () => {
    expect(getPageTitle("/access-denied")).toBe("Không có quyền truy cập");
    // `/parent/children` từng nằm trong bảng "đứng riêng"; từ M14 đợt C nó là
    // một mục điều hướng thật nên lấy nhãn từ chính mục đó.
    expect(getPageTitle("/parent/children")).toBe("Con của tôi");
    expect(getPageTitle("/parent/children/6f1e0d7a-0000-4000-8000-000000000004")).toBe("Con của tôi");
  });

  it("không route nào trong vỏ còn rơi về tên ứng dụng", () => {
    for (const pathname of DASHBOARD_ROUTES) {
      expect(getPageTitle(pathname), pathname).not.toBe(APP_NAME);
    }
  });

  it("tiêu đề và đoạn cuối breadcrumb không nói hai điều khác nhau", () => {
    // Cả hai đọc chung một bảng tra; hai bảng riêng lệch nhau là gốc của A-14.
    // Chỉ áp cho route ĐỨNG RIÊNG: route có mục điều hướng thì đoạn cuối là
    // nhãn trang chi tiết ("Hồ sơ thiếu nhi") còn tiêu đề là tên mục ("Thiếu
    // nhi") — khác nhau có chủ đích.
    for (const pathname of ["/access-denied"]) {
      const trail = buildBreadcrumbTrail(pathname);
      expect(trail[trail.length - 1].label, pathname).toBe(getPageTitle(pathname));
    }
  });

  it("vẫn giữ tên ứng dụng làm lưới an toàn cho đường dẫn lạ", () => {
    expect(getPageTitle("/khong-co-that")).toBe(APP_NAME);
  });
});

describe("buildBreadcrumbTrail — Mốc 0B mục 0.7", () => {
  const labels = (pathname: string) => buildBreadcrumbTrail(pathname).map(({ label }) => label);

  it("trang chủ chỉ có một cấp và không tự trỏ về chính nó", () => {
    const trail = buildBreadcrumbTrail("/dashboard");
    expect(trail).toHaveLength(1);
    expect(trail[0]).toEqual({ label: "Trang chủ" });
  });

  it("trang danh sách có hai cấp, trang chi tiết có đúng ba cấp", () => {
    expect(labels("/students")).toEqual(["Trang chủ", "Thiếu nhi"]);
    expect(labels("/students/6f1e0d7a-0000-4000-8000-000000000001")).toEqual([
      "Trang chủ",
      "Thiếu nhi",
      "Hồ sơ thiếu nhi",
    ]);
    expect(labels("/classes/abc")).toEqual(["Trang chủ", "Lớp học", "Chi tiết lớp"]);
    expect(labels("/committees/abc")).toEqual(["Trang chủ", "Ban", "Chi tiết ban"]);
  });

  it("🔴 không bao giờ in id của bản ghi ra breadcrumb", () => {
    const studentId = "6f1e0d7a-0000-4000-8000-000000000001";
    for (const pathname of [
      `/students/${studentId}`,
      `/classes/${studentId}`,
      `/attendance/${studentId}`,
      `/results/${studentId}`,
      `/teaching-plan/${studentId}`,
      `/imports/${studentId}`,
      `/parent/children/${studentId}`,
    ]) {
      const trail = buildBreadcrumbTrail(pathname);
      expect(trail.length).toBeLessThanOrEqual(3);
      for (const crumb of trail) expect(crumb.label).not.toContain(studentId);
    }
  });

  it("đoạn cuối luôn là trang hiện tại nên không có href, các đoạn trước thì có", () => {
    const trail = buildBreadcrumbTrail("/attendance/abc");
    expect(trail[trail.length - 1].href).toBeUndefined();
    expect(trail.slice(0, -1).every((crumb) => Boolean(crumb.href))).toBe(true);
  });

  it("route ngoài danh sách điều hướng vẫn có đường dẫn đọc được", () => {
    expect(labels("/access-denied")).toEqual(["Trang chủ", "Không có quyền truy cập"]);
    expect(labels("/account")).toEqual(["Trang chủ", "Tài khoản"]);
  });

  it("hồ sơ con nay đủ ba cấp vì 'Con của tôi' đã là mục điều hướng thật", () => {
    expect(labels("/parent/children")).toEqual(["Trang chủ", "Con của tôi"]);
    expect(labels("/parent/children/abc")).toEqual(["Trang chủ", "Con của tôi", "Hồ sơ con"]);
  });

  it("không nhầm /student/attendance với danh sách /students", () => {
    expect(labels("/student/attendance")).toEqual(["Trang chủ", "Điểm danh của em"]);
  });
});
