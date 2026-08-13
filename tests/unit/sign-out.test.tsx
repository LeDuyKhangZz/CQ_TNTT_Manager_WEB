import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

/**
 * M14 A-01 + A-06 — nút Đăng xuất, và khối chữ tạm mà nó thay thế.
 *
 * Luồng F07 chấm **16/75 (`CRITICAL`)** ở audit vì tính năng chưa từng tồn tại:
 * `grep signOut` trên toàn `src/` chỉ ra một dòng dùng nội bộ lúc đăng nhập.
 * Máy phòng học là máy dùng chung — chính lý do `sw.js` từ chối cache HTML —
 * mà người dùng không có cách nào kết thúc phiên của mình.
 *
 * Phủ AC-B1, AC-F1, AC-F3 của `08_ACCEPTANCE_CRITERIA.md`.
 */

// Server Action thật kéo theo `server-only` và client service-role; ở đây chỉ
// cần biết biểu mẫu **có trỏ vào một action** và là POST, không phải link GET.
const signOutAction = vi.fn();
vi.mock("@/features/auth/server/actions", () => ({ signOutAction }));

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img alt={alt} {...props} />
  ),
}));

const { SignOutButton } = await import("@/components/layout/sign-out-button");
const { UserMenu } = await import("@/components/layout/user-menu");
const { AppSidebar } = await import("@/components/layout/app-sidebar");
const { getDesktopNavigation } = await import("@/config/navigation");

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

/**
 * Tìm theo chữ rồi leo lên `<button>`, KHÔNG tìm theo `getByRole("button")`:
 * ở trong menu, nút mang `role="menuitem"` nên vai trò ngầm `button` bị che.
 * Cùng một nút, hai vai trò tuỳ chỗ đặt — helper phải chịu được cả hai.
 */
function signOutButton(): HTMLButtonElement {
  const button = screen.getByText("Đăng xuất").closest("button");
  expect(button).not.toBeNull();
  return button as HTMLButtonElement;
}

describe("SignOutButton — AC-F3: POST chứ không phải link GET", () => {
  it("🔴 là nút submit trong <form>, không phải thẻ <a>", () => {
    render(<SignOutButton />);
    const button = signOutButton();
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.closest("form")).not.toBeNull();
    expect(screen.queryByRole("link", { name: "Đăng xuất" })).toBeNull();
  });

  it("form trỏ vào Server Action, không phải một địa chỉ tự gõ", () => {
    render(<SignOutButton />);
    // React 19 gắn sẵn một chuỗi mốc `javascript:throw…` vào `action` khi action
    // là **hàm** — nó chính là bằng chứng đây là Server Action. Nếu ai đó đổi
    // sang `<form action="/api/logout">` thì thuộc tính này thành một đường dẫn
    // điều hướng được và test đỏ ngay.
    const action = signOutButton().closest("form")?.getAttribute("action") ?? "";
    expect(action.startsWith("javascript:")).toBe(true);
    expect(action.startsWith("/")).toBe(false);
    expect(action.startsWith("http")).toBe(false);
  });

  it("vùng chạm ≥44px ở cả hai kiểu hiển thị", () => {
    const { rerender } = render(<SignOutButton />);
    expect(signOutButton().className).toContain("min-h-11");
    rerender(<SignOutButton variant="panel" />);
    expect(signOutButton().className).toContain("min-h-11");
  });

  it("chỉ mang vai trò menuitem khi thật sự nằm trong menu", () => {
    const { rerender } = render(<SignOutButton />);
    // Trong menu: `menuitem` che mất vai trò ngầm `button` — đúng như mong đợi.
    expect(signOutButton().getAttribute("role")).toBe("menuitem");
    expect(screen.queryByRole("button", { name: "Đăng xuất" })).toBeNull();
    // `role="none"` trên form: con trực tiếp của `role="menu"` phải là menuitem,
    // một `<form>` còn nguyên vai trò sẽ cắt đứt quan hệ đó.
    expect(signOutButton().closest("form")?.getAttribute("role")).toBe("none");

    rerender(<SignOutButton variant="panel" />);
    expect(signOutButton().getAttribute("role")).toBeNull();
    expect(signOutButton().closest("form")?.getAttribute("role")).toBeNull();
    // Ngoài menu thì nó phải là một cái nút bình thường.
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeTruthy();
  });
});

describe("UserMenu — AC-F1: đăng xuất trong tối đa 2 thao tác", () => {
  it("menu tài khoản có cả 'Tài khoản' và 'Đăng xuất'", () => {
    render(<UserMenu viewer={authContext} />);
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Tài khoản" })).toBeTruthy();
    expect(within(menu).getByRole("menuitem", { name: "Đăng xuất" })).toBeTruthy();
  });

  it("vẫn in tên và vai trò hiện tại của người đang đăng nhập", () => {
    render(<UserMenu viewer={authContext} />);
    expect(screen.getAllByText("Nguyễn Văn A").length).toBeGreaterThan(0);
    expect(screen.getByText("Xứ đoàn trưởng")).toBeTruthy();
  });

  it("tài khoản chưa gán vai trò vẫn đăng xuất được (AC-A6)", () => {
    render(<UserMenu viewer={{ ...authContext, role: null, audience: null, scopeKind: null }} />);
    expect(screen.getByText("Chưa gán vai trò")).toBeTruthy();
    expect(signOutButton()).toBeTruthy();
  });

  it("🔴 mở/đóng được khi JS chưa tải — menu này chứa nút Đăng xuất", () => {
    const { container } = render(<UserMenu viewer={authContext} />);
    // `<details>` là cơ chế của chính trình duyệt; một menu dựng bằng state
    // React thì lúc chưa hydrate là một cái nút chết.
    expect(container.querySelector("details > summary")).not.toBeNull();
  });
});

describe("AppSidebar — AC-B1: chữ tạm đã đi, nút Đăng xuất thế chỗ", () => {
  const items = getDesktopNavigation(authContext);

  it("🔴 không còn chuỗi 'P0-T3' hay 'Bản nền giao diện'", () => {
    const { container } = render(<AppSidebar items={items} pathname="/dashboard" />);
    expect(container.textContent).not.toContain("P0-T3");
    expect(container.textContent).not.toContain("Bản nền giao diện");
  });

  it("chân thanh bên có nút Đăng xuất ở cả bản desktop và bản trong drawer", () => {
    const { unmount } = render(<AppSidebar items={items} pathname="/dashboard" />);
    expect(signOutButton()).toBeTruthy();
    unmount();

    render(<AppSidebar items={items} pathname="/dashboard" mobile onClose={() => {}} />);
    expect(signOutButton()).toBeTruthy();
  });
});
