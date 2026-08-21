import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * REDESIGN 2C — R2.1 `DataTable v2` (`11_DESIGN_SYSTEM` U1, `07` §5, tiêu chí
 * riêng ở `14_ACCEPTANCE_CRITERIA` §C).
 *
 * Bốn điều `14` §C đòi, mỗi điều có bài kiểm ở đây:
 *   1. `aria-sort` đúng — và chỉ đặt trên cột sắp xếp được
 *   2. bàn phím duyệt được hàng và hành động — sắp xếp là LINK, hàng là LINK
 *   3. cột đã ẩn nhớ lại sau khi tải lại trang
 *   4. `mobileRow` không lệch dữ liệu với cột desktop — **một nguồn định nghĩa**
 *
 * Bài kiểm bám vào hành vi và cây a11y. Chỗ duy nhất bám chuỗi class là những
 * chỗ mà class CHÍNH LÀ hành vi (dính trái, ẩn dưới `md`, bề rộng tối thiểu chỉ
 * áp từ `md`) — không có cách nào khác đo được trong jsdom.
 */

import {
  DataTable,
  dataTableColumnLabel,
  type DataTableColumn,
} from "@/components/ui/data-table";
import {
  DataTableColumnToggle,
  columnToggleStorageKey,
} from "@/components/ui/data-table-column-toggle";

type Row = { id: string; name: string; className: string; absences: number };

const ROWS: Row[] = [
  { id: "a", name: "Nguyễn Văn An", className: "Ấu 1A", absences: 2 },
  { id: "b", name: "Trần Thị Bình", className: "Ấu 1B", absences: 0 },
];

/** Bao nhiêu lần `cell` của cột "Lớp" được gọi — dùng để bắt render đôi. */
let classCellCalls = 0;

const COLUMNS: DataTableColumn<Row>[] = [
  { key: "name", header: "Họ tên", cell: (row) => row.name, sortKey: "name" },
  {
    key: "class",
    header: "Lớp",
    cell: (row) => {
      classCellCalls += 1;
      return row.className;
    },
    sortKey: "class",
    hideable: true,
  },
  {
    key: "absences",
    header: "Buổi vắng",
    cell: (row) => row.absences,
    numeric: true,
    hideable: true,
  },
];

const SORT_HREF = (key: string, direction: "asc" | "desc") =>
  `/students?sort=${key}&dir=${direction}`;

function renderTable(extra?: Partial<React.ComponentProps<typeof DataTable<Row>>>) {
  return render(
    <DataTable
      caption="Danh sách thiếu nhi"
      columns={COLUMNS}
      rows={ROWS}
      getRowKey={(row) => row.id}
      {...extra}
    />,
  );
}

beforeEach(() => {
  classCellCalls = 0;
});

/* ========================================================================== */

describe("DataTable v2 — sắp xếp (14 §C: aria-sort đúng, bàn phím duyệt được)", () => {
  it("cột đang xếp mang aria-sort thật, cột sắp xếp được khác mang none", () => {
    renderTable({ sort: { key: "name", direction: "asc", buildHref: SORT_HREF } });

    expect(screen.getByRole("columnheader", { name: /Họ tên/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(screen.getByRole("columnheader", { name: /Lớp/ })).toHaveAttribute(
      "aria-sort",
      "none",
    );
  });

  it("cột KHÔNG sắp xếp được thì không có aria-sort — không hứa suông với trình đọc màn hình", () => {
    renderTable({ sort: { key: "name", direction: "asc", buildHref: SORT_HREF } });

    expect(
      screen.getByRole("columnheader", { name: /Buổi vắng/ }),
    ).not.toHaveAttribute("aria-sort");
  });

  it("không truyền `sort` thì header là chữ trơn, không có aria-sort và không có link", () => {
    renderTable();

    const header = screen.getByRole("columnheader", { name: "Họ tên" });
    expect(header).not.toHaveAttribute("aria-sort");
    expect(within(header).queryByRole("link")).toBeNull();
  });

  it("sắp xếp là LINK (chép được, Back đúng, chạy khi chưa có JS), không phải nút", () => {
    renderTable({ sort: { key: "name", direction: "asc", buildHref: SORT_HREF } });

    const link = screen.getByRole("link", { name: /Họ tên/ });
    expect(link).toHaveAttribute("href", "/students?sort=name&dir=desc");
    expect(screen.queryByRole("button", { name: /Họ tên/ })).toBeNull();
  });

  it("bấm lại cột đang xếp thì đảo chiều, sang cột khác thì bắt đầu tăng dần", () => {
    renderTable({ sort: { key: "name", direction: "desc", buildHref: SORT_HREF } });

    expect(screen.getByRole("link", { name: /Họ tên/ })).toHaveAttribute(
      "href",
      "/students?sort=name&dir=asc",
    );
    expect(screen.getByRole("link", { name: /Lớp/ })).toHaveAttribute(
      "href",
      "/students?sort=class&dir=asc",
    );
  });

  it("mũi tên không phải tín hiệu duy nhất — có câu chữ nói bấm vào thì gì xảy ra", () => {
    renderTable({ sort: { key: "name", direction: "asc", buildHref: SORT_HREF } });

    expect(
      screen.getByRole("link", { name: /đang xếp tăng dần, bấm để xếp giảm dần/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lớp — sắp xếp tăng dần/ })).toBeInTheDocument();
  });

  it("vùng chạm của nút sắp xếp ≥44px (09 §10 điều 7)", () => {
    renderTable({ sort: { key: "name", direction: "asc", buildHref: SORT_HREF } });
    expect(screen.getByRole("link", { name: /Họ tên/ }).className).toMatch(/min-h-11/);
  });
});

/* ========================================================================== */

describe("DataTable v2 — mật độ và header dính (07 §4, §5)", () => {
  it("mặc định là comfortable: hàng 48px, không khai báo data-density", () => {
    const { container } = renderTable();

    expect(container.querySelector("tbody tr")?.className).toMatch(/h-12/);
    expect(container.firstElementChild).not.toHaveAttribute("data-density");
  });

  it("compact hạ hàng xuống 44px — ĐÚNG sàn vùng chạm, không thấp hơn", () => {
    const { container } = renderTable({ density: "compact" });

    const row = container.querySelector("tbody tr");
    expect(row?.className).toMatch(/h-11/);
    expect(row?.className).not.toMatch(/h-10/);
    expect(container.querySelector("tbody td")?.className).toMatch(/px-3 py-2/);
    // Khai báo sẵn cho token của R2.10; hôm nay chưa có quy tắc CSS nào bắt nó.
    expect(container.firstElementChild).toHaveAttribute("data-density", "compact");
  });

  it("portal không bị kéo sang compact: bảng không tự đặt density", () => {
    const { container } = renderTable({ density: "comfortable" });
    expect(container.firstElementChild).not.toHaveAttribute("data-density");
  });

  it("header dính phải đi kèm trần chiều cao, nếu không thì không có gì để dính", () => {
    const { container } = renderTable({ stickyHeader: true });

    const frame = container.querySelector(".overflow-x-auto");
    expect(frame?.className).toMatch(/overflow-y-auto/);
    expect(frame?.className).toMatch(/max-h-\[70vh\]/);
    expect(container.querySelector("thead th")).toHaveClass("sticky", "top-0");
    // Ô dính phải có nền đặc, nếu không chữ của hàng dưới trượt qua dưới nó.
    expect(container.querySelector("thead th")?.className).toMatch(/bg-surface-muted/);
  });
});

/* ========================================================================== */

describe("DataTable v2 — chọn hàng (07 §5: chỉ bật ở màn có bulk thật)", () => {
  const selection = {
    name: "studentId",
    getValue: (row: Row) => row.id,
    getLabel: (row: Row) => `Chọn ${row.name}`,
  };

  it("ô tick là input THẬT có name/value ⇒ form chạy được không cần JS", () => {
    renderTable({ selection });

    const box = screen.getByRole("checkbox", { name: "Chọn Nguyễn Văn An" });
    expect(box).toHaveAttribute("name", "studentId");
    expect(box).toHaveAttribute("value", "a");
  });

  it("nhãn ô tick NÊU TÊN em, không phải 25 chữ 'Chọn' giống hệt nhau", () => {
    renderTable({ selection });

    expect(screen.getByRole("checkbox", { name: "Chọn Trần Thị Bình" })).toBeInTheDocument();
  });

  it("cột chọn rộng đúng 48px và padding hẹp — để cột dính thứ hai lùi khớp left-12", () => {
    const { container } = renderTable({ selection });

    const selectionHead = container.querySelector("thead th");
    expect(selectionHead?.className).toMatch(/w-12/);
    expect(selectionHead?.className).toMatch(/px-3/);
    expect(selectionHead?.className).toMatch(/sticky left-0/);

    const firstDataCell = container.querySelector('tbody td[data-column="name"]');
    expect(firstDataCell?.className).toMatch(/sticky left-12/);
  });

  it("ô 'chọn tất cả' do trang client cắm vào; không cắm thì header vẫn có tên cho SR", () => {
    const { rerender } = renderTable({ selection });
    expect(screen.getByText("Chọn")).toHaveClass("sr-only");

    rerender(
      <DataTable
        caption="Danh sách thiếu nhi"
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(row) => row.id}
        selection={{ ...selection, headerSlot: <button type="button">Chọn tất cả</button> }}
      />,
    );
    expect(screen.getByRole("button", { name: "Chọn tất cả" })).toBeInTheDocument();
  });

  it("bảng rỗng trải hết bề ngang KỂ CẢ cột chọn", () => {
    const { container } = renderTable({ rows: [], selection, empty: <p>Chưa có em nào.</p> });

    expect(container.querySelector("tbody td")).toHaveAttribute("colspan", "4");
  });
});

/* ========================================================================== */

describe("DataTable v2 — card-row dưới md (14 §C: một nguồn định nghĩa cột)", () => {
  const mobileRow = {
    titleKey: "name",
    trailingKey: "absences",
    metaKeys: ["class"],
  } as const;

  it("card dùng lại ĐÚNG `cell` của cột desktop — không có nhánh dựng riêng", () => {
    renderTable({ mobileRow });

    // `cell` của cột "Lớp" chạy đúng một lần cho mỗi hàng: nếu có nhánh mobile
    // dựng riêng (hoặc DOM render đôi như lỗi R1.6) thì con số này gấp đôi.
    expect(classCellCalls).toBe(ROWS.length);
    expect(screen.getAllByText("Ấu 1A")).toHaveLength(1);
  });

  it("dòng phụ có NHÃN bằng chữ ở mobile — card không có hàng tiêu đề để đối chiếu", () => {
    const { container } = renderTable({ mobileRow });

    const metaCell = container.querySelector('tbody td[data-column="class"]');
    expect(metaCell?.textContent).toBe("Lớp:Ấu 1A");
    // Nhãn ấy chỉ dành cho mobile; từ `md` trở lên đã có `<thead>` nói rồi.
    expect(within(metaCell as HTMLElement).getByText("Lớp:")).toHaveClass("md:hidden");
  });

  it("cột không nằm trong mobileRow bị giấu dưới md, không bị xoá khỏi bảng", () => {
    const { container } = renderTable({
      mobileRow: { titleKey: "name", metaKeys: ["class"] },
    });

    const cell = container.querySelector('tbody td[data-column="absences"]');
    expect(cell?.className).toMatch(/hidden md:table-cell/);
    expect(cell?.textContent).toBe("2");
  });

  it("hàng tiêu đề ẩn dưới md nhưng vẫn là thead thật từ md trở lên", () => {
    const { container } = renderTable({ mobileRow });
    expect(container.querySelector("thead")?.className).toMatch(/hidden md:table-header-group/);
  });

  it("bề rộng tối thiểu chỉ áp TỪ md — card-row ở 360px không được sinh cuộn ngang", () => {
    const { container } = renderTable({ mobileRow, minWidth: "720px" });

    const table = container.querySelector("table");
    expect(table?.className).toMatch(/md:min-w-\[var\(--dt-min-width\)\]/);
    expect(table?.className).not.toMatch(/(^|\s)min-w-\[/);
    expect(table?.getAttribute("style")).toContain("--dt-min-width: 720px");
  });

  it("có card-row thì chỉ báo 'Vuốt ngang' cũng lùi lên từ md — dưới md không còn gì để vuốt", () => {
    renderTable({ mobileRow });
    expect(screen.getByText("Vuốt ngang để xem thêm cột.")).toHaveClass("md:block");
  });

  it("không có mobileRow thì bảng giữ nguyên hành vi v1", () => {
    const { container } = renderTable();

    expect(container.querySelector("thead")?.className).not.toMatch(/hidden/);
    expect(container.querySelector("table")?.className).toMatch(/min-w-\[640px\]/);
    expect(container.querySelector("tbody td")?.className).not.toMatch(/block/);
  });
});

/* ========================================================================== */

describe("DataTable v2 — cả hàng là link (07 §8: Enter trên hàng mở chi tiết)", () => {
  const rowHref = (row: Row) => `/students/${row.id}`;

  it("link thật ở ô đầu và giãn ra phủ cả hàng — bàn phím tới được", () => {
    const { container } = renderTable({ rowHref });

    const link = screen.getByRole("link", { name: "Nguyễn Văn An" });
    expect(link).toHaveAttribute("href", "/students/a");
    expect(link.className).toMatch(/after:absolute after:inset-0/);
    expect(container.querySelector("tbody tr")?.className).toMatch(/relative/);
  });

  it("focus của link hàng phải THẤY được (09 §10 điều 6)", () => {
    renderTable({ rowHref });
    expect(screen.getByRole("link", { name: "Nguyễn Văn An" }).className).toMatch(
      /focus-visible:ring-2/,
    );
  });

  it("ô sau ô đầu được nâng lên trên tấm phủ, để nút trong hàng vẫn bấm được", () => {
    const { container } = renderTable({ rowHref });

    expect(container.querySelector('tbody td[data-column="class"]')?.className).toMatch(
      /relative/,
    );
  });

  it("hàng không có href (Thủ quỹ chỉ đọc) thì không sinh link nào", () => {
    renderTable({ rowHref: () => null });
    expect(screen.queryByRole("link")).toBeNull();
  });
});

/* ========================================================================== */

describe("DataTable v2 — móc nối cho menu ẩn/hiện cột", () => {
  it("mọi ô của một cột mang data-column, và khung mang data-table-id", () => {
    const { container } = renderTable({ tableId: "students" });

    expect(container.firstElementChild).toHaveAttribute("data-table-id", "students");
    expect(container.querySelectorAll('[data-column="class"]')).toHaveLength(
      ROWS.length + 1, // 2 ô dữ liệu + 1 ô tiêu đề
    );
  });

  it("nhãn chữ của cột lấy `label` trước, `header` khi header vốn là chuỗi", () => {
    expect(dataTableColumnLabel({ key: "a", header: "Họ tên", cell: () => null })).toBe("Họ tên");
    expect(
      dataTableColumnLabel({ key: "b", header: <span>Ngày</span>, cell: () => null, label: "Ngày sinh" }),
    ).toBe("Ngày sinh");
    expect(dataTableColumnLabel({ key: "c", header: <span>?</span>, cell: () => null })).toBeNull();
  });

  it("chân bảng (phân trang) nằm ngoài vùng cuộn của bảng", () => {
    renderTable({ footer: <p>Đang xem 1–2 trong 2</p> });
    expect(screen.getByText("Đang xem 1–2 trong 2")).toBeInTheDocument();
  });
});

/* ========================================================================== */

describe("DataTableColumnToggle (14 §C: cột ẩn nhớ lại sau reload)", () => {
  const OPTIONS = [
    { key: "class", label: "Lớp" },
    { key: "absences", label: "Buổi vắng" },
  ];

  const renderToggle = () =>
    render(<DataTableColumnToggle tableId="students" columns={OPTIONS} />);

  /**
   * jsdom không cài hành vi kích hoạt của `<summary>` (xem `ui-interactive.test`
   * §Dropdown): bấm vào nó không đổi `open` và không phát `toggle`. Mở tay đúng
   * hai việc trình duyệt làm.
   */
  const openMenu = (container: HTMLElement) => {
    const details = container.querySelector("details") as HTMLDetailsElement;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    return container.querySelector("summary") as HTMLElement;
  };

  afterEach(() => {
    window.localStorage.clear();
  });

  it("chưa ẩn cột nào thì không bơm quy tắc CSS nào", () => {
    const { container } = renderToggle();
    expect(container.querySelector("style")).toBeNull();
  });

  it("mỗi cột là một mục menu bấm được bằng bàn phím, có trạng thái tick", () => {
    const { container } = renderToggle();
    openMenu(container);

    const items = screen.getAllByRole("menuitemcheckbox");
    expect(items).toHaveLength(2);
    // `data-dropdown-item` là thứ Dropdown dùng để đi bằng phím mũi tên.
    expect(items[0]).toHaveAttribute("data-dropdown-item", "true");
    expect(items[0]).toBeChecked();
  });

  it("ẩn một cột thì bơm đúng quy tắc trỏ vào bảng ấy, và ghi vào localStorage", async () => {
    const user = userEvent.setup();
    const { container } = renderToggle();
    openMenu(container);

    await user.click(screen.getByRole("menuitemcheckbox", { name: "Lớp" }));

    expect(container.querySelector("style")?.textContent).toBe(
      '[data-table-id="students"] [data-column="class"]{display:none}',
    );
    expect(window.localStorage.getItem(columnToggleStorageKey("students"))).toBe('["class"]');
  });

  it("tải lại trang thì cột ẩn vẫn ẩn — đây là điều 14 §C đòi", () => {
    window.localStorage.setItem(columnToggleStorageKey("students"), '["absences"]');

    const { container } = renderToggle();
    openMenu(container);

    expect(container.querySelector("style")?.textContent).toContain('[data-column="absences"]');
    expect(screen.getByRole("menuitemcheckbox", { name: "Buổi vắng" })).not.toBeChecked();
    expect(screen.getByRole("menuitemcheckbox", { name: "Lớp" })).toBeChecked();
  });

  it("số cột đang ẩn nói thành CHỮ, không chỉ là con số cạnh nhãn", () => {
    window.localStorage.setItem(columnToggleStorageKey("students"), '["absences"]');
    const { container } = renderToggle();

    expect(container.querySelector("summary")).toHaveTextContent("Đang ẩn 1 cột");
  });

  it("không cho ẩn HẾT cột — bảng rỗng không có đường quay lại", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(columnToggleStorageKey("students"), '["absences"]');
    const { container } = renderToggle();
    openMenu(container);

    await user.click(screen.getByRole("menuitemcheckbox", { name: "Lớp" }));

    expect(container.querySelector("style")?.textContent).toBe(
      '[data-table-id="students"] [data-column="absences"]{display:none}',
    );
    expect(window.localStorage.getItem(columnToggleStorageKey("students"))).toBe('["absences"]');
  });

  it("khoá lạ trong localStorage (cột đã đổi tên) bị bỏ qua, không sinh quy tắc chết", () => {
    window.localStorage.setItem(columnToggleStorageKey("students"), '["khong-con-cot-nay"]');
    const { container } = renderToggle();

    expect(container.querySelector("style")).toBeNull();
  });

  it("localStorage hỏng/bị chặn thì bảng vẫn hiện đủ cột, không ném lỗi", () => {
    window.localStorage.setItem(columnToggleStorageKey("students"), "{khong-phai-json");
    const { container } = renderToggle();
    openMenu(container);

    expect(container.querySelector("style")).toBeNull();
    expect(screen.getByRole("menuitemcheckbox", { name: "Lớp" })).toBeChecked();
  });
});

/* ========================================================================== */

/**
 * 🔴 v2 mở thêm MỘT đường để ranh giới client lẻn vào: `data-table.tsx` giờ
 * nhập `Checkbox` cho cột chọn. `panel.test.tsx` đã canh chính tệp bảng không
 * mang `"use client"`; bài dưới canh nốt **thứ nó nhập vào**. Thêm `"use
 * client"` vào `checkbox.tsx` là làm chết mọi trang server đang dùng bảng, và
 * lint · typecheck · test · build đều sẽ xanh khi điều đó xảy ra.
 */
describe("🔴 DataTable v2 phải sống được ở cả hai phía ranh giới RSC", () => {
  const hasUseClientDirective = (source: string) =>
    /^﻿?\s*(["'])use client\1\s*;?/.test(source);

  it("bản thân bảng và mọi module `ui/` nó nhập đều không có chỉ thị use client", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/components/ui/data-table.tsx", "utf8");

    expect(hasUseClientDirective(source)).toBe(false);

    const localImports = [...source.matchAll(/from "\.\/([a-z-]+)"/g)].map(
      (match) => match[1],
    );
    // Nhận diện phải bắt được cái gì đó, nếu không bài này xanh giả.
    expect(localImports).toContain("checkbox");
    for (const name of localImports) {
      const imported = readFileSync(`src/components/ui/${name}.tsx`, "utf8");
      expect(hasUseClientDirective(imported), `${name}.tsx đã thành client`).toBe(false);
    }
  });

  it("menu ẩn/hiện cột thì NGƯỢC LẠI — nó bắt buộc là client", async () => {
    const { readFileSync } = await import("node:fs");
    expect(
      hasUseClientDirective(
        readFileSync("src/components/ui/data-table-column-toggle.tsx", "utf8"),
      ),
    ).toBe(true);
  });
});
