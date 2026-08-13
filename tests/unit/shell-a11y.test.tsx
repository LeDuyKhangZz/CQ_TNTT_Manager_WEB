import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

/**
 * Mốc 0B mục 0.7 — a11y của vỏ ứng dụng.
 *
 * Bốn thứ được canh ở đây, đều là lỗi thật đã ghi ở
 * `modules/M14-NAVIGATION-SHELL/06_UI_UX_RECOMMENDATIONS.md` §D3:
 *   D3.a drawer mobile phải là dialog thật (5 yêu cầu)
 *   D3.b skip link "Bỏ qua điều hướng" nhảy tới `<main>`
 *   D3.c thứ bậc heading — `h1` thuộc về trang, không phải thanh header
 *   `05` §3.2 breadcrumb thật, hiện cả trên mobile
 */

vi.mock("next/navigation", () => ({
  usePathname: () => "/students/6f1e0d7a-0000-4000-8000-000000000001",
}));

// M14 A-01 đưa nút Đăng xuất vào chân thanh bên, nên vỏ nay kéo theo Server
// Action thật (`server-only` + client service-role). Ở đây chỉ dựng giao diện.
vi.mock("@/features/auth/server/actions", () => ({ signOutAction: vi.fn() }));

// next/image cần cấu hình loader của Next; trong jsdom chỉ cần một thẻ ảnh.
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img alt={alt} {...props} />
  ),
}));

const { AppShell } = await import("@/components/layout/app-shell");
const { NotificationButton } = await import("@/components/layout/notification-button");
const { PageHeader } = await import("@/components/layout/page-header");
const { Breadcrumb } = await import("@/components/ui/breadcrumb");

const authContext = {
  userId: "u-1",
  profileId: "p-1",
  username: "GLV901",
  displayName: "Nguyễn Văn A",
  accountStatus: "active",
  mustChangePassword: false,
  role: "group_leader",
  audience: "staff",
  scopeKind: "global",
  academicYearId: "y-1",
  sectorId: null,
  classId: null,
} as const;

// Mục 0.9 đổi `AcademicYearSwitcher` từ nút chết viết cứng sang nhận năm học
// thật từ máy chủ, nên vỏ phải được truyền năm học vào.
const academicYear = { id: "y-1", code: "2026-2027", name: "Năm học 2026-2027" };

function renderShell() {
  return render(
    // M14 A-16 đổi `unreadCount` thành một node dựng sẵn ở máy chủ: vỏ không còn
    // chờ truy vấn đếm chưa đọc. Ở đây truyền thẳng nút đã có số.
    // M14 NC-5 đổi `authContext` (12 trường) thành `viewer` (4 trường): vỏ là
    // client component nên mọi prop của nó đều được gửi xuống trình duyệt.
    <AppShell
      viewer={authContext}
      notificationBell={<NotificationButton unreadCount={0} />}
      academicYear={academicYear}
    >
      <PageHeader title="Thiếu nhi" description="Hồ sơ thiếu nhi và người giám hộ." />
    </AppShell>,
  );
}

describe("Skip link và mốc main (D3.b)", () => {
  it("là link đầu tiên của vỏ và trỏ tới đúng một `main` nhận được focus", () => {
    const { container } = renderShell();

    const skipLink = screen.getByRole("link", { name: "Bỏ qua điều hướng" });
    expect(skipLink).toHaveAttribute("href", "#main-content");
    expect(container.querySelector("a")).toBe(skipLink);

    const mains = container.querySelectorAll("main");
    expect(mains).toHaveLength(1);
    expect(mains[0]).toHaveAttribute("id", "main-content");
    // Không có tabindex thì trình duyệt chỉ cuộn tới chứ không chuyển focus.
    expect(mains[0]).toHaveAttribute("tabindex", "-1");
  });

  it("nội dung trang nằm trong `main`, không nằm ngoài", () => {
    renderShell();
    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { level: 1, name: "Thiếu nhi" })).toBeInTheDocument();
  });
});

describe("Thứ bậc heading (D3.c)", () => {
  it("thanh header KHÔNG chứa heading nào — `h1` thuộc về trang", () => {
    const { container } = renderShell();
    const header = container.querySelector("header");
    expect(header).not.toBeNull();
    expect(within(header as HTMLElement).queryAllByRole("heading")).toHaveLength(0);
  });

  it("cả trang chỉ có đúng một `h1`, và không bị lặp chữ với header", () => {
    const { container } = renderShell();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    // Tên trang vẫn hiện ở header, nhưng là `<p>` chứ không phải heading thứ hai.
    expect(screen.getAllByText("Thiếu nhi").length).toBeGreaterThan(1);
  });
});

describe("Breadcrumb trong header (05 §3.2)", () => {
  it("hiện đủ ba cấp, đoạn cuối là trang hiện tại và không phải link", () => {
    renderShell();
    const nav = screen.getByRole("navigation", { name: "Đường dẫn trang" });

    expect(within(nav).getByRole("link", { name: "Trang chủ" })).toHaveAttribute("href", "/dashboard");
    expect(within(nav).getByRole("link", { name: "Thiếu nhi" })).toHaveAttribute("href", "/students");

    const current = within(nav).getByText("Hồ sơ thiếu nhi");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.tagName).toBe("SPAN");
  });

  it("không có lớp ẩn theo breakpoint — phải đọc được cả trên mobile", () => {
    renderShell();
    const nav = screen.getByRole("navigation", { name: "Đường dẫn trang" });
    expect(nav.className).not.toMatch(/(^|\s)hidden(\s|$)/);
  });

  it("đoạn một cấp (trang chủ) không dựng link tự trỏ về mình", () => {
    render(<Breadcrumb items={[{ label: "Trang chủ" }]} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Trang chủ")).toHaveAttribute("aria-current", "page");
  });
});

describe("Drawer điều hướng là dialog thật (D3.a)", () => {
  const openDrawer = () => {
    const trigger = screen.getByRole("button", { name: "Mở menu" });
    trigger.focus();
    fireEvent.click(trigger);
    return trigger;
  };

  it("chưa mở thì không có lớp nổi nào trong cây a11y", () => {
    renderShell();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("1+2: mở ra là dialog có aria-modal và focus nhảy vào nút Đóng", () => {
    renderShell();
    openDrawer();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Menu điều hướng");
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Đóng menu" }));
  });

  it("5: khoá cuộn body khi mở và trả lại đúng giá trị cũ khi đóng", () => {
    renderShell();
    openDrawer();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).toBe("");
  });

  it("4: Escape đóng drawer VÀ trả focus về nút vừa rời đi", () => {
    renderShell();
    const trigger = openDrawer();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("3: Tab ở phần tử cuối quay về phần tử đầu, Shift+Tab thì ngược lại", () => {
    renderShell();
    openDrawer();

    const dialog = screen.getByRole("dialog");
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    );
    expect(focusable.length).toBeGreaterThan(1);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("lớp phủ là div aria-hidden, KHÔNG phải một nút phủ kín màn hình", () => {
    const { container } = renderShell();
    openDrawer();

    const overlay = container.querySelector('[aria-hidden="true"].absolute.inset-0');
    expect(overlay).not.toBeNull();
    expect(overlay?.tagName).toBe("DIV");
    // Bản cũ có một `<button aria-label="Đóng menu">` phủ kín màn hình, nên
    // trình đọc màn hình gặp hai nút cùng tên. Nay chỉ còn nút thật trong drawer.
    expect(screen.getAllByRole("button", { name: "Đóng menu" })).toHaveLength(1);
  });

  it("bấm lớp phủ thì đóng drawer", () => {
    const { container } = renderShell();
    openDrawer();

    const overlay = container.querySelector('[aria-hidden="true"].absolute.inset-0');
    fireEvent.click(overlay as Element);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
