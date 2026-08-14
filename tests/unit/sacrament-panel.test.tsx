import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { StudentFeedback } from "@/features/students/student-feedback";
import type { SacramentItem } from "@/features/students/components/sacrament-panel";

/**
 * M03-C · TB-F08 — tab "Bí tích" trên trang chi tiết thiếu nhi.
 *
 * 🔴 Trước đợt này bản ghi bí tích chỉ **thêm** được: nhập sai ngày rửa tội một
 * lần là vĩnh viễn (C1 = 3 của luồng F08), dù `docs/11` §3 đòi
 * `upsertStudentSacrament` từ đầu và cơ sở dữ liệu đã cấp sẵn `grant update`.
 *
 * Ba điều bộ test này giữ:
 *   1. **Một `useActionState` cho cả ba thao tác** — bài học M03-A. Nếu tách
 *      thành hai state thì xoá xong dòng biến mất **mang theo câu thông báo**,
 *      và người dùng không bao giờ biết việc đã chạy.
 *   2. Nút "Sửa" là **`<Link>` thật** tới `?edit=<id>`, không phải state React —
 *      nhờ vậy nó chạy khi chưa có JavaScript (`09` §11).
 *   3. **D-128** — nút "Xoá" chỉ hiện với người có quyền, và luôn đi qua hộp xác
 *      nhận nêu **tên em + loại bí tích** (`11` §5).
 */

const panelAction = vi.fn(async (formData: FormData): Promise<StudentFeedback> => {
  if (String(formData.get("intent") ?? "") === "delete") {
    return { tone: "success", text: "Đã xoá bản ghi bí tích Rửa tội." };
  }
  return { tone: "success", text: "Đã lưu bí tích Thêm sức." };
});

function lastPayload(): FormData {
  const calls = panelAction.mock.calls;
  return calls[calls.length - 1][0];
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/students/server/actions", () => ({
  sacramentFormAction: (_previous: unknown, formData: FormData) => panelAction(formData),
}));

const { SacramentPanel } = await import("@/features/students/components/sacrament-panel");

const BAPTISM: SacramentItem = {
  id: "sac-1",
  sacramentType: "baptism",
  sacramentName: null,
  sacramentDate: "2015-06-01",
  place: "Nhà thờ Chợ Quán",
  godparentName: "Anna Lê",
  registryNumber: "SB-12",
  notes: null,
};

function renderPanel(overrides: Partial<Parameters<typeof SacramentPanel>[0]> = {}) {
  return render(
    <SacramentPanel
      studentId="student-1"
      studentName="Maria Phạm Thị Hạnh"
      sacraments={[BAPTISM]}
      editing={null}
      canWrite
      canDelete
      backHref="/students/student-1?tab=sacraments"
      {...overrides}
    />,
  );
}

beforeEach(() => {
  panelAction.mockClear();
});

describe("AC-F08-01 · sửa được bản ghi đã nhập", () => {
  it("nút Sửa là LIÊN KẾT tới ?edit=<id> — chạy được khi chưa có JavaScript", () => {
    renderPanel();
    const link = screen.getByRole("link", { name: "Sửa bí tích Rửa tội" });
    expect(link).toHaveAttribute("href", "/students/student-1?tab=sacraments&edit=sac-1");
  });

  it("khi đang sửa, biểu mẫu nạp sẵn giá trị cũ và mang theo `id`", async () => {
    const user = userEvent.setup();
    renderPanel({ editing: BAPTISM });
    expect(screen.getByLabelText("Ngày lãnh")).toHaveValue("2015-06-01");
    expect(screen.getByLabelText("Nơi lãnh")).toHaveValue("Nhà thờ Chợ Quán");

    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    const payload = lastPayload();
    expect(payload.get("id")).toBe("sac-1");
    expect(payload.get("intent")).toBeNull();
  });

  it("thêm mới thì `id` RỖNG — đó là thứ phân biệt thêm với sửa", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Lưu bí tích" }));
    expect(lastPayload().get("id")).toBe("");
  });

  it("có đường thoát khỏi chế độ sửa mà không phải bấm Lưu", () => {
    renderPanel({ editing: BAPTISM });
    expect(screen.getByRole("link", { name: "Huỷ sửa" })).toHaveAttribute(
      "href",
      "/students/student-1?tab=sacraments",
    );
  });
});

describe("🔴 D-128 · xoá phải HỎI, và hỏi bằng tên riêng", () => {
  it("bấm Xoá mở hộp xác nhận, CHƯA gửi gì", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Xoá" }));
    expect(panelAction).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Rửa tội");
    expect(dialog).toHaveTextContent("Maria Phạm Thị Hạnh");
  });

  it("hộp xác nhận nói rõ KHÔNG có thùng rác", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Xoá" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("không có thùng rác");
  });

  it("xác nhận rồi mới gửi, và gửi nhánh `delete`", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Xoá" }));
    await user.click(await screen.findByRole("button", { name: "Xoá bản ghi" }));
    expect(panelAction).toHaveBeenCalledTimes(1);
    expect(lastPayload().get("intent")).toBe("delete");
    expect(lastPayload().get("id")).toBe("sac-1");
  });

  it("người chỉ được GHI thì không thấy nút Xoá, nhưng vẫn thấy nút Sửa", () => {
    renderPanel({ canDelete: false });
    expect(screen.queryByRole("button", { name: "Xoá" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sửa bí tích Rửa tội" })).toBeInTheDocument();
  });

  it("người chỉ ĐỌC không thấy biểu mẫu lẫn nút nào", () => {
    renderPanel({ canWrite: false, canDelete: false });
    expect(screen.queryByRole("link", { name: /Sửa bí tích/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lưu bí tích" })).not.toBeInTheDocument();
    // Danh sách vẫn đọc được — đó là quyền 👁 của Dự trưởng phụ tá (D-127).
    expect(screen.getByText("Rửa tội")).toBeInTheDocument();
  });
});

describe("🔴 MỘT chỗ hiển thị phản hồi cho cả ba thao tác", () => {
  it("xoá xong vẫn thấy câu thông báo, dù dòng đã biến mất", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Xoá" }));
    await user.click(await screen.findByRole("button", { name: "Xoá bản ghi" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Đã xoá bản ghi bí tích Rửa tội");
  });

  it("danh sách rỗng dùng trạng thái rỗng chuẩn, không phải một dòng chữ xám", () => {
    renderPanel({ sacraments: [] });
    expect(screen.getByText("Chưa có thông tin bí tích")).toBeInTheDocument();
  });

  it("danh sách có TÊN để trình đọc màn hình biết đang đọc gì", () => {
    renderPanel();
    expect(
      screen.getByRole("list", { name: "Bí tích của Maria Phạm Thị Hạnh" }),
    ).toBeInTheDocument();
  });
});
