import { describe, expect, it } from "vitest";
import { adminProvisionableRoles } from "@/features/auth/account-directory";
import { classRoleForCapacity, grantableRolesForStaff } from "@/features/staff/grantable-roles";
import { CLASS_ROLES, STAFF_PROFILE_ROLES } from "@/lib/permissions/roles";

/**
 * D-111 (M04-C) — "mỗi việc một nơi": `/admin` chỉ còn cấp tài khoản cho người
 * KHÔNG có hồ sơ Giáo lý viên; hồ sơ Giáo lý viên cấp tại `/staff/[staffId]`.
 * Hai danh sách vì thế phải **bù trừ nhau**, không được có vai trò nào rơi ra
 * ngoài cả hai — đó chính là lỗ hổng mà bài test cuối cùng canh.
 */

describe("adminProvisionableRoles (/admin — trường hợp ngoại lệ)", () => {
  it("Super Admin chỉ còn cấp được bốn vai trò không gắn hồ sơ nhân sự", () => {
    expect(adminProvisionableRoles("super_admin")).toEqual([
      "parish_priest",
      "chaplain",
      "guardian",
      "student",
    ]);
  });

  it("không bao giờ có super_admin — trần vai trò tuyệt đối D-102", () => {
    expect(adminProvisionableRoles("super_admin")).not.toContain("super_admin");
  });

  it("không còn vai trò nào gắn hồ sơ Giáo lý viên", () => {
    for (const role of adminProvisionableRoles("super_admin")) {
      expect(STAFF_PROFILE_ROLES).not.toContain(role);
    }
  });

  it("người chưa có vai trò không cấp được gì", () => {
    expect(adminProvisionableRoles(null)).toEqual([]);
  });
});

describe("classRoleForCapacity", () => {
  it("ánh xạ đúng ba capacity của phân công lớp", () => {
    expect(classRoleForCapacity("representative")).toBe("class_representative");
    expect(classRoleForCapacity("member")).toBe("class_teacher");
    expect(classRoleForCapacity("trainee")).toBe("trainee_assistant");
  });

  it("không có phân công hoặc capacity lạ ⇒ không có vai trò lớp nào", () => {
    expect(classRoleForCapacity(null)).toBeNull();
    expect(classRoleForCapacity("khong-ton-tai")).toBeNull();
  });
});

describe("grantableRolesForStaff (/staff/[staffId])", () => {
  it("hồ sơ đang đứng lớp: vai trò lớp đứng đầu VÀ được chọn sẵn", () => {
    const result = grantableRolesForStaff("super_admin", "member");
    expect(result.roles[0]).toBe("class_teacher");
    expect(result.recommended).toBe("class_teacher");
  });

  /**
   * Đây là lỗ hổng do D-111 tạo ra nếu không vá: sau khi `/admin` bỏ nhánh Giáo
   * lý viên, một người vừa đứng lớp vừa làm Trưởng ngành sẽ **không cấp được tài
   * khoản ở đâu cả** — bản M01-B chỉ cho chọn đúng vai trò lớp.
   */
  it("hồ sơ đang đứng lớp vẫn cấp được vai trò ngành/toàn xứ đoàn", () => {
    const result = grantableRolesForStaff("super_admin", "member");
    expect(result.roles).toContain("sector_leader");
    expect(result.roles).toContain("secretary");
  });

  it("hồ sơ chưa có phân công: KHÔNG hiện vai trò lớp nào", () => {
    const result = grantableRolesForStaff("super_admin", null);
    for (const role of CLASS_ROLES) {
      expect(result.roles).not.toContain(role);
    }
    // Không có lựa chọn hiển nhiên đúng ⇒ để trống, bắt người dùng chọn.
    expect(result.recommended).toBeNull();
  });

  it("danh sách không trùng lặp và luôn nằm trong trần vai trò", () => {
    const result = grantableRolesForStaff("super_admin", "representative");
    expect(new Set(result.roles).size).toBe(result.roles.length);
    expect(result.roles).not.toContain("super_admin");
  });

  it("người chưa có vai trò không cấp được gì", () => {
    expect(grantableRolesForStaff(null, "member")).toEqual({ roles: [], recommended: null });
  });

  it("hai màn hình cộng lại phủ hết vai trò Super Admin cấp được", () => {
    const admin = adminProvisionableRoles("super_admin");
    const atProfile = grantableRolesForStaff("super_admin", "member").roles;
    const covered = new Set([...admin, ...atProfile]);
    for (const role of STAFF_PROFILE_ROLES) {
      // Vai trò lớp chỉ phủ được khi capacity khớp — kiểm riêng ở dưới.
      if (CLASS_ROLES.includes(role)) continue;
      expect(covered.has(role)).toBe(true);
    }
    for (const capacity of ["representative", "member", "trainee"] as const) {
      const classRole = classRoleForCapacity(capacity);
      expect(grantableRolesForStaff("super_admin", capacity).roles).toContain(classRole);
    }
  });
});
