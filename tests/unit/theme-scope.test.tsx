import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeScope } from "@/components/theme/theme-scope";
import { BranchChip } from "@/components/theme/branch-chip";
import { SECTOR_PALETTE, THEME_KEYS } from "@/lib/theme/sector-palette";

describe("ThemeScope", () => {
  it("bơm đủ 13 biến ngành dưới dạng inline style cho mọi ngành", () => {
    for (const key of THEME_KEYS) {
      const { container, unmount } = render(
        <ThemeScope themeKey={key}>
          <span>nội dung</span>
        </ThemeScope>,
      );
      const root = container.firstElementChild as HTMLElement;

      expect(root.getAttribute("data-theme-key")).toBe(key);
      expect(root.style.getPropertyValue("--theme-primary")).toBe(
        SECTOR_PALETTE[key].primary,
      );
      expect(root.style.getPropertyValue("--theme-on-primary")).toBe(
        SECTOR_PALETTE[key].onPrimary,
      );
      expect(root.style.getPropertyValue("--theme-pastel")).toBe(
        SECTOR_PALETTE[key].pastel,
      );
      // chart = primary, không bao giờ là bậc pastel (09 §4.1, B-1).
      expect(root.style.getPropertyValue("--theme-chart")).toBe(
        SECTOR_PALETTE[key].primary,
      );

      unmount();
    }
  });

  it("🔴 Nghĩa Sĩ bơm chữ ĐẬM chứ không phải trắng", () => {
    const { container } = render(
      <ThemeScope themeKey="NGHIA_SI">
        <span>x</span>
      </ThemeScope>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--theme-on-primary")).toBe("#2E2A27");
    expect(root.style.getPropertyValue("--theme-on-primary")).not.toBe("#FFFFFF");
  });

  it("lồng được: thẻ con ghi đè token của thẻ cha", () => {
    const { container } = render(
      <ThemeScope themeKey="HUYNH_TRUONG">
        <ThemeScope themeKey="AU_NHI" data-testid="con">
          <span>thẻ lớp</span>
        </ThemeScope>
      </ThemeScope>,
    );
    const outer = container.firstElementChild as HTMLElement;
    const inner = screen.getByTestId("con");

    expect(outer.style.getPropertyValue("--theme-primary")).toBe(
      SECTOR_PALETTE.HUYNH_TRUONG.primary,
    );
    expect(inner.style.getPropertyValue("--theme-primary")).toBe(
      SECTOR_PALETTE.AU_NHI.primary,
    );
  });

  it("mang theo dữ liệu chẩn đoán khi được truyền cả ThemeContext", () => {
    const { container } = render(
      <ThemeScope
        theme={{
          themeKey: "THIEU_NHI",
          branchId: "s-3",
          branchName: "Thiếu Nhi",
          sourceOfTheme: "CURRENT_RECORD_BRANCH",
          academicYearId: "y-1",
          academicYearCode: "2026-2027",
          contextType: "CLASS",
          fallbackReason: null,
          availableThemeContexts: [],
          isViewingArchivedData: true,
        }}
      >
        <span>x</span>
      </ThemeScope>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-theme-source")).toBe("CURRENT_RECORD_BRANCH");
    expect(root.getAttribute("data-archived")).toBe("true");
  });
});

describe("BranchChip", () => {
  it("LUÔN hiện tên ngành bằng chữ — màu không bao giờ là tín hiệu duy nhất", () => {
    render(<BranchChip themeKey="AU_NHI" branchName="Ấu Nhi" />);
    expect(screen.getByText("Ấu Nhi")).toBeInTheDocument();
  });

  it("tự bơm token của ngành mình nên dùng được bên trong ThemeScope khác", () => {
    render(
      <ThemeScope themeKey="HUYNH_TRUONG">
        <BranchChip themeKey="NGHIA_SI" branchName="Nghĩa Sĩ" />
      </ThemeScope>,
    );
    const chip = screen.getByText("Nghĩa Sĩ");
    expect(chip.style.getPropertyValue("--theme-primary")).toBe(
      SECTOR_PALETTE.NGHIA_SI.primary,
    );
  });
});
