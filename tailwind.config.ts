import type { Config } from "tailwindcss";

// Design token là CSS variable ở src/app/globals.css.
// Nguồn sự thật: docs/system-workflow-redesign/ui-redesign/09_APPROVED_DESIGN_SYSTEM.md.
//
// Quy ước đặt tên:
//   theme-*   → token ngành, ThemeScope bơm động. CHỈ dùng ở 12 nơi (09 §4.4).
//   ink/line/page + trạng thái → trung tính, không đổi theo ngành.
//   Nhóm "BÍ DANH CŨ" giữ cho code có sẵn; không dùng trong code mới.
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ---- Token ngành (bơm động bởi ThemeScope) --------------------
        theme: {
          DEFAULT: "var(--theme-primary)",
          primary: "var(--theme-primary)",
          hover: "var(--theme-primary-hover)",
          active: "var(--theme-primary-active)",
          "on-primary": "var(--theme-on-primary)",
          "accent-text": "var(--theme-accent-text)",
          "accent-strong": "var(--theme-accent-strong)",
          border: "var(--theme-border)",
          ring: "var(--theme-ring)",
          chart: "var(--theme-chart)",
          tint: "var(--theme-tint)",
          soft: "var(--theme-soft)",
          pastel: "var(--theme-pastel)",
          "pastel-deep": "var(--theme-pastel-deep)",
        },

        // ---- Nền · chữ · viền trung tính ------------------------------
        page: "var(--bg-page)",
        overlay: "var(--bg-overlay)",
        // ⚠️ `surface` là token MỚI (09 §3) — nó từng nằm lẫn trong nhóm
        // "BÍ DANH CŨ" bên dưới trước khi nhóm ấy bị xoá ở Đợt F. Xoá nhầm
        // khoá này là `bg-surface`/`bg-surface-muted` biến mất khỏi toàn bộ
        // CSS xuất ra — gần như mọi thẻ trong app mất nền.
        surface: {
          DEFAULT: "var(--bg-surface)",
          muted: "var(--bg-surface-muted)",
        },
        ink: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          "on-dark": "var(--text-on-dark)",
        },
        line: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },

        // ---- Trạng thái — KHÔNG BAO GIỜ lấy từ token ngành -------------
        // (bí danh `-surface` của ba màu này đã xoá cùng nhóm BÍ DANH CŨ.)
        success: {
          DEFAULT: "var(--success)",
          subtle: "var(--success-subtle)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          subtle: "var(--warning-subtle)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          subtle: "var(--danger-subtle)",
        },
        info: {
          DEFAULT: "var(--info)",
          subtle: "var(--info-subtle)",
        },

        // ---- BÍ DANH CŨ (docs/06 §2) — ĐÃ XOÁ (Đợt F, 17 §10) ----------
        // `background`/`foreground`/`card`/`primary`/`secondary`/`accent`/
        // `muted`/`text`/`border`/`ring` không còn: usage trong `src/` đã về 0
        // (Đợt E quét 4 bí danh, Đợt F di trú nốt `text-muted-foreground` ×106
        // · `-primary*` ×13 · `bg-muted` ×3 · `divide-border` ×4). Viền mặc
        // định KHÔNG phụ thuộc khoá `border` cũ — globals.css đặt thẳng
        // `* { border-color: var(--border) }`.
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      // 09 §2. Sàn cứng 12px — không có bậc nào nhỏ hơn `2xs`.
      fontSize: {
        "2xs": ["var(--text-2xs)", { lineHeight: "var(--leading-normal)" }],
        xs: ["var(--text-xs)", { lineHeight: "var(--leading-normal)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--leading-normal)" }],
        base: ["var(--text-base)", { lineHeight: "var(--leading-normal)" }],
        lg: ["var(--text-lg)", { lineHeight: "var(--leading-normal)" }],
        xl: ["var(--text-xl)", { lineHeight: "var(--leading-tight)" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-tight)" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-tight)" }],
      },
      fontWeight: {
        normal: "var(--weight-normal)",
        medium: "var(--weight-medium)",
        semibold: "var(--weight-semibold)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      // Chỉ hai mức bóng (09 §5). lg/xl cố tình trỏ về md — không có mức ba.
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-md)",
        xl: "var(--shadow-md)",
      },
      zIndex: {
        base: "var(--z-base)",
        sticky: "var(--z-sticky)",
        header: "var(--z-header)",
        sidebar: "var(--z-sidebar)",
        "bottom-nav": "var(--z-bottom-nav)",
        overlay: "var(--z-overlay)",
        drawer: "var(--z-drawer)",
        dialog: "var(--z-dialog)",
        dropdown: "var(--z-dropdown)",
        toast: "var(--z-toast)",
        // 09 §12 A3 — màn hình chờ nổi trên mọi thứ, kể cả dialog và toast.
        loading: "var(--z-loading)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
      },
      // Vùng chạm: 44px chung, 48px ở data-density="comfortable" (M13).
      height: { control: "var(--control-height)" },
      minHeight: { control: "var(--control-height)" },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
};

export default config;
