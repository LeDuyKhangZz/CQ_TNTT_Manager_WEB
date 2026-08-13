import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Mốc 0B mục 0.8 — năm component **cần JS**: `Tabs` · `Dropdown` · `Toast` ·
 * `Tooltip` · `FileUpload`.
 *
 * Trọng tâm là hành vi bàn phím và cây a11y, vì đó chính là chỗ bản tự dựng
 * hiện có sai: tab không có `role="tablist"` (05 §3.3 #11), menu tài khoản
 * không đóng bằng `Escape` (05 §3.2), tệp chọn xong không hiện tên (#19).
 */

import { Tabs } from "@/components/ui/tabs";
import { Dropdown, DropdownItem, DropdownLink } from "@/components/ui/dropdown";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { FileUpload } from "@/components/ui/file-upload";

afterEach(() => {
  vi.useRealTimers();
});

/* ========================================================================== */

describe("Tabs (05 §3.3 #11)", () => {
  const items = [
    { id: "info", label: "Thông tin", content: <p>Ngày sinh, giáo xứ</p> },
    { id: "guardians", label: "Người giám hộ", content: <p>Danh sách phụ huynh</p> },
    { id: "attendance", label: "Điểm danh", content: <p>Lịch sử điểm danh</p> },
  ];

  const renderTabs = () => render(<Tabs items={items} label="Hồ sơ thiếu nhi" />);

  it("có tablist mang tên, ba tab, và tab đầu được chọn sẵn", () => {
    renderTabs();

    const tablist = screen.getByRole("tablist", { name: "Hồ sơ thiếu nhi" });
    expect(within(tablist).getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "Thông tin" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("roving tabindex: chỉ tab đang chọn nhận phím Tab", () => {
    renderTabs();

    expect(screen.getByRole("tab", { name: "Thông tin" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Điểm danh" })).toHaveAttribute("tabindex", "-1");
  });

  it("mũi tên đi giữa các tab, Home/End nhảy đầu cuối, và vòng lại", () => {
    renderTabs();
    const tablist = screen.getByRole("tablist");

    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Người giám hộ" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // Focus phải đi theo lựa chọn, nếu không trình đọc màn hình đọc sai tab.
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Người giám hộ" }));

    fireEvent.keyDown(tablist, { key: "End" });
    expect(screen.getByRole("tab", { name: "Điểm danh" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Thông tin" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(tablist, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Điểm danh" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("panel nối đúng vào tab bằng aria-controls/aria-labelledby", () => {
    renderTabs();

    const tab = screen.getByRole("tab", { name: "Thông tin" });
    const panel = screen.getByRole("tabpanel");
    expect(tab.getAttribute("aria-controls")).toBe(panel.getAttribute("id"));
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.getAttribute("id"));
  });

  it("chỉ panel đang chọn nằm trong DOM — panel ẩn chứa ô nhập sẽ bị gửi kèm", () => {
    renderTabs();

    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.getByText("Ngày sinh, giáo xứ")).toBeInTheDocument();
    expect(screen.queryByText("Lịch sử điểm danh")).toBeNull();
  });

  it("bấm chuột đổi tab như phím mũi tên", () => {
    renderTabs();

    fireEvent.click(screen.getByRole("tab", { name: "Điểm danh" }));
    expect(screen.getByText("Lịch sử điểm danh")).toBeInTheDocument();
  });
});

/* ========================================================================== */

describe("Dropdown (05 §3.3 #14, §3.2)", () => {
  const renderMenu = () =>
    render(
      <>
        <button type="button">Nút ngoài menu</button>
        <Dropdown label="Nguyễn Văn A">
          <DropdownLink href="/account">Tài khoản của tôi</DropdownLink>
          <DropdownItem>Đổi mật khẩu</DropdownItem>
          <DropdownItem tone="danger">Đăng xuất</DropdownItem>
        </Dropdown>
      </>,
    );

  /**
   * Lấy nút mở bằng thẻ chứ không bằng `getByRole("button")`. HTML-AAM quy định
   * `<summary>` của `<details>` được phơi ra **là button**, và Chrome/Firefox
   * làm đúng vậy — nhưng `dom-accessibility-api` mà Testing Library dùng chưa
   * cài ánh xạ đó, nên truy vấn theo role sẽ trượt. Đây là khoảng trống của
   * công cụ test, không phải lỗi của component.
   */
  const getSummary = (container: HTMLElement) =>
    container.querySelector("summary") as HTMLElement;

  /**
   * jsdom **không cài hành vi kích hoạt** của `<summary>`: bấm vào nó không đổi
   * `details.open` và không phát sự kiện `toggle`. Nên ở đây phải làm đúng hai
   * việc mà trình duyệt làm khi người dùng bấm — đổi `open` rồi phát `toggle` —
   * chứ không phải `fireEvent.click`, thứ trong jsdom không gây ra gì cả.
   */
  const openMenu = (container: HTMLElement) => {
    const details = container.querySelector("details") as HTMLDetailsElement;
    const summary = getSummary(container);
    summary.focus();
    details.open = true;
    fireEvent(details, new Event("toggle"));
    return summary;
  };

  it("dựng trên <details> — mở/đóng được cả khi JS chưa tải (05 §3.2)", () => {
    const { container } = renderMenu();
    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
  });

  it("nút mở khai báo có menu, nhưng KHÔNG tự đặt aria-expanded", () => {
    const { container } = renderMenu();
    const summary = getSummary(container);
    expect(summary).toHaveTextContent("Nguyễn Văn A");
    expect(summary).toHaveAttribute("aria-haspopup", "menu");

    // Trạng thái mở do trình duyệt suy ra từ `details.open` (HTML-AAM). Tự đặt
    // `aria-expanded` theo state React là gài sẵn một lời nói dối cho trường hợp
    // JS chưa tải: người dùng mở được menu mà thuộc tính vẫn kẹt ở "false".
    expect(summary).not.toHaveAttribute("aria-expanded");

    openMenu(container);
    expect(container.querySelector("details")).toHaveAttribute("open");
    expect(summary).not.toHaveAttribute("aria-expanded");
  });

  it("ba mục đều là menuitem, mục đăng xuất mang màu nguy hiểm", () => {
    const { container } = renderMenu();
    openMenu(container);

    const menu = screen.getByRole("menu");
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
    expect(within(menu).getByRole("menuitem", { name: "Đăng xuất" }).className).toMatch(
      /text-danger/,
    );
  });

  it("Escape đóng menu VÀ trả focus về nút mở", () => {
    const { container } = renderMenu();
    const summary = openMenu(container);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(document.activeElement).toBe(summary);
  });

  it("bấm ra ngoài thì đóng, nhưng KHÔNG kéo focus ngược về nút mở", () => {
    const { container } = renderMenu();
    openMenu(container);

    // Đưa focus vào trong menu trước, để phân biệt được hai nhánh: `Escape`
    // phải trả focus về nút mở, còn bấm ra ngoài thì tuyệt đối không —
    // nếu không, focus sẽ nhảy khỏi chỗ người dùng vừa bấm chuột vào.
    fireEvent.keyDown(document, { key: "ArrowDown" });
    const firstItem = screen.getAllByRole("menuitem")[0];
    expect(document.activeElement).toBe(firstItem);

    fireEvent.mouseDown(screen.getByRole("button", { name: "Nút ngoài menu" }));

    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(document.activeElement).toBe(firstItem);
  });

  it("mũi tên đi giữa các mục và vòng lại; Home/End nhảy đầu cuối", () => {
    const { container } = renderMenu();
    openMenu(container);

    const items = screen.getAllByRole("menuitem");

    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);

    fireEvent.keyDown(document, { key: "ArrowUp" });
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(document, { key: "End" });
    expect(document.activeElement).toBe(items[2]);

    fireEvent.keyDown(document, { key: "Home" });
    expect(document.activeElement).toBe(items[0]);
  });

  it("mục vẫn nhận phím Tab — lệch có chủ ý so với roving tabindex của ARIA", () => {
    const { container } = renderMenu();
    openMenu(container);
    // Roving tabindex cần JS mới đặt được. Khi JS chưa tải mà mục mang
    // tabindex="-1" thì người dùng bàn phím không vào được mục nào.
    for (const item of screen.getAllByRole("menuitem")) {
      expect(item).not.toHaveAttribute("tabindex");
    }
  });
});

/* ========================================================================== */

describe("Toast (05 §3.3 #15, D-61)", () => {
  function Harness({ tone, duration }: { tone?: "success" | "danger"; duration?: number }) {
    const { showToast } = useToast();
    return (
      <button
        type="button"
        onClick={() =>
          showToast({ title: "Đã lưu 42 dòng điểm.", tone, duration })
        }
      >
        Lưu
      </button>
    );
  }

  const renderToast = (props: Parameters<typeof Harness>[0] = {}) =>
    render(
      <ToastProvider>
        <Harness {...props} />
      </ToastProvider>,
    );

  it("hai vùng phát nằm sẵn trong DOM khi chưa có thông báo nào", () => {
    renderToast();
    // Vùng aria-live sinh ra CÙNG LÚC với nội dung thì phần lớn trình đọc màn
    // hình bỏ qua lần đầu — nên vùng phải có trước.
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("thành công đọc lịch sự, lỗi cắt ngang — hai vùng khác nhau", () => {
    const { unmount } = renderToast({ tone: "success" });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(within(screen.getByRole("status")).getByText("Đã lưu 42 dòng điểm.")).toBeInTheDocument();
    unmount();

    renderToast({ tone: "danger" });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(within(screen.getByRole("alert")).getByText("Đã lưu 42 dòng điểm.")).toBeInTheDocument();
  });

  it("mỗi tone có icon riêng và nhãn chữ cho trình đọc màn hình", () => {
    renderToast({ tone: "success" });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(screen.getByText("Thành công:")).toBeInTheDocument();
  });

  it("tự tắt sau 6 giây", () => {
    vi.useFakeTimers();
    renderToast({ tone: "success" });

    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(screen.getByText("Đã lưu 42 dòng điểm.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.queryByText("Đã lưu 42 dòng điểm.")).toBeNull();
  });

  it("duration 0 thì ở lại — dùng cho câu dài hơn mức đọc kịp 6 giây", () => {
    vi.useFakeTimers();
    renderToast({ tone: "success", duration: 0 });

    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("Đã lưu 42 dòng điểm.")).toBeInTheDocument();
  });

  it("nút đóng nêu rõ đóng cái nào và đạt vùng chạm 44px", () => {
    renderToast({ tone: "success" });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    const close = screen.getByRole("button", {
      name: "Đóng thông báo: Đã lưu 42 dòng điểm.",
    });
    expect(close.className).toMatch(/min-h-11/);

    fireEvent.click(close);
    expect(screen.queryByText("Đã lưu 42 dòng điểm.")).toBeNull();
  });

  it("dùng useToast ngoài provider là lỗi lập trình, phải nổ ngay", () => {
    // React in cảnh báo về lỗi khi dựng; ở đây lỗi là điều mong đợi.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Harness />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});

/* ========================================================================== */

describe("Tooltip (05 §3.3 #16)", () => {
  const renderTooltip = () =>
    render(
      <Tooltip
        label="Giải thích cách tính điểm trung bình"
        content="Trung bình = (HK1 × 1 + HK2 × 2) / 3."
      />,
    );

  it("nút mở có nhãn cụ thể, không phải 'Trợ giúp' chung chung", () => {
    renderTooltip();
    expect(
      screen.getByRole("button", { name: "Giải thích cách tính điểm trung bình" }),
    ).toBeInTheDocument();
  });

  it("bấm mở được — máy bảng không có chuột để rê", () => {
    renderTooltip();
    const trigger = screen.getByRole("button");

    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.click(trigger);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Trung bình = (HK1 × 1 + HK2 × 2) / 3.");
    expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.getAttribute("id"));
  });

  it("focus bàn phím mở, rời focus thì đóng", () => {
    renderTooltip();
    const trigger = screen.getByRole("button");

    fireEvent.focus(trigger);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.blur(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("Escape đóng — WCAG 1.4.13 bắt buộc đóng được mà không phải rời chuột", () => {
    renderTooltip();
    fireEvent.click(screen.getByRole("button"));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("rê chuột vào mở, rê ra đóng", () => {
    renderTooltip();
    const trigger = screen.getByRole("button");

    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("nút mở đạt vùng chạm 44px", () => {
    renderTooltip();
    const trigger = screen.getByRole("button");
    expect(trigger.className).toMatch(/min-h-11/);
    expect(trigger.className).toMatch(/min-w-11/);
  });
});

/* ========================================================================== */

describe("FileUpload (05 §3.3 #19)", () => {
  const renderUpload = () =>
    render(
      <FileUpload
        name="file"
        label="Tệp danh sách thiếu nhi"
        accept=".xlsx,.xls"
        maxSizeMb={5}
        hint="Tải mẫu ở nút bên dưới."
      />,
    );

  it("vẫn là input file native — gửi được trong form không cần JS (09 §11)", () => {
    renderUpload();
    const input = screen.getByLabelText(/Tệp danh sách thiếu nhi/);
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("name", "file");
    expect(input).toHaveAttribute("accept", ".xlsx,.xls");
  });

  it("nói rõ định dạng nhận và giới hạn dung lượng, nối bằng aria-describedby", () => {
    renderUpload();

    const input = screen.getByLabelText(/Tệp danh sách thiếu nhi/);
    const hint = document.getElementById(input.getAttribute("aria-describedby") as string);
    expect(hint).toHaveTextContent("Định dạng nhận: .xlsx, .xls");
    expect(hint).toHaveTextContent("Tối đa 5 MB");
    expect(hint).toHaveTextContent("Tải mẫu ở nút bên dưới.");
  });

  it("chọn xong thì hiện tên và cỡ tệp trong vùng role=status", async () => {
    const user = userEvent.setup();
    renderUpload();

    const file = new File(["x".repeat(2048)], "danh-sach.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await user.upload(screen.getByLabelText(/Tệp danh sách thiếu nhi/), file);

    expect(screen.getByRole("status")).toHaveTextContent("Đã chọn: danh-sach.xlsx (2 KB)");
  });

  it("tệp quá cỡ bị báo NGAY, không để người dùng chờ tải xong mới biết", async () => {
    const user = userEvent.setup();
    renderUpload();

    const input = screen.getByLabelText(/Tệp danh sách thiếu nhi/);
    const big = new File(["x".repeat(6 * 1024 * 1024)], "to-qua.xlsx");
    await user.upload(input, big);

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tệp lớn hơn giới hạn 5 MB. Hãy chọn tệp nhỏ hơn.",
    );
  });

  it("nút 'Chọn tệp' do trình duyệt vẽ được nâng lên 44px", () => {
    renderUpload();
    expect(screen.getByLabelText(/Tệp danh sách thiếu nhi/).className).toMatch(
      /file:min-h-11/,
    );
  });
});
