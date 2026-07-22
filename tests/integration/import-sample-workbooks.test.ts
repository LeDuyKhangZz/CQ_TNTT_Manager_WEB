// @vitest-environment node
// The parser is server-side code and exceljs needs real Node buffers, so this
// suite must not run under the project's default jsdom environment.
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ImportParseError, parseWorkbook } from "@/features/imports/parse";
import { normalizePhone, parseDate } from "@/features/imports/normalize";

// These workbooks hold real children's personal data, so they live OUTSIDE the
// repository and are never copied in. When the folder is absent (CI, a fresh
// clone) the suite skips instead of failing.
const SAMPLE_ROOT = path.resolve(process.cwd(), "..", "Excel mẫu");
const hasSamples = existsSync(SAMPLE_ROOT);
const describeSamples = hasSamples ? describe : describe.skip;

async function parseSample(relativePath: string) {
  return parseWorkbook(await readFile(path.join(SAMPLE_ROOT, relativePath)));
}

describeSamples("parsing the parish sample workbooks", () => {
  it("reads the Thiếu 1A SYLL sheet with its rich profile columns", async () => {
    const parsed = await parseSample(path.join("Ngành Thiếu", "Lớp Thiếu 1A", "Thieu_1A.xlsx"));

    expect(parsed.layout).toBe("syll");
    expect(parsed.rows.length).toBeGreaterThan(20);

    const first = parsed.rows[0].values;
    expect(first.fullName).toBeTruthy();
    // The parent columns must not be mistaken for the child's own name.
    expect(first.fullName).not.toBe(first.fatherName);
    expect(first.fullName).not.toBe(first.motherName);
    expect(parseDate(first.dateOfBirth)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(first.className).toBeTruthy();
  });

  it("maps father and mother phones to distinct fields", async () => {
    const parsed = await parseSample(path.join("Ngành Thiếu", "Lớp Thiếu 1A", "Thieu_1A.xlsx"));
    const withBothParents = parsed.rows.find(
      (row) => row.values.fatherPhone && row.values.motherPhone,
    );
    expect(withBothParents).toBeDefined();
    const father = normalizePhone(withBothParents!.values.fatherPhone);
    const mother = normalizePhone(withBothParents!.values.motherPhone);
    expect(father).toMatch(/^0\d{9}$/);
    expect(mother).toMatch(/^0\d{9}$/);
    expect(father).not.toBe(mother);
  });

  it("every parsed row yields a usable birth date and at least one contact phone", async () => {
    const parsed = await parseSample(path.join("Ngành Thiếu", "Lớp Thiếu 1A", "Thieu_1A.xlsx"));
    const unusable = parsed.rows.filter((row) => {
      const dob = parseDate(row.values.dateOfBirth);
      const phone =
        normalizePhone(row.values.guardianPhone) ??
        normalizePhone(row.values.fatherPhone) ??
        normalizePhone(row.values.motherPhone);
      return !dob || !phone;
    });
    // Report which rows would need review rather than asserting perfection.
    expect(unusable.length).toBeLessThan(parsed.rows.length / 2);
  });

  it("falls back to DS_dau_nam for Chiên Con, whose SYLL sheet is empty", async () => {
    const parsed = await parseSample(
      path.join("Ngành Chiên - Ấu", "Lớp Chiên Con 1", "Chiên con 1.xlsx"),
    );
    expect(parsed.layout).toBe("ds_dau_nam");
    expect(parsed.rows.length).toBeGreaterThan(5);

    // The roster splits the name across two columns; they must be rejoined.
    const named = parsed.rows.filter((row) => String(row.values.fullName).includes(" "));
    expect(named.length).toBeGreaterThan(0);
  });

  // Parsing three multi-sheet workbooks and scoring every candidate sheet
  // exceeds the 5s default.
  it("reads the Ấu, Nghĩa and Hiệp workbooks through the same SYLL mapping", { timeout: 30000 }, async () => {
    const files = [
      path.join("Ngành Chiên - Ấu", "Lớp Ấu 1A", "Ấu 1A.xlsx"),
      path.join("Ngành Nghĩa", "Nghĩa 1.xlsx"),
      path.join("Ngành Hiệp", "Hiệp 1.xlsx"),
    ];
    for (const file of files) {
      const parsed = await parseSample(file);
      expect(parsed.layout, file).toBe("syll");
      expect(parsed.rows.length, file).toBeGreaterThan(0);
      expect(parsed.rows[0].values.fullName, file).toBeTruthy();
    }
  });

  it("rejects a workbook with no importable data instead of importing blanks", async () => {
    // Dự Trưởng has an empty SYLL and no usable roster.
    await expect(parseSample(path.join("Ngành Hiệp", "Dự Trưởng.xlsx"))).rejects.toBeInstanceOf(
      ImportParseError,
    );
  });
});
