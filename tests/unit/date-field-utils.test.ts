import { describe, expect, it } from "vitest";
import {
  formatIsoForDisplay,
  isOutOfRange,
  joinDateTime,
  monthGrid,
  parseDateInput,
  shiftIsoDays,
  shiftIsoMonths,
  splitDateTime,
} from "@/components/ui/date-field-utils";

/**
 * `P3-UI-001` Đợt C — phần thuần logic của `DateField`/`DateTimeField` (`17` §5).
 *
 * 🔴 Đây là chỗ dễ sai nhất của cả đợt: một lỗi đọc ngày không làm trang trắng,
 * nó chỉ **ghi sai ngày sinh của một em** rồi im lặng.
 */

describe("parseDateInput", () => {
  it("đọc dd/MM/yyyy — kiểu người dùng gõ và kiểu ô này hiển thị", () => {
    expect(parseDateInput("15/01/2016")).toBe("2016-01-15");
    expect(parseDateInput("05/09/2026")).toBe("2026-09-05");
  });

  it("nhận thiếu số 0 và dấu phân cách khác", () => {
    expect(parseDateInput("5/9/2026")).toBe("2026-09-05");
    expect(parseDateInput("5-9-2026")).toBe("2026-09-05");
    expect(parseDateInput("5.9.2026")).toBe("2026-09-05");
  });

  it("🔴 nhận LUÔN yyyy-MM-dd — bộ kiểm E2E gõ đúng kiểu này", () => {
    // `getByLabel("Ngày sinh").fill("2016-01-15")` phải chạy y như cũ.
    expect(parseDateInput("2016-01-15")).toBe("2016-01-15");
  });

  it("từ chối ngày KHÔNG có thật thay vì trôi sang tháng sau", () => {
    // `new Date(2016, 1, 31)` cho ra 02/03 — im lặng và sai.
    expect(parseDateInput("31/02/2016")).toBeNull();
    expect(parseDateInput("30/02/2024")).toBeNull();
    expect(parseDateInput("32/01/2016")).toBeNull();
    expect(parseDateInput("15/13/2016")).toBeNull();
  });

  it("29/02 đúng vào năm nhuận và sai vào năm thường", () => {
    expect(parseDateInput("29/02/2024")).toBe("2024-02-29");
    expect(parseDateInput("29/02/2023")).toBeNull();
  });

  it("chuỗi rỗng hoặc rác trả null", () => {
    expect(parseDateInput("")).toBeNull();
    expect(parseDateInput("   ")).toBeNull();
    expect(parseDateInput("abc")).toBeNull();
    expect(parseDateInput("15/01")).toBeNull();
  });
});

describe("formatIsoForDisplay", () => {
  it("🔴 LUÔN ra dd/MM/yyyy, không phụ thuộc locale của trình duyệt", () => {
    // Đây chính là lỗi chủ dự án báo: ô native hiện MM/DD/YYYY trên máy
    // đặt tiếng Anh. Hàm này không hỏi trình duyệt câu nào.
    expect(formatIsoForDisplay("2016-01-15")).toBe("15/01/2016");
    expect(formatIsoForDisplay("2026-12-03")).toBe("03/12/2026");
  });

  it("chuỗi không phải ISO thì trả nguyên văn, không bịa", () => {
    expect(formatIsoForDisplay("")).toBe("");
    expect(formatIsoForDisplay("chưa rõ")).toBe("chưa rõ");
  });
});

describe("splitDateTime · joinDateTime", () => {
  it("tách yyyy-MM-ddTHH:mm thành hai phần", () => {
    expect(splitDateTime("2026-10-03T19:00")).toEqual({ date: "2026-10-03", time: "19:00" });
  });

  it("chuỗi chỉ có ngày thì phần giờ rỗng, không ném lỗi", () => {
    expect(splitDateTime("2026-10-03")).toEqual({ date: "2026-10-03", time: "" });
    expect(splitDateTime("03/10/2026")).toEqual({ date: "2026-10-03", time: "" });
  });

  it("ghép lại, và thiếu một vế thì trả rỗng chứ không ghép nửa vời", () => {
    expect(joinDateTime("2026-10-03", "19:00")).toBe("2026-10-03T19:00");
    expect(joinDateTime("", "19:00")).toBe("");
    expect(joinDateTime("2026-10-03", "")).toBe("");
  });
});

describe("isOutOfRange", () => {
  it("so với min/max theo đúng thứ tự chuỗi ISO", () => {
    expect(isOutOfRange("2026-01-01", "2026-02-01", undefined)).toBe(true);
    expect(isOutOfRange("2026-03-01", undefined, "2026-02-01")).toBe(true);
    expect(isOutOfRange("2026-02-01", "2026-02-01", "2026-02-01")).toBe(false);
  });

  it("không có min/max thì không ngày nào bị chặn", () => {
    expect(isOutOfRange("1999-12-31")).toBe(false);
  });
});

describe("monthGrid", () => {
  it("luôn đủ 42 ô — lưới đổi chiều cao thì nút tháng chạy khỏi ngón tay", () => {
    expect(monthGrid(2026, 2)).toHaveLength(42);
    expect(monthGrid(2026, 8)).toHaveLength(42);
  });

  it("hàng đầu bắt đầu từ THỨ HAI", () => {
    // 01/09/2026 là thứ Ba ⇒ ô đầu lưới phải là 31/08 (thứ Hai).
    expect(monthGrid(2026, 9)[0].iso).toBe("2026-08-31");
  });

  it("đánh dấu đúng ô nào thuộc tháng đang xem", () => {
    const grid = monthGrid(2026, 9);
    expect(grid[0].inMonth).toBe(false);
    expect(grid.find((cell) => cell.iso === "2026-09-01")?.inMonth).toBe(true);
    expect(grid.filter((cell) => cell.inMonth)).toHaveLength(30);
  });
});

describe("shiftIsoDays · shiftIsoMonths", () => {
  it("nhảy ngày qua ranh giới tháng và năm", () => {
    expect(shiftIsoDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(shiftIsoDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftIsoDays("2026-09-01", 7)).toBe("2026-09-08");
  });

  it("nhảy tháng và KẸP về ngày cuối khi tháng đích ngắn hơn", () => {
    // 31/01 lùi một tháng không được phép hoá thành 03/03.
    expect(shiftIsoMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(shiftIsoMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(shiftIsoMonths("2026-03-15", -1)).toBe("2026-02-15");
    expect(shiftIsoMonths("2026-01-15", -1)).toBe("2025-12-15");
  });
});
