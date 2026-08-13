import { describe, expect, it } from "vitest";
import { absenceReviewWindow } from "@/features/absence-requests/review-window";

/**
 * M05-B · TB-06 — cửa sổ của thẻ "Đơn xin nghỉ tuần này".
 *
 * Hàm nhỏ nhưng canh hai điều dễ làm sai và **không** hiện ra thành lỗi: cửa sổ
 * nhìn cả về trước (đơn cho Chúa nhật vừa rồi chưa ai ghi nhận vẫn phải thấy),
 * và phép cộng ngày không được lệch khi bước qua ranh giới tháng hay qua ngày
 * đổi giờ mùa hè của bất kỳ múi giờ nào — chuỗi ngày neo bằng UTC nên không có
 * đường nào để lệch.
 */
describe("TB-06 — cửa sổ đơn xin nghỉ", () => {
  it("mở ±7 ngày quanh hôm nay", () => {
    expect(absenceReviewWindow("2026-08-03")).toEqual({
      start: "2026-07-27",
      end: "2026-08-10",
    });
  });

  it("nhìn cả về TRƯỚC — đơn của buổi vừa rồi chưa ghi nhận vẫn trong tầm mắt", () => {
    const { start } = absenceReviewWindow("2026-08-03");
    // Chúa nhật 02/08 nằm trong cửa sổ, chứ không rơi ra ngoài vì đã qua.
    expect(start <= "2026-08-02").toBe(true);
  });

  it("bước qua ranh giới tháng vẫn đúng", () => {
    expect(absenceReviewWindow("2026-03-03")).toEqual({
      start: "2026-02-24",
      end: "2026-03-10",
    });
  });

  it("bước qua ranh giới năm vẫn đúng", () => {
    expect(absenceReviewWindow("2026-01-02")).toEqual({
      start: "2025-12-26",
      end: "2026-01-09",
    });
  });

  it("nhận độ rộng khác khi cần", () => {
    expect(absenceReviewWindow("2026-08-03", 1)).toEqual({
      start: "2026-08-02",
      end: "2026-08-04",
    });
  });
});
