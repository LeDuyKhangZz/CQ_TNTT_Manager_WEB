import { describe, expect, it } from "vitest";
import { buildGradebookExportData, safeSpreadsheetText } from "../../src/features/assessments/export-data";
import type { GradebookDetail } from "../../src/features/assessments/server/queries";

/**
 * M07-A · **TB-M07-08 / S-10 / AC-08-01 · AC-08-02**.
 *
 * 🔴 **Bài kiểm cũ là một phần của lỗi, không chỉ bỏ sót nó.** 5-Whys của F18
 * dừng ở bước 5 với đúng câu này: *"test viết theo hàm chứ không theo bề mặt tấn
 * công"* — nó gọi `safeSpreadsheetText` **tách rời** rồi đếm
 * `headers).toHaveLength(5)`, nên bảng kiểm S-10 ghi ✅ trong khi tiêu đề cột đi
 * thẳng ra file không qua bộ lọc nào.
 *
 * Bài mới quét **mọi ô văn bản** mà hàm dựng ra. Thêm một ô mới về sau mà quên
 * làm sạch thì bài này đỏ, không cần ai nhớ bổ sung ca kiểm.
 */

/** Đúng danh sách mà `safeSpreadsheetText` canh (`lib/exports/spreadsheet.ts`). */
const FORMULA_START = /^\s*[=+\-@]|^[\t\r]/;

const HOSTILE_DETAIL = {
  className: "-DDE Chiên Con 1",
  academicYearCode: "2026-2027",
  assessments: [
    { id: "a", title: "=1+1", weight: 1 },
    { id: "b", title: "@SUM(A1:A9)", weight: 2 },
  ],
  students: [
    { saintName: "+Maria", fullName: "Nguyễn An", weightedAverage: 8.4, scores: { a: { score: 9 }, b: { score: 8 } } },
    { saintName: "Gioan", fullName: "\tTrần Bình", weightedAverage: null, scores: {} },
  ],
} as unknown as GradebookDetail;

describe("gradebook export", () => {
  it("chống Excel formula injection", () => {
    expect(safeSpreadsheetText("=HYPERLINK(\"bad\")")).toBe("'=HYPERLINK(\"bad\")");
    expect(safeSpreadsheetText("  -1+2")).toBe("'  -1+2");
    expect(safeSpreadsheetText("Maria")).toBe("Maria");
  });

  it("giữ đúng số dòng và cột của lớp đang xuất", () => {
    const detail = {
      className: "Chiên Con 1",
      academicYearCode: "2026-2027",
      assessments: [
        { id: "a", title: "Giữa kỳ", weight: 2 },
        { id: "b", title: "Cuối kỳ", weight: 3 },
      ],
      students: [
        { saintName: "Maria", fullName: "Nguyễn An", weightedAverage: 8.4, scores: { a: { score: 9 }, b: { score: 8 } } },
        { saintName: "Gioan", fullName: "Trần Bình", weightedAverage: null, scores: {} },
      ],
    } as unknown as GradebookDetail;
    const data = buildGradebookExportData(detail);
    expect(data.headers).toHaveLength(5);
    expect(data.rows).toHaveLength(2);
    expect(data.rows[0]).toEqual(["Maria", "Nguyễn An", 9, 8, 8.4]);
    expect(data.rows[1]).toEqual(["Gioan", "Trần Bình", null, null, null]);
    expect(data.title).toBe("BẢNG ĐIỂM CHIÊN CON 1");
    expect(data.subtitle).toBe("Năm học 2026-2027");
  });

  it("AC-08-01 — tên cột là công thức thì ô tiêu đề bắt đầu bằng dấu nháy đơn", () => {
    const data = buildGradebookExportData(HOSTILE_DETAIL);
    expect(data.headers[2]).toBe("'=1+1 (HS 1)");
    expect(data.headers[3]).toBe("'@SUM(A1:A9) (HS 2)");
  });

  it("AC-08-02 — KHÔNG ô văn bản nào của bản xuất mở đầu bằng ký tự công thức", () => {
    const data = buildGradebookExportData(HOSTILE_DETAIL);
    const textCells = [
      data.title,
      data.subtitle,
      ...data.headers,
      ...data.rows.flat().filter((cell): cell is string => typeof cell === "string"),
    ];
    expect(textCells.length).toBeGreaterThan(0);
    for (const cell of textCells) {
      expect(FORMULA_START.test(cell), `ô "${cell}" chưa được làm sạch`).toBe(false);
    }
  });

  it("tên lớp chứa ký tự công thức không lọt được vào đầu ô tiêu đề trang", () => {
    // Ô A1 luôn mở đầu bằng chuỗi cố định "BẢNG ĐIỂM ", nên dấu nháy đơn không
    // cần xuất hiện — điều phải đúng là **đầu ô an toàn**, không phải "có dấu
    // nháy". Bọc cả ô (thay vì bọc riêng biến như 04_TO_BE_FLOWS viết) giữ cho
    // khẳng định này còn đúng kể cả khi ai đó bỏ tiền tố đi về sau.
    const data = buildGradebookExportData(HOSTILE_DETAIL);
    expect(data.title.startsWith("BẢNG ĐIỂM")).toBe(true);
    expect(FORMULA_START.test(data.title)).toBe(false);
  });
});
