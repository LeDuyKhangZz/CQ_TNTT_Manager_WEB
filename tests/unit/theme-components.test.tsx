import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

/**
 * Mốc 0B mục 0.9 — sáu component theme.
 *
 * Mỗi khẳng định canh một điều đã ghi trong tài liệu đã duyệt:
 *   `ContextIndicator`      — 13 §6, 10 §9 (nói bằng CHỮ, không bằng màu)
 *   `ChildSwitcher`         — D-64 (ẩn khi một con), 09 §11 (chạy không cần JS)
 *   `UnassignedBanner`      — 12 §4.6 (bốn câu nguyên văn), 10 §3 bước 0
 *   `ArchivedYearBanner`    — 10 §10 (vỏ không đổi màu ⇒ dải chữ là cảnh báo duy nhất)
 *   `AcademicYearSwitcher`  — 13 §6 (thay nút chết, hiện cả trên mobile)
 *   `ThemePreviewTable`     — Q-12, 15 §4 bước 1.6 + 3.2 (không tự gán ngành)
 */

import { ContextIndicator } from "@/components/theme/context-indicator";
import { ChildSwitcher } from "@/components/theme/child-switcher";
import { UnassignedBanner, unassignedMessage } from "@/components/theme/unassigned-banner";
import { ArchivedYearBanner } from "@/components/theme/archived-year-banner";
import { ThemePreviewTable } from "@/components/theme/theme-preview-table";
import { AcademicYearSwitcher } from "@/components/layout/academic-year-switcher";
import {
  buildThemePreview,
  classifyThemeChange,
  type ThemePreviewPerson,
} from "@/lib/theme/theme-preview";
import {
  parseChildSelection,
  THEME_CHILD_COOKIE_OPTIONS,
} from "@/lib/theme/child-selection";
import type { AvailableThemeContext, ThemeContext } from "@/lib/theme/types";

const AU_NHI_ID = "11111111-1111-4111-8111-111111111111";
const THIEU_NHI_ID = "22222222-2222-4222-8222-222222222222";

function themeContext(overrides: Partial<ThemeContext> = {}): ThemeContext {
  return {
    themeKey: "AU_NHI",
    branchId: AU_NHI_ID,
    branchName: "Ấu Nhi",
    sourceOfTheme: "PRIMARY_ACTIVE_ASSIGNMENT",
    academicYearId: "y-1",
    academicYearCode: "2026-2027",
    contextType: "PERSONAL",
    fallbackReason: null,
    availableThemeContexts: [],
    isViewingArchivedData: false,
    ...overrides,
  };
}

function childContext(
  overrides: Partial<AvailableThemeContext> = {},
): AvailableThemeContext {
  return {
    key: "AU_NHI",
    branchId: AU_NHI_ID,
    branchName: "Ấu Nhi",
    contextType: "CHILD",
    selectorValue: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    label: "Maria Nguyễn Thị A · Ấu 2A",
    ...overrides,
  };
}

describe("ContextIndicator (13 §6 · 10 §9)", () => {
  it("nói ngữ cảnh bằng chữ: ngành + năm học", () => {
    render(<ContextIndicator theme={themeContext()} />);

    const line = screen.getByText(/Đang xem:/);
    expect(line).toHaveTextContent("Đang xem: Ngành Ấu Nhi · Năm học 2026-2027");
  });

  it("KHÔNG bịa ra 'Ngành Huynh Trưởng' khi đang ở mặc định trung tính", () => {
    render(
      <ContextIndicator
        theme={themeContext({
          themeKey: "HUYNH_TRUONG",
          branchId: null,
          branchName: "Huynh Trưởng",
        })}
      />,
    );

    const line = screen.getByText(/Đang xem:/);
    expect(line).toHaveTextContent("Huynh Trưởng");
    // `HUYNH_TRUONG` không phải một dòng trong `sectors` — gọi nó là "ngành"
    // là dựng lên một ngành không có trong xứ đoàn.
    expect(line.textContent).not.toContain("Ngành Huynh Trưởng");
  });

  it("kiểu `filtering` cho /reports (Q-11): đổi câu và bỏ năm học", () => {
    render(<ContextIndicator theme={themeContext()} mode="filtering" />);

    const line = screen.getByText(/Đang lọc:/);
    expect(line).toHaveTextContent("Đang lọc: Ngành Ấu Nhi");
    expect(line.textContent).not.toContain("Năm học");
  });

  it("chưa có năm học hiện hành thì không in chữ 'Năm học' trống", () => {
    render(<ContextIndicator theme={themeContext({ academicYearCode: null })} />);
    expect(screen.getByText(/Đang xem:/).textContent).not.toContain("Năm học");
  });
});

describe("ChildSwitcher (D-64 · 09 §11)", () => {
  it("một con ⇒ ẩn hoàn toàn, không phải bộ chọn chỉ có một mục", () => {
    const { container } = render(
      <ChildSwitcher contexts={[childContext()]} action={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("không con nào ⇒ cũng ẩn", () => {
    const { container } = render(<ChildSwitcher contexts={[]} action={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hai con ⇒ mỗi con là một nút gửi biểu mẫu thật (chạy khi JS chưa tải)", () => {
    render(
      <ChildSwitcher
        contexts={[
          childContext(),
          childContext({
            key: "THIEU_NHI",
            branchId: THIEU_NHI_ID,
            branchName: "Thiếu Nhi",
            selectorValue: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
            label: "Giuse Trần Văn B · Thiếu 1B",
          }),
        ]}
        action={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toHaveAttribute("type", "submit");
      expect(button).toHaveAttribute("name", "studentId");
      expect(button.className).toContain("min-h-11");
    }
    expect(buttons[0]).toHaveAttribute(
      "value",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    );
  });

  it("con đang xem được đánh dấu bằng `aria-current` VÀ bằng chữ, không chỉ bằng nền", () => {
    const selected = childContext();
    render(
      <ChildSwitcher
        contexts={[
          selected,
          childContext({
            selectorValue: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
            label: "Giuse Trần Văn B · Ấu 2A",
          }),
        ]}
        selectedValue={selected.selectorValue}
        action={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("aria-current", "true");
    expect(buttons[1]).not.toHaveAttribute("aria-current");
    expect(within(buttons[0]).getByText("Đang xem:")).toBeInTheDocument();
  });

  it("chip ngành có tên ngành bằng chữ; em chưa có ngành thì không bị dán nhãn Huynh Trưởng", () => {
    render(
      <ChildSwitcher
        contexts={[
          childContext(),
          childContext({
            key: "HUYNH_TRUONG",
            branchId: null,
            branchName: "Huynh Trưởng",
            selectorValue: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
            label: "Anna Lê Thị C",
          }),
        ]}
        action={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(within(buttons[0]).getByText("Ấu Nhi")).toBeInTheDocument();
    expect(buttons[1].textContent).toBe("Anna Lê Thị C");
  });
});

describe("UnassignedBanner (12 §4.6 · 10 §3)", () => {
  it("bốn câu chữ đã duyệt, đúng nguyên văn", () => {
    expect(unassignedMessage("NO_ACTIVE_ASSIGNMENT")).toBe(
      "Hồ sơ của bạn chưa được phân công lớp. Liên hệ Thư ký Xứ đoàn.",
    );
    expect(unassignedMessage("NOT_ENROLLED_THIS_YEAR")).toBe(
      "Em chưa được xếp lớp cho năm học này.",
    );
    expect(unassignedMessage("PROFILE_NOT_LINKED")).toBe(
      "Tài khoản chưa được liên kết với hồ sơ. Liên hệ Quản trị viên.",
    );
    expect(unassignedMessage("NO_LINKED_CHILDREN")).toBe(
      "Tài khoản chưa được liên kết với hồ sơ thiếu nhi nào.",
    );
  });

  it("bước 0 của R3: chưa đặt năm học hiện hành cũng phải nói ra", () => {
    render(
      <UnassignedBanner
        theme={{ fallbackReason: "NO_CURRENT_ACADEMIC_YEAR" }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Chưa đặt năm học hiện hành.",
    );
  });

  it("lý do không thuộc nhóm 'chưa phân công' ⇒ không hiện dải nào", () => {
    for (const reason of [
      null,
      "MULTI_BRANCH_NO_SELECTION",
      "CROSS_BRANCH_SCREEN",
      "ARCHIVED_YEAR_VIEW",
      "ROLE_CLASS_MISMATCH",
    ] as const) {
      const { container } = render(<UnassignedBanner theme={{ fallbackReason: reason }} />);
      expect(container).toBeEmptyDOMElement();
    }
  });

  it("dải nằm trong vùng aria-live để trình đọc màn hình đọc được", () => {
    render(<UnassignedBanner theme={{ fallbackReason: "NO_ACTIVE_ASSIGNMENT" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Liên hệ Thư ký Xứ đoàn.");
  });
});

describe("ArchivedYearBanner (10 §10 · 15 §6)", () => {
  it("không xem năm cũ ⇒ không có dải nào", () => {
    const { container } = render(
      <ArchivedYearBanner theme={{ isViewingArchivedData: false }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("xem năm cũ ⇒ nêu đúng năm đang xem và nói rõ không sửa được", () => {
    render(
      <ArchivedYearBanner
        theme={{ isViewingArchivedData: true }}
        academicYearLabel="2025-2026"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Đang xem dữ liệu năm học 2025-2026 (đã lưu trữ). Không thể chỉnh sửa.",
    );
  });

  it("thiếu nhãn năm ⇒ câu chung, KHÔNG mượn năm hiện hành để lấp chỗ trống", () => {
    const theme = themeContext({ isViewingArchivedData: true });
    render(<ArchivedYearBanner theme={theme} />);

    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent(
      "Đang xem dữ liệu năm học đã lưu trữ. Không thể chỉnh sửa.",
    );
    // `academicYearCode` là năm HIỆN HÀNH; in nó ra ở đây là nói sai người dùng
    // đang xem năm nào — đúng chỗ mà một cảnh báo sai còn tệ hơn không cảnh báo.
    expect(banner.textContent).not.toContain("2026-2027");
  });
});

describe("AcademicYearSwitcher (13 §6 · 05 §3.2)", () => {
  const currentYear = { id: "y-1", code: "2026-2027", name: "Năm học 2026-2027" };

  it("hiện năm thật ở mọi cỡ màn hình, không còn nút chết", () => {
    const { container } = render(<AcademicYearSwitcher current={currentYear} />);

    expect(screen.getByText("Năm học 2026-2027")).toBeInTheDocument();
    // Bản rút gọn cho 360px vẫn có câu đầy đủ cho trình đọc màn hình.
    expect(screen.getByText("Năm học hiện hành:")).toBeInTheDocument();
    expect(screen.getByText("2026-2027")).toBeInTheDocument();
    // Nút `disabled` cũ đã biến mất hẳn, và không còn `hidden` chặn mobile.
    expect(container.querySelector("button")).toBeNull();
    expect(container.firstElementChild?.className).not.toMatch(/(^|\s)hidden(\s|$)/);
  });

  it("chưa đặt năm học ⇒ nói thẳng, không in một năm bịa ra", () => {
    render(<AcademicYearSwitcher current={null} />);
    expect(screen.getByText("Chưa đặt năm học")).toBeInTheDocument();
    expect(screen.queryByText(/2026/)).toBeNull();
  });

  it("có năm khác nhưng chưa có đường đi tới ⇒ vẫn là nhãn tĩnh, không phải menu chết", () => {
    render(
      <AcademicYearSwitcher
        current={currentYear}
        others={[{ id: "y-0", code: "2025-2026", name: "Năm học 2025-2026" }]}
      />,
    );
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("năm khác có địa chỉ ⇒ thành menu; năm hiện hành không phải link", () => {
    render(
      <AcademicYearSwitcher
        current={currentYear}
        others={[
          { id: "y-0", code: "2025-2026", name: "Năm học 2025-2026", href: "/reports?nam-hoc=y-0" },
        ]}
      />,
    );

    const links = screen.getAllByRole("menuitem");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/reports?nam-hoc=y-0");
    expect(screen.getByText("Đang xem:")).toBeInTheDocument();
  });

  it("không dùng token ngành — thanh năm học không nằm trong 12 nơi của 09 §4.4", () => {
    const { container } = render(<AcademicYearSwitcher current={currentYear} />);
    expect(container.innerHTML).not.toMatch(/theme-|text-primary/);
  });
});

describe("buildThemePreview (Q-12 · 15 §4)", () => {
  const auNhi = { themeKey: "AU_NHI" as const, branchName: "Ấu Nhi" };
  const thieuNhi = { themeKey: "THIEU_NHI" as const, branchName: "Thiếu Nhi" };

  const people: ThemePreviewPerson[] = [
    { id: "s-2", name: "Trần Văn B", kind: "STAFF", current: auNhi, next: thieuNhi },
    { id: "s-1", name: "Nguyễn Văn A", kind: "STAFF", current: auNhi, next: auNhi },
    { id: "s-3", name: "Lê Văn C", kind: "STAFF", current: auNhi, next: null },
    { id: "s-4", name: "Phạm Văn D", kind: "STAFF", current: null, next: null },
    { id: "e-1", name: "Maria Nguyễn Thị E", kind: "STUDENT", current: auNhi, next: thieuNhi },
    { id: "e-2", name: "Anna Lê Thị F", kind: "STUDENT", current: null, next: auNhi },
    { id: "e-3", name: "Giuse Trần Văn G", kind: "STUDENT", current: null, next: null },
  ];

  it("phân loại đúng bốn kiểu thay đổi", () => {
    expect(classifyThemeChange(people[0])).toBe("CHANGED");
    expect(classifyThemeChange(people[1])).toBe("UNCHANGED");
    expect(classifyThemeChange(people[2])).toBe("BECOMES_UNASSIGNED");
    expect(classifyThemeChange(people[3])).toBe("STAYS_UNASSIGNED");
    expect(classifyThemeChange(people[5])).toBe("BECOMES_ASSIGNED");
  });

  it("đếm đúng theo từng nhóm", () => {
    const preview = buildThemePreview(people);

    expect(preview.staff).toEqual({
      kind: "STAFF",
      total: 4,
      changed: 1,
      newlyAssigned: 0,
      // Cả người mất phân công lẫn người vốn đã không có — đây là con số mà
      // Super Admin phải xử lý trước khi bấm kích hoạt.
      unassignedAfter: 2,
    });
    expect(preview.students).toEqual({
      kind: "STUDENT",
      total: 3,
      changed: 1,
      newlyAssigned: 1,
      unassignedAfter: 1,
    });
  });

  it("bảng chỉ giữ người có thay đổi — người giữ nguyên ngành không làm chìm mất người cần xử lý", () => {
    const preview = buildThemePreview(people);
    expect(preview.rows.map((row) => row.id)).not.toContain("s-1");
    expect(preview.rows).toHaveLength(6);
  });

  it("thứ tự tất định: nhân sự trước, rồi theo tên tiếng Việt, rồi theo id", () => {
    const preview = buildThemePreview(people);
    expect(preview.rows.map((row) => row.id)).toEqual([
      "s-3", // Lê Văn C
      "s-4", // Phạm Văn D
      "s-2", // Trần Văn B
      "e-2", // Anna Lê Thị F
      "e-3", // Giuse Trần Văn G
      "e-1", // Maria Nguyễn Thị E
    ]);
  });

  it("100 lần chạy trên cùng dữ liệu cho kết quả giống hệt (10 §3)", () => {
    const first = JSON.stringify(buildThemePreview(people));
    for (let i = 0; i < 100; i += 1) {
      expect(JSON.stringify(buildThemePreview(people))).toBe(first);
    }
  });

  it("không tự gán ngành cho người thiếu dữ liệu (15 §4 bước 3.2)", () => {
    const preview = buildThemePreview(people);
    const stays = preview.rows.find((row) => row.id === "s-4");
    expect(stays?.next).toBeNull();
  });
});

describe("ThemePreviewTable (Q-12)", () => {
  const preview = buildThemePreview([
    {
      id: "s-1",
      name: "Trần Văn B",
      kind: "STAFF",
      current: { themeKey: "AU_NHI", branchName: "Ấu Nhi" },
      next: { themeKey: "THIEU_NHI", branchName: "Thiếu Nhi" },
    },
    { id: "s-2", name: "Lê Văn C", kind: "STAFF", current: { themeKey: "AU_NHI", branchName: "Ấu Nhi" }, next: null },
    { id: "e-1", name: "Anna Lê Thị F", kind: "STUDENT", current: null, next: null },
  ]);

  it("nêu số liệu tổng và cảnh báo bằng chữ", () => {
    render(<ThemePreviewTable preview={preview} academicYearLabel="2027-2028" />);

    expect(
      screen.getByRole("heading", { name: "Sau khi kích hoạt năm học 2027-2028" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Giáo lý viên chưa có phân công/)).toHaveTextContent(
      "1 Giáo lý viên chưa có phân công",
    );
    expect(screen.getByText(/thiếu nhi chưa xếp lớp/)).toHaveTextContent(
      "1 thiếu nhi chưa xếp lớp",
    );
  });

  it("mỗi ô ngành có TÊN NGÀNH bằng chữ; thiếu dữ liệu thì nói rõ thiếu gì", () => {
    render(<ThemePreviewTable preview={preview} academicYearLabel="2027-2028" />);

    const table = screen.getByRole("table");
    expect(within(table).getByText("Thiếu Nhi")).toBeInTheDocument();
    expect(within(table).getByText("Chưa phân công")).toBeInTheDocument();
    // Em này chưa xếp lớp ở CẢ hai cột — trước và sau khi kích hoạt.
    expect(within(table).getAllByText("Chưa xếp lớp")).toHaveLength(2);
    // Cột "Thay đổi" nói thành lời, không để màu chip làm tín hiệu duy nhất.
    expect(within(table).getByText("Đổi ngành")).toBeInTheDocument();
    expect(within(table).getByText("Mất ngành")).toBeInTheDocument();
  });

  it("bảng có caption bắt buộc (05 §5.3)", () => {
    const { container } = render(
      <ThemePreviewTable preview={preview} academicYearLabel="2027-2028" />,
    );
    expect(container.querySelector("caption")).toHaveTextContent(
      "Những người đổi ngành sau khi kích hoạt năm học 2027-2028",
    );
  });

  it("không ai đổi ⇒ câu rỗng nêu tên năm học cụ thể (09 §9)", () => {
    render(
      <ThemePreviewTable preview={buildThemePreview([])} academicYearLabel="2027-2028" />,
    );
    expect(
      screen.getByText("Không ai đổi ngành sau khi kích hoạt năm học 2027-2028."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/chưa có phân công/)).toBeNull();
  });
});

describe("Lựa chọn con lưu trong cookie (10 §7)", () => {
  it("chỉ nhận UUID đúng dạng — dùng chung luật với resolver", () => {
    expect(parseChildSelection("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1")).toBe(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    );
    expect(parseChildSelection("không-phải-uuid")).toBeNull();
    expect(parseChildSelection("")).toBeNull();
    expect(parseChildSelection(null)).toBeNull();
    expect(parseChildSelection(undefined)).toBeNull();
    expect(parseChildSelection(42)).toBeNull();
  });

  it("là cookie PHIÊN và httpOnly — máy phòng học là máy dùng chung", () => {
    expect(THEME_CHILD_COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(THEME_CHILD_COOKIE_OPTIONS.sameSite).toBe("lax");
    expect(THEME_CHILD_COOKIE_OPTIONS).not.toHaveProperty("maxAge");
    expect(THEME_CHILD_COOKIE_OPTIONS).not.toHaveProperty("expires");
  });
});
