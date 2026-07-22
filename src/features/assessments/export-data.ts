import { safeSpreadsheetText } from "@/lib/exports/spreadsheet";
import type { GradebookDetail } from "./server/queries";

export { safeSpreadsheetText };

export interface GradebookExportData {
  headers: string[];
  rows: Array<Array<string | number | null>>;
}

export function buildGradebookExportData(detail: GradebookDetail): GradebookExportData {
  const headers = [
    "Tên thánh",
    "Họ tên",
    ...detail.assessments.map((item) => `${item.title} (HS ${item.weight})`),
    "Trung bình",
  ];
  const rows = detail.students.map((student) => [
    safeSpreadsheetText(student.saintName),
    safeSpreadsheetText(student.fullName),
    ...detail.assessments.map((assessment) => student.scores[assessment.id]?.score ?? null),
    student.weightedAverage,
  ]);
  return { headers, rows };
}
