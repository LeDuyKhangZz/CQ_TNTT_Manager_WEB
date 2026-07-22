import { describe, expect, it } from "vitest";
import { buildRow, pickGuardian, type ClassLookup } from "@/features/imports/build-row";
import { findDuplicate, findInFileDuplicates, nameSimilarity } from "@/features/imports/dedup";
import { classAliasKey } from "@/features/imports/normalize";
import type { RawRow } from "@/features/imports/parse";

const CLASS_ID = "00000000-0000-4000-8000-000000000001";
const classes: ClassLookup = new Map([[classAliasKey("Thiếu 1A"), CLASS_ID]]);

function rawRow(values: RawRow["values"]): RawRow {
  return { rowNumber: 2, values };
}

const completeRow: RawRow["values"] = {
  fullName: "Trần Phạm Ngọc Hiếu",
  saintName: "Cecilia",
  gender: "Nữ",
  dateOfBirth: "20/10/2015",
  className: "Thiếu 1A",
  fatherName: "Phanxico Assisi Trần Ngọc Hữu Đức",
  fatherPhone: "0822367578",
  motherName: "Cecilia Phạm Nguyễn Phương Hà",
  motherPhone: "0909873735",
};

describe("pickGuardian", () => {
  it("prefers the explicit guardian over the parents", () => {
    const result = pickGuardian({
      guardianName: "Bà Ngoại",
      guardianPhone: "0900000001",
      fatherName: "Cha",
      fatherPhone: "0900000002",
      motherName: "Mẹ",
      motherPhone: "0900000003",
    });
    expect(result.source).toBe("guardian");
    expect(result.phone).toBe("0900000001");
  });

  it("falls back to the father, then the mother", () => {
    expect(pickGuardian({ fatherName: "Cha", fatherPhone: "0900000002" }).source).toBe("father");
    expect(pickGuardian({ motherName: "Mẹ", motherPhone: "0900000003" }).source).toBe("mother");
  });

  it("skips a higher-priority candidate that has no usable phone", () => {
    // The guardian column is filled in but unusable; the mother has the phone.
    const result = pickGuardian({
      guardianName: "Người giám hộ",
      guardianPhone: "không",
      motherName: "Maria Mẹ",
      motherPhone: "0909873735",
    });
    expect(result.source).toBe("mother");
    expect(result.phone).toBe("0909873735");
  });

  it("keeps the people it did not choose so no contact is lost", () => {
    const result = pickGuardian(completeRow);
    expect(result.source).toBe("father");
    expect(result.others.join(" ")).toContain("0909873735");
  });

  it("returns nothing when no contact exists at all", () => {
    expect(pickGuardian({}).source).toBeNull();
  });
});

describe("buildRow", () => {
  it("builds a clean row with no errors", () => {
    const built = buildRow(rawRow(completeRow), classes);
    expect(built.errors).toEqual([]);
    expect(built.normalized.full_name).toBe("Trần Phạm Ngọc Hiếu");
    expect(built.normalized.gender).toBe("female");
    expect(built.normalized.date_of_birth).toBe("2015-10-20");
    expect(built.normalized.class_id).toBe(CLASS_ID);
    expect(built.normalized.guardian_phone).toBe("0822367578");
  });

  it("warns rather than errors when gender is missing, since SYLL has no such column", () => {
    const built = buildRow(rawRow({ ...completeRow, gender: undefined }), classes);
    expect(built.errors).toEqual([]);
    expect(built.warnings.map((issue) => issue.field)).toContain("gender");
    expect(built.normalized.gender).toBeNull();
  });

  it("uses the upload-time class only when the row names no class", () => {
    const withoutClass = buildRow(rawRow({ ...completeRow, className: undefined }), classes, {
      fallbackClassId: CLASS_ID,
      fallbackClassLabel: "Thiếu 1A",
    });
    expect(withoutClass.errors).toEqual([]);
    expect(withoutClass.normalized.class_id).toBe(CLASS_ID);
  });

  it("lets a class named on the row win over the upload-time class", () => {
    const other = "00000000-0000-4000-8000-000000000002";
    const built = buildRow(rawRow(completeRow), classes, { fallbackClassId: other });
    expect(built.normalized.class_id).toBe(CLASS_ID);
  });

  it("still errors when there is neither a row class nor an upload-time class", () => {
    const built = buildRow(rawRow({ ...completeRow, className: undefined }), classes);
    expect(built.errors.map((issue) => issue.field)).toContain("className");
  });

  it("errors on an unknown class instead of inventing one", () => {
    const built = buildRow(rawRow({ ...completeRow, className: "Lớp Không Tồn Tại" }), classes);
    expect(built.errors.map((issue) => issue.field)).toContain("className");
    expect(built.normalized.class_id).toBeNull();
  });

  it("resolves class aliases to the canonical class", () => {
    for (const alias of ["THIẾU 1A", "Thiếu 1 A", "thieu1a"]) {
      const built = buildRow(rawRow({ ...completeRow, className: alias }), classes);
      expect(built.normalized.class_id, alias).toBe(CLASS_ID);
    }
  });

  it("errors when no usable guardian phone exists", () => {
    const built = buildRow(
      rawRow({ ...completeRow, fatherPhone: undefined, motherPhone: undefined }),
      classes,
    );
    expect(built.errors.map((issue) => issue.field)).toContain("guardianPhone");
  });

  it("warns rather than errors when the saint name is 'Chưa'", () => {
    const built = buildRow(rawRow({ ...completeRow, saintName: "Chưa" }), classes);
    expect(built.errors).toEqual([]);
    expect(built.warnings.map((issue) => issue.field)).toContain("saintName");
    expect(built.normalized.saint_name).toBeNull();
  });

  it("rejects a future birth date", () => {
    const built = buildRow(rawRow({ ...completeRow, dateOfBirth: "01/01/2999" }), classes);
    expect(built.errors.map((issue) => issue.field)).toContain("dateOfBirth");
  });

  it("collects baptism and confirmation into sacraments", () => {
    const built = buildRow(
      rawRow({
        ...completeRow,
        baptismDate: "22/11/2015",
        baptismPlace: "Giáo xứ Mai Khôi Quận 5",
        confirmationDate: "CHƯA",
      }),
      classes,
    );
    expect(built.normalized.sacraments).toEqual([
      { type: "baptism", date: "2015-11-22", place: "Giáo xứ Mai Khôi Quận 5" },
    ]);
  });
});

describe("nameSimilarity", () => {
  it("scores identical names as 1", () => {
    expect(nameSimilarity("Trần Ngọc Hiếu", "TRẦN NGỌC HIẾU")).toBe(1);
  });

  it("scores a one-word difference below 1 but still high", () => {
    const score = nameSimilarity("Trần Phạm Ngọc Hiếu", "Trần Phạm Ngọc Hiền");
    expect(score).toBeGreaterThan(0.6);
    expect(score).toBeLessThan(1);
  });

  it("scores unrelated names near 0", () => {
    expect(nameSimilarity("Trần Ngọc Hiếu", "Nguyễn Văn Vinh")).toBeLessThan(0.3);
  });
});

describe("findDuplicate", () => {
  const existing = [
    {
      id: "s1",
      studentCode: "CQ0001",
      fullName: "Trần Phạm Ngọc Hiếu",
      dateOfBirth: "2015-10-20",
      guardianPhone: "0822367578",
    },
  ];

  function normalizedFrom(overrides: Partial<RawRow["values"]> = {}) {
    return buildRow(rawRow({ ...completeRow, ...overrides }), classes).normalized;
  }

  it("flags high when name, birth date and phone all match", () => {
    const match = findDuplicate(normalizedFrom(), existing);
    expect(match?.level).toBe("high");
    expect(match?.student.studentCode).toBe("CQ0001");
  });

  it("flags medium when only name and birth date match", () => {
    const match = findDuplicate(normalizedFrom({ fatherPhone: "0900000999" }), existing);
    expect(match?.level).toBe("medium");
  });

  it("flags low when the phone matches and the name is close", () => {
    const match = findDuplicate(
      normalizedFrom({ fullName: "Trần Phạm Ngọc Hiền", dateOfBirth: "21/10/2015" }),
      existing,
    );
    expect(match?.level).toBe("low");
  });

  it("returns null for a genuinely different student", () => {
    const match = findDuplicate(
      normalizedFrom({
        fullName: "Nguyễn Văn Vinh",
        dateOfBirth: "20/10/2011",
        fatherPhone: "0933616371",
      }),
      existing,
    );
    expect(match).toBeNull();
  });
});

describe("findInFileDuplicates", () => {
  it("catches two identical children inside one upload", () => {
    const rows = [
      buildRow(rawRow(completeRow), classes).normalized,
      buildRow(rawRow({ ...completeRow, saintName: "Maria" }), classes).normalized,
    ];
    const conflicts = findInFileDuplicates(rows);
    expect(conflicts.has(1)).toBe(true);
    expect(conflicts.has(0)).toBe(false);
  });

  it("leaves distinct children alone", () => {
    const rows = [
      buildRow(rawRow(completeRow), classes).normalized,
      buildRow(rawRow({ ...completeRow, fullName: "Nguyễn Văn Vinh" }), classes).normalized,
    ];
    expect(findInFileDuplicates(rows).size).toBe(0);
  });
});
