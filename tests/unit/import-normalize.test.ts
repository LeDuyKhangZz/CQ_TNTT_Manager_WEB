import { describe, expect, it } from "vitest";
import {
  PATRON_FEAST_YEAR,
  classAliasKey,
  isEmptyMarker,
  normalizeForMatch,
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
} from "@/features/imports/normalize";

// The literal values below are copied from the parish sample workbooks in
// "Excel mẫu" so the rules are tested against real data, not invented data.

describe("normalizeText", () => {
  it("collapses whitespace and newlines found in address cells", () => {
    expect(normalizeText("897/62/8ATrần Hưng Đạo phường 01quận 05 \n")).toBe(
      "897/62/8ATrần Hưng Đạo phường 01quận 05",
    );
    expect(normalizeText("  Trần Phạm Ngọc  Hiếu ")).toBe("Trần Phạm Ngọc Hiếu");
  });

  it("returns empty string for null and undefined", () => {
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
  });

  it("survives the invalid Date cells real workbooks contain", () => {
    // Regression: toISOString() on an invalid Date threw RangeError and aborted
    // the entire import when parsing the Ấu/Nghĩa/Hiệp sample files.
    expect(() => normalizeText(new Date(NaN))).not.toThrow();
    expect(normalizeText(new Date(NaN))).toBe("");
    expect(parseDate(new Date(NaN))).toBeNull();
  });

  it("composes decomposed Vietnamese to NFC so no mojibake survives", () => {
    const decomposed = "Trần";
    expect(normalizeText(decomposed)).toBe("Trần");
    expect(normalizeText(decomposed).length).toBe(4);
  });
});

describe("normalizeForMatch", () => {
  it("strips diacritics and case for duplicate matching", () => {
    expect(normalizeForMatch("Trần Phạm Ngọc Hiếu")).toBe("tran pham ngoc hieu");
    expect(normalizeForMatch("PHẠM PHƯƠNG THẢO")).toBe("pham phuong thao");
  });

  it("maps đ/Đ to d", () => {
    expect(normalizeForMatch("Đoàn Phương Trúc")).toBe("doan phuong truc");
  });

  it("matches the same name written in different case and spacing", () => {
    expect(normalizeForMatch("  BÙI  PHẠM QUỲNH HƯƠNG ")).toBe(
      normalizeForMatch("Bùi Phạm Quỳnh Hương"),
    );
  });
});

describe("isEmptyMarker / optionalText", () => {
  it("treats the parish's empty markers as blank", () => {
    for (const marker of ["", "  ", "CHƯA", "Chưa RT", "Không", "không biết", "-"]) {
      expect(isEmptyMarker(marker)).toBe(true);
      expect(optionalText(marker)).toBeNull();
    }
  });

  it("keeps real values", () => {
    expect(isEmptyMarker("Giáo xứ Chợ Quán")).toBe(false);
    expect(optionalText("Giáo xứ Chợ Quán")).toBe("Giáo xứ Chợ Quán");
  });
});

describe("parseDate", () => {
  it("parses dd/MM/yyyy day-first as the template states", () => {
    expect(parseDate("20/10/2015")).toBe("2015-10-20");
    // Ambiguous-looking but unambiguous by convention: day first.
    expect(parseDate("1/2/2014")).toBe("2014-02-01");
    expect(parseDate("10/3/2015")).toBe("2015-03-10");
  });

  it("tolerates the stray space seen in '04/12 /2011'", () => {
    expect(parseDate("04/12 /2011")).toBe("2011-12-04");
  });

  it("parses the datetime strings Google Sheets exports", () => {
    expect(parseDate("2024-07-26 00:00:00")).toBe("2024-07-26");
  });

  it("reads exceljs Date objects in UTC without shifting a day", () => {
    expect(parseDate(new Date(Date.UTC(2015, 9, 20)))).toBe("2015-10-20");
  });

  it("converts Excel serial numbers", () => {
    // 1900-01-01 is serial 2 under Excel's 1900 leap-year bug.
    expect(parseDate(2)).toBe("1900-01-01");
    expect(parseDate(42297)).toBe("2015-10-20");
  });

  it("rejects impossible and empty dates instead of guessing", () => {
    expect(parseDate("31/02/2015")).toBeNull();
    expect(parseDate("CHƯA")).toBeNull();
    expect(parseDate("")).toBeNull();
    expect(parseDate(null)).toBeNull();
  });
});

describe("parsePatronFeastDate", () => {
  it("parses dd/MM onto the placeholder year", () => {
    expect(parsePatronFeastDate("22/11")).toBe(`${PATRON_FEAST_YEAR}-11-22`);
    expect(parsePatronFeastDate("15/8")).toBe(`${PATRON_FEAST_YEAR}-08-15`);
  });

  it("reduces a full date to its day and month", () => {
    expect(parsePatronFeastDate("2024-03-19 00:00:00")).toBe(`${PATRON_FEAST_YEAR}-03-19`);
  });

  it("returns null for 'Không'", () => {
    expect(parsePatronFeastDate("Không")).toBeNull();
  });

  it("keeps 29/02 valid by using a leap year", () => {
    expect(parsePatronFeastDate("29/02")).toBe(`${PATRON_FEAST_YEAR}-02-29`);
  });
});

describe("normalizePhone", () => {
  it("keeps well-formed VN mobile numbers", () => {
    expect(normalizePhone("0822367578")).toBe("0822367578");
    expect(normalizePhone("0393390810")).toBe("0393390810");
  });

  it("strips separators and country codes", () => {
    expect(normalizePhone("+84 908 363 579")).toBe("0908363579");
    expect(normalizePhone("84908363579")).toBe("0908363579");
    expect(normalizePhone("0908.363.579")).toBe("0908363579");
  });

  it("restores the leading zero Excel drops from numeric cells", () => {
    expect(normalizePhone(908363579)).toBe("0908363579");
  });

  it("returns null for values that cannot be a phone number", () => {
    expect(normalizePhone("không")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("123")).toBeNull();
  });
});

describe("normalizeName / parseSaintName", () => {
  it("title-cases ALL CAPS names but leaves mixed case untouched", () => {
    expect(normalizeName("PHẠM PHƯƠNG THẢO")).toBe("Phạm Phương Thảo");
    expect(normalizeName("Trần Ngọc Đăng Huy")).toBe("Trần Ngọc Đăng Huy");
  });

  it("treats 'Chưa'/'Chưa RT' as no saint name", () => {
    expect(parseSaintName("Chưa")).toBeNull();
    expect(parseSaintName("Chưa RT")).toBeNull();
    expect(parseSaintName("Cecilia")).toBe("Cecilia");
  });
});

describe("splitParentName", () => {
  it("splits on a colon as in 'Thomas : PHẠM CAO THIÊN'", () => {
    expect(splitParentName("Thomas : PHẠM CAO THIÊN")).toEqual({
      saintName: "Thomas",
      fullName: "Phạm Cao Thiên",
    });
  });

  it("splits on a comma as in 'Maria, Ngô Thị Xuân Trúc'", () => {
    expect(splitParentName("Maria, Ngô Thị Xuân Trúc")).toEqual({
      saintName: "Maria",
      fullName: "Ngô Thị Xuân Trúc",
    });
  });

  it("keeps an unseparated cell as the full name rather than guessing", () => {
    expect(splitParentName("Giuse Hoàng Văn Đông")).toEqual({
      saintName: null,
      fullName: "Giuse Hoàng Văn Đông",
    });
  });

  it("returns nulls for a blank cell", () => {
    expect(splitParentName("")).toEqual({ saintName: null, fullName: null });
  });
});

describe("parseGender", () => {
  it("maps the accepted spellings", () => {
    expect(parseGender("Nam")).toBe("male");
    expect(parseGender("nam")).toBe("male");
    expect(parseGender("Nữ")).toBe("female");
    expect(parseGender("NU")).toBe("female");
  });

  it("returns null on an unrecognised value so the row errors explicitly", () => {
    expect(parseGender("chưa rõ")).toBeNull();
    expect(parseGender("")).toBeNull();
  });
});

describe("parseBoolean", () => {
  it("maps x/có/1/yes to true", () => {
    for (const value of ["x", "X", "có", "CÓ", "1", "yes"]) {
      expect(parseBoolean(value)).toBe(true);
    }
  });

  it("treats blanks and anything else as false", () => {
    expect(parseBoolean("")).toBe(false);
    expect(parseBoolean("không")).toBe(false);
  });
});

describe("classAliasKey", () => {
  it("collapses the spellings listed in docs/09 §4", () => {
    const canonical = classAliasKey("Ấu 1A");
    expect(classAliasKey("Ấu 1 A")).toBe(canonical);
    expect(classAliasKey("Au1A")).toBe(canonical);
    expect(classAliasKey("ẤU 1A")).toBe(canonical);
    expect(classAliasKey(" ấu  1a ")).toBe(canonical);
  });

  it("matches the sample workbooks' class labels to their canonical class", () => {
    expect(classAliasKey("THIẾU 1A")).toBe(classAliasKey("Thiếu 1A"));
    expect(classAliasKey("ẤU 3A")).toBe(classAliasKey("Ấu 3A"));
    expect(classAliasKey("CHIÊN CON 1")).toBe(classAliasKey("Chiên 1"));
  });

  it("keeps different classes distinct", () => {
    expect(classAliasKey("Ấu 1A")).not.toBe(classAliasKey("Ấu 1B"));
    expect(classAliasKey("Thiếu 1A")).not.toBe(classAliasKey("Thiếu 3"));
    expect(classAliasKey("Nghĩa 1")).not.toBe(classAliasKey("Hiệp 1"));
  });
});
