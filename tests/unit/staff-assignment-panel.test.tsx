import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * M04-A — hàng rào cho hai thao tác đổi QUYỀN của người khác trên `/staff/[id]`.
 *
 * 🔴 Vì sao bộ test này tồn tại: audit chấm M04-F05 **C5 = 1** vì nút "Kết thúc
 * phân công" **nói dối về hệ quả** — nó còn vô hiệu hoá vai trò đăng nhập mà
 * không hề báo. Và M04-F06 chấm **24/75** vì đổi lớp không hoàn thành được.
 * D-105 giải cả hai bằng nút "Chuyển lớp", nhưng cả hai lối vẫn đổi quyền, nên
 * hàng rào duy nhất còn lại là **câu chữ nêu hậu quả bằng tên riêng** (`11` §5).
 * Câu chữ đó biến mất hoặc nói sai tên lớp thì module này hết hàng rào.
 */

type ActionSpy = ReturnType<
  typeof vi.fn<(input: unknown) => Promise<{ ok: boolean; data?: unknown; message?: string }>>
>;
const transferClassStaff: ActionSpy = vi.fn(async () => ({ ok: true, data: { assignmentId: "csa-2" } }));
const endClassStaffAssignment: ActionSpy = vi.fn(async () => ({ ok: true, data: undefined }));
const assignStaffToClass: ActionSpy = vi.fn(async () => ({ ok: true, data: { id: "csa-3" } }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/features/staff/server/actions", () => ({
  transferClassStaff: (input: unknown) => transferClassStaff(input),
  endClassStaffAssignment: (id: unknown, endsOn: unknown) => endClassStaffAssignment({ id, endsOn }),
  assignStaffToClass: (input: unknown) => assignStaffToClass(input),
}));

const { StaffAssignmentPanel } = await import("@/features/staff/components/staff-assignment-panel");

const ACTIVE = {
  id: "csa-1",
  classId: "class-au-1a",
  className: "Ấu 1A",
  capacity: "member",
  startsOn: "2026-09-01",
};
const CLASSES = [
  { id: "class-au-1a", name: "Ấu 1A" },
  { id: "class-thieu-2b", name: "Thiếu 2B" },
];

function renderPanel(overrides: Partial<Parameters<typeof StaffAssignmentPanel>[0]> = {}) {
  return render(
    <StaffAssignmentPanel
      staffProfileId="staff-1"
      staffName="Anh Giuse Trần Văn B"
      activeAssignment={ACTIVE}
      classes={CLASSES}
      canWrite
      canTransfer
      hasAccount
      {...overrides}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AC-03.1 — hộp xác nhận "Kết thúc phân công" nói ĐÚNG hệ quả', () => {
  it("nêu tên người, tên lớp, và tác dụng phụ lên vai trò đăng nhập", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Kết thúc phân công" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Anh Giuse Trần Văn B");
    expect(dialog).toHaveTextContent("Ấu 1A");
    // Đây là điều nút cũ giấu — C5 = 1 của M04-F05.
    expect(dialog).toHaveTextContent(/vô hiệu hoá vai trò đăng nhập/i);
    expect(dialog).toHaveTextContent(/không vào được lớp nào/i);
    // …và chỉ ra lối đi đúng thay cho việc này.
    expect(dialog).toHaveTextContent("Chuyển lớp");
  });

  it("bấm Huỷ thì KHÔNG gọi action nào (AC-03.1)", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Kết thúc phân công" }));
    await user.click(await screen.findByRole("button", { name: "Huỷ" }));
    expect(endClassStaffAssignment).not.toHaveBeenCalled();
  });

  it("hồ sơ KHÔNG có tài khoản thì không doạ về vai trò đăng nhập", async () => {
    const user = userEvent.setup();
    renderPanel({ hasAccount: false });
    await user.click(screen.getByRole("button", { name: "Kết thúc phân công" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Ấu 1A");
    expect(dialog).not.toHaveTextContent(/vô hiệu hoá vai trò đăng nhập/i);
  });
});

describe("D-105 — hộp thoại Chuyển lớp tự nó là lời xác nhận", () => {
  it("xem trước nêu đủ hai tên lớp, hai ngày, và vai trò đăng nhập đi đâu", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Chuyển lớp" }));
    const dialog = await screen.findByRole("dialog");

    await user.selectOptions(screen.getByLabelText("Lớp mới"), "class-thieu-2b");

    expect(dialog).toHaveTextContent("Anh Giuse Trần Văn B");
    expect(dialog).toHaveTextContent("Ấu 1A");
    expect(dialog).toHaveTextContent("Thiếu 2B");
    expect(dialog).toHaveTextContent(/Vai trò đăng nhập chuyển từ/i);
    expect(dialog).toHaveTextContent(/Không phải đăng nhập lại/i);
  });

  it("ngày kết thúc lớp cũ là ngày LIỀN TRƯỚC ngày hiệu lực, không phải cùng ngày", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Chuyển lớp" }));
    await user.selectOptions(screen.getByLabelText("Lớp mới"), "class-thieu-2b");

    const effective = screen.getByLabelText("Ngày hiệu lực");
    await user.clear(effective);
    await user.type(effective, "2026-11-01");

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("31/10/2026");
    expect(dialog).toHaveTextContent("01/11/2026");
  });

  it("hồ sơ CÓ tài khoản thì nói rõ vai trò đăng nhập đi đâu — kể cả khi người xem không được thấy khối tài khoản", async () => {
    // 🔴 Lỗi thật E2E bắt được: `hasAccount` từng suy từ `staff.account`, mà khối
    // đó chỉ nạp cho vai trò đọc-toàn-cục (D-104). Trưởng ngành vì thế đọc được
    // câu "hồ sơ này chưa có tài khoản nên không có vai trò nào bị đổi" về một
    // người đang đăng nhập hằng ngày — sai ở đúng câu người ta dựa vào để quyết
    // định có bấm hay không. `hasAccount` nay là trường riêng, suy từ `profile_id`.
    const user = userEvent.setup();
    renderPanel({ canWrite: false, canTransfer: true, hasAccount: true });
    await user.click(screen.getByRole("button", { name: "Chuyển lớp" }));
    await user.selectOptions(screen.getByLabelText("Lớp mới"), "class-thieu-2b");

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(/Vai trò đăng nhập chuyển từ/i);
    expect(dialog).not.toHaveTextContent(/chưa có tài khoản đăng nhập/i);
  });

  it("hồ sơ KHÔNG có tài khoản thì nói đúng là không có vai trò nào bị đổi", async () => {
    const user = userEvent.setup();
    renderPanel({ hasAccount: false });
    await user.click(screen.getByRole("button", { name: "Chuyển lớp" }));
    await user.selectOptions(screen.getByLabelText("Lớp mới"), "class-thieu-2b");

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(/chưa có tài khoản đăng nhập/i);
    expect(dialog).not.toHaveTextContent(/Vai trò đăng nhập chuyển từ/i);
  });

  it("ngày hiệu lực mặc định KHÔNG bao giờ sớm hơn ngày bắt đầu phân công", async () => {
    // 🔴 Lỗi thật E2E bắt được: năm học được tạo TRƯỚC khai giảng nên phân công
    // có `starts_on` ở tương lai. Điền sẵn "hôm nay" là điền sẵn một giá trị mà
    // cơ sở dữ liệu chắc chắn từ chối — người dùng bấm xác nhận rồi ăn lỗi cho
    // một giá trị họ không hề chọn. `min` của ô ngày không tự sửa giá trị này.
    const user = userEvent.setup();
    const future = "2099-09-01";
    renderPanel({ activeAssignment: { ...ACTIVE, startsOn: future } });
    await user.click(screen.getByRole("button", { name: "Chuyển lớp" }));

    expect(screen.getByLabelText("Ngày hiệu lực")).toHaveValue(future);
    expect(screen.getByLabelText("Ngày kết thúc phân công")).toHaveValue(future);
  });

  it("lớp đích trong danh sách KHÔNG chứa lớp đang phục vụ", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Chuyển lớp" }));
    const options = Array.from(screen.getByLabelText("Lớp mới").querySelectorAll("option"));
    const values = options.map((option) => option.getAttribute("value"));
    expect(values).not.toContain("class-au-1a");
    expect(values).toContain("class-thieu-2b");
  });

  it("chưa chọn lớp thì nút xác nhận bị khoá — không gửi payload rỗng", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Chuyển lớp" }));
    expect(screen.getByRole("button", { name: "Xác nhận chuyển lớp" })).toBeDisabled();
    expect(transferClassStaff).not.toHaveBeenCalled();
  });

  it("xác nhận gửi đúng bốn trường, KHÔNG có trường vai trò (trần D-102)", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Chuyển lớp" }));
    await user.selectOptions(screen.getByLabelText("Lớp mới"), "class-thieu-2b");
    await user.selectOptions(screen.getByLabelText("Vai trò trong lớp mới"), "representative");
    await user.click(screen.getByRole("button", { name: "Xác nhận chuyển lớp" }));

    expect(transferClassStaff).toHaveBeenCalledTimes(1);
    const payload = transferClassStaff.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(["assignmentId", "capacity", "effectiveOn", "newClassId"]);
    expect(payload.assignmentId).toBe("csa-1");
    expect(payload.newClassId).toBe("class-thieu-2b");
    expect(payload.capacity).toBe("representative");
  });

  it("lỗi từ máy chủ hiện nguyên văn trong hộp thoại, không nuốt (5W-05)", async () => {
    transferClassStaff.mockResolvedValueOnce({
      ok: false,
      message: "Lớp Thiếu 2B đã có Giáo lý viên đại diện. Hãy kết thúc phân công của người hiện tại trước.",
    });
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Chuyển lớp" }));
    await user.selectOptions(screen.getByLabelText("Lớp mới"), "class-thieu-2b");
    await user.click(screen.getByRole("button", { name: "Xác nhận chuyển lớp" }));

    expect(await screen.findByText(/đã có Giáo lý viên đại diện/)).toBeInTheDocument();
    // Hộp thoại KHÔNG đóng khi lỗi — đóng đi là mất luôn câu lỗi và các ô đã điền.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("phạm vi nút theo vai trò người xem", () => {
  it("Trưởng ngành (chỉ canTransfer) thấy Chuyển lớp, KHÔNG thấy Kết thúc phân công", () => {
    renderPanel({ canWrite: false, canTransfer: true });
    expect(screen.getByRole("button", { name: "Chuyển lớp" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Kết thúc phân công" })).not.toBeInTheDocument();
  });

  it("chưa có phân công thì không có gì để chuyển — chỉ hiện biểu mẫu phân công", () => {
    renderPanel({ activeAssignment: null });
    expect(screen.queryByRole("button", { name: "Chuyển lớp" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Lớp")).toBeInTheDocument();
  });

  it("không còn lớp nào khác thì nút Chuyển lớp bị khoá kèm lời giải thích", () => {
    renderPanel({ classes: [{ id: "class-au-1a", name: "Ấu 1A" }] });
    expect(screen.getByRole("button", { name: "Chuyển lớp" })).toBeDisabled();
    expect(screen.getByText(/Chưa có lớp nào khác đang hoạt động/)).toBeInTheDocument();
  });
});
