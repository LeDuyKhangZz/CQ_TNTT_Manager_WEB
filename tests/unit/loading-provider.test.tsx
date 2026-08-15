import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { LOADING_OVERLAY_TEST_ID, MIN_VISIBLE_MS, SHOW_AFTER_MS } from "@/lib/loading/constants";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

const { LoadingProvider, useGlobalPending } = await import(
  "@/components/loading/loading-provider"
);

const IMAGES = ["/loading/luce1.jpg", "/loading/luce2.jpg"];
const VERSES = [
  { text: "Thầy là đường, là sự thật và là sự sống.", source: "Ga 14,6" },
  { text: "Lời Chúa là ngọn đèn soi cho con bước.", source: "Tv 119,105" },
];

/** Một việc chậm. `pending` do bài kiểm bật/tắt qua `rerender`. */
function Task({ pending }: { pending: boolean }) {
  useGlobalPending(pending);
  return null;
}

function renderProvider(ui: React.ReactNode) {
  return render(
    <LoadingProvider images={IMAGES} verses={VERSES}>
      {ui}
    </LoadingProvider>,
  );
}

function rerenderWith(rerender: (ui: React.ReactElement) => void, ui: React.ReactNode) {
  rerender(
    <LoadingProvider images={IMAGES} verses={VERSES}>
      {ui}
    </LoadingProvider>,
  );
}

/** Đẩy đồng hồ giả và để React chạy hết các lượt cập nhật kéo theo. */
async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

function overlay() {
  return screen.queryByTestId(LOADING_OVERLAY_TEST_ID);
}

describe("LoadingProvider — luật thời gian (17 §3.3)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("🔴 KHÔNG còn ngưỡng chờ — chủ dự án bỏ mốc 1 giây 2026-08-14", () => {
    // Hằng số là hợp đồng, không phải chi tiết cài đặt: bài này đỏ ngay nếu ai đó
    // lặng lẽ đặt lại một ngưỡng chờ.
    expect(SHOW_AFTER_MS).toBe(0);
  });

  it("hiện NGAY khi có việc chạy, không chờ mốc nào", async () => {
    renderProvider(<Task pending />);

    await advance(1);
    expect(overlay()).not.toBeNull();
  });

  it("thao tác rất nhanh vẫn hiện, và giữ đủ MIN_VISIBLE_MS — không nháy", async () => {
    const { rerender } = renderProvider(<Task pending />);
    await advance(1);
    expect(overlay()).not.toBeNull();

    // Máy chủ trả lời sau 50ms. Overlay vẫn phải ở lại cho đủ ngưỡng chống nháy.
    await advance(50);
    rerenderWith(rerender, <Task pending={false} />);

    await advance(MIN_VISIBLE_MS - 100);
    expect(overlay()).not.toBeNull();

    await advance(200);
    expect(overlay()).toBeNull();
  });

  it("bộ đếm lồng nhau: chỉ tắt khi việc CUỐI CÙNG xong", async () => {
    const { rerender } = renderProvider(
      <>
        <Task pending />
        <Task pending />
      </>,
    );
    await advance(1);
    expect(overlay()).not.toBeNull();

    // Một việc xong, việc kia còn chạy ⇒ overlay PHẢI còn.
    rerenderWith(
      rerender,
      <>
        <Task pending />
        <Task pending={false} />
      </>,
    );
    await advance(5000);
    expect(overlay()).not.toBeNull();

    rerenderWith(
      rerender,
      <>
        <Task pending={false} />
        <Task pending={false} />
      </>,
    );
    await advance(MIN_VISIBLE_MS + 100);
    expect(overlay()).toBeNull();
  });

  it("lưới an toàn 30 giây tự ẩn kể cả khi việc không bao giờ báo xong", async () => {
    renderProvider(<Task pending />);
    await advance(1);
    expect(overlay()).not.toBeNull();

    await advance(30_000);
    expect(overlay()).toBeNull();
  });

  it("ẩn là UNMOUNT HẲN — không phải phần tử trong suốt còn ăn cú bấm", async () => {
    const { rerender, container } = renderProvider(<Task pending />);
    await advance(1);

    rerenderWith(rerender, <Task pending={false} />);
    await advance(MIN_VISIBLE_MS + 100);

    expect(container.querySelector(`[data-testid="${LOADING_OVERLAY_TEST_ID}"]`)).toBeNull();
  });
});

describe("LoadingProvider — nội dung cửa sổ chờ (17 §3.2)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hiện một câu Lời Chúa kèm nguồn, và ảnh là ảnh trang trí (alt rỗng)", async () => {
    renderProvider(<Task pending />);
    await advance(1);

    const box = overlay();
    expect(box).not.toBeNull();
    // 🔴 KHÔNG phải vùng `status`: overlay hiện ở mọi thao tác, nếu nó phát
    // `aria-live` thì mỗi cú bấm sẽ đọc "Đang xử lý…" kèm nguyên một câu Kinh
    // Thánh, nhấn chìm câu kết quả thật. Nó cũng sẽ chiếm chỗ `role="status"`
    // ĐẦU TIÊN trong DOM và cướp bộ định vị của `FormMessage`.
    expect(box).toHaveAttribute("aria-hidden", "true");
    expect(box).not.toHaveAttribute("role");
    expect(box).not.toHaveAttribute("aria-live");

    const quote = box!.querySelector("blockquote");
    expect(quote).not.toBeNull();
    expect(VERSES.some((verse) => quote!.textContent?.includes(verse.text))).toBe(true);

    const image = box!.querySelector("img");
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute("alt", "");
  });
});

describe("useGlobalPending — không có provider", () => {
  it("không ném lỗi: component nghiệp vụ vẫn render trần được", () => {
    expect(() => render(<Task pending />)).not.toThrow();
  });
});

describe("test id dùng chung giữa ứng dụng và E2E", () => {
  it("`waitForIdle` chờ ĐÚNG phần tử mà overlay dựng ra", async () => {
    // Bộ E2E không nhập được từ `@/…` (Playwright chạy ngoài alias của Next), nên
    // chuỗi test id bị chép làm hai bản. Bài này là hàng rào duy nhất chống việc
    // đổi một bản mà quên bản kia — lúc ấy `waitForIdle` sẽ chờ một phần tử không
    // bao giờ tồn tại và **im lặng trả về ngay**, tức mất tác dụng mà không đỏ.
    const e2e = await import("../e2e/utils/wait-for-idle");
    expect(e2e.LOADING_OVERLAY_TEST_ID).toBe(LOADING_OVERLAY_TEST_ID);
  });
});
