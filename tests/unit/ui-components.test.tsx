import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

/**
 * Mốc 0B mục 0.8 — tám component **không cần JS** trong 13 tên còn lại:
 * `SearchInput` · `Pagination` · `FilterBar` · `DataTable` · `Avatar` ·
 * `Progress` · `SegmentedControl` · `Chart`.
 *
 * Năm component còn lại cần JS nên nằm ở `ui-interactive.test.tsx`.
 *
 * Mỗi khẳng định ở đây canh một điều đã ghi trong tài liệu đã duyệt, không canh
 * chuỗi class cho vui: sàn chữ 12px và vùng chạm 44px (09 §10 điều 6–7), màu
 * không phải tín hiệu duy nhất (điều 5), `<caption>` bắt buộc (05 §5.3), luật
 * biểu đồ B-1/B-2 (09 §7).
 */

import { SearchInput } from "@/components/ui/search-input";
import { Pagination, paginationRange } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Avatar, initialsFromName } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { BarChart, LineChart, ProgressRing } from "@/components/ui/chart";

describe("SearchInput (05 §3.3 #7)", () => {
  it("nhãn gắn thật vào ô nhập, không phải placeholder giả làm nhãn", () => {
    render(<SearchInput label="Tìm theo tên thiếu nhi" placeholder="Nhập tên…" />);

    const input = screen.getByLabelText("Tìm theo tên thiếu nhi");
    expect(input).toHaveAttribute("type", "search");
    // Placeholder biến mất khi người dùng gõ, nên không bao giờ thay được nhãn.
    expect(input).toHaveAttribute("placeholder", "Nhập tên…");
  });

  it("là một trường form GET có tên — gửi được khi JS chưa tải (09 §11)", () => {
    render(<SearchInput label="Tìm" />);
    expect(screen.getByLabelText("Tìm")).toHaveAttribute("name", "q");
  });

  it("dòng gợi ý nối vào ô bằng aria-describedby", () => {
    render(<SearchInput label="Tìm" hint="Chỉ tìm trong lớp bạn phụ trách." />);

    const input = screen.getByLabelText("Tìm");
    const hintId = input.getAttribute("aria-describedby");
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId as string)).toHaveTextContent(
      "Chỉ tìm trong lớp bạn phụ trách.",
    );
  });
});

describe("Pagination (05 §3.3 #8)", () => {
  it("cửa sổ số trang: ít trang thì hiện hết", () => {
    expect(paginationRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("cửa sổ số trang: nhiều trang thì giữ đầu, cuối, hiện tại ± 1", () => {
    expect(paginationRange(10, 45)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 45]);
    expect(paginationRange(1, 45)).toEqual([1, 2, "ellipsis", 45]);
    expect(paginationRange(45, 45)).toEqual([1, "ellipsis", 44, 45]);
  });

  it("trang hiện tại có aria-current và KHÔNG phải link tự trỏ về mình", () => {
    render(
      <Pagination
        page={3}
        pageSize={20}
        totalItems={900}
        buildHref={(page) => `/students?page=${page}`}
        itemLabel="thiếu nhi"
      />,
    );

    const nav = screen.getByRole("navigation", { name: "Phân trang" });
    const current = within(nav).getByText("3");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.tagName).toBe("SPAN");
    expect(within(nav).queryByRole("link", { name: "Trang 3" })).toBeNull();
  });

  it("nói rõ đang xem khoảng nào trong tổng bao nhiêu", () => {
    render(
      <Pagination
        page={3}
        pageSize={20}
        totalItems={900}
        buildHref={(page) => `/students?page=${page}`}
        itemLabel="thiếu nhi"
      />,
    );
    expect(screen.getByText("Đang xem 41–60 trong 900 thiếu nhi.")).toBeInTheDocument();
  });

  it("ở trang đầu thì 'Trước' là ô chết, không phải link bấm được", () => {
    render(
      <Pagination page={1} pageSize={20} totalItems={900} buildHref={(p) => `?page=${p}`} />,
    );

    expect(screen.queryByRole("link", { name: "Trang trước" })).toBeNull();
    expect(screen.getByRole("link", { name: "Trang sau" })).toHaveAttribute(
      "href",
      "?page=2",
    );
  });

  it("mọi ô bấm được đạt vùng chạm 44px (09 §10 điều 7)", () => {
    render(
      <Pagination page={3} pageSize={20} totalItems={900} buildHref={(p) => `?page=${p}`} />,
    );

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(3);
    for (const link of links) {
      expect(link.className).toMatch(/min-h-11/);
      expect(link.className).toMatch(/min-w-11/);
    }
  });

  it("một trang duy nhất thì không dựng dãy số, nhưng vẫn nói tổng số", () => {
    render(<Pagination page={1} pageSize={20} totalItems={7} buildHref={(p) => `?page=${p}`} />);

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Đang xem 1–7 trong 7 mục.")).toBeInTheDocument();
  });
});

describe("FilterBar (05 §3.3 #9)", () => {
  const renderBar = () =>
    render(
      <FilterBar
        legend="Lọc danh sách thiếu nhi"
        resetHref="/students"
        keepParams={{ sort: "name", page: "" }}
      >
        <label htmlFor="sector">Ngành</label>
        <input id="sector" name="sector" />
      </FilterBar>,
    );

  it("là form GET thật — kết quả lọc chép được và bấm Back được", () => {
    const { container } = renderBar();
    const form = container.querySelector("form");
    expect(form).toHaveAttribute("method", "get");
  });

  it("các ô lọc nằm trong nhóm có tên (fieldset + legend, 09 §6)", () => {
    renderBar();
    const group = screen.getByRole("group", { name: /Lọc danh sách thiếu nhi/ });
    expect(within(group).getByLabelText("Ngành")).toBeInTheDocument();
  });

  it("giữ lại tham số ngoài bộ lọc, bỏ qua tham số rỗng", () => {
    const { container } = renderBar();
    const hidden = container.querySelectorAll('input[type="hidden"]');
    expect(hidden).toHaveLength(1);
    expect(hidden[0]).toHaveAttribute("name", "sort");
    expect(hidden[0]).toHaveAttribute("value", "name");
  });

  it("có lối thoát bỏ hết bộ lọc", () => {
    renderBar();
    expect(screen.getByRole("link", { name: "Xoá lọc" })).toHaveAttribute(
      "href",
      "/students",
    );
  });
});

describe("DataTable (05 §3.3 #10 và §5.3)", () => {
  type Row = { id: string; name: string; absences: number };

  const columns: DataTableColumn<Row>[] = [
    { key: "name", header: "Họ tên", cell: (row) => row.name },
    { key: "absences", header: "Buổi vắng", cell: (row) => row.absences, numeric: true },
  ];

  const rows: Row[] = [
    { id: "a", name: "Nguyễn Văn An", absences: 2 },
    { id: "b", name: "Trần Thị Bình", absences: 0 },
  ];

  const renderTable = (extra?: Partial<React.ComponentProps<typeof DataTable<Row>>>) =>
    render(
      <DataTable
        caption="Danh sách thiếu nhi lớp Ấu 1A"
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        {...extra}
      />,
    );

  it("luôn có <caption> — bảng không tên là lỗi của 2 trong 4 bảng hiện có", () => {
    const { container } = renderTable();
    const caption = container.querySelector("caption");
    expect(caption).toHaveTextContent("Danh sách thiếu nhi lớp Ấu 1A");
    // Bảng lấy tên từ caption nên trình đọc màn hình gọi đúng tên bảng.
    expect(screen.getByRole("table", { name: /Danh sách thiếu nhi lớp Ấu 1A/ })).toBeInTheDocument();
  });

  it("caption ẩn vẫn nằm trong DOM cho trình đọc màn hình, không bị bỏ", () => {
    const { container } = renderTable({ hideCaption: true });
    expect(container.querySelector("caption")?.className).toMatch(/sr-only/);
  });

  it("cột đầu dính trái và có nền đặc để chữ cột sau không trượt qua dưới", () => {
    const { container } = renderTable();

    const headCells = container.querySelectorAll("thead th");
    expect(headCells[0].className).toMatch(/sticky/);
    expect(headCells[0].className).toMatch(/bg-surface-muted/);
    expect(headCells[1].className).not.toMatch(/sticky/);

    const firstBodyCell = container.querySelector("tbody td");
    expect(firstBodyCell?.className).toMatch(/sticky/);
    expect(firstBodyCell?.className).toMatch(/bg-surface/);
  });

  it("cột số canh phải và bật tabular-nums", () => {
    const { container } = renderTable();
    const cell = container.querySelectorAll("tbody tr")[0].querySelectorAll("td")[1];
    expect(cell).toHaveAttribute("data-numeric");
    expect(cell.className).toMatch(/text-right/);
  });

  it("có chỉ báo cuộn ngang bằng CHỮ, không chỉ bằng bóng mờ", () => {
    renderTable();
    expect(screen.getByText("Vuốt ngang để xem thêm cột.")).toBeInTheDocument();
  });

  it("bảng rỗng nhường chỗ cho trạng thái rỗng của trang, trải hết bề ngang", () => {
    const { container } = render(
      <DataTable
        caption="Danh sách thiếu nhi lớp Ấu 1A"
        columns={columns}
        rows={[]}
        getRowKey={(row: Row) => row.id}
        empty={<p>Lớp Ấu 1A chưa có thiếu nhi nào ghi danh.</p>}
      />,
    );

    expect(screen.getByText("Lớp Ấu 1A chưa có thiếu nhi nào ghi danh.")).toBeInTheDocument();
    expect(container.querySelector("tbody td")).toHaveAttribute("colspan", "2");
  });

  it("hàng đang chọn dùng nền tint và có aria-selected — hai tín hiệu", () => {
    const { container } = renderTable({ isRowSelected: (row: Row) => row.id === "a" });
    const bodyRows = container.querySelectorAll("tbody tr");
    expect(bodyRows[0]).toHaveAttribute("aria-selected", "true");
    expect(bodyRows[0].className).toMatch(/bg-theme-tint/);
    expect(bodyRows[1]).toHaveAttribute("aria-selected", "false");
  });
});

describe("Avatar (05 §3.3 #17)", () => {
  it("chữ cái đầu lấy họ + tên gọi, viết hoa theo tiếng Việt", () => {
    expect(initialsFromName("Nguyễn Văn An")).toBe("NA");
    expect(initialsFromName("Đặng Thu Hà")).toBe("ĐH");
    expect(initialsFromName("An")).toBe("A");
    expect(initialsFromName("  Trần   Bình  ")).toBe("TB");
  });

  it("tên rỗng ra dấu hỏi, không ra ô trống", () => {
    expect(initialsFromName("")).toBe("?");
    expect(initialsFromName("   ")).toBe("?");
  });

  it("tên viết ở dạng Unicode phân rã không bị rụng dấu", () => {
    // Cùng một cái tên, hai cách mã hoá. Dạng phân rã ("A" + dấu huyền tổ hợp)
    // đi vào hệ thống qua tệp Excel xuất từ máy Mac.
    const composed = "Àn Bình".normalize("NFC");
    const decomposed = "Àn Bình".normalize("NFD");
    expect(decomposed).not.toBe(composed);
    expect(initialsFromName(decomposed)).toBe("ÀB".normalize("NFC"));
    expect(initialsFromName(composed)).toBe("ÀB".normalize("NFC"));
  });

  it("mặc định là trang trí — không đọc lại tên đã hiện bằng chữ bên cạnh", () => {
    const { container } = render(<Avatar name="Nguyễn Văn An" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("đứng một mình thì thành ảnh có nhãn là tên đầy đủ", () => {
    render(<Avatar name="Nguyễn Văn An" decorative={false} />);
    expect(screen.getByRole("img", { name: "Nguyễn Văn An" })).toBeInTheDocument();
  });

  it("nền dùng bậc pastel + chữ --text, KHÔNG dùng chữ trắng (09 §4.3 CẤM)", () => {
    const { container } = render(<Avatar name="Nguyễn Văn An" themeKey="AU_NHI" />);
    const node = container.firstElementChild as HTMLElement;
    expect(node.className).toMatch(/bg-theme-pastel/);
    expect(node.className).toMatch(/text-ink/);
    expect(node.className).not.toMatch(/text-(white|ink-on-dark)/);
  });
});

describe("Progress (05 §3.3 #18)", () => {
  it("con số hiện bằng CHỮ, không chỉ bằng chiều dài vệt màu (09 §10 điều 5)", () => {
    render(<Progress value={142} max={900} label="Đang nhập tệp danh sách" />);
    expect(screen.getByText("142/900")).toBeInTheDocument();
  });

  it("trình đọc màn hình đọc được cùng con số đó", () => {
    render(<Progress value={142} max={900} label="Đang nhập tệp danh sách" />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "142");
    expect(bar).toHaveAttribute("aria-valuemax", "900");
    expect(bar).toHaveAttribute("aria-valuetext", "142/900");
  });

  it("tiến độ không xác định thì BỎ HẲN aria-valuenow, không báo 0%", () => {
    render(<Progress label="Đang xử lý" />);

    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(screen.getByText("Đang xử lý…")).toBeInTheDocument();
  });

  it("giá trị ngoài khoảng bị kẹp lại thay vì vẽ tràn thanh", () => {
    render(<Progress value={1200} max={900} label="Nhập" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "900");
  });

  it("thanh có tên dù nhãn hiện hay ẩn — một đường duy nhất, không chép hai chỗ", () => {
    const { unmount } = render(<Progress value={1} max={2} label="Đang nhập tệp" />);
    expect(screen.getByRole("progressbar", { name: "Đang nhập tệp" })).toBeInTheDocument();
    unmount();

    render(<Progress value={1} max={2} label="Đang nhập tệp" hideLabel />);
    expect(screen.getByRole("progressbar", { name: "Đang nhập tệp" })).toBeInTheDocument();
  });
});

describe("SegmentedControl (05 §3.3 #20, M05 U-10)", () => {
  const options = [
    { value: "present", label: "Có mặt" },
    { value: "absent", label: "Vắng" },
    { value: "excused", label: "Có phép" },
  ];

  it("là nhóm radio native — roster điểm danh gửi được khi JS chưa tải", () => {
    const { container } = render(
      <SegmentedControl
        name="mass_status_1"
        legend="Thánh lễ — Nguyễn Văn An"
        options={options}
        defaultValue="present"
      />,
    );

    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios).toHaveLength(3);
    for (const radio of radios) expect(radio.name).toBe("mass_status_1");
    expect(screen.getByRole("radio", { name: "Có mặt" })).toBeChecked();
  });

  it("nhóm có tên riêng cho từng em, không phải 'Trạng thái' chung chung", () => {
    render(
      <SegmentedControl
        name="mass_status_1"
        legend="Thánh lễ — Nguyễn Văn An"
        options={options}
      />,
    );
    expect(
      screen.getByRole("group", { name: "Thánh lễ — Nguyễn Văn An" }),
    ).toBeInTheDocument();
  });

  it("legend ẩn vẫn ở trong DOM — bảng roster đã có tên em ở cột bên", () => {
    const { container } = render(
      <SegmentedControl name="m1" legend="Thánh lễ — An" options={options} hideLegend />,
    );
    expect(container.querySelector("legend")?.className).toMatch(/sr-only/);
  });

  it("mỗi ô chọn đạt vùng chạm 44px", () => {
    const { container } = render(
      <SegmentedControl name="m1" legend="Thánh lễ" options={options} />,
    );
    for (const label of container.querySelectorAll("label")) {
      expect(label.className).toMatch(/min-h-11/);
      expect(label.className).toMatch(/min-w-11/);
    }
  });

  it("ô đang chọn có dấu ✓ chứ không chỉ đổi màu (09 §10 điều 5)", () => {
    const { container } = render(
      <SegmentedControl name="m1" legend="Thánh lễ" options={options} defaultValue="present" />,
    );
    const firstLabel = container.querySelector("label");
    expect(firstLabel?.querySelector("svg")).not.toBeNull();
    expect(firstLabel?.querySelector("svg")?.getAttribute("class")).toMatch(
      /peer-checked:inline/,
    );
  });

  it("chế độ có kiểm soát báo giá trị mới ra ngoài", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        name="m1"
        legend="Thánh lễ"
        options={options}
        value="present"
        onChange={onChange}
      />,
    );

    screen.getByRole("radio", { name: "Vắng" }).click();
    expect(onChange).toHaveBeenCalledWith("absent");
  });
});

describe("Chart (05 §3.3 #21, 09 §7)", () => {
  const data = [
    { label: "Chiên Con", value: 120 },
    { label: "Ấu Nhi", value: 340 },
    { label: "Thiếu Nhi", value: 265 },
  ];

  it("B-2: nhãn giá trị vẽ THẲNG trên cột, không nằm ở chú giải", () => {
    render(<BarChart title="Sĩ số theo ngành" data={data} valueLabel="Sĩ số" />);

    const svg = screen.getByRole("img", { name: "Biểu đồ cột: Sĩ số theo ngành" });
    for (const point of data) {
      expect(within(svg).getByText(String(point.value))).toBeInTheDocument();
      expect(within(svg).getByText(point.label)).toBeInTheDocument();
    }
  });

  it("B-1: màu chuỗi là --theme-chart, KHÔNG phải bậc pastel", () => {
    const { container } = render(<BarChart title="Sĩ số theo ngành" data={data} />);
    const bars = container.querySelectorAll("rect");
    expect(bars).toHaveLength(3);
    for (const bar of bars) {
      expect(bar.getAttribute("class")).toMatch(/fill-theme-chart/);
      expect(bar.getAttribute("class")).not.toMatch(/pastel/);
    }
  });

  it("kèm bảng số liệu cho người không nhìn được hình", () => {
    render(<BarChart title="Sĩ số theo ngành" data={data} valueLabel="Sĩ số" />);

    const table = screen.getByRole("table", { name: "Sĩ số theo ngành" });
    expect(within(table).getByRole("columnheader", { name: "Sĩ số" })).toBeInTheDocument();
    expect(within(table).getByRole("rowheader", { name: "Ấu Nhi" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "340" })).toBeInTheDocument();
  });

  it("cột cao đúng tỉ lệ với giá trị lớn nhất", () => {
    const { container } = render(
      <BarChart title="Sĩ số" data={[{ label: "A", value: 50 }, { label: "B", value: 100 }]} />,
    );
    const [first, second] = Array.from(container.querySelectorAll("rect"));
    expect(Number(second.getAttribute("height"))).toBeCloseTo(
      Number(first.getAttribute("height")) * 2,
      5,
    );
  });

  it("biểu đồ đường cũng phải có nhãn trực tiếp — B-2 áp cho MỌI biểu đồ", () => {
    render(<LineChart title="Chuyên cần theo tuần" data={data} />);

    const svg = screen.getByRole("img", { name: "Biểu đồ đường: Chuyên cần theo tuần" });
    expect(within(svg).getByText("340")).toBeInTheDocument();
    expect(svg.querySelector("polyline")?.getAttribute("class")).toMatch(
      /stroke-theme-chart/,
    );
  });

  it("vòng tiến độ nói cả phân số lẫn phần trăm cho trình đọc màn hình", () => {
    render(
      <ProgressRing
        title="Lớp đã chốt bảng điểm"
        value={18}
        max={19}
        description="18/19 lớp đã chốt"
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Lớp đã chốt bảng điểm: 18 trên 19, 95 phần trăm",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
  });

  it("dữ liệu rỗng không làm vỡ hệ toạ độ (chia cho 0)", () => {
    const { container } = render(<BarChart title="Sĩ số" data={[]} />);
    const viewBox = container.querySelector("svg")?.getAttribute("viewBox");
    expect(viewBox).toBe("0 0 72 164");
  });
});
