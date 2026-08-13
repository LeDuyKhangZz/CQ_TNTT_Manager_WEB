import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AA_TEXT, contrastRatio } from "@/lib/theme/contrast";
import {
  FALLBACK_THEME_KEY,
  INK,
  SECTOR_PALETTE,
  THEME_KEYS,
  themeCssVariables,
  themeKeyFromSectorCode,
} from "@/lib/theme/sector-palette";

/**
 * HÀNG RÀO CHỐNG HỒI QUY MÀU — 5 khẳng định bắt buộc của
 * docs/system-workflow-redesign/ui-redesign/09_APPROVED_DESIGN_SYSTEM.md §4.5.
 * Sửa sai một mã hex là test đỏ ngay, không đợi tới lúc review giao diện.
 */

/** Đọc thẳng seed.sql — nếu ai đó thêm ngành mà quên bảng màu, test đỏ. */
function sectorCodesFromSeed(): string[] {
  const seed = readFileSync(
    path.join(process.cwd(), "supabase", "seed.sql"),
    "utf8",
  );
  const block = seed.match(
    /insert into public\.sectors[\s\S]*?on conflict/i,
  )?.[0];
  expect(block, "Không tìm thấy khối insert public.sectors trong seed.sql").toBeTruthy();

  // Cột thứ hai của mỗi dòng values là `code`.
  return [...block!.matchAll(/\(\s*'[0-9a-f-]{36}'\s*,\s*'([A-Z_]+)'/g)].map(
    (match) => match[1],
  );
}

describe("SECTOR_PALETTE — canh bảng màu đã phê duyệt", () => {
  // ---- Test #1 ----------------------------------------------------------
  it("#1 mọi sectors.code trong seed.sql có mục trong bảng màu, và số lượng khớp", () => {
    const codes = sectorCodesFromSeed();

    expect(codes.length).toBe(5);
    for (const code of codes) {
      expect(
        Object.keys(SECTOR_PALETTE),
        `sectors.code '${code}' chưa có mục trong SECTOR_PALETTE`,
      ).toContain(code);
    }

    // Bảng màu = đúng số ngành trong seed + 1 mặc định HUYNH_TRUONG.
    // HUYNH_TRUONG cố ý KHÔNG phải một dòng trong public.sectors (10 §3).
    expect(THEME_KEYS.length).toBe(codes.length + 1);
    expect(Object.keys(SECTOR_PALETTE).length).toBe(THEME_KEYS.length);
    expect(codes).not.toContain(FALLBACK_THEME_KEY);
  });

  // ---- Test #2 ----------------------------------------------------------
  it.each(THEME_KEYS)("#2 %s — contrast(onPrimary, primary) >= 4.5", (key) => {
    const { onPrimary, primary } = SECTOR_PALETTE[key];
    expect(contrastRatio(onPrimary, primary)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  // ---- Test #3 ----------------------------------------------------------
  it.each(THEME_KEYS)(
    "#3 %s — contrast(onPrimary, hover) và contrast(onPrimary, active) >= 4.5",
    (key) => {
      const { onPrimary, hover, active } = SECTOR_PALETTE[key];
      expect(contrastRatio(onPrimary, hover)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(onPrimary, active)).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  // ---- Test #4 — bắt lỗi "Nghĩa Sĩ hover tối dần" -----------------------
  it.each(THEME_KEYS)(
    "#4 %s — hover PHẢI tăng tương phản so với primary (đúng hướng, không chỉ đủ ngưỡng)",
    (key) => {
      const { onPrimary, primary, hover, active } = SECTOR_PALETTE[key];
      const atRest = contrastRatio(onPrimary, primary);

      expect(
        contrastRatio(onPrimary, hover),
        `${key}: hover phải rõ hơn primary. Nghĩa Sĩ có chữ ĐẬM nên hover phải SÁNG dần, không tối dần.`,
      ).toBeGreaterThan(atRest);

      expect(
        contrastRatio(onPrimary, active),
        `${key}: active phải rõ hơn hover.`,
      ).toBeGreaterThan(contrastRatio(onPrimary, hover));
    },
  );

  // ---- Test #5 ----------------------------------------------------------
  it.each(THEME_KEYS)("#5 %s — quy tắc chữ trên nền màu (09 §4.3)", (key) => {
    const { tint, pastel, pastelDeep, soft, accentText, accentStrong } =
      SECTOR_PALETTE[key];

    expect(contrastRatio(INK, pastel)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(accentText, tint)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(accentStrong, pastel)).toBeGreaterThanOrEqual(AA_TEXT);

    // Chữ đậm dùng được trên cả 4 bậc pastel.
    expect(contrastRatio(INK, soft)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(INK, pastelDeep)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  // ---- Hai điều CẤM ở 09 §4.3, canh để không ai "sửa cho đẹp" -----------
  it.each(THEME_KEYS)(
    "%s — chữ trắng và accentText trên pastel vẫn ở mức CẤM (bảng màu chưa bị nới)",
    (key) => {
      const { pastel, accentText } = SECTOR_PALETTE[key];
      expect(contrastRatio("#FFFFFF", pastel)).toBeLessThan(AA_TEXT);
      expect(contrastRatio(accentText, pastel)).toBeLessThan(AA_TEXT);
    },
  );
});

describe("themeCssVariables", () => {
  it("bơm đủ 13 biến cho mọi ngành, không biến nào rỗng", () => {
    for (const key of THEME_KEYS) {
      const vars = themeCssVariables(key);
      expect(Object.keys(vars)).toHaveLength(13);
      for (const [name, value] of Object.entries(vars)) {
        expect(name.startsWith("--theme-"), name).toBe(true);
        expect(value, `${key} ${name}`).toMatch(/^#[0-9A-F]{6}$/i);
      }
    }
  });

  it("chart luôn bằng primary (09 §4.1), không phải bậc pastel", () => {
    for (const key of THEME_KEYS) {
      const vars = themeCssVariables(key);
      expect(vars["--theme-chart"]).toBe(SECTOR_PALETTE[key].primary);
      expect(vars["--theme-chart"]).not.toBe(SECTOR_PALETTE[key].pastel);
    }
  });
});

describe("themeKeyFromSectorCode", () => {
  it("trả đúng khoá cho mã ngành hợp lệ", () => {
    expect(themeKeyFromSectorCode("AU_NHI")).toBe("AU_NHI");
  });

  it("rơi về HUYNH_TRUONG với mã lạ, null hoặc undefined", () => {
    expect(themeKeyFromSectorCode("NGANH_MOI")).toBe(FALLBACK_THEME_KEY);
    expect(themeKeyFromSectorCode(null)).toBe(FALLBACK_THEME_KEY);
    expect(themeKeyFromSectorCode(undefined)).toBe(FALLBACK_THEME_KEY);
  });
});
