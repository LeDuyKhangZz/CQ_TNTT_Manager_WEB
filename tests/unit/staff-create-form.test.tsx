import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CreateStaffFormState } from "@/features/staff/create-form-state";

/**
 * M04-B / TB-M04-03 — form "Thêm nhân sự" hai pha (AC-M04-05).
 *
 * Bài quan trọng nhất ở đây là bài CUỐI: sau khi cảnh báo trùng hiện lên, biểu
 * mẫu phải giữ nguyên dữ liệu người dùng vừa gõ. Bắt gõ lại bảy ô là cách chắc
 * chắn để lần sau người ta bấm "Vẫn tạo hồ sơ mới" theo phản xạ mà không đọc —
 * lúc đó cảnh báo mềm trở thành một cái nút thừa.
 */

const DUPLICATE_STATE: CreateStaffFormState = {
  status: "duplicate",
  message: "Đã có hồ sơ trông giống người này. Kiểm tra lại trước khi tạo.",
  duplicates: [
    {
      id: "staff-909",
      staffCode: "GLV909",
      fullName: "Ngô Đại Diện 1A",
      saintName: "Giuse",
      phone: "0901000009",
      dateOfBirth: null,
      serviceStatus: "active",
      reason: "phone",
    },
  ],
  values: {
    title: "chi",
    saintName: "Maria",
    fullName: "Ngô Thị Trùng",
    dateOfBirth: "1999-05-04",
    phone: "0901000009",
    email: "trung@example.com",
    address: "12 Trần Bình Trọng",
    formationLevel: "ii",
  },
};

const createStaffFormAction = vi.fn(
  async (_prev: CreateStaffFormState, _formData: FormData): Promise<CreateStaffFormState> => DUPLICATE_STATE,
);

vi.mock("@/features/staff/server/actions", () => ({
  createStaffFormAction: (prev: unknown, formData: unknown) =>
    createStaffFormAction(prev as never, formData as never),
}));

const { StaffCreateForm } = await import("@/features/staff/components/staff-create-form");

beforeEach(() => {
  createStaffFormAction.mockClear();
});

describe("pha một — biểu mẫu bình thường", () => {
  it("nhãn trình độ huấn luyện bằng tiếng Việt, không phải mã", () => {
    render(<StaffCreateForm />);
    const select = screen.getByLabelText("Trình độ huấn luyện");
    expect(select).toHaveTextContent("Chưa qua huấn luyện");
    expect(select).not.toHaveTextContent("NONE");
  });

  it("mọi ô chọn là component `Select` đã duyệt, không còn thẻ `<select>` trần", () => {
    const { container } = render(<StaffCreateForm />);
    // `Select` bọc `<select>` trong một `div.relative` kèm icon — thẻ trần của
    // bản cũ không có lớp bọc đó.
    for (const element of Array.from(container.querySelectorAll("select"))) {
      expect(element.parentElement).toHaveClass("relative");
    }
  });

  it("chưa cảnh báo thì KHÔNG có cờ xác nhận trùng đi kèm", () => {
    const { container } = render(<StaffCreateForm />);
    expect(container.querySelector('input[name="confirmDuplicate"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Tạo hồ sơ" })).toBeInTheDocument();
  });
});

describe("pha hai — cảnh báo trùng", () => {
  async function submitOnce() {
    const user = userEvent.setup();
    const { container } = render(<StaffCreateForm />);
    await user.type(screen.getByLabelText("Họ tên"), "Ngô Thị Trùng");
    await user.type(screen.getByLabelText("Điện thoại"), "0901000009");
    await user.click(screen.getByRole("button", { name: "Tạo hồ sơ" }));
    return { user, container };
  }

  it("liệt kê hồ sơ nghi trùng kèm mã, số điện thoại và LÝ DO nghi", async () => {
    await submitOnce();
    expect(await screen.findByText("Đã có 1 hồ sơ trông giống người này.")).toBeInTheDocument();
    expect(screen.getByText(/GLV909/)).toBeInTheDocument();
    expect(screen.getByText(/trùng số điện thoại/)).toBeInTheDocument();
  });

  it("mỗi hồ sơ nghi trùng là một LINK mở được — lối thoát khi đúng là người cũ", async () => {
    await submitOnce();
    expect(await screen.findByRole("link", { name: /Ngô Đại Diện 1A/ })).toHaveAttribute(
      "href",
      "/staff/staff-909",
    );
  });

  it("không chặn cứng: nút đổi thành 'Vẫn tạo hồ sơ mới' và mang theo cờ xác nhận", async () => {
    const { container } = await submitOnce();
    expect(await screen.findByRole("button", { name: "Vẫn tạo hồ sơ mới" })).toBeInTheDocument();
    expect(container.querySelector('input[name="confirmDuplicate"]')).toHaveValue("1");
  });

  it("🔴 GIỮ NGUYÊN dữ liệu đã gõ — không bắt nhập lại bảy ô", async () => {
    await submitOnce();
    await screen.findByText("Đã có 1 hồ sơ trông giống người này.");
    expect(screen.getByLabelText("Họ tên")).toHaveValue("Ngô Thị Trùng");
    expect(screen.getByLabelText("Điện thoại")).toHaveValue("0901000009");
    expect(screen.getByLabelText("Ngày sinh")).toHaveValue("04/05/1999");
    expect(screen.getByLabelText("Địa chỉ")).toHaveValue("12 Trần Bình Trọng");
    expect(screen.getByLabelText("Tên thánh")).toHaveValue("Maria");
    expect(screen.getByLabelText("Danh xưng")).toHaveValue("chi");
    expect(screen.getByLabelText("Trình độ huấn luyện")).toHaveValue("ii");
  });

  it("khối cảnh báo là vùng `aria-live` để trình đọc màn hình đọc được", async () => {
    await submitOnce();
    const region = await screen.findByRole("status");
    expect(region).toHaveTextContent("Đã có 1 hồ sơ trông giống người này.");
  });
});
