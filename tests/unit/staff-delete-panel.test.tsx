import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * M04-B / D-106 — khối "Xóa hồ sơ" ở `/staff/[staffId]`.
 *
 * Đây là thao tác KHÔNG HOÀN TÁC ĐƯỢC duy nhất mà 2B mở ra cho đến giờ. Ba lớp
 * ma sát phải còn nguyên, và bộ test này là thứ giữ chúng:
 *   1. hồ sơ đã được dùng ⇒ không có nút, và hiện đúng LÝ DO
 *   2. nút chỉ mở khi gõ lại đúng họ tên
 *   3. hộp xác nhận nêu hậu quả bằng TÊN RIÊNG (`11` §5)
 */

const deleteStaffProfile = vi.fn(async (_input: { id: string; confirmName: string }) => ({
  ok: true as const,
  data: { staffCode: "GLV916", fullName: "Chu Chưa Dùng" },
}));
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace }),
}));
vi.mock("@/features/staff/server/actions", () => ({
  deleteStaffProfile: (input: unknown) => deleteStaffProfile(input as never),
}));

const { StaffDeletePanel } = await import("@/features/staff/components/staff-delete-panel");

function renderPanel(blockers: string[] = []) {
  return render(
    <StaffDeletePanel
      staffId="staff-916"
      staffCode="GLV916"
      fullName="Chu Chưa Dùng"
      blockers={blockers}
    />,
  );
}

beforeEach(() => {
  deleteStaffProfile.mockClear();
  replace.mockClear();
});

describe("hồ sơ đã được dùng", () => {
  it("không có nút xóa, và nêu ĐÚNG từng lý do do DB trả về", () => {
    renderPanel(["Đã có 2 lần phân công lớp trong lịch sử.", "Đã tham gia 1 Ban."]);
    expect(screen.queryByRole("button", { name: "Xóa hồ sơ" })).not.toBeInTheDocument();
    expect(screen.getByText("Đã có 2 lần phân công lớp trong lịch sử.")).toBeInTheDocument();
    expect(screen.getByText("Đã tham gia 1 Ban.")).toBeInTheDocument();
  });

  it("chỉ đường sang cách đúng: đổi trạng thái phục vụ sang 'Đã nghỉ'", () => {
    renderPanel(["Đã tham gia 1 Ban."]);
    expect(screen.getByText(/Đã nghỉ/)).toBeInTheDocument();
  });

  it("không có ô gõ lại tên khi vốn không xóa được", () => {
    renderPanel(["Đã tham gia 1 Ban."]);
    expect(screen.queryByLabelText(/Gõ lại họ tên/)).not.toBeInTheDocument();
  });
});

describe("hồ sơ chưa từng dùng", () => {
  it("nút xóa KHOÁ cho tới khi gõ lại đúng họ tên", async () => {
    const user = userEvent.setup();
    renderPanel();
    const button = screen.getByRole("button", { name: "Xóa hồ sơ" });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/Gõ lại họ tên/), "Chu Chưa");
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/Gõ lại họ tên/), " Dùng");
    expect(button).toBeEnabled();
  });

  it("khoảng trắng thừa không làm khoá oan — cùng luật so với phía DB", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByLabelText(/Gõ lại họ tên/), "  Chu  Chưa  Dùng  ");
    expect(screen.getByRole("button", { name: "Xóa hồ sơ" })).toBeEnabled();
  });

  it("gõ SAI dấu thì vẫn khoá — gõ lại tên là để buộc nhìn kỹ mình xoá ai", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByLabelText(/Gõ lại họ tên/), "Chu Chua Dung");
    expect(screen.getByRole("button", { name: "Xóa hồ sơ" })).toBeDisabled();
  });

  it("hộp xác nhận nêu hậu quả BẰNG TÊN RIÊNG và nói rõ không hoàn tác được", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByLabelText(/Gõ lại họ tên/), "Chu Chưa Dùng");
    await user.click(screen.getByRole("button", { name: "Xóa hồ sơ" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Chu Chưa Dùng");
    expect(dialog).toHaveTextContent("GLV916");
    expect(dialog).toHaveTextContent(/không hoàn tác được/);
    expect(dialog).toHaveTextContent(/nhật ký/);
  });

  it("xác nhận ⇒ gọi action với đúng id và tên đã gõ, rồi về danh sách kèm thông báo", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByLabelText(/Gõ lại họ tên/), "Chu Chưa Dùng");
    await user.click(screen.getByRole("button", { name: "Xóa hồ sơ" }));
    await user.click(screen.getByRole("button", { name: "Xóa hẳn hồ sơ" }));

    expect(deleteStaffProfile).toHaveBeenCalledWith({ id: "staff-916", confirmName: "Chu Chưa Dùng" });
    // Ở lại trang chi tiết sau khi xoá là ở lại một trang 404.
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("/staff?deleted="));
  });

  it("action hỏng ⇒ đóng hộp, nêu câu lỗi của DB, và XOÁ ô tên để phải gõ lại có chủ ý", async () => {
    deleteStaffProfile.mockResolvedValueOnce({
      ok: false,
      code: "CONFLICT",
      message: "Không xóa được hồ sơ này. Đã có 1 phiếu mượn thiết bị.",
    } as never);
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByLabelText(/Gõ lại họ tên/), "Chu Chưa Dùng");
    await user.click(screen.getByRole("button", { name: "Xóa hồ sơ" }));
    await user.click(screen.getByRole("button", { name: "Xóa hẳn hồ sơ" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(/Đã có 1 phiếu mượn thiết bị/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gõ lại họ tên/)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Xóa hồ sơ" })).toBeDisabled();
  });
});
