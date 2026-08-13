import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EnrollmentFeedback } from "@/features/enrollments/enrollment-feedback";

/**
 * M03-A · TB-F10 / AC-F10-01…03 — một dòng trong danh sách thiếu nhi của lớp.
 *
 * 🔴 Đây là bộ test canh **lỗi CRITICAL F10** ở tầng giao diện. Trước đợt này cả ba
 * việc nằm chung một biểu mẫu tên "Kết thúc", và điều đó tạo ra chính lỗi:
 * "Tạm nghỉ" là một mục trong ô chọn lý do, mà biểu mẫu ấy **luôn** gửi kèm ngày kết
 * thúc ⇒ vi phạm CHECK `enrollments_open_has_no_end` ⇒ thất bại im lặng, mọi lần.
 *
 * Bốn điều bộ test này giữ:
 *   1. "Tạm nghỉ" là **biểu mẫu riêng, không có ô ngày** — không còn đường nào gửi
 *      `ended_on` kèm `paused`.
 *   2. Ô chọn lý do kết thúc **không chứa** "Tạm nghỉ".
 *   3. Em `paused` hiện **huy hiệu bằng chữ** và có nút **Khôi phục** (AC-F10-02).
 *   4. "Kết thúc" **hỏi trước**, nêu **tên em và tên lớp** (AC-F10-03, `11` §5).
 */

let pauseFeedback: EnrollmentFeedback = {
  tone: "success",
  text: 'Đã chuyển Maria Nguyễn Thị A sang "Tạm nghỉ". Em vẫn thuộc lớp và vẫn được tính vào sĩ số; bấm "Khôi phục" khi em đi học lại.',
};
let closeFeedback: EnrollmentFeedback = {
  tone: "success",
  text: 'Đã kết thúc ghi danh của Maria Nguyễn Thị A với lý do "Đã rút".',
};

/**
 * Một adapter duy nhất, phân nhánh bằng ô ẩn `intent`. Bộ test vì thế canh luôn
 * **ô ẩn có gửi đúng nhánh không** — nếu ba nút cùng gửi một `intent` thì bấm
 * "Khôi phục" sẽ đi tạm nghỉ, và không có gì khác bắt được lỗi đó.
 */
const rowFormAction = vi.fn(async (formData: FormData): Promise<EnrollmentFeedback> => {
  const intent = String(formData.get("intent") ?? "");
  if (intent === "pause") return pauseFeedback;
  if (intent === "resume") {
    return {
      tone: "success",
      text: 'Đã khôi phục ghi danh của Maria Nguyễn Thị A. Em trở lại trạng thái "Đang học".',
    };
  }
  if (intent === "close") return closeFeedback;
  return { tone: "danger", text: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." };
});

function intentsCalled(): string[] {
  return rowFormAction.mock.calls.map((call) => String(call[0].get("intent") ?? ""));
}

vi.mock("@/features/enrollments/server/actions", () => ({
  enrollmentRowFormAction: (_previous: unknown, formData: FormData) => rowFormAction(formData),
}));

const { RosterRow } = await import("@/features/enrollments/components/roster-row");

/** Dòng là một `<li>` thật, nên phải dựng trong `<ul>` — đúng cách trang gọi nó. */
function renderRow(overrides: Partial<Parameters<typeof RosterRow>[0]> = {}) {
  return render(
    <ul>
      <RosterRow
        enrollmentId="enrollment-1"
        studentId="student-1"
        studentName="Maria Nguyễn Thị A"
        className="Ấu 1A"
        status="active"
        today="2026-07-28"
        canManage
        pendingPromotion={false}
        {...overrides}
      />
    </ul>,
  );
}

beforeEach(() => {
  rowFormAction.mockClear();
});

describe('🔴 "Tạm nghỉ" tách hẳn khỏi "Kết thúc" (gốc rễ F10)', () => {
  it("bấm Tạm nghỉ gửi ĐI NGAY, không đi qua ô ngày nào", async () => {
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole("button", { name: "Tạm nghỉ" }));
    expect(intentsCalled()).toEqual(["pause"]);
    // Không có hộp xác nhận: tạm nghỉ là thao tác hoàn tác được bằng đúng một nút.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ô chọn lý do kết thúc KHÔNG còn mục 'Tạm nghỉ'", () => {
    renderRow();
    const select = screen.getByLabelText("Lý do kết thúc ghi danh của Maria Nguyễn Thị A");
    const values = Array.from(select.querySelectorAll("option")).map((option) => option.value);
    expect(values).not.toContain("paused");
    expect(values).toEqual(["withdrawn", "completed", "transferred", "repeating"]);
  });

  it("câu phản hồi nói ra hai điều dễ hiểu nhầm: em vẫn thuộc lớp, và có đường quay lại", async () => {
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole("button", { name: "Tạm nghỉ" }));
    const message = await screen.findByRole("status");
    expect(message).toHaveTextContent("vẫn thuộc lớp");
    expect(message).toHaveTextContent("Khôi phục");
  });
});

describe("M08-B · AC-19 — em đang chờ duyệt chuyển lớp (BR-M08-20 / D-158 / D-162)", () => {
  it("hiện huy hiệu BẰNG CHỮ, không chỉ bằng việc nút biến mất", () => {
    renderRow({ pendingPromotion: true });
    expect(screen.getByText("Chờ duyệt chuyển lớp")).toBeInTheDocument();
  });

  it("🔴 biểu mẫu Kết thúc biến mất, và có một câu giải thích thay chỗ nó", () => {
    renderRow({ pendingPromotion: true });
    expect(screen.queryByRole("button", { name: "Kết thúc" })).not.toBeInTheDocument();
    expect(screen.getByText(/sau khi xử lý đề xuất chuyển lớp/)).toBeInTheDocument();
  });

  it("🔴 D-162 — nút Tạm nghỉ VẪN dùng được: tạm nghỉ không đóng ghi danh", async () => {
    const user = userEvent.setup();
    renderRow({ pendingPromotion: true });
    await user.click(screen.getByRole("button", { name: "Tạm nghỉ" }));
    expect(intentsCalled()).toEqual(["pause"]);
  });

  it("D-162 — em đang tạm nghỉ mà có đề xuất chờ duyệt vẫn Khôi phục được", async () => {
    const user = userEvent.setup();
    renderRow({ pendingPromotion: true, status: "paused" });
    await user.click(screen.getByRole("button", { name: "Khôi phục" }));
    expect(intentsCalled()).toEqual(["resume"]);
  });

  it("không có đề xuất chờ duyệt thì mọi thứ như cũ", () => {
    renderRow({ pendingPromotion: false });
    expect(screen.getByRole("button", { name: "Kết thúc" })).toBeInTheDocument();
    expect(screen.queryByText("Chờ duyệt chuyển lớp")).not.toBeInTheDocument();
  });
});

describe("AC-F10-01 · F10-02 — em tạm nghỉ nhìn ra được và khôi phục được", () => {
  it("hiện huy hiệu BẰNG CHỮ, không phải chấm màu (điều cấm thứ 5)", () => {
    renderRow({ status: "paused" });
    expect(screen.getByText("Tạm nghỉ")).toBeInTheDocument();
  });

  it("em đang học KHÔNG mang huy hiệu — huy hiệu gắn cho tất cả thì mất giá trị báo hiệu", () => {
    renderRow({ status: "active" });
    // "Tạm nghỉ" duy nhất trên dòng là NÚT, không phải huy hiệu trạng thái.
    expect(screen.getByRole("button", { name: "Tạm nghỉ" })).toBeInTheDocument();
    expect(screen.queryByText("Đang học")).not.toBeInTheDocument();
  });

  it("em tạm nghỉ có nút Khôi phục thay cho nút Tạm nghỉ", async () => {
    const user = userEvent.setup();
    renderRow({ status: "paused" });
    expect(screen.queryByRole("button", { name: "Tạm nghỉ" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Khôi phục" }));
    expect(intentsCalled()).toEqual(["resume"]);
  });
});

describe("AC-F10-03 — kết thúc phải hỏi trước, nêu hậu quả bằng tên riêng", () => {
  it("bấm Kết thúc mở hộp xác nhận nêu TÊN EM và TÊN LỚP, chưa ghi gì", async () => {
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole("button", { name: "Kết thúc" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Maria Nguyễn Thị A");
    expect(dialog).toHaveTextContent("Ấu 1A");
    expect(rowFormAction).not.toHaveBeenCalled();
  });

  it('D-122 — chọn "Chuyển lớp" thì hộp thoại nói thẳng hệ thống KHÔNG ghi danh em vào lớp mới', async () => {
    const user = userEvent.setup();
    renderRow();
    await user.selectOptions(
      screen.getByLabelText("Lý do kết thúc ghi danh của Maria Nguyễn Thị A"),
      "transferred",
    );
    await user.click(screen.getByRole("button", { name: "Kết thúc" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(/CHỈ đóng ghi danh ở lớp hiện tại/);
  });

  it("huỷ thì không ghi gì", async () => {
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole("button", { name: "Kết thúc" }));
    await user.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(rowFormAction).not.toHaveBeenCalled();
  });

  it("xác nhận rồi mới ghi, và kết quả được nói ra", async () => {
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole("button", { name: "Kết thúc" }));
    await user.click(screen.getByRole("button", { name: "Kết thúc ghi danh" }));
    expect(intentsCalled()).toEqual(["close"]);
    expect(await screen.findByRole("status")).toHaveTextContent("Đã kết thúc ghi danh");
  });

  it("⚠️ RLS chặn (0 dòng, không lỗi) phải hiện ra là THẤT BẠI — BR-M03-N05", async () => {
    closeFeedback = {
      tone: "danger",
      text: "Không có dòng nào được cập nhật. Ghi danh có thể thuộc một năm học đã đóng, hoặc bạn không đủ quyền sửa nó.",
    };
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole("button", { name: "Kết thúc" }));
    await user.click(screen.getByRole("button", { name: "Kết thúc ghi danh" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không có dòng nào được cập nhật");
    closeFeedback = {
      tone: "success",
      text: 'Đã kết thúc ghi danh của Maria Nguyễn Thị A với lý do "Đã rút".',
    };
  });
});

describe("người không có quyền ghi danh", () => {
  it("không thấy nút nào, nhưng vẫn thấy tên em và trạng thái", () => {
    renderRow({ canManage: false, status: "paused" });
    expect(screen.getByText("Maria Nguyễn Thị A")).toBeInTheDocument();
    expect(screen.getByText("Tạm nghỉ")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("tên em luôn là liên kết mở hồ sơ, kể cả khi không quản lý được", () => {
    renderRow({ canManage: false });
    expect(screen.getByRole("link", { name: "Maria Nguyễn Thị A" })).toHaveAttribute(
      "href",
      "/students/student-1",
    );
  });
});
