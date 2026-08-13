/**
 * BẢNG MÀU NGÀNH ĐÃ PHÊ DUYỆT — nguồn sự thật là
 * docs/system-workflow-redesign/ui-redesign/09_APPROVED_DESIGN_SYSTEM.md §4.
 *
 * 🔴 KHÔNG sửa tay bất kỳ mã hex nào. Toàn bộ giá trị là đầu ra của
 * `node docs/system-workflow-redesign/ui-redesign/scripts/approved.mjs`
 * (accent-text/accent-strong lấy từ bảng 09 §4.1 — `accent-check.mjs` còn giữ
 * giá trị Nghĩa Sĩ cũ `#825600` đã bị thay bằng `#815600`).
 * Sửa sai là `tests/unit/sector-palette.test.ts` đỏ ngay.
 *
 * 🔴 KHÔNG thêm cột màu vào database (10 §2): màu là quyết định trình bày,
 * đổi màu không được kéo theo migration.
 */

/** Khoá theo `sectors.code`, cộng `HUYNH_TRUONG` làm mặc định trung tính. */
export const THEME_KEYS = [
  "CHIEN_CON",
  "AU_NHI",
  "THIEU_NHI",
  "NGHIA_SI",
  "HIEP_SI",
  "HUYNH_TRUONG",
] as const;

export type ThemeKey = (typeof THEME_KEYS)[number];

/**
 * `HUYNH_TRUONG` KHÔNG phải một dòng trong `public.sectors` — đây là theme mặc
 * định cho màn hình toàn cục, vai trò hệ thống và mọi nhánh dự phòng (10 §3).
 */
export const FALLBACK_THEME_KEY: ThemeKey = "HUYNH_TRUONG";
export const FALLBACK_BRANCH_NAME = "Huynh Trưởng";

export type SectorTokens = {
  primary: string;
  hover: string;
  active: string;
  /** 🔴 Nghĩa Sĩ dùng chữ ĐẬM. Component phải đọc token này, cấm `text-white`. */
  onPrimary: string;
  /** Chữ màu trên nền trắng hoặc `tint`. */
  accentText: string;
  /** Chữ màu trên nền `pastel`. `accentText` trên `pastel` là CẤM (09 §4.3). */
  accentStrong: string;
  border: string;
  ring: string;
  tint: string;
  soft: string;
  pastel: string;
  pastelDeep: string;
};

export const SECTOR_PALETTE: Record<ThemeKey, SectorTokens> = {
  CHIEN_CON: {
    primary: "#C34C7C",
    hover: "#B43E6F",
    active: "#A63163",
    onPrimary: "#FFFFFF",
    accentText: "#BA4375",
    accentStrong: "#A52F63",
    border: "#B98395",
    ring: "#E46998",
    tint: "#FFEEF3",
    soft: "#FFDBE6",
    pastel: "#FFC8D9",
    pastelDeep: "#FFB3CC",
  },
  AU_NHI: {
    primary: "#378630",
    hover: "#287821",
    active: "#196C12",
    onPrimary: "#FFFFFF",
    accentText: "#308029",
    accentStrong: "#1D7016",
    border: "#789B73",
    ring: "#55A34D",
    tint: "#E8F9E6",
    soft: "#D2F0CE",
    pastel: "#BCE7B7",
    pastelDeep: "#A6DDA0",
  },
  THIEU_NHI: {
    primary: "#1079CD",
    hover: "#006CBA",
    active: "#0060A8",
    onPrimary: "#FFFFFF",
    accentText: "#0072C5",
    accentStrong: "#0061A9",
    border: "#7196BC",
    ring: "#3996ED",
    tint: "#EBF5FF",
    soft: "#D4E9FF",
    pastel: "#BDDDFF",
    pastelDeep: "#A5D1FF",
  },
  // 🔴 NGOẠI LỆ 1: chữ ĐẬM trên nền vàng nghệ (Q-06/N-3).
  // 🔴 NGOẠI LỆ 2: hover/active SÁNG DẦN, không tối dần. Nền tối đi sẽ GIẢM
  //    tương phản với chữ đậm. Test #4 canh đúng hướng này.
  NGHIA_SI: {
    primary: "#C48401",
    hover: "#D39223",
    active: "#E09F35",
    onPrimary: "#2E2A27",
    accentText: "#986500",
    accentStrong: "#815600",
    border: "#AC8D62",
    ring: "#C58505",
    tint: "#FFF1DF",
    soft: "#FCE2C0",
    pastel: "#F8D2A1",
    pastelDeep: "#F2C383",
  },
  // Đậm hơn mức tối thiểu (6,87 thay vì ~4,5) là CỐ Ý: để tách khỏi Nghĩa Sĩ
  // (ΔE 0,050 → 0,225). Không được làm nhạt lại "cho cân bằng" (09 §4.1).
  HIEP_SI: {
    primary: "#7A5136",
    hover: "#6D452A",
    active: "#613A1F",
    onPrimary: "#FFFFFF",
    accentText: "#97633E",
    accentStrong: "#85522E",
    border: "#A58E80",
    ring: "#B6896C",
    tint: "#FCF1EA",
    soft: "#F5E2D7",
    pastel: "#EED3C3",
    pastelDeep: "#E6C4B0",
  },
  HUYNH_TRUONG: {
    primary: "#CE4846",
    hover: "#BE3939",
    active: "#B02B2E",
    onPrimary: "#FFFFFF",
    accentText: "#C5403E",
    accentStrong: "#B02A2D",
    border: "#BC847F",
    ring: "#EF6661",
    tint: "#FFEFEE",
    soft: "#FFDDDA",
    pastel: "#FFCAC5",
    pastelDeep: "#FFB7B1",
  },
};

/** Màu chữ đậm trung tính — nền `pastel`/`soft`/`pastel-deep` luôn dùng màu này. */
export const INK = "#2E2A27";
/** Nền trang trung tính — KHÔNG đổi theo ngành (09 §4.4). */
export const PAGE_BG = "#FFFBF7";

export function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === "string" && (THEME_KEYS as readonly string[]).includes(value);
}

/** `sectors.code` → `ThemeKey`; mã lạ (ngành mới chưa có màu) rơi về mặc định. */
export function themeKeyFromSectorCode(code: string | null | undefined): ThemeKey {
  return isThemeKey(code) ? code : FALLBACK_THEME_KEY;
}

/**
 * 13 CSS variable để `ThemeScope` bơm inline (10 §6).
 * Trả `Record<string, string>` chứ không phải `CSSProperties` vì React chỉ chấp
 * nhận custom property qua chỉ mục chuỗi.
 */
export function themeCssVariables(key: ThemeKey): Record<string, string> {
  const tokens = SECTOR_PALETTE[key];
  return {
    "--theme-primary": tokens.primary,
    "--theme-primary-hover": tokens.hover,
    "--theme-primary-active": tokens.active,
    "--theme-on-primary": tokens.onPrimary,
    "--theme-accent-text": tokens.accentText,
    "--theme-accent-strong": tokens.accentStrong,
    "--theme-border": tokens.border,
    "--theme-ring": tokens.ring,
    "--theme-chart": tokens.primary,
    "--theme-tint": tokens.tint,
    "--theme-soft": tokens.soft,
    "--theme-pastel": tokens.pastel,
    "--theme-pastel-deep": tokens.pastelDeep,
  };
}
