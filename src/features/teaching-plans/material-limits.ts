/**
 * Trần dung lượng và định dạng của tài liệu giáo án — M06-A, hạng mục **#10**
 * (`07_IMPLEMENTATION_IMPACT` §1) và **BR-M06-16**.
 *
 * 🔴 **Con số 5 MB cũ là một lời hứa KHÔNG THỂ giữ, không phải một hàng rào.**
 * Đây đúng cái bẫy M12-C đã ghi lại và trả giá một lần rồi: `next.config.mjs`
 * đặt `bodySizeLimit: "4.5mb"` — trần thân request của nền tảng (D-137) — mà
 * `bodySizeLimit` áp cho **MỌI** Server Action, không riêng luồng nhập Excel.
 * Tải tài liệu giáo án đi qua `uploadTeachingMaterial(FormData)`, tức là cũng
 * một Server Action. Hệ quả đo được:
 *
 *   • tệp 4,6 MB: chết ở tầng hạ tầng bằng **một trang lỗi tiếng Anh**, trước
 *     khi bất cứ dòng mã nào của ứng dụng chạy;
 *   • câu `"Tệp phải có dung lượng từ 1 byte đến 5 MB."` viết ở `actions.ts`
 *     **không bao giờ** tới được người dùng cho đúng khoảng nó sinh ra để canh;
 *   • dòng chữ *"tối đa 5 MB"* dưới ô chọn tệp **mời** người dùng làm đúng thứ
 *     chắc chắn hỏng.
 *
 * Nên trần ứng dụng ở đây là **4 MB**, đúng con số D-137 đã chốt cho toàn hệ
 * thống — một sự thật duy nhất, không phải hai. Bucket `teaching-materials` giữ
 * nguyên `file_size_limit = 5242880` (pgTAP `015` canh con số đó): nó là lớp
 * chặn NGOÀI CÙNG cho đường ghi không đi qua Server Action, và một hàng rào
 * ngoài rộng hơn hàng rào trong là đúng chiều, không phải mâu thuẫn.
 *
 * 🔴 Kiểm ở trình duyệt **không phải** kiểm bảo mật (AGENTS.md §5). Máy chủ vẫn
 * gọi đúng hàm này một lần nữa — cùng một hàm, nên hai phía không thể lệch câu
 * chữ lẫn con số. File thuần, không import gì từ tầng server, để unit test đọc
 * được.
 */

import { TEACHING_MATERIAL_ACCEPT } from "./constants";

/** Trần của ứng dụng, đặt **dưới** trần ~4,5 MB của nền tảng (D-137). */
export const TEACHING_MATERIAL_MAX_MB = 4;
export const TEACHING_MATERIAL_MAX_BYTES = TEACHING_MATERIAL_MAX_MB * 1024 * 1024;

/** Nhãn hiện ra màn hình. Một chỗ duy nhất để mã và câu chữ không lệch nhau. */
export const TEACHING_MATERIAL_MAX_LABEL = `${TEACHING_MATERIAL_MAX_MB} MB`;

/**
 * Câu đuôi dưới ô chọn tệp. Định dạng và trần dung lượng do chính `FileUpload`
 * sinh ra từ `accept`/`maxSizeMb`, nên **không** lặp lại ở đây — hai chỗ cùng
 * nói một con số là hai chỗ có thể lệch nhau.
 */
export const TEACHING_MATERIAL_HINT = "Chỉ nhân sự đúng phạm vi lớp được tải xuống.";

/** Câu đầy đủ cho màn hình **chỉ xem**, nơi không có ô chọn tệp để tự mô tả. */
export const TEACHING_MATERIAL_SUMMARY =
  `PDF, Word, PowerPoint, Excel, ảnh hoặc tệp văn bản · tối đa ${TEACHING_MATERIAL_MAX_LABEL} · ` +
  "chỉ nhân sự đúng phạm vi lớp được tải xuống.";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Hình dạng tối thiểu của một tệp — để unit test không cần dựng `File` thật. */
export interface TeachingMaterialFileLike {
  name: string;
  size: number;
  type: string;
}

/**
 * Trả câu từ chối tiếng Việt, hoặc `null` khi tệp hợp lệ.
 *
 * Nói ra **cả ba** thứ người dùng cần khi tệp quá nặng: tệp của họ nặng bao
 * nhiêu, trần là bao nhiêu, và việc phải làm. Một câu *"Tệp quá lớn"* trơ trọi
 * buộc người dùng phải đoán xem bao nhiêu mới vừa.
 */
export function checkTeachingMaterialFile(file: TeachingMaterialFileLike): string | null {
  if (file.size < 1) {
    return "Tệp rỗng, không có nội dung nào để lưu. Hãy chọn lại tệp.";
  }
  if (file.size > TEACHING_MATERIAL_MAX_BYTES) {
    return (
      `Tệp nặng ${formatSize(file.size)}, vượt quá giới hạn ${TEACHING_MATERIAL_MAX_LABEL} ` +
      "cho một lần tải lên. Hãy nén ảnh trong tệp, hoặc xuất bản PDF gọn hơn rồi tải lại."
    );
  }
  if (!TEACHING_MATERIAL_ACCEPT.includes(file.type as (typeof TEACHING_MATERIAL_ACCEPT)[number])) {
    return "Chỉ nhận PDF, Word, PowerPoint, Excel, ảnh hoặc tệp văn bản.";
  }
  if (!file.name.trim()) {
    return "Tệp không có tên. Hãy đặt tên cho tệp rồi tải lại.";
  }
  return null;
}
