import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  batchReportFilename,
  buildBatchReportWorkbook,
  REPORT_ERROR_SHEET,
  REPORT_RESULT_SHEET,
  reportRowStatusText,
  type BatchReportRow,
} from "@/features/imports/export";
import { safeSpreadsheetText } from "@/lib/exports/spreadsheet";

/**
 * M12-C — file lỗi/kết quả (TO-BE 5 / **AC-22 · AC-23** / BR-M12-37 · BR-M12-38),
 * và bài bảo mật **SEC-13**.
 *
 * 🔴 Bài quan trọng nhất là bài chống chèn công thức, và nó phải đọc **ô trong
 * tệp thật** chứ không phải giá trị trả về của hàm escape. Lý do: một ô lọt ra
 * ngoài `textCell` sẽ không làm hàm escape sai — nó chỉ đơn giản là không đi qua
 * hàm ấy. Chỉ có việc dựng workbook rồi mở lại mới bắt được kiểu bỏ sót đó.
 */

function row(overrides: Partial<BatchReportRow> = {}): BatchReportRow {
  return {
    rowNumber: 1,
    fullName: "Nguyễn Văn An",
    className: "Ấu 1A",
    status: "valid",
    errors: [],
    warnings: [],
    studentCode: null,
    ...overrides,
  };
}

async function readBack(rows: BatchReportRow[]): Promise<ExcelJS.Workbook> {
  const buffer = await buildBatchReportWorkbook(rows);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  return workbook;
}

const cellText = (sheet: ExcelJS.Worksheet, r: number, c: number): string =>
  String(sheet.getRow(r).getCell(c).value ?? "");

describe("AC-22 · hai sheet đúng cột", () => {
  it("có đúng sheet LOI và KET_QUA với hàng tiêu đề của đặc tả", async () => {
    const workbook = await readBack([row()]);

    const errors = workbook.getWorksheet(REPORT_ERROR_SHEET);
    const results = workbook.getWorksheet(REPORT_RESULT_SHEET);
    expect(errors).toBeTruthy();
    expect(results).toBeTruthy();

    expect([1, 2, 3, 4, 5].map((c) => cellText(errors!, 1, c))).toEqual([
      "Dòng",
      "Họ và tên",
      "Lớp",
      "Lỗi",
      "Cảnh báo",
    ]);
    expect([1, 2, 3, 4].map((c) => cellText(results!, 1, c))).toEqual([
      "Dòng",
      "Họ và tên",
      "Mã thiếu nhi",
      "Trạng thái",
    ]);
  });

  it("sheet LOI chỉ chứa dòng CÓ việc phải làm", async () => {
    const workbook = await readBack([
      row({ rowNumber: 3, fullName: "Em sạch" }),
      row({ rowNumber: 4, fullName: "Em lỗi", status: "error", errors: ["Thiếu ngày sinh"] }),
      row({ rowNumber: 5, fullName: "Em cảnh báo", status: "warning", warnings: ["Chưa có giới tính"] }),
    ]);

    const errors = workbook.getWorksheet(REPORT_ERROR_SHEET)!;
    // 1 hàng tiêu đề + 2 dòng có vấn đề. Dòng sạch không có mặt.
    expect(errors.actualRowCount).toBe(3);
    expect(cellText(errors, 2, 2)).toBe("Em lỗi");
    expect(cellText(errors, 3, 2)).toBe("Em cảnh báo");
  });

  it("sheet KET_QUA giữ ĐỦ mọi dòng — kể cả dòng sạch", async () => {
    const workbook = await readBack([row({ rowNumber: 3 }), row({ rowNumber: 4 })]);
    expect(workbook.getWorksheet(REPORT_RESULT_SHEET)!.actualRowCount).toBe(3);
  });
});

describe("BR-M12-38 · mapping dòng → mã thiếu nhi", () => {
  it("dòng đã ghi mang mã; dòng chưa ghi để trống chứ không in dấu gạch", async () => {
    const workbook = await readBack([
      row({ rowNumber: 3, status: "committed", studentCode: "CQ0123" }),
      row({ rowNumber: 4, status: "valid", studentCode: null }),
    ]);
    const results = workbook.getWorksheet(REPORT_RESULT_SHEET)!;
    expect(cellText(results, 2, 3)).toBe("CQ0123");
    expect(cellText(results, 3, 3)).toBe("");
  });

  it("trạng thái ghi bằng chữ tiếng Việt, không phải mã trong cơ sở dữ liệu", async () => {
    const workbook = await readBack([row({ status: "committed" })]);
    expect(cellText(workbook.getWorksheet(REPORT_RESULT_SHEET)!, 2, 4)).toBe(
      "Đã ghi vào hệ thống",
    );
    expect(reportRowStatusText("skipped")).toContain("Bỏ qua");
    // Mã lạ vẫn ra một cái gì đó đọc được, không ra chuỗi rỗng.
    expect(reportRowStatusText("trang_thai_la")).toBe("trang_thai_la");
  });
});

describe("AC-23 · SEC-13 — chống chèn công thức Excel", () => {
  it("ô họ tên bắt đầu bằng = + - @ đều được tiền tố dấu nháy đơn", async () => {
    const nasty = [
      `=cmd|'/c calc'!A1`,
      "@SUM(1+1)",
      "+1+1",
      "-1+1",
      `=HYPERLINK("http://xau","bam vao")`,
    ];
    const workbook = await readBack(
      nasty.map((name, index) =>
        row({ rowNumber: index + 1, fullName: name, status: "error", errors: ["Lỗi"] }),
      ),
    );

    const errors = workbook.getWorksheet(REPORT_ERROR_SHEET)!;
    const results = workbook.getWorksheet(REPORT_RESULT_SHEET)!;
    nasty.forEach((name, index) => {
      expect(cellText(errors, index + 2, 2)).toBe(`'${name}`);
      expect(cellText(results, index + 2, 2)).toBe(`'${name}`);
    });
  });

  it("MỌI cột chuỗi đều đi qua bộ chặn, không chỉ cột họ tên", async () => {
    const workbook = await readBack([
      row({
        fullName: "Nguyễn Văn An",
        className: "=A1",
        status: "error",
        errors: [`=cmd|'/c calc'!A1`],
        warnings: ["@SUM(1+1)"],
      }),
    ]);
    const errors = workbook.getWorksheet(REPORT_ERROR_SHEET)!;
    expect(cellText(errors, 2, 3)).toBe("'=A1");
    expect(cellText(errors, 2, 4)).toBe(`'=cmd|'/c calc'!A1`);
    expect(cellText(errors, 2, 5)).toBe("'@SUM(1+1)");
  });

  it("tên bình thường KHÔNG bị thêm dấu nháy", async () => {
    const workbook = await readBack([row({ fullName: "Nguyễn Văn An", status: "error", errors: ["x"] })]);
    expect(cellText(workbook.getWorksheet(REPORT_ERROR_SHEET)!, 2, 2)).toBe("Nguyễn Văn An");
  });

  it("cột Dòng vẫn là SỐ, không bị biến thành chuỗi", async () => {
    const workbook = await readBack([row({ rowNumber: 42, status: "error", errors: ["x"] })]);
    expect(workbook.getWorksheet(REPORT_ERROR_SHEET)!.getRow(2).getCell(1).value).toBe(42);
  });

  /** TO-BE 5 bước 3 nêu đủ `= + - @ TAB CR`; hai ký tự cuối lọt lưới của bản cũ. */
  it("TAB và CR đứng đầu ô cũng bị vô hiệu", () => {
    expect(safeSpreadsheetText("\t=SUM(1)")).toBe("'\t=SUM(1)");
    expect(safeSpreadsheetText("\rNguyễn")).toBe("'\rNguyễn");
    expect(safeSpreadsheetText("Nguyễn\tVăn")).toBe("Nguyễn\tVăn");
  });
});

describe("tên file tải về", () => {
  it("giữ tên file gốc để người nhận biết nó thuộc lần nhập nào", () => {
    expect(batchReportFilename("Ấu 1A.xlsx")).toBe("Ket_qua_nhap_Ấu 1A.xlsx");
  });

  it("file gốc không có phần mở rộng vẫn ra tên hợp lệ", () => {
    expect(batchReportFilename("so-lop")).toBe("Ket_qua_nhap_so-lop.xlsx");
    expect(batchReportFilename("")).toBe("Ket_qua_nhap_lan-nhap.xlsx");
  });
});
