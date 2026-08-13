import { describe, expect, it } from "vitest";
import { assignableRolesForActor, canActorAssignRole } from "@/lib/permissions/roles";
import { canReadStaffSensitive } from "@/features/auth/permissions";

describe("trần vai trò (D-102) — canActorAssignRole", () => {
  it("không ai cấp super_admin, kể cả chính Super Admin", () => {
    expect(canActorAssignRole("super_admin", "super_admin")).toBe(false);
  });

  it("Super Admin cấp được mọi vai trò khác", () => {
    expect(canActorAssignRole("super_admin", "group_leader")).toBe(true);
    expect(canActorAssignRole("super_admin", "sector_leader")).toBe(true);
    expect(canActorAssignRole("super_admin", "class_teacher")).toBe(true);
    expect(canActorAssignRole("super_admin", "guardian")).toBe(true);
  });

  it("không cấp vai trò ngang hoặc cao hơn mình", () => {
    expect(canActorAssignRole("group_leader", "group_leader")).toBe(false);
    expect(canActorAssignRole("group_leader", "deputy_group_leader")).toBe(true);
    expect(canActorAssignRole("sector_leader", "group_leader")).toBe(false);
    expect(canActorAssignRole("class_teacher", "sector_leader")).toBe(false);
  });

  it("người chưa có vai trò không cấp được gì", () => {
    expect(canActorAssignRole(null, "class_teacher")).toBe(false);
  });
});

describe("assignableRolesForActor", () => {
  it("danh sách của Super Admin không bao giờ chứa super_admin", () => {
    const roles = assignableRolesForActor("super_admin");
    expect(roles).not.toContain("super_admin");
    expect(roles).toContain("group_leader");
    expect(roles).toContain("class_teacher");
  });

  it("người chưa có vai trò không cấp được vai trò nào", () => {
    expect(assignableRolesForActor(null)).toEqual([]);
  });
});

describe("canReadStaffSensitive (AC-01.7 — chốt chủ dự án 2026-07-24)", () => {
  it("chỉ vai trò quản trị/toàn xứ đoàn được xem trường nhạy cảm", () => {
    for (const role of ["super_admin", "parish_priest", "chaplain", "group_leader", "deputy_group_leader", "secretary", "treasurer"] as const) {
      expect(canReadStaffSensitive(role)).toBe(true);
    }
  });

  it("GLV lớp / ngành / thành viên Ban không xem được trường nhạy cảm", () => {
    for (const role of ["sector_leader", "sector_deputy", "class_representative", "class_teacher", "trainee_assistant"] as const) {
      expect(canReadStaffSensitive(role)).toBe(false);
    }
    expect(canReadStaffSensitive(null)).toBe(false);
  });
});
