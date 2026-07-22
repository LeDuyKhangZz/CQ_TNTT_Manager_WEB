import { describe, expect, it } from "vitest";
import { buildGradebookExportData, safeSpreadsheetText } from "../../src/features/assessments/export-data";
import type { GradebookDetail } from "../../src/features/assessments/server/queries";

describe("gradebook export", () => {
  it("chống Excel formula injection", () => {
    expect(safeSpreadsheetText("=HYPERLINK(\"bad\")")).toBe("'=HYPERLINK(\"bad\")");
    expect(safeSpreadsheetText("  -1+2")).toBe("'  -1+2");
    expect(safeSpreadsheetText("Maria")).toBe("Maria");
  });

  it("giữ đúng số dòng và cột của lớp đang xuất", () => {
    const detail = {
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
  });
});
