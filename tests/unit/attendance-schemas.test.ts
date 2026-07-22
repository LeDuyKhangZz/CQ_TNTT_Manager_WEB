import { describe, expect, it } from "vitest";
import { isAbsent, meetingTypeForDate } from "@/features/attendance/constants";
import { saveAttendanceSchema } from "@/features/attendance/schemas";
import { createAbsenceRequestSchema } from "@/features/absence-requests/schemas";

describe("meetingTypeForDate", () => {
  it("chỉ nhận thứ Năm và Chúa nhật (D-29)", () => {
    expect(meetingTypeForDate("2026-07-23")).toBe("thursday");
    expect(meetingTypeForDate("2026-07-26")).toBe("sunday");
    expect(meetingTypeForDate("2026-07-24")).toBeNull();
    expect(meetingTypeForDate("2026-07-21")).toBeNull();
  });
});

describe("isAbsent", () => {
  it("coi cả vắng có phép lẫn không phép là vắng, đi trễ/về sớm thì không", () => {
    expect(isAbsent("excused_absence")).toBe(true);
    expect(isAbsent("unexcused_absence")).toBe(true);
    expect(isAbsent("present")).toBe(false);
    expect(isAbsent("late")).toBe(false);
    expect(isAbsent("left_early")).toBe(false);
  });
});

describe("saveAttendanceSchema", () => {
  const sessionId = "11111111-1111-4111-8111-111111111111";
  const enrollmentId = "22222222-2222-4222-8222-222222222222";

  it("giữ Thánh lễ và Giáo lý là hai giá trị độc lập (D-30)", () => {
    const parsed = saveAttendanceSchema.parse({
      sessionId,
      students: [
        { enrollmentId, massStatus: "present", catechismStatus: "unexcused_absence", note: "  " },
      ],
      staff: [],
      finalize: false,
    });
    expect(parsed.students[0].massStatus).toBe("present");
    expect(parsed.students[0].catechismStatus).toBe("unexcused_absence");
    // Ghi chú toàn khoảng trắng phải thành null, không phải chuỗi rỗng.
    expect(parsed.students[0].note).toBeNull();
  });

  it("từ chối trạng thái không có trong enum", () => {
    expect(() =>
      saveAttendanceSchema.parse({
        sessionId,
        students: [{ enrollmentId, massStatus: "absent", catechismStatus: "present" }],
        staff: [],
        finalize: true,
      }),
    ).toThrow();
  });

  it("không nhận trạng thái thiếu nhi cho điểm danh giáo lý viên", () => {
    expect(() =>
      saveAttendanceSchema.parse({
        sessionId,
        students: [],
        staff: [{ classStaffAssignmentId: enrollmentId, status: "late" }],
        finalize: false,
      }),
    ).toThrow();
  });
});

describe("createAbsenceRequestSchema", () => {
  const studentId = "33333333-3333-4333-8333-333333333333";

  it("chặn ngày không phải buổi sinh hoạt", () => {
    const result = createAbsenceRequestSchema.safeParse({
      studentId,
      absenceDate: "2026-07-24",
      reason: "Về quê",
    });
    expect(result.success).toBe(false);
  });

  it("nhận Chúa nhật", () => {
    const result = createAbsenceRequestSchema.safeParse({
      studentId,
      absenceDate: "2026-07-26",
      reason: "Về quê",
    });
    expect(result.success).toBe(true);
  });

  it("bắt buộc có lý do", () => {
    const result = createAbsenceRequestSchema.safeParse({
      studentId,
      absenceDate: "2026-07-26",
      reason: "   ",
    });
    expect(result.success).toBe(false);
  });
});
