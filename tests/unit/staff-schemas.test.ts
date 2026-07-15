import { describe, expect, it } from "vitest";
import { assignStaffSchema, createStaffSchema, endStaffAssignmentSchema } from "@/features/staff/schemas";

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
