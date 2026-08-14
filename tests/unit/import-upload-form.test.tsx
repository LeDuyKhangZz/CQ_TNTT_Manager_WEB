import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ImportFeedback } from "@/features/imports/import-feedback";

/**
 * M12-A — biểu mẫu tải file (TO-BE 1 / AC-13).
 *
 * 🔴 Đây là bài canh lỗi CRITICAL 4.1 ở đúng chỗ nó đau nhất: trước đợt này tải
 * lên một file hỏng thì màn hình **không đổi một chữ nào**, nên người dùng thử
 * đi thử lại cùng một file hỏng mà không hiểu vì sao. Câu giải thích đã có sẵn ở
 * `parse.ts` từ Phase 2 — cái thiếu là người nhận nó.
 */
const uploadAction = vi.fn(async (_formData: FormData): Promise<ImportFeedback> => ({
  tone: "danger",
  text: "Sheet chỉ có danh sách tên, thiếu ngày sinh nên không đủ để import. Vui lòng dùng sheet SYLL hoặc file mẫu chuẩn.",
}));
const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("@/features/imports/server/actions", () => ({
  uploadFormAction: (_previous: unknown, formData: FormData) => uploadAction(formData),
}));

const { ImportUploadForm } = await import("@/features/imports/components/import-upload-form");

function renderForm() {
  return render(
    <ImportUploadForm
      yearCode="2026-2027"
      classOptions={[{ id: "class-1", displayName: "Ấu 1A" }]}
    />,
  );
}

beforeEach(() => {
  uploadAction.mockClear();
  routerPush.mockClear();
});

it("mở trang kết quả sau khi phản hồi tải file đã hoàn tất", async () => {
  uploadAction.mockResolvedValueOnce({
    tone: "success",
    text: "Đã kiểm tra file.",
    navigateTo: "/imports/batch-1",
  });
  const user = userEvent.setup();
  renderForm();
  await user.upload(
    screen.getByLabelText(/File Excel/),
    new File(["x"], "so_lop.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  submitUploadForm();
  expect(await screen.findByText("Đã kiểm tra file.")).toBeInTheDocument();
  expect(routerPush).toHaveBeenCalledWith("/imports/batch-1");
});

/**
 * ⚠️ Gửi biểu mẫu bằng `fireEvent.submit`, không phải bằng cú bấm nút. Lý do đã
 * đo được, không phải sở thích: trong jsdom, một `<form action={…}>` của React 19
 * **chứa `<input type="file">` đã có tệp** thì cú bấm nút gửi đi theo đường gửi
 * biểu mẫu gốc của jsdom thay vì được React chặn lại — dựng lại bằng một biểu mẫu
 * trần cũng đúng như vậy, nên đây là giới hạn của môi trường kiểm thử. Đường bấm
 * nút thật do E2E `imports.spec.ts` phủ (AC-13/AC-14) trên trình duyệt thật.
 */
function submitUploadForm() {
  fireEvent.submit(screen.getByRole("form", { name: "Tải file Excel lên" }));
}

describe("AC-13 · tải lên hỏng phải có thông điệp", () => {
  it("hiện đúng lý do trả về từ máy chủ", async () => {
    const user = userEvent.setup();
    renderForm();

    const file = new File(["không phải xlsx"], "so_lop.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await user.upload(screen.getByLabelText(/File Excel/), file);
    submitUploadForm();

    expect(
      await screen.findByText(/Sheet chỉ có danh sách tên, thiếu ngày sinh/),
    ).toBeTruthy();
    expect(uploadAction).toHaveBeenCalledTimes(1);
    expect(uploadAction.mock.calls[0][0].get("file")).toBeInstanceOf(File);
  });

  it("thông điệp lỗi mang role=alert để trình đọc màn hình đọc ngay", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.upload(
      screen.getByLabelText(/File Excel/),
      new File(["x"], "so_lop.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    submitUploadForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("Sheet chỉ có danh sách tên");
  });

  it("nói rõ năm học đích và CẢ HAI giới hạn ngay trên biểu mẫu", () => {
    renderForm();
    expect(screen.getByText(/2026-2027/)).toBeTruthy();
    // M12-C / TO-BE 8 — nhãn phải nêu cả dung lượng lẫn số dòng. Bản cũ chỉ nói
    // dung lượng, và nói sai con số (5MB trong khi nền tảng chặn ở ~4,5 MB).
    expect(screen.getByLabelText(/tối đa 4 MB và 1\.000 dòng/)).toBeTruthy();
  });

  /**
   * M12-C — TO-BE 8 / NC-01 / D-137.
   *
   * 🔴 Phép kiểm này **không** thừa so với hàng rào máy chủ, và lý do nằm ở hạ
   * tầng chứ không ở mã: Vercel chặn thân request nặng hơn ~4,5 MB **trước khi**
   * Server Action chạy, nên với một file 5 MB thì câu tiếng Việt của
   * `createDryRunBatch` không có đường nào hiện ra — người dùng nhận một trang
   * lỗi tiếng Anh. Chặn ở trình duyệt là thứ duy nhất còn cứu được lượt đó.
   */
  it("file quá nặng bị chặn NGAY tại trình duyệt, không gửi lên máy chủ", async () => {
    const user = userEvent.setup();
    renderForm();

    const oversized = new File([new Uint8Array(5 * 1024 * 1024)], "so_lop.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await user.upload(screen.getByLabelText(/File Excel/), oversized);
    submitUploadForm();

    expect(await screen.findByText(/vượt quá giới hạn 4 MB/)).toBeTruthy();
    expect(uploadAction).not.toHaveBeenCalled();
  });

  it("file trong giới hạn vẫn đi lên máy chủ như thường", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.upload(
      screen.getByLabelText(/File Excel/),
      new File([new Uint8Array(900 * 1024)], "so_lop.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    submitUploadForm();

    expect(uploadAction).toHaveBeenCalledTimes(1);
  });

  it("ô chọn lớp đích là component Select, không phải thẻ trần", () => {
    renderForm();
    const select = screen.getByLabelText(/Lớp đích/);
    expect(select.tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "Ấu 1A" })).toBeTruthy();
  });
});
