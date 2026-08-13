import { describe, expect, it } from "vitest";
import {
  adminPasswordSchema,
  adminUsernameSchema,
  accountStatusUpdateSchema,
  assignPrimaryRoleSchema,
  changePasswordSchema,
  changePasswordWithCurrentSchema,
  loginSchema,
  provisionAccountSchema,
  provisionForStaffSchema,
} from "@/features/auth/schemas";

const UUID_A = "00000000-0000-4000-8000-000000000001";
const UUID_B = "00000000-0000-4000-8000-000000000002";
const UUID_C = "00000000-0000-4000-8000-000000000003";

describe("loginSchema", () => {
  it("yêu cầu username và password", () => {
    expect(loginSchema.safeParse({ username: "", password: "" }).success).toBe(false);
  });

  it("chấp nhận thông tin đăng nhập ở mức schema giao diện", () => {
    expect(loginSchema.safeParse({ username: "GLV023", password: "matkhau" }).success).toBe(true);
  });

  /**
   * D-111 (M04-C): biểu mẫu `/admin` thu hẹp về trường hợp ngoại lệ. Trước đây bài
   * này khẳng định `sector_leader` + `staffProfileId` là hợp lệ; nay MỌI vai trò
   * gắn hồ sơ nhân sự bị từ chối ngay ở schema, không chỉ bị ẩn khỏi ô chọn — đó
   * mới là "thu hẹp", còn ẩn nút thì không phải phân quyền (AGENTS §5).
   */
  it("từ chối mọi vai trò gắn hồ sơ Giáo lý viên — đường đó là /staff/[staffId]", () => {
    const base = {
      username: "GLV001",
      displayName: "Anrê Nguyễn Văn A",
      startsOn: "2026-09-01",
    };
    for (const role of ["sector_leader", "class_teacher", "secretary", "treasurer"] as const) {
      expect(provisionAccountSchema.safeParse({ ...base, role }).success).toBe(false);
    }
    expect(provisionAccountSchema.safeParse({
      ...base,
      role: "sector_leader",
      academicYearId: "00000000-0000-4000-8000-000000000001",
      sectorId: "00000000-0000-4000-8000-000000000002",
    }).success).toBe(false);
  });

  it("vẫn cấp được tài khoản ngoại lệ cho người không có hồ sơ Giáo lý viên", () => {
    const base = {
      username: "chaso",
      displayName: "Cha sở Giuse",
      startsOn: "2026-09-01",
    };
    expect(provisionAccountSchema.safeParse({ ...base, role: "parish_priest" }).success).toBe(true);
    expect(provisionAccountSchema.safeParse({ ...base, role: "chaplain" }).success).toBe(true);
    // Vai trò toàn cục không nhận phạm vi năm/ngành/lớp.
    expect(provisionAccountSchema.safeParse({
      ...base,
      role: "parish_priest",
      academicYearId: "00000000-0000-4000-8000-000000000001",
    }).success).toBe(false);
  });

  it("requires guardian and student accounts to link their business profile", () => {
    const base = {
      username: "AUTH001",
      displayName: "Tài khoản liên kết",
      startsOn: "2026-09-01",
    };
    expect(provisionAccountSchema.safeParse({ ...base, role: "guardian" }).success).toBe(false);
    expect(provisionAccountSchema.safeParse({
      ...base,
      role: "guardian",
      guardianId: "00000000-0000-4000-8000-000000000001",
    }).success).toBe(true);
    expect(provisionAccountSchema.safeParse({ ...base, role: "student" }).success).toBe(false);
    expect(provisionAccountSchema.safeParse({
      ...base,
      role: "student",
      studentId: "00000000-0000-4000-8000-000000000002",
    }).success).toBe(true);
  });
});

describe("provisionForStaffSchema (M01-B / TB-01)", () => {
  const base = { staffProfileId: UUID_A, startsOn: "2026-09-01" };

  it("từ chối super_admin — trần vai trò tuyệt đối (D-102)", () => {
    expect(provisionForStaffSchema.safeParse({ ...base, role: "super_admin" }).success).toBe(false);
  });

  it("từ chối vai trò không gắn hồ sơ GLV (guardian/student)", () => {
    expect(provisionForStaffSchema.safeParse({ ...base, role: "guardian" }).success).toBe(false);
    expect(provisionForStaffSchema.safeParse({ ...base, role: "student" }).success).toBe(false);
  });

  it("vai trò toàn cục GLV không nhận phạm vi", () => {
    expect(provisionForStaffSchema.safeParse({ ...base, role: "secretary" }).success).toBe(true);
    expect(provisionForStaffSchema.safeParse({ ...base, role: "secretary", classId: UUID_B }).success).toBe(false);
  });

  it("vai trò lớp cần năm học và lớp", () => {
    expect(provisionForStaffSchema.safeParse({ ...base, role: "class_teacher" }).success).toBe(false);
    expect(
      provisionForStaffSchema.safeParse({ ...base, role: "class_teacher", academicYearId: UUID_B, classId: UUID_C }).success,
    ).toBe(true);
  });

  it("vai trò ngành cần năm học và ngành", () => {
    expect(provisionForStaffSchema.safeParse({ ...base, role: "sector_leader", academicYearId: UUID_B }).success).toBe(false);
    expect(
      provisionForStaffSchema.safeParse({ ...base, role: "sector_leader", academicYearId: UUID_B, sectorId: UUID_C }).success,
    ).toBe(true);
  });
});

describe("assignPrimaryRoleSchema (M01-B / TB-05)", () => {
  const base = { profileId: UUID_A, startsOn: "2026-09-01" };

  it("từ chối super_admin", () => {
    expect(assignPrimaryRoleSchema.safeParse({ ...base, role: "super_admin" }).success).toBe(false);
  });

  it("vai trò lớp cần năm học và lớp", () => {
    expect(assignPrimaryRoleSchema.safeParse({ ...base, role: "class_teacher" }).success).toBe(false);
    expect(
      assignPrimaryRoleSchema.safeParse({ ...base, role: "class_teacher", academicYearId: UUID_B, classId: UUID_C }).success,
    ).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("chấp nhận mật khẩu 8 ký tự gồm chữ thường và số", () => {
    expect(changePasswordSchema.safeParse({ password: "matkhau1", confirmPassword: "matkhau1" }).success).toBe(true);
  });

  it("từ chối mật khẩu ngắn hoặc xác nhận không khớp", () => {
    expect(changePasswordSchema.safeParse({ password: "abc123", confirmPassword: "abc123" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ password: "matkhau1", confirmPassword: "matkhau2" }).success).toBe(false);
  });
});

describe("changePasswordWithCurrentSchema (TB-04 — đổi tự nguyện)", () => {
  it("bắt buộc mật khẩu hiện tại", () => {
    expect(
      changePasswordWithCurrentSchema.safeParse({ password: "matkhaumoi1", confirmPassword: "matkhaumoi1" }).success,
    ).toBe(false);
    expect(
      changePasswordWithCurrentSchema.safeParse({
        currentPassword: "matkhaucu1",
        password: "matkhaumoi1",
        confirmPassword: "matkhaumoi1",
      }).success,
    ).toBe(true);
  });

  it("từ chối khi mật khẩu mới trùng mật khẩu hiện tại (AC-03.3)", () => {
    expect(
      changePasswordWithCurrentSchema.safeParse({
        currentPassword: "matkhau1",
        password: "matkhau1",
        confirmPassword: "matkhau1",
      }).success,
    ).toBe(false);
  });

  it("từ chối khi xác nhận không khớp", () => {
    expect(
      changePasswordWithCurrentSchema.safeParse({
        currentPassword: "matkhaucu1",
        password: "matkhaumoi1",
        confirmPassword: "matkhaumoi2",
      }).success,
    ).toBe(false);
  });
});

describe("accountStatusUpdateSchema (Q4 — bỏ 'locked' khỏi UI)", () => {
  it("chỉ nhận active/disabled, từ chối locked", () => {
    expect(accountStatusUpdateSchema.safeParse("active").success).toBe(true);
    expect(accountStatusUpdateSchema.safeParse("disabled").success).toBe(true);
    expect(accountStatusUpdateSchema.safeParse("locked").success).toBe(false);
  });
});

describe("admin account edits", () => {
  it("validates username and a password of at least 8 characters", () => {
    expect(adminUsernameSchema.safeParse("GLV123").success).toBe(true);
    expect(adminUsernameSchema.safeParse("").success).toBe(false);
    expect(adminPasswordSchema.safeParse("matkhau1").success).toBe(true);
    expect(adminPasswordSchema.safeParse("ngan").success).toBe(false);
  });
});
