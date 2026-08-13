import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * M09-C · TB-M09-05 / TB-M09-06 — hàng rào cho phần giao diện Ban.
 *
 * Hai điều đợt này thêm và bộ test canh:
 *  1. **Ô chức vụ là select CONTROLLED + nút "Lưu chức vụ" riêng**, không còn tự
 *     lưu khi vừa `onChange`. Nếu nút này lưu ngay lúc chọn thì một cú chạm nhầm
 *     trên máy phòng học đổi luôn chức vụ người khác — đúng thứ TB-M09-05 chặn.
 *  2. **Mọi thao tác phá huỷ đi qua ConfirmDialog nêu hậu quả bằng tên riêng**,
 *     và action KHÔNG chạy trước khi người dùng xác nhận.
 */

type ActionSpy = ReturnType<
  typeof vi.fn<(input: unknown) => Promise<{ ok: true; data: unknown }>>
>;
const updateCommitteeMemberPosition: ActionSpy = vi.fn(async () => ({ ok: true, data: undefined }));
const endCommitteeMembership: ActionSpy = vi.fn(async () => ({ ok: true, data: undefined }));
const deleteCommitteeAnnouncement: ActionSpy = vi.fn(async () => ({ ok: true, data: undefined }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/features/committees/server/actions", () => ({
  updateCommitteeMemberPosition: (input: unknown) => updateCommitteeMemberPosition(input),
  endCommitteeMembership: (input: unknown) => endCommitteeMembership(input),
  deleteCommitteeAnnouncement: (input: unknown) => deleteCommitteeAnnouncement(input),
  addCommitteeMember: vi.fn(async () => ({ ok: true, data: undefined })),
  deleteCommitteeMeeting: vi.fn(async () => ({ ok: true, data: undefined })),
  deleteCommitteeWeeklyPlan: vi.fn(async () => ({ ok: true, data: undefined })),
  publishCommitteeAnnouncement: vi.fn(async () => ({ ok: true, data: undefined })),
  saveCommitteeMeeting: vi.fn(async () => ({ ok: true, data: undefined })),
  saveCommitteeWeeklyPlan: vi.fn(async () => ({ ok: true, data: undefined })),
  updateCommittee: vi.fn(async () => ({ ok: true, data: undefined })),
}));

const { CommitteeWorkspace } = await import("@/features/committees/components/committee-workspace");
import type { CommitteeDetail } from "@/features/committees/server/queries";

function makeDetail(overrides: Partial<CommitteeDetail> = {}): CommitteeDetail {
  return {
    committee: {
      id: "c0000000-0000-4000-8000-000000000001",
      code: "SINH_HOAT",
      name: "Ban Sinh hoạt",
      description: "Tổ chức sinh hoạt",
      managesEquipment: false,
      isActive: true,
      sortOrder: 1,
      memberCount: 1,
      myPosition: "leader",
      leaderNames: [],
      deputyNames: [],
    },
    members: [
      {
        id: "m0000000-0000-4000-8000-000000000001",
        staffProfileId: "s0000000-0000-4000-8000-000000000001",
        displayName: "Anna Trần Thị B",
        position: "member",
        startsOn: "2026-09-01",
        isSelf: false,
      },
    ],
    announcements: [
      {
        id: "a0000000-0000-4000-8000-000000000001",
        title: "Chuẩn bị Trung Thu",
        content: "Nội dung",
        publishedAt: "2026-10-01T09:00:00+00:00",
        authorName: "Anh Trưởng ban",
      },
    ],
    meetings: [],
    weeklyPlans: [],
    staffOptions: [],
    canManageMembers: true,
    canWriteContent: true,
    ...overrides,
  };
}

beforeEach(() => {
  updateCommitteeMemberPosition.mockClear();
  endCommitteeMembership.mockClear();
  deleteCommitteeAnnouncement.mockClear();
});

describe("CommitteeWorkspace — tabs", () => {
  it("hiện đủ các tab nội dung; tab Thiết bị chỉ có khi Ban giữ kho", () => {
    const { rerender } = render(<CommitteeWorkspace detail={makeDetail()} />);
    for (const name of ["Tổng quan", "Thành viên (1)", "Thông báo", "Lịch họp", "Công việc tuần"]) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("tab", { name: "Thiết bị" })).toBeNull();

    rerender(
      <CommitteeWorkspace detail={makeDetail()} equipmentSlot={<div>Bảng kho</div>} />,
    );
    expect(screen.getByRole("tab", { name: "Thiết bị" })).toBeInTheDocument();
  });
});

describe("CommitteeWorkspace — chức vụ controlled (TB-M09-05)", () => {
  it("nút 'Lưu chức vụ' chỉ bật khi đã đổi, và lưu đúng chức vụ mới", async () => {
    const user = userEvent.setup();
    render(<CommitteeWorkspace detail={makeDetail()} />);
    await user.click(screen.getByRole("tab", { name: "Thành viên (1)" }));

    const save = screen.getByRole("button", { name: "Lưu chức vụ" });
    // Chưa đổi gì: không được lưu (không có onChange tự lưu).
    expect(save).toBeDisabled();
    expect(updateCommitteeMemberPosition).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText("Chức vụ của Anna Trần Thị B"), "leader");
    expect(save).toBeEnabled();
    await user.click(save);

    expect(updateCommitteeMemberPosition).toHaveBeenCalledTimes(1);
    expect(updateCommitteeMemberPosition.mock.calls[0][0]).toEqual({
      membershipId: "m0000000-0000-4000-8000-000000000001",
      position: "leader",
    });
  });
});

describe("CommitteeWorkspace — ma sát cho thao tác phá huỷ (TB-M09-05)", () => {
  it("kết thúc nhiệm kỳ mở hộp xác nhận nêu tên người + tên Ban; chỉ chạy sau khi xác nhận", async () => {
    const user = userEvent.setup();
    render(<CommitteeWorkspace detail={makeDetail()} />);
    await user.click(screen.getByRole("tab", { name: "Thành viên (1)" }));

    await user.click(screen.getByRole("button", { name: "Kết thúc" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Anna Trần Thị B/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Ban Sinh hoạt/)).toBeInTheDocument();
    // Chưa xác nhận ⇒ chưa gọi action.
    expect(endCommitteeMembership).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Kết thúc nhiệm kỳ" }));
    expect(endCommitteeMembership).toHaveBeenCalledTimes(1);
    expect(endCommitteeMembership.mock.calls[0][0]).toEqual({
      membershipId: "m0000000-0000-4000-8000-000000000001",
    });
  });

  it("xoá thông báo cũng đi qua hộp xác nhận nêu tên thông báo", async () => {
    const user = userEvent.setup();
    render(<CommitteeWorkspace detail={makeDetail()} />);
    await user.click(screen.getByRole("tab", { name: "Thông báo" }));

    await user.click(screen.getByRole("button", { name: "Xóa" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Chuẩn bị Trung Thu/)).toBeInTheDocument();
    expect(deleteCommitteeAnnouncement).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Xóa thông báo" }));
    expect(deleteCommitteeAnnouncement).toHaveBeenCalledTimes(1);
  });
});
