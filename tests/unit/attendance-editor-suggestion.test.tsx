import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  AttendanceRosterEntry,
  AttendanceStaffEntry,
} from "@/features/attendance/server/queries";

/**
 * M05-B · TB-06 bước 2 (AC-F13-3 / AC-F13-4) và **D-75** ở tầng giao diện.
 *
 * Bộ test ĐẦU TIÊN của `AttendanceEditor` — component quan trọng nhất hệ thống
 * (~40 Giáo lý viên dùng hằng tuần) tới đợt M05-B vẫn chưa có bài nào.
 *
 * 🔴 AC-F13-4 là bài dễ tưởng thừa nhất và là bài phải có: đơn xin nghỉ **không
 * bao giờ** được tự đổi trạng thái điểm danh, kể cả khi trang dựng lại. Nếu ai
 * đó "tối ưu" bằng cách đổ gợi ý vào giá trị khởi tạo, mọi thứ trông vẫn chạy
 * đúng — chỉ có điều quyết định của Giáo lý viên bị ghi đè sau mỗi lần refresh.
 *
 * **Cập nhật M05-C:** hàng danh sách nay gấp lại (D-143) và trạng thái là hàng
 * nút chứ không còn là ô chọn thả xuống (D-142), nên mọi bài phải **mở hàng ra**
 * trước khi chạm tới điều khiển. Nội dung điều cần chứng minh không đổi.
 */
const saveAttendance = vi.fn(async (_input: unknown) => ({
  ok: true as const,
  data: {
    status: "in_progress",
    finalizedAt: null,
    lockedAt: null,
    studentTotal: 2,
    studentPresent: 2,
    studentAbsent: 0,
    staffTotal: 0,
    staffPresent: 0,
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

const ROSTER: AttendanceRosterEntry[] = [
  {
    recordId: "rec-1",
    enrollmentId: "enr-1",
    studentId: "stu-1",
    label: "Maria Trần Thị Hoa",
    massStatus: "present",
    catechismStatus: "present",
    note: null,
    pendingAbsenceReason: "Cháu về quê giỗ ông",
    warnings: [],
  },
  {
    recordId: "rec-2",
    enrollmentId: "enr-2",
    studentId: "stu-2",
    label: "Anna Lê Bảo Trân",
    massStatus: "present",
    catechismStatus: "present",
    note: null,
    pendingAbsenceReason: null,
    warnings: [],
  },
];

const STAFF: AttendanceStaffEntry[] = [];

function renderEditor(overrides: Partial<Parameters<typeof AttendanceEditor>[0]> = {}) {
  return render(
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
    />,
  );
}

/** Mở hàng của một em ra để chạm được vào điều khiển (D-143). */
async function openRow(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole("button", { name: new RegExp(label) }));
}

/** Hàng nút của một cột — `<fieldset>` + `<legend>` cho ra role "group". */
function column(label: string) {
  return within(screen.getByRole("group", { name: label }));
}

beforeEach(() => {
  saveAttendance.mockClear();
});

describe("AC-F13-3/AC-F13-4 — đơn xin nghỉ chỉ GỢI Ý", () => {
  it("🔴 em có đơn vẫn mặc định 'Có mặt' khi trang vừa dựng", async () => {
    const user = userEvent.setup();
    renderEditor();

    // Đọc được ngay ở hàng gấp lại, không phải mở ra mới biết (D-143).
    const row = within(screen.getByRole("button", { name: /Maria Trần Thị Hoa/ }));
    expect(row.getByLabelText("Thánh lễ: Có mặt")).toBeInTheDocument();
    expect(row.getByLabelText("Giáo lý: Có mặt")).toBeInTheDocument();

    await openRow(user, "Maria Trần Thị Hoa");
    expect(column("Thánh lễ của Maria Trần Thị Hoa").getByRole("radio", { name: "Có mặt" }))
      .toBeChecked();
    expect(column("Giáo lý của Maria Trần Thị Hoa").getByRole("radio", { name: "Có mặt" }))
      .toBeChecked();
  });

  it("chỉ em CÓ đơn mới hiện nút gợi ý", async () => {
    const user = userEvent.setup();
    renderEditor();

    await openRow(user, "Maria Trần Thị Hoa");
    expect(screen.getAllByRole("button", { name: "Áp dụng gợi ý: Vắng có phép" })).toHaveLength(1);
    expect(screen.getByText(/Có đơn xin nghỉ: Cháu về quê giỗ ông/)).toBeInTheDocument();

    await openRow(user, "Anna Lê Bảo Trân");
    // Mở thêm một em KHÔNG có đơn cũng không sinh ra nút thứ hai.
    expect(screen.getAllByRole("button", { name: "Áp dụng gợi ý: Vắng có phép" })).toHaveLength(1);
  });

  it("bấm gợi ý đặt CẢ HAI cột — đơn khai theo buổi, không theo từng phần", async () => {
    const user = userEvent.setup();
    renderEditor();

    await openRow(user, "Maria Trần Thị Hoa");
    await user.click(screen.getByRole("button", { name: "Áp dụng gợi ý: Vắng có phép" }));

    expect(
      column("Thánh lễ của Maria Trần Thị Hoa").getByRole("radio", { name: "Vắng có phép" }),
    ).toBeChecked();
    expect(
      column("Giáo lý của Maria Trần Thị Hoa").getByRole("radio", { name: "Vắng có phép" }),
    ).toBeChecked();

    // Em không có đơn không bị đụng tới — đọc ngay ở hàng gấp lại của em ấy.
    await openRow(user, "Anna Lê Bảo Trân");
    expect(column("Thánh lễ của Anna Lê Bảo Trân").getByRole("radio", { name: "Có mặt" }))
      .toBeChecked();
  });

  it("gợi ý KHÔNG tự gửi đi — người điểm danh vẫn phải bấm Lưu", async () => {
    const user = userEvent.setup();
    renderEditor();

    await openRow(user, "Maria Trần Thị Hoa");
    await user.click(screen.getByRole("button", { name: "Áp dụng gợi ý: Vắng có phép" }));

    expect(saveAttendance).not.toHaveBeenCalled();
  });

  it("chế độ chỉ xem thì không có nút gợi ý", async () => {
    const user = userEvent.setup();
    renderEditor({ isEditor: false });

    await openRow(user, "Maria Trần Thị Hoa");
    expect(
      screen.queryByRole("button", { name: "Áp dụng gợi ý: Vắng có phép" }),
    ).not.toBeInTheDocument();
  });
});

describe("D-75 — ghi chú là ghi chú NỘI BỘ", () => {
  it("thẻ danh sách nói thẳng phụ huynh không nhìn thấy", () => {
    renderEditor();

    expect(
      screen.getByText(/Ghi chú là ghi chú nội bộ — phụ huynh không nhìn thấy/),
    ).toBeInTheDocument();
  });

  it("ô nhập ghi chú nhắc lại ngay tại chỗ gõ", async () => {
    const user = userEvent.setup();
    renderEditor();

    // Ô ghi chú chỉ hiện khi có ngoại lệ — bấm gợi ý là có ngoại lệ.
    await openRow(user, "Maria Trần Thị Hoa");
    await user.click(screen.getByRole("button", { name: "Áp dụng gợi ý: Vắng có phép" }));

    const noteInput = screen.getByLabelText(
      "Ghi chú nội bộ của Maria Trần Thị Hoa — phụ huynh không nhìn thấy",
    );
    expect(noteInput).toHaveAttribute(
      "placeholder",
      "Ghi chú nội bộ — phụ huynh không nhìn thấy",
    );
  });
});
