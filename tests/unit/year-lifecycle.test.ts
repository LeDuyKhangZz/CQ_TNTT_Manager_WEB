import { describe, expect, it } from "vitest";
import {
  academicYearNotice,
  canArchiveAcademicYear,
  isAcademicYearWritable,
  openWorkPhrases,
  totalOpenWork,
  WRITABLE_ACADEMIC_YEAR_STATUSES,
} from "@/features/academic-years/year-lifecycle";

/**
 * M02-B / TB-F07 — BR-M02-N09: chỉ ghi được trong năm học `draft` hoặc `current`.
 *
 * 🔴 Bài `undefined`/`null` là bài quan trọng nhất: năm học không đọc được (dữ liệu
 * hỏng, RLS chặn) phải coi là **KHÔNG ghi được**. Mở khoá vì thiếu thông tin là đúng
 * hướng sai trong một chốt chặn.
 */
describe("năm học nào còn ghi được", () => {
  it("năm nháp và năm đang áp dụng thì ghi được", () => {
    expect(isAcademicYearWritable("draft")).toBe(true);
    expect(isAcademicYearWritable("current")).toBe(true);
    expect(WRITABLE_ACADEMIC_YEAR_STATUSES).toEqual(["draft", "current"]);
  });

  it("năm đã đóng và năm đã lưu trữ thì không", () => {
    expect(isAcademicYearWritable("closed")).toBe(false);
    expect(isAcademicYearWritable("archived")).toBe(false);
  });

  it("không biết trạng thái ⇒ không ghi được", () => {
    expect(isAcademicYearWritable(null)).toBe(false);
    expect(isAcademicYearWritable(undefined)).toBe(false);
    expect(isAcademicYearWritable("")).toBe(false);
    expect(isAcademicYearWritable("CURRENT")).toBe(false);
  });
});

describe("dải thông báo năm học ở trang chi tiết lớp (BR-M02-N10)", () => {
  it("năm đang áp dụng thì KHÔNG có dải nào", () => {
    // Thêm một dải vào mọi trang lớp chỉ dạy người dùng cách phớt lờ nó — rồi họ
    // phớt lờ luôn cái dải thật sự quan trọng.
    expect(academicYearNotice("current", "Năm học 2026-2027")).toBeNull();
  });

  it("năm nháp: vẫn ghi được nhưng phải nói ra", () => {
    const notice = academicYearNotice("draft", "Năm học 2027-2028");
    expect(notice?.tone).toBe("info");
    expect(notice?.title).toContain("Năm học 2027-2028");
    expect(notice?.detail).toContain("nháp");
  });

  it("năm đã đóng: cảnh báo và nói rõ là chỉ đọc", () => {
    const notice = academicYearNotice("closed", "Năm học 2025-2026");
    expect(notice?.tone).toBe("warning");
    expect(notice?.title).toContain("đã đóng");
    expect(notice?.title).toContain("chỉ đọc");
  });

  it("năm đã lưu trữ nói ĐÚNG chữ 'lưu trữ', không gọi chung là 'đóng'", () => {
    const notice = academicYearNotice("archived", "Năm học 2024-2025");
    expect(notice?.title).toContain("đã lưu trữ");
  });

  it("nêu đủ ba việc bị chặn, để người dùng không đi thử từng cái", () => {
    const notice = academicYearNotice("closed", "Năm học 2025-2026");
    expect(notice?.detail).toContain("ghi danh");
    expect(notice?.detail).toContain("cài đặt lớp");
  });
});

/**
 * M02-C / I7 — bảng kiểm tiền điều kiện (WF-16 bước 1–3).
 */
describe("bảng kiểm việc tồn đọng trước khi chốt sổ", () => {
  const none = { openEnrollments: 0, unlockedGradebooks: 0, openSessions: 0 };

  it("không còn việc gì thì KHÔNG in dòng nào", () => {
    // Một bảng kiểm luôn có ba dòng "0 …" thì người dùng phải đọc số mới biết có việc
    // gì; mảng rỗng để trang nói thẳng "không còn việc tồn đọng".
    expect(openWorkPhrases(none)).toEqual([]);
    expect(totalOpenWork(none)).toBe(0);
  });

  it("chỉ nêu mục còn tồn đọng, kèm con số thật", () => {
    const phrases = openWorkPhrases({
      openEnrollments: 37,
      unlockedGradebooks: 0,
      openSessions: 2,
    });
    expect(phrases).toEqual(["37 ghi danh đang mở", "2 buổi điểm danh chưa chốt"]);
  });

  it("đủ ba mục thì nêu đủ ba", () => {
    const work = { openEnrollments: 1, unlockedGradebooks: 2, openSessions: 3 };
    expect(openWorkPhrases(work)).toHaveLength(3);
    expect(totalOpenWork(work)).toBe(6);
  });
});

/**
 * M02-C / D-120 / BR-M02-N07 — lưu trữ chỉ sau hạn giữ dữ liệu.
 *
 * 🔴 Bài `retention_until = null` và bài "đúng ngày hạn" là hai bài quan trọng nhất:
 * lưu trữ là thao tác **một chiều** và hệ thống chưa có luồng bỏ lưu trữ, nên thiếu
 * thông tin phải nghiêng về KHÔNG cho làm.
 */
describe("khi nào lưu trữ được năm học (D-120)", () => {
  it("năm đã đóng và đã qua hạn thì lưu trữ được", () => {
    expect(canArchiveAcademicYear("closed", "2025-05-31", "2026-07-26")).toBe(true);
  });

  it("chưa qua hạn thì không", () => {
    expect(canArchiveAcademicYear("closed", "2032-05-31", "2026-07-26")).toBe(false);
  });

  it("ĐÚNG ngày hạn thì vẫn chưa — hạn là ngày cuối còn phải giữ", () => {
    expect(canArchiveAcademicYear("closed", "2026-07-26", "2026-07-26")).toBe(false);
  });

  it("năm chưa đóng thì không lưu trữ được, kể cả đã quá hạn từ lâu", () => {
    expect(canArchiveAcademicYear("current", "2020-05-31", "2026-07-26")).toBe(false);
    expect(canArchiveAcademicYear("draft", "2020-05-31", "2026-07-26")).toBe(false);
    expect(canArchiveAcademicYear("archived", "2020-05-31", "2026-07-26")).toBe(false);
  });

  it("không biết hạn ⇒ không lưu trữ được", () => {
    expect(canArchiveAcademicYear("closed", null, "2026-07-26")).toBe(false);
  });
});
