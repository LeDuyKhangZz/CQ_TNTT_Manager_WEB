// P2-T4: read an uploaded workbook into raw, layout-independent rows.
//
// Three layouts are supported (decided with the user after reading the parish
// sample workbooks in "Excel mẫu"):
//   - `template`   our canonical single-sheet template (includes Giới tính)
//   - `syll`       the parish "Sơ yếu lý lịch" sheet, columns A–S
//   - `ds_dau_nam` the Chiên Con roster, whose SYLL sheet is empty
//
// The Thiếu/Nghĩa/Hiệp DS_dau_nam sheets are only a name roster (no birth date,
// no phone), so they are rejected with an explicit message instead of being
// imported as half-empty students.

import ExcelJS from "exceljs";
import { mapHeaderRow, type ImportField } from "./columns";
import { normalizeText } from "./normalize";

export type SheetLayout = "template" | "syll" | "ds_dau_nam";

export interface RawRow {
  /** 1-based row number in the source sheet, for the error report. */
  rowNumber: number;
  values: Partial<Record<ImportField, unknown>>;
}

export interface ParsedSheet {
  layout: SheetLayout;
  sheetName: string;
  rows: RawRow[];
}

export class ImportParseError extends Error {}

/** Fields without which a row cannot become a student. */
const REQUIRED_FOR_IMPORT: ImportField[] = ["fullName", "dateOfBirth"];

const MAX_HEADER_SCAN_ROWS = 12;

function cellValue(cell: ExcelJS.Cell): unknown {
  const value = cell.value;
  if (value === null || value === undefined) return null;
  // Formula cells expose their computed result.
  if (typeof value === "object" && "result" in value) {
    return (value as ExcelJS.CellFormulaValue).result ?? null;
  }
  // Rich text cells expose runs.
  if (typeof value === "object" && "richText" in value) {
    return (value as ExcelJS.CellRichTextValue).richText.map((run) => run.text).join("");
  }
  if (typeof value === "object" && "text" in value) {
    return (value as ExcelJS.CellHyperlinkValue).text;
  }
  return value;
}

function rowValues(row: ExcelJS.Row, width: number): unknown[] {
  const values: unknown[] = [];
  for (let column = 1; column <= width; column += 1) {
    values.push(cellValue(row.getCell(column)));
  }
  return values;
}

/**
 * Find the header row. The parish roster sheets start with three banner rows
 * ("THIẾU NHI THÁNH THỂ VIỆT NAM", "DANH SÁCH LỚP …", "Ngày khai giảng …"), so
 * the header is not always row 1. We take the first row that maps at least a
 * name column plus one other known column.
 */
function findHeaderRow(
  sheet: ExcelJS.Worksheet,
  width: number,
): { rowNumber: number; mapping: Map<number, ImportField> } | null {
  const limit = Math.min(sheet.rowCount, MAX_HEADER_SCAN_ROWS);
  for (let rowNumber = 1; rowNumber <= limit; rowNumber += 1) {
    const mapping = mapHeaderRow(rowValues(sheet.getRow(rowNumber), width));
    const fields = [...mapping.values()];
    if (fields.includes("fullName") && fields.length >= 2) {
      return { rowNumber, mapping };
    }
  }
  return null;
}

function isBlankRow(values: unknown[]): boolean {
  return values.every((value) => normalizeText(value) === "");
}

/**
 * The roster sheets split a name across two columns: "Họ và tên" holds the
 * family and middle names and the merged next column holds the given name
 * ("Trần Hoài" | "An"). When the column right after fullName has no header of
 * its own, treat it as the given-name continuation.
 */
function findGivenNameColumn(
  mapping: Map<number, ImportField>,
  headerValues: unknown[],
): number | null {
  let fullNameColumn: number | null = null;
  for (const [index, field] of mapping) {
    if (field === "fullName") fullNameColumn = index;
  }
  if (fullNameColumn === null) return null;
  const next = fullNameColumn + 1;
  if (next >= headerValues.length) return null;
  if (mapping.has(next)) return null;
  return normalizeText(headerValues[next]) === "" ? next : null;
}

function parseSheet(sheet: ExcelJS.Worksheet, layout: SheetLayout): ParsedSheet | null {
  const width = Math.max(sheet.columnCount, 1);
  const header = findHeaderRow(sheet, width);
  if (!header) return null;

  const headerValues = rowValues(sheet.getRow(header.rowNumber), width);
  const givenNameColumn = findGivenNameColumn(header.mapping, headerValues);

  const rows: RawRow[] = [];
  for (let rowNumber = header.rowNumber + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const values = rowValues(sheet.getRow(rowNumber), width);
    if (isBlankRow(values)) continue;

    const record: Partial<Record<ImportField, unknown>> = {};
    for (const [index, field] of header.mapping) {
      record[field] = values[index] ?? null;
    }

    if (givenNameColumn !== null) {
      const given = normalizeText(values[givenNameColumn]);
      if (given !== "") {
        record.fullName = `${normalizeText(record.fullName)} ${given}`.trim();
      }
    }

    // A row with no name at all is sheet furniture (totals, notes), not data.
    if (normalizeText(record.fullName) === "") continue;

    rows.push({ rowNumber, values: record });
  }

  if (rows.length === 0) return null;
  return { layout, sheetName: sheet.name, rows };
}

function detectLayout(sheetName: string): SheetLayout {
  const name = sheetName.trim().toUpperCase();
  if (name.startsWith("SYLL")) return "syll";
  if (name.startsWith("DS_DAU_NAM")) return "ds_dau_nam";
  return "template";
}

/**
 * Parse an uploaded workbook, choosing the richest usable sheet.
 *
 * Preference order: our template, then SYLL (full profile incl. sacraments),
 * then the Chiên Con roster. A workbook whose only candidate is a bare roster
 * (name + previous class, as in the Thiếu sheets) raises so the user is told to
 * use SYLL or the template rather than importing unusable rows.
 */
export async function parseWorkbook(
  input: ArrayBuffer | Uint8Array | Buffer,
): Promise<ParsedSheet> {
  const workbook = new ExcelJS.Workbook();
  // exceljs/jszip is picky about the exact buffer type: an ArrayBuffer created
  // in another realm is rejected, so always hand it a Node Buffer.
  const buffer = Buffer.isBuffer(input)
    ? input
    : Buffer.from(input instanceof Uint8Array ? input : new Uint8Array(input));
  try {
    // exceljs ships `declare interface Buffer extends ArrayBuffer {}`, which is
    // incompatible with Node's Buffer type even though load() accepts one at
    // runtime. The cast works around that library typing bug.
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } catch (error) {
    throw new ImportParseError(
      `Không đọc được file. Vui lòng tải lên file .xlsx hợp lệ. (${
        error instanceof Error ? error.message : "lỗi không xác định"
      })`,
    );
  }

  const candidates: ParsedSheet[] = [];
  for (const sheet of workbook.worksheets) {
    const parsed = parseSheet(sheet, detectLayout(sheet.name));
    if (parsed) candidates.push(parsed);
  }

  if (candidates.length === 0) {
    throw new ImportParseError(
      "Không tìm thấy sheet dữ liệu. File cần có sheet theo mẫu, hoặc sheet SYLL/DS_dau_nam.",
    );
  }

  const usable = candidates.filter((candidate) =>
    candidate.rows.some((row) =>
      REQUIRED_FOR_IMPORT.every((field) => normalizeText(row.values[field]) !== ""),
    ),
  );

  if (usable.length === 0) {
    throw new ImportParseError(
      "Sheet chỉ có danh sách tên, thiếu ngày sinh nên không đủ để import. " +
        "Vui lòng dùng sheet SYLL hoặc file mẫu chuẩn.",
    );
  }

  // Pick the richest sheet, not merely the first of the preferred layout: some
  // workbooks carry several SYLL-named sheets (SYLL, "SY LL 25-26",
  // SYLL_details) where only one holds the real roster.
  const priority: Record<SheetLayout, number> = { template: 0, syll: 1, ds_dau_nam: 2 };
  const score = (sheet: ParsedSheet) => {
    const importable = sheet.rows.filter((row) =>
      REQUIRED_FOR_IMPORT.every((field) => normalizeText(row.values[field]) !== ""),
    ).length;
    const fields = new Set<string>();
    for (const row of sheet.rows) {
      for (const [field, value] of Object.entries(row.values)) {
        if (normalizeText(value) !== "") fields.add(field);
      }
    }
    return { importable, fields: fields.size };
  };

  usable.sort((left, right) => {
    const leftScore = score(left);
    const rightScore = score(right);
    // Distinct columns first: a roster with contacts beats a bare name list.
    if (rightScore.fields !== leftScore.fields) return rightScore.fields - leftScore.fields;
    if (rightScore.importable !== leftScore.importable) {
      return rightScore.importable - leftScore.importable;
    }
    return priority[left.layout] - priority[right.layout];
  });
  return usable[0];
}
