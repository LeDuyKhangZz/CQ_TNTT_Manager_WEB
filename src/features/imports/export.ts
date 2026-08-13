/**
 * File lỗi / kết quả của một lần nhập — M12-C, **TO-BE 5 / AC-22 · AC-23 /
 * BR-M12-37 · BR-M12-38**, đóng yêu cầu `docs/09` §2 (*"Download result"*) và §9
 * (*"User download được errors"*).
 *
 * 🔴 **Vì sao đây là việc quan trọng nhất còn lại của module, chứ không phải một
 * nút tải về cho đủ bộ.** Người **có** dữ liệu còn thiếu là **Giáo lý viên lớp**
 * — họ biết em nào là Nam em nào là Nữ, biết em nào ghi sai ngày sinh. Nhưng
 * `route-map.ts` không cho họ vào `/imports` (SEC-01), và điều đó **đúng**: nhập
 * Excel tạo hồ sơ hàng loạt. Trước đợt này, hệ quả là Thư ký phải **chép tay**
 * từng dòng lỗi ra tin nhắn rồi gửi đi. File này là **cây cầu duy nhất** giữa
 * hai bên mà không phải nới quyền cho ai.
 *
 * 🔴 **Hai sheet, và sheet thứ hai mới là thứ `docs/09` §7 đòi.** `LOI` là việc
 * phải làm; `KET_QUA` là **sổ đối chiếu "dòng số mấy đã thành hồ sơ nào"** —
 * mối nối duy nhất truy ngược một em về đúng dòng Excel sinh ra em. Nó nằm trong
 * `import_rows` nhưng chỉ bốn vai trò ghi toàn xứ đoàn đọc được; xuất ra file là
 * cách duy nhất nó tới được người cần.
 *
 * ⚠️ **File này KHÔNG nhập ngược lại được, và đó là chủ ý.** `detectLayout` coi
 * mọi sheet lạ là `template`, nên `LOI` (có cột *Họ tên* và *Lớp*) vẫn qua được
 * bước dò dòng tiêu đề — nhưng cả hai sheet đều **không có cột ngày sinh**, mà
 * `REQUIRED_FOR_IMPORT` đòi nó, nên `parseWorkbook` từ chối với đúng câu *"Sheet
 * chỉ có danh sách tên, thiếu ngày sinh…"*. Ai lỡ tải chính file này lên sẽ được
 * nói thẳng thay vì tạo ra một loạt hồ sơ rỗng.
 *
 * Không `server-only`: cùng khuôn `template.ts`, để dựng được workbook trong
 * unit test thường mà không phải dựng cả tầng máy chủ.
 */

import ExcelJS from "exceljs";
import { safeSpreadsheetText } from "@/lib/exports/spreadsheet";

export const REPORT_ERROR_SHEET = "LOI";
export const REPORT_RESULT_SHEET = "KET_QUA";

export interface BatchReportRow {
  rowNumber: number;
  fullName: string;
  className: string | null;
  /** `import_rows.status`: `valid` · `warning` · `error` · `committed` · `skipped`. */
  status: string;
  errors: readonly string[];
  warnings: readonly string[];
  /** `CQxxxx` khi dòng đã thành hồ sơ (tạo mới **hoặc** ghép). */
  studentCode: string | null;
}

/**
 * Trạng thái dòng bằng **chữ tiếng Việt**, không phải mã trong cơ sở dữ liệu.
 *
 * Người mở file này là Giáo lý viên lớp — `partially_committed` hay `dry_run`
 * không nói với họ điều gì, và đây là tiêu chí *"không dùng màu/mã làm tín hiệu
 * duy nhất"* của `11` §5 áp cho một tệp không có màu.
 */
const ROW_STATUS_TEXT: Record<string, string> = {
  valid: "Hợp lệ — chờ ghi",
  warning: "Có cảnh báo — chờ ghi",
  error: "Lỗi — không ghi được",
  committed: "Đã ghi vào hệ thống",
  skipped: "Bỏ qua theo quyết định người duyệt",
};

export function reportRowStatusText(status: string): string {
  return ROW_STATUS_TEXT[status] ?? status;
}

/**
 * Tên file tải về, dựng từ tên file gốc để người nhận biết nó thuộc lần nhập nào.
 *
 * Giữ nguyên dấu tiếng Việt ở đây; việc hạ xuống ASCII cho tiêu đề HTTP là việc
 * của `asciiFilename` ở tầng route (`lib/exports/http.ts`).
 */
export function batchReportFilename(sourceFilename: string): string {
  const base = sourceFilename.replace(/\.[^.]+$/, "").trim();
  return `Ket_qua_nhap_${base === "" ? "lan-nhap" : base}.xlsx`;
}

/** Mọi ô chuỗi đi qua đây — BR-M12-37, không có ngoại lệ nào. */
function textCell(value: string | null): string {
  return value === null || value === "" ? "" : safeSpreadsheetText(value);
}

function addHeader(sheet: ExcelJS.Worksheet): void {
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle", wrapText: true };
  header.commit();
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

/**
 * Dựng workbook hai sheet.
 *
 * 🔴 **Số dòng (`Dòng`) ghi bằng SỐ, mọi thứ còn lại ghi bằng CHUỖI đã vô hiệu
 * công thức.** Trộn hai kiểu trong một cột là cách nhanh nhất để Excel tự sắp
 * xếp sai; còn để một ô do người dùng nhập lọt ra ngoài `textCell` là mở lại
 * đúng lỗ hổng SEC-13 vừa bịt.
 */
export async function buildBatchReportWorkbook(
  rows: readonly BatchReportRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CQ TNTT Manager";
  workbook.created = new Date();

  const errorSheet = workbook.addWorksheet(REPORT_ERROR_SHEET);
  errorSheet.columns = [
    { header: "Dòng", key: "rowNumber", width: 8 },
    { header: "Họ và tên", key: "fullName", width: 28 },
    { header: "Lớp", key: "className", width: 14 },
    { header: "Lỗi", key: "errors", width: 52 },
    { header: "Cảnh báo", key: "warnings", width: 52 },
  ];
  addHeader(errorSheet);

  // Chỉ dòng CÓ việc phải làm. Đổ cả lần nhập vào đây thì người nhận phải tự lọc
  // — mà đó đúng là việc file này sinh ra để làm hộ họ.
  for (const row of rows) {
    if (row.errors.length === 0 && row.warnings.length === 0) continue;
    errorSheet.addRow({
      rowNumber: row.rowNumber,
      fullName: textCell(row.fullName),
      className: textCell(row.className),
      errors: textCell(row.errors.join(" · ")),
      warnings: textCell(row.warnings.join(" · ")),
    });
  }

  const resultSheet = workbook.addWorksheet(REPORT_RESULT_SHEET);
  resultSheet.columns = [
    { header: "Dòng", key: "rowNumber", width: 8 },
    { header: "Họ và tên", key: "fullName", width: 28 },
    { header: "Mã thiếu nhi", key: "studentCode", width: 16 },
    { header: "Trạng thái", key: "status", width: 34 },
  ];
  addHeader(resultSheet);

  for (const row of rows) {
    resultSheet.addRow({
      rowNumber: row.rowNumber,
      fullName: textCell(row.fullName),
      // Dòng chưa ghi thì chưa có mã. Để trống đúng hơn một dấu gạch: dấu gạch
      // là một giá trị, còn ô trống nói "chưa có" (bài học nợ #13 của M09).
      studentCode: textCell(row.studentCode),
      status: textCell(reportRowStatusText(row.status)),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
