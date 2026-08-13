import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { StudentFeedback } from "@/features/students/student-feedback";

/**
 * M03-C · TB-F06 — khối "Trạng thái hồ sơ" trên trang chi tiết thiếu nhi.
 *
 * 🔴 Bộ test này canh **lỗi F06 (42/75)** ở tầng giao diện. Trước đợt này ô
 * "Trạng thái" nằm ngay cạnh ô "Điện thoại" trong biểu mẫu "Cập nhật hồ sơ",
 * chung một nút "Lưu thay đổi" — điểm trừ C5 = 2 của biên bản audit. Nghĩa là
 * **lưu trữ một em là một cú chọn nhầm trong `<select>`, không hỏi gì**.
 *
 * Bốn điều bộ test này giữ:
 *   1. Chọn "Lưu trữ"/"Đã rút" **phải đi qua hộp xác nhận**, và hộp ấy nêu
 *      **tên em + tên lớp** (`11` §5).
 *   2. Ô "Đồng thời kết thúc ghi danh" chỉ hiện khi em **thật sự** còn ghi danh
 *      mở — hiện luôn là mời người dùng tick một ô không có tác dụng.
 *   3. `docs/05` §5 — người không có quyền lưu trữ **không thấy** hai lựa chọn
 *      ấy trong ô chọn.
 *   4. Biểu mẫu gửi đúng ô ẩn: sai một ô là đóng ghi danh của một em nhầm lý do.
 */

const feedback: StudentFeedback = {
  tone: "success",
  text: 'Đã chuyển hồ sơ của Maria Phạm Thị Hạnh sang "Lưu trữ". Đã kết thúc ghi danh ở lớp Ấu 1A; em không còn trong sĩ số lớp.',
};

const statusFormAction = vi.fn(async (_formData: FormData): Promise<StudentFeedback> => feedback);

function lastPayload(): FormData {
  const calls = statusFormAction.mock.calls;
  return calls[calls.length - 1][0];
}

vi.mock("@/features/students/server/actions", () => ({
  setStudentStatusFormAction: (_previous: unknown, formData: FormData) =>
    statusFormAction(formData),
}));

const { StudentStatusPanel } = await import(
  "@/features/students/components/student-status-panel"
);

function renderPanel(overrides: Partial<Parameters<typeof StudentStatusPanel>[0]> = {}) {
  return render(
    <StudentStatusPanel
      studentId="student-1"
      studentName="Maria Phạm Thị Hạnh"
      currentStatus="active"
      openClassName="Ấu 1A"
      canArchive
      today="2026-07-28"
      {...overrides}
    />,
  );
}

beforeEach(() => {
  statusFormAction.mockClear();
});

describe("🔴 AC-F06-01 · lưu trữ phải HỎI, và hỏi bằng tên riêng", () => {
  it("chọn Lưu trữ rồi bấm: hộp xác nhận mở ra, CHƯA gửi gì", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.selectOptions(screen.getByLabelText("Trạng thái hồ sơ"), "archived");
    await user.click(screen.getByRole("button", { name: "Đổi trạng thái hồ sơ" }));

    expect(statusFormAction).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Maria Phạm Thị Hạnh");
    expect(dialog).toHaveTextContent("Ấu 1A");
  });

  it("hộp xác nhận nói ra hệ quả PHÂN QUYỀN của việc lưu trữ (S-11)", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.selectOptions(screen.getByLabelText("Trạng thái hồ sơ"), "archived");
    await user.click(screen.getByRole("button", { name: "Đổi trạng thái hồ sơ" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Giáo lý viên");
  });

  it("xác nhận rồi mới gửi, và gửi đủ ô ẩn", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.selectOptions(screen.getByLabelText("Trạng thái hồ sơ"), "archived");
    await user.click(
      screen.getByLabelText("Đồng thời kết thúc ghi danh ở lớp Ấu 1A"),
    );
    await user.click(screen.getByRole("button", { name: "Đổi trạng thái hồ sơ" }));
    await user.click(await screen.findByRole("button", { name: "Đổi trạng thái" }));

    expect(statusFormAction).toHaveBeenCalledTimes(1);
    const payload = lastPayload();
    expect(payload.get("studentId")).toBe("student-1");
    expect(payload.get("status")).toBe("archived");
    expect(payload.get("closeEnrollment")).toBe("on");
    expect(payload.get("endedOn")).toBe("2026-07-28");
  });

  /**
   * 🔴 BR-M03-N12 — mặc định KHÔNG tick. Một mặc định `true` sẽ đóng ghi danh
   * của một em vì người dùng quên bỏ tick, và cơ sở dữ liệu sẽ không cản được:
   * người dùng đã "đồng ý" rồi.
   */
  it("ô 'Đồng thời kết thúc ghi danh' mặc định KHÔNG được tick", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.selectOptions(screen.getByLabelText("Trạng thái hồ sơ"), "archived");
    expect(
      screen.getByLabelText("Đồng thời kết thúc ghi danh ở lớp Ấu 1A"),
    ).not.toBeChecked();
  });

  it("câu phản hồi hiện ra sau khi ghi xong", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.selectOptions(screen.getByLabelText("Trạng thái hồ sơ"), "archived");
    await user.click(screen.getByRole("button", { name: "Đổi trạng thái hồ sơ" }));
    await user.click(await screen.findByRole("button", { name: "Đổi trạng thái" }));
    expect(await screen.findByRole("status")).toHaveTextContent("không còn trong sĩ số");
  });
});

describe("AC-F06-01 · cảnh báo chỉ hiện khi thật sự có ghi danh mở", () => {
  it("em chưa xếp lớp: không có ô tick, không có ô lý do", async () => {
    const user = userEvent.setup();
    renderPanel({ openClassName: null });
    await user.selectOptions(screen.getByLabelText("Trạng thái hồ sơ"), "archived");
    expect(screen.queryByLabelText(/Đồng thời kết thúc ghi danh/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Lý do kết thúc")).not.toBeInTheDocument();
  });

  it("D-130: chọn Tạm nghỉ KHÔNG hỏi lý do kết thúc — đó là thao tác khác hẳn", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.selectOptions(
      screen.getByLabelText("Trạng thái hồ sơ"),
      "temporarily_inactive",
    );
    expect(screen.queryByLabelText("Lý do kết thúc")).not.toBeInTheDocument();
  });

  it("D-130: hộp xác nhận của Tạm nghỉ nói em GIỮ chỗ, không rời lớp", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.selectOptions(
      screen.getByLabelText("Trạng thái hồ sơ"),
      "temporarily_inactive",
    );
    await user.click(screen.getByRole("button", { name: "Đổi trạng thái hồ sơ" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("giữ nguyên chỗ");
    expect(dialog).not.toHaveTextContent("rời khỏi sĩ số");
  });
});

describe("🔴 docs/05 §5 · lưu trữ hẹp hơn sửa hồ sơ", () => {
  it("người không có quyền lưu trữ KHÔNG thấy hai lựa chọn ấy", () => {
    renderPanel({ canArchive: false });
    const select = screen.getByLabelText("Trạng thái hồ sơ");
    const values = Array.from(select.querySelectorAll("option")).map((option) => option.value);
    expect(values).toEqual(["active", "temporarily_inactive"]);
  });

  it("họ VẪN đổi được sang Tạm nghỉ — việc mục vụ hằng ngày của vai trò ngành", async () => {
    const user = userEvent.setup();
    renderPanel({ canArchive: false });
    await user.selectOptions(
      screen.getByLabelText("Trạng thái hồ sơ"),
      "temporarily_inactive",
    );
    await user.click(screen.getByRole("button", { name: "Đổi trạng thái hồ sơ" }));
    await user.click(await screen.findByRole("button", { name: "Đổi trạng thái" }));
    expect(lastPayload().get("status")).toBe("temporarily_inactive");
  });
});
