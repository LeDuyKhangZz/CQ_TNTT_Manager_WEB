import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GradebookDetail } from "@/features/assessments/server/queries";

/**
 * M07-A — hai quyết định của đợt trong đúng component mà Giáo lý viên bấm hằng
 * tuần: **TB-M07-09** (hệ số mặc định đọc từ cấu hình năm học) và
 * **TB-M07-01 bước 5 / TB-M07-03 phương án B** (chỉ gửi ô đã đổi).
 *
 * ⚠️ Component dựng **hai** bản danh sách nhập điểm — một cho máy tính
 * (`hidden md:block`), một cho điện thoại (`md:hidden`). CSS không chạy trong
 * jsdom nên cả hai cùng có mặt trong DOM; mọi truy vấn ở đây phải dùng
 * `getAllBy*` và lấy bản đầu, nếu không bài kiểm đỏ vì *"tìm thấy nhiều phần
 * tử"* chứ không phải vì mã sai.
 */
const saveAssessmentScores = vi.fn(async (_input: unknown) => ({ ok: true as const, data: { count: 1 } }));
const deleteAssessment = vi.fn(async (_id: string) => ({ ok: true as const, data: { removedEmptyScores: 2 } }));
const archiveAssessment = vi.fn(async (_id: string) => ({ ok: true as const, data: undefined }));
const refreshAttendanceScores = vi.fn(async (_id: string) => ({
  ok: true as const,
  data: { refreshed: 0, skippedManual: 0 },
}));
const createStudentComment = vi.fn(async (_input: unknown) => ({ ok: true as const, data: { id: "c1" } }));
const restoreAssessment = vi.fn(async (_id: string) => ({ ok: true as const, data: undefined }));
const setAssessmentPublished = vi.fn(async (_input: unknown) => ({ ok: true as const, data: { changed: true } }));
const republishLeaderboard = vi.fn(async (_id: string) => ({ ok: true as const, data: undefined }));
const deleteLeaderboard = vi.fn(async (_id: string) => ({ ok: true as const, data: undefined }));
const publishLeaderboard = vi.fn(async (_input: unknown) => ({ ok: true as const, data: { count: 5 } }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/features/assessments/server/actions", () => ({
  saveAssessmentScores: (input: unknown) => saveAssessmentScores(input),
  createAssessment: vi.fn(async () => ({ ok: true, data: { id: "a1" } })),
  updateAssessment: vi.fn(async () => ({ ok: true, data: undefined })),
  deleteAssessment: (id: string) => deleteAssessment(id),
  archiveAssessment: (id: string) => archiveAssessment(id),
  restoreAssessment: (id: string) => restoreAssessment(id),
  setAssessmentPublished: (input: unknown) => setAssessmentPublished(input),
  refreshAttendanceScores: (id: string) => refreshAttendanceScores(id),
  resetAttendanceScoreOverride: vi.fn(async () => ({ ok: true, data: undefined })),
  createStudentComment: (input: unknown) => createStudentComment(input),
  updateStudentComment: vi.fn(async () => ({ ok: true, data: undefined })),
  deleteStudentComment: vi.fn(async () => ({ ok: true, data: undefined })),
  lockGradebook: vi.fn(async () => ({ ok: true, data: undefined })),
  unlockGradebook: vi.fn(async () => ({ ok: true, data: undefined })),
  createLeaderboard: vi.fn(async () => ({ ok: true, data: { id: "l1" } })),
  previewLeaderboard: vi.fn(async () => ({ ok: true, data: [] })),
  publishLeaderboard: (input: unknown) => publishLeaderboard(input),
  republishLeaderboard: (id: string) => republishLeaderboard(id),
  unpublishLeaderboard: vi.fn(async () => ({ ok: true, data: undefined })),
  deleteLeaderboard: (id: string) => deleteLeaderboard(id),
}));

const { GradebookEditor } = await import("@/features/assessments/components/gradebook-editor");

const DETAIL: GradebookDetail = {
  classId: "class-1",
  className: "Chiên Con 1",
  academicYearCode: "2026-2027",
  yearStart: "2026-09-01",
  yearEnd: "2027-05-31",
  canGrade: true,
  canComment: false,
  canLock: false,
  canUnlock: false,
  canManageTop5: false,
  top5Enabled: false,
  isLocked: false,
  lockedAt: null,
  // Quản trị viên hệ thống đã đổi hệ số mặc định của năm học — đây là những con
  // số biểu mẫu phải gợi ý, KHÔNG phải 1/2/3 gán cứng trong mã.
  defaultWeights: { quiz_15m: 1.5, midterm: 2.5, final: 4 },
  assessments: [
    {
      id: "asm-1",
      kind: "midterm",
      title: "Giữa kỳ",
      assessmentDate: "2026-11-15",
      weight: 2,
      maxScore: 10,
      attendanceComponent: null,
      isPublished: false,
      // M07-B · TB-M07-01 — cột này ĐÃ có một điểm thật ⇒ chỉ được **ẩn**.
      scoredCount: 1,
    },
  ],
  hiddenAssessments: [],
  students: [
    {
      enrollmentId: "enr-1",
      studentId: "stu-1",
      saintName: "Maria",
      fullName: "Nguyễn An",
      weightedAverage: 8,
      scores: { "asm-1": { score: 8, suggestedScore: null, isManualOverride: false, note: null } },
      comments: [],
    },
    {
      enrollmentId: "enr-2",
      studentId: "stu-2",
      saintName: "Gioan",
      fullName: "Trần Bình",
      weightedAverage: null,
      scores: {},
      comments: [],
    },
  ],
  leaderboards: [],
};

function firstScoreForm() {
  return screen.getAllByRole("button", { name: /^Lưu điểm/ })[0];
}

describe("gradebook editor", () => {
  beforeEach(() => {
    saveAssessmentScores.mockClear();
    deleteAssessment.mockClear();
    archiveAssessment.mockClear();
    refreshAttendanceScores.mockClear();
    createStudentComment.mockClear();
    restoreAssessment.mockClear();
    setAssessmentPublished.mockClear();
    republishLeaderboard.mockClear();
    deleteLeaderboard.mockClear();
    publishLeaderboard.mockClear();
  });

  it("AC-09-01 — hệ số gợi ý lấy từ cấu hình năm học, không phải số cố định trong mã", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={DETAIL} />);

    expect(document.querySelector<HTMLInputElement>("#new-assessment-weight-quiz_15m")?.value).toBe("1.5");

    await user.selectOptions(screen.getByLabelText("Loại"), "midterm");
    expect(document.querySelector<HTMLInputElement>("#new-assessment-weight-midterm")?.value).toBe("2.5");
  });

  it("loại chưa có cấu hình thì rơi về lưới an toàn thay vì để ô trống", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={DETAIL} />);
    // `custom` không có trong `defaultWeights` của năm học này.
    await user.selectOptions(screen.getByLabelText("Loại"), "custom");
    expect(document.querySelector<HTMLInputElement>("#new-assessment-weight-custom")?.value).toBe("1");
  });

  it("bấm Lưu khi không sửa gì thì KHÔNG gọi máy chủ và nói thẳng ra điều đó", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={DETAIL} />);

    await user.click(firstScoreForm());

    expect(saveAssessmentScores).not.toHaveBeenCalled();
    expect(screen.getAllByText("Chưa có ô nào thay đổi nên không có gì để lưu.")[0]).toBeInTheDocument();
  });

  it("chỉ gửi ô vừa sửa — ô của em còn lại KHÔNG đi kèm", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={DETAIL} />);

    const input = screen.getAllByLabelText("Điểm Gioan Trần Bình")[0];
    await user.type(input, "9");
    await user.click(firstScoreForm());

    expect(saveAssessmentScores).toHaveBeenCalledTimes(1);
    expect(saveAssessmentScores).toHaveBeenCalledWith({
      assessmentId: "asm-1",
      scores: [{ enrollmentId: "enr-2", score: 9, note: null }],
    });
  });

  it("gõ lại đúng giá trị đang có thì không gửi gì — 8 và 8 là một", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={DETAIL} />);

    const input = screen.getAllByLabelText("Điểm Maria Nguyễn An")[0];
    await user.clear(input);
    await user.type(input, "8");
    await user.click(firstScoreForm());

    expect(saveAssessmentScores).not.toHaveBeenCalled();
  });

  it("xóa trắng một điểm đã có là thay đổi thật và được gửi lên", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={DETAIL} />);

    const input = screen.getAllByLabelText("Điểm Maria Nguyễn An")[0];
    await user.clear(input);
    await user.click(firstScoreForm());

    expect(saveAssessmentScores).toHaveBeenCalledWith({
      assessmentId: "asm-1",
      scores: [{ enrollmentId: "enr-1", score: null, note: null }],
    });
  });

  it("thông điệp đếm theo ĐƠN VỊ Ô, không còn nói 'dòng điểm' cho cả roster", async () => {
    const user = userEvent.setup();
    saveAssessmentScores.mockResolvedValueOnce({ ok: true as const, data: { count: 1 } });
    render(<GradebookEditor detail={DETAIL} />);

    await user.type(screen.getAllByLabelText("Điểm Gioan Trần Bình")[0], "7");
    await user.click(firstScoreForm());

    expect(await screen.findByText("Đã lưu 1 ô điểm.")).toBeInTheDocument();
  });

  /* ══════════════════════════════ M07-B ══════════════════════════════ */

  it("TB-M07-01 — cột ĐÃ có điểm chỉ được ẩn, và câu hỏi nói ra điểm vẫn còn", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={DETAIL} />);

    // Nhãn nút là thứ người dùng đọc trước khi bấm — nó phải khác hẳn "Xóa cột".
    await user.click(screen.getByRole("button", { name: "Ẩn cột" }));

    // M07-C · nợ #1 — hộp thoại thật, không phải `window.confirm`. Bấm nút mở
    // hộp thoại KHÔNG được gửi request nào: đó là toàn bộ điểm khác biệt so với
    // bản cũ, nơi lời hỏi chặn luồng đồng bộ.
    const dialog = await screen.findByRole("dialog");
    expect(archiveAssessment).not.toHaveBeenCalled();
    expect(within(dialog).getByText(/điểm được giữ nguyên/)).toBeInTheDocument();
    expect(within(dialog).getByText("Giữa kỳ")).toBeInTheDocument();
    expect(within(dialog).getByText("Chiên Con 1")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Ẩn cột" }));
    expect(archiveAssessment).toHaveBeenCalledWith("asm-1");
    expect(deleteAssessment).not.toHaveBeenCalled();
  });

  it("TB-M07-01 / AC-01-01 — cột CHƯA có điểm thì nút là 'Xóa cột' và xóa hẳn", async () => {
    const user = userEvent.setup();
    const detail: GradebookDetail = {
      ...DETAIL,
      assessments: [{ ...DETAIL.assessments[0], scoredCount: 0 }],
    };
    render(<GradebookEditor detail={detail} />);

    expect(screen.getByText("Chưa có điểm")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xóa cột" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/không lấy lại được/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Xóa cột" }));

    expect(deleteAssessment).toHaveBeenCalledWith("asm-1");
    expect(archiveAssessment).not.toHaveBeenCalled();
  });

  /**
   * 🔴 D-61, và là cái bẫy M05-B/M06-C đã trả giá hai lần: xóa/ẩn cột thành công
   * làm **chính thẻ vừa bấm biến mất**. Câu xác nhận phải nằm ở nơi sống sót.
   * Bản trước còn `setMessage(null)` khi thành công — tức cố ý không nói gì sau
   * một thao tác không hoàn tác được.
   */
  it("D-61 — ẩn cột xong có câu xác nhận, và nó KHÔNG nằm trong thẻ vừa biến mất", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={DETAIL} />);

    await user.click(screen.getByRole("button", { name: "Ẩn cột" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Ẩn cột" }));

    const banner = await screen.findByText(/Đã ẩn cột “Giữa kỳ”/);
    expect(banner).toBeInTheDocument();
    // Thẻ cột nằm trong khối "Cấu hình cột điểm"; câu này phải ở ngoài nó.
    expect(banner.closest("form")).toBeNull();
    // M07-C · nợ #21 — và câu ấy nay chỉ ra đường quay lại, thay vì câu cũ
    // *"muốn khôi phục phải nhờ Quản trị viên hệ thống"*.
    expect(banner.textContent).toContain("Cột đã ẩn");
  });

  it("huỷ hộp xác nhận thì KHÔNG request nào được gửi", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={DETAIL} />);

    await user.click(screen.getByRole("button", { name: "Ẩn cột" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Huỷ" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(archiveAssessment).not.toHaveBeenCalled();
    expect(deleteAssessment).not.toHaveBeenCalled();
  });

  it("TB-M07-04 / AC-04-01 — nói ra CẢ HAI số, không chỉ số gộp", async () => {
    const user = userEvent.setup();
    refreshAttendanceScores.mockResolvedValueOnce({ ok: true as const, data: { refreshed: 12, skippedManual: 3 } });
    const detail: GradebookDetail = {
      ...DETAIL,
      assessments: [{
        ...DETAIL.assessments[0],
        id: "asm-att",
        kind: "attendance",
        title: "Chuyên cần Lễ",
        attendanceComponent: "mass",
      }],
      students: DETAIL.students.map((student) => ({ ...student, scores: {} })),
    };
    render(<GradebookEditor detail={detail} />);

    await user.click(screen.getAllByRole("button", { name: "Lấy đề xuất mới" })[0]);

    const text = (await screen.findAllByText(/Đã cập nhật 12 đề xuất/))[0].textContent ?? "";
    expect(text).toContain("3 ô đang chỉnh tay được giữ nguyên");
    // Và nói luôn đường đi tiếp, thay vì để người dùng đoán.
    expect(text).toContain("dùng lại đề xuất");
  });

  it("không có ô nào bị bỏ qua thì câu thông báo gọn lại, không thừa một mệnh đề", async () => {
    const user = userEvent.setup();
    refreshAttendanceScores.mockResolvedValueOnce({ ok: true as const, data: { refreshed: 12, skippedManual: 0 } });
    const detail: GradebookDetail = {
      ...DETAIL,
      assessments: [{ ...DETAIL.assessments[0], id: "asm-att", kind: "attendance", attendanceComponent: "mass" }],
      students: DETAIL.students.map((student) => ({ ...student, scores: {} })),
    };
    render(<GradebookEditor detail={detail} />);

    await user.click(screen.getAllByRole("button", { name: "Lấy đề xuất mới" })[0]);

    expect((await screen.findAllByText("Đã cập nhật 12 đề xuất từ các buổi đã chốt."))[0]).toBeInTheDocument();
  });
});

/**
 * M07-B · **TB-M07-05 / AC-05-01 / D-152** — nhận xét.
 *
 * Tách `describe` riêng vì cần `canComment: true` và một cặp nhận xét **hai tác
 * giả**: không có cặp ấy thì D-152 không đo được.
 */
const COMMENT_DETAIL: GradebookDetail = {
  ...DETAIL,
  canComment: true,
  students: [
    {
      ...DETAIL.students[0],
      comments: [
        {
          id: "cmt-mine",
          visibility: "staff_only",
          content: "Nhận xét của tôi",
          commentDate: "2026-11-20",
          authorName: "Tôi",
          canModerate: true,
        },
        {
          id: "cmt-other",
          visibility: "staff_only",
          content: "Nhận xét của người khác",
          commentDate: "2026-11-21",
          authorName: "GLV khác",
          canModerate: false,
        },
      ],
    },
  ],
};

describe("gradebook editor · nhận xét", () => {
  beforeEach(() => {
    createStudentComment.mockClear();
  });

  it("AC-05-01 — biểu mẫu mặc định là NỘI BỘ, không phải công khai", () => {
    render(<GradebookEditor detail={COMMENT_DETAIL} />);
    const select = screen.getByLabelText("Mức hiển thị") as HTMLSelectElement;
    expect(select.value).toBe("staff_only");
    expect(screen.getByText(/phụ huynh và thiếu nhi không đọc được/i)).toBeInTheDocument();
  });

  it("AC-05-01 — chọn 'Công khai' mới hiện cảnh báo, và cảnh báo nói ra hậu quả", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={COMMENT_DETAIL} />);

    expect(screen.queryByText("Nội dung này sẽ hiện trên cổng phụ huynh/thiếu nhi.")).toBeNull();
    await user.selectOptions(screen.getByLabelText("Mức hiển thị"), "student_visible");
    expect(screen.getByText("Nội dung này sẽ hiện trên cổng phụ huynh/thiếu nhi.")).toBeInTheDocument();
  });

  it("mức hiển thị đang chọn là thứ được gửi lên, không phải mặc định của biểu mẫu", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={COMMENT_DETAIL} />);

    await user.selectOptions(screen.getByLabelText("Mức hiển thị"), "student_visible");
    await user.type(screen.getByLabelText("Nội dung"), "Con tiến bộ");
    await user.click(screen.getByRole("button", { name: "Thêm nhận xét" }));

    expect(createStudentComment).toHaveBeenCalledWith({
      enrollmentId: "enr-1",
      visibility: "student_visible",
      content: "Con tiến bộ",
    });
  });

  it("D-152 — nhận xét của người khác KHÔNG có nút Sửa/Xóa; của mình thì có", () => {
    render(<GradebookEditor detail={COMMENT_DETAIL} />);

    // Đúng một cặp nút, thuộc về nhận xét `canModerate: true`.
    expect(screen.getAllByRole("button", { name: "Sửa" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Xóa" })).toHaveLength(1);
    // Cả hai nhận xét đều đang hiện — siết là siết quyền GHI, không giấu nội dung.
    expect(screen.getByText("Nhận xét của tôi")).toBeInTheDocument();
    expect(screen.getByText("Nhận xét của người khác")).toBeInTheDocument();
  });

  it("bảng điểm đã khóa thì không còn nút sửa/xóa nhận xét nào", () => {
    render(<GradebookEditor detail={{ ...COMMENT_DETAIL, isLocked: true }} />);
    expect(screen.queryByRole("button", { name: "Sửa" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Xóa" })).toBeNull();
  });

  /* ─────────────────────────────── M07-C ─────────────────────────────── */

  it("nợ #1 — xóa nhận xét hỏi lại bằng hộp thoại, và nêu TÊN EM cùng tên người viết", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={COMMENT_DETAIL} />);

    await user.click(screen.getByRole("button", { name: "Xóa" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Maria Nguyễn An")).toBeInTheDocument();
    expect(within(dialog).getByText("Tôi")).toBeInTheDocument();
    expect(within(dialog).getByText(/không lưu lịch sử nhận xét/)).toBeInTheDocument();
  });
});

/* ══════════════════════════════ M07-C ══════════════════════════════ */

/**
 * **D-154 / TB-M07-02** — "khóa" chặn cấu trúc và điểm, **không** chặn công bố.
 *
 * Bài kiểm nằm ở tầng giao diện vì đây là chỗ người dùng gặp luật ấy: hàng rào
 * thật ở cơ sở dữ liệu (pgTAP `045`, đo **cả hai chiều**), còn ở đây phải đúng
 * **một** nút còn sống sau khi khóa. Bật nhầm cả hàng nút là mời người dùng bấm
 * vào những thứ chắc chắn bị từ chối.
 */
describe("gradebook editor · M07-C · công bố tách khỏi khóa", () => {
  beforeEach(() => {
    setAssessmentPublished.mockClear();
  });

  const LOCKED: GradebookDetail = { ...DETAIL, isLocked: true, canLock: true };

  it("D-154 — bảng điểm đã khóa: nút 'Công bố' vẫn bấm được, các nút còn lại thì không", () => {
    render(<GradebookEditor detail={LOCKED} />);

    expect(screen.getByRole("button", { name: "Công bố" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ẩn cột" })).toBeDisabled();
  });

  it("D-154 — bấm 'Công bố' khi đã khóa vẫn gửi lệnh đi", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={LOCKED} />);

    await user.click(screen.getByRole("button", { name: "Công bố" }));

    expect(setAssessmentPublished).toHaveBeenCalledWith({ assessmentId: "asm-1", published: true });
    expect(await screen.findByText(/Đã công bố kết quả cho phụ huynh/)).toBeInTheDocument();
  });

  it("người khác vừa đổi trạng thái thì KHÔNG báo thành công giả", async () => {
    const user = userEvent.setup();
    setAssessmentPublished.mockResolvedValueOnce({ ok: true as const, data: { changed: false } });
    render(<GradebookEditor detail={LOCKED} />);

    await user.click(screen.getByRole("button", { name: "Công bố" }));

    expect(await screen.findByText(/Người khác vừa đổi trạng thái công bố/)).toBeInTheDocument();
  });

  /**
   * 🔴 Câu này là **thứ duy nhất** người dùng nhìn thấy của cả hạng mục
   * TB-M07-02. Không nói ra thì họ vẫn tưởng khóa là đóng sạch, rồi cuối năm đi
   * nhờ Quản trị viên hệ thống mở khóa cả bảng điểm chỉ để công bố một cột.
   */
  it("D-154 — hộp thoại khóa bảng điểm NÓI RA rằng công bố vẫn làm được sau khi khóa", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={{ ...DETAIL, canLock: true }} />);

    await user.click(screen.getByRole("button", { name: "Khóa bảng điểm" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/công bố kết quả cho phụ huynh/i)).toBeInTheDocument();
    expect(dialog.textContent).toContain("vẫn bật/tắt được sau khi khóa");
    expect(within(dialog).getByText("Chiên Con 1")).toBeInTheDocument();
  });
});

/** **Nợ #21** — đường quay lại cho một cột đã ẩn. Món nợ do chính M07-B mở ra. */
describe("gradebook editor · M07-C · hiện lại cột đã ẩn", () => {
  beforeEach(() => {
    restoreAssessment.mockClear();
  });

  const HIDDEN: GradebookDetail = {
    ...DETAIL,
    hiddenAssessments: [
      { ...DETAIL.assessments[0], id: "asm-hidden", title: "Kiểm tra tháng 9", isPublished: false, scoredCount: 12 },
    ],
  };

  it("không có cột ẩn nào thì mục 'Cột đã ẩn' KHÔNG chiếm chỗ", () => {
    render(<GradebookEditor detail={DETAIL} />);
    expect(screen.queryByRole("heading", { name: "Cột đã ẩn" })).toBeNull();
  });

  it("nợ #21 — mục 'Cột đã ẩn' gập sẵn, mở ra rồi hiện lại được", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={HIDDEN} />);

    expect(screen.getByRole("heading", { name: "Cột đã ẩn" })).toBeInTheDocument();
    // Gập sẵn: tên cột chưa chiếm chỗ trong một trang vốn đã rất dài.
    expect(screen.queryByText("Kiểm tra tháng 9")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Xem 1 cột đã ẩn" }));
    expect(screen.getByText("Kiểm tra tháng 9")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hiện lại" }));
    const dialog = await screen.findByRole("dialog");
    expect(restoreAssessment).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Hiện lại cột" }));

    expect(restoreAssessment).toHaveBeenCalledWith("asm-hidden");
    expect(await screen.findByText(/Đã hiện lại cột “Kiểm tra tháng 9”/)).toBeInTheDocument();
  });

  it("nợ #21 — cột ẩn đang ở trạng thái ĐÃ CÔNG BỐ thì câu xác nhận nói ra hậu quả với phụ huynh", async () => {
    const user = userEvent.setup();
    const detail: GradebookDetail = {
      ...HIDDEN,
      hiddenAssessments: [{ ...HIDDEN.hiddenAssessments[0], isPublished: true }],
    };
    render(<GradebookEditor detail={detail} />);

    await user.click(screen.getByRole("button", { name: "Xem 1 cột đã ẩn" }));
    await user.click(screen.getByRole("button", { name: "Hiện lại" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/thấy lại điểm ngay lập tức/)).toBeInTheDocument();
  });
});

/**
 * **D-155 / TB-M07-06** — vòng đời Top 5 có **ba** trạng thái, không phải hai.
 *
 * Chủ dự án chọn phương án B: cho tính lại, nhưng bản đang có xuống lịch sử.
 * Nên trạng thái *"đã chốt nhưng đang ẩn"* phải có **hai** nút khác hẳn nhau,
 * và nhãn của chúng là toàn bộ khác biệt mà người dùng có để quyết định.
 */
describe("gradebook editor · M07-C · vòng đời Top 5", () => {
  beforeEach(() => {
    republishLeaderboard.mockClear();
    deleteLeaderboard.mockClear();
    publishLeaderboard.mockClear();
  });

  const BASE_LEADERBOARD = {
    id: "lb-1",
    title: "Top 5 tháng 10",
    sourceType: "assessment" as const,
    sourceAssessmentId: "asm-1",
    entries: [
      { enrollmentId: "enr-1", rank: 1, score: 9, saintName: "Maria", fullName: "Nguyễn An" },
    ],
  };

  function withLeaderboard(leaderboard: GradebookDetail["leaderboards"][number]): GradebookDetail {
    return { ...DETAIL, top5Enabled: true, canManageTop5: true, leaderboards: [leaderboard] };
  }

  it("D-155 — bản nháp CHƯA TỪNG chốt: nhãn 'Bản nháp', có nút xóa, nút chốt ghi 'Công bố snapshot'", () => {
    render(<GradebookEditor detail={withLeaderboard({
      ...BASE_LEADERBOARD, isPublished: false, publishedAt: null, hasSnapshot: false, supersededCount: 0, entries: [],
    })} />);

    expect(screen.getByText("Bản nháp")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Công bố snapshot" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xóa bản nháp" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hiện lại bản đang có" })).toBeNull();
  });

  it("D-155 — đã chốt nhưng đang ẩn: HAI đường tách bạch, và KHÔNG còn nút xóa", () => {
    render(<GradebookEditor detail={withLeaderboard({
      ...BASE_LEADERBOARD, isPublished: false, publishedAt: "2026-10-01T00:00:00Z", hasSnapshot: true, supersededCount: 0,
    })} />);

    expect(screen.getByText("Đã chốt · đang ẩn")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hiện lại bản đang có" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chốt lại danh sách" })).toBeInTheDocument();
    // BR-M07-35 — danh sách đã chốt không xóa được nữa, nên nút ấy phải biến mất.
    expect(screen.queryByRole("button", { name: "Xóa bản nháp" })).toBeNull();
  });

  it("D-155 — 'Hiện lại bản đang có' KHÔNG hỏi lại, vì nó không thay gì cả", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={withLeaderboard({
      ...BASE_LEADERBOARD, isPublished: false, publishedAt: "2026-10-01T00:00:00Z", hasSnapshot: true, supersededCount: 0,
    })} />);

    await user.click(screen.getByRole("button", { name: "Hiện lại bản đang có" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(republishLeaderboard).toHaveBeenCalledWith("lb-1");
    expect(await screen.findByText(/không tính lại/)).toBeInTheDocument();
  });

  it("🔴 D-155 — 'Chốt lại danh sách' hỏi lại, và câu hỏi nói ra rằng bản đang giữ xuống lịch sử", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={withLeaderboard({
      ...BASE_LEADERBOARD, isPublished: false, publishedAt: "2026-10-01T00:00:00Z", hasSnapshot: true, supersededCount: 2,
    })} />);

    await user.click(screen.getByRole("button", { name: "Chốt lại danh sách" }));

    const dialog = await screen.findByRole("dialog");
    expect(publishLeaderboard).not.toHaveBeenCalled();
    expect(dialog.textContent).toContain("Danh sách 5 em có thể khác bản đang giữ");
    // Số thứ tự bản lịch sử nói cho người dùng biết đây là lần thay thứ mấy.
    expect(within(dialog).getByText("3")).toBeInTheDocument();
    expect(dialog.textContent).toContain("Hiện lại bản đang có");

    await user.click(within(dialog).getByRole("button", { name: "Chốt lại" }));
    expect(publishLeaderboard).toHaveBeenCalledWith({ leaderboardId: "lb-1", customScores: null });
  });

  it("D-155 — số bản trong lịch sử hiện ra trên thẻ, không phải thứ chỉ có trong cơ sở dữ liệu", () => {
    render(<GradebookEditor detail={withLeaderboard({
      ...BASE_LEADERBOARD, isPublished: true, publishedAt: "2026-10-01T00:00:00Z", hasSnapshot: true, supersededCount: 2,
    })} />);

    expect(screen.getByText("2 bản trước trong lịch sử")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ẩn khỏi cổng" })).toBeInTheDocument();
  });

  it("D-155 — xóa bản nháp phải qua hộp xác nhận nêu tên bảng và tên lớp", async () => {
    const user = userEvent.setup();
    render(<GradebookEditor detail={withLeaderboard({
      ...BASE_LEADERBOARD, isPublished: false, publishedAt: null, hasSnapshot: false, supersededCount: 0, entries: [],
    })} />);

    await user.click(screen.getByRole("button", { name: "Xóa bản nháp" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Top 5 tháng 10")).toBeInTheDocument();
    expect(within(dialog).getByText("Chiên Con 1")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Xóa bản nháp" }));

    expect(deleteLeaderboard).toHaveBeenCalledWith("lb-1");
  });
});
