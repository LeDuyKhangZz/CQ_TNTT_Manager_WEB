import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * REDESIGN 2C — R2.4 `Drawer` / `SideSheet` (`11_DESIGN_SYSTEM` N6,
 * `07_DESKTOP_UX` §6, `08_MOBILE_UX` §4, D-R7).
 *
 * Bộ kiểm này canh sáu điều, mỗi điều là một cách drawer có thể hỏng mà lint,
 * typecheck và build đều xanh:
 *
 *   1. **Ranh giới RSC** — `drawer.tsx` mà mọc `"use client"` là panel không
 *      còn do máy chủ dựng nữa, tức mất luôn lý do nó tồn tại (mục 1 của tệp).
 *   2. **Chạy được khi JS chưa tải** — mở, đóng, lớp phủ đều phải là `<a href>`
 *      thật. Một `<div onClick>` trông y hệt trong ảnh chụp màn hình.
 *   3. **Năm yêu cầu a11y của lớp nổi** (`05` §3.2) — và phải là **dùng lại**
 *      `useModalBehavior`, không phải cài lại một bản thứ ba.
 *   4. **Ba đường đóng cùng một luật `replace`** — nếu lệch, Back sau `Escape`
 *      mở drawer trở lại.
 *   5. **Không có slot `footer`** — nút submit do khung dựng sẽ nằm ngoài
 *      `<form>` của consumer và thành nút chết (bài học R2.2, lật ngược).
 *   6. **`drawerHref` không đánh rơi tham số**, kể cả tham số **lặp** của
 *      `FacetFilter`.
 *
 * Chỗ duy nhất bám chuỗi class là chỗ mà class CHÍNH LÀ hành vi (bề rộng theo
 * breakpoint, tầng `z`, vùng cuộn) — jsdom không tính bố cục nên không còn cách
 * nào khác đo được.
 */

const routerReplace = vi.fn();
const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, push: routerPush, refresh: vi.fn() }),
}));

/**
 * `next/link` được thay bằng một `<a>` **có phơi `replace` ra thuộc tính** —
 * đó là cách duy nhất chứng minh được điều 4: cả ba đường đóng đều `replace`.
 * Thẻ thật của Next dựng ra `<a>` không mang dấu vết nào của `replace`.
 */
vi.mock("next/link", () => ({
  default: ({
    href,
    replace,
    children,
    ...props
  }: {
    href: string;
    replace?: boolean;
    children?: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} data-replace={replace ? "true" : "false"} {...props}>
      {children}
    </a>
  ),
}));

const { Drawer, drawerHref, DRAWER_PANEL_ID } = await import("@/components/ui/drawer");

const CLOSE_HREF = "/students?q=an";

function readSource(path: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("node:fs").readFileSync(path, "utf8") as string;
}

function panel(): HTMLElement {
  return screen.getByRole("dialog");
}

function overlay(): HTMLElement {
  const element = document.querySelector(".drawer-overlay-enter");
  if (!element) throw new Error("Không tìm thấy lớp phủ");
  return element as HTMLElement;
}

function renderDrawer(props: Partial<React.ComponentProps<typeof Drawer>> = {}) {
  return render(
    <Drawer open title="Thêm thiếu nhi" closeHref={CLOSE_HREF} {...props}>
      <form action="/students/new" method="post">
        <label htmlFor="ho-ten">Họ tên</label>
        <input id="ho-ten" name="hoTen" />
        <button type="submit">Lưu</button>
      </form>
    </Drawer>,
  );
}

beforeEach(() => {
  routerReplace.mockClear();
  routerPush.mockClear();
});

afterEach(() => {
  document.body.style.overflow = "";
});

/* ========================================================================== */

describe("R2.4 · ranh giới RSC", () => {
  /** Chỉ thị chỉ có tác dụng khi là câu lệnh ĐẦU TIÊN của tệp (bài học `panel.test.tsx`). */
  function hasUseClientDirective(source: string): boolean {
    return /^﻿?\s*(["'])use client\1\s*;?/.test(source);
  }

  it("`drawer.tsx` KHÔNG có chỉ thị `use client` — panel do máy chủ dựng", () => {
    expect(hasUseClientDirective(readSource("src/components/ui/drawer.tsx"))).toBe(false);
  });

  it("`drawer-behavior.tsx` THÌ CÓ — đó là lý do nó là tệp riêng", () => {
    expect(hasUseClientDirective(readSource("src/components/ui/drawer-behavior.tsx"))).toBe(true);
  });

  it("phần hành vi DÙNG LẠI `useModalBehavior`, không cài lại bẫy focus", () => {
    const source = readSource("src/components/ui/drawer-behavior.tsx");
    expect(source).toContain("useModalBehavior");
    // Cài lại nghĩa là tự nghe phím / tự khoá cuộn — bản thứ ba của cùng một
    // luật là bản sẽ tiến hoá lệch khỏi `Dialog` và `NavDrawer`.
    expect(source).not.toContain("addEventListener");
    expect(source).not.toContain("document.body.style");
  });

  it("không tệp nào của R2.4 dùng `window.confirm`/`alert` (điều cấm thứ 8)", () => {
    for (const file of ["src/components/ui/drawer.tsx", "src/components/ui/drawer-behavior.tsx"]) {
      const source = readSource(file);
      expect(source).not.toMatch(/window\.(confirm|alert|prompt)\s*\(/);
    }
  });
});

describe("R2.4 · đóng/mở", () => {
  it("`open=false` thì không dựng gì cả", () => {
    render(
      <Drawer open={false} title="Thêm thiếu nhi" closeHref={CLOSE_HREF}>
        <p>Nội dung</p>
      </Drawer>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    // Và không khoá cuộn trang khi đang đóng.
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("`open` thì dựng panel `role=dialog` + `aria-modal`", () => {
    renderDrawer();
    expect(panel()).toHaveAttribute("aria-modal", "true");
  });
});

describe("R2.4 · a11y của panel", () => {
  it("tên truy cập lấy từ `aria-labelledby` trỏ đúng tiêu đề", () => {
    renderDrawer();
    expect(panel()).toHaveAccessibleName("Thêm thiếu nhi");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Thêm thiếu nhi");
  });

  it("`aria-describedby` CHỈ có khi thật sự có mô tả", () => {
    const { unmount } = renderDrawer();
    expect(panel()).not.toHaveAttribute("aria-describedby");
    unmount();

    renderDrawer({ description: "Điền hồ sơ giám hộ trước." });
    expect(panel()).toHaveAccessibleDescription("Điền hồ sơ giám hộ trước.");
  });

  it("panel nhận được focus bằng mã (`tabIndex=-1`) nhưng không phải một chặng Tab", () => {
    renderDrawer();
    expect(panel()).toHaveAttribute("tabindex", "-1");
  });

  it("`id` mặc định là hằng dùng chung với phần hành vi", () => {
    renderDrawer();
    expect(panel()).toHaveAttribute("id", DRAWER_PANEL_ID);
    expect(DRAWER_PANEL_ID).toBe("drawer-panel");
  });

  it("đổi `id` thì tiêu đề và mô tả đổi theo — không có id nào chết", () => {
    renderDrawer({ id: "drawer-ghi-danh", description: "Chọn lớp." });
    const element = panel();
    expect(element).toHaveAttribute("id", "drawer-ghi-danh");
    expect(element.getAttribute("aria-labelledby")).toBe("drawer-ghi-danh-title");
    expect(element.getAttribute("aria-describedby")).toBe("drawer-ghi-danh-description");
    expect(document.getElementById("drawer-ghi-danh-title")).not.toBeNull();
    expect(document.getElementById("drawer-ghi-danh-description")).not.toBeNull();
  });
});

describe("R2.4 · ba đường đóng đều chạy khi JS chưa tải", () => {
  it("nút ✕ là LINK thật trỏ `closeHref`, không phải `<button onClick>`", () => {
    renderDrawer();
    const close = screen.getByRole("link", { name: "Đóng" });
    expect(close.tagName).toBe("A");
    expect(close).toHaveAttribute("href", CLOSE_HREF);
  });

  it("nhãn nút đóng đổi được (drawer sửa hồ sơ nói 'Đóng bảng sửa')", () => {
    renderDrawer({ closeLabel: "Đóng bảng sửa" });
    expect(screen.getByRole("link", { name: "Đóng bảng sửa" })).toHaveAttribute("href", CLOSE_HREF);
  });

  it("vùng chạm nút đóng ≥44px (09 §10 điều 7)", () => {
    renderDrawer();
    expect(screen.getByRole("link", { name: "Đóng" }).className).toContain("min-h-11");
  });

  it("lớp phủ là `<a href>` — bấm ra ngoài đóng được cả khi chưa có JS", () => {
    renderDrawer();
    expect(overlay().tagName).toBe("A");
    expect(overlay()).toHaveAttribute("href", CLOSE_HREF);
  });

  it("🔴 lớp phủ `aria-hidden` + ngoài luồng Tab — trình đọc màn hình không gặp 'nút khổng lồ'", () => {
    renderDrawer();
    expect(overlay()).toHaveAttribute("aria-hidden", "true");
    expect(overlay()).toHaveAttribute("tabindex", "-1");
    // Cả màn hình chỉ có MỘT link đóng trong cây a11y: nút ✕.
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("🔴 cả hai link đóng đều `replace` — nếu `push`, Back sau khi đóng lại mở ra", () => {
    renderDrawer();
    expect(screen.getByRole("link", { name: "Đóng" })).toHaveAttribute("data-replace", "true");
    expect(overlay()).toHaveAttribute("data-replace", "true");
  });

  it("`Escape` đóng bằng ĐÚNG `replace` đó, không phải `push`", () => {
    renderDrawer();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(routerReplace).toHaveBeenCalledWith(CLOSE_HREF);
    expect(routerPush).not.toHaveBeenCalled();
  });
});

describe("R2.4 · năm yêu cầu của lớp nổi (05 §3.2)", () => {
  function Harness({ open }: { open: boolean }) {
    return (
      <>
        <button type="button">Thêm thiếu nhi</button>
        <Drawer open={open} title="Thêm thiếu nhi" closeHref={CLOSE_HREF}>
          <form>
            <label htmlFor="ten">Tên</label>
            <input id="ten" />
            <button type="submit">Lưu</button>
          </form>
        </Drawer>
      </>
    );
  }

  it("mở thì focus vào panel; đóng thì TRẢ focus về nút vừa bấm", () => {
    const { rerender } = render(<Harness open={false} />);
    const trigger = screen.getByRole("button", { name: "Thêm thiếu nhi" });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    rerender(<Harness open />);
    expect(document.activeElement).toBe(panel());

    rerender(<Harness open={false} />);
    expect(document.activeElement).toBe(trigger);
  });

  it("khoá cuộn body khi mở, trả lại đúng giá trị cũ khi đóng", () => {
    document.body.style.overflow = "auto";
    const { unmount } = renderDrawer();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("`Tab` ở phần tử cuối vòng về phần tử đầu — không thoát ra sau lưng drawer", () => {
    renderDrawer();
    const save = screen.getByRole("button", { name: "Lưu" });
    save.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Đóng" }));
  });

  it("`Shift+Tab` ở phần tử đầu vòng ngược về phần tử cuối", () => {
    renderDrawer();
    screen.getByRole("link", { name: "Đóng" }).focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Lưu" }));
  });

  it("🔴 lớp phủ nằm NGOÀI panel nên bẫy focus không bao giờ nhảy vào nó", () => {
    renderDrawer();
    expect(panel().contains(overlay())).toBe(false);
  });

  it("phần hành vi không dựng thêm phần tử bấm được nào vào panel", () => {
    renderDrawer();
    // Trong panel chỉ có: nút ✕, ô nhập, nút Lưu. Thêm một chặng Tab vô hình
    // là thứ chỉ người dùng bàn phím phát hiện ra, và họ sẽ không báo lại.
    expect(panel().querySelectorAll("a[href], button, input")).toHaveLength(3);
  });
});

describe("R2.4 · hình dạng", () => {
  it("mobile là sheet full-screen, tablet 400px, desktop 520px (07 §6, 08 §4/§7)", () => {
    renderDrawer();
    const className = panel().className;
    expect(className).toContain("w-full");
    expect(className).toContain("md:w-[400px]");
    expect(className).toContain("lg:w-[520px]");
    expect(className).toContain("h-full");
  });

  it("🔴 tầng `z-drawer` (50) — để `ConfirmDialog` (`z-dialog` 60) mở ĐÈ LÊN được", () => {
    renderDrawer();
    const container = panel().parentElement;
    expect(container?.className).toContain("z-drawer");
    expect(container?.className).toContain("fixed inset-0");
  });

  it("vùng cuộn là phần thân, KHÔNG phải cả panel — header đứng yên không cần `sticky`", () => {
    renderDrawer();
    const scroller = panel().querySelector(".overflow-y-auto");
    expect(scroller).not.toBeNull();
    expect(scroller).toContainElement(screen.getByLabelText("Họ tên"));
    // Chính panel không được cuộn: `sticky` trong một vùng cuộn là đúng cái bẫy
    // R2.2 vừa gỡ ở vỏ ứng dụng.
    expect(panel().className).not.toContain("overflow-y-auto");
    // Header nằm ngoài vùng cuộn.
    expect(scroller?.contains(screen.getByRole("heading", { level: 2 }))).toBe(false);
  });

  it("có hoạt ảnh VÀO cho panel và lớp phủ (10 §3)", () => {
    renderDrawer();
    expect(panel().className).toContain("drawer-enter");
    expect(overlay().className).toContain("drawer-overlay-enter");
  });

  it("hai hoạt ảnh ấy có thật trong `globals.css`, kèm nhánh đổi hướng từ `md`", () => {
    const css = readSource("src/app/globals.css");
    expect(css).toContain(".drawer-enter");
    expect(css).toContain("@keyframes drawer-enter-sheet");
    expect(css).toContain("@keyframes drawer-enter-side");
    expect(css).toContain("@keyframes drawer-enter-overlay");
    // Dâng từ đáy ở mobile, trượt từ phải từ `md` trở lên.
    expect(css).toMatch(/@media \(min-width: 768px\) \{\s*\.drawer-enter \{\s*animation-name: drawer-enter-side/);
    // Thời lượng đi qua token nên `prefers-reduced-motion` (đã đặt 0ms) tự áp.
    expect(css).toContain("animation: drawer-enter-sheet var(--duration-slow)");
  });

  it("`panelClassName` nới được bề rộng cho wizard mà không mất lớp nền", () => {
    renderDrawer({ panelClassName: "lg:w-[560px]" });
    expect(panel().className).toContain("lg:w-[560px]");
    expect(panel().className).not.toContain("lg:w-[520px]");
  });
});

describe("R2.4 · không có slot `footer` (bài học R2.2 lật ngược)", () => {
  it("🔴 nút submit của consumer nằm TRONG `<form>` của chính họ", () => {
    const { container } = renderDrawer();
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    // Nếu khung dựng hàng nút giúp, nút ấy sẽ nằm ngoài form và bấm không có
    // gì xảy ra — không lỗi, không log, không cách nào lần ra.
    expect(form).toContainElement(screen.getByRole("button", { name: "Lưu" }));
  });

  it("khung không nhận prop `footer` — hợp đồng ấy phải đọc được từ mã", () => {
    expect(readSource("src/components/ui/drawer.tsx")).not.toMatch(/^\s*footer[?]?:/m);
  });
});

describe("R2.4 · drawerHref", () => {
  it("thêm tham số mở drawer, giữ nguyên phần còn lại", () => {
    expect(drawerHref("/students", { q: "an", status: "active" }, { new: "1" })).toBe(
      "/students?q=an&status=active&new=1",
    );
  });

  it("🔴 giữ tham số LẶP của FacetFilter — gộp mảng là ăn mất một ngành", () => {
    expect(drawerHref("/students", { sector: ["au", "thieu"] }, { new: "1" })).toBe(
      "/students?sector=au&sector=thieu&new=1",
    );
  });

  it("`null` gỡ tham số — và gỡ MỌI lần xuất hiện của nó", () => {
    expect(drawerHref("/students", { q: "an", step: ["1", "2"], new: "1" }, { new: null, step: null })).toBe(
      "/students?q=an",
    );
  });

  it("đặt lại một tham số đang lặp thì chỉ còn một giá trị", () => {
    expect(drawerHref("/students", { sector: ["au", "thieu"] }, { sector: "nghia" })).toBe(
      "/students?sector=nghia",
    );
  });

  it("bỏ qua tham số `undefined` (hình dạng searchParams của Next 15)", () => {
    expect(drawerHref("/students", { q: undefined, status: "active" }, { new: "1" })).toBe(
      "/students?status=active&new=1",
    );
  });

  it("không còn tham số nào thì KHÔNG để lại dấu `?` cụt", () => {
    expect(drawerHref("/students", { new: "1" }, { new: null })).toBe("/students");
    expect(drawerHref("/students", {}, {})).toBe("/students");
  });

  it("nhận cả `URLSearchParams`, giữ nguyên bản lặp", () => {
    const params = new URLSearchParams();
    params.append("sector", "au");
    params.append("sector", "thieu");
    params.append("q", "an");
    expect(drawerHref("/students", params, { new: "1" })).toBe(
      "/students?sector=au&sector=thieu&q=an&new=1",
    );
  });

  it("không sửa `URLSearchParams` mà trang đưa vào", () => {
    const params = new URLSearchParams("q=an");
    drawerHref("/students", params, { new: "1" });
    expect(params.toString()).toBe("q=an");
  });

  it("mã hoá giá trị có dấu và khoảng trắng", () => {
    expect(drawerHref("/students", { q: "Nguyễn Văn A" }, { new: "1" })).toContain("q=Nguy");
    expect(drawerHref("/students", { q: "a b" }, {})).toBe("/students?q=a+b");
  });

  it("đường đóng là đường mở đảo lại — dựng được cặp href đối xứng", () => {
    const searchParams = { q: "an", sector: ["au", "thieu"] };
    const open = drawerHref("/students", searchParams, { new: "1" });
    const close = drawerHref("/students", searchParams, { new: null });
    expect(open).toBe("/students?q=an&sector=au&sector=thieu&new=1");
    expect(close).toBe("/students?q=an&sector=au&sector=thieu");
    // 🔴 Điều thật sự cần: đóng drawer KHÔNG được làm mất bộ lọc đang áp.
    expect(close).toContain("sector=au");
    expect(close).toContain("sector=thieu");
  });

  it("đổi bước wizard mà giữ nguyên drawer đang mở", () => {
    expect(drawerHref("/students", { new: "1", step: "1", q: "an" }, { step: "2" })).toBe(
      "/students?new=1&step=2&q=an",
    );
  });

  it("giữ nguyên đường dẫn có tham số động", () => {
    expect(drawerHref("/classes/abc-123", { tab: "roster" }, { enroll: "1" })).toBe(
      "/classes/abc-123?tab=roster&enroll=1",
    );
  });
});
