import { describe, expect, it } from "vitest";
import { academicYearInputSchema, updateClassSchema } from "@/features/academic-years/schemas";

describe("academic year schemas", () => {
  it("accepts a valid configured year", () => {
    expect(academicYearInputSchema.safeParse({
      code: "2026-2027",
      name: "Năm học 2026–2027",
      startDate: "2026-09-01",
      endDate: "2027-05-31",
      top5Enabled: false,
      attendanceLockDays: 3,
      attendanceEditLeaseMinutes: 15,
    }).success).toBe(true);
  });

  it("rejects an invalid range", () => {
    expect(academicYearInputSchema.safeParse({
      code: "2026-2027",
      name: "Năm học",
      startDate: "2027-05-31",
      endDate: "2026-09-01",
    }).success).toBe(false);
  });

  it("whitelists editable class fields", () => {
    const parsed = updateClassSchema.parse({
      id: "00000000-0000-4000-8000-000000000001",
      status: "active",
      meetingLocation: "Phòng 1",
      notes: null,
      academicYearId: "ignored",
    });
    expect(parsed).not.toHaveProperty("academicYearId");
  });
});
