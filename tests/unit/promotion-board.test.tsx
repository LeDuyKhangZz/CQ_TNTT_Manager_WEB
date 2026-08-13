import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PromotionBatchCandidate } from "@/features/promotions/batch-proposal";
import type { PromotionRosterItem, PromotionTargetOption } from "@/features/promotions/server/queries";

/**
 * M08-A — bảng chuyển lớp sau khi thiết kế lại (**TO-BE 1 / AC-12**), và những
 * gì của Phase 5 phải sống sót qua đợt này.
 *
 * 🔴 Bộ test canh **bốn** điều, mỗi điều chữa một lỗi thật:
 *
 *   · **BR-M08-X2** — lớp đích mặc định **giữ nhánh A/B**. Bản cũ lấy phần tử
 *     đầu danh sách đã sắp theo tên, nên mọi em lớp nhánh B đều được đề xuất
 *     sẵn sang lớp nhánh A. Đây là điều `docs/03` WF-11 đòi từ đầu và hệ thống
 *     **chưa bao giờ làm**.
 *   · **`06_UI_UX_RECOMMENDATIONS` §4** — ô "Lớp đích khi duyệt" là `required`
 *     mà **không có lựa chọn nào** khi năm sau chưa tạo lớp: người duyệt bấm
 *     Duyệt, trình duyệt chặn im lặng, và không một chữ nào giải thích.
 *   · **`06` §3 và tiêu chí 7** — bảng phải nói ra **trạng thái** và **nội dung
 *     đề xuất** của từng em ngay trên dòng, không bắt mở panel ra mới biết.
 *   · **Ranh giới quyền hiển thị** — người chỉ được duyệt không thấy biểu mẫu
 *     đề xuất, và ngược lại. Ẩn nút không phải authorization (`AGENTS` §5),
 *     nhưng hiện nhầm nút là mời người dùng vào một thao tác chắc chắn bị từ chối.
 */
/**
 * 🔴 Hai mock phải khai **tham số**, không phải `vi.fn(async () => …)`.
 * Không có tham số thì `mock.calls[0]` mang kiểu tuple rỗng, và
 * `mock.calls[0]?.[0]` — thứ ba bài dưới đây dùng để chứng minh **giá trị nào**
 * được gửi lên máy chủ — không biên dịch được. `vitest` vẫn chạy vì nó không
 * kiểm kiểu; chỉ `tsc --noEmit` bắt.
 */
const proposeAction = vi.fn(async (_input: unknown) => ({
  ok: true as const,
  data: { id: "review-1" },
}));
const reviewAction = vi.fn(async (_input: unknown) => ({
  ok: true as const,
  data: { enrollmentId: "enr-2" },
}));
/** M08-B / D-159 — đường "Chuyển lớp" một bước của cấp xứ đoàn. */
const transferAction = vi.fn(async (_input: unknown) => ({
  ok: true as const,
  data: { enrollmentId: "enr-3" },
}));
/** M08-C / AC-20 — đề xuất hàng loạt. */
const batchAction = vi.fn(async (_input: unknown) => ({
  ok: true as const,
  data: { succeeded: 2, failed: [] as { studentName: string; message: string }[] },
}));
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/features/promotions/server/actions", () => ({
  proposePromotion: (input: unknown) => proposeAction(input),
  proposePromotionBatch: (input: unknown) => batchAction(input),
  reviewPromotion: (input: unknown) => reviewAction(input),
  transferEnrollmentNow: (input: unknown) => transferAction(input),
}));

const { PromotionBoard } = await import("@/features/promotions/components/promotion-board");

const GRADE_1 = "grade-au-1";
const GRADE_2 = "grade-au-2";

const TARGETS: PromotionTargetOption[] = [
  {
    id: "class-au-2a",
    displayName: "Ấu 2A",
    academicYearCode: "2081-2082",
    yearStart: "2081-08-01",
    gradeLevelId: GRADE_2,
    sectionCode: "A",
    classKind: "catechism",
  },
  {
    id: "class-au-2b",
    displayName: "Ấu 2B",
    academicYearCode: "2081-2082",
    yearStart: "2081-08-01",
    gradeLevelId: GRADE_2,
    sectionCode: "B",
    classKind: "catechism",
  },
];

function makeItem(overrides: Partial<PromotionRosterItem> = {}): PromotionRosterItem {
  return {
    enrollmentId: "enr-1",
    studentId: "stu-1",
    studentName: "Maria Nguyễn Thị An",
    classId: "class-au-1b",
    className: "Ấu 1B",
    sectionCode: "B",
    yearCode: "2080-2081",
    yearStart: "2080-08-01",
    gradeLevelId: GRADE_1,
    nextGradeLevelId: GRADE_2,
    sourceSectorId: "sector-au",
    canProposeTrainee: false,
    canPropose: true,
    canReview: false,
    canTransferDirectly: false,
    enrollmentOpen: true,
    finalStatus: null,
    review: null,
    ...overrides,
  };
}

beforeEach(() => {
  proposeAction.mockClear();
  reviewAction.mockClear();
  transferAction.mockClear();
  batchAction.mockClear();
  refresh.mockClear();
});

describe("bảng danh sách", () => {
  it("nói ra tên · lớp · trạng thái ngay trên dòng, không bắt mở panel mới biết", () => {
    render(<PromotionBoard roster={[makeItem()]} targets={TARGETS} />);
    expect(screen.getByText("Maria Nguyễn Thị An")).toBeInTheDocument();
    expect(screen.getByText("Ấu 1B")).toBeInTheDocument();
    expect(screen.getByText("Chưa đề xuất")).toBeInTheDocument();
  });

  it("panel đóng sẵn — 25 em không đổ 25 cặp biểu mẫu vào một trang", () => {
    render(<PromotionBoard roster={[makeItem()]} targets={TARGETS} />);
    expect(screen.queryByLabelText("Lớp đích")).not.toBeInTheDocument();
  });

  it("nút mở panel nêu TÊN EM cho trình đọc màn hình, không phải 25 nút giống hệt nhau", () => {
    render(<PromotionBoard roster={[makeItem()]} targets={TARGETS} />);
    expect(screen.getByRole("button", { name: /Mở chi tiết của Maria Nguyễn Thị An/ }))
      .toHaveAttribute("aria-expanded", "false");
  });

  it("mở rồi đóng lại được, và aria-expanded đi theo", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[makeItem()]} targets={TARGETS} />);
    const toggle = screen.getByRole("button", { name: /Mở chi tiết của/ });
    await user.click(toggle);
    expect(screen.getByLabelText("Lớp đích")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Đóng chi tiết của/ }));
    expect(screen.queryByLabelText("Lớp đích")).not.toBeInTheDocument();
  });

  it("mở em thứ hai thì đóng em thứ nhất — hai panel mở cùng lúc trên 360px là một trang không đọc được", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem(), makeItem({ enrollmentId: "enr-2", studentId: "stu-2", studentName: "Giuse Trần Văn Bình" })]}
        targets={TARGETS}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của Maria/ }));
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của Giuse/ }));
    expect(screen.getAllByLabelText("Lớp đích")).toHaveLength(1);
  });
});

describe("BR-M08-X2 — lớp đích mặc định giữ nhánh A/B", () => {
  it("em lớp Ấu 1B mở ra thấy sẵn Ấu 2B, KHÔNG phải Ấu 2A", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[makeItem()]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByLabelText("Lớp đích")).toHaveValue("class-au-2b");
  });

  it("em lớp nhánh A vẫn ra Ấu 2A", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem({ classId: "class-au-1a", className: "Ấu 1A", sectionCode: "A" })]}
        targets={TARGETS}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByLabelText("Lớp đích")).toHaveValue("class-au-2a");
  });

  it("lớp đích người dùng ĐÃ chọn lần trước thắng mặc định nhánh", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem({
          finalStatus: "pending",
          review: {
            id: "rev-1",
            proposedStatus: "recommended_promote",
            finalStatus: "pending",
            proposedTargetClassId: "class-au-2a",
            approvedTargetClassId: null,
            proposeTrainee: false,
            representativeNote: null,
            reviewNote: null,
            proposedAt: "2081-05-01T00:00:00Z",
            reviewedAt: null,
            proposedByName: null,
            reviewedByName: null,
            warningSnapshot: {},
            events: [],
          },
        })]}
        targets={TARGETS}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByLabelText("Lớp đích")).toHaveValue("class-au-2a");
  });
});

describe("biểu mẫu đề xuất", () => {
  it("gửi đúng lớp đích và báo thành công NÊU TÊN EM (D-61)", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[makeItem()]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    await user.click(screen.getByRole("button", { name: "Gửi đề xuất cho Trưởng ngành" }));

    expect(proposeAction).toHaveBeenCalledTimes(1);
    expect(proposeAction.mock.calls[0]?.[0]).toMatchObject({
      sourceEnrollmentId: "enr-1",
      proposedStatus: "recommended_promote",
      targetClassId: "class-au-2b",
    });
    expect(await screen.findByText(/Đã gửi đề xuất của Maria Nguyễn Thị An/)).toBeInTheDocument();
  });

  it("ô ghi chú là textarea nhiều dòng, không phải ô một dòng cho 1.000 ký tự", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[makeItem()]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByLabelText("Ghi chú đại diện").tagName).toBe("TEXTAREA");
  });

  it("chọn 'Tạm nghỉ' thì ô lớp đích biến mất — trạng thái đó không có lớp đích", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[makeItem()]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    await user.selectOptions(screen.getByLabelText("Đề xuất"), "temporarily_pause");
    expect(screen.queryByLabelText("Lớp đích")).not.toBeInTheDocument();
  });

  it("người không được đề xuất KHÔNG thấy biểu mẫu đề xuất", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[makeItem({ canPropose: false })]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.queryByRole("button", { name: /Gửi đề xuất/ })).not.toBeInTheDocument();
  });
});

describe("biểu mẫu duyệt", () => {
  const pendingItem = makeItem({
    canPropose: false,
    canReview: true,
    finalStatus: "pending",
    review: {
      id: "rev-1",
      proposedStatus: "recommended_promote",
      finalStatus: "pending",
      proposedTargetClassId: "class-au-2b",
      approvedTargetClassId: null,
      proposeTrainee: false,
      representativeNote: "Em tiến bộ nhiều",
      reviewNote: null,
      proposedAt: "2081-05-01T00:00:00Z",
      reviewedAt: null,
      proposedByName: "Anna Phạm Thị Đại Diện",
      reviewedByName: null,
      warningSnapshot: { weightedAverage: 8.4, warnLowRate: true },
      events: [],
    },
  });

  it("duyệt gửi đúng review và lớp đích, báo thành công nêu tên em", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[pendingItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    // M08-C / AC-14 — nút "Duyệt" nay mở hộp xác nhận trước.
    await user.click(screen.getByRole("button", { name: "Duyệt" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Duyệt lên lớp" }));

    expect(reviewAction.mock.calls[0]?.[0]).toMatchObject({
      reviewId: "rev-1",
      decision: "approve",
      targetClassId: "class-au-2b",
    });
    expect(await screen.findByText(/Đã duyệt và cập nhật ghi danh của Maria/)).toBeInTheDocument();
  });

  it("từ chối gửi decision='reject'", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[pendingItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    // M08-C / AC-15 — từ chối nay phải có lý do.
    await user.type(screen.getByLabelText(/Ý kiến trưởng ngành/), "Chưa đủ chuyên cần");
    await user.click(screen.getByRole("button", { name: "Từ chối" }));
    expect(reviewAction.mock.calls[0]?.[0]).toMatchObject({
      decision: "reject",
      note: "Chưa đủ chuyên cần",
    });
  });

  /* --------------------------------------------------------------------
   * M08-C — AC-14 · AC-15 · hạng mục 8. Ba nợ cuối của module.
   * ------------------------------------------------------------------ */

  it("🔴 AC-14 — bấm 'Duyệt' KHÔNG duyệt ngay; hộp xác nhận nêu tên em, lớp cũ, lớp mới", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[pendingItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    await user.click(screen.getByRole("button", { name: "Duyệt" }));

    expect(reviewAction).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByText(/Maria Nguyễn Thị An/).length).toBeGreaterThan(0);
    expect(within(dialog).getByText(/Ấu 1B/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Ấu 2B · 2081-2082/)).toBeInTheDocument();
    expect(within(dialog).getByText(/không có đường lùi/)).toBeInTheDocument();
  });

  it("AC-14 — huỷ hộp xác nhận thì KHÔNG có gì được ghi", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[pendingItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    await user.click(screen.getByRole("button", { name: "Duyệt" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Huỷ" }));
    expect(reviewAction).not.toHaveBeenCalled();
  });

  it("🔴 AC-14 — hộp xác nhận in lớp ĐANG CHỌN, và nói ra khi nó khác lớp đại diện đề nghị", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[pendingItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    // Người duyệt đổi lớp đích trước khi bấm Duyệt — một cú lăn chuột là đủ.
    await user.selectOptions(screen.getByLabelText("Lớp đích khi duyệt"), "class-au-2a");
    await user.click(screen.getByRole("button", { name: "Duyệt" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/đại diện lớp đề nghị Ấu 2B/)).toBeInTheDocument();
    expect(within(dialog).getByText(/bạn đang chọn Ấu 2A/)).toBeInTheDocument();
  });

  it("🔴 AC-15 — bấm 'Từ chối' với ô ý kiến trống thì KHÔNG gọi máy chủ và hiện lỗi", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[pendingItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    await user.click(screen.getByRole("button", { name: "Từ chối" }));

    expect(reviewAction).not.toHaveBeenCalled();
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Vui lòng nêu lý do từ chối.")).toBeInTheDocument();
  });

  it("AC-15 — 'Từ chối' KHÔNG mở hộp xác nhận: lý do bắt buộc đã là chỗ dừng lại", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[pendingItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    await user.type(screen.getByLabelText(/Ý kiến trưởng ngành/), "Chưa đủ chuyên cần");
    await user.click(screen.getByRole("button", { name: "Từ chối" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(reviewAction).toHaveBeenCalledTimes(1);
  });

  it("ô ý kiến nói ra rằng nó bắt buộc khi từ chối, kể cả khi em không thiếu bí tích", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[pendingItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByText(/Bắt buộc khi từ chối/)).toBeInTheDocument();
  });

  it("hạng mục 8 — panel nói ra AI đã đề xuất", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[pendingItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByText(/Anna Phạm Thị Đại Diện/)).toBeInTheDocument();
  });

  it("hạng mục 8 — cửa sổ hẹp không tra được tên thì KHÔNG in một dấu gạch vô nghĩa", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem({ ...pendingItem, review: { ...pendingItem.review!, proposedByName: null } })]}
        targets={TARGETS}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    // Dòng vẫn đọc trọn nghĩa bằng ngày gửi, không có ` · —` treo lơ lửng.
    expect(screen.getByText(/^Gửi ngày/)).toBeInTheDocument();
    expect(screen.queryByText(/Anna Phạm Thị Đại Diện/)).not.toBeInTheDocument();
  });

  it("cảnh báo tham khảo hiện ra và KHÔNG chặn duyệt — BR-M08-20 / AC-09", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[pendingItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByText(/tỷ lệ tham dự thấp/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duyệt" })).not.toBeDisabled();
  });

  it("🔴 năm sau CHƯA có lớp nào đúng cấp thì nói ra, không để một ô required trống", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[pendingItem]} targets={[]} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.queryByLabelText("Lớp đích khi duyệt")).not.toBeInTheDocument();
    expect(screen.getByText(/chưa có lớp nào đúng cấp/)).toBeInTheDocument();
  });

  it("người không được duyệt KHÔNG thấy nút Duyệt", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard roster={[makeItem({ ...pendingItem, canReview: false })]} targets={TARGETS} />,
    );
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.queryByRole("button", { name: "Duyệt" })).not.toBeInTheDocument();
  });

  it("đề xuất ĐÃ DUYỆT thì không còn biểu mẫu nào — không có đường lùi, và màn hình nói đúng điều đó", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem({
          canPropose: true,
          canReview: true,
          finalStatus: "approved",
          enrollmentOpen: false,
          review: { ...pendingItem.review!, finalStatus: "approved", reviewedAt: "2081-06-01T00:00:00Z" },
        })]}
        targets={TARGETS}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.queryByRole("button", { name: /Gửi đề xuất/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Duyệt" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Đã duyệt").length).toBeGreaterThan(0);
  });
});

/* =========================================================================
 * M08-B
 * ======================================================================= */

describe("M08-B · cảnh báo bí tích lớp cuối ngành (D-161 · AC-16 · AC-17)", () => {
  function itemWithSnapshot(warningSnapshot: Record<string, unknown>) {
    return makeItem({
      canPropose: false,
      canReview: true,
      finalStatus: "pending",
      review: {
        id: "rev-1",
        proposedStatus: "recommended_promote",
        finalStatus: "pending",
        proposedTargetClassId: "class-au-2b",
        approvedTargetClassId: null,
        proposeTrainee: false,
        representativeNote: null,
        reviewNote: null,
        proposedAt: "2081-05-01T00:00:00Z",
        reviewedAt: null,
        proposedByName: null,
        reviewedByName: null,
        warningSnapshot,
        events: [],
      },
    });
  }

  it("AC-16 — thiếu bí tích thì hiện tên từng bí tích và nói rõ KHÔNG chặn lên lớp", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[itemWithSnapshot({
          sacramentReviewRequired: true,
          missingSacraments: ["confirmation"],
        })]}
        targets={TARGETS}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByText(/Thêm sức/)).toBeInTheDocument();
    // Câu "không chặn" xuất hiện **hai** lần, và cả hai đều đúng chỗ: một ở khối
    // cảnh báo (người đọc để hiểu tình trạng của em), một dưới ô ý kiến (người
    // sắp bấm Duyệt, để hiểu vì sao ô ấy thành bắt buộc).
    expect(screen.getAllByText(/không chặn/).length).toBeGreaterThan(0);
  });

  it("AC-16 vế ba — ô ý kiến thành BẮT BUỘC, và nói ra vì sao", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[itemWithSnapshot({
          sacramentReviewRequired: true,
          missingSacraments: ["confirmation"],
        })]}
        targets={TARGETS}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByLabelText(/Ý kiến trưởng ngành/)).toBeRequired();
    expect(screen.getByText(/quyết định phải để lại lý do/)).toBeInTheDocument();
  });

  it("AC-17 — lớp thường: không một chữ nào về bí tích, ô ý kiến KHÔNG bắt buộc", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[itemWithSnapshot({ weightedAverage: 8.4 })]}
        targets={TARGETS}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.queryByText(/Lớp cuối ngành/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Ý kiến trưởng ngành/)).not.toBeRequired();
  });

  it("lớp cuối ngành mà em đủ bí tích: khẳng định là đủ, và KHÔNG bắt buộc ý kiến", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[itemWithSnapshot({ sacramentReviewRequired: true, missingSacraments: [] })]}
        targets={TARGETS}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByText(/đã có đủ bí tích/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ý kiến trưởng ngành/)).not.toBeRequired();
  });
});

describe("M08-B · nhật ký quyết định (D-157 · AC-18)", () => {
  const rejectedThenResent = makeItem({
    canPropose: true,
    canReview: true,
    finalStatus: "pending",
    review: {
      id: "rev-1",
      proposedStatus: "recommended_promote",
      finalStatus: "pending",
      proposedTargetClassId: "class-au-2b",
      approvedTargetClassId: null,
      proposeTrainee: false,
      representativeNote: "Đã bổ sung buổi bù",
      // 🔴 Hàng review KHÔNG còn lý do từ chối — `propose_promotion` xoá nó khi
      // gửi lại (BR-M08-16, giữ nguyên). Đó chính là lý do nhật ký tồn tại.
      reviewNote: null,
      proposedAt: "2081-05-10T00:00:00Z",
      reviewedAt: null,
      proposedByName: "Anna Phạm Thị Đại Diện",
      reviewedByName: null,
      warningSnapshot: {},
      // M08-C — `actorName` đến từ cửa sổ hẹp `list_promotion_actor_names`. Dòng
      // thứ ba cố ý để `null`: tài khoản bị xoá (`actor_id` là `on delete set
      // null`) hoặc người thao tác nằm ngoài cửa sổ là chuyện có thật, và nhật ký
      // vẫn phải đọc trọn nghĩa khi đó.
      events: [
        { eventNo: 1, eventType: "proposed", note: null, actorId: "p1", actorName: "Anna Phạm Thị Đại Diện", occurredAt: "2081-05-01T00:00:00Z" },
        { eventNo: 2, eventType: "rejected", note: "Chưa đủ chuyên cần", actorId: "p2", actorName: "Giuse Vũ Trưởng Ngành", occurredAt: "2081-05-05T00:00:00Z" },
        { eventNo: 3, eventType: "proposed", note: "Đã bổ sung buổi bù", actorId: "p1", actorName: null, occurredAt: "2081-05-10T00:00:00Z" },
      ],
    },
  });

  it("AC-18 — lý do từ chối vẫn đọc được sau khi đã gửi lại", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[rejectedThenResent]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByText("Nhật ký quyết định")).toBeInTheDocument();
    expect(screen.getByText(/Chưa đủ chuyên cần/)).toBeInTheDocument();
    expect(screen.getByText(/Trưởng ngành từ chối/)).toBeInTheDocument();
  });

  it("M08-C hạng mục 8 — nhật ký nêu TÊN người của từng bước", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[rejectedThenResent]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByText("Giuse Vũ Trưởng Ngành")).toBeInTheDocument();
  });

  it("🔴 M08-C — dòng KHÔNG tra được tên vẫn đọc trọn nghĩa nhờ vai trò của bước", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[rejectedThenResent]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    // Dòng 3 có `actorName: null` — nó vẫn hiện, mang nhãn vai trò, và KHÔNG
    // mang một dấu gạch hay chữ "Không rõ" (thứ khẳng định sai rằng hệ thống
    // không biết ai).
    expect(screen.getAllByText("Đại diện lớp gửi đề xuất")).toHaveLength(2);
    expect(screen.queryByText("Không rõ")).not.toBeInTheDocument();
  });

  it("một bước duy nhất thì không hiện khối nhật ký", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem({
          ...rejectedThenResent,
          review: {
            ...rejectedThenResent.review!,
            events: [rejectedThenResent.review!.events[0]],
          },
        })]}
        targets={TARGETS}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.queryByText("Nhật ký quyết định")).not.toBeInTheDocument();
  });
});

describe("M08-B · một nút Chuyển lớp cho cấp xứ đoàn (D-159)", () => {
  const groupLevelItem = makeItem({ canPropose: true, canTransferDirectly: true });

  it("nút đổi tên, và nói ra rằng đây là MỘT bước chứ không phải bước đầu của hai", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[groupLevelItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.getByRole("button", { name: "Chuyển lớp" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Gửi đề xuất cho Trưởng ngành" })).not.toBeInTheDocument();
    expect(screen.getByText(/vừa đề xuất vừa duyệt/)).toBeInTheDocument();
  });

  it("🔴 bấm một cái KHÔNG chuyển ngay — phải qua hộp xác nhận nêu hậu quả bằng tên riêng", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[groupLevelItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    await user.click(screen.getByRole("button", { name: "Chuyển lớp" }));

    expect(transferAction).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    // Tên em xuất hiện **hai** lần trong hộp thoại — ở tiêu đề và trong câu hậu
    // quả — nên `getByText` sẽ ném "nhiều hơn một kết quả". Đó là điều đúng, chứ
    // không phải điều cần sửa: cả hai chỗ đều phải nêu tên riêng (`11` §5).
    expect(within(dialog).getAllByText(/Maria Nguyễn Thị An/).length).toBeGreaterThan(0);
    expect(within(dialog).getByText(/Ấu 2B · 2081-2082/)).toBeInTheDocument();
    expect(within(dialog).getByText(/không có đường lùi/)).toBeInTheDocument();
  });

  it("xác nhận rồi mới gọi máy chủ, và báo lại kết quả THẬT (D-61)", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[groupLevelItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    await user.click(screen.getByRole("button", { name: "Chuyển lớp" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Chuyển lên lớp" }));

    expect(transferAction).toHaveBeenCalledTimes(1);
    expect(transferAction.mock.calls[0]?.[0]).toMatchObject({
      sourceEnrollmentId: "enr-1",
      proposedStatus: "recommended_promote",
      targetClassId: "class-au-2b",
      proposeTrainee: false,
    });
    expect(await screen.findByText(/Ghi danh cũ đã đóng và ghi danh mới đã được tạo/))
      .toBeInTheDocument();
  });

  it("huỷ hộp xác nhận thì không gọi gì cả", async () => {
    const user = userEvent.setup();
    render(<PromotionBoard roster={[groupLevelItem]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    await user.click(screen.getByRole("button", { name: "Chuyển lớp" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Huỷ" }));
    expect(transferAction).not.toHaveBeenCalled();
  });

  it("🔴 ĐÃ CÓ đề xuất của người khác thì KHÔNG có nút một bước — xử lý nó là việc của biểu mẫu duyệt", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem({
          canPropose: true,
          canReview: true,
          canTransferDirectly: true,
          finalStatus: "pending",
          review: {
            id: "rev-1",
            proposedStatus: "recommended_promote",
            finalStatus: "pending",
            proposedTargetClassId: "class-au-2b",
            approvedTargetClassId: null,
            proposeTrainee: false,
            representativeNote: null,
            reviewNote: null,
            proposedAt: "2081-05-01T00:00:00Z",
            reviewedAt: null,
            proposedByName: null,
            reviewedByName: null,
            warningSnapshot: {},
            events: [],
          },
        })]}
        targets={TARGETS}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    expect(screen.queryByRole("button", { name: "Chuyển lớp" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duyệt" })).toBeInTheDocument();
  });
});

/* =========================================================================
 * M08-C — đề xuất hàng loạt (TO-BE 2 / AC-20)
 * ======================================================================= */

describe("M08-C · đề xuất hàng loạt", () => {
  function makeCandidate(overrides: Partial<PromotionBatchCandidate> = {}): PromotionBatchCandidate {
    return {
      enrollmentId: "enr-1",
      studentName: "Maria Nguyễn Thị An",
      className: "Ấu 1B",
      classId: "class-au-1b",
      gradeLevelId: GRADE_1,
      nextGradeLevelId: GRADE_2,
      sectionCode: "B",
      yearStart: "2080-08-01",
      overwrites: false,
      ...overrides,
    };
  }

  /** Một em ở **trang sau**: có trong `selectable`, không có trong `roster`. */
  const OFF_PAGE = makeCandidate({
    enrollmentId: "enr-99",
    studentName: "Têrêsa Đỗ Thị Trang Sau",
  });

  it("không có ai chọn được thì KHÔNG hiện thanh hàng loạt, và bảng không có cột thừa", () => {
    render(<PromotionBoard roster={[makeItem()]} targets={TARGETS} selectable={[]} />);
    expect(screen.queryByRole("button", { name: /Chọn tất cả/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Chọn Maria/ })).not.toBeInTheDocument();
  });

  it("🔴 'Chọn tất cả' đếm theo BỘ LỌC, không theo trang đang xem", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem()]}
        targets={TARGETS}
        selectable={[makeCandidate(), OFF_PAGE]}
      />,
    );
    // Nút nói ra con số của cả bộ lọc TRƯỚC khi bấm — 2 em, dù chỉ 1 em hiện ra.
    await user.click(screen.getByRole("button", { name: "Chọn tất cả 2 em khớp bộ lọc" }));
    // Con số nằm trong `<span data-numeric>` riêng (`09` §3) nên câu bị chẻ qua
    // nhiều phần tử — đo trên `textContent` của cả dòng, không đo từng mảnh.
    const line = screen.getByText(/Đã chọn/);
    expect(line).toHaveTextContent("Đã chọn 2 em");
    // Và nói ra rằng có em đang được chọn mà KHÔNG nằm trên màn hình.
    expect(line).toHaveTextContent(/1 em ở trang khác/);
  });

  it("🔴 hộp xem lại liệt kê ĐỦ TÊN, kể cả em ở trang sau — không phải một con số", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem()]}
        targets={TARGETS}
        selectable={[makeCandidate(), OFF_PAGE]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Chọn tất cả 2 em khớp bộ lọc" }));
    await user.click(screen.getByRole("button", { name: "Xem lại và gửi 2 đề xuất" }));

    expect(batchAction).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByText(/Maria Nguyễn Thị An/).length).toBeGreaterThan(0);
    expect(within(dialog).getByText(/Têrêsa Đỗ Thị Trang Sau/)).toBeInTheDocument();
  });

  it("xác nhận rồi mới gửi, và gửi đúng cả em ở trang sau", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem()]}
        targets={TARGETS}
        selectable={[makeCandidate(), OFF_PAGE]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Chọn tất cả 2 em khớp bộ lọc" }));
    await user.click(screen.getByRole("button", { name: "Xem lại và gửi 2 đề xuất" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Gửi 2 đề xuất" }));

    expect(batchAction).toHaveBeenCalledTimes(1);
    expect(batchAction.mock.calls[0]?.[0]).toMatchObject({
      enrollmentIds: ["enr-1", "enr-99"],
      proposedStatus: "recommended_promote",
      // BR-M08-X2 áp cả cho hàng loạt: hai em cùng nhánh B ⇒ mặc định Ấu 2B.
      targetClassId: "class-au-2b",
    });
    expect(await screen.findByText(/Đã gửi 2 đề xuất/)).toBeInTheDocument();
  });

  it("bỏ tick một em thì em đó không nằm trong lượt gửi", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem()]}
        targets={TARGETS}
        selectable={[makeCandidate(), OFF_PAGE]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Chọn tất cả 2 em khớp bộ lọc" }));
    await user.click(screen.getByRole("checkbox", { name: /Chọn Maria Nguyễn Thị An/ }));
    await user.click(screen.getByRole("button", { name: "Xem lại và gửi 1 đề xuất" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Gửi 1 đề xuất" }));

    expect(batchAction.mock.calls[0]?.[0]).toMatchObject({ enrollmentIds: ["enr-99"] });
  });

  it("🔴 trộn nhiều CẤP thì nói ra ngay và khoá nút — không gửi 60 lượt để nhận 55 dòng đỏ", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem()]}
        targets={TARGETS}
        selectable={[
          makeCandidate(),
          makeCandidate({ enrollmentId: "enr-98", gradeLevelId: "grade-thieu-2" }),
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Chọn tất cả 2 em khớp bộ lọc" }));
    expect(screen.getByText(/nhiều cấp lớp khác nhau/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem lại và gửi 2 đề xuất" })).toBeDisabled();
  });

  it("trộn cấp nhưng chọn 'Tạm nghỉ' thì chạy được — trạng thái đó không có lớp đích", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem()]}
        targets={TARGETS}
        selectable={[
          makeCandidate(),
          makeCandidate({ enrollmentId: "enr-98", gradeLevelId: "grade-thieu-2" }),
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Chọn tất cả 2 em khớp bộ lọc" }));
    await user.selectOptions(screen.getByLabelText("Đề xuất chung"), "temporarily_pause");
    expect(screen.getByRole("button", { name: "Xem lại và gửi 2 đề xuất" })).not.toBeDisabled();
  });

  it("🔴 nói ra khi lượt này sẽ GHI ĐÈ đề xuất đang có của em", async () => {
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem()]}
        targets={TARGETS}
        selectable={[makeCandidate({ overwrites: true })]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Chọn tất cả 1 em khớp bộ lọc" }));
    await user.click(screen.getByRole("button", { name: "Xem lại và gửi 1 đề xuất" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/GHI ĐÈ/)).toBeInTheDocument();
    // Câu này xuất hiện **hai** lần, và cả hai đều đúng chỗ: một ở câu mở đầu
    // ("1 em đã có đề xuất"), một là huy hiệu trên chính dòng của em đó.
    expect(within(dialog).getAllByText(/đã có đề xuất/).length).toBe(2);
  });

  it("AC-20 vế hai — em bị bỏ qua được nêu ĐÍCH DANH trong kết quả", async () => {
    batchAction.mockResolvedValueOnce({
      ok: true as const,
      data: {
        succeeded: 1,
        failed: [{ studentName: "Têrêsa Đỗ Thị Trang Sau", message: "Đề xuất đã được duyệt." }],
      },
    });
    const user = userEvent.setup();
    render(
      <PromotionBoard
        roster={[makeItem()]}
        targets={TARGETS}
        selectable={[makeCandidate(), OFF_PAGE]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Chọn tất cả 2 em khớp bộ lọc" }));
    await user.click(screen.getByRole("button", { name: "Xem lại và gửi 2 đề xuất" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Gửi 2 đề xuất" }));

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/Têrêsa Đỗ Thị Trang Sau/)).toBeInTheDocument();
    expect(within(alert).getByText(/Đã gửi 1 đề xuất/)).toBeInTheDocument();
  });

  it("dòng KHÔNG chọn được vẫn giữ đủ số ô — bảng không lệch cột", () => {
    render(
      <PromotionBoard
        roster={[
          makeItem(),
          makeItem({ enrollmentId: "enr-2", studentName: "Giuse Trần Văn Bình", canPropose: false }),
        ]}
        targets={TARGETS}
        selectable={[makeCandidate()]}
      />,
    );
    const rows = screen.getAllByRole("row").filter((row) => row.querySelectorAll("td").length > 0);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.querySelectorAll("td")).toHaveLength(6);
    }
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  });
});

describe("thông báo lỗi", () => {
  it("lỗi từ máy chủ hiện nguyên văn câu tiếng Việt, trong một vùng role=alert", async () => {
    proposeAction.mockResolvedValueOnce({
      ok: false,
      code: "CONFLICT",
      message: "Ghi danh của em này không còn mở nên không đề xuất chuyển lớp được.",
    } as never);
    const user = userEvent.setup();
    render(<PromotionBoard roster={[makeItem()]} targets={TARGETS} />);
    await user.click(screen.getByRole("button", { name: /Mở chi tiết của/ }));
    await user.click(screen.getByRole("button", { name: "Gửi đề xuất cho Trưởng ngành" }));

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/không còn mở/)).toBeInTheDocument();
  });
});
