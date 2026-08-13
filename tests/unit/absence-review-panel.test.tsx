import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PendingAbsenceRequest } from "@/features/attendance/server/queries";

/**
 * M05-B · TB-06 — màn hình Giáo lý viên cho đơn xin nghỉ (AC-F13-1, AC-F13-2).
 *
 * 🔴 Đây là màn hình cho một hàm **đã tồn tại từ Phase 3 mà chưa ai gọi**
 * (`acknowledgeAbsenceRequest`, audit F13-I2). Vì vậy bài đầu tiên không kiểm
 * giao diện mà kiểm đúng một điều: **có bấm thì hàm ấy có chạy không**, và chạy
 * với đúng tham số nào.
 */
const acknowledge = vi.fn(async (_input: { requestId: string; staffNote: string | null }) => ({
  ok: true as const,
  data: undefined,
}));
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("@/features/absence-requests/server/actions", () => ({
  acknowledgeAbsenceRequest: (input: { requestId: string; staffNote: string | null }) =>
    acknowledge(input),
}));

const { AbsenceReviewPanel } = await import(
  "@/features/absence-requests/components/absence-review-panel"
);

const REQUESTS: PendingAbsenceRequest[] = [
  {
    id: "req-1",
    studentLabel: "Maria Trần Thị Hoa",
    className: "Ấu 1A",
    absenceDate: "2026-08-09",
    meetingType: "sunday",
    reason: "Cháu về quê giỗ ông",
  },
  {
    id: "req-2",
    studentLabel: "Anna Lê Bảo Trân",
    className: "Ấu 1A",
    absenceDate: "2026-08-06",
    meetingType: "thursday",
    reason: "Cháu sốt",
  },
];

beforeEach(() => {
  acknowledge.mockClear();
  refresh.mockClear();
});

describe("AC-F13-1 — thấy đơn mà KHÔNG cần mở buổi", () => {
  it("liệt kê từng đơn kèm tên em, lớp, buổi và lý do", () => {
    render(<AbsenceReviewPanel requests={REQUESTS} canReview />);

    expect(screen.getByText("Maria Trần Thị Hoa")).toBeInTheDocument();
    expect(screen.getByText("Cháu về quê giỗ ông")).toBeInTheDocument();
    expect(screen.getByText(/Ấu 1A · Chúa nhật · 09\/08\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Ấu 1A · Thứ Năm · 06\/08\/2026/)).toBeInTheDocument();
  });

  it("không có đơn nào thì dùng trạng thái rỗng chuẩn, nói rõ phạm vi", () => {
    render(<AbsenceReviewPanel requests={[]} canReview />);

    expect(screen.getByText("Chưa có đơn xin nghỉ nào đang chờ")).toBeInTheDocument();
    expect(screen.getByText(/các lớp bạn phụ trách/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ghi nhận" })).not.toBeInTheDocument();
  });
});

describe("AC-F13-2 — ghi nhận đơn", () => {
  it("🔴 bấm Ghi nhận thì GỌI action — luồng chết từ Phase 3 nay sống", async () => {
    const user = userEvent.setup();
    render(<AbsenceReviewPanel requests={REQUESTS} canReview />);

    await user.click(screen.getAllByRole("button", { name: "Ghi nhận" })[0]);

    expect(acknowledge).toHaveBeenCalledWith({ requestId: "req-1", staffNote: null });
    expect(refresh).toHaveBeenCalled();
  });

  it("gửi kèm lời nhắn cho phụ huynh khi có gõ", async () => {
    const user = userEvent.setup();
    render(<AbsenceReviewPanel requests={REQUESTS} canReview />);

    await user.type(
      screen.getAllByLabelText("Lời nhắn cho phụ huynh (không bắt buộc)")[1],
      "Dạ em nắm rồi ạ.",
    );
    await user.click(screen.getAllByRole("button", { name: "Ghi nhận" })[1]);

    expect(acknowledge).toHaveBeenCalledWith({
      requestId: "req-2",
      staffNote: "Dạ em nắm rồi ạ.",
    });
  });

  it("D-61: báo kết quả bằng TÊN RIÊNG, không phải một câu chung chung", async () => {
    const user = userEvent.setup();
    render(<AbsenceReviewPanel requests={REQUESTS} canReview />);

    await user.click(screen.getAllByRole("button", { name: "Ghi nhận" })[0]);

    expect(
      await screen.findByText(/Đã ghi nhận đơn của Maria Trần Thị Hoa/),
    ).toBeInTheDocument();
  });

  it("🔴 M05-C: ghi nhận đơn CUỐI CÙNG thì câu xác nhận vẫn còn trên màn hình", async () => {
    const user = userEvent.setup();
    // Chỉ có đúng một đơn — ca thường gặp nhất, và là ca duy nhất lộ ra lỗi.
    const { rerender } = render(
      <AbsenceReviewPanel requests={[REQUESTS[0]]} canReview />,
    );

    await user.click(screen.getByRole("button", { name: "Ghi nhận" }));
    expect(
      await screen.findByText(/Đã ghi nhận đơn của Maria Trần Thị Hoa/),
    ).toBeInTheDocument();

    // `router.refresh()` nạp lại dữ liệu máy chủ: đơn vừa ghi nhận không còn
    // `pending` nên danh sách thành RỖNG. Bản M05-B đặt dòng thông báo bên
    // trong thẻ danh sách và trả về trạng thái rỗng trước đó, nên câu xác nhận
    // bị chính lượt làm mới do nó kích hoạt xoá mất — người bấm thấy thẻ biến
    // mất mà không một chữ nào nói là đã xong.
    rerender(<AbsenceReviewPanel requests={[]} canReview />);

    expect(screen.getByText(/Đã ghi nhận đơn của Maria Trần Thị Hoa/)).toBeInTheDocument();
    expect(screen.getByText("Chưa có đơn xin nghỉ nào đang chờ")).toBeInTheDocument();
  });

  it("action hỏng thì hiện đúng câu của server, không báo thành công", async () => {
    acknowledge.mockResolvedValueOnce({
      ok: false,
      code: "CONFLICT",
      message: "Đơn này không còn ở trạng thái “Đang chờ”. Vui lòng tải lại trang.",
    } as never);
    const user = userEvent.setup();
    render(<AbsenceReviewPanel requests={REQUESTS} canReview />);

    await user.click(screen.getAllByRole("button", { name: "Ghi nhận" })[0]);

    expect(await screen.findByText(/không còn ở trạng thái/)).toBeInTheDocument();
    expect(screen.queryByText(/Đã ghi nhận đơn của/)).not.toBeInTheDocument();
  });
});

describe("D-139 — vai trò chỉ đọc", () => {
  it("Cha sở/Cha phó thấy đơn nhưng không có nút, và được nói rõ vì sao", () => {
    render(<AbsenceReviewPanel requests={REQUESTS} canReview={false} />);

    expect(screen.getByText("Maria Trần Thị Hoa")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ghi nhận" })).not.toBeInTheDocument();
    expect(screen.getAllByText(/chế độ chỉ đọc/)).toHaveLength(REQUESTS.length);
  });
});
