import { describe, expect, it } from "vitest";
import { updateClassSchema } from "@/features/classes/schemas";

/**
 * M02-B / I6 — ranh giới của `updateClass`.
 *
 * 🔴 Bài "danh sách trắng" là **tiêu chí hồi quy R6** của `08_ACCEPTANCE_CRITERIA.md`
 * §3, chuyển sang đây khi `updateClassSchema` rời `features/academic-years`. Nó bảo
 * vệ một ràng buộc bảo mật, không phải một tiện lợi: `academic_year_id`,
 * `grade_level_id`, `section_code` và `display_name` xác định lớp này **là lớp nào**
 * trong cơ cấu 19 lớp chuẩn. Cho sửa chúng qua biểu mẫu là cho phép biến "Ấu 1A của
 * năm 2026-2027" thành một lớp khác hẳn, trong khi mọi ghi danh, điểm danh và bảng
 * điểm đã trỏ vào vẫn bám nguyên.
 */
const VALID_ID = "00000000-0000-4000-8000-000000000001";

describe("updateClassSchema — danh sách trắng (R6)", () => {
  it("cắt bỏ mọi trường xác định lớp là lớp nào", () => {
    const parsed = updateClassSchema.parse({
      id: VALID_ID,
      status: "active",
      meetingLocation: "Phòng 1",
      notes: null,
      academicYearId: "ignored",
      academic_year_id: "ignored",
      grade_level_id: "ignored",
      section_code: "B",
      display_name: "Lớp giả",
    });
    expect(parsed).not.toHaveProperty("academicYearId");
    expect(parsed).not.toHaveProperty("academic_year_id");
    expect(parsed).not.toHaveProperty("grade_level_id");
    expect(parsed).not.toHaveProperty("section_code");
    expect(parsed).not.toHaveProperty("display_name");
    expect(Object.keys(parsed).sort()).toEqual(["id", "meetingLocation", "notes", "status"]);
  });

  it("nhận đúng ba trạng thái lớp của enum trong cơ sở dữ liệu", () => {
    for (const status of ["active", "inactive", "closed"]) {
      expect(updateClassSchema.safeParse({ id: VALID_ID, status, meetingLocation: null, notes: null }).success).toBe(true);
    }
  });

  it("từ chối trạng thái ngoài enum", () => {
    expect(
      updateClassSchema.safeParse({ id: VALID_ID, status: "archived", meetingLocation: null, notes: null }).success,
    ).toBe(false);
  });

  it("từ chối id không phải UUID — vào đây thì không được thành 500", () => {
    expect(
      updateClassSchema.safeParse({ id: "khong-phai-uuid", status: "active", meetingLocation: null, notes: null }).success,
    ).toBe(false);
  });

  it("cắt khoảng trắng hai đầu của phòng sinh hoạt và ghi chú", () => {
    const parsed = updateClassSchema.parse({
      id: VALID_ID,
      status: "active",
      meetingLocation: "  Phòng 3, tầng 2  ",
      notes: "  Lớp học ghép  ",
    });
    expect(parsed.meetingLocation).toBe("Phòng 3, tầng 2");
    expect(parsed.notes).toBe("Lớp học ghép");
  });

  it("chặn phòng sinh hoạt quá 200 ký tự và ghi chú quá 1000 ký tự", () => {
    expect(
      updateClassSchema.safeParse({ id: VALID_ID, status: "active", meetingLocation: "x".repeat(201), notes: null }).success,
    ).toBe(false);
    expect(
      updateClassSchema.safeParse({ id: VALID_ID, status: "active", meetingLocation: null, notes: "x".repeat(1001) }).success,
    ).toBe(false);
  });
});
