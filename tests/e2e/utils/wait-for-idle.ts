import type { Page } from "@playwright/test";

/**
 * Chờ màn hình chờ toàn cục biến mất — `17_UI_POLISH_PLAN.md` §3.5.
 *
 * 🔴 Vì sao cần một helper riêng thay vì `waitForTimeout`: lớp phủ **che thật**
 * (nó chặn cú bấm thứ hai vào nút vừa bấm — hai lần "Chốt báo cáo" là hai bản
 * chốt). Nghĩa là một spec bấm nút ngay sau một thao tác chậm sẽ nhận
 * `element intercepts pointer events` chứ không phải một lỗi nghiệp vụ. Đây là
 * đúng loại đỏ-vì-hạ-tầng mà `P3-UX-001` đang đi dọn, nên phải có cách chờ tường
 * minh, không phải một con số giây đoán mò.
 *
 * Không có overlay nào đang hiện thì hàm trả về ngay.
 */
export const LOADING_OVERLAY_TEST_ID = "global-loading-overlay";

export async function waitForIdle(page: Page, timeout = 35_000): Promise<void> {
  await page
    .getByTestId(LOADING_OVERLAY_TEST_ID)
    .waitFor({ state: "detached", timeout })
    .catch(() => {
      // `detached` khi phần tử chưa từng xuất hiện là trạng thái đã đúng rồi.
    });
}
