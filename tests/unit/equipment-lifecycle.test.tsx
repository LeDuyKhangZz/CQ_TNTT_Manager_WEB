import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * M09-B · TB-M09-02 PA A + TB-M09-04 — hàng rào cho vòng đời kho.
 *
 * 🔴 Vì sao bộ test này tồn tại: **D-93 chốt giữ nguyên quyền "Báo hỏng/mất" cho
 * MỌI thành viên Ban Kỹ thuật.** `04_TO_BE_FLOWS.md` khuyến nghị nâng lên
 * Trưởng/Phó Ban vì thao tác này giảm tài sản vĩnh viễn; chủ dự án chọn không
 * nâng, để người trực kho xử lý dứt điểm tại chỗ. Hệ quả là **toàn bộ hàng rào
 * dồn vào hộp xác nhận đỏ nêu đúng con số** (AC-M09-26) — nếu hộp đó biến mất
 * hoặc nói sai số, module này không còn hàng rào nào cả. Đó chính là điều bộ
 * test này canh.
 */

// Khai kiểu spy với một tham số `input: unknown` để `mock.calls[0][0]` truy cập
// được — `tsc` bắt lỗi này còn vitest thì không (cùng khuôn `vi.fn<...>()` mà
// `committee-weekly-plan.test.tsx` dùng).
type ActionSpy = ReturnType<
  typeof vi.fn<(input: unknown) => Promise<{ ok: true; data: unknown }>>
>;
const receiveEquipment: ActionSpy = vi.fn(async () => ({ ok: true, data: undefined }));
const writeOffEquipment: ActionSpy = vi.fn(async () => ({ ok: true, data: undefined }));
const adjustEquipmentStock: ActionSpy = vi.fn(async () => ({ ok: true, data: undefined }));
const borrowEquipment: ActionSpy = vi.fn(async () => ({ ok: true, data: { loanId: "loan-1" } }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/features/equipment/server/actions", () => ({
  receiveEquipment: (input: unknown) => receiveEquipment(input),
  writeOffEquipment: (input: unknown) => writeOffEquipment(input),
  adjustEquipmentStock: (input: unknown) => adjustEquipmentStock(input),
  borrowEquipment: (input: unknown) => borrowEquipment(input),
  createEquipmentItem: vi.fn(),
  updateEquipmentItem: vi.fn(),
}));

const { EquipmentBoard } = await import("@/features/equipment/components/equipment-board");
const { describeLoanBalance } = await import("@/features/equipment/loan-balance");
const {
  adjustEquipmentStockSchema,
  receiveEquipmentSchema,
  writeOffEquipmentSchema,
} = await import("@/features/equipment/schemas");
type BoardData = Parameters<typeof EquipmentBoard>[0]["board"];

const ITEM = {
  id: "item-1",
  assetCode: "KT-004",
  name: "Bộ dây tín hiệu",
  category: "Âm thanh",
  totalQuantity: 5,
  availableQuantity: 0,
  condition: "good" as const,
  storageLocation: "Kho tầng trệt",
  note: null,
  isActive: true,
};

const OPEN_LOAN = {
  id: "loan-1",
  equipmentItemId: "item-1",
  itemName: "Bộ dây tín hiệu",
  quantity: 5,
  outstandingQuantity: 5,
  restoredQuantity: 0,
  borrowerName: "Anna Trần Thị B",
  borrowedAt: "2026-10-05T09:00:00+00:00",
  expectedReturnAt: null,
  returnedAt: null,
  borrowNote: null,
  returnNote: null,
  conditionOnReturn: null,
  status: "borrowed" as const,
  events: [],
};

const BOARD: BoardData = {
  items: [ITEM],
  loans: [OPEN_LOAN],
  // D-94: người mượn là GLV lớp Ấu 1A, KHÔNG thuộc Ban Kỹ thuật (AC-M09-30).
  borrowerOptions: [
    { id: "staff-kt", displayName: "Anna Trần Thị B", staffCode: "GLV912" },
    { id: "staff-ngoai-ban", displayName: "Giuse Lê Văn C", staffCode: "GLV301" },
  ],
  adjustments: [],
};

function renderBoard(overrides: Partial<BoardData> = {}, canManageCatalog = true) {
  render(
    <EquipmentBoard
      committeeId="committee-kt"
      board={{ ...BOARD, ...overrides }}
      canManageCatalog={canManageCatalog}
      canOperate
    />,
  );
}

beforeEach(() => {
  receiveEquipment.mockClear();
  writeOffEquipment.mockClear();
  adjustEquipmentStock.mockClear();
  borrowEquipment.mockClear();
});

describe("describeLoanBalance", () => {
  it("phiếu chưa trả gì chỉ nói số đã mượn và số còn nợ", () => {
    expect(describeLoanBalance({ quantity: 5, restoredQuantity: 0, outstandingQuantity: 5 })).toBe(
      "Đã mượn 5 cái · còn nợ 5",
    );
  });

  it("tách rõ ba con số mà bản trước M09-B gộp làm một", () => {
    expect(describeLoanBalance({ quantity: 5, restoredQuantity: 3, outstandingQuantity: 2 })).toBe(
      "Đã mượn 5 cái · đã nhận lại 3 · còn nợ 2",
    );
    // Nhận lại 3, mất 2, hết nợ: "thiếu 2" của bản cũ không nói được vì sao thiếu.
    expect(describeLoanBalance({ quantity: 5, restoredQuantity: 3, outstandingQuantity: 0 })).toBe(
      "Đã mượn 5 cái · đã nhận lại 3 · hỏng/mất 2",
    );
  });
});

describe("Schema — hai tầng phải nói cùng một điều với DB", () => {
  it("báo hỏng/mất bắt buộc có ghi chú (EQUIPMENT_WRITE_OFF_NOTE_REQUIRED)", () => {
    expect(
      writeOffEquipmentSchema.safeParse({
        loanId: "6f1c0e64-0000-4000-8000-000000000001",
        quantity: 2,
        condition: "lost",
        note: "   ",
      }).success,
    ).toBe(false);
  });

  it("nhận lại hàng phải là số dương", () => {
    expect(
      receiveEquipmentSchema.safeParse({
        loanId: "6f1c0e64-0000-4000-8000-000000000001",
        quantity: 0,
      }).success,
    ).toBe(false);
  });

  it("điều chỉnh 0 cái bị từ chối; chiều giảm bắt buộc ghi chú, chiều tăng thì không", () => {
    const itemId = "6f1c0e64-0000-4000-8000-000000000002";
    expect(
      adjustEquipmentStockSchema.safeParse({ equipmentItemId: itemId, delta: 0, reason: "stocktake" })
        .success,
    ).toBe(false);
    expect(
      adjustEquipmentStockSchema.safeParse({ equipmentItemId: itemId, delta: -2, reason: "damaged" })
        .success,
    ).toBe(false);
    expect(
      adjustEquipmentStockSchema.safeParse({ equipmentItemId: itemId, delta: 5, reason: "purchase" })
        .success,
    ).toBe(true);
  });
});

describe("Phiếu đang mượn — nhận lại hàng KHÔNG phải báo hỏng/mất (AC-M09-25)", () => {
  it("hai việc là hai nút riêng, không còn một ô số làm cả hai", () => {
    renderBoard();
    expect(screen.getByRole("button", { name: "Nhận lại hàng" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Báo hỏng/mất" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ghi nhận trả" })).toBeNull();
  });

  it("nhận lại một phần đi thẳng, không hỏi lại — và không đụng tổng kho", async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.click(screen.getByRole("button", { name: "Nhận lại hàng" }));
    await user.clear(screen.getByLabelText("Số cái nhận lại"));
    await user.type(screen.getByLabelText("Số cái nhận lại"), "3");
    await user.click(screen.getByRole("button", { name: "Ghi nhận nhận lại" }));

    expect(writeOffEquipment).not.toHaveBeenCalled();
    expect(receiveEquipment).toHaveBeenCalledTimes(1);
    expect(receiveEquipment.mock.calls[0][0]).toMatchObject({ loanId: "loan-1", quantity: 3 });
    // Nhận lại hàng không phá huỷ gì nên KHÔNG chèn hộp xác nhận vào đường đi
    // thường ngày của người trực kho.
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("phiếu còn nợ thì câu báo kết quả nói rõ còn nợ bao nhiêu (D-61)", async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.click(screen.getByRole("button", { name: "Nhận lại hàng" }));
    await user.clear(screen.getByLabelText("Số cái nhận lại"));
    await user.type(screen.getByLabelText("Số cái nhận lại"), "3");
    await user.click(screen.getByRole("button", { name: "Ghi nhận nhận lại" }));

    expect(await screen.findByText(/Phiếu còn nợ 2 cái\./)).toBeInTheDocument();
  });
});

describe("Báo hỏng/mất — hộp xác nhận là hàng rào DUY NHẤT (D-93, AC-M09-26)", () => {
  async function openWriteOffForm(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: "Báo hỏng/mất" }));
    await user.clear(screen.getByLabelText("Số cái hỏng/mất"));
    await user.type(screen.getByLabelText("Số cái hỏng/mất"), "2");
    await user.selectOptions(screen.getByLabelText("Tình trạng"), "lost");
    await user.type(screen.getByLabelText("Ghi chú (bắt buộc)"), "Mất trên đường chở về");
    await user.click(screen.getByRole("button", { name: "Ghi nhận hỏng/mất" }));
  }

  it("nêu hậu quả bằng TÊN RIÊNG và CON SỐ THẬT, không phải 'Bạn có chắc không?'", async () => {
    const user = userEvent.setup();
    renderBoard();
    await openWriteOffForm(user);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Bộ dây tín hiệu/)).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Tổng kho giảm từ 5 xuống 3");
    expect(dialog).toHaveTextContent("không hoàn tác được");
  });

  it("chưa xác nhận thì KHÔNG có gì được ghi", async () => {
    const user = userEvent.setup();
    renderBoard();
    await openWriteOffForm(user);

    expect(writeOffEquipment).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Huỷ" }));
    expect(writeOffEquipment).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("xác nhận rồi mới gửi đúng số và ghi chú xuống server", async () => {
    const user = userEvent.setup();
    renderBoard();
    await openWriteOffForm(user);

    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Báo hỏng/mất 2 cái" }),
    );
    expect(writeOffEquipment).toHaveBeenCalledTimes(1);
    expect(writeOffEquipment.mock.calls[0][0]).toEqual({
      loanId: "loan-1",
      quantity: 2,
      condition: "lost",
      note: "Mất trên đường chở về",
    });
  });

  it("Escape đóng hộp thoại mà không ghi gì", async () => {
    const user = userEvent.setup();
    renderBoard();
    await openWriteOffForm(user);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(writeOffEquipment).not.toHaveBeenCalled();
  });
});

describe("Đổi tổng kho — TB-M09-04 + D-98", () => {
  it("nhập thêm đi thẳng; giảm tồn kho phải qua hộp xác nhận nêu đúng con số", async () => {
    const user = userEvent.setup();
    renderBoard({ items: [{ ...ITEM, availableQuantity: 5 }] });

    await user.click(screen.getByRole("button", { name: "Nhập thêm" }));
    await user.clear(screen.getByLabelText("Số cái nhập thêm"));
    await user.type(screen.getByLabelText("Số cái nhập thêm"), "5");
    await user.click(screen.getByRole("button", { name: "Ghi nhận nhập thêm" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(adjustEquipmentStock).toHaveBeenCalledTimes(1);
    expect(adjustEquipmentStock.mock.calls[0][0]).toMatchObject({ delta: 5, reason: "purchase" });

    await user.click(screen.getByRole("button", { name: "Giảm tồn kho" }));
    await user.clear(screen.getByLabelText("Số cái giảm bớt"));
    await user.type(screen.getByLabelText("Số cái giảm bớt"), "2");
    await user.type(screen.getByLabelText("Ghi chú (bắt buộc)"), "Cháy khi cất kho");
    await user.click(screen.getByRole("button", { name: "Ghi nhận giảm tồn kho" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("giảm từ 5 xuống 3");
    expect(adjustEquipmentStock).toHaveBeenCalledTimes(1);

    await user.click(within(dialog).getByRole("button", { name: "Giảm 2 cái" }));
    expect(adjustEquipmentStock).toHaveBeenCalledTimes(2);
    expect(adjustEquipmentStock.mock.calls[1][0]).toMatchObject({
      delta: -2,
      reason: "damaged",
      note: "Cháy khi cất kho",
    });
  });

  it("người không quản lý danh mục không thấy hai nút đổi tổng kho", () => {
    renderBoard({}, false);
    expect(screen.queryByRole("button", { name: "Nhập thêm" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Giảm tồn kho" })).toBeNull();
  });
});

describe("Người mượn — D-94 / AC-M09-30", () => {
  it("ô chọn có cả nhân sự ngoài Ban Kỹ thuật, kèm mã GLV để không nhầm người trùng tên", async () => {
    const user = userEvent.setup();
    renderBoard({ items: [{ ...ITEM, availableQuantity: 5 }] });

    await user.click(screen.getByRole("button", { name: "Cho mượn" }));
    const select = screen.getByLabelText("Người mượn");
    expect(within(select).getByRole("option", { name: "Giuse Lê Văn C (GLV301)" })).toBeInTheDocument();
    expect(within(select).getByRole("option", { name: "Anna Trần Thị B (GLV912)" })).toBeInTheDocument();
  });
});

describe("Vùng chạm ≥44px cho mọi nút mới (11 §5)", () => {
  it("bốn nút của vòng đời kho đều dùng chiều cao tối thiểu của hệ thống", async () => {
    const user = userEvent.setup();
    renderBoard({ items: [{ ...ITEM, availableQuantity: 5 }] });

    for (const name of ["Nhận lại hàng", "Báo hỏng/mất", "Nhập thêm", "Giảm tồn kho"]) {
      expect(screen.getByRole("button", { name })).toHaveClass("min-h-control");
    }

    await user.click(screen.getByRole("button", { name: "Nhận lại hàng" }));
    expect(screen.getByRole("button", { name: "Ghi nhận nhận lại" })).toHaveClass("min-h-control");
  });
});
