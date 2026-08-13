import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AccountAdminOptions } from "@/features/auth/server/queries";

/**
 * M04-C / D-111 — `/admin` thu hẹp về **tra cứu + xử lý ngoại lệ**.
 *
 * Hai điều bộ test này giữ:
 *   1. ô chọn vai trò không còn mời người dùng làm việc chắc chắn hỏng — trước đây
 *      nó liệt kê đủ 14 vai trò kể cả "Quản trị viên hệ thống", trong khi máy chủ
 *      LUÔN từ chối (trần vai trò D-102);
 *   2. bỏ một đường đi thì phải chỉ đường thay thế, nếu không người dùng chỉ thấy
 *      tính năng biến mất.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/features/auth/server/actions", () => ({
  adminDeleteAccount: vi.fn(),
  adminProvisionAccount: vi.fn(),
  adminResetPassword: vi.fn(),
  adminSetAccountStatus: vi.fn(),
  adminSetPassword: vi.fn(),
  adminUpdateUsername: vi.fn(),
}));

const { AccountAdminPanel } = await import("@/features/auth/components/account-admin-panel");

const OPTIONS: AccountAdminOptions = {
  accounts: [
    {
      id: "profile-1",
      username: "GLV910",
      displayName: "Nguyễn Văn A",
      status: "active",
      role: "class_teacher",
      mustChangePassword: false,
    },
  ],
  provisionableRoles: ["parish_priest", "chaplain", "guardian", "student"],
  guardians: [{ id: "g-1", username: "0900000001", displayName: "Bà B", label: "Bà B · 0900000001" }],
  students: [{ id: "s-1", username: "TN001", displayName: "Bé C", saintName: "Maria", label: "TN001 · Maria Bé C" }],
};

function renderPanel() {
  return render(<AccountAdminPanel options={OPTIONS} />);
}

describe("ô chọn vai trò của biểu mẫu tạo tài khoản", () => {
  it("chỉ hiện đúng các vai trò máy chủ còn cấp được", () => {
    renderPanel();
    const select = screen.getByLabelText("Vai trò");
    const labels = within(select).getAllByRole("option").map((option) => option.textContent);
    expect(labels).toEqual(["Cha sở", "Cha phó/Tuyên úy", "Phụ huynh", "Thiếu nhi"]);
  });

  it("không còn 'Quản trị viên hệ thống' — máy chủ luôn từ chối vai trò này", () => {
    renderPanel();
    const select = screen.getByLabelText("Vai trò");
    expect(within(select).queryByRole("option", { name: "Quản trị viên hệ thống" })).toBeNull();
  });

  it("không còn vai trò Giáo lý viên nào", () => {
    renderPanel();
    const select = screen.getByLabelText("Vai trò");
    for (const label of ["Giáo lý viên lớp", "Giáo lý viên đại diện", "Trưởng ngành", "Thư ký"]) {
      expect(within(select).queryByRole("option", { name: label })).toBeNull();
    }
  });
});

describe("chỉ đường sang nơi cấp tài khoản Giáo lý viên", () => {
  it("có liên kết sang danh sách nhân sự", () => {
    renderPanel();
    const link = screen.getByRole("link", { name: "mở Danh sách nhân sự" });
    expect(link).toHaveAttribute("href", "/staff");
  });

  it("nói rõ tài khoản Giáo lý viên cấp ở đâu, không chỉ im lặng bỏ đi", () => {
    renderPanel();
    expect(screen.getByText(/cấp ngay tại hồ sơ người đó/)).toBeInTheDocument();
  });
});

describe("biểu mẫu không còn hỏi phạm vi năm học / ngành / lớp", () => {
  it("bốn ô chọn cũ đã biến mất", () => {
    renderPanel();
    expect(screen.queryByLabelText("Năm học")).toBeNull();
    expect(screen.queryByLabelText("Ngành")).toBeNull();
    expect(screen.queryByLabelText("Lớp")).toBeNull();
    expect(screen.queryByLabelText("Hồ sơ Giáo lý viên")).toBeNull();
  });

  it("chọn Phụ huynh thì hiện ô chọn hồ sơ phụ huynh, chưa chọn ai thì để trống", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.selectOptions(screen.getByLabelText("Vai trò"), "guardian");
    const guardianSelect = screen.getByLabelText("Hồ sơ phụ huynh");
    expect(guardianSelect).toBeRequired();
    // Ô để trống ⇒ trình duyệt chặn gửi; nếu tự chọn sẵn người đầu danh sách thì
    // một cú bấm nhầm sẽ cấp tài khoản cho đúng người không ai định cấp.
    expect((guardianSelect as HTMLSelectElement).value).toBe("");
  });
});
