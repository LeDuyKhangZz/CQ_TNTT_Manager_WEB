import { describe, expect, it } from "vitest";
import {
  assignStaffSchema,
  createStaffSchema,
  endStaffAssignmentSchema,
  updateStaffSchema,
} from "@/features/staff/schemas";

describe("staff schemas", () => {
  it("accepts Di and So as titles", () => {
    const base = { saintName: null, fullName: "Nguyễn Văn A", dateOfBirth: null, phone: "0901234567", email: null, address: null, formationLevel: "none", serviceStatus: "active" };
    expect(createStaffSchema.safeParse({ ...base, title: "di" }).success).toBe(true);
    expect(createStaffSchema.safeParse({ ...base, title: "so" }).success).toBe(true);
  });

  it("requires UUID scope for class assignment", () => {
    expect(assignStaffSchema.safeParse({ staffProfileId: "bad", classId: "bad", capacity: "member", startsOn: "2026-09-01" }).success).toBe(false);
  });

  it("validates historical end dates at the boundary", () => {
    expect(endStaffAssignmentSchema.safeParse({ assignmentId: "00000000-0000-4000-8000-000000000001", endsOn: "2027-05-31" }).success).toBe(true);
  });
});

/**
 * BDH-2025-002 — cặp `appointedRole` / `appointedSectorId` phải khớp NGAY Ở
 * SCHEMA. Ràng buộc `staff_profiles_appointment_shape` ở cơ sở dữ liệu cũng canh
 * đúng luật này, nhưng nó ném một `23514` trần mà `updateStaff` sẽ đổi thành
 * "Không cập nhật được hồ sơ" — người dùng quên chọn ngành sẽ không bao giờ biết
 * mình quên cái gì.
 */
describe("updateStaffSchema — chức vụ bổ nhiệm (BDH-2025-002)", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const sectorId = "10000000-0000-4000-8000-000000000002";

  it("chức vụ toàn xứ đoàn: không cần và không nhận ngành", () => {
    expect(updateStaffSchema.safeParse({ id, appointedRole: "deputy_group_leader" }).success).toBe(true);
    expect(
      updateStaffSchema.safeParse({ id, appointedRole: "deputy_group_leader", appointedSectorId: sectorId }).success,
    ).toBe(false);
  });

  it("chức vụ ngành: bắt buộc kèm ngành", () => {
    expect(updateStaffSchema.safeParse({ id, appointedRole: "sector_leader" }).success).toBe(false);
    expect(
      updateStaffSchema.safeParse({ id, appointedRole: "sector_leader", appointedSectorId: sectorId }).success,
    ).toBe(true);
  });

  it("gỡ chức vụ = gửi null, và null thì không kèm ngành", () => {
    expect(updateStaffSchema.safeParse({ id, appointedRole: null, appointedSectorId: null }).success).toBe(true);
    expect(updateStaffSchema.safeParse({ id, appointedRole: null, appointedSectorId: sectorId }).success).toBe(false);
  });

  it("không nhận vai trò lớp hay super_admin làm chức vụ bổ nhiệm", () => {
    for (const role of ["class_teacher", "class_representative", "trainee_assistant", "super_admin"]) {
      expect(updateStaffSchema.safeParse({ id, appointedRole: role }).success).toBe(false);
    }
  });

  it("lượt sửa không đụng tới sổ bổ nhiệm vẫn qua như cũ", () => {
    expect(updateStaffSchema.safeParse({ id, fullName: "Nguyễn Văn A" }).success).toBe(true);
  });
});
