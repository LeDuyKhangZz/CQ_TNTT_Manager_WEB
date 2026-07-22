import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { parseReportFilter, REPORT_TYPE_LABELS } from "@/features/reports/filters";
import { buildReportExportData, type ReportExportData } from "@/features/reports/report-data";
import { buildReport } from "@/features/reports/server/queries";
import { asciiFilename, excelResponse, pdfResponse } from "@/lib/exports/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  if (format !== "xlsx" && format !== "pdf") {
    return NextResponse.json({ error: "Định dạng xuất không hợp lệ." }, { status: 400 });
  }

  const filter = parseReportFilter(Object.fromEntries(url.searchParams.entries()));
  const report = await buildReport(filter);
  const data: ReportExportData = buildReportExportData(report);
  const label = REPORT_TYPE_LABELS[filter.reportType];
  const subtitle = `${report.academicYear ? `Năm học ${report.academicYear.code} · ` : ""}${report.from} – ${report.to}`;
  const filename = `bao-cao-${asciiFilename(label)}-${report.from}-${report.to}`;

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CQ TNTT Manager";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet(label, { views: [{ state: "frozen", ySplit: 3 }] });
    sheet.addRow([`BÁO CÁO ${label.toUpperCase()}`]);
    sheet.mergeCells(1, 1, 1, Math.max(data.headers.length, 1));
    sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: "FFF28C5B" } };
    sheet.addRow([subtitle]);
    sheet.mergeCells(2, 1, 2, Math.max(data.headers.length, 1));
    sheet.addRow(data.headers);
    for (const row of data.rows) sheet.addRow(row);
    sheet.getRow(3).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF28C5B" } };
    sheet.columns.forEach((column, index) => {
      column.width = index === 0 ? 24 : 18;
    });
    return excelResponse(await workbook.xlsx.writeBuffer(), `${filename}.xlsx`);
  }

  return pdfResponse(
    `BÁO CÁO ${label.toUpperCase()}`,
    subtitle,
    data,
    `${filename}.pdf`,
  );
}
