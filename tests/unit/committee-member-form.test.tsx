import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CommitteeMemberForm } from "@/features/committees/components/committee-member-form";
import type { StaffOption } from "@/features/committees/server/queries";

const staff: StaffOption[] = [
  { id: "a", displayName: "Anna Nguyễn Thị An", activeCommitteeCount: 0, classId: "au1", className: "Ấu 1A", sectorId: "au", sectorName: "Ấu Nhi" },
  { id: "b", displayName: "Giuse Trần Bình", activeCommitteeCount: 1, classId: "au2", className: "Ấu 2A", sectorId: "au", sectorName: "Ấu Nhi" },
  { id: "c", displayName: "Maria Trần Châu", activeCommitteeCount: 2, classId: "thieu1", className: "Thiếu 1A", sectorId: "thieu", sectorName: "Thiếu Nhi" },
  { id: "d", displayName: "Phêrô Đặng Dũng", activeCommitteeCount: 0, classId: null, className: null, sectorId: null, sectorName: null },
];

describe("Chọn thành viên Ban", () => {
  it("tìm không dấu và kết hợp ngành/lớp; đổi ngành xóa lớp cũ", async () => {
    const user = userEvent.setup();
    render(<CommitteeMemberForm staff={staff} pending={false} onSubmit={vi.fn()} />);
    await user.selectOptions(screen.getByLabelText("Ngành", { exact: true }), "au");
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(within(screen.getByLabelText("Lớp", { exact: true })).queryByRole("option", { name: "Thiếu 1A" })).toBeNull();
    await user.selectOptions(screen.getByLabelText("Lớp", { exact: true }), "au1");
    await user.type(screen.getByLabelText("Tìm theo tên"), "nguyen thi an");
    expect(screen.getAllByRole("radio")).toHaveLength(1);
    expect(screen.getByRole("radio", { name: staff[0].displayName })).toBeEnabled();
    await user.clear(screen.getByLabelText("Tìm theo tên"));
    await user.selectOptions(screen.getByLabelText("Ngành", { exact: true }), "thieu");
    expect(screen.getByLabelText("Lớp", { exact: true })).toHaveValue("all");
    expect(screen.getByRole("radio", { name: staff[2].displayName })).toBeDisabled();
  });

  it("giữ người đã chọn khi đổi bộ lọc và gửi đúng ID, chức vụ", async () => {
    const user = userEvent.setup();
    let submitted: FormData | undefined;
    render(<CommitteeMemberForm staff={staff} pending={false} onSubmit={event => { event.preventDefault(); submitted = new FormData(event.currentTarget); }} />);
    expect(screen.getByRole("button", { name: "Thêm vào Ban" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: staff[0].displayName }));
    await user.type(screen.getByLabelText("Tìm theo tên"), "dang dung");
    expect(screen.getByText("Người đã chọn đang nằm ngoài bộ lọc hiện tại.")).toBeVisible();
    await user.selectOptions(screen.getByLabelText("Chức vụ", { exact: true }), "deputy");
    await user.click(screen.getByRole("button", { name: "Thêm vào Ban" }));
    expect(submitted?.get("staffProfileId")).toBe("a");
    expect(submitted?.get("position")).toBe("deputy");
  });

  it("lọc nhân sự chưa phân lớp và có đường xóa lọc khi không có kết quả", async () => {
    const user = userEvent.setup();
    render(<CommitteeMemberForm staff={staff} pending={false} onSubmit={vi.fn()} />);
    await user.selectOptions(screen.getByLabelText("Ngành", { exact: true }), "unassigned");
    expect(screen.getAllByRole("radio")).toHaveLength(1);
    expect(screen.getByRole("radio", { name: staff[3].displayName })).toBeEnabled();
    await user.type(screen.getByLabelText("Tìm theo tên"), "khong trung ai");
    expect(screen.getByText(/Không tìm thấy nhân sự phù hợp/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Xóa bộ lọc" }));
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("reset sau khi lưu xóa lựa chọn; nhân sự vừa đủ hai Ban không thể gửi lại", async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<CommitteeMemberForm staff={staff} pending={false} onSubmit={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: staff[0].displayName }));
    rerender(<CommitteeMemberForm staff={staff.map(item => ({ ...item, activeCommitteeCount: 2 }))} pending={false} onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Thêm vào Ban" })).toBeDisabled();
    expect(container.querySelector('input[name="staffProfileId"]')).toHaveValue("");
    fireEvent.reset(container.querySelector("form")!);
    rerender(<CommitteeMemberForm staff={staff} pending={false} onSubmit={vi.fn()} />);
    expect(screen.getByRole("radio", { name: staff[0].displayName })).not.toBeChecked();
  });
});
