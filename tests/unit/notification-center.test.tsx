import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { NotificationsPageData } from "@/features/notifications/server/queries";

/**
 * M10-B — màn hình soạn thông báo.
 *
 * Ba điều được canh ở đây, và cả ba đều là **hành vi mới của đợt B**:
 *   AC-06-01  bấm "Gửi" mở hộp xem lại, **chưa gửi gì cả**;
 *   TB-M10-03 phạm vi "Một người" cuối cùng có đường vào từ giao diện;
 *   D-165     mã chống gửi đúp đi kèm mọi lượt gửi.
 */
const publish = vi.fn(async (_input: unknown) => ({
  ok: true as const,
  data: { id: "n-1", recipientCount: 27 },
}));
const preview = vi.fn(async (_input: unknown) => ({ ok: true as const, data: { count: 27 } }));
const search = vi.fn(async (_input: unknown) => ({
  ok: true as const,
  data: { people: [{ id: "p-1", label: "Nguyễn Thư Ký · GLV903" }] },
}));
const retract = vi.fn(async (_input: unknown) => ({
  ok: true as const,
  data: { recipientCount: 27 },
}));

vi.mock("@/features/notifications/server/actions", () => ({
  publishNotification: (input: unknown) => publish(input),
  previewNotificationAudience: (input: unknown) => preview(input),
  searchNotificationRecipients: (input: unknown) => search(input),
  retractNotification: (input: unknown) => retract(input),
  markNotificationRead: vi.fn(async () => ({ ok: true, data: undefined })),
  markAllNotificationsRead: vi.fn(async () => ({ ok: true, data: { count: 0 } })),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const { NotificationCenter } = await import(
  "@/features/notifications/components/notification-center"
);

function pageData(
  overrides: Partial<NotificationsPageData["publishOptions"]> = {},
  page: Partial<NotificationsPageData> = {},
): NotificationsPageData {
  return {
    audience: "staff",
    inbox: [],
    unreadCount: 0,
    inboxTotal: 0,
    filter: "all",
    page: 1,
    sent: [],
    publishOptions: {
      canPublishGlobal: true,
      canPublishUser: true,
      sectors: [],
      classes: [{ id: "class-1", label: "Ấu 1A" }],
      committees: [],
      ...overrides,
    },
    ...page,
  };
}

beforeEach(() => {
  publish.mockClear();
  preview.mockClear();
  search.mockClear();
  retract.mockClear();
});

async function fillDraft(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Tiêu đề"), "Chúa nhật mặc đồng phục");
  await user.type(screen.getByLabelText("Nội dung"), "Các em nhớ mặc đồng phục.");
}

describe("AC-06-01 · xem lại trước khi gửi", () => {
  it("bấm Gửi mở hộp xác nhận và CHƯA gọi máy chủ", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter data={pageData()} />);
    await fillDraft(user);
    await user.selectOptions(screen.getByLabelText("Đối tượng nhận"), "class-1");

    await user.click(screen.getByRole("button", { name: /Gửi thông báo/ }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    // 🔴 Điều quan trọng nhất của bài này: hộp thoại mở ra mà thông báo **chưa
    // được gửi**. Nếu khẳng định dưới đây đỏ thì hộp xác nhận chỉ là trang trí.
    expect(publish).not.toHaveBeenCalled();
  });

  it("hộp xác nhận nêu tên lớp, số người nhận và nội dung sắp gửi", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter data={pageData()} />);
    await fillDraft(user);
    await user.selectOptions(screen.getByLabelText("Đối tượng nhận"), "class-1");
    await waitFor(() => expect(preview).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /Gửi thông báo/ }));
    const dialog = await screen.findByRole("dialog");

    expect(dialog).toHaveTextContent("Ấu 1A");
    expect(dialog).toHaveTextContent("27");
    expect(dialog).toHaveTextContent("Chúa nhật mặc đồng phục");
    expect(dialog).toHaveTextContent(/không thu hồi được/i);
  });

  it("Quay lại sửa thì không gửi gì", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter data={pageData()} />);
    await fillDraft(user);
    await user.selectOptions(screen.getByLabelText("Đối tượng nhận"), "class-1");
    await user.click(screen.getByRole("button", { name: /Gửi thông báo/ }));

    await user.click(await screen.findByRole("button", { name: "Quay lại sửa" }));
    expect(publish).not.toHaveBeenCalled();
  });

  it("D-165 — xác nhận rồi thì gửi kèm mã chống gửi đúp", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter data={pageData()} />);
    await fillDraft(user);
    await user.selectOptions(screen.getByLabelText("Đối tượng nhận"), "class-1");
    await waitFor(() => expect(preview).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /Gửi thông báo/ }));
    await user.click(await screen.findByRole("button", { name: /Gửi cho 27 người/ }));

    await waitFor(() => expect(publish).toHaveBeenCalledTimes(1));
    const sent = publish.mock.calls[0][0] as Record<string, unknown>;
    expect(sent.targetType).toBe("class");
    expect(sent.targetId).toBe("class-1");
    expect(sent.requestId).toEqual(expect.any(String));
  });

  it("AC-02-01 — sau khi gửi nói ra số người nhận thật", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter data={pageData()} />);
    await fillDraft(user);
    await user.selectOptions(screen.getByLabelText("Đối tượng nhận"), "class-1");
    await waitFor(() => expect(preview).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /Gửi thông báo/ }));
    await user.click(await screen.findByRole("button", { name: /Gửi cho 27 người/ }));

    expect(await screen.findByText(/Đã gửi thông báo tới 27 người/)).toBeInTheDocument();
  });
});

describe("TB-M10-03 · phạm vi Một người", () => {
  it("hiện trong danh sách phạm vi khi người dùng có quyền", () => {
    render(<NotificationCenter data={pageData()} />);
    expect(screen.getByRole("option", { name: "Một người" })).toBeInTheDocument();
  });

  it("KHÔNG hiện với người không có quyền gửi toàn cục", () => {
    render(<NotificationCenter data={pageData({ canPublishGlobal: false, canPublishUser: false })} />);
    expect(screen.queryByRole("option", { name: "Một người" })).not.toBeInTheDocument();
  });

  it("gõ dưới 2 ký tự thì không gọi máy chủ", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter data={pageData()} />);
    await user.selectOptions(screen.getByLabelText("Phạm vi"), "user");
    await user.type(screen.getByLabelText("Tìm người nhận"), "N");
    expect(search).not.toHaveBeenCalled();
  });

  it("tìm được người và nói rõ chỉ người đó nhìn thấy", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter data={pageData()} />);
    await user.selectOptions(screen.getByLabelText("Phạm vi"), "user");
    await user.type(screen.getByLabelText("Tìm người nhận"), "Thư");

    await waitFor(() => expect(search).toHaveBeenCalled());
    await user.selectOptions(
      await screen.findByLabelText("Người nhận"),
      "p-1",
    );
    expect(screen.getByText(/Chỉ người này nhìn thấy/)).toBeInTheDocument();
  });

  it("đổi phạm vi thì bỏ đối tượng đã chọn của phạm vi cũ (test cũ)", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter data={pageData()} />);
    await user.selectOptions(screen.getByLabelText("Đối tượng nhận"), "class-1");
    await user.selectOptions(screen.getByLabelText("Phạm vi"), "all");
    await user.selectOptions(screen.getByLabelText("Phạm vi"), "class");

    // Giữ lại lựa chọn cũ là gửi nhầm chỗ trong khi biểu mẫu trông vẫn hợp lệ.
    expect(screen.getByLabelText("Đối tượng nhận")).toHaveValue("");
  });
});

describe("D-166 · thu hồi thông báo đã gửi", () => {
  const sentItem = {
    id: "n-9",
    title: "Lịch sai",
    publishedAt: "2026-08-10T01:00:00.000Z",
    targetType: "class" as const,
    recipientCount: 27,
    retractedAt: null,
    retractReason: null,
  };

  it("AC-07-01 — có mục 'Tôi đã gửi' kèm số người nhận thật", () => {
    render(<NotificationCenter data={pageData({}, { sent: [sentItem] })} />);
    expect(screen.getByText("Tôi đã gửi")).toBeInTheDocument();
    expect(screen.getByText(/27 người nhận/)).toBeInTheDocument();
  });

  it("bấm Thu hồi mở hộp thoại và CHƯA thu hồi gì", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter data={pageData({}, { sent: [sentItem] })} />);
    await user.click(screen.getByRole("button", { name: "Thu hồi" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Lịch sai");
    expect(dialog).toHaveTextContent("27");
    // Người nhận có thể đã đọc — hộp thoại phải nói ra điều đó.
    expect(dialog).toHaveTextContent(/ai đã đọc rồi thì đã đọc rồi/i);
    expect(retract).not.toHaveBeenCalled();
  });

  it("D-166 — thu hồi gửi kèm lý do người dùng gõ", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter data={pageData({}, { sent: [sentItem] })} />);
    await user.click(screen.getByRole("button", { name: "Thu hồi" }));
    await user.type(await screen.findByLabelText(/Lý do thu hồi/), "Gửi nhầm lớp");
    // Nút trong danh sách và nút xác nhận trong hộp thoại **cùng tên** — cố ý:
    // người dùng đọc một từ duy nhất suốt cả thao tác. Bài test phải thu hẹp
    // vào hộp thoại chứ không được đổi câu chữ giao diện để né bộ định vị
    // (bài học M08-C).
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Thu hồi" }));

    await waitFor(() => expect(retract).toHaveBeenCalledTimes(1));
    expect(retract.mock.calls[0][0]).toMatchObject({
      notificationId: "n-9",
      reason: "Gửi nhầm lớp",
    });
  });

  it("thiếu lý do — câu lỗi hiện TRONG hộp thoại, và hộp thoại ở lại mở", async () => {
    retract.mockResolvedValueOnce({
      ok: false, code: "VALIDATION_ERROR", message: "Vui lòng nêu lý do thu hồi.",
    } as never);
    const user = userEvent.setup();
    render(<NotificationCenter data={pageData({}, { sent: [sentItem] })} />);
    await user.click(screen.getByRole("button", { name: "Thu hồi" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Thu hồi" }));

    // Hộp thoại đang che nội dung phía sau: câu lỗi đặt ở đầu trang là câu lỗi
    // người dùng KHÔNG nhìn thấy.
    await waitFor(() =>
      expect(within(screen.getByRole("dialog")).getByText("Vui lòng nêu lý do thu hồi."))
        .toBeInTheDocument());
    // Và chữ đã gõ không bị mất — đóng hộp thoại là bắt họ gõ lại từ đầu.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("bản đã thu hồi không còn nút thu hồi, và hiện lý do", () => {
    render(<NotificationCenter data={pageData({}, {
      sent: [{
        ...sentItem,
        retractedAt: "2026-08-10T02:00:00.000Z",
        retractReason: "Gửi nhầm lớp",
      }],
    })} />);
    expect(screen.queryByRole("button", { name: "Thu hồi" })).not.toBeInTheDocument();
    expect(screen.getByText(/Gửi nhầm lớp/)).toBeInTheDocument();
  });

  it("người không gửi được gì thì không thấy mục 'Tôi đã gửi'", () => {
    render(<NotificationCenter data={pageData({
      canPublishGlobal: false, canPublishUser: false, classes: [],
    })} />);
    expect(screen.queryByText("Tôi đã gửi")).not.toBeInTheDocument();
  });
});

describe("TB-M10-06 · hộp thư lọc được và không nuốt mất dòng", () => {
  const inboxItem = {
    id: "i-1",
    title: "Chúa nhật mặc đồng phục",
    content: "Các em nhớ mặc đồng phục.",
    publishedAt: "2026-08-10T01:00:00.000Z",
    linkPath: null,
    readAt: null,
    targetType: "class" as const,
    retracted: false,
  };

  it("bộ lọc dựng bằng liên kết chép được, không phải nút giữ state", () => {
    render(<NotificationCenter data={pageData({}, { inbox: [inboxItem], inboxTotal: 1 })} />);
    expect(screen.getByRole("link", { name: "Chưa đọc" })).toHaveAttribute(
      "href", "/notifications?filter=unread",
    );
  });

  it("chip phạm vi mang TÊN phạm vi bằng chữ, không chỉ một mảng màu", () => {
    render(<NotificationCenter data={pageData({}, { inbox: [inboxItem], inboxTotal: 1 })} />);
    // Thu hẹp vào danh sách hộp thư: "Theo lớp" cũng là một lựa chọn trong ô
    // "Phạm vi" của biểu mẫu soạn thảo.
    expect(within(screen.getByRole("list")).getByText("Theo lớp")).toBeInTheDocument();
  });

  it("D-166 — bản đã thu hồi hiện nhãn và KHÔNG hiện nhãn 'Mới'", () => {
    render(<NotificationCenter data={pageData({}, {
      inbox: [{
        ...inboxItem,
        title: "Thông báo này đã được thu hồi",
        targetType: null,
        retracted: true,
      }],
      inboxTotal: 1,
    })} />);
    expect(screen.getByText("Đã thu hồi")).toBeInTheDocument();
    expect(screen.queryByText("Mới")).not.toBeInTheDocument();
  });

  it("còn dòng ở trang sau thì có phân trang — trước M10-C dòng thứ 51 biến mất", () => {
    render(<NotificationCenter data={pageData({}, {
      inbox: [inboxItem], inboxTotal: 120, page: 1,
    })} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("vừa đủ một trang thì không bày phân trang thừa", () => {
    render(<NotificationCenter data={pageData({}, { inbox: [inboxItem], inboxTotal: 1 })} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("`11` §5 — hai ca rỗng dùng trạng thái rỗng chuẩn và nói HAI câu khác nhau", () => {
    const { unmount } = render(<NotificationCenter data={pageData({}, { filter: "unread" })} />);
    expect(screen.getByText("Bạn đã đọc hết thông báo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem tất cả thông báo" })).toBeInTheDocument();
    unmount();

    // "đã đọc hết" và "chưa có gì" là hai tình huống khác hẳn nhau với người
    // dùng — gộp thành một câu là nói sai với một trong hai.
    render(<NotificationCenter data={pageData({}, { filter: "all" })} />);
    expect(screen.getByText("Hộp thư còn trống")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Xem tất cả thông báo" })).not.toBeInTheDocument();
  });
});
