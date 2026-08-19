// P2-T4: turn a raw parsed row into the normalized payload the commit RPC
// consumes, collecting per-field errors and warnings on the way (docs/09 §4).

import type { RawRow } from "./parse";
import {
  classAliasKey,
  normalizeName,
  normalizePhone,
  normalizeText,
  optionalText,
  parseBoolean,
  parseDate,
  parseGender,
  parsePatronFeastDate,
  parseSaintName,
  splitParentName,
  type Gender,
} from "./normalize";

export interface RowIssue {
  field: string;
  message: string;
}

export interface NormalizedSacrament {
  type: "baptism" | "confirmation";
  date: string | null;
  place: string | null;
}

export interface NormalizedRow {
  full_name: string;
  saint_name: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  patron_feast_date: string | null;
  address: string | null;
  student_phone: string | null;
  hardship_flag: boolean;
  general_notes: string | null;
  allergies: string | null;
  health_notes: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_address: string | null;
  class_label: string | null;
  class_id: string | null;
  sacraments: NormalizedSacrament[];
  /** Diacritics-stripped name used only for duplicate matching. */
  match_name: string;
}

export interface BuiltRow {
  rowNumber: number;
  normalized: NormalizedRow;
  errors: RowIssue[];
  warnings: RowIssue[];
}

/** Lookup from {@link classAliasKey} to a class id for the batch's year. */
export type ClassLookup = ReadonlyMap<string, string>;

/**
 * Choose the single guardian the schema allows (one guardian per student).
 * Priority agreed with the user: người giám hộ > cha > mẹ, and within that a
 * candidate carrying a usable phone number wins, because the phone is what the
 * commit uses to reuse an existing guardian record.
 */
export function pickGuardian(row: RawRow["values"]): {
  name: string | null;
  phone: string | null;
  /** The people we did not choose, kept for the student's notes. */
  others: string[];
  source: "guardian" | "father" | "mother" | null;
} {
  const candidates = [
    { source: "guardian" as const, rawName: row.guardianName, rawPhone: row.guardianPhone },
    { source: "father" as const, rawName: row.fatherName, rawPhone: row.fatherPhone },
    { source: "mother" as const, rawName: row.motherName, rawPhone: row.motherPhone },
  ]
    .map((candidate) => ({
      source: candidate.source,
      name: splitParentName(candidate.rawName).fullName,
      phone: normalizePhone(candidate.rawPhone),
    }))
    .filter((candidate) => candidate.name !== null || candidate.phone !== null);

  if (candidates.length === 0) {
    return { name: null, phone: null, others: [], source: null };
  }

  const chosen = candidates.find((candidate) => candidate.phone !== null) ?? candidates[0];
  const labels: Record<"guardian" | "father" | "mother", string> = {
    guardian: "Người giám hộ",
    father: "Cha",
    mother: "Mẹ",
  };
  const others = candidates
    .filter((candidate) => candidate !== chosen)
    .map((candidate) =>
      `${labels[candidate.source]}: ${candidate.name ?? "chưa rõ"}${
        candidate.phone ? ` — ${candidate.phone}` : ""
      }`,
    );

  return { name: chosen.name, phone: chosen.phone, others, source: chosen.source };
}

function buildSacraments(row: RawRow["values"]): NormalizedSacrament[] {
  const sacraments: NormalizedSacrament[] = [];
  const baptismDate = parseDate(row.baptismDate);
  const baptismPlace = optionalText(row.baptismPlace);
  if (baptismDate || baptismPlace) {
    sacraments.push({ type: "baptism", date: baptismDate, place: baptismPlace });
  }
  const confirmationDate = parseDate(row.confirmationDate);
  const confirmationPlace = optionalText(row.confirmationPlace);
  if (confirmationDate || confirmationPlace) {
    sacraments.push({ type: "confirmation", date: confirmationDate, place: confirmationPlace });
  }
  return sacraments;
}

function buildNotes(row: RawRow["values"], guardianOthers: string[]): string | null {
  const parts: string[] = [];
  const notes = optionalText(row.notes);
  if (notes) parts.push(notes);
  const parish = optionalText(row.parish);
  if (parish) parts.push(`Giáo xứ: ${parish}`);
  const birthPlace = optionalText(row.birthPlace);
  if (birthPlace) parts.push(`Nơi sinh: ${birthPlace}`);
  // The parents we could not store as the single guardian are preserved here
  // so no contact information is lost by the import.
  parts.push(...guardianOthers);
  return parts.length > 0 ? parts.join("\n") : null;
}

export interface BuildRowOptions {
  /**
   * Class chosen at upload time, used when a row carries no class of its own.
   * Each parish workbook is one class, and the Chiên Con roster has no class
   * column at all, so the uploader names the target class instead.
   */
  fallbackClassId?: string | null;
  fallbackClassLabel?: string | null;
}

/**
 * Normalize one row and classify it. A row with any error is never committed;
 * warnings are informational and still committable (docs/09 §5: duplicates
 * warn, they never block).
 */
export function buildRow(
  raw: RawRow,
  classes: ClassLookup,
  options: BuildRowOptions = {},
): BuiltRow {
  const values = raw.values;
  const errors: RowIssue[] = [];
  const warnings: RowIssue[] = [];

  const fullName = normalizeName(values.fullName);
  if (fullName === "") {
    errors.push({ field: "fullName", message: "Thiếu họ và tên." });
  }

  // IMP-BULK-002 — ngày sinh trống là **cảnh báo**, không còn là lỗi: sổ lên lớp
  // của giáo xứ có hàng trăm em chỉ có tên. Ngày sinh **sai** thì vẫn là lỗi —
  // một ngày ở tương lai không phải dữ liệu thiếu mà là dữ liệu hỏng, và ghi nó
  // vào hồ sơ còn tệ hơn để trống (`students_dob_not_future` cũng sẽ chặn).
  const dateOfBirth = parseDate(values.dateOfBirth);
  if (!dateOfBirth) {
    warnings.push({
      field: "dateOfBirth",
      message: normalizeText(values.dateOfBirth) === ""
        ? "Chưa có ngày sinh. Hồ sơ vẫn được tạo; bổ sung sau ở trang Thiếu nhi."
        : "Ngày sinh không đọc được nên để trống. Hồ sơ vẫn được tạo.",
    });
  } else if (dateOfBirth > new Date().toISOString().slice(0, 10)) {
    errors.push({ field: "dateOfBirth", message: "Ngày sinh ở tương lai." });
  }

  // The parish SYLL sheets have no gender column at all, so a missing value is
  // a warning the reviewer resolves in the UI, never a guess and never a
  // silent default. commitBatch refuses rows whose gender is still unset.
  const gender = parseGender(values.gender);
  if (!gender) {
    warnings.push({
      field: "gender",
      message: "Chưa có giới tính. Chọn Nam/Nữ ở màn hình duyệt nếu biết; không chọn thì hồ sơ vẫn được tạo.",
    });
  }

  // IMP-BULK-002 — thiếu số điện thoại phụ huynh không còn chặn dòng. Ba mức,
  // và câu chữ phải nói ĐÚNG hệ quả của từng mức, vì hệ quả khác nhau thật:
  //   · có số            ⇒ phụ huynh cấp được tài khoản (username = số điện thoại);
  //   · chỉ có tên       ⇒ có hồ sơ phụ huynh, chưa cấp được tài khoản;
  //   · không có gì cả   ⇒ em chưa gắn phụ huynh nào.
  const guardian = pickGuardian(values);
  if (!guardian.phone && !guardian.name) {
    warnings.push({
      field: "guardianPhone",
      message:
        "Chưa có thông tin cha/mẹ. Hồ sơ em vẫn được tạo nhưng chưa gắn phụ huynh nào, và chưa cấp được tài khoản phụ huynh.",
    });
  } else if (!guardian.phone) {
    warnings.push({
      field: "guardianPhone",
      message:
        "Có tên cha/mẹ nhưng chưa có số điện thoại. Hồ sơ phụ huynh vẫn được tạo; chưa cấp được tài khoản cho tới khi có số.",
    });
  } else if (!guardian.name) {
    warnings.push({ field: "guardianName", message: "Có số điện thoại nhưng thiếu tên phụ huynh." });
  }

  // A class named on the row always wins; the upload-time class only fills the
  // gap for sheets that carry no class column (the Chiên Con roster).
  const rowClassLabel = optionalText(values.className);
  let classLabel = rowClassLabel;
  let classId: string | null = null;
  if (rowClassLabel) {
    classId = classes.get(classAliasKey(rowClassLabel)) ?? null;
    if (!classId) {
      errors.push({
        field: "className",
        message: `Lớp "${rowClassLabel}" không khớp lớp nào của năm học hiện tại.`,
      });
    }
  } else if (options.fallbackClassId) {
    classId = options.fallbackClassId;
    classLabel = options.fallbackClassLabel ?? null;
  } else {
    errors.push({
      field: "className",
      message: "Thiếu tên lớp. Hãy chọn lớp đích khi tải file lên.",
    });
  }

  const saintName = parseSaintName(values.saintName);
  if (!saintName) {
    warnings.push({ field: "saintName", message: "Chưa có tên thánh (chưa rửa tội?)." });
  }

  // Current residence is the useful address; fall back to the household one.
  const address = optionalText(values.currentAddress) ?? optionalText(values.permanentAddress);

  const normalized: NormalizedRow = {
    full_name: fullName,
    saint_name: saintName,
    gender,
    date_of_birth: dateOfBirth,
    patron_feast_date: parsePatronFeastDate(values.patronFeastDate),
    address,
    student_phone: normalizePhone(values.studentPhone),
    hardship_flag: parseBoolean(values.hardship),
    general_notes: buildNotes(values, guardian.others),
    allergies: optionalText(values.allergies),
    health_notes: optionalText(values.healthNotes),
    guardian_name: guardian.name,
    guardian_phone: guardian.phone,
    guardian_address: address,
    class_label: classLabel,
    class_id: classId,
    sacraments: buildSacraments(values),
    match_name: normalizeText(fullName),
  };

  return { rowNumber: raw.rowNumber, normalized, errors, warnings };
}
