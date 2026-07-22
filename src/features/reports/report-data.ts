import { safeSpreadsheetText } from "@/lib/exports/spreadsheet";
import type { ReportResult } from "./server/queries";

export interface ReportExportData {
  headers: string[];
  rows: Array<Array<string | number | null>>;
}

/** Bảng phẳng dùng chung cho Excel, PDF và payload snapshot. */
export function buildReportExportData(report: ReportResult): ReportExportData {
  return {
    headers: report.headers,
    rows: report.rows.map((row) => [
      safeSpreadsheetText(row.className),
      ...row.values.map((value) => (typeof value === "string" ? safeSpreadsheetText(value) : value)),
    ]),
  };
}
