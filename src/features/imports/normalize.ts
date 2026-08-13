// P2-T4: normalization rules for Excel import (docs/09 §4).
//
// Every quirk handled here was observed in the parish sample workbooks
// ("Excel mẫu"): dd/MM/yyyy with stray spaces, Excel serial dates, ALL CAPS
// names, "CHƯA"/"Không" used as an empty marker, and parent cells that pack a
// saint name and a full name together with ":" or ",".

/** Placeholder year for patron feast days, which carry only day/month.
 *  2000 is a leap year so 29/02 survives the round-trip. */
export const PATRON_FEAST_YEAR = 2000;

/**
 * `normalizeText` và `normalizeForMatch` nay nằm ở `src/lib/text` — M03-B nâng
 * chúng lên dùng chung để đường nhập tay và đường Excel có **cùng một định
 * nghĩa "trùng"** (AC-F13-04). Xuất lại ở đây nên mọi chỗ gọi cũ giữ nguyên.
 */
import { normalizeForMatch, normalizeText } from "@/lib/text/normalize-for-match";

export { normalizeForMatch, normalizeText };

/** Values the parish uses to mean "nothing here" rather than a real value. */
const EMPTY_MARKERS = new Set([
  "",
  "chua",
  "chua rt",
  "chua ro",
  "khong",
  "khong biet",
  "k",
  "n/a",
  "n a",
  "na",
  "-",
  "--",
]);

/** True when a cell holds one of the parish's "empty" markers. */
export function isEmptyMarker(value: unknown): boolean {
  const text = normalizeText(value);
  if (text === "") return true;
  return EMPTY_MARKERS.has(normalizeForMatch(text));
}

/** Text value, or null when the cell is blank or an empty marker. */
export function optionalText(value: unknown): string | null {
  if (isEmptyMarker(value)) return null;
  return normalizeText(value);
}

// --- Dates -----------------------------------------------------------------

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function isoFrom(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Reject impossible days (31/02) by round-tripping through UTC.
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${pad(month)}-${pad(day)}`;
}

/** Excel stores dates as days since 1899-12-30 (the 1900 leap-year bug). */
function fromExcelSerial(serial: number): string | null {
  if (!Number.isFinite(serial) || serial <= 0 || serial > 60000) return null;
  const ms = Math.round(serial) * 86400000;
  const base = Date.UTC(1899, 11, 30);
  const date = new Date(base + ms);
  return isoFrom(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/**
 * Parse a birth date into `yyyy-MM-dd`.
 * Accepts: Date (from exceljs), Excel serial number, dd/MM/yyyy, d/M/yyyy,
 * yyyy-MM-dd, and the same with "." or "-" separators or stray inner spaces
 * (the sample file contains "04/12 /2011").
 * Vietnamese convention is day-first — the template header states dd/mm/yyyy.
 */
export function parseDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    // exceljs yields UTC midnight for date cells; read UTC to avoid a -1 day
    // shift in timezones behind UTC.
    return isoFrom(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }

  if (typeof value === "number") return fromExcelSerial(value);

  const text = normalizeText(value).replace(/\s+/gu, "");
  if (text === "" || isEmptyMarker(text)) return null;

  // A datetime string such as "2024-07-26 00:00:00" (already collapsed above).
  const isoMatch = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/u.exec(text);
  if (isoMatch) {
    return isoFrom(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const dmyMatch = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/u.exec(text);
  if (dmyMatch) {
    return isoFrom(Number(dmyMatch[3]), Number(dmyMatch[2]), Number(dmyMatch[1]));
  }

  // A bare serial number typed as text.
  if (/^\d+$/u.test(text)) return fromExcelSerial(Number(text));

  return null;
}

/**
 * Parse a patron feast day, which the parish writes as dd/MM (no year).
 * Normalized onto {@link PATRON_FEAST_YEAR} so it is a valid `date` column;
 * only day and month are meaningful. Full dates are accepted and reduced.
 */
export function parsePatronFeastDate(value: unknown): string | null {
  if (isEmptyMarker(value)) return null;

  const full = parseDate(value);
  if (full) {
    const [, month, day] = full.split("-");
    return isoFrom(PATRON_FEAST_YEAR, Number(month), Number(day));
  }

  const text = normalizeText(value).replace(/\s+/gu, "");
  const dmMatch = /^(\d{1,2})[-/.](\d{1,2})$/u.exec(text);
  if (dmMatch) {
    return isoFrom(PATRON_FEAST_YEAR, Number(dmMatch[2]), Number(dmMatch[1]));
  }
  return null;
}

// --- Phone -----------------------------------------------------------------

/**
 * Normalize a Vietnamese mobile number to its national 0-prefixed form so that
 * guardian reuse matches reliably (docs/09 §7). Returns null when the value
 * cannot be a VN number — the caller decides whether that is an error.
 */
export function normalizePhone(value: unknown): string | null {
  if (isEmptyMarker(value)) return null;
  // Excel often stores phone cells as numbers, dropping the leading zero.
  let digits = normalizeText(value).replace(/[^\d+]/gu, "");
  if (digits === "") return null;

  if (digits.startsWith("+84")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("84") && digits.length >= 11) digits = `0${digits.slice(2)}`;
  else if (!digits.startsWith("0") && digits.length === 9) digits = `0${digits}`;

  digits = digits.replace(/\D/gu, "");
  if (!/^0\d{9,10}$/u.test(digits)) return null;
  return digits;
}

// --- Names -----------------------------------------------------------------

/** Title-case a name that was typed in ALL CAPS; leave mixed case alone. */
export function normalizeName(value: unknown): string {
  const text = normalizeText(value);
  if (text === "") return "";
  const isAllCaps = text === text.toUpperCase() && /\p{L}/u.test(text);
  if (!isAllCaps) return text;
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/** Saint name, or null when the parish wrote "Chưa"/"Chưa RT" (not yet baptised). */
export function parseSaintName(value: unknown): string | null {
  if (isEmptyMarker(value)) return null;
  return normalizeName(value);
}

/**
 * Split a parent cell such as "Thomas : PHẠM CAO THIÊN" or
 * "Maria, Ngô Thị Xuân Trúc" into saint name and full name. When there is no
 * separator the whole cell is treated as the full name, because the saint name
 * is not reliably separable from a Vietnamese given name.
 */
export function splitParentName(value: unknown): {
  saintName: string | null;
  fullName: string | null;
} {
  if (isEmptyMarker(value)) return { saintName: null, fullName: null };
  const text = normalizeText(value);
  const separatorMatch = /^([^:,]+)\s*[:,]\s*(.+)$/u.exec(text);
  if (separatorMatch) {
    return {
      saintName: normalizeName(separatorMatch[1]),
      fullName: normalizeName(separatorMatch[2]),
    };
  }
  return { saintName: null, fullName: normalizeName(text) };
}

// --- Gender / boolean ------------------------------------------------------

export type Gender = "male" | "female" | "other";

const MALE_TOKENS = new Set(["nam", "m", "male", "trai", "boy"]);
const FEMALE_TOKENS = new Set(["nu", "f", "female", "gai", "girl"]);

/** Map the template's gender cell. Returns null when unrecognised so the row
 *  becomes an explicit error rather than a silent wrong guess. */
export function parseGender(value: unknown): Gender | null {
  if (isEmptyMarker(value)) return null;
  const token = normalizeForMatch(value);
  if (MALE_TOKENS.has(token)) return "male";
  if (FEMALE_TOKENS.has(token)) return "female";
  if (token === "khac" || token === "other") return "other";
  return null;
}

const TRUE_TOKENS = new Set(["x", "co", "1", "yes", "y", "true", "dung"]);

/** Boolean mapping for flag columns: `x`, `có`, `1`, `yes` (docs/09 §4). */
export function parseBoolean(value: unknown): boolean {
  if (isEmptyMarker(value)) return false;
  if (typeof value === "boolean") return value;
  return TRUE_TOKENS.has(normalizeForMatch(value));
}

// --- Class aliases ---------------------------------------------------------

/**
 * Canonicalize a class label so the parish's many spellings resolve to the
 * seeded `classes.display_name`: "ẤU 3A", "Au 3 A", "Ấu 3 a" → "Ấu 3A".
 * Returns a lookup key, not a display name — compare against the same
 * transformation applied to `classes.display_name`.
 */
export function classAliasKey(value: unknown): string {
  const base = normalizeForMatch(value)
    // "chien con 1" and "chien 1" are the same class family.
    .replace(/^chien con\b/u, "chien")
    .replace(/^du truong\b/u, "dutruong");
  // Drop spaces so "au 3 a" and "au3a" collapse together.
  return base.replace(/\s+/gu, "");
}
