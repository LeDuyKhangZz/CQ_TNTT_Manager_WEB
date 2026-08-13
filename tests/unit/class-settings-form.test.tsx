import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ClassFeedback } from "@/features/classes/class-feedback";

/**
 * M02-B / I6 · TB-F08 — màn hình "Cài đặt lớp".
 *
 * Ba điều bộ test này giữ, theo đúng thứ tự quan trọng:
 *
 *   1. **Hộp xác nhận mở đúng lúc cần** (BR-M02-N11). Đóng lớp còn em đang sinh hoạt
 *      là thao tác có hậu quả và phải nêu **số em + tên lớp**. Nhưng đổi phòng sinh
 *      hoạt thì không được hỏi gì — hộp xác nhận cho mọi lượt lưu là cách nhanh nhất
 *      để người dùng bấm "Xác nhận" theo phản xạ, và lúc đó nó thành đồ trang trí.
 *   2. **Kết quả được nói ra** (D-61 / AC-M02-04) — kể cả khi thất bại vì RLS chặn
 *      (0 dòng, không lỗi — SW-04).
 *   3. **Lưu đúng ba trường** và không hơn (R6).
 */

let nextFeedback: ClassFeedback = { tone: "success", text: "Đã lưu cài đặt lớp. Trạng thái hiện tại: Đã đóng." };
const updateClassFormAction = vi.fn(
  async (_previous: ClassFeedback | null, _formData: FormData): Promise<ClassFeedback> => nextFeedback,
);

vi.mock("@/features/classes/server/actions", () => ({
  updateClassFormAction: (previous: unknown, formData: unknown) =>
    updateClassFormAction(previous as never, formData as never),
}));

const { ClassSettingsForm } = await import("@/features/classes/components/class-settings-form");

function renderForm(overrides: Partial<Parameters<typeof ClassSettingsForm>[0]> = {}) {
  return render(
    <ClassSettingsForm
      classId="class-au-1a"
      className="Ấu 1A"
      status="active"
      meetingLocation="Phòng 1"
      notes={null}
      openEnrollmentCount={12}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  updateClassFormAction.mockClear();
  nextFeedback = { tone: "success", text: "Đã lưu cài đặt lớp. Trạng thái hiện tại: Đã đóng." };
});

describe("hộp xác nhận chỉ mở khi thật cần (BR-M02-N11)", () => {
  it("đổi phòng sinh hoạt: lưu thẳng, không hỏi gì", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(screen.getByLabelText("Phòng sinh hoạt"));
    await user.type(screen.getByLabelText("Phòng sinh hoạt"), "Phòng 5");
    await user.click(screen.getByRole("button", { name: "Lưu cài đặt lớp" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(updateClassFormAction).toHaveBeenCalledTimes(1);
  });

  it("đóng lớp còn em đang sinh hoạt: hỏi trước, nêu SỐ EM và TÊN LỚP", async () => {
    const user = userEvent.setup();
    renderForm({ openEnrollmentCount: 12 });
    await user.selectOptions(screen.getByLabelText("Trạng thái lớp"), "closed");
    await user.click(screen.getByRole("button", { name: "Lưu cài đặt lớp" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Ấu 1A");
    expect(dialog).toHaveTextContent("12 em đang sinh hoạt");
    // Điểm cốt lõi của BR-M02-N11: đóng lớp KHÔNG kết thúc ghi danh đang mở.
    expect(dialog).toHaveTextContent(/không.*kết thúc ghi danh/i);
    // Chưa xác nhận thì chưa ghi gì.
    expect(updateClassFormAction).not.toHaveBeenCalled();
  });

  it("lớp trống thì đóng thẳng, không hỏi — không có ai bị ảnh hưởng", async () => {
    const user = userEvent.setup();
    renderForm({ openEnrollmentCount: 0 });
    await user.selectOptions(screen.getByLabelText("Trạng thái lớp"), "closed");
    await user.click(screen.getByRole("button", { name: "Lưu cài đặt lớp" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(updateClassFormAction).toHaveBeenCalledTimes(1);
  });

  it("huỷ hộp xác nhận thì không ghi gì", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.selectOptions(screen.getByLabelText("Trạng thái lớp"), "inactive");
    await user.click(screen.getByRole("button", { name: "Lưu cài đặt lớp" }));
    await user.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(updateClassFormAction).not.toHaveBeenCalled();
  });

  it("hộp thoại nêu ĐÚNG trạng thái sắp đặt, không phải trạng thái hiện tại", async () => {
    const user = userEvent.setup();
    renderForm({ status: "active" });
    await user.selectOptions(screen.getByLabelText("Trạng thái lớp"), "inactive");
    await user.click(screen.getByRole("button", { name: "Lưu cài đặt lớp" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Tạm ngưng");
  });
});

describe("mọi thao tác ghi nói ra kết quả (D-61 / AC-M02-04)", () => {
  it("thành công: nêu trạng thái vừa lưu, không phải 'Đã lưu' suông", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "Lưu cài đặt lớp" }));
    expect(await screen.findByText(/Trạng thái hiện tại: Đã đóng/)).toBeInTheDocument();
  });

  it("RLS chặn (0 dòng, không lỗi) vẫn phải hiện ra là THẤT BẠI — SW-04", async () => {
    nextFeedback = {
      tone: "danger",
      text: "Không có dòng nào được cập nhật. Lớp có thể không còn tồn tại, hoặc bạn không đủ quyền sửa nó.",
    };
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "Lưu cài đặt lớp" }));
    const message = await screen.findByRole("alert");
    expect(message).toHaveTextContent("Không có dòng nào được cập nhật");
  });
});

describe("chỉ gửi đúng ba trường sửa được (R6)", () => {
  it("gửi id lớp, trạng thái, phòng sinh hoạt, ghi chú — không gửi gì khác", async () => {
    const user = userEvent.setup();
    renderForm({ notes: "Ghi chú cũ" });
    await user.click(screen.getByRole("button", { name: "Lưu cài đặt lớp" }));
    const formData = updateClassFormAction.mock.calls[0]![1];
    expect([...formData.keys()].sort()).toEqual([
      "classId",
      "meetingLocation",
      "notes",
      "status",
    ]);
    expect(formData.get("classId")).toBe("class-au-1a");
    expect(formData.get("notes")).toBe("Ghi chú cũ");
  });

  it("nạp sẵn giá trị hiện tại để người dùng không phải gõ lại", () => {
    renderForm({ status: "inactive", meetingLocation: "Hội trường", notes: "Lớp ghép" });
    expect(screen.getByLabelText("Trạng thái lớp")).toHaveValue("inactive");
    expect(screen.getByLabelText("Phòng sinh hoạt")).toHaveValue("Hội trường");
    expect(screen.getByLabelText("Ghi chú")).toHaveValue("Lớp ghép");
  });
});
