import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReportsPageData } from "@/features/reports/server/queries";

/**
 * M11-B — hai thay đổi hành vi của trang Báo cáo, và cả hai đều chữa một câu
 * **nói sai** chứ không phải một tính năng còn thiếu.
 *
 *   · **D-171** — ô "Kỳ báo cáo" từng cho chọn Tuần/Tháng cho báo cáo Kết quả,
 *     trong khi `report_results_rows` **bỏ qua hoàn toàn khoảng ngày**. Chọn
 *     "Tháng 09" cho ra số của **cả năm** dưới cái nhãn một tháng, và bản chốt
 *     ghi lại đúng cái nhãn sai ấy — vĩnh viễn, vì snapshot không sửa được.
 *   · **D-172 / AC-B09** — nút "Chốt báo cáo" từng ghi thẳng, không hỏi lại.
 *     `report_snapshots` chỉ có `grant select, insert`: một cú bấm nhầm để lại
 *     một hàng mà **kể cả Quản trị viên hệ thống cũng không xoá được**.
 *
 * 🔴 Bài quan trọng nhất là bài "huỷ thì không có hàng nào được tạo": một hộp
 * xác nhận gọi Server Action **trước khi** người dùng bấm Xác nhận là một hộp
 * trang trí, và nó nguy hiểm hơn không có hộp — người dùng tin là mình còn
 * đường lùi.
 */
const snapshotAction = vi.fn(async (_input: unknown) => ({
  ok: true as const,
  data: { id: "snapshot-1" },
}));
const refresh = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
}));

vi.mock("@/features/reports/server/actions", () => ({
  createReportSnapshot: (input: unknown) => snapshotAction(input),
}));

const { ReportWorkbench } = await import("@/features/reports/components/report-workbench");

const CLASS_AU_1A = "33333333-3333-4333-8333-333333333333";
const SECTOR_AU = "11111111-1111-4111-8111-111111111111";

function pageData(overrides: Partial<ReportsPageData> = {}): ReportsPageData {
  return {
    filter: {
      reportType: "attendance",
      periodType: "month",
      anchorDate: "2026-09-17",
      scopeType: "class",
      scopeId: CLASS_AU_1A,
    },
    academicYear: { id: "year-1", code: "2026-2027", startDate: "2026-09-01", endDate: "2027-05-31" },
    title: "Chuyên cần",
    from: "2026-09-01",
    to: "2026-09-30",
    headers: ["Lớp", "Sĩ số có điểm danh"],
    rows: [
      { classId: CLASS_AU_1A, className: "Ấu 1A", sectorId: SECTOR_AU, values: [30] },
      { classId: "class-2", className: "Ấu 1B", sectorId: SECTOR_AU, values: [28] },
    ],
    reason: "empty",
    sectors: [{ id: SECTOR_AU, name: "Ấu" }],
    classes: [{ id: CLASS_AU_1A, name: "Ấu 1A", sectorId: SECTOR_AU }],
    availableScopeTypes: ["global", "sector", "class"],
    snapshots: [],
    canSnapshot: true,
    canSnapshotAnyScope: true,
    duplicate: null,
    scopeLabel: "Lớp Ấu 1A",
    ...overrides,
  };
}

beforeEach(() => {
  snapshotAction.mockClear();
  refresh.mockClear();
  push.mockClear();
});

describe("D-171 — ô chọn kỳ của báo cáo Kết quả học tập", () => {
  it("báo cáo Chuyên cần vẫn cho chọn kỳ và ngày trong kỳ", () => {
    render(<ReportWorkbench data={pageData()} filterWarning={null} />);
    expect(screen.getByRole("combobox", { name: "Kỳ báo cáo" })).toBeInTheDocument();
    expect(screen.getByLabelText("Ngày trong kỳ")).toBeInTheDocument();
  });

  it("🔴 báo cáo Kết quả học tập KHÔNG còn ô chọn kỳ, và nói ra vì sao", () => {
    render(
      <ReportWorkbench
        data={pageData({ filter: { ...pageData().filter, reportType: "results", periodType: "year" } })}
        filterWarning={null}
      />,
    );
    expect(screen.queryByRole("combobox", { name: "Kỳ báo cáo" })).not.toBeInTheDocument();
    expect(screen.getByText("Báo cáo Kết quả học tập luôn tính cho cả năm học.")).toBeInTheDocument();
  });

  it("và ô 'Ngày trong kỳ' biến mất theo — nó không còn nghĩa gì khi kỳ là cả năm", () => {
    render(
      <ReportWorkbench
        data={pageData({ filter: { ...pageData().filter, reportType: "results", periodType: "year" } })}
        filterWarning={null}
      />,
    );
    expect(screen.queryByLabelText("Ngày trong kỳ")).not.toBeInTheDocument();
  });
});

describe("D-172 / AC-B09 — hộp xác nhận trước khi chốt", () => {
  it("🔴 bấm 'Chốt báo cáo' MỞ HỘP chứ không ghi ngay", async () => {
    const user = userEvent.setup();
    render(<ReportWorkbench data={pageData()} filterWarning={null} />);

    await user.click(screen.getByRole("button", { name: "Chốt báo cáo" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(snapshotAction).not.toHaveBeenCalled();
  });

  it("hộp nêu hậu quả BẰNG TÊN RIÊNG: loại · kỳ · khoảng ngày · phạm vi · số dòng", async () => {
    const user = userEvent.setup();
    render(<ReportWorkbench data={pageData()} filterWarning={null} />);
    await user.click(screen.getByRole("button", { name: "Chốt báo cáo" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Chuyên cần");
    expect(dialog).toHaveTextContent("Tháng");
    expect(dialog).toHaveTextContent("Lớp Ấu 1A");
    expect(dialog).toHaveTextContent("2 dòng");
    expect(dialog).toHaveTextContent("Bản chốt không sửa và không xoá được.");
  });

  it("🔴 bấm Huỷ thì KHÔNG có hàng nào được tạo — hộp không phải đồ trang trí", async () => {
    const user = userEvent.setup();
    render(<ReportWorkbench data={pageData()} filterWarning={null} />);
    await user.click(screen.getByRole("button", { name: "Chốt báo cáo" }));
    await user.click(screen.getByRole("button", { name: "Huỷ" }));

    expect(snapshotAction).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("xác nhận rồi mới gọi Server Action, và gửi ĐÚNG bộ lọc đang hiển thị (D-52)", async () => {
    const user = userEvent.setup();
    const data = pageData();
    render(<ReportWorkbench data={data} filterWarning={null} />);
    await user.click(screen.getByRole("button", { name: "Chốt báo cáo" }));
    // Hộp mở ra thì có HAI nút cùng tên: nút mở hộp và nút xác nhận trong hộp.
    // Nút xác nhận là nút nằm trong `role="dialog"`.
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Chốt báo cáo" }));

    expect(snapshotAction).toHaveBeenCalledTimes(1);
    expect(snapshotAction.mock.calls[0]?.[0]).toEqual(data.filter);
  });
});

describe("D-172 — hộp nhận ra bản chốt trùng", () => {
  it("không có bản trùng thì không có dòng cảnh báo nào", async () => {
    const user = userEvent.setup();
    render(<ReportWorkbench data={pageData()} filterWarning={null} />);
    await user.click(screen.getByRole("button", { name: "Chốt báo cáo" }));

    expect(screen.getByRole("dialog")).not.toHaveTextContent("bản chốt trùng");
  });

  it("🔴 có bản trùng thì nói ra SỐ BẢN, NGÀY và TÊN người chốt", async () => {
    const user = userEvent.setup();
    render(
      <ReportWorkbench
        data={pageData({
          duplicate: {
            id: "snapshot-cu",
            generatedAt: "2026-09-12T07:05:00.000Z",
            generatedByName: "Trưởng ngành Ấu",
            count: 2,
          },
        })}
        filterWarning={null}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Chốt báo cáo" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Đã có 2 bản chốt trùng");
    expect(dialog).toHaveTextContent("Trưởng ngành Ấu");
    expect(dialog).toHaveTextContent("12/09/2026");
    expect(dialog).toHaveTextContent("không thay thế bản cũ");
  });

  it("hồ sơ người chốt đã bị xoá thì vẫn cảnh báo, chỉ thiếu cái tên", async () => {
    const user = userEvent.setup();
    render(
      <ReportWorkbench
        data={pageData({
          duplicate: {
            id: "snapshot-cu",
            generatedAt: "2026-09-12T07:05:00.000Z",
            generatedByName: null,
            count: 1,
          },
        })}
        filterWarning={null}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Chốt báo cáo" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Đã có 1 bản chốt trùng");
  });
});

/**
 * M11-C — redesign theo `09` và a11y (AC-B15).
 *
 * 🔴 Ba lý do bảng trống nay ra **ba trạng thái rỗng chuẩn** chứ không ba câu
 * chữ xám giống nhau. `11` §5 đòi "trạng thái rỗng dùng đúng 1 trong 3 loại
 * chuẩn", và `03_AUDIT_RESULTS` tiêu chí 2 chấm module này 3/5 vì đúng chỗ này.
 */
describe("M11-C — trạng thái rỗng và dòng tóm tắt", () => {
  it("🔴 'ngoài phạm vi' và 'chưa có dữ liệu' KHÔNG còn ra cùng một màn hình", () => {
    const { unmount } = render(
      <ReportWorkbench data={pageData({ rows: [], reason: "out_of_scope" })} filterWarning={null} />,
    );
    expect(screen.getByText("Phạm vi này nằm ngoài phần bạn phụ trách")).toBeInTheDocument();
    unmount();

    render(<ReportWorkbench data={pageData({ rows: [], reason: "empty" })} filterWarning={null} />);
    expect(screen.getByText("Chưa có số liệu trong khoảng thời gian này")).toBeInTheDocument();
  });

  it("trạng thái rỗng nêu TÊN phạm vi cụ thể, không viết 'Không có dữ liệu' trống trơn", () => {
    render(
      <ReportWorkbench
        data={pageData({ rows: [], reason: "no_finalized_session" })}
        filterWarning={null}
      />,
    );
    expect(screen.getByText(/Lớp Ấu 1A — Trong khoảng này chưa có buổi điểm danh nào được chốt/))
      .toBeInTheDocument();
  });

  it("AC-B15 — số dòng kết quả nằm trong vùng aria-live", () => {
    const { container } = render(<ReportWorkbench data={pageData()} filterWarning={null} />);
    const live = container.querySelector("[aria-live='polite']");
    expect(live).not.toBeNull();
    expect(live).toHaveTextContent("2 dòng");
    expect(live).toHaveTextContent("Lớp Ấu 1A");
  });

  it("AC-B15 — bảng có caption nêu đúng loại, phạm vi và khoảng ngày", () => {
    const { container } = render(<ReportWorkbench data={pageData()} filterWarning={null} />);
    expect(container.querySelector("caption")).toHaveTextContent("Chuyên cần · Lớp Ấu 1A");
  });

  it("TB-06 — có đường vào kho bản chốt ngay trên trang", () => {
    render(<ReportWorkbench data={pageData()} filterWarning={null} />);
    expect(screen.getByRole("link", { name: "Mở kho bản chốt" }))
      .toHaveAttribute("href", "/reports/snapshots");
  });
});

describe("ranh giới của nút Chốt — không hồi quy M11-A", () => {
  it("vai trò không bao giờ chốt được thì KHÔNG thấy nút", () => {
    render(
      <ReportWorkbench
        data={pageData({ canSnapshot: false, canSnapshotAnyScope: false })}
        filterWarning={null}
      />,
    );
    expect(screen.queryByRole("button", { name: "Chốt báo cáo" })).not.toBeInTheDocument();
  });

  it("chốt được nhưng đang ở phạm vi rộng hơn phần mình phụ trách: nút vô hiệu KÈM LÝ DO", () => {
    render(
      <ReportWorkbench
        data={pageData({ canSnapshot: false, canSnapshotAnyScope: true })}
        filterWarning={null}
      />,
    );
    expect(screen.getByRole("button", { name: "Chốt báo cáo" })).toBeDisabled();
    expect(screen.getByText(/chỉ chốt được báo cáo trong phạm vi lớp hoặc ngành mình phụ trách/))
      .toBeInTheDocument();
  });
});
