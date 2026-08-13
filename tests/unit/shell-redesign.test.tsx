import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

/**
 * M14 **đợt C** — vỏ ứng dụng áp design system đã duyệt.
 *
 * Bốn khẳng định ở đây đều canh một điều đã ghi trong tài liệu đã duyệt, không
 * canh chuỗi class cho vui:
 *   · `09` §4.4 nơi số 1 — dải màu ngành 4px dưới thanh đầu trang
 *   · `09` §4.4 nơi số 2 + `05` §3.2 — mục sidebar đang chọn mang **ba** tín hiệu
 *   · `09` §10 điều 5 — màu không bao giờ là tín hiệu duy nhất
 *   · `13` §6 — ngữ cảnh phải nói được bằng CHỮ, ngay đầu thanh bên
 */

vi.mock("next/navigation", () => ({
  usePathname: () => "/students",
}));

vi.mock("@/features/auth/server/actions", () => ({ signOutAction: vi.fn() }));

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img alt={alt} {...props} />
  ),
}));

const { AppShell } = await import("@/components/layout/app-shell");
const { MobileBottomNavigation } = await import("@/components/layout/mobile-bottom-navigation");
const { NotificationButton } = await import("@/components/layout/notification-button");
const { PageHeader } = await import("@/components/layout/page-header");
const { PermissionDenied } = await import("@/components/shared/permission-denied");
const { getMobileNavigation } = await import("@/config/navigation");

const viewer = {
  displayName: "Nguyễn Văn A",
  role: "group_leader",
  audience: "staff",
  scopeKind: "global",
} as const;

const academicYear = { id: "y-1", code: "2026-2027", name: "Năm học 2026-2027" };

function renderShell(extra: { contextIndicator?: React.ReactNode; unassignedBanner?: React.ReactNode } = {}) {
  return render(
    <AppShell
      viewer={viewer}
      notificationBell={<NotificationButton unreadCount={0} />}
      academicYear={academicYear}
      {...extra}
    >
      <PageHeader title="Thiếu nhi" />
    </AppShell>,
  );
}

describe("Dải màu ngành 4px dưới thanh đầu trang (09 §4.4 nơi số 1)", () => {
  it("có đúng một dải, dùng token ngành, và bị ẩn khỏi trình đọc màn hình", () => {
    const { container } = renderShell();
    const header = container.querySelector("header") as HTMLElement;

    const strip = header.querySelector(".bg-theme-primary");
    expect(strip).not.toBeNull();
    // 4px = `h-1`. Dải mỏng hơn thì không còn đọc được ở 360px.
    expect(strip?.className).toContain("h-1");
    // Nó là trang trí thuần: câu chữ tương đương do `ContextIndicator` lo.
    expect(strip).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Mục sidebar đang chọn mang BA tín hiệu (05 §3.2)", () => {
  it("thanh dọc 3px + nền tint + chữ accent, và có aria-current", () => {
    const { container } = renderShell();
    const sidebar = container.querySelector("aside") as HTMLElement;
    const active = within(sidebar).getByRole("link", { name: "Thiếu nhi" });

    expect(active).toHaveAttribute("aria-current", "page");
    expect(active.className).toContain("border-theme-primary");
    expect(active.className).toContain("bg-theme-tint");
    expect(active.className).toContain("text-theme-accent-text");
  });

  it("mục KHÔNG được chọn vẫn giữ viền trong suốt để chữ không nhảy 3px", () => {
    const { container } = renderShell();
    const sidebar = container.querySelector("aside") as HTMLElement;
    const inactive = within(sidebar).getByRole("link", { name: "Lớp học" });

    expect(inactive.className).toContain("border-l-[3px]");
    expect(inactive.className).toContain("border-transparent");
  });
});

describe("Thanh dưới đáy màn hình — màu không phải tín hiệu duy nhất (09 §10 điều 5)", () => {
  it("ô đang chọn có thêm một vạch nhìn thấy được, không chỉ đổi màu chữ", () => {
    const { container } = render(
      <MobileBottomNavigation items={getMobileNavigation(viewer)} pathname="/students" />,
    );
    const active = screen.getByRole("link", { name: "Thiếu nhi" });

    expect(active).toHaveAttribute("aria-current", "page");
    const marker = active.querySelector('[aria-hidden="true"].bg-theme-primary');
    expect(marker, "ô đang chọn phải có vạch chỉ báo riêng").not.toBeNull();

    // Ô không được chọn thì không có vạch nào — nếu có thì vạch mất hết ý nghĩa.
    const inactive = screen.getByRole("link", { name: "Báo cáo" });
    expect(inactive.querySelector('[aria-hidden="true"].bg-theme-primary')).toBeNull();
    expect(container.querySelectorAll('[aria-hidden="true"].bg-theme-primary')).toHaveLength(1);
  });
});

describe("Ngữ cảnh nói bằng chữ (13 §6, 09 §10 điều 5)", () => {
  it("🔴 có mặt ở CẢ thanh bên desktop lẫn màn hình hẹp", () => {
    const { container } = renderShell({
      contextIndicator: <p data-testid="ctx">Đang xem: Ngành Ấu Nhi</p>,
    });

    // Thanh bên là `hidden lg:flex`. Nếu dòng ngữ cảnh chỉ nằm trong đó thì ở
    // 360px người dùng chỉ còn dải màu 4px — màu thành tín hiệu duy nhất, mà
    // điện thoại lại là thiết bị ưu tiên số 1 của dự án.
    const copies = screen.getAllByTestId("ctx");
    expect(copies.length, "cần một bản cho desktop và một bản cho màn hình hẹp").toBe(2);

    const sidebar = container.querySelector("aside") as HTMLElement;
    expect(within(sidebar).getByTestId("ctx")).toBeInTheDocument();

    const main = screen.getByRole("main");
    const mobileCopy = within(main).getByTestId("ctx");
    // Bản trong `main` phải tự ẩn từ `lg` trở lên, nếu không desktop đọc hai lần.
    expect(mobileCopy.parentElement?.className).toContain("lg:hidden");
  });

  it("không truyền thì không dựng khung rỗng ở đâu cả", () => {
    renderShell();
    expect(screen.queryByTestId("ctx")).toBeNull();
  });
});

describe("Dải giải thích 'chưa phân công' đứng TRƯỚC nội dung (10 §8)", () => {
  it("nằm trong main và trước tiêu đề trang", () => {
    renderShell({ unassignedBanner: <p data-testid="unassigned">Hồ sơ của bạn chưa được phân công lớp.</p> });

    const main = screen.getByRole("main");
    const banner = within(main).getByTestId("unassigned");
    const heading = within(main).getByRole("heading", { level: 1 });
    // Dải giải thích vì sao vỏ không có màu ngành; đọc sau nội dung thì vô ích.
    expect(banner.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("PageHeader — đường quay lại chuẩn (AC-B6, khuyến nghị B7.1)", () => {
  it("là link thật tới trang cha, vùng chạm 44px", () => {
    render(<PageHeader title="Maria Nguyễn Thị B" backHref="/parent/children" backLabel="Con của tôi" />);
    const back = screen.getByRole("link", { name: "Con của tôi" });
    expect(back).toHaveAttribute("href", "/parent/children");
    expect(back.className).toContain("min-h-11");
  });

  it("không truyền backHref thì không dựng link nào", () => {
    render(<PageHeader title="Tổng quan" />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("Trang bị từ chối quyền nói rõ vai trò hiện tại (AC-C5)", () => {
  it("in vai trò để người dùng có thứ mang theo khi gọi quản trị viên", () => {
    render(<PermissionDenied roleLabel="Thủ quỹ" />);
    expect(screen.getByText("Thủ quỹ")).toBeInTheDocument();
  });

  it("KHÔNG nói route đó cần vai trò nào — đó là vẽ đường cho người dò quyền", () => {
    const { container } = render(<PermissionDenied roleLabel="Thủ quỹ" />);
    expect(container.textContent).not.toMatch(/cần vai trò|yêu cầu vai trò/i);
  });

  it("tiêu đề trang là h1 vì trang này không dùng PageHeader", () => {
    render(<PermissionDenied />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
