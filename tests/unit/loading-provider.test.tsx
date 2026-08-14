import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { LOADING_OVERLAY_TEST_ID } from "@/lib/loading/constants";

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

/** Đẩy đồng hồ giả và để React chạy hết các lượt cập nhật kéo theo. */
async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

function overlay() {
  return screen.queryByTestId(LOADING_OVERLAY_TEST_ID);
}

describe("LoadingProvider — ngưỡng thời gian (17 §3.3)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("thao tác NHANH (dưới 1 giây) không chớp overlay", async () => {
    const { rerender } = renderProvider(<Task pending />);

    await advance(500);
    expect(overlay()).toBeNull();

    rerender(
      <LoadingProvider images={IMAGES} verses={VERSES}>
        <Task pending={false} />
      </LoadingProvider>,
    );
    await advance(5000);
    expect(overlay()).toBeNull();
  });

  it("đúng mốc 1 giây mới hiện, và không hiện sớm hơn một mili giây nào", async () => {
    renderProvider(<Task pending />);

    await advance(999);
    expect(overlay()).toBeNull();

    await advance(1);
    expect(overlay()).not.toBeNull();
  });

  it("đã hiện thì giữ đủ 600ms — không nháy tắt", async () => {
    const { rerender } = renderProvider(<Task pending />);
    await advance(1000);
    expect(overlay()).not.toBeNull();

    rerender(
      <LoadingProvider images={IMAGES} verses={VERSES}>
        <Task pending={false} />
      </LoadingProvider>,
    );

    await advance(599);
    expect(overlay()).not.toBeNull();

    await advance(1);
    expect(overlay()).toBeNull();
  });

  it("bộ đếm lồng nhau: chỉ tắt khi việc CUỐI CÙNG xong", async () => {
    const both = (
      <>
        <Task pending />
        <Task pending />
      </>
    );
    const { rerender } = renderProvider(both);
    await advance(1000);
    expect(overlay()).not.toBeNull();

    // Một việc xong, việc kia còn chạy ⇒ overlay PHẢI còn.
    rerender(
      <LoadingProvider images={IMAGES} verses={VERSES}>
        <Task pending />
        <Task pending={false} />
      </LoadingProvider>,
    );
    await advance(5000);
    expect(overlay()).not.toBeNull();

    rerender(
      <LoadingProvider images={IMAGES} verses={VERSES}>
        <Task pending={false} />
        <Task pending={false} />
      </LoadingProvider>,
    );
    await advance(600);
    expect(overlay()).toBeNull();
  });

  it("lưới an toàn 30 giây tự ẩn kể cả khi việc không bao giờ báo xong", async () => {
    renderProvider(<Task pending />);
    await advance(1000);
    expect(overlay()).not.toBeNull();

    await advance(30_000);
    expect(overlay()).toBeNull();
  });

  it("ẩn là UNMOUNT HẲN — không phải phần tử trong suốt còn ăn cú bấm", async () => {
    const { rerender, container } = renderProvider(<Task pending />);
    await advance(1000);

    rerender(
      <LoadingProvider images={IMAGES} verses={VERSES}>
        <Task pending={false} />
      </LoadingProvider>,
    );
    await advance(600);

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
    await advance(1000);

    const box = overlay();
    expect(box).not.toBeNull();
    expect(box).toHaveAttribute("role", "status");
    expect(box).toHaveAttribute("aria-live", "polite");

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
