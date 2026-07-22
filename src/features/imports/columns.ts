// P2-T4: header-driven column mapping.
//
// Column mapping is driven by the header text rather than fixed positions, so
// a class workbook that gained or lost a column still imports. The parish SYLL
// headers embed multi-line instructions ("Ngày Rửa Tội\n- Xin nhập: ngày..."),
// which normalizeText collapses into one line before matching here.

import { normalizeForMatch } from "./normalize";

/** Canonical field keys the parser produces, independent of sheet layout. */
export type ImportField =
  | "saintName"
  | "fullName"
  | "givenName"
  | "gender"
  | "dateOfBirth"
  | "birthPlace"
  | "baptismDate"
  | "baptismPlace"
  | "confirmationDate"
  | "confirmationPlace"
  | "patronFeastDate"
  | "fatherName"
  | "fatherPhone"
  | "motherName"
  | "motherPhone"
  | "guardianName"
  | "guardianPhone"
  | "permanentAddress"
  | "currentAddress"
  | "parish"
  | "className"
  | "previousClassName"
  | "studentPhone"
  | "hardship"
  | "allergies"
  | "healthNotes"
  | "notes";

function tokens(header: string): string[] {
  return normalizeForMatch(header).split(" ").filter(Boolean);
}

function has(list: string[], ...words: string[]): boolean {
  return words.every((word) => list.includes(word));
}

/**
 * Resolve one header cell to a canonical field, or null when the column is not
 * something we import.
 *
 * Order matters: the SYLL parent columns are literally "Tên Thánh, họ và tên
 * cha", so the person-qualifier (cha / mẹ / giám hộ) must be tested before the
 * bare "tên thánh" and "họ và tên" columns, otherwise a parent column would be
 * mistaken for the child's own name.
 */
export function resolveHeaderField(header: unknown): ImportField | null {
  const list = tokens(typeof header === "string" ? header : String(header ?? ""));
  if (list.length === 0) return null;

  const isPhone = has(list, "dien", "thoai") || list.includes("sdt");
  const isDate = list.includes("ngay");
  const isPlace = list.includes("noi");

  // --- Parents / guardian (must come first) ---------------------------------
  const isGuardian = has(list, "giam", "ho");
  const isFather = list.includes("cha");
  // normalizeForMatch already stripped diacritics, so "mẹ" arrives as "me".
  const isMother = list.includes("me");

  if (isGuardian) return isPhone ? "guardianPhone" : "guardianName";
  // "Họ tên cha/mẹ" + "SĐT" in the Chiên Con roster: one combined contact.
  if (isFather && isMother) return isPhone ? "guardianPhone" : "guardianName";
  if (isFather) return isPhone ? "fatherPhone" : "fatherName";
  if (isMother) return isPhone ? "motherPhone" : "motherName";

  // --- Sacraments -----------------------------------------------------------
  if (has(list, "rua", "toi")) return isPlace ? "baptismPlace" : "baptismDate";
  if (has(list, "them", "suc")) return isPlace ? "confirmationPlace" : "confirmationDate";
  if (has(list, "bon", "mang")) return "patronFeastDate";

  // --- Identity -------------------------------------------------------------
  if (has(list, "gioi", "tinh")) return "gender";
  if (has(list, "ten", "thanh")) return "saintName";
  if (isDate && list.includes("sinh")) return "dateOfBirth";
  if (isPlace && list.includes("sinh")) return "birthPlace";
  if (has(list, "ho", "va", "ten") || has(list, "ho", "ten")) return "fullName";

  // --- Location / class -----------------------------------------------------
  if (has(list, "dia", "chi")) return "permanentAddress";
  if (has(list, "noi", "o")) return "currentAddress";
  if (has(list, "thuoc", "giao", "xu")) return "parish";
  if (list.includes("lop")) {
    return list.includes("cu") ? "previousClassName" : "className";
  }

  // --- Optional extras ------------------------------------------------------
  if (isPhone) return "studentPhone";
  if (has(list, "hoan", "canh")) return "hardship";
  if (list.includes("ung")) return "allergies";
  if (has(list, "suc", "khoe")) return "healthNotes";
  if (has(list, "ghi", "chu")) return "notes";

  return null;
}

/** Whose phone a bare phone column belongs to, keyed by the name column before it. */
const PHONE_OWNER: Partial<Record<ImportField, ImportField>> = {
  guardianName: "guardianPhone",
  fatherName: "fatherPhone",
  motherName: "motherPhone",
};

/**
 * Map a header row to column index → field.
 *
 * A bare phone header ("SĐT") is attributed to the person named in the column
 * immediately before it. The Chiên Con roster ends with
 * "… | Họ tên cha/mẹ | SĐT", where that phone is the guardian's, not the
 * child's — reading it as the child's phone lost every contact number.
 */
export function mapHeaderRow(headers: readonly unknown[]): Map<number, ImportField> {
  const mapping = new Map<number, ImportField>();
  let previousField: ImportField | null = null;

  headers.forEach((header, index) => {
    let field = resolveHeaderField(header);

    if (field === "studentPhone" && previousField) {
      const owner = PHONE_OWNER[previousField];
      if (owner && ![...mapping.values()].includes(owner)) field = owner;
    }

    // First header wins: the sample files repeat "Ghi chú" style columns.
    if (field && ![...mapping.values()].includes(field)) {
      mapping.set(index, field);
      previousField = field;
    } else if (field === null && normalizedIsBlank(header)) {
      // A blank spacer column does not break the name → phone adjacency.
    } else if (field) {
      previousField = field;
    }
  });
  return mapping;
}

function normalizedIsBlank(header: unknown): boolean {
  return normalizeForMatch(typeof header === "string" ? header : String(header ?? "")) === "";
}
