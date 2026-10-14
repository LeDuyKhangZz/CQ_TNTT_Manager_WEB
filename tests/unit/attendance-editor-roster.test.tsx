import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  AttendanceRosterEntry,
  AttendanceStaffEntry,
} from "@/features/attendance/server/queries";

/**
 * M05-C — danh sách điểm danh ở tầng giao diện.
 *
 * Phủ bốn quyết định của đợt trong đúng component mà ~40 Giáo lý viên bấm hằng
 * tuần: **D-143** (hàng gấp lại, chạm để mở) · **D-142** (ba nút + "…") ·
 * **U-11** (lọc + tìm không dấu) · **TB-03** (hộp xác nhận trước khi chốt).
 */
type SaveAttendanceResult = Awaited<ReturnType<typeof import("@/features/attendance/server/actions").saveAttendance>>;
const saveAttendance = vi.fn(async (_input: unknown): Promise<SaveAttendanceResult> => ({
  ok: true as const,
  data: {
    status: "completed",
    finalizedAt: "2026-08-03T10:00:00Z",
    lockedAt: "2026-08-06T10:00:00Z",
    studentTotal: 3,
    studentPresent: 2,
    studentAbsent: 1,
    staffTotal: 1,
    staffPresent: 1,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/features/attendance/server/actions", () => ({
  saveAttendance: (input: unknown) => saveAttendance(input),
  heartbeatAttendanceSession: vi.fn(async () => ({
    ok: true,
    data: { leaseExpiresAt: null },
  })),
  takeoverAttendanceSession: vi.fn(async () => ({ ok: true, data: undefined })),
}));

const { AttendanceEditor } = await import("@/features/attendance/components/attendance-editor");
const { heartbeatAttendanceSession } = await import("@/features/attendance/server/actions");

const ROSTER: AttendanceRosterEntry[] = [
  {
    recordId: "rec-1",
    enrollmentId: "enr-1",
    studentId: "stu-1",
    label: "Giuse Nguyễn Minh An",
    massStatus: "present",
    catechismStatus: "present",
    note: null,
    pendingAbsenceReason: null,
    warnings: [],
  },
  {
    recordId: "rec-2",
    enrollmentId: "enr-2",
    studentId: "stu-2",
    label: "Maria Trần Thị Ánh",
    massStatus: "present",
    catechismStatus: "present",
    note: null,
    pendingAbsenceReason: "Cháu về quê giỗ ông",
    warnings: [],
  },
  {
    recordId: "rec-3",
    enrollmentId: "enr-3",
    studentId: "stu-3",
    label: "Phêrô Lê Văn Đức",
    massStatus: "late",
    catechismStatus: "present",
    note: null,
    pendingAbsenceReason: null,
    warnings: ["Vắng lễ Chúa nhật nhiều buổi liên tiếp"],
  },
];

const STAFF: AttendanceStaffEntry[] = [
  {
    recordId: "srec-1",
    classStaffAssignmentId: "csa-1",
    label: "Têrêsa Nguyễn Thị Mai",
    capacity: "representative",
    status: "present",
    note: null,
  },
];

function editorElement(overrides: Partial<Parameters<typeof AttendanceEditor>[0]> = {}) {
  return (
    <AttendanceEditor
      sessionId="ses-1"
      roster={ROSTER}
      pausedCount={0}
      staff={STAFF}
      isEditor
      canTakeover={false}
      editorName={null}
      leaseMinutes={15}
      leaseExpiresAt={null}
      isFinalized={false}
      {...overrides}
    />
  );
}

function renderEditor(overrides: Partial<Parameters<typeof AttendanceEditor>[0]> = {}) {
  return render(editorElement(overrides));
}

function unloadIsBlocked() {
  return !window.dispatchEvent(new Event("beforeunload", { cancelable: true }));
}

function rowButton(label: string) {
  return screen.getByRole("button", { name: new RegExp(label) });
}

function column(label: string) {
  return screen.getByRole("combobox", { name: label });
}

beforeEach(() => {
  saveAttendance.mockClear();
});

describe("attendance unsaved protection", () => {
  it("starts clean, detects an edit, and becomes clean after reverting", async () => {
    const user = userEvent.setup();
    renderEditor();
    expect(unloadIsBlocked()).toBe(false);
    await user.selectOptions(column("Thánh lễ của Giuse Nguyễn Minh An"), "unexcused_absence");
    expect(unloadIsBlocked()).toBe(true);
    await user.selectOptions(column("Thánh lễ của Giuse Nguyễn Minh An"), "present");
    expect(unloadIsBlocked()).toBe(false);
  });

  it("only clears dirty state after a successful save", async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.selectOptions(column("Thánh lễ của Giuse Nguyễn Minh An"), "unexcused_absence");
    saveAttendance.mockResolvedValueOnce({ ok: false, code: "CONFLICT", message: "Không lưu được." });
    await user.click(screen.getByRole("button", { name: "Lưu nháp" }));
    await screen.findByText("Không lưu được.");
    expect(unloadIsBlocked()).toBe(true);
    await waitFor(() => expect(screen.getByRole("button", { name: "Lưu nháp" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Lưu nháp" }));
    await screen.findByText("Đã lưu nháp.");
    await waitFor(() => expect(unloadIsBlocked()).toBe(false));
  });

  it("retains a newer draft through save acknowledgement and refreshed props", async () => {
    const user = userEvent.setup();
    const view = renderEditor();
    const saved = await saveAttendance.getMockImplementation()!({});
    let resolve!: (result: SaveAttendanceResult) => void;
    saveAttendance.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    await user.selectOptions(column("Thánh lễ của Giuse Nguyễn Minh An"), "unexcused_absence");
    await user.click(screen.getByRole("button", { name: "Lưu nháp" }));
    await user.selectOptions(column("Thánh lễ của Giuse Nguyễn Minh An"), "present");
    await act(async () => { resolve(saved); });
    expect(unloadIsBlocked()).toBe(true);
    view.rerender(editorElement({ roster: ROSTER.map((entry, index) => index === 0 ? { ...entry, massStatus: "unexcused_absence" } : entry) }));
    expect(column("Thánh lễ của Giuse Nguyễn Minh An")).toHaveValue("present");
    expect(unloadIsBlocked()).toBe(true);
  });

  it("syncs refreshed server values when the attendance draft is clean", () => {
    const view = renderEditor();
    view.rerender(editorElement({ roster: ROSTER.map((entry, index) => index === 0 ? { ...entry, massStatus: "unexcused_absence" } : entry) }));
    expect(column("Thánh lễ của Giuse Nguyễn Minh An")).toHaveValue("unexcused_absence");
    expect(unloadIsBlocked()).toBe(false);
  });
});

describe("Mobile roster: direct controls and detail sheet", () => {
  it("shows both saved statuses without opening a row", () => {
    renderEditor();
    expect(column("Thánh lễ của Phêrô Lê Văn Đức")).toHaveValue("late");
    expect(column("Giáo lý của Phêrô Lê Văn Đức")).toHaveValue("present");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it.each(["present", "unexcused_absence", "excused_absence", "late", "left_early"])("%s remains independent in both columns", async (status) => {
    const user = userEvent.setup(); renderEditor();
    const mass = column("Thánh lễ của Giuse Nguyễn Minh An");
    const lesson = column("Giáo lý của Giuse Nguyễn Minh An");
    expect(within(mass).getAllByRole("option")).toHaveLength(5);
    await user.selectOptions(mass, status);
    expect(mass).toHaveValue(status); expect(lesson).toHaveValue("present");
    await user.selectOptions(mass, "late");
    await user.selectOptions(lesson, status);
    expect(mass).toHaveValue("late"); expect(lesson).toHaveValue(status);
  });
  it("closing and reopening details keeps both statuses and the internal note", async () => {
    const user = userEvent.setup(); renderEditor();
    await user.selectOptions(column("Thánh lễ của Giuse Nguyễn Minh An"), "unexcused_absence");
    await user.click(rowButton("Giuse Nguyễn Minh An"));
    await user.type(screen.getByRole("textbox", { name: /Ghi chú nội bộ của Giuse/ }), "Đã gọi gia đình");
    await user.click(screen.getByRole("button", { name: "Xong" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(rowButton("Giuse Nguyễn Minh An"));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: /Ghi chú nội bộ của Giuse/ })).toHaveValue("Đã gọi gia đình");
    expect(column("Thánh lễ của Giuse Nguyễn Minh An")).toHaveValue("unexcused_absence");
  });
  it("read-only disables both selects and notes", async () => {
    const user = userEvent.setup(); renderEditor({ isEditor: false });
    expect(column("Thánh lễ của Giuse Nguyễn Minh An")).toBeDisabled();
    expect(column("Giáo lý của Giuse Nguyễn Minh An")).toBeDisabled();
    await user.click(rowButton("Giuse Nguyễn Minh An"));
    expect(screen.getByRole("textbox", { name: /Ghi chú nội bộ của Giuse/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Lưu nháp" })).toBeNull();
  });
});

describe("TB-09 — badge cảnh báo chuyên cần", () => {
  it("hiện ở hàng gấp lại, kèm LÝ DO cho trình đọc màn hình", () => {
    renderEditor();

    expect(
      within(rowButton("Phêrô Lê Văn Đức")).getByLabelText(
        "Cảnh báo chuyên cần: Vắng lễ Chúa nhật nhiều buổi liên tiếp",
      ),
    ).toBeInTheDocument();
    expect(within(rowButton("Giuse Nguyễn Minh An")).queryByText("Cảnh báo")).not.toBeInTheDocument();
  });

  it("mở hàng ra thì lý do thành chữ đọc được bằng mắt", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(rowButton("Phêrô Lê Văn Đức"));
    expect(
      screen.getByText("Vắng lễ Chúa nhật nhiều buổi liên tiếp"),
    ).toBeInTheDocument();
  });
});

describe("U-11 — lọc và tìm ngay trên danh sách", () => {
  it("nhãn nút lọc mang con số của CẢ BUỔI", () => {
    renderEditor();

    expect(screen.getByRole("button", { name: "Tất cả (3)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đang vắng (0)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Có đơn (1)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cảnh báo (1)" })).toBeInTheDocument();
  });

  it("🔴 con số 'Đang vắng' cập nhật NGAY khi vừa đánh vắng, chưa cần bấm Lưu", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.selectOptions(column("Thánh lễ của Giuse Nguyễn Minh An"), "unexcused_absence");

    expect(screen.getByRole("button", { name: "Đang vắng (1)" })).toBeInTheDocument();
    expect(saveAttendance).not.toHaveBeenCalled();
  });

  it("lọc “Có đơn” chỉ còn em có đơn", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Có đơn (1)" }));

    expect(screen.getByRole("button", { name: /Maria Trần Thị Ánh/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Giuse Nguyễn Minh An/ })).not.toBeInTheDocument();
  });

  it("ô tìm bỏ dấu, và lọc rỗng thì nói đúng lý do", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.type(screen.getByLabelText("Tìm thiếu nhi theo tên"), "duc");
    expect(screen.getByRole("button", { name: /Phêrô Lê Văn Đức/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Maria Trần Thị Ánh/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Có đơn (1)" }));
    expect(screen.getByText(/Không có em nào khớp “duc” trong nhóm “Có đơn”/)).toBeInTheDocument();
  });

  it("🔴 lọc KHÔNG bỏ em nào khỏi lượt ghi", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Có đơn (1)" }));
    await user.click(screen.getByRole("button", { name: "Lưu nháp" }));

    // Bộ lọc là chuyện của mắt. Gửi đi thiếu em nào là xóa trắng điểm danh của
    // em ấy ở lượt lưu kế tiếp.
    const input = saveAttendance.mock.calls[0][0] as { students: unknown[] };
    expect(input.students).toHaveLength(3);
  });
});

describe("TB-03 — hộp xác nhận trước khi chốt", () => {
  it("bấm “Hoàn tất” chưa gửi gì cả; bấm “Quay lại sửa” cũng vậy", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Hoàn tất điểm danh" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(saveAttendance).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Quay lại sửa" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(saveAttendance).not.toHaveBeenCalled();
  });

  it("hộp thoại nêu phân bố tính từ bản nháp đang gõ", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.selectOptions(column("Thánh lễ của Giuse Nguyễn Minh An"), "unexcused_absence");
    await user.click(screen.getByRole("button", { name: "Hoàn tất điểm danh" }));

    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByRole("row", { name: /Vắng không phép/ })).toBeInTheDocument();
    expect(dialog.getByText(/Giáo lý viên có mặt: 1\/1/)).toBeInTheDocument();
  });

  it("🔴 nhắc ĐÍCH DANH em có đơn mà vẫn để “Có mặt” cả hai cột", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Hoàn tất điểm danh" }));

    expect(
      within(screen.getByRole("dialog")).getByText(/Maria Trần Thị Ánh/),
    ).toBeInTheDocument();
  });

  it("xác nhận rồi mới gọi chốt, và gọi đúng một lần", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Hoàn tất điểm danh" }));
    await user.click(screen.getByRole("button", { name: "Chốt buổi điểm danh" }));

    expect(saveAttendance).toHaveBeenCalledTimes(1);
    expect((saveAttendance.mock.calls[0][0] as { finalize: boolean }).finalize).toBe(true);
    expect(await screen.findByText("Đã chốt buổi điểm danh.")).toBeInTheDocument();
  });

  it("buổi đã chốt thì hộp thoại nói “Chốt lại”", async () => {
    const user = userEvent.setup();
    renderEditor({ isFinalized: true });

    await user.click(screen.getByRole("button", { name: "Chốt lại" }));
    expect(screen.getByRole("heading", { name: "Chốt lại buổi điểm danh?" })).toBeInTheDocument();
  });
});

describe("U-17 / U-18 — thông báo nằm cạnh nút vừa bấm", () => {
  it("thông báo thành công nằm TRONG thanh hành động", async () => {
    const user = userEvent.setup();
    renderEditor();

    const saveButton = screen.getByRole("button", { name: "Lưu nháp" });
    await user.click(saveButton);

    const notice = await screen.findByText("Đã lưu nháp.");
    // Cùng một khối với hai cái nút — trên máy 360px với 50 em, đầu trang và
    // đáy trang cách nhau hàng nghìn pixel.
    expect(saveButton.closest("div.sticky")).toContainElement(notice);
    expect(notice.closest("[role]")).toHaveAttribute("role", "status");
  });

  it("lỗi mang role=alert và kéo focus về đúng chỗ (U-25)", async () => {
    const user = userEvent.setup();
    saveAttendance.mockResolvedValueOnce({
      ok: false,
      message: "Buổi điểm danh đang có người khác phụ trách.",
    } as never);
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Lưu nháp" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Buổi điểm danh đang có người khác phụ trách.");
    // U-25: sau một lượt ghi, focus không được rơi về <body> để rồi người dùng
    // bàn phím phải Tab lại qua ~150 điều khiển.
    expect(document.activeElement).not.toBe(document.body);
  });
});

describe("TB-05 — đồng hồ phiên chỉnh sửa", () => {
  it("mất quyền sửa khóa thao tác, đóng xác nhận và giữ nháp chưa lưu", async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(heartbeatAttendanceSession).mockResolvedValueOnce({ ok: false, code: "CONFLICT", message: "Buổi đã được tiếp quản." });
      renderEditor();
      fireEvent.change(column("Thánh lễ của Giuse Nguyễn Minh An"), { target: { value: "late" } });
      fireEvent.click(rowButton("Giuse Nguyễn Minh An"));
      fireEvent.change(screen.getByRole("textbox", { name: /Ghi chú nội bộ của Giuse/ }), { target: { value: "Còn ghi chú chưa lưu" } });
      fireEvent.keyDown(document, { key: "Escape" });
      fireEvent.click(screen.getByRole("button", { name: "Hoàn tất điểm danh" }));
      await act(async () => vi.advanceTimersByTimeAsync(450_000));
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(column("Thánh lễ của Giuse Nguyễn Minh An")).toBeDisabled();
      expect(column("Giáo lý của Giuse Nguyễn Minh An")).toBeDisabled();
      expect(column("Thánh lễ của Giuse Nguyễn Minh An")).toHaveValue("late");
      expect((screen.getByLabelText("Thay đổi chưa lưu của bạn") as HTMLTextAreaElement).value).toContain("Còn ghi chú chưa lưu");
      expect(screen.queryByRole("button", { name: "Lưu nháp" })).toBeNull();
      expect(saveAttendance).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
  it("hiện thời gian còn lại trong một vùng aria-live", async () => {
    renderEditor({ leaseExpiresAt: new Date(Date.now() + 12 * 60_000).toISOString() });

    const clock = await screen.findByText(/Bạn đang giữ quyền sửa/);
    expect(clock).toHaveAttribute("aria-live", "polite");
    expect(clock).toHaveTextContent("12 phút");
  });

  it("người chỉ xem không thấy đồng hồ của người khác", () => {
    renderEditor({
      isEditor: false,
      editorName: "Têrêsa Nguyễn Thị Mai",
      leaseExpiresAt: new Date(Date.now() + 12 * 60_000).toISOString(),
    });

    expect(screen.queryByText(/Bạn đang giữ quyền sửa/)).not.toBeInTheDocument();
  });
});
