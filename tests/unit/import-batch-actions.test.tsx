import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ImportFeedback } from "@/features/imports/import-feedback";

/**
 * M12-A — ba thao tác của một lần nhập (TO-BE 1 + TO-BE 3).
 *
 * 🔴 Bộ test này canh đúng hai lỗi CRITICAL của module:
 *
 *   · **4.2** — nút "Xoá lần nhập này" xoá được cả lần nhập ĐÃ ghi, **không hỏi
 *     lại**, cuốn theo mối nối "dòng nào tạo ra em nào". Nay lần nhập đã ghi
 *     **không còn nút huỷ**, và mọi nút nguy hiểm đều đi qua hộp xác nhận nêu
 *     **tên file + số dòng** (`11` §5).
 *   · **4.1** — kết quả ghi bị vứt. Nay `Đã ghi X · lỗi Y` hiện ra kèm **từng
 *     dòng lỗi** (AC-15).
 */
const commitAction = vi.fn(async (_formData: FormData): Promise<ImportFeedback> => ({
  tone: "danger",
  text: "Đã ghi 4 dòng vào hệ thống · lỗi 1 dòng.",
  failures: [{ rowNumber: 12, message: "Lớp của dòng này đã đóng." }],
}));
const cancelAction = vi.fn(async (_formData: FormData): Promise<ImportFeedback> => ({
  tone: "success",
  text: "Đã huỷ lần nhập này.",
}));
const purgeAction = vi.fn(async (_formData: FormData): Promise<ImportFeedback> => ({
  tone: "success",
  text: "Đã xoá dữ liệu thô của 4 dòng.",
}));

vi.mock("@/features/imports/server/actions", () => ({
  commitFormAction: (_previous: unknown, formData: FormData) => commitAction(formData),
  cancelFormAction: (_previous: unknown, formData: FormData) => cancelAction(formData),
  purgeRawFormAction: (_previous: unknown, formData: FormData) => purgeAction(formData),
}));

const { BatchActions } = await import("@/features/imports/components/batch-actions");

function renderActions(overrides: Partial<Parameters<typeof BatchActions>[0]> = {}) {
  return render(
    <BatchActions
      batchId="batch-1"
      filename="Au_1A.xlsx"
      status="dry_run"
      pendingRows={5}
      totalRows={5}
      rawPurged={false}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  commitAction.mockClear();
  cancelAction.mockClear();
  purgeAction.mockClear();
});

describe("🔴 AC-16 · lần nhập ĐÃ GHI không huỷ được", () => {
  it("lần nhập đã ghi không có nút huỷ nào", () => {
    renderActions({ status: "committed", pendingRows: 0 });
    expect(screen.queryByRole("button", { name: /Huỷ lần nhập/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Xoá lần nhập/ })).toBeNull();
  });

  it("lần nhập chưa ghi thì có nút huỷ, nhưng phải qua hộp xác nhận", async () => {
    const user = userEvent.setup();
    renderActions();
    await user.click(screen.getByRole("button", { name: "Huỷ lần nhập" }));

    expect(cancelAction).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Au_1A.xlsx");
    expect(dialog).toHaveTextContent("5");
    // D-131 — hộp xác nhận phải nói lần nhập được GIỮ LẠI, không bị xoá.
    expect(dialog).toHaveTextContent(/giữ lại/i);
  });

  it("xác nhận xong mới gửi, và gửi đúng mã lần nhập", async () => {
    const user = userEvent.setup();
    renderActions();
    await user.click(screen.getByRole("button", { name: "Huỷ lần nhập" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận huỷ" }));

    expect(cancelAction).toHaveBeenCalledTimes(1);
    expect(cancelAction.mock.calls[0][0].get("batchId")).toBe("batch-1");
  });
});

describe("🔴 AC-15 · kết quả ghi phải hiện ra", () => {
  it("hộp xác nhận ghi nêu số dòng và nói hồ sơ tạo ra KHÔNG xoá được", async () => {
    const user = userEvent.setup();
    renderActions();
    await user.click(screen.getByRole("button", { name: "Ghi 5 dòng vào hệ thống" }));

    expect(commitAction).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Au_1A.xlsx");
    expect(dialog).toHaveTextContent(/không xoá được/i);
  });

  it("ghi xong thì hiện Đã ghi X · lỗi Y và LIỆT KÊ từng dòng lỗi", async () => {
    const user = userEvent.setup();
    renderActions();
    await user.click(screen.getByRole("button", { name: "Ghi 5 dòng vào hệ thống" }));
    await user.click(screen.getByRole("button", { name: /^Ghi 5 dòng$/ }));

    expect(await screen.findByText(/Đã ghi 4 dòng vào hệ thống · lỗi 1 dòng./)).toBeTruthy();
    expect(screen.getByText(/Lớp của dòng này đã đóng./)).toBeTruthy();
    expect(screen.getByText("#12")).toBeTruthy();
  });

  it("không còn dòng nào chờ ghi thì không có nút Ghi", () => {
    renderActions({ pendingRows: 0 });
    expect(screen.queryByRole("button", { name: /Ghi .* dòng/ })).toBeNull();
    expect(screen.getByText("Không còn dòng nào chờ ghi.")).toBeTruthy();
  });

  it("🔴 lần nhập ĐÃ HUỶ không được mời bấm Ghi, dù dòng vẫn còn ở trạng thái chờ", () => {
    // D-131 — huỷ là đánh dấu, không xoá dòng. Nhưng `commit_import_rows` ném
    // `BATCH_CANCELLED`, nên nút Ghi ở đây là một nút không bao giờ chạy.
    renderActions({ status: "cancelled", pendingRows: 5 });
    expect(screen.queryByRole("button", { name: /Ghi .* dòng/ })).toBeNull();
    expect(screen.getByText(/đã huỷ nên 5 dòng/)).toBeTruthy();
    expect(screen.getByText(/tải file lên lần nữa/)).toBeTruthy();
  });
});

describe("D-132 · xoá dữ liệu thô", () => {
  it("chỉ hiện với lần nhập đã xử lý xong và chưa xoá lần nào", () => {
    const { unmount } = renderActions({ status: "dry_run" });
    expect(screen.queryByRole("button", { name: "Xoá dữ liệu thô" })).toBeNull();
    unmount();

    renderActions({ status: "committed", pendingRows: 0 });
    expect(screen.getByRole("button", { name: "Xoá dữ liệu thô" })).toBeTruthy();
  });

  it("đã xoá rồi thì không mời bấm lần nữa, và nói rõ hồ sơ vẫn còn", () => {
    renderActions({ status: "committed", pendingRows: 0, rawPurged: true });
    expect(screen.queryByRole("button", { name: "Xoá dữ liệu thô" })).toBeNull();
    expect(screen.getByText(/vẫn còn/)).toBeTruthy();
  });

  it("hộp xác nhận kể đúng những gì sẽ mất, bằng tên file", async () => {
    const user = userEvent.setup();
    renderActions({ status: "committed", pendingRows: 0 });
    await user.click(screen.getByRole("button", { name: "Xoá dữ liệu thô" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Au_1A.xlsx");
    expect(dialog).toHaveTextContent(/ghi chú sức khoẻ/);
    expect(dialog).toHaveTextContent(/giữ nguyên/);
    expect(purgeAction).not.toHaveBeenCalled();
  });
});
