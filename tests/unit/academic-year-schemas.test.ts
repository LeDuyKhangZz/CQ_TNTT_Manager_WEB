import { describe, expect, it } from "vitest";
import {
  academicYearInputSchema,
  archiveAcademicYearSchema,
  closeAcademicYearSchema,
  semesterMilestoneSchema,
} from "@/features/academic-years/schemas";

// `updateClassSchema` đã chuyển sang `tests/unit/class-schemas.test.ts` cùng với
// schema của nó ở M02-B (I6). Tiêu chí hồi quy R6 vẫn được giữ, chỉ đổi chỗ.

const VALID_YEAR = {
  code: "2026-2027",
  name: "Năm học 2026–2027",
  startDate: "2026-09-01",
  endDate: "2027-05-31",
  top5Enabled: false,
  attendanceLockDays: 3,
  attendanceEditLeaseMinutes: 15,
};

describe("academic year schemas", () => {
  it("accepts a valid configured year", () => {
    expect(academicYearInputSchema.safeParse(VALID_YEAR).success).toBe(true);
  });

  it("rejects an invalid range", () => {
    expect(academicYearInputSchema.safeParse({
      code: "2026-2027",
      name: "Năm học",
      startDate: "2027-05-31",
      endDate: "2026-09-01",
    }).success).toBe(false);
  });
});

/**
 * **D-71 / D-116** — mốc kết thúc học kỳ 1.
 *
 * Chủ dự án chốt 2026-07-25: **không bắt buộc**, và **sửa được sau**. Hai bài đầu
 * giữ đúng vế thứ nhất: ô trống trên biểu mẫu phải về `null`, KHÔNG thành lỗi. Nếu
 * bài này đỏ thì năm học `2026-2027` đang chạy — tạo ra trước khi có trường này —
 * mất khả năng lưu lại bất cứ thay đổi nào.
 */
describe("mốc kết thúc học kỳ 1 khi tạo năm học (D-71/D-116)", () => {
  it("để trống được — chuỗi rỗng về null", () => {
    const parsed = academicYearInputSchema.parse({ ...VALID_YEAR, semester1EndDate: "" });
    expect(parsed.semester1EndDate).toBeNull();
  });

  it("không khai báo cũng được", () => {
    expect(academicYearInputSchema.parse(VALID_YEAR).semester1EndDate).toBeNull();
  });

  it("nhận mốc nằm trong năm học", () => {
    const parsed = academicYearInputSchema.parse({ ...VALID_YEAR, semester1EndDate: "2027-01-15" });
    expect(parsed.semester1EndDate).toBe("2027-01-15");
  });

  it("từ chối mốc trước ngày bắt đầu — mọi lớp Dự trưởng sẽ cảnh báo ngay buổi đầu", () => {
    expect(
      academicYearInputSchema.safeParse({ ...VALID_YEAR, semester1EndDate: "2026-08-31" }).success,
    ).toBe(false);
  });

  it("từ chối mốc sau ngày kết thúc — cảnh báo sẽ không bao giờ xuất hiện", () => {
    expect(
      academicYearInputSchema.safeParse({ ...VALID_YEAR, semester1EndDate: "2027-06-01" }).success,
    ).toBe(false);
  });

  it("từ chối mốc trùng đúng hai đầu — học kỳ 1 dài 0 ngày hoặc bằng cả năm", () => {
    expect(
      academicYearInputSchema.safeParse({ ...VALID_YEAR, semester1EndDate: "2026-09-01" }).success,
    ).toBe(false);
    expect(
      academicYearInputSchema.safeParse({ ...VALID_YEAR, semester1EndDate: "2027-05-31" }).success,
    ).toBe(false);
  });

  it("nói ra lỗi ở đúng ô semester1EndDate, không phải ô ngày kết thúc", () => {
    const result = academicYearInputSchema.safeParse({ ...VALID_YEAR, semester1EndDate: "2027-06-01" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["semester1EndDate"]);
    }
  });
});

describe("sửa riêng mốc học kỳ 1 (semesterMilestoneSchema)", () => {
  const YEAR_BOUNDS = {
    academicYearId: "00000000-0000-4000-8000-000000000001",
    startDate: "2026-09-01",
    endDate: "2027-05-31",
  };

  it("xoá mốc bằng cách gửi ô trống", () => {
    const parsed = semesterMilestoneSchema.parse({ ...YEAR_BOUNDS, semester1EndDate: "" });
    expect(parsed.semester1EndDate).toBeNull();
  });

  it("lưu được mốc nằm trong năm học", () => {
    expect(
      semesterMilestoneSchema.parse({ ...YEAR_BOUNDS, semester1EndDate: "2027-01-15" }).semester1EndDate,
    ).toBe("2027-01-15");
  });

  it("dùng cùng một luật khoảng thời gian với CHECK constraint của cơ sở dữ liệu", () => {
    expect(semesterMilestoneSchema.safeParse({ ...YEAR_BOUNDS, semester1EndDate: "2025-12-31" }).success).toBe(false);
    expect(semesterMilestoneSchema.safeParse({ ...YEAR_BOUNDS, semester1EndDate: "2028-01-01" }).success).toBe(false);
  });

  it("từ chối năm học không phải UUID", () => {
    expect(
      semesterMilestoneSchema.safeParse({ ...YEAR_BOUNDS, academicYearId: "x", semester1EndDate: "" }).success,
    ).toBe(false);
  });
});

/**
 * **M02-C / I7 / BR-M02-N08** — đóng năm học.
 *
 * 🔴 Bài quan trọng nhất là bài `reason` **không bắt buộc ở tầng Zod**. Luật thật là
 * *"còn việc tồn đọng thì phải có lý do"* (BR-M02-N05), và chỉ cơ sở dữ liệu biết còn
 * bao nhiêu việc tồn đọng **vào đúng thời điểm bấm nút** — nó đếm sau khi khoá dòng.
 * Nhân đôi luật đó ở đây là tạo ra hai chỗ để lệch nhau, và tầng Zod sẽ là tầng nói
 * sai vì nó không có con số.
 */
describe("đóng năm học (I7)", () => {
  const VALID_CLOSE = {
    academicYearId: "11111111-1111-4111-8111-111111111111",
    confirmCode: "2026-2027",
  };

  it("chỉ cần mã năm học gõ lại — lý do không bắt buộc ở tầng này", () => {
    const parsed = closeAcademicYearSchema.parse(VALID_CLOSE);
    expect(parsed.reason).toBe("");
  });

  it("kiểm HÌNH DẠNG mã năm học, không kiểm nội dung", () => {
    // Việc so mã gõ lại với mã THẬT của năm đang bị đóng nằm ở
    // `public.close_academic_year`: tầng này không được tin cái mã do biểu mẫu gửi lên
    // là mã của đúng năm đó.
    expect(closeAcademicYearSchema.safeParse({ ...VALID_CLOSE, confirmCode: "2026" }).success).toBe(false);
    expect(closeAcademicYearSchema.safeParse({ ...VALID_CLOSE, confirmCode: "26-27" }).success).toBe(false);
    expect(closeAcademicYearSchema.safeParse({ ...VALID_CLOSE, confirmCode: "" }).success).toBe(false);
    // Mã của một năm khác vẫn qua được Zod — đúng thiết kế, cơ sở dữ liệu chặn.
    expect(closeAcademicYearSchema.safeParse({ ...VALID_CLOSE, confirmCode: "2099-2100" }).success).toBe(true);
  });

  it("cắt khoảng trắng hai đầu của mã gõ lại", () => {
    expect(closeAcademicYearSchema.parse({ ...VALID_CLOSE, confirmCode: "  2026-2027 " }).confirmCode)
      .toBe("2026-2027");
  });

  it("lý do có giới hạn độ dài", () => {
    expect(
      closeAcademicYearSchema.safeParse({ ...VALID_CLOSE, reason: "x".repeat(501) }).success,
    ).toBe(false);
    expect(
      closeAcademicYearSchema.parse({ ...VALID_CLOSE, reason: "  Hết năm học  " }).reason,
    ).toBe("Hết năm học");
  });

  it("từ chối năm học không phải UUID", () => {
    expect(closeAcademicYearSchema.safeParse({ ...VALID_CLOSE, academicYearId: "x" }).success).toBe(false);
    expect(archiveAcademicYearSchema.safeParse({ academicYearId: "x" }).success).toBe(false);
    expect(archiveAcademicYearSchema.safeParse({ academicYearId: VALID_CLOSE.academicYearId }).success).toBe(true);
  });
});
