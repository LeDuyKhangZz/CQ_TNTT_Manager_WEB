import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { StudentFeedback } from "@/features/students/student-feedback";

/**
 * M03-C · TB-F12 — khối "Người giám hộ" trên trang chi tiết thiếu nhi.
 *
 * 🔴 Luồng F12 chấm **31/75 — thấp nhất module — vì nó KHÔNG TỒN TẠI**:
 * `updateGuardian` viết xong từ Phase 2 mà không màn hình nào gọi, nên nhập sai
 * số điện thoại phụ huynh thì không có nơi nào sửa (C13/C14 bị chấm 1 với lý do
 * *"không có UI để đánh giá"*).
 *
 * Bộ test giữ ba điều:
 *   1. Sửa liên lạc là thao tác **thường ngày**: một nút, không hỏi.
 *   2. Đổi người giám hộ là thao tác **đổi quyền đọc**: luôn qua hộp xác nhận
 *      nêu **đủ ba cái tên** (AC-F12-02).
 *   3. Hai thao tác dùng **một** `useActionState` — bài học M03-A: hai state
 *      riêng sẽ để câu "Đã lưu thông tin liên lạc của bà A" đứng nguyên sau khi
 *      người dùng vừa đổi em sang ông B.
 */

const panelAction = vi.fn(async (formData: FormData): Promise<StudentFeedback> => {
  if (String(formData.get("intent") ?? "") === "change") {
    return {
      tone: "success",
      text: "Đã đổi người giám hộ của Maria Phạm Thị Hạnh sang Ông Nguyễn Văn C. Từ bây giờ chỉ phụ huynh này xem được em trong cổng phụ huynh.",
    };
  }
  return { tone: "success", text: "Đã lưu thông tin liên lạc của Bà Trần Thị B." };
});

function lastPayload(): FormData {
  const calls = panelAction.mock.calls;
  return calls[calls.length - 1][0];
}

vi.mock("@/features/guardians/server/actions", () => ({
  guardianPanelFormAction: (_previous: unknown, formData: FormData) => panelAction(formData),
}));

const { GuardianPanel } = await import("@/features/students/components/guardian-panel");

const GUARDIAN = {
  id: "guardian-1",
  fullName: "Bà Trần Thị B",
  phone: "0901234567",
  address: "12 Trần Bình Trọng",
};

const OPTIONS = [
  { id: "guardian-1", fullName: "Bà Trần Thị B", phone: "0901234567" },
  { id: "guardian-2", fullName: "Ông Nguyễn Văn C", phone: "0907654321" },
];

function renderPanel(overrides: Partial<Parameters<typeof GuardianPanel>[0]> = {}) {
  return render(
    <GuardianPanel
      studentId="student-1"
      studentName="Maria Phạm Thị Hạnh"
      guardian={GUARDIAN}
      options={OPTIONS}
      canWrite
      {...overrides}
    />,
  );
}

beforeEach(() => {
  panelAction.mockClear();
});

describe("BR-M03-N15 · sửa được thông tin liên lạc (lỗi F12)", () => {
  it("biểu mẫu nạp sẵn số điện thoại hiện tại", () => {
    renderPanel();
    expect(screen.getByLabelText("Điện thoại")).toHaveValue("0901234567");
    expect(screen.getByLabelText("Họ tên phụ huynh")).toHaveValue("Bà Trần Thị B");
  });

  it("lưu là gửi ngay, KHÔNG hỏi — đây là thao tác thường ngày", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.clear(screen.getByLabelText("Điện thoại"));
    await user.type(screen.getByLabelText("Điện thoại"), "0912000000");
    await user.click(screen.getByRole("button", { name: "Lưu thông tin liên lạc" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(lastPayload().get("phone")).toBe("0912000000");
    expect(lastPayload().get("guardianId")).toBe("guardian-1");
    expect(await screen.findByRole("status")).toHaveTextContent("Đã lưu thông tin liên lạc");
  });

  it("BR-M03-N17 — có lựa chọn ngừng dùng, vì gia đình rời xứ đoàn cũng phải đóng được", () => {
    renderPanel();
    const select = screen.getByLabelText("Trạng thái hồ sơ phụ huynh");
    const values = Array.from(select.querySelectorAll("option")).map((option) => option.value);
    expect(values).toEqual(["active", "inactive"]);
  });
});

describe("🔴 AC-F12-02 · đổi người giám hộ là thao tác ĐỔI QUYỀN ĐỌC", () => {
  it("bấm đổi mở hộp xác nhận nêu đủ BA cái tên, CHƯA gửi gì", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Đổi người giám hộ" }));

    expect(panelAction).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Maria Phạm Thị Hạnh");
    expect(dialog).toHaveTextContent("Bà Trần Thị B");
    expect(dialog).toHaveTextContent("Ông Nguyễn Văn C");
  });

  it("xác nhận rồi mới gửi, và gửi nhánh `change`", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Đổi người giám hộ" }));
    // Nút xác nhận mang chữ KHÁC nút mở hộp thoại — trùng nhau là hai điều khiển
    // cùng tên trên một trang.
    await user.click(await screen.findByRole("button", { name: "Xác nhận đổi" }));

    expect(panelAction).toHaveBeenCalledTimes(1);
    expect(lastPayload().get("intent")).toBe("change");
    expect(lastPayload().get("guardianId")).toBe("guardian-2");
    expect(lastPayload().get("studentId")).toBe("student-1");
  });

  it("người giám hộ HIỆN TẠI không nằm trong ô chọn — đổi sang chính mình là vô nghĩa", () => {
    renderPanel();
    const select = screen.getByLabelText("Đổi sang người giám hộ khác");
    const values = Array.from(select.querySelectorAll("option")).map((option) => option.value);
    expect(values).toEqual(["guardian-2"]);
  });

  it("không có phụ huynh nào khác thì KHÔNG dựng ra một biểu mẫu rỗng", () => {
    renderPanel({ options: [OPTIONS[0]] });
    expect(screen.queryByLabelText("Đổi sang người giám hộ khác")).not.toBeInTheDocument();
  });
});

describe("phạm vi hiển thị", () => {
  it("người chỉ ĐỌC thấy thông tin liên lạc nhưng không có biểu mẫu nào", () => {
    renderPanel({ canWrite: false });
    expect(screen.getByText("Bà Trần Thị B")).toBeInTheDocument();
    expect(screen.queryByLabelText("Điện thoại")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đổi người giám hộ" })).not.toBeInTheDocument();
  });

  it("em chưa gắn phụ huynh: nói thẳng ra, không hiện một biểu mẫu trống", () => {
    renderPanel({ guardian: null });
    expect(screen.getByText(/chưa gắn với người giám hộ nào/)).toBeInTheDocument();
  });
});
