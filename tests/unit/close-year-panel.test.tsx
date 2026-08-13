import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AdminFeedback } from "@/features/academic-years/admin-feedback";

/**
 * M02-C / I7 · TB-F09 · D-73 — khối "Đóng năm học" ở `/admin`.
 *
 * Chốt sổ là thao tác **một chiều**: hệ thống không có luồng mở lại năm học. Bộ test
 * này giữ đúng ba lớp ma sát tương xứng với điều đó, và giữ luôn cái bẫy ngược lại —
 * ma sát **không được** biến thành hàng rào giả:
 *
 *   1. Bảng kiểm nêu **con số thật** do cơ sở dữ liệu đếm (WF-16 bước 1–3).
 *   2. Phải **gõ lại đúng mã năm học** mới mở được nút (BR-M02-N08).
 *   3. `ConfirmDialog` nêu hậu quả **bằng tên riêng** (`11` §5), gồm cả điều dễ bị bỏ
 *      qua nhất: sau khi đóng, hệ thống **không còn năm học hiện hành nào**.
 *
 * 🔴 Nút bị khoá KHÔNG phải biện pháp bảo vệ (09: "ẩn nút không phải authorization").
 * Chốt chặn thật là `public.close_academic_year`, và pgTAP `034` kiểm nó bằng JWT
 * thật. Bộ test này chỉ canh phần giao diện không **mời** người dùng bấm một lượt
 * chắc chắn bị từ chối.
 */

let nextFeedback: AdminFeedback = {
  tone: "success",
  text: "Đã chốt sổ năm học. Hệ thống hiện không còn năm học hiện hành.",
};
const closeAcademicYearFormAction = vi.fn(
  async (_previous: AdminFeedback | null, _formData: FormData): Promise<AdminFeedback> => nextFeedback,
);

vi.mock("@/features/academic-years/server/actions", () => ({
  closeAcademicYearFormAction: (previous: unknown, formData: unknown) =>
    closeAcademicYearFormAction(previous as never, formData as never),
}));

const { CloseYearPanel } = await import("@/features/academic-years/components/close-year-panel");

const CLEAN = { openEnrollments: 0, unlockedGradebooks: 0, openSessions: 0 };
const DIRTY = { openEnrollments: 37, unlockedGradebooks: 0, openSessions: 2 };

function renderPanel(overrides: Partial<Parameters<typeof CloseYearPanel>[0]> = {}) {
  return render(
    <CloseYearPanel
      academicYearId="year-2026"
      code="2026-2027"
      name="Năm học 2026-2027"
      openWork={CLEAN}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  closeAcademicYearFormAction.mockClear();
  nextFeedback = {
    tone: "success",
    text: "Đã chốt sổ năm học. Hệ thống hiện không còn năm học hiện hành.",
  };
});

describe("bảng kiểm tiền điều kiện (WF-16 bước 1–3)", () => {
  it("còn việc tồn đọng: nêu từng mục kèm con số thật", () => {
    renderPanel({ openWork: DIRTY });
    expect(screen.getByText("37 ghi danh đang mở")).toBeInTheDocument();
    expect(screen.getByText("2 buổi điểm danh chưa chốt")).toBeInTheDocument();
    // Mục đã xong thì KHÔNG in dòng "0 …" — bảng kiểm luôn ba dòng thì người dùng
    // phải đọc số mới biết có việc gì.
    expect(screen.queryByText(/0 bảng điểm/)).not.toBeInTheDocument();
  });

  it("không còn việc gì: nói thẳng ra, không để trống", () => {
    renderPanel({ openWork: CLEAN });
    expect(screen.getByText(/Không còn việc tồn đọng/)).toBeInTheDocument();
  });

  it("không đọc được bảng kiểm ⇒ KHÔNG cho chốt sổ, và nói vì sao", async () => {
    // 🔴 Bài quan trọng nhất của khối này: hình dạng lạ phải là "chưa biết", không
    // phải "đã xong". Bịa ra số 0 ở đây là hứa "không còn việc tồn đọng" trước một
    // RPC chắc chắn từ chối, và người dùng sẽ đi tìm lỗi ở chỗ khác hẳn.
    const user = userEvent.setup();
    renderPanel({ openWork: null });
    expect(screen.getByText(/Chưa đọc được bảng kiểm/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Gõ lại mã năm học/), "2026-2027");
    expect(screen.getByRole("button", { name: "Đóng năm học" })).toBeDisabled();
  });
});

describe("gõ lại mã năm học (BR-M02-N08)", () => {
  it("chưa gõ thì nút khoá", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: "Đóng năm học" })).toBeDisabled();
  });

  it("gõ sai mã thì vẫn khoá", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByLabelText(/Gõ lại mã năm học/), "2027-2028");
    expect(screen.getByRole("button", { name: "Đóng năm học" })).toBeDisabled();
  });

  it("gõ đúng mã thì mở nút", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByLabelText(/Gõ lại mã năm học/), "2026-2027");
    expect(screen.getByRole("button", { name: "Đóng năm học" })).toBeEnabled();
  });
});

describe("còn việc tồn đọng thì bắt ghi lý do (BR-M02-N05)", () => {
  it("có việc dở: ô lý do xuất hiện và nút vẫn khoá cho tới khi ghi", async () => {
    const user = userEvent.setup();
    renderPanel({ openWork: DIRTY });
    await user.type(screen.getByLabelText(/Gõ lại mã năm học/), "2026-2027");
    expect(screen.getByRole("button", { name: "Đóng năm học" })).toBeDisabled();

    await user.type(screen.getByLabelText(/Lý do chốt sổ/), "Đã hết năm học");
    expect(screen.getByRole("button", { name: "Đóng năm học" })).toBeEnabled();
  });

  it("không còn việc dở: KHÔNG hỏi lý do", async () => {
    const user = userEvent.setup();
    renderPanel({ openWork: CLEAN });
    expect(screen.queryByLabelText(/Lý do chốt sổ/)).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/Gõ lại mã năm học/), "2026-2027");
    expect(screen.getByRole("button", { name: "Đóng năm học" })).toBeEnabled();
  });
});

describe("hộp xác nhận nêu hậu quả bằng tên riêng (11 §5)", () => {
  it("nêu tên năm học, ai còn ghi được, và việc hết năm hiện hành", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByLabelText(/Gõ lại mã năm học/), "2026-2027");
    await user.click(screen.getByRole("button", { name: "Đóng năm học" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Năm học 2026-2027");
    // D-117 — Super Admin là ngoại lệ duy nhất.
    expect(dialog).toHaveTextContent("Quản trị viên hệ thống");
    // Điều dễ bị bỏ qua nhất, và là thứ người dùng phát hiện muộn nhất nếu không nói.
    expect(dialog).toHaveTextContent(/không còn năm học hiện hành nào/);
    // Chưa xác nhận thì chưa ghi gì.
    expect(closeAcademicYearFormAction).not.toHaveBeenCalled();
  });

  it("còn việc tồn đọng thì hộp thoại nhắc lại con số", async () => {
    const user = userEvent.setup();
    renderPanel({ openWork: DIRTY });
    await user.type(screen.getByLabelText(/Gõ lại mã năm học/), "2026-2027");
    await user.type(screen.getByLabelText(/Lý do chốt sổ/), "Đã hết năm học");
    await user.click(screen.getByRole("button", { name: "Đóng năm học" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("37 ghi danh đang mở");
  });

  it("huỷ thì không ghi gì", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByLabelText(/Gõ lại mã năm học/), "2026-2027");
    await user.click(screen.getByRole("button", { name: "Đóng năm học" }));
    await user.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(closeAcademicYearFormAction).not.toHaveBeenCalled();
  });
});

describe("thao tác ghi nói ra kết quả (D-61 / AC-M02-04)", () => {
  it("xác nhận rồi thì gửi đúng ba trường và hiện câu thành công", async () => {
    const user = userEvent.setup();
    renderPanel({ openWork: DIRTY });
    await user.type(screen.getByLabelText(/Gõ lại mã năm học/), "2026-2027");
    await user.type(screen.getByLabelText(/Lý do chốt sổ/), "Đã hết năm học");
    await user.click(screen.getByRole("button", { name: "Đóng năm học" }));
    await user.click(screen.getByRole("button", { name: "Chốt sổ năm học" }));

    expect(closeAcademicYearFormAction).toHaveBeenCalledTimes(1);
    const formData = closeAcademicYearFormAction.mock.calls[0]![1];
    expect([...formData.keys()].sort()).toEqual(["academicYearId", "confirmCode", "reason"]);
    expect(formData.get("academicYearId")).toBe("year-2026");
    expect(formData.get("reason")).toBe("Đã hết năm học");
    expect(await screen.findByText(/không còn năm học hiện hành/)).toBeInTheDocument();
  });

  it("bị từ chối vì còn việc tồn đọng: hiện đúng con số, không phải câu chung", async () => {
    nextFeedback = {
      tone: "danger",
      text: "Năm học còn 37 ghi danh đang mở · 2 buổi điểm danh chưa chốt. Hãy hoàn tất, hoặc ghi lý do rồi bấm lại để chốt sổ ngay.",
    };
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByLabelText(/Gõ lại mã năm học/), "2026-2027");
    await user.click(screen.getByRole("button", { name: "Đóng năm học" }));
    await user.click(screen.getByRole("button", { name: "Chốt sổ năm học" }));

    const message = await screen.findByRole("alert");
    expect(message).toHaveTextContent("37 ghi danh đang mở");
  });
});
