import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  TeachingPlanDetail,
  TeachingPlanItem,
} from "@/features/teaching-plans/server/queries";

/**
 * M06-A — bốn thứ của màn hình giáo án mà **chỉ chạy mới thấy**, và cả bốn đều
 * là loại lỗi "hệ thống nói sai sự thật" chứ không phải "hệ thống không chạy":
 *
 *   · **#1 / UI-02** — câu *"Đã lưu tài liệu vào kho riêng tư."* hiện **màu đỏ**
 *     với `role="alert"`, vì chỗ gọi `FormMessage` quên `tone`. Thành công và
 *     thất bại trông y hệt nhau. Bài test đọc `role`, không đọc tên lớp CSS:
 *     `FormMessage` suy `role` **từ** `tone` nên `role` là bằng chứng đúng.
 *   · **TB-M06-03 / TB-05** — ô người dạy phải lọc theo ngày, và **phải giữ lại
 *     người đang được chọn** thay vì để `<select>` âm thầm nhảy sang người khác.
 *   · **#10 / BR-M06-16** — tệp quá trần bị chặn ở trình duyệt, **không gọi
 *     Server Action một lần nào**. Đếm số lần gọi vì đó chính là điều cần
 *     chứng minh: tệp ấy không bao giờ tới được máy chủ (`bodySizeLimit`).
 *   · **TB-03** — câu lỗi của Server Action phải ra tới màn hình nguyên văn.
 */

const uploadMaterial = vi.fn(async () => ({ ok: true as const, data: undefined }));
const createItem = vi.fn(async () => ({ ok: true as const, data: { id: "new-item" } }));
const updateItem = vi.fn(async () => ({ ok: true as const, data: undefined }));
const deleteItem = vi.fn(async () => ({ ok: true as const, data: undefined }));
const removeMaterial = vi.fn(async () => ({ ok: true as const, data: undefined }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/features/teaching-plans/server/actions", () => ({
  createTeachingMaterialUrl: vi.fn(),
  createTeachingPlanItem: (...args: unknown[]) => createItem(...(args as [])),
  deleteTeachingPlanItem: (...args: unknown[]) => deleteItem(...(args as [])),
  ensureTeachingPlan: vi.fn(),
  removeTeachingMaterial: (...args: unknown[]) => removeMaterial(...(args as [])),
  updateTeachingPlanItem: (...args: unknown[]) => updateItem(...(args as [])),
  updateTeachingPlanTitle: vi.fn(),
  uploadTeachingMaterial: (...args: unknown[]) => uploadMaterial(...(args as [])),
}));

const { TeachingPlanEditor } = await import(
  "@/features/teaching-plans/components/teaching-plan-editor"
);

const LAN = {
  id: "staff-lan",
  label: "Maria Lan",
  capacity: "representative",
  startsOn: "2026-09-01",
  endsOn: "2026-10-31",
};
const NAM = {
  id: "staff-nam",
  label: "Giuse Nam",
  capacity: "member",
  startsOn: "2026-09-01",
  endsOn: null,
};

function makeItem(overrides: Partial<TeachingPlanItem> = {}): TeachingPlanItem {
  return {
    id: "item-1",
    plannedDate: "2026-09-06",
    title: "Bài mở đầu",
    objectives: null,
    catechismContent: null,
    scriptureContent: null,
    game: null,
    song: null,
    homework: null,
    preparation: null,
    teacherStaffId: LAN.id,
    teacherName: LAN.label,
    itemType: "lesson",
    note: null,
    materialName: null,
    materialMimeType: null,
    materialSize: null,
    // Micro giây có thật: D-146 gửi lại NGUYÊN VĂN chuỗi này, và một vòng qua
    // `Date` của JavaScript sẽ cắt mất ba chữ số cuối.
    updatedAt: "2026-09-01T08:30:00.123456+00:00",
    ...overrides,
  };
}

function makeDetail(overrides: Partial<TeachingPlanDetail> = {}): TeachingPlanDetail {
  return {
    classId: "class-1",
    className: "Ấu 1A",
    academicYearCode: "2026-2027",
    yearStart: "2026-09-01",
    yearEnd: "2027-05-31",
    planId: "plan-1",
    planTitle: "Kế hoạch giảng dạy Ấu 1A",
    canManage: true,
    staff: [LAN, NAM],
    items: [makeItem()],
    ...overrides,
  };
}

function renderEditor(detail = makeDetail()) {
  return render(<TeachingPlanEditor detail={detail} view="list" />);
}

/**
 * Biểu mẫu "Thêm mục giáo án".
 *
 * Từ M06-C nó nằm trong hộp thoại (`#8`), nên phải MỞ trước khi có gì để điền —
 * đúng thao tác của người dùng thật.
 */
async function openAddForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Thêm mục giáo án" }));
  return screen.getByRole("dialog").querySelector("form")!;
}

function itemCard() {
  return document.querySelector("[data-teaching-plan-item]") as HTMLElement;
}

/**
 * Mở một nhóm trường gập lại (`<details>`).
 *
 * ⚠️ Gọi thẳng `open = true` chứ không bấm `<summary>`: jsdom **không** cài
 * hành vi kích hoạt của `<details>`, nên một cú bấm ở đây không mở gì cả và bài
 * test sẽ gõ vào một ô đang ẩn. Đường bấm thật do E2E chạy trên trình duyệt
 * thật phủ (`teaching-plan.spec.ts`).
 */
function groupSummary(scope: HTMLElement, title: string) {
  // ⚠️ Tìm thẳng trong các `<summary>`, không dùng `getByText`: chuỗi "Ghi chú
  // nội bộ" cũng là NHÃN của chính ô nhập bên trong nhóm, và còn là một dòng
  // của thẻ mục ở chế độ đọc — ba chỗ cùng một chữ.
  const found = Array.from(scope.querySelectorAll("summary")).find((summary) =>
    summary.textContent?.startsWith(title),
  );
  if (!found) throw new Error(`Không tìm thấy nhóm trường "${title}"`);
  return found;
}

function openGroup(scope: HTMLElement, title: string) {
  const details = groupSummary(scope, title).parentElement as HTMLDetailsElement;
  details.open = true;
  return details;
}

/** Dòng đếm ở tiêu đề nhóm: "Nội dung buổi học · đã điền 4/7". */
function groupSummaryText(scope: HTMLElement, title: string) {
  return groupSummary(scope, title).textContent ?? "";
}

/**
 * ⚠️ Gửi biểu mẫu tài liệu bằng `fireEvent.submit`, **không** bằng cú bấm nút —
 * đúng giới hạn môi trường mà M12-A đã đo được và ghi lại
 * (`import-upload-form.test.tsx`): trong jsdom, một `<form>` **chứa
 * `<input type="file">` đã có tệp** thì cú bấm nút đi theo đường gửi biểu mẫu
 * gốc của jsdom thay vì được React chặn lại, nên `onSubmit` không chạy. Dựng
 * lại bằng biểu mẫu trần cũng vậy. Đường bấm nút thật do E2E
 * `teaching-plan.spec.ts` phủ trên trình duyệt thật.
 */
function submitMaterialForm(card: HTMLElement) {
  fireEvent.submit(card.querySelector('input[type="file"]')!.closest("form")!);
}

beforeEach(() => {
  uploadMaterial.mockClear();
  createItem.mockClear();
  updateItem.mockClear();
  deleteItem.mockClear();
  removeMaterial.mockClear();
});

describe("thông báo thành công không được đỏ (M06-A · #1 · UI-02)", () => {
  it("lưu tài liệu xong thì thông báo là role=status, không phải alert", async () => {
    const user = userEvent.setup();
    renderEditor();
    const card = itemCard();

    const file = new File(["noi dung"], "giao-an.pdf", { type: "application/pdf" });
    await user.upload(card.querySelector('input[type="file"]') as HTMLInputElement, file);
    submitMaterialForm(card);

    const message = await within(card).findByText("Đã lưu tài liệu vào kho riêng tư.");
    const line = message.closest("p")!;
    expect(line).toHaveAttribute("role", "status");
    expect(line.getAttribute("role")).not.toBe("alert");
    expect(uploadMaterial).toHaveBeenCalledTimes(1);

    // 🔴 Lỗi do chính M06-A sinh ra, E2E bắt được: `FileUpload` giữ tên tệp
    // trong state của riêng nó nên `form.reset()` không dọn, và lưu xong dòng
    // "Đã chọn: …" vẫn nằm cạnh câu "Đã lưu tài liệu…" như thể còn một tệp
    // đang chờ lưu lần nữa.
    expect(within(card).queryByText(/Đã chọn: giao-an\.pdf/)).toBeNull();
  });

  it("thêm mục xong cũng vậy", async () => {
    const user = userEvent.setup();
    renderEditor();
    const form = await openAddForm(user);

    await user.type(form.querySelector('input[name="title"]') as HTMLInputElement, "Bài 2");
    await user.selectOptions(form.querySelector('select[name="teacherStaffId"]') as HTMLSelectElement, NAM.id);
    await user.click(within(form).getByRole("button", { name: "Thêm vào giáo án" }));

    const message = await within(form).findByText("Đã thêm mục giáo án.");
    expect(message.closest("p")).toHaveAttribute("role", "status");
  });
});

describe("ô người dạy lọc theo ngày (M06-A · TB-M06-03 · TB-05)", () => {
  it("nhân sự hết nhiệm kỳ biến khỏi danh sách khi đổi sang ngày sau đó", async () => {
    const user = userEvent.setup();
    renderEditor();
    const form = await openAddForm(user);
    const select = form.querySelector('select[name="teacherStaffId"]') as HTMLSelectElement;

    expect(within(select).getByRole("option", { name: LAN.label })).toBeTruthy();

    const date = form.querySelector('[data-date-text]') as HTMLInputElement;
    await user.clear(date);
    await user.type(date, "2026-11-05");

    expect(within(select).queryByRole("option", { name: LAN.label })).toBeNull();
    expect(within(select).getByRole("option", { name: NAM.label })).toBeTruthy();
  });

  /**
   * 🔴 Ca nguy hiểm hơn chính lỗi đang sửa: nếu chỉ lọc rồi thôi thì `<select>`
   * mất giá trị đang giữ sẽ nhảy về lựa chọn đầu tiên — sửa một mục cũ và chỉ
   * đổi mỗi NGÀY cũng đủ để người dạy bị thay bằng người chưa ai bấm vào.
   */
  it("người ĐANG được chọn không bị âm thầm thay khi đổi ngày", async () => {
    const user = userEvent.setup();
    renderEditor();
    const card = itemCard();
    await user.click(within(card).getByRole("button", { name: "Sửa" }));

    const select = card.querySelector('select[name="teacherStaffId"]') as HTMLSelectElement;
    expect(select.value).toBe(LAN.id);

    const date = card.querySelector('[data-date-text]') as HTMLInputElement;
    await user.clear(date);
    await user.type(date, "2026-11-05");

    expect(select.value).toBe(LAN.id);
    expect(within(card).getByText(/không thuộc đội ngũ lớp vào ngày/)).toBeTruthy();
  });

  it("không ai phụ trách lớp vào ngày đó thì nói ra, kèm đường đi tiếp", async () => {
    const user = userEvent.setup();
    renderEditor(makeDetail({ staff: [LAN], items: [] }));
    const form = await openAddForm(user);

    const date = form.querySelector('[data-date-text]') as HTMLInputElement;
    await user.clear(date);
    await user.type(date, "2026-11-05");

    expect(within(form).getByText(/Chưa có nhân sự phụ trách lớp/)).toBeTruthy();
    expect(within(form).getByRole("link", { name: "Nhân sự" })).toBeTruthy();
  });
});

describe("chặn tệp quá trần ngay ở trình duyệt (M06-A · #10 · BR-M06-16)", () => {
  it("tệp 5 MB không được gửi lên máy chủ một lần nào", async () => {
    const user = userEvent.setup();
    renderEditor();
    const card = itemCard();

    const big = new File([new Uint8Array(5 * 1024 * 1024)], "nang.pdf", {
      type: "application/pdf",
    });
    await user.upload(card.querySelector('input[type="file"]') as HTMLInputElement, big);
    submitMaterialForm(card);

    expect(uploadMaterial).not.toHaveBeenCalled();
    expect(within(card).getByText(/vượt quá giới hạn 4 MB/)).toBeTruthy();
  });

  /**
   * `applyAccept: false` là **có chủ ý và đúng thực tế**: thuộc tính `accept`
   * chỉ lọc hộp thoại chọn tệp, nó **không** là hàng rào — kéo-thả, dán, hay
   * DevTools đều vượt qua được. Bật `applyAccept` mặc định thì bài test dựng
   * một thế giới trong đó `accept` không bao giờ bị vượt, tức kiểm một điều
   * không cần kiểm và bỏ sót đúng điều cần kiểm.
   */
  it("định dạng ngoài allowlist cũng bị chặn tại chỗ", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderEditor();
    const card = itemCard();

    const bad = new File(["x"], "virus.exe", { type: "application/x-msdownload" });
    await user.upload(card.querySelector('input[type="file"]') as HTMLInputElement, bad);
    submitMaterialForm(card);

    expect(uploadMaterial).not.toHaveBeenCalled();
    expect(within(card).getByText(/Chỉ nhận PDF/)).toBeTruthy();
  });
});

describe("chống ghi đè khi hai người cùng sửa (M06-B · D-146 · TB-01/TB-02)", () => {
  it("gửi kèm phiên bản NGUYÊN VĂN, không đi qua Date", async () => {
    const user = userEvent.setup();
    const item = makeItem();
    renderEditor(makeDetail({ items: [item] }));
    const card = itemCard();
    await user.click(within(card).getByRole("button", { name: "Sửa" }));
    await user.click(within(card).getByRole("button", { name: "Lưu thay đổi" }));

    expect(updateItem).toHaveBeenCalledTimes(1);
    const payload = (updateItem.mock.calls[0] as unknown as [{ expectedUpdatedAt: string }])[0];
    expect(payload.expectedUpdatedAt).toBe(item.updatedAt);
    // Bài canh riêng cái bẫy: `new Date(x).toISOString()` trả về mili giây, tức
    // "…08:30:00.123Z" — mất ba chữ số cuối thì phép so ở DB không bao giờ khớp
    // và mọi lượt lưu đều báo xung đột.
    expect(payload.expectedUpdatedAt).not.toBe(new Date(item.updatedAt).toISOString());
  });

  /** TB-02 — một người sửa thì số bước KHÔNG đổi: không nút thừa nào hiện ra. */
  it("lưu trót lọt thì không có nút 'Tải lại mục này'", async () => {
    const user = userEvent.setup();
    renderEditor();
    const card = itemCard();
    await user.click(within(card).getByRole("button", { name: "Sửa" }));

    expect(within(card).queryByRole("button", { name: "Tải lại mục này" })).toBeNull();
  });

  it("bản đã cũ thì báo rõ và mời tải lại, KHÔNG ghi đè", async () => {
    updateItem.mockResolvedValueOnce({
      ok: false,
      code: "CONFLICT",
      stale: true,
      message: "Mục này vừa được người khác cập nhật. Hãy chép lại phần bạn đang gõ, …",
    } as never);

    const user = userEvent.setup();
    renderEditor();
    const card = itemCard();
    await user.click(within(card).getByRole("button", { name: "Sửa" }));
    await user.click(within(card).getByRole("button", { name: "Lưu thay đổi" }));

    const message = await within(card).findByText(/vừa được người khác cập nhật/);
    expect(message.closest("p")).toHaveAttribute("role", "alert");
    expect(within(card).getByRole("button", { name: "Tải lại mục này" })).toBeTruthy();
  });

  /**
   * 🔴 Nút ấy chỉ được hiện cho đúng ca phiên bản cũ. Lỗi "ngày này đã có một
   * mục" cũng mang mã `CONFLICT`, mà tải lại trang bao nhiêu lần cũng vẫn trùng
   * ngày — mời người dùng làm một việc chắc chắn vô ích thì thà đừng mời.
   */
  it("lỗi CONFLICT khác không mời tải lại", async () => {
    updateItem.mockResolvedValueOnce({
      ok: false,
      code: "CONFLICT",
      message: "Ngày này đã có một mục giáo án. Mỗi ngày chỉ có một mục.",
    } as never);

    const user = userEvent.setup();
    renderEditor();
    const card = itemCard();
    await user.click(within(card).getByRole("button", { name: "Sửa" }));
    await user.click(within(card).getByRole("button", { name: "Lưu thay đổi" }));

    expect(await within(card).findByText(/Ngày này đã có một mục giáo án/)).toBeTruthy();
    expect(within(card).queryByRole("button", { name: "Tải lại mục này" })).toBeNull();
  });
});

describe("hai hộp xác nhận cuối của module (M06-C · #9 · nợ #1)", () => {
  it("xoá mục: hộp thoại nêu TÊN MỤC, ngày, và tên tệp sẽ bị xoá theo", async () => {
    const user = userEvent.setup();
    renderEditor(makeDetail({ items: [makeItem({ materialName: "giao-an-tuan-1.pdf" })] }));
    const card = itemCard();

    await user.click(within(card).getByRole("button", { name: "Xóa" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Xóa mục giáo án?" })).toBeTruthy();
    // Hậu quả nêu bằng TÊN RIÊNG — nghiệm thu chung `11` §5.
    expect(within(dialog).getByText(/Bài mở đầu/)).toBeTruthy();
    expect(within(dialog).getByText(/Ấu 1A/)).toBeTruthy();
    // 🔴 Điều `window.confirm` không nói: tệp đính kèm bị xoá theo.
    expect(within(dialog).getByText(/giao-an-tuan-1\.pdf/)).toBeTruthy();
    expect(within(dialog).getByText(/không hoàn tác được/)).toBeTruthy();
  });

  it("bấm Huỷ thì KHÔNG có lượt xoá nào đi tới máy chủ", async () => {
    const user = userEvent.setup();
    renderEditor();
    const card = itemCard();

    await user.click(within(card).getByRole("button", { name: "Xóa" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Huỷ" }));

    expect(deleteItem).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("bấm nút xác nhận thì xoá đúng một lần, đúng mục", async () => {
    const user = userEvent.setup();
    renderEditor();
    const card = itemCard();

    await user.click(within(card).getByRole("button", { name: "Xóa" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xóa mục này" }));

    expect(deleteItem).toHaveBeenCalledTimes(1);
    expect(deleteItem.mock.calls[0]).toEqual(["item-1"]);
  });

  it("gỡ tệp: hộp thoại nêu TÊN TỆP và nói rõ tệp bị xoá khỏi kho", async () => {
    const user = userEvent.setup();
    renderEditor(makeDetail({ items: [makeItem({ materialName: "bai-hat.pdf" })] }));
    const card = itemCard();

    await user.click(within(card).getByRole("button", { name: "Gỡ tệp" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/bai-hat\.pdf/)).toBeTruthy();
    expect(within(dialog).getByText(/khỏi kho lưu trữ/)).toBeTruthy();

    await user.click(within(dialog).getByRole("button", { name: "Gỡ tài liệu này" }));
    expect(removeMaterial).toHaveBeenCalledTimes(1);
  });
});

describe("12 trường gom thành ba nhóm (M06-C · #8)", () => {
  /**
   * 🔴 Bài canh đúng cái bẫy khiến nhóm 1 KHÔNG được phép gập: trình duyệt từ
   * chối lượt gửi kèm một ô `required` đang bị ẩn, và người dùng chỉ thấy nút
   * Lưu không phản ứng gì. Ba ô ấy phải nằm ngoài mọi `<details>`.
   */
  it("ba ô bắt buộc không nằm trong nhóm gập nào", async () => {
    const user = userEvent.setup();
    renderEditor();
    const form = await openAddForm(user);

    for (const selector of [
      'input[name="plannedDate"]',
      'input[name="title"]',
      'select[name="teacherStaffId"]',
    ]) {
      const field = form.querySelector(selector)!;
      expect(field, `thiếu ô ${selector}`).toBeTruthy();
      expect(field.closest("details"), `${selector} không được nằm trong nhóm gập`).toBeNull();
    }
  });

  it("tiêu đề nhóm nói ra đang có bao nhiêu ô đã điền", async () => {
    const user = userEvent.setup();
    renderEditor(
      makeDetail({
        items: [
          makeItem({
            objectives: "Mục tiêu",
            catechismContent: "Giáo lý",
            scriptureContent: "Lời Chúa",
            game: "Trò chơi",
            note: "Nhắc riêng",
          }),
        ],
      }),
    );
    const card = itemCard();
    await user.click(within(card).getByRole("button", { name: "Sửa" }));
    const dialog = screen.getByRole("dialog");

    expect(groupSummaryText(dialog, "Nội dung buổi học")).toContain("đã điền 4/7");
    // Nhóm một ô thì phân số là nhiễu.
    expect(groupSummaryText(dialog, "Ghi chú nội bộ")).toContain("đã điền");
    expect(groupSummaryText(dialog, "Ghi chú nội bộ")).not.toContain("/1");
  });

  it("gõ thêm vào một ô thì số ở tiêu đề nhóm đổi theo NGAY, không chờ lưu", async () => {
    const user = userEvent.setup();
    renderEditor();
    const form = await openAddForm(user);
    const dialog = screen.getByRole("dialog");

    expect(groupSummaryText(dialog, "Nội dung buổi học")).toContain("chưa điền");

    openGroup(dialog, "Nội dung buổi học");
    await user.type(form.querySelector('textarea[name="song"]') as HTMLTextAreaElement, "Thiếu nhi Thánh Thể");

    expect(groupSummaryText(dialog, "Nội dung buổi học")).toContain("đã điền 1/7");
  });

  /**
   * `maxLength` cắt input trong im lặng tuyệt đối. Bộ đếm chỉ hiện khi sắp chạm
   * trần — hiện suốt thì 12 ô mang 12 con số nhiễu.
   */
  it("bộ đếm ký tự chỉ hiện khi sắp chạm trần", async () => {
    const user = userEvent.setup();
    renderEditor();
    const form = await openAddForm(user);
    const dialog = screen.getByRole("dialog");
    openGroup(dialog, "Nội dung buổi học");

    const song = form.querySelector('textarea[name="song"]') as HTMLTextAreaElement;
    expect(within(dialog).queryByText(/Còn \d+ ký tự/)).toBeNull();

    // Ô "Bài hát" có trần 1000 ký tự; 850 ⇒ còn 150, dưới ngưỡng 200.
    fireEvent.change(song, { target: { value: "x".repeat(850) } });
    expect(within(dialog).getByText("Còn 150 ký tự.")).toBeTruthy();
  });

  /**
   * `06_UI_UX_RECOMMENDATIONS` §4 — ô ghi chú nội bộ chỉ khác các ô khác ở cái
   * nhãn. Nhưng ô đi ra ngoài lại là **"Chuẩn bị"**, và không nói ra thì người
   * soạn không có cách nào biết mình đang viết cho phụ huynh đọc.
   */
  it("hai ô có ranh giới riêng tư đều nói ra ai đọc được", async () => {
    const user = userEvent.setup();
    renderEditor();
    const form = await openAddForm(user);
    const dialog = screen.getByRole("dialog");
    openGroup(dialog, "Nội dung buổi học");
    openGroup(dialog, "Ghi chú nội bộ");

    const preparation = form.querySelector('textarea[name="preparation"]') as HTMLTextAreaElement;
    const note = form.querySelector('textarea[name="note"]') as HTMLTextAreaElement;

    const preparationHint = document.getElementById(preparation.getAttribute("aria-describedby")!);
    expect(preparationHint?.textContent).toMatch(/Phụ huynh và thiếu nhi đọc được/);

    const noteHint = document.getElementById(note.getAttribute("aria-describedby")!);
    expect(noteHint?.textContent).toMatch(/Không ra cổng phụ huynh/);
  });
});

describe("sửa mục xong phải có một chữ xác nhận (M06-C · D-61)", () => {
  /**
   * 🔴 Lỗ có thật của bản trước M06-C: lượt sửa thành công đặt `message` rồi gọi
   * ngay `onDone()`, mà `onDone` gỡ chính component đang giữ `message` — nên
   * sửa xong **không có gì xác nhận**. Cùng hình dạng với lỗi M05-B: thứ vừa
   * xác nhận bị chính lượt đóng nó xoá mất.
   */
  it("hộp thoại đóng lại nhưng câu 'Đã cập nhật mục giáo án.' vẫn ở thẻ", async () => {
    const user = userEvent.setup();
    renderEditor();
    const card = itemCard();

    await user.click(within(card).getByRole("button", { name: "Sửa" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Lưu thay đổi" }));

    const message = await within(card).findByText("Đã cập nhật mục giáo án.");
    expect(message.closest("p")).toHaveAttribute("role", "status");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  /** Thêm mục thì NGƯỢC LẠI: hộp thoại ở nguyên để soạn mục tiếp theo. */
  it("thêm mục xong thì hộp thoại ở lại, biểu mẫu tự dọn", async () => {
    const user = userEvent.setup();
    renderEditor();
    const form = await openAddForm(user);

    const title = form.querySelector('input[name="title"]') as HTMLInputElement;
    await user.type(title, "Bài 2");
    await user.selectOptions(form.querySelector('select[name="teacherStaffId"]') as HTMLSelectElement, NAM.id);
    await user.click(within(form).getByRole("button", { name: "Thêm vào giáo án" }));

    await within(form).findByText("Đã thêm mục giáo án.");
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect((form.querySelector('input[name="title"]') as HTMLInputElement).value).toBe("");
  });
});

describe("câu lỗi của máy chủ ra tới màn hình (M06-A · TB-03)", () => {
  it("giữ nguyên văn, không thay bằng 'Vui lòng thử lại'", async () => {
    createItem.mockResolvedValueOnce({
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Ngày dự kiến phải nằm trong năm học của lớp. Hãy chọn lại ngày.",
    } as never);

    const user = userEvent.setup();
    renderEditor();
    const form = await openAddForm(user);
    await user.type(form.querySelector('input[name="title"]') as HTMLInputElement, "Bài 2");
    await user.selectOptions(form.querySelector('select[name="teacherStaffId"]') as HTMLSelectElement, NAM.id);
    await user.click(within(form).getByRole("button", { name: "Thêm vào giáo án" }));

    const message = await within(form).findByText(/Ngày dự kiến phải nằm trong năm học/);
    expect(message.closest("p")).toHaveAttribute("role", "alert");
  });
});
