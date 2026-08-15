/**
 * Hằng số của hệ thống chờ toàn cục — `17_UI_POLISH_PLAN.md` §3.3, `09` §12 A3/A4.
 *
 * Ba ngưỡng thời gian nằm **một chỗ duy nhất** để đổi được mà không phải đi tìm.
 * Chúng không phải con số tuỳ ý:
 *
 *   • `SHOW_AFTER_MS = 0` — **chủ dự án đổi ý 2026-08-14**: *"cứ loading là xuất
 *     hiện, > 0ms là xuất hiện"*. Bản đầu để 1000ms theo yêu cầu gốc *"mọi thao
 *     tác > 1 giây"*, nhưng trên Vercel phần lớn thao tác xong dưới một giây nên
 *     overlay gần như không bao giờ hiện — đúng luật mà sai ý muốn.
 *   • `MIN_VISIBLE_MS` chống nháy, và **từ khi ngưỡng về 0 nó là con số quyết
 *     định**: mọi thao tác đều che màn hình ít nhất chừng này, kể cả khi máy chủ
 *     trả lời trong 50ms. Đây là chỗ chỉnh nếu thấy ứng dụng "nặng tay".
 *   • `FAILSAFE_HIDE_MS` là lưới an toàn. Nếu một `end()` bị nuốt (lỗi mạng, component
 *     bị gỡ giữa chừng, cú bấm không dẫn tới điều hướng nào), overlay **phải** tự
 *     biến mất chứ không được khoá màn hình vĩnh viễn.
 */

/** 0 = hiện NGAY khi có việc chạy. Xem ghi chú ở đầu tệp. */
export const SHOW_AFTER_MS = 0;

/**
 * Đã hiện thì giữ ít nhất chừng này, để không nháy tắt.
 *
 * 🔴 600 → **250** (chủ dự án chọn 2026-08-14). Khi `SHOW_AFTER_MS` còn 1000 thì
 * con số này gần như vô hình vì overlay hiếm khi hiện. Từ lúc ngưỡng về 0, nó
 * thành **thời gian che màn hình của MỌI cú bấm**, và cái giá đo được trên bộ 588
 * bài E2E là **22,0 → 38,1 phút** — tức ứng dụng nặng tay lên đúng chừng ấy, chứ
 * không phải chỉ bộ kiểm chạy lâu. 250ms vẫn đủ để mắt bắt được là "có gì đó vừa
 * chạy", mà không biến mỗi thao tác thành một quãng chờ.
 */
export const MIN_VISIBLE_MS = 250;

/** Trần cứng: quá hạn này thì tự ẩn và xoá sạch bộ đếm. */
export const FAILSAFE_HIDE_MS = 30_000;

/** E2E bám vào đây để chờ màn hình rảnh — xem `tests/e2e/utils/wait-for-idle.ts`. */
export const LOADING_OVERLAY_TEST_ID = "global-loading-overlay";

/**
 * Đuôi ảnh được nhận trong `public/loading/`. Thêm ảnh mới **không cần sửa code** —
 * đây chính là điều chủ dự án yêu cầu ("phải tự nhận ảnh thêm sau này").
 */
export const LOADING_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const;

/** Thư mục ảnh, tính từ gốc dự án. */
export const LOADING_IMAGE_DIR = "public/loading";

/** Đường dẫn công khai tương ứng với `LOADING_IMAGE_DIR`. */
export const LOADING_IMAGE_PUBLIC_PREFIX = "/loading";

/** Kho câu Lời Chúa, tính từ gốc dự án. */
export const LOI_CHUA_PATH = "src/content/LoiChua.md";
