import { describe, expect, it } from "vitest";
import { adminProvisionableRoles } from "@/features/auth/account-directory";
import {
  classRoleForCapacity,
  grantableRolesForStaff,
  isAppointableRole,
} from "@/features/staff/grantable-roles";
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

/**
 * BDH-2025-002 — sổ Ban Điều Hành thắng phân công lớp.
 *
 * Bài kiểm đầu tiên là hình dạng CHÍNH XÁC của lỗi đã xảy ra trên production:
 * anh Lê Trí Dũng là Xứ đoàn phó Nội vụ mà vẫn đang dạy Nghĩa 2, hộp thoại chọn
 * sẵn "Giáo lý viên lớp" theo phân công, người cấp bấm Xác nhận, và anh đăng
 * nhập với quyền của một Giáo lý viên lớp. 14/20 người của Ban Điều Hành
 * 2025-2026 đứng trước đúng cái bẫy ấy.
 */
describe("isAppointableRole", () => {
  it("nhận sáu chức vụ của sổ Ban Điều Hành", () => {
    for (const role of [
      "group_leader",
      "deputy_group_leader",
      "secretary",
      "treasurer",
      "sector_leader",
      "sector_deputy",
    ] as const) {
      expect(isAppointableRole(role)).toBe(true);
    }
  });

  it("từ chối vai trò lớp, super_admin và các vai trò ngoài hồ sơ nhân sự", () => {
    for (const role of [...CLASS_ROLES, "super_admin", "parish_priest", "guardian", "student"] as const) {
      expect(isAppointableRole(role)).toBe(false);
    }
    expect(isAppointableRole(null)).toBe(false);
  });
});

describe("grantableRolesForStaff — chức vụ bổ nhiệm (BDH-2025-002)", () => {
  it("Xứ đoàn phó đang đứng lớp: chọn sẵn CHỨC VỤ, không phải vai trò lớp", () => {
    const result = grantableRolesForStaff("super_admin", "member", "deputy_group_leader");
    expect(result.recommended).toBe("deputy_group_leader");
    expect(result.roles[0]).toBe("deputy_group_leader");
  });

  it("vai trò lớp vẫn còn trong danh sách để đổi lại được", () => {
    const result = grantableRolesForStaff("super_admin", "member", "sector_leader");
    expect(result.roles).toContain("class_teacher");
    expect(new Set(result.roles).size).toBe(result.roles.length);
  });

  it("không có chức vụ trong sổ ⇒ giữ nguyên hành vi D-111 cũ", () => {
    const withoutBook = grantableRolesForStaff("super_admin", "member");
    const withNullBook = grantableRolesForStaff("super_admin", "member", null);
    expect(withNullBook).toEqual(withoutBook);
    expect(withoutBook.recommended).toBe("class_teacher");
  });

  it("chức vụ trong sổ vẫn phải qua trần vai trò D-102", () => {
    // Thư ký (rank 70) không cấp được vai trò Xứ đoàn trưởng (rank 80).
    const result = grantableRolesForStaff("secretary", "member", "group_leader");
    expect(result.roles).not.toContain("group_leader");
    expect(result.recommended).toBe("class_teacher");
  });

  it("một vai trò LỚP lọt vào cột chức vụ thì bị bỏ qua, không chọn sẵn", () => {
    // Ràng buộc `staff_profiles_appointment_shape` chặn ở DB; đây là lưới thứ
    // hai cho dữ liệu cũ hoặc một lượt ghi thẳng. Chọn sẵn vai trò lớp mà không
    // kèm classId là đẩy người dùng vào một lượt chèn chắc chắn bị trigger chặn.
    const result = grantableRolesForStaff("super_admin", null, "class_teacher");
    expect(result.recommended).toBeNull();
    expect(result.roles).not.toContain("class_teacher");
  });

  it("hồ sơ chưa có phân công nhưng CÓ chức vụ: vẫn cấp được tài khoản", () => {
    const result = grantableRolesForStaff("super_admin", null, "treasurer");
    expect(result.recommended).toBe("treasurer");
  });
});
