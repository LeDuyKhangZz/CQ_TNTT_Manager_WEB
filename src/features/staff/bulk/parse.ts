// IMP-BULK-001: đọc một khối văn bản dán thành các dòng nhân sự.
//
// 🔴 Vì sao module này tồn tại: cho tới đợt này **không có đường nhập hàng loạt
// nào** cho huynh trưởng/dự trưởng — `createStaff` và `assignStaffToClass` đều
// làm một người một lượt. Xứ đoàn có ~90 nhân sự và mỗi năm học phải phân công
// lại toàn bộ, tức ~180 lượt gửi biểu mẫu tay cho một việc đã có sẵn danh sách.
//
// File thuần (không `server-only`, không đụng Supabase) ⇒ kiểm được bằng unit
// test thường, đúng khuôn `build-row.ts` của luồng nhập thiếu nhi.

import {
  classAliasKey,
  normalizeForMatch,
  normalizeName,
  normalizePhone,
  normalizeText,
  optionalText,
  parseDate,
} from "@/features/imports/normalize";

export type StaffTitle = "anh" | "chi" | "di" | "so" | "cha" | "thay" | "other";
export type FormationLevel = "none" | "i" | "ii" | "iii" | "special";
export type StaffCapacity = "representative" | "member" | "trainee";

export interface StaffRowIssue {
  field: string;
  message: string;
}

export interface NormalizedStaffRow {
  saintName: string | null;
  fullName: string;
  title: StaffTitle;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  formationLevel: FormationLevel;
  /** Nhãn lớp như người dùng gõ, giữ nguyên để câu lỗi nhắc đúng chữ của họ. */
  classLabel: string | null;
  classId: string | null;
  capacity: StaffCapacity;
  /** "Thành phần" gốc (Huynh trưởng, Dự trưởng, Nữ tu…) — ghi vào ghi chú đối chiếu. */
  component: string | null;
}

export interface BuiltStaffRow {
  rowNumber: number;
  normalized: NormalizedStaffRow;
  errors: StaffRowIssue[];
  warnings: StaffRowIssue[];
}

export type StaffClassLookup = ReadonlyMap<string, string>;

export class StaffParseError extends Error {}

/** Trần một lần dán. Xứ đoàn có ~90 nhân sự, nên 500 là dư gấp 5 lần. */
export const MAX_STAFF_ROWS = 500;

type StaffField =
  | "saintName"
  | "fullName"
  | "givenName"
  | "title"
  | "component"
  | "phone"
  | "dateOfBirth"
  | "address"
  | "formationLevel"
  | "className"
  | "capacity"
  | "notes";

/**
 * Nhận diện một ô tiêu đề. Cùng nguyên tắc với `columns.ts` của luồng thiếu nhi:
 * so theo **chữ trong tiêu đề** chứ không theo vị trí cột, để một khối dán thừa
 * hay thiếu cột vẫn đọc được.
 */
export function resolveStaffHeader(header: unknown): StaffField | null {
  const list = normalizeForMatch(typeof header === "string" ? header : String(header ?? ""))
    .split(" ")
    .filter(Boolean);
  if (list.length === 0) return null;
  const has = (...words: string[]) => words.every((word) => list.includes(word));

  if (has("danh", "xung")) return "title";
  if (has("thanh", "phan")) return "component";
  if (has("vai", "tro")) return "capacity";
  if (has("ten", "thanh")) return "saintName";
  if (has("ho", "va", "ten") || has("ho", "ten")) return "fullName";
  if (has("dien", "thoai") || list.includes("sdt")) return "phone";
  if (list.includes("sinh") && (list.includes("ngay") || list.includes("nam"))) {
    return "dateOfBirth";
  }
  if (has("dia", "chi")) return "address";
  if (list.includes("cap")) return "formationLevel";
  if (list.includes("lop")) return "className";
  if (has("ghi", "chu")) return "notes";
  return null;
}

function mapStaffHeaderRow(headers: readonly unknown[]): Map<number, StaffField> {
  const mapping = new Map<number, StaffField>();
  headers.forEach((header, index) => {
    const field = resolveStaffHeader(header);
    // Tiêu đề đầu tiên thắng: khối dán hay lặp lại cột "Ghi chú".
    if (field && ![...mapping.values()].includes(field)) mapping.set(index, field);
  });
  return mapping;
}

/**
 * Danh xưng. Cột "Danh xưng" nói thẳng thì dùng; không có thì suy từ "Thành
 * phần" — nhưng **chỉ khi thành phần ấy tự nó xác định danh xưng** (Nữ tu, Linh
 * mục, Chủng sinh). "Huynh trưởng" thì không: nó không cho biết Anh hay Chị, và
 * đoán bừa là ghi sai vào hồ sơ của một người thật, nên rơi về `other`.
 */
export function parseStaffTitle(rawTitle: unknown, rawComponent: unknown): StaffTitle {
  const title = normalizeForMatch(String(rawTitle ?? ""));
  if (title !== "") {
    if (title.startsWith("anh")) return "anh";
    if (title.startsWith("chi")) return "chi";
    if (title.startsWith("di")) return "di";
    if (title.startsWith("so") || title.startsWith("soeur") || title.startsWith("nu tu")) return "so";
    if (title.startsWith("cha") || title.startsWith("lm") || title.startsWith("linh muc")) return "cha";
    if (title.startsWith("thay")) return "thay";
  }
  const component = normalizeForMatch(String(rawComponent ?? ""));
  if (component.includes("nu tu") || component.includes("soeur")) return "so";
  if (component.includes("linh muc")) return "cha";
  if (component.includes("chung sinh") || component.includes("thay")) return "thay";
  return "other";
}

/** Cấp huynh trưởng: 1/I/"cấp 1" → `i`. Trống hoặc không nhận ra → `none`. */
export function parseFormationLevel(value: unknown): FormationLevel {
  const text = normalizeForMatch(String(value ?? ""));
  if (text === "") return "none";
  if (text.includes("dac cach") || text.includes("special")) return "special";
  if (/(^|\D)(3|iii)($|\D)/.test(text)) return "iii";
  if (/(^|\D)(2|ii)($|\D)/.test(text)) return "ii";
  if (/(^|\D)(1|i)($|\D)/.test(text)) return "i";
  return "none";
}

/**
 * Tư cách trong lớp. Cột "Vai trò" nói thẳng thì dùng; không có thì suy từ
 * "Thành phần": **Dự trưởng ⇒ `trainee`**, còn lại ⇒ `member`.
 *
 * 🔴 Không bao giờ tự suy ra `representative`. Mỗi lớp chỉ được **một** GLV đại
 * diện (`class_staff_one_active_representative_idx`), nên đoán sai là một lượt
 * ghi hỏng chắc chắn — và tệ hơn, nó cướp chỗ đại diện của người khác. Muốn ai
 * là đại diện thì phải ghi thẳng ra ở cột "Vai trò".
 */
export function parseStaffCapacity(rawCapacity: unknown, rawComponent: unknown): StaffCapacity {
  const capacity = normalizeForMatch(String(rawCapacity ?? ""));
  if (capacity !== "") {
    if (capacity.includes("dai dien")) return "representative";
    if (capacity.includes("du truong") || capacity.includes("trainee")) return "trainee";
    if (capacity !== "") return "member";
  }
  const component = normalizeForMatch(String(rawComponent ?? ""));
  if (component.includes("du truong")) return "trainee";
  return "member";
}

function isRuleLine(line: string): boolean {
  return /^[\s|:-]+$/.test(line) && line.includes("-");
}

function splitLine(line: string, delimiter: "\t" | "|"): string[] {
  if (delimiter === "\t") return line.split("\t");
  const trimmed = line.trim();
  // Chỉ bóc `|` bọc ngoài khi có ở **cả hai** đầu (hình dạng dòng bảng
  // Markdown). Xem giải thích đầy đủ ở `features/imports/paste.ts`.
  const stripped =
    trimmed.length >= 2 && trimmed.startsWith("|") && trimmed.endsWith("|")
      ? trimmed.slice(1, -1)
      : trimmed;
  return stripped.split("|");
}

/**
 * Dựng một dòng đã chuẩn hoá và phân loại nó.
 *
 * Lỗi (chặn ghi): thiếu họ tên · thiếu số điện thoại (`staff_profiles.phone` là
 * `not null`) · tên lớp không khớp lớp nào của năm học đã chọn.
 * Cảnh báo (vẫn ghi được): không có lớp — hồ sơ vẫn tạo, chỉ là chưa phân công;
 * danh xưng rơi về `other`; ngày sinh trống.
 */
export function buildStaffRow(
  rowNumber: number,
  values: Partial<Record<StaffField, unknown>>,
  classes: StaffClassLookup,
): BuiltStaffRow {
  const errors: StaffRowIssue[] = [];
  const warnings: StaffRowIssue[] = [];

  const fullName = normalizeName(values.fullName);
  if (fullName === "") errors.push({ field: "fullName", message: "Thiếu họ và tên." });

  const phone = normalizePhone(values.phone);
  if (!phone) {
    errors.push({
      field: "phone",
      message:
        "Thiếu số điện thoại hợp lệ. Hồ sơ nhân sự bắt buộc có số điện thoại (dạng 0xxxxxxxxx).",
    });
  }

  const title = parseStaffTitle(values.title, values.component);
  if (title === "other") {
    warnings.push({
      field: "title",
      message: 'Chưa rõ danh xưng (Anh/Chị/Dì/Sơ/Cha/Thầy) — hồ sơ sẽ để "Khác", sửa được sau.',
    });
  }

  const dateOfBirth = parseDate(values.dateOfBirth);
  if (!dateOfBirth && normalizeText(values.dateOfBirth) !== "") {
    warnings.push({ field: "dateOfBirth", message: "Ngày sinh không đọc được nên bỏ trống." });
  }

  const classLabel = optionalText(values.className);
  let classId: string | null = null;
  if (classLabel) {
    classId = classes.get(classAliasKey(classLabel)) ?? null;
    if (!classId) {
      errors.push({
        field: "className",
        message: `Lớp "${classLabel}" không khớp lớp nào của năm học đã chọn.`,
      });
    }
  } else {
    warnings.push({
      field: "className",
      message: "Không ghi lớp — sẽ chỉ tạo hồ sơ, chưa phân công vào lớp nào.",
    });
  }

  return {
    rowNumber,
    normalized: {
      saintName: optionalText(values.saintName),
      fullName,
      title,
      phone,
      dateOfBirth,
      address: optionalText(values.address),
      formationLevel: parseFormationLevel(values.formationLevel),
      classLabel,
      classId,
      capacity: parseStaffCapacity(values.capacity, values.component),
      component: optionalText(values.component),
    },
    errors,
    warnings,
  };
}

/**
 * Đọc khối dán thành các dòng đã dựng. Ném {@link StaffParseError} khi khối
 * không có dòng tiêu đề hoặc không có dòng dữ liệu nào — hai chuyện người dùng
 * sửa được ngay, nên phải nói ra thay vì trả một danh sách rỗng.
 */
export function parseStaffText(text: string, classes: StaffClassLookup): BuiltStaffRow[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const delimiter: "\t" | "|" = lines.some((line) => line.includes("\t")) ? "\t" : "|";

  let mapping: Map<number, StaffField> | null = null;
  const rows: BuiltStaffRow[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (normalizeText(line) === "" || isRuleLine(line)) continue;
    const cells = splitLine(line, delimiter).map((cell) => cell.trim());

    if (!mapping) {
      const candidate = mapStaffHeaderRow(cells);
      const fields = [...candidate.values()];
      if (fields.includes("fullName") && fields.length >= 2) {
        mapping = candidate;
        continue;
      }
      throw new StaffParseError(
        'Dòng đầu của khối dán phải là dòng tiêu đề cột (có ít nhất cột "Họ và tên" và ' +
          "một cột dữ liệu khác). Hãy dán cả dòng tiêu đề.",
      );
    }

    const record: Partial<Record<StaffField, unknown>> = {};
    for (const [cellIndex, field] of mapping) record[field] = cells[cellIndex] ?? null;
    if (normalizeText(record.fullName) === "") continue;

    if (rows.length >= MAX_STAFF_ROWS) {
      throw new StaffParseError(
        `Khối dán vượt quá ${MAX_STAFF_ROWS} dòng cho một lần nhập. Hãy tách nhỏ theo ngành.`,
      );
    }
    rows.push(buildStaffRow(index + 1, record, classes));
  }

  if (!mapping || rows.length === 0) {
    throw new StaffParseError(
      "Không tìm thấy dòng dữ liệu nào. Cần một dòng tiêu đề cột rồi mỗi người một dòng, " +
        "các cột cách nhau bằng TAB hoặc dấu |.",
    );
  }
  return rows;
}
