import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  LOADING_IMAGE_DIR,
  LOADING_IMAGE_EXTENSIONS,
  LOADING_IMAGE_PUBLIC_PREFIX,
  LOI_CHUA_PATH,
} from "./constants";
import { parseLoiChua, type LoiChuaVerse } from "./verses";

/**
 * Tài sản của màn hình chờ — `17_UI_POLISH_PLAN.md` §3.2.
 *
 * 🔴 `server-only`: đọc đĩa. Client chỉ nhận **kết quả** qua prop của
 * `LoadingProvider`, không bao giờ nhận đường dẫn hệ thống tệp.
 *
 * 🔴 **ĐỒNG BỘ, và đây là điều bắt buộc chứ không phải sở thích.**
 *
 * Bản đầu dùng `fs/promises`, nên `getLoadingAssets()` là `async`, nên
 * `RouteLoadingOverlay` là `async`, nên **`loading.tsx` trở thành async**. Mà
 * `loading.tsx` chính là *fallback* của Suspense — **một fallback tự nó suspend
 * là nghịch lý**: React không có gì để hiện trong lúc chờ chính cái đang chờ.
 * Đo được trên `results.spec.ts:278`: đỏ **cả ba viewport**, tái hiện 100%, và
 * nó đã kịp lên production ở commit `803f42f`.
 *
 * Đọc đĩa đồng bộ ở đây **không** nằm trên đường tới hạn: cache tầng module nên
 * cả tiến trình chỉ đọc đúng một lần, và nó xảy ra lúc dựng vỏ chứ không lúc
 * truy vấn dữ liệu.
 *
 * Cả hai nguồn đều **tự nhận nội dung mới, không cần sửa code** — đúng hai yêu
 * cầu gốc của chủ dự án:
 *   • bỏ thêm ảnh vào `public/loading/` ⇒ ảnh vào vòng quay
 *   • thêm một dòng vào `src/content/LoiChua.md` ⇒ câu vào vòng quay
 *
 * Thêm ảnh/câu lúc máy chủ đang chạy thì khởi động lại là thấy.
 */

export type LoadingAssets = {
  /** Đường dẫn công khai, ví dụ `/loading/luce1.jpg`. Có thể rỗng. */
  images: string[];
  /** Có thể rỗng — `LoiChua.md` chưa điền thì overlay chỉ hiện ảnh. */
  verses: LoiChuaVerse[];
};

let cached: LoadingAssets | null = null;

function readImages(): string[] {
  try {
    const directory = path.join(process.cwd(), LOADING_IMAGE_DIR);

    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) =>
        LOADING_IMAGE_EXTENSIONS.some((extension) => name.toLowerCase().endsWith(extension)),
      )
      .sort((left, right) => left.localeCompare(right, "vi"))
      .map((name) => `${LOADING_IMAGE_PUBLIC_PREFIX}/${name}`);
  } catch {
    // Thiếu thư mục không phải lý do để làm sập trang. Overlay vẫn chạy được
    // bằng chữ và ba chấm nhún — xem `loading-overlay.tsx`.
    return [];
  }
}

function readVerses(): LoiChuaVerse[] {
  try {
    return parseLoiChua(readFileSync(path.join(process.cwd(), LOI_CHUA_PATH), "utf8"));
  } catch {
    return [];
  }
}

export function getLoadingAssets(): LoadingAssets {
  if (!cached) {
    cached = { images: readImages(), verses: readVerses() };
  }
  return cached;
}
