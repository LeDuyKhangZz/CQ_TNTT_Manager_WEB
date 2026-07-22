import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { buildGradebookExportData } from "@/features/assessments/export-data";
import { getGradebookDetail } from "@/features/assessments/server/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asciiFilename(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "bang-diem";
}

async function excelResponse(classId: string) {
  const detail = await getGradebookDetail(classId);
  if (!detail) return NextResponse.json({ error: "Không tìm thấy bảng điểm." }, { status: 404 });
  const data = buildGradebookExportData(detail);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CQ TNTT Manager";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Bảng điểm", { views: [{ state: "frozen", xSplit: 2, ySplit: 3 }] });
  sheet.addRow([`BẢNG ĐIỂM ${detail.className.toUpperCase()}`]);
  sheet.mergeCells(1, 1, 1, Math.max(data.headers.length, 1));
  sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: "FFF28C5B" } };
  sheet.addRow([`Năm học ${detail.academicYearCode} · Xuất lúc ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`]);
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
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `bang-diem-${asciiFilename(detail.className)}-${detail.academicYearCode}.xlsx`;
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

async function pdfResponse(classId: string) {
  const detail = await getGradebookDetail(classId);
  if (!detail) return NextResponse.json({ error: "Không tìm thấy bảng điểm." }, { status: 404 });
  const [{ default: pdfMake }, { default: vfsFonts }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  pdfMake.vfs = vfsFonts;
  const data = buildGradebookExportData(detail);
  const body = [
    data.headers.map((text) => ({ text, bold: true, color: "#ffffff", fillColor: "#F28C5B" })),
    ...data.rows.map((row) => row.map((value) => ({ text: value === null ? "—" : String(value), noWrap: false }))),
  ];
  const definition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [24, 36, 24, 30],
    defaultStyle: { font: "Roboto", fontSize: 7 },
    content: [
      { text: `BẢNG ĐIỂM ${detail.className.toUpperCase()}`, bold: true, fontSize: 16, color: "#F28C5B", alignment: "center" },
      { text: `Năm học ${detail.academicYearCode}`, alignment: "center", margin: [0, 2, 0, 14] },
      { table: { headerRows: 1, widths: [70, 110, ...detail.assessments.map(() => "*"), 42], body }, layout: "lightHorizontalLines" },
      { text: `Xuất lúc ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`, margin: [0, 12, 0, 0], fontSize: 7, color: "#756861" },
    ],
  };
  const buffer = await new Promise<Buffer>((resolve) => pdfMake.createPdf(definition).getBuffer(resolve));
  const filename = `bang-diem-${asciiFilename(detail.className)}-${detail.academicYearCode}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const format = new URL(request.url).searchParams.get("format");
  if (format === "xlsx") return excelResponse(classId);
  if (format === "pdf") return pdfResponse(classId);
  return NextResponse.json({ error: "Định dạng xuất không hợp lệ." }, { status: 400 });
}
