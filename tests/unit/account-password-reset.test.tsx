import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountAdminOptions } from "@/features/auth/server/queries";

const mocks = vi.hoisted(() => ({ reset: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/features/auth/server/actions", () => ({
  adminResetPassword: mocks.reset,
  adminDeleteAccount: vi.fn(), adminProvisionAccount: vi.fn(), adminSetAccountStatus: vi.fn(),
  adminSetPassword: vi.fn(), adminUpdateUsername: vi.fn(),
}));
const { AccountAdminPanel } = await import("@/features/auth/components/account-admin-panel");
const options: AccountAdminOptions = {
  currentProfileId: "actor", provisionableRoles: [], guardians: [], students: [],
  accounts: [
    { id: "actor", username: "KHANG.NHO", displayName: "Khang", role: "super_admin", status: "active", mustChangePassword: false },
    { id: "target", username: "MR.DAT", displayName: "Mr. Đạt", role: "super_admin", status: "active", mustChangePassword: true },
    { id: "teacher", username: "GLV001", displayName: "Giáo lý viên", role: "class_teacher", status: "active", mustChangePassword: false },
  ],
};
function open() {
  render(<AccountAdminPanel options={options} />);
  fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu MR.DAT" }));
  return screen.getByRole("dialog", { name: "Đặt lại mật khẩu" });
}
beforeEach(() => { vi.clearAllMocks(); });

describe("đặt lại mật khẩu ngay trong danh sách", () => {
  it("hiện reset cho SA khác và GLV, dùng đổi mật khẩu cho chính mình", () => {
    render(<AccountAdminPanel options={options} />);
    expect(screen.getByRole("button", { name: "Đặt lại mật khẩu MR.DAT" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Đặt lại mật khẩu GLV001" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Đặt lại mật khẩu KHANG.NHO" })).toBeNull();
    expect(screen.getByRole("link", { name: "Đổi mật khẩu của tôi" })).toHaveAttribute("href", "/change-password");
    expect(screen.getAllByText(/Không thể đổi tên, vô hiệu hóa hoặc xóa tài khoản Super Admin/)).toHaveLength(2);
  });
  it("mở và hủy xác nhận không gọi action", () => {
    const dialog = open();
    expect(within(dialog).getByText("MR.DAT")).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "Hủy" }));
    expect(mocks.reset).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("chặn bấm lặp và đóng lúc đang gửi; trả mật khẩu trong đúng hộp thoại rồi xóa khỏi DOM", async () => {
    let finish!: (value: unknown) => void;
    mocks.reset.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const dialog = open();
    const confirm = within(dialog).getByRole("button", { name: "Xác nhận đặt lại" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    fireEvent.click(within(dialog).getByRole("button", { name: "Đóng hộp thoại" }));
    expect(dialog).toBeVisible();
    expect(mocks.reset).toHaveBeenCalledOnce();
    expect(mocks.reset).toHaveBeenCalledWith("target");
    await act(async () => { finish({ ok: true, data: { temporaryPassword: "sample89" } }); });
    expect(within(dialog).getByText("sample89")).toBeVisible();
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(within(dialog).queryByRole("button", { name: "Xác nhận đặt lại" })).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "Đã lưu mật khẩu" }));
    expect(screen.queryByText("sample89")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu GLV001" }));
    expect(screen.queryByText("sample89")).toBeNull();
  });
  it("lỗi action nằm trong hộp thoại và cho phép thử lại", async () => {
    mocks.reset.mockResolvedValue({ ok: false, code: "FORBIDDEN", message: "Không đủ quyền." });
    const dialog = open();
    fireEvent.click(within(dialog).getByRole("button", { name: "Xác nhận đặt lại" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Không đủ quyền.");
    expect(within(dialog).getByRole("button", { name: "Xác nhận đặt lại" })).toBeEnabled();
  });
  it("mất mạng không để trạng thái chờ bị kẹt", async () => {
    mocks.reset.mockRejectedValue(new Error("network"));
    const dialog = open();
    fireEvent.click(within(dialog).getByRole("button", { name: "Xác nhận đặt lại" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Chưa nhận được kết quả");
    expect(within(dialog).getByRole("button", { name: "Hủy" })).toBeEnabled();
  });
});
