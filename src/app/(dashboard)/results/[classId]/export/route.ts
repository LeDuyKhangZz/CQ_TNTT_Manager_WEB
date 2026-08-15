import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { buildGradebookExportData } from "@/features/assessments/export-data";
import { getGradebookDetail } from "@/features/assessments/server/queries";
import { asciiFilename, excelResponse, pdfResponse } from "@/lib/exports/http";
import { formatDateTimeVi } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * M07-A · **TB-M07-08 bước 3** — route dùng `src/lib/exports/http.ts` thay cho
 * ba bản sao cục bộ của `asciiFilename` / `excelResponse` / `pdfResponse`.
 *
 * Biên bản audit F18 xếp đây vào phần trừ điểm C10: hai bản `asciiFilename` đã
 * **lệch nhau sẵn** (bản cục bộ dùng dải `[̀-ͯ]`, bản chung dùng
 * `\p{Diacritic}`), và bản chung còn có một lưới an toàn mà bản cục bộ không có:
 * bảng PDF **không dòng nào** (lớp chưa có thiếu nhi) được chèn một dòng `—`
 * thay vì đẩy pdfmake vào bảng rỗng.
 *
 * Bề rộng cột và cỡ chữ của bảng điểm được giữ **y nguyên** qua tham số
 * `PdfTableLayout` mới — xem chú thích ở `lib/exports/http.ts`.
 */
export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const format = new URL(request.url).searchParams.get("format");
  if (format !== "xlsx" && format !== "pdf") {
    return NextResponse.json({ error: "Định dạng xuất không hợp lệ." }, { status: 400 });
  }

  const detail = await getGradebookDetail(classId);
  if (!detail) return NextResponse.json({ error: "Không tìm thấy bảng điểm." }, { status: 404 });

  const data = buildGradebookExportData(detail);
  const filename = `bang-diem-${asciiFilename(detail.className)}-${detail.academicYearCode}`;
  const exportedAt = formatDateTimeVi(new Date());

  if (format === "pdf") {
    return pdfResponse(data.title, data.subtitle, data, `${filename}.pdf`, {
      widths: [70, 110, ...detail.assessments.map(() => "*"), 42],
      fontSize: 7,
    });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CQ TNTT Manager";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Bảng điểm", { views: [{ state: "frozen", xSplit: 2, ySplit: 3 }] });
  sheet.addRow([data.title]);
  sheet.mergeCells(1, 1, 1, Math.max(data.headers.length, 1));
  sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: "FFF28C5B" } };
  sheet.addRow([`${data.subtitle} · Xuất lúc ${exportedAt}`]);
  sheet.mergeCells(2, 1, 2, Math.max(data.headers.length, 1));
  sheet.addRow(data.headers);
  for (const row of data.rows) sheet.addRow(row);
  sheet.getRow(3).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF28C5B" } };
  sheet.columns.forEach((column, index) => {
    column.width = index < 2 ? 22 : 16;
    column.alignment = index < 2 ? { vertical: "middle" } : { horizontal: "center", vertical: "middle" };
  });
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 3) row.eachCell((cell) => { cell.border = { bottom: { style: "thin", color: { argb: "FFEEDFD5" } } }; });
  });
  return excelResponse(await workbook.xlsx.writeBuffer(), `${filename}.xlsx`);
}
