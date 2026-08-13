import { describe, expect, it } from "vitest";
import {
  buildFinalizePreview,
  usedStatuses,
  type FinalizeDraftStudent,
  type FinalizeRosterInfo,
} from "@/features/attendance/finalize-preview";

/**
 * M05-C · TB-03 / AC-F06-1 — bảng phân bố của hộp xác nhận trước khi chốt.
 *
 * Chốt đặt mốc khóa 3 ngày và sau đó chỉ Quản trị viên hệ thống mở lại được,
 * nên đây là chỗ duy nhất người điểm danh còn nhìn thấy toàn cảnh trước khi
 * quyết. Con số phải tính từ **bản nháp**, và phải đủ cả 5 trạng thái × 2 cột.
 */
const ROSTER: FinalizeRosterInfo[] = [
  { enrollmentId: "e1", label: "Giuse Nguyễn Minh An", pendingAbsenceReason: null },
  { enrollmentId: "e2", label: "Maria Trần Thị Ánh", pendingAbsenceReason: "Cháu về quê" },
  { enrollmentId: "e3", label: "Phêrô Lê Văn Đức", pendingAbsenceReason: "Cháu đi khám" },
];

describe("TB-03 — phân bố tính từ bản nháp", () => {
  it("đếm đủ 5 trạng thái cho CẢ HAI cột, và hai cột đếm độc lập", () => {
    const students: FinalizeDraftStudent[] = [
      { enrollmentId: "e1", mass: "present", catechism: "unexcused_absence" },
      { enrollmentId: "e2", mass: "late", catechism: "present" },
      { enrollmentId: "e3", mass: "excused_absence", catechism: "excused_absence" },
    ];

    const preview = buildFinalizePreview(students, [], ROSTER);

    expect(preview.studentTotal).toBe(3);
    expect(preview.mass).toEqual({
      present: 1,
      late: 1,
      left_early: 0,
      excused_absence: 1,
      unexcused_absence: 0,
    });
    expect(preview.catechism).toEqual({
      present: 1,
      late: 0,
      left_early: 0,
      excused_absence: 1,
      unexcused_absence: 1,
    });
  });

  it("tổng mỗi cột luôn bằng sĩ số — không dòng nào rơi mất", () => {
    const students: FinalizeDraftStudent[] = ROSTER.map((entry, index) => ({
      enrollmentId: entry.enrollmentId,
      mass: index === 0 ? "left_early" : "present",
      catechism: "present",
    }));

    const preview = buildFinalizePreview(students, [], ROSTER);
    const sum = (counts: Record<string, number>) =>
      Object.values(counts).reduce((total, value) => total + value, 0);

    expect(sum(preview.mass)).toBe(preview.studentTotal);
    expect(sum(preview.catechism)).toBe(preview.studentTotal);
  });

  it("đếm giáo lý viên có mặt trên tổng số", () => {
    const preview = buildFinalizePreview(
      [],
      [{ status: "present" }, { status: "excused_absence" }, { status: "present" }],
      [],
    );

    expect(preview.staffPresent).toBe(2);
    expect(preview.staffTotal).toBe(3);
  });
});

describe("TB-03 — cảnh báo đơn xin nghỉ bị bỏ qua", () => {
  it("🔴 nêu ĐÚNG TÊN em, không phải một con số", () => {
    const students: FinalizeDraftStudent[] = [
      { enrollmentId: "e1", mass: "present", catechism: "present" },
      { enrollmentId: "e2", mass: "present", catechism: "present" },
      { enrollmentId: "e3", mass: "excused_absence", catechism: "excused_absence" },
    ];

    const preview = buildFinalizePreview(students, [], ROSTER);

    // e2 có đơn mà vẫn "Có mặt" ⇒ nhắc; e3 có đơn và đã đánh vắng ⇒ không nhắc;
    // e1 không có đơn ⇒ không liên quan.
    expect(preview.ignoredAbsenceRequests).toEqual(["Maria Trần Thị Ánh"]);
  });

  it("chỉ nhắc khi CẢ HAI cột còn “Có mặt” — sửa một cột là đã có quyết định", () => {
    const students: FinalizeDraftStudent[] = [
      { enrollmentId: "e2", mass: "present", catechism: "unexcused_absence" },
      { enrollmentId: "e3", mass: "present", catechism: "present" },
    ];

    expect(buildFinalizePreview(students, [], ROSTER).ignoredAbsenceRequests).toEqual([
      "Phêrô Lê Văn Đức",
    ]);
  });

  it("không có đơn nào thì không có cảnh báo nào", () => {
    const preview = buildFinalizePreview(
      [{ enrollmentId: "e1", mass: "present", catechism: "present" }],
      [],
      [ROSTER[0]],
    );
    expect(preview.ignoredAbsenceRequests).toEqual([]);
  });
});

describe("TB-03 — hàng nào được in ra", () => {
  it("bỏ hàng 0/0, giữ hàng chỉ một cột có số", () => {
    const preview = buildFinalizePreview(
      [
        { enrollmentId: "e1", mass: "present", catechism: "present" },
        { enrollmentId: "e2", mass: "present", catechism: "late" },
      ],
      [],
      ROSTER.slice(0, 2),
    );

    expect(usedStatuses(preview)).toEqual(["present", "late"]);
  });

  it("giữ đúng thứ tự chuẩn của hệ thống, không sắp lại theo số lượng", () => {
    const preview = buildFinalizePreview(
      [
        { enrollmentId: "e1", mass: "unexcused_absence", catechism: "unexcused_absence" },
        { enrollmentId: "e2", mass: "unexcused_absence", catechism: "unexcused_absence" },
        { enrollmentId: "e3", mass: "present", catechism: "present" },
      ],
      [],
      ROSTER,
    );

    expect(usedStatuses(preview)).toEqual(["present", "unexcused_absence"]);
  });
});
