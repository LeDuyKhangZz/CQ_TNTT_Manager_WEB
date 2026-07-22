import { describe, expect, it } from "vitest";
import { createGuardianSchema } from "@/features/guardians/schemas";
import {
  createSacramentSchema,
  createStudentSchema,
  healthProfileSchema,
} from "@/features/students/schemas";

const baseStudent = {
  guardianId: "a2000000-0000-4000-8000-000000000001",
  saintName: "Maria",
  fullName: "Nguyễn Thị An",
  gender: "female",
  dateOfBirth: "2015-03-10",
  patronFeastDate: "",
  address: "",
  phone: "",
  hardshipFlag: false,
  generalNotes: "",
  status: "active",
};

describe("student schemas", () => {
  it("accepts a valid student and normalizes empty optionals to null", () => {
    const parsed = createStudentSchema.safeParse(baseStudent);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.patronFeastDate).toBeNull();
      expect(parsed.data.phone).toBeNull();
    }
  });

  it("rejects a missing guardian", () => {
    expect(createStudentSchema.safeParse({ ...baseStudent, guardianId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects an invalid birth date format", () => {
    expect(createStudentSchema.safeParse({ ...baseStudent, dateOfBirth: "10/03/2015" }).success).toBe(false);
  });

  it("requires a name for the other sacrament type", () => {
    const other = {
      studentId: "a3000000-0000-4000-8000-000000000001",
      sacramentType: "other",
      sacramentName: "",
      sacramentDate: "",
      place: "",
      registryNumber: "",
      godparentName: "",
      notes: "",
    };
    expect(createSacramentSchema.safeParse(other).success).toBe(false);
    expect(createSacramentSchema.safeParse({ ...other, sacramentName: "Nghi thức riêng" }).success).toBe(true);
  });

  it("accepts a standard sacrament without a custom name", () => {
    const parsed = createSacramentSchema.safeParse({
      studentId: "a3000000-0000-4000-8000-000000000001",
      sacramentType: "baptism",
      sacramentName: "",
      sacramentDate: "2015-04-01",
      place: "",
      registryNumber: "",
      godparentName: "",
      notes: "",
    });
    expect(parsed.success).toBe(true);
  });

  it("normalizes empty health fields to null", () => {
    const parsed = healthProfileSchema.safeParse({
      studentId: "a3000000-0000-4000-8000-000000000001",
      allergies: "",
      medicalConditions: "Hen suyễn",
      medications: "",
      emergencyNotes: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.allergies).toBeNull();
      expect(parsed.data.medicalConditions).toBe("Hen suyễn");
    }
  });

  it("requires guardian name and phone", () => {
    expect(createGuardianSchema.safeParse({ fullName: "", phone: "0900000000", address: "" }).success).toBe(false);
    expect(createGuardianSchema.safeParse({ fullName: "Trần Văn B", phone: "0900000000", address: "" }).success).toBe(true);
  });
});
