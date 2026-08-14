import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ImportFeedback } from "@/features/imports/import-feedback";
import type { BatchRow } from "@/features/imports/server/queries";

/**
 * M12-B — bảng duyệt dòng của một lần nhập (**TO-BE 4 / AC-21**), và những gì
 * của M12-A phải sống sót qua đợt thiết kế lại này.
 *
 * 🔴 Bộ test này canh **một điều đã đo được và hai điều dễ mất im lặng**:
 *
 *   · **AC-21** — 30 dòng phải đi lên trong **một** lượt gửi. Bản cũ mỗi dòng là
 *     một biểu mẫu riêng, nên sổ SYLL (83% dòng thiếu giới tính) biến thành 30
 *     lượt bấm + 30 lượt dựng lại trang. Bài test đếm **số lần** Server Action
 *     được gọi, vì đó chính là con số AC-21 nói tới.
 *   · **D-133** — dòng nghi trùng chắc chắn **không** được lưu kèm trong lượt
 *     hàng loạt; nó phải có nút xác nhận của riêng nó. Mất điều này thì một cú
 *     bấm xác nhận hai chục dòng trùng, đúng thứ D-133 vừa được chốt để chặn.
 *   · **AC-18 / AC-26 của M12-A** — khối đối chiếu hồ sơ trùng và câu lỗi ghi đã
 *     dịch sang tiếng Việt vẫn phải còn, chỉ đổi chỗ vào khối chi tiết bung ra.
 */
const editsAction = vi.fn(async (_formData: FormData): Promise<ImportFeedback> => ({
  tone: "success",
  text: "Đã lưu 2 dòng.",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/imports/server/actions", () => ({
  refreshBatchPage: vi.fn(async () => undefined),
  rowEditsFormAction: (_previous: unknown, formData: FormData) => editsAction(formData),
}));

const { BatchRowEditor } = await import("@/features/imports/components/batch-row-editor");

const BATCH_ID = "11111111-1111-4111-8111-111111111111";

function makeRow(overrides: Partial<BatchRow> & { id: string; rowNumber: number }): BatchRow {
  return {
    status: "valid",
    action: "create",
    fullName: "Trần Văn An",
    className: "Ấu 1A",
    errors: [],
    warnings: [],
    matchedStudentId: null,
    matchedStudent: null,
    commitError: null,
    gender: null,
    ...overrides,
  };
}

function renderEditor(rows: BatchRow[], batchCancelled = false) {
  return render(
    <BatchRowEditor batchId={BATCH_ID} rows={rows} batchCancelled={batchCancelled} />,
  );
}

beforeEach(() => {
  editsAction.mockClear();
});

describe("🔴 AC-21 · cả trang dòng đi lên trong MỘT lượt gửi", () => {
  it("chọn giới tính cho nhiều dòng rồi lưu một lần — Server Action được gọi đúng 1 lần", async () => {
    const user = userEvent.setup();
    renderEditor([
      makeRow({ id: "row-1", rowNumber: 3 }),
      makeRow({ id: "row-2", rowNumber: 4, fullName: "Lê Thị Bình" }),
      makeRow({ id: "row-3", rowNumber: 5, fullName: "Phạm Văn Cường" }),
    ]);

    await user.selectOptions(screen.getByLabelText("Giới tính của dòng 3"), "male");
    await user.selectOptions(screen.getByLabelText("Giới tính của dòng 4"), "female");
    await user.selectOptions(screen.getByLabelText("Giới tính của dòng 5"), "male");
    await user.click(screen.getByRole("button", { name: "Lưu tất cả thay đổi" }));

    expect(editsAction).toHaveBeenCalledTimes(1);
    const sent = editsAction.mock.calls[0][0];
    expect(sent.get("gender__row-1")).toBe("male");
    expect(sent.get("gender__row-2")).toBe("female");
    expect(sent.get("gender__row-3")).toBe("male");
    expect(sent.get("batchId")).toBe(BATCH_ID);
  });

  it("cách xử lý dòng đi kèm trong cùng lượt lưu ấy — D-136", async () => {
    const user = userEvent.setup();
    renderEditor([makeRow({ id: "row-1", rowNumber: 3, gender: "male" })]);

    await user.selectOptions(screen.getByLabelText("Cách xử lý dòng 3"), "skip");
    await user.click(screen.getByRole("button", { name: "Lưu tất cả thay đổi" }));

    expect(editsAction).toHaveBeenCalledTimes(1);
    expect(editsAction.mock.calls[0][0].get("action__row-1")).toBe("skip");
  });
});

describe("🔴 TO-BE 4 bước 3 · áp dụng giới tính cho các dòng ĐANG CHỌN", () => {
  it("chỉ đổi dòng được đánh dấu, và KHÔNG gửi lên máy chủ lượt nào", async () => {
    const user = userEvent.setup();
    renderEditor([
      makeRow({ id: "row-1", rowNumber: 3 }),
      makeRow({ id: "row-2", rowNumber: 4 }),
      makeRow({ id: "row-3", rowNumber: 5 }),
    ]);

    await user.click(screen.getByLabelText("Chọn dòng 3"));
    await user.click(screen.getByLabelText("Chọn dòng 5"));
    await user.click(screen.getByRole("button", { name: "Áp dụng Nam cho dòng đang chọn" }));

    expect(screen.getByLabelText<HTMLSelectElement>("Giới tính của dòng 3").value).toBe("male");
    expect(screen.getByLabelText<HTMLSelectElement>("Giới tính của dòng 5").value).toBe("male");
    // Dòng không đánh dấu phải nguyên vẹn — đây là chỗ một nút "áp dụng hàng
    // loạt" làm hỏng dữ liệu nhanh nhất.
    expect(screen.getByLabelText<HTMLSelectElement>("Giới tính của dòng 4").value).toBe("");
    // Điền tại chỗ, không đi vòng máy chủ: một lượt gửi duy nhất là lúc bấm Lưu.
    expect(editsAction).not.toHaveBeenCalled();
  });

  it("đếm và nói ra số dòng đang chọn", async () => {
    const user = userEvent.setup();
    renderEditor([makeRow({ id: "row-1", rowNumber: 3 }), makeRow({ id: "row-2", rowNumber: 4 })]);

    expect(screen.getByText(/Đánh dấu vài dòng/)).toBeInTheDocument();
    await user.click(screen.getByLabelText("Chọn tất cả dòng của trang này"));
    expect(screen.getByText("2 dòng đang chọn.")).toBeInTheDocument();
  });
});

describe("🔴 D-133 · dòng nghi trùng chắc chắn phải được xác nhận TỪNG DÒNG", () => {
  const duplicateRow = makeRow({
    id: "row-9",
    rowNumber: 12,
    status: "warning",
    action: "merge",
    gender: "female",
    matchedStudentId: "student-1",
    warnings: [
      { field: "duplicate_pending", message: "[high] Trùng tên + ngày sinh + SĐT phụ huynh." },
    ],
    matchedStudent: {
      id: "student-1",
      studentCode: "CQ0123",
      fullName: "Lê Thị Bình",
      dateOfBirth: "2015-05-12",
      status: "active",
      guardianPhone: "0903000111",
    },
  });

  it("có nút xác nhận riêng mang đúng id dòng, không phải nút lưu chung", async () => {
    const user = userEvent.setup();
    renderEditor([duplicateRow]);

    expect(screen.getByText("Chờ xác nhận trùng")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xác nhận dòng #12" }));

    expect(editsAction).toHaveBeenCalledTimes(1);
    expect(editsAction.mock.calls[0][0].get("confirmRow")).toBe("row-9");
  });

  it("nút lưu chung KHÔNG mang cờ xác nhận — máy chủ nhờ đó bỏ qua dòng trùng", async () => {
    const user = userEvent.setup();
    renderEditor([duplicateRow]);

    await user.click(screen.getByRole("button", { name: "Lưu tất cả thay đổi" }));
    expect(editsAction.mock.calls[0][0].get("confirmRow")).toBeNull();
  });

  it("AC-18 · hồ sơ đối chiếu hiện đủ mã · tên · ngày sinh · SĐT · trạng thái", () => {
    renderEditor([duplicateRow]);
    const detail = screen.getByText("Hồ sơ đã có trong hệ thống").closest("div")!;
    // Một dòng duy nhất mang đủ năm mẩu tin — người duyệt đọc một lượt là quyết
    // được, không phải ghép từ ba chỗ trên màn hình.
    expect(
      within(detail).getByText(/CQ0123 · Lê Thị Bình · sinh 12\/05\/2015 · SĐT phụ huynh 0903000111/),
    ).toBeInTheDocument();
    expect(within(detail).getByText(/Đang sinh hoạt/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mở hồ sơ CQ0123 để đối chiếu" }),
    ).toHaveAttribute("href", "/students/student-1");
  });
});

describe("AC-26 · lỗi ghi hiện bằng tiếng Việt, không lộ SQL", () => {
  it("mã lỗi đã biết thành câu nói việc phải làm", () => {
    renderEditor([
      makeRow({
        id: "row-1",
        rowNumber: 7,
        status: "error",
        commitError: "STUDENT_NOT_ACTIVE",
      }),
    ]);
    const message = screen.getByText(/Lỗi khi ghi:/);
    expect(message.textContent).not.toContain("STUDENT_NOT_ACTIVE");
  });

  it("câu SQL thô KHÔNG bao giờ về nguyên văn màn hình", () => {
    renderEditor([
      makeRow({
        id: "row-1",
        rowNumber: 7,
        status: "error",
        commitError:
          'duplicate key value violates unique constraint "students_student_code_key"',
      }),
    ]);
    expect(screen.queryByText(/students_student_code_key/)).toBeNull();
  });
});

describe("dòng không sửa được thì không mời sửa", () => {
  it("dòng đã ghi và dòng bỏ qua không có ô chọn nào", () => {
    renderEditor([
      makeRow({ id: "row-1", rowNumber: 3, status: "committed", action: "create", gender: "male" }),
      makeRow({ id: "row-2", rowNumber: 4, status: "skipped", action: "skip", gender: "female" }),
    ]);
    expect(screen.queryByLabelText("Cách xử lý dòng 3")).toBeNull();
    expect(screen.queryByLabelText("Chọn dòng 3")).toBeNull();
    expect(screen.getByText("Đã ghi")).toBeInTheDocument();
    // Dòng đã bỏ qua hiện "Bỏ qua" ở **hai** chỗ: huy hiệu trạng thái và cột
    // quyết định. Cả hai đều là chữ, không phải chỉ có màu (`11` §5).
    expect(screen.getAllByText("Bỏ qua")).toHaveLength(2);
  });

  it("🔴 lần nhập ĐÃ HUỶ: không còn ô chọn và không còn nút lưu nào", () => {
    renderEditor([makeRow({ id: "row-1", rowNumber: 3 })], true);
    expect(screen.queryByLabelText("Giới tính của dòng 3")).toBeNull();
    expect(screen.queryByRole("button", { name: "Lưu tất cả thay đổi" })).toBeNull();
  });

  it("dòng lỗi vẫn chọn được giới tính nhưng KHÔNG đổi được cách xử lý", () => {
    renderEditor([makeRow({ id: "row-1", rowNumber: 3, status: "error" })]);
    expect(screen.getByLabelText("Giới tính của dòng 3")).toBeInTheDocument();
    expect(screen.queryByLabelText("Cách xử lý dòng 3")).toBeNull();
  });
});

describe("🔴 bản nháp không được nói dối sau khi máy chủ đã trả lời", () => {
  it("dữ liệu máy chủ đổi thì ô chọn quay về đúng sự thật", async () => {
    const user = userEvent.setup();
    const { rerender } = renderEditor([makeRow({ id: "row-1", rowNumber: 3, action: "create" })]);

    await user.selectOptions(screen.getByLabelText("Cách xử lý dòng 3"), "skip");
    expect(screen.getByLabelText<HTMLSelectElement>("Cách xử lý dòng 3").value).toBe("skip");

    // Máy chủ cố ý KHÔNG lưu (ví dụ dòng trùng chưa xác nhận) rồi dựng lại trang:
    // giữ nguyên "Bỏ qua" trên màn hình là nói dối người duyệt.
    rerender(
      <BatchRowEditor
        batchId={BATCH_ID}
        rows={[makeRow({ id: "row-1", rowNumber: 3, action: "merge", matchedStudentId: "s1" })]}
        batchCancelled={false}
      />,
    );
    expect(screen.getByLabelText<HTMLSelectElement>("Cách xử lý dòng 3").value).toBe("merge");
  });
});

describe("phản hồi của lượt lưu hiện ra tại chỗ", () => {
  it("câu trả lời của máy chủ được hiện, kèm từng dòng hỏng", async () => {
    editsAction.mockResolvedValueOnce({
      tone: "danger",
      text: "Đã lưu 1 dòng · 1 dòng không lưu được.",
      failures: [{ rowNumber: 8, message: "Không có gì thay đổi." }],
    });
    const user = userEvent.setup();
    renderEditor([makeRow({ id: "row-1", rowNumber: 3 })]);

    await user.click(screen.getByRole("button", { name: "Lưu tất cả thay đổi" }));
    expect(await screen.findByText(/Đã lưu 1 dòng/)).toBeInTheDocument();
    expect(await screen.findByText(/Không có gì thay đổi/)).toBeInTheDocument();
  });
});
