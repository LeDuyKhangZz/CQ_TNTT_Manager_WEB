import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * REDESIGN 2C — R2.2 `Toolbar` + `FacetFilter` (`11_DESIGN_SYSTEM` N2+N3,
 * `07_DESKTOP_UX` §2, bộ 15 mục của `14_ACCEPTANCE_CRITERIA` §A).
 *
 * Bốn điều bài kiểm này canh, mỗi điều đều là một thứ **đã hỏng ở đâu đó trong
 * dự án này** chứ không phải canh cho đủ số:
 *
 *   1. **Chạy không cần JS** — toolbar là `<form method="get">`, ô tick là ô
 *      tick thật, "Áp dụng" là `type="submit"` nằm trong đúng form ấy.
 *   2. **Ranh giới lọc vs hiển thị** — menu "Cột" phải nằm NGOÀI form.
 *   3. **Đóng bảng tick = huỷ**, không phải "âm thầm gửi form".
 *   4. **`sticky` có sống được không** — vỏ ứng dụng không được là vùng cuộn,
 *      và hằng `md:top-[68px]` phải khớp chiều cao thật của header.
 *
 * 🔴 jsdom **không cài hành vi kích hoạt** của `<summary>`: bấm vào nó không đổi
 * `details.open`, không phát `toggle`. Nên mở/đóng ở đây làm bằng tay đúng hai
 * bước như `ui-interactive.test.tsx` đã làm cho `Dropdown`.
 */

vi.mock("next/navigation", () => ({ usePathname: () => "/students" }));
vi.mock("@/features/auth/server/actions", () => ({ signOutAction: vi.fn() }));
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img alt={alt} {...props} />
  ),
}));

const { Toolbar, ToolbarSummary, TOOLBAR_STICKY_TOP_CLASSNAME } = await import(
  "@/components/ui/toolbar"
);
const { FacetFilter } = await import("@/components/ui/facet-filter");
const { AppShell } = await import("@/components/layout/app-shell");
const { NotificationButton } = await import("@/components/layout/notification-button");

const SECTORS = [
  { value: "au", label: "Ấu Nhi", count: 312 },
  { value: "thieu", label: "Thiếu Nhi", count: 289 },
  { value: "nghia", label: "Nghĩa Sĩ", count: 146 },
];

function renderToolbar(props: Partial<React.ComponentProps<typeof Toolbar>> = {}) {
  return render(
    <Toolbar
      label="Lọc danh sách thiếu nhi"
      action="/students"
      search={{ label: "Tìm theo tên thiếu nhi", placeholder: "Ví dụ: tran ngoc" }}
      {...props}
    />,
  );
}

/** Mở `<details>` đúng cách jsdom hiểu: đổi `open` rồi tự phát `toggle`. */
function openFacet(container: HTMLElement): {
  details: HTMLDetailsElement;
  summary: HTMLElement;
} {
  const details = container.querySelector("details") as HTMLDetailsElement;
  const summary = details.querySelector("summary") as HTMLElement;
  summary.focus();
  details.open = true;
  fireEvent(details, new Event("toggle"));
  return { details, summary };
}

/* ========================================================================== */
/* Toolbar — khung của trang danh sách (`07` §2)                              */
/* ========================================================================== */

describe("Toolbar · form GET thật (09 §11 — chạy không cần JS)", () => {
  it("là `<form method=get>` gửi về đúng trang, ô tìm kiếm có `name`", () => {
    const { container } = renderToolbar();
    const form = container.querySelector("form") as HTMLFormElement;

    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/students");

    const search = screen.getByLabelText("Tìm theo tên thiếu nhi");
    expect(search).toHaveAttribute("name", "q");
    expect(search).toHaveAttribute("type", "search");
    expect(search).toHaveAttribute("placeholder", "Ví dụ: tran ngoc");
    expect(form.contains(search)).toBe(true);
  });

  it("nút gửi là `type=submit` — không JS vẫn lọc được", () => {
    renderToolbar();
    const submit = screen.getByRole("button", { name: "Lọc" });
    expect(submit).toHaveAttribute("type", "submit");
  });

  it("nhãn ô tìm kiếm là `<label for>` thật, chỉ ẩn khỏi màn hình", () => {
    const { container } = renderToolbar();
    const label = container.querySelector("label") as HTMLLabelElement;
    expect(label).toHaveClass("sr-only");
    expect(label.getAttribute("for")).toBe("toolbar-search-q");
  });

  it("🔴 `id` ô tìm kiếm TẤT ĐỊNH theo `name`, không sinh ngẫu nhiên", () => {
    // `React.useId()` là hook — Server Component không gọi được, và id ngẫu
    // nhiên còn làm lệch giữa lượt dựng ở máy chủ và lượt ở trình duyệt.
    const first = renderToolbar().container.querySelector("input[type=search]");
    const second = renderToolbar({ search: { label: "Tìm theo tên thiếu nhi" } })
      .container.querySelector("input[type=search]");
    expect(first?.id).toBe("toolbar-search-q");
    expect(second?.id).toBe(first?.id);
  });

  it("`name` khác thì `id` đi theo — hai toolbar cùng trang không đụng nhau", () => {
    const { container } = renderToolbar({
      search: { label: "Tìm nhân sự", name: "staff-q" },
    });
    expect(container.querySelector("input[type=search]")?.id).toBe("toolbar-search-staff-q");
  });

  it("nhóm ô lọc nằm trong `<fieldset>` + `<legend>` (09 §6)", () => {
    const { container } = renderToolbar();
    const fieldset = container.querySelector("fieldset") as HTMLFieldSetElement;
    const legend = fieldset.querySelector("legend") as HTMLLegendElement;
    expect(legend).toHaveTextContent("Lọc danh sách thiếu nhi");
    expect(legend).toHaveClass("sr-only");
  });

  it("không truyền `search` thì không có ô tìm kiếm nào", () => {
    const { container } = renderToolbar({ search: undefined });
    expect(container.querySelector("input[type=search]")).toBeNull();
  });
});

describe("Toolbar · `keepParams` (form GET xoá sạch query cũ)", () => {
  it("giữ tham số ngoài bộ lọc bằng ô ẩn", () => {
    const { container } = renderToolbar({
      keepParams: { sort: "name", dir: "asc" },
    });
    const hidden = Array.from(
      container.querySelectorAll<HTMLInputElement>("input[type=hidden]"),
    );
    expect(hidden.map((input) => [input.name, input.value])).toEqual([
      ["sort", "name"],
      ["dir", "asc"],
    ]);
  });

  it("bỏ qua giá trị rỗng/không có — không gửi `?dir=` trống", () => {
    const { container } = renderToolbar({
      keepParams: { sort: "name", dir: "", size: undefined },
    });
    const hidden = Array.from(
      container.querySelectorAll<HTMLInputElement>("input[type=hidden]"),
    );
    expect(hidden).toHaveLength(1);
    expect(hidden[0]?.name).toBe("sort");
  });
});

describe("Toolbar · ranh giới LỌC vs HIỂN THỊ", () => {
  it("🔴 `trailing` (menu Cột) nằm NGOÀI `<form>`", () => {
    const { container } = renderToolbar({
      trailing: <button type="button">Cột</button>,
    });
    const form = container.querySelector("form") as HTMLFormElement;
    const columnButton = screen.getByRole("button", { name: "Cột" });

    expect(form.contains(columnButton)).toBe(false);
    // Vẫn nằm trong chính thanh công cụ, chỉ khác nhánh.
    const toolbar = container.querySelector("[data-toolbar]") as HTMLElement;
    expect(toolbar.contains(columnButton)).toBe(true);
  });
});

describe("Toolbar · dính dưới header (`07` §2)", () => {
  it("mặc định dính TỪ `md` trở lên, nền đặc, đúng khoảng 68px", () => {
    const { container } = renderToolbar();
    const toolbar = container.querySelector("[data-toolbar]") as HTMLElement;
    expect(toolbar).toHaveClass("md:sticky", "md:z-sticky", "md:bg-page");
    expect(toolbar.className).toContain(TOOLBAR_STICKY_TOP_CLASSNAME);
  });

  it("🔴 KHÔNG dính ở màn hẹp — `08` §4 đưa bộ lọc vào sheet", () => {
    const { container } = renderToolbar();
    const toolbar = container.querySelector("[data-toolbar]") as HTMLElement;
    // Không có lớp `sticky` trần: nếu có, thanh 48px ăn mất chiều cao của 360×800.
    expect(toolbar.className.split(/\s+/)).not.toContain("sticky");
    expect(toolbar.className.split(/\s+/)).not.toContain("top-[68px]");
  });

  it("tắt được bằng `sticky={false}`", () => {
    const { container } = renderToolbar({ sticky: false });
    const toolbar = container.querySelector("[data-toolbar]") as HTMLElement;
    expect(toolbar.className).not.toContain("sticky");
  });
});

describe("ToolbarSummary · dòng tóm tắt + Xoá lọc (`07` §2)", () => {
  it("nói con số bằng CHỮ", () => {
    render(<ToolbarSummary>747 hồ sơ · đang lọc &quot;Đang sinh hoạt&quot;</ToolbarSummary>);
    expect(screen.getByText(/747 hồ sơ/)).toBeInTheDocument();
  });

  it("chỉ hiện Xoá lọc khi đang có bộ lọc, và là link thật đủ vùng chạm", () => {
    const { rerender } = render(<ToolbarSummary>12 hồ sơ</ToolbarSummary>);
    expect(screen.queryByRole("link", { name: "Xoá lọc" })).toBeNull();

    rerender(<ToolbarSummary resetHref="/students">12 hồ sơ</ToolbarSummary>);
    const reset = screen.getByRole("link", { name: "Xoá lọc" });
    expect(reset).toHaveAttribute("href", "/students");
    expect(reset).toHaveClass("min-h-11");
  });
});

/* ========================================================================== */
/* FacetFilter — bảng tick mở từ nút (`11` N3)                                */
/* ========================================================================== */

function renderFacet(props: Partial<React.ComponentProps<typeof FacetFilter>> = {}) {
  return render(
    <Toolbar label="Lọc danh sách thiếu nhi" action="/students">
      <FacetFilter name="sector" label="Ngành" options={SECTORS} {...props} />
    </Toolbar>,
  );
}

describe("FacetFilter · dựng trên `<details>` (mở được khi JS chưa tải)", () => {
  it("đóng sẵn, nút mở là `<summary>` mang chữ", () => {
    const { container } = renderFacet();
    const details = container.querySelector("details") as HTMLDetailsElement;
    expect(details).not.toHaveAttribute("open");
    expect(details.querySelector("summary")).toHaveTextContent("Ngành");
  });

  it("🔴 KHÔNG tự đặt `aria-expanded` — trình duyệt suy từ `details.open`", () => {
    const { container } = renderFacet();
    const summary = container.querySelector("summary") as HTMLElement;
    expect(summary).not.toHaveAttribute("aria-expanded");
    openFacet(container);
    expect(summary).not.toHaveAttribute("aria-expanded");
  });

  it("vùng chạm nút mở ≥44px (09 §10 điều 7)", () => {
    const { container } = renderFacet();
    expect(container.querySelector("summary")).toHaveClass("min-h-11");
  });
});

describe("FacetFilter · ô tick THẬT trong form của Toolbar", () => {
  it("mỗi lựa chọn là một checkbox có `name`/`value`, thuộc đúng form", () => {
    const { container } = renderFacet();
    openFacet(container);
    const form = container.querySelector("form") as HTMLFormElement;

    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(3);
    for (const box of boxes) {
      expect(box).toHaveAttribute("name", "sector");
      expect(form.contains(box)).toBe(true);
    }
    expect(boxes.map((box) => (box as HTMLInputElement).value)).toEqual([
      "au",
      "thieu",
      "nghia",
    ]);
  });

  it("`selected` từ máy chủ thành `defaultChecked` — không phải state", () => {
    const { container } = renderFacet({ selected: ["thieu"] });
    openFacet(container);
    expect(screen.getByRole("checkbox", { name: /Thiếu Nhi/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Ấu Nhi/ })).not.toBeChecked();
  });

  it("nút Áp dụng là `type=submit` NẰM TRONG form — đây là đường chạy không-JS", () => {
    const { container } = renderFacet();
    openFacet(container);
    const form = container.querySelector("form") as HTMLFormElement;
    const apply = screen.getByRole("button", { name: "Áp dụng" });

    expect(apply).toHaveAttribute("type", "submit");
    expect(form.contains(apply)).toBe(true);
  });

  it("lựa chọn bị khoá thì ô tick bị khoá", () => {
    const { container } = renderFacet({
      options: [{ value: "au", label: "Ấu Nhi", disabled: true }],
    });
    openFacet(container);
    expect(screen.getByRole("checkbox", { name: /Ấu Nhi/ })).toBeDisabled();
  });

  it("số bản ghi hiện cạnh nhãn để đoán được kết quả trước khi lọc", () => {
    const { container } = renderFacet();
    openFacet(container);
    const row = screen.getByRole("checkbox", { name: /Ấu Nhi/ }).closest("label");
    expect(within(row as HTMLElement).getByText("312")).toBeInTheDocument();
  });

  it("không có lựa chọn nào thì nói ra bằng chữ, không hiện bảng rỗng", () => {
    const { container } = renderFacet({ options: [], emptyLabel: "Bạn chỉ có một lớp." });
    openFacet(container);
    expect(screen.getByText("Bạn chỉ có một lớp.")).toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});

describe("FacetFilter · huy hiệu nói SỐ ĐANG ÁP DỤNG", () => {
  it("chưa lọc thì không có huy hiệu, và viền là ĐỨT", () => {
    const { container } = renderFacet();
    const summary = container.querySelector("summary") as HTMLElement;
    expect(summary).toHaveClass("border-dashed");
    expect(summary).not.toHaveTextContent("Đang lọc");
  });

  it("đang lọc thì có số + chữ cho trình đọc màn hình, viền thành LIỀN", () => {
    const { container } = renderFacet({ selected: ["au", "nghia"] });
    const summary = container.querySelector("summary") as HTMLElement;
    // Hình dạng (đứt/liền) và CHỮ, không phải màu — 09 §10 điều 5.
    expect(summary).toHaveClass("border-solid");
    expect(summary).not.toHaveClass("border-dashed");
    expect(summary).toHaveTextContent("Đang lọc 2 lựa chọn");
  });

  it("giá trị lạ trong URL không được đếm — huy hiệu chỉ đếm lựa chọn có thật", () => {
    const { container } = renderFacet({ selected: ["au", "khong-ton-tai"] });
    const summary = container.querySelector("summary") as HTMLElement;
    expect(summary).toHaveTextContent("Đang lọc 1 lựa chọn");
  });
});

describe("FacetFilter · đóng = HUỶ (không âm thầm gửi form)", () => {
  it("Escape đóng VÀ trả focus về nút mở", () => {
    const { container } = renderFacet();
    const { details, summary } = openFacet(container);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(details).not.toHaveAttribute("open");
    expect(document.activeElement).toBe(summary);
  });

  it("bấm ra ngoài thì đóng", () => {
    const { container } = renderFacet();
    const { details } = openFacet(container);

    fireEvent.mouseDown(document.body);

    expect(details).not.toHaveAttribute("open");
  });

  it("🔴 Escape = huỷ ⇒ hoàn tác ô vừa tick", () => {
    const { container } = renderFacet({ selected: ["thieu"] });
    openFacet(container);

    const au = screen.getByRole("checkbox", { name: /Ấu Nhi/ }) as HTMLInputElement;
    const thieu = screen.getByRole("checkbox", { name: /Thiếu Nhi/ }) as HTMLInputElement;
    fireEvent.click(au);
    fireEvent.click(thieu);
    expect(au.checked).toBe(true);
    expect(thieu.checked).toBe(false);

    fireEvent.keyDown(document, { key: "Escape" });

    // Trở lại đúng thứ máy chủ đang áp dụng, không phải thứ vừa tick.
    expect(au.checked).toBe(false);
    expect(thieu.checked).toBe(true);
  });

  it("🔴 bấm RA NGOÀI thì KHÔNG được xoá thứ vừa tick", () => {
    /*
      Đường đi thật làm hỏng bản trước: tick "Ấu Nhi" rồi bấm thẳng nút "Lọc"
      của toolbar. `mousedown` chạy TRƯỚC `click`, nên nếu đóng-là-hoàn-tác thì
      ô đã bị bỏ tick xong xuôi rồi form mới gửi đi — người dùng bấm Lọc mà
      không có gì xảy ra và không có lỗi nào để lần ra.
    */
    const { container } = renderFacet({ selected: [] });
    const { details } = openFacet(container);
    const au = screen.getByRole("checkbox", { name: /Ấu Nhi/ }) as HTMLInputElement;
    fireEvent.click(au);

    fireEvent.mouseDown(screen.getByRole("button", { name: "Lọc" }));

    expect(details).not.toHaveAttribute("open");
    expect(au.checked).toBe(true);
  });

  it("đóng bằng chính nút mở cũng giữ nguyên ô đã tick", () => {
    const { container } = renderFacet({ selected: [] });
    const { details } = openFacet(container);

    const au = screen.getByRole("checkbox", { name: /Ấu Nhi/ }) as HTMLInputElement;
    fireEvent.click(au);

    // Trình duyệt tự đổi `open` khi bấm `<summary>` rồi mới phát `toggle`.
    details.open = false;
    fireEvent(details, new Event("toggle"));

    expect(au.checked).toBe(true);
  });

  it("ô tick trong bảng ĐÃ ĐÓNG vẫn đi theo form — nút Lọc gom đủ mọi facet", () => {
    // `display:none` không loại một control khỏi `FormData`; đây là lý do bấm
    // "Lọc" ở toolbar vẫn giữ nguyên bộ lọc đang áp dụng của từng facet.
    const { container } = renderFacet({ selected: ["nghia"] });
    const form = container.querySelector("form") as HTMLFormElement;
    const data = new FormData(form);
    expect(data.getAll("sector")).toEqual(["nghia"]);
  });

  it("🔴 đóng KHÔNG gửi form — cú bấm đóng thường cũng là cú bấm vào việc khác", () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => {});
    const { container } = renderFacet();
    const form = container.querySelector("form") as HTMLFormElement;
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    form.addEventListener("submit", onSubmit);

    openFacet(container);
    fireEvent.click(screen.getByRole("checkbox", { name: /Ấu Nhi/ }));
    fireEvent.mouseDown(document.body);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(requestSubmit).not.toHaveBeenCalled();
    requestSubmit.mockRestore();
  });
});

/* ========================================================================== */
/* Điều kiện để `sticky` sống được                                            */
/* ========================================================================== */

describe("🔴 Vỏ ứng dụng không được là vùng cuộn (R2.2)", () => {
  function renderShell() {
    return render(
      <AppShell
        viewer={{
          displayName: "Nguyễn Văn A",
          role: "group_leader",
          audience: "staff",
          scopeKind: "global",
        }}
        notificationBell={<NotificationButton unreadCount={0} />}
        academicYear={{ id: "y-1", code: "2025-2026", name: "Năm học 2025-2026" }}
      >
        <div />
      </AppShell>,
    );
  }

  it("kẹp tràn ngang bằng `clip-x`, KHÔNG bằng `overflow-x-hidden`", () => {
    /*
      CSS Overflow §3.5 — một trục `hidden` thì trục kia `visible` tự tính thành
      `auto`: phần tử thành vùng cuộn, và `position: sticky` bên trong neo vào
      nó chứ không neo vào màn hình. Đo bằng Chromium trên bản sao DOM của vỏ:
      cuộn 1200px thì `AppHeader` đi theo tới `top = -1200` (tức KHÔNG dính);
      đổi sang `overflow-x: clip` thì `top = 0`. Đây là bài canh cửa ấy.
    */
    const { container } = renderShell();
    const shell = container.firstElementChild as HTMLElement;
    expect(shell).toHaveClass("clip-x");
    expect(shell.className).not.toContain("overflow-x-hidden");
    expect(shell.className).not.toContain("overflow-hidden");
  });

  it("header vẫn cao 68px ⇒ hằng `md:top-[68px]` của Toolbar còn đúng", () => {
    const { container } = renderShell();
    const header = container.querySelector("header") as HTMLElement;
    const bar = header.lastElementChild as HTMLElement;

    // 64px thân header…
    expect(header.querySelector(".min-h-16")).not.toBeNull();
    // …+ 4px dải màu ngành = 68.
    expect(bar).toHaveClass("h-1");
    expect(TOOLBAR_STICKY_TOP_CLASSNAME).toBe("md:top-[68px]");
  });

  it("header vẫn dính trên cùng (thứ mà `clip-x` vừa trả lại)", () => {
    const { container } = renderShell();
    const header = container.querySelector("header") as HTMLElement;
    expect(header).toHaveClass("sticky", "top-0", "z-header");
  });
});
