/**
 * Hằng số của hệ thống chờ toàn cục — `17_UI_POLISH_PLAN.md` §3.3, `09` §12 A3/A4.
 *
 * Ba ngưỡng thời gian nằm **một chỗ duy nhất** để đổi được mà không phải đi tìm.
 * Chúng không phải con số tuỳ ý:
 *
 *   • `SHOW_AFTER_MS` là đúng yêu cầu gốc của chủ dự án — *"mọi thao tác > 1 giây"*.
 *     Hiện sớm hơn thì thao tác nhanh sẽ **chớp** một cửa sổ rồi tắt, khó chịu hơn
 *     là không có gì.
 *   • `MIN_VISIBLE_MS` chống nháy: đã hiện thì phải đủ lâu để mắt kịp nhận ra, nếu
 *     không người dùng chỉ thấy một cú giật.
 *   • `FAILSAFE_HIDE_MS` là lưới an toàn. Nếu một `end()` bị nuốt (lỗi mạng, component
 *     bị gỡ giữa chừng, cú bấm không dẫn tới điều hướng nào), overlay **phải** tự
 *     biến mất chứ không được khoá màn hình vĩnh viễn.
 */

/** Chỉ hiện overlay khi thao tác vượt 1 giây (yêu cầu gốc của chủ dự án). */
export const SHOW_AFTER_MS = 1000;

/** Đã hiện thì giữ ít nhất chừng này, để không nháy tắt. */
export const MIN_VISIBLE_MS = 600;

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
