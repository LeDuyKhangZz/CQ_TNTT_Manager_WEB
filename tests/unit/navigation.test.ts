import { describe, expect, it } from "vitest";
import { classStaffMobileNavigation, getPageTitle, isNavigationItemActive, platformNavigation } from "@/config/navigation";

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
