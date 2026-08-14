import "server-only";

import { readdir, readFile } from "node:fs/promises";
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
 * Cả hai nguồn đều **tự nhận nội dung mới, không cần sửa code** — đúng hai yêu
 * cầu gốc của chủ dự án:
 *   • bỏ thêm ảnh vào `public/loading/` ⇒ ảnh vào vòng quay
 *   • thêm một dòng vào `src/content/LoiChua.md` ⇒ câu vào vòng quay
 *
 * Cache ở tầng module (một lần mỗi tiến trình): thư mục ảnh và kho câu không đổi
 * giữa hai lượt yêu cầu của cùng một tiến trình máy chủ, mà đọc đĩa thì nằm ngay
 * trên đường tới hạn của **mọi** lần dựng trang. Thêm ảnh/câu lúc máy chủ đang
 * chạy thì khởi động lại là thấy.
 */

export type LoadingAssets = {
  /** Đường dẫn công khai, ví dụ `/loading/luce1.jpg`. Có thể rỗng. */
  images: string[];
  /** Có thể rỗng — `LoiChua.md` chưa điền thì overlay chỉ hiện ảnh. */
  verses: LoiChuaVerse[];
};

let cached: Promise<LoadingAssets> | null = null;

async function readImages(): Promise<string[]> {
  try {
    const directory = path.join(process.cwd(), LOADING_IMAGE_DIR);
    const entries = await readdir(directory, { withFileTypes: true });

    return entries
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

async function readVerses(): Promise<LoiChuaVerse[]> {
  try {
    const file = path.join(process.cwd(), LOI_CHUA_PATH);
    return parseLoiChua(await readFile(file, "utf8"));
  } catch {
    return [];
  }
}

export function getLoadingAssets(): Promise<LoadingAssets> {
  if (!cached) {
    cached = Promise.all([readImages(), readVerses()]).then(([images, verses]) => ({
      images,
      verses,
    }));
  }
  return cached;
}
