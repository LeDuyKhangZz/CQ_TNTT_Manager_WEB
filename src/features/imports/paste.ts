// IMP-BULK-001: đường DÁN VĂN BẢN vào cùng pipeline import thiếu nhi.
//
// Vì sao cần đường này khi đã có đường tải file: dữ liệu hai năm học của giáo
// xứ được trích từ ~40 sổ Excel và gộp lại thành các khối văn bản (một khối một
// lớp, xem `NH_2025-2026/NHAP_LIEU_HANG_LOAT.md`). Bắt người nhập chép từng
// khối ngược vào một file .xlsx chỉ để tải lên là thêm một bước sai chính tả
// không cần thiết. Khối dán đi qua ĐÚNG pipeline của file: mapHeaderRow →
// buildRow → dry-run → duyệt → commit; đường dán chỉ thay khâu đọc ô.

import { mapHeaderRow, type ImportField } from "./columns";
import { normalizeText } from "./normalize";
import { ImportParseError, type ParsedSheet, type RawRow } from "./parse";

/**
 * Trần ký tự của một lần dán. Cùng vai trò với trần 4 MB của file (D-137):
 * chặn trước khi parse để một lần dán cả quyển sổ không treo Server Action.
 * 1 triệu ký tự ≈ gấp ~5 lần khối lớn nhất của file dữ liệu đã trích.
 */
export const MAX_PASTE_CHARS = 1_000_000;

export const pasteTooLargeText = (chars: number): string =>
  `Văn bản dán dài ${Math.ceil(chars / 1000)} nghìn ký tự, vượt trần ${
    MAX_PASTE_CHARS / 1000
  } nghìn. Hãy dán từng lớp một.`;

/** Fields without which a row cannot become a student — same rule as parse.ts. */
const REQUIRED_FOR_IMPORT: ImportField[] = ["fullName", "dateOfBirth"];

/**
 * Tách một dòng thành các ô. Ưu tiên TAB (dán từ Excel/Sheets); không có TAB
 * thì dùng `|` (khối trong file .md). Dòng kẻ bảng Markdown (`---|---`) và ký
 * tự `|` bọc hai đầu (`| a | b |`) được dọn trước khi tách.
 */
function splitLine(line: string, delimiter: "\t" | "|"): string[] {
  if (delimiter === "\t") return line.split("\t");
  const trimmed = line.trim();
  // 🔴 Chỉ bóc dấu `|` bọc ngoài khi nó có ở **cả hai** đầu — đó mới là hình
  // dạng của một dòng bảng Markdown. Bóc theo từng đầu riêng lẻ thì một dòng có
  // ô đầu để trống (`| 05/05/2019`, nghĩa là "không tên, ngày sinh 05/05") bị
  // hiểu thành một ô duy nhất, và **ngày sinh trở thành họ tên** — dòng rác ấy
  // đi thẳng vào bảng duyệt trông như một em thật.
  const stripped =
    trimmed.length >= 2 && trimmed.startsWith("|") && trimmed.endsWith("|")
      ? trimmed.slice(1, -1)
      : trimmed;
  return stripped.split("|");
}

function isMarkdownRule(line: string): boolean {
  // `| --- | :---: |` — dòng kẻ giữa header và thân bảng Markdown.
  return /^[\s|:-]+$/.test(line) && line.includes("-");
}

/**
 * Parse một khối văn bản dán thành {@link ParsedSheet} layout `paste`.
 *
 * Dòng đầu có dữ liệu phải là dòng tiêu đề với các cột mà `columns.ts` nhận ra
 * (cùng bộ bí danh với file Excel — "Họ và tên", "Ngày tháng năm sinh", …).
 * `rowNumber` là số DÒNG trong khối dán (1-based, tính cả dòng tiêu đề) để câu
 * báo lỗi trỏ đúng dòng người dùng đang nhìn.
 */
export function parsePastedText(text: string): ParsedSheet {
  if (text.length > MAX_PASTE_CHARS) {
    throw new ImportParseError(pasteTooLargeText(text.length));
  }

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const delimiter: "\t" | "|" = lines.some((line) => line.includes("\t")) ? "\t" : "|";

  let header: { lineNumber: number; mapping: Map<number, ImportField> } | null = null;
  const rows: RawRow[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (normalizeText(line) === "" || isMarkdownRule(line)) continue;

    const cells = splitLine(line, delimiter).map((cell) => cell.trim());

    if (!header) {
      const mapping = mapHeaderRow(cells);
      const fields = [...mapping.values()];
      if (fields.includes("fullName") && fields.length >= 2) {
        header = { lineNumber: index + 1, mapping };
        continue;
      }
      throw new ImportParseError(
        "Dòng đầu của khối dán phải là dòng tiêu đề cột (có ít nhất cột \"Họ và tên\" " +
          "và một cột dữ liệu khác). Hãy dán cả dòng tiêu đề trong file dữ liệu.",
      );
    }

    const record: Partial<Record<ImportField, unknown>> = {};
    for (const [cellIndex, field] of header.mapping) {
      record[field] = cells[cellIndex] ?? null;
    }
    // Dòng không có tên là đồ trang trí của bảng (tổng, ghi chú), không phải dữ liệu.
    if (normalizeText(record.fullName) === "") continue;
    rows.push({ rowNumber: index + 1, values: record });
  }

  if (!header || rows.length === 0) {
    throw new ImportParseError(
      "Không tìm thấy dòng dữ liệu nào trong văn bản dán. Cần một dòng tiêu đề cột " +
        "rồi mỗi em một dòng, các cột cách nhau bằng TAB hoặc dấu |.",
    );
  }

  const usable = rows.some((row) =>
    REQUIRED_FOR_IMPORT.every((field) => normalizeText(row.values[field]) !== ""),
  );
  if (!usable) {
    throw new ImportParseError(
      "Khối dán chỉ có danh sách tên, thiếu ngày sinh nên không đủ để import. " +
        "Hãy dùng khối dữ liệu đầy đủ (có cột Ngày tháng năm sinh).",
    );
  }

  return { layout: "paste", sheetName: "paste", rows };
}
