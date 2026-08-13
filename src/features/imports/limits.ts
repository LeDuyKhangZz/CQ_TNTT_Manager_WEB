/**
 * Hai cái trần của luồng nhập Excel — M12-C, **TO-BE 8 / NC-01 / NC-02**,
 * đóng **SEC-10** và **SEC-12**.
 *
 * 🔴 **Vì sao trần cũ 5 MB là một cái bẫy chứ không phải một hàng rào.** Vercel
 * chặn mọi request nặng hơn ~4,5 MB **ở tầng hạ tầng**, tức **trước khi** mã của
 * ứng dụng chạy một dòng nào. Câu `"File vượt quá 5MB."` viết ở `actions.ts` vì
 * thế **không bao giờ** đến được người dùng cho đúng khoảng nó sinh ra để canh:
 * file 4,5–5 MB chết ở tầng dưới với một trang lỗi tiếng Anh. `next.config.mjs`
 * lại đặt `bodySizeLimit: "6mb"`, cao hơn cả trần nền tảng — một con số không có
 * hiệu lực nào ngoài việc làm người đọc mã tưởng hệ thống nhận được 6 MB.
 *
 * Chủ dự án chốt 2026-08-03 (**D-137**): trần ứng dụng **4 MB**, cấu hình nền
 * tảng **4,5 MB**. Số đo làm căn cứ: 21 file Excel thật của giáo xứ, **file nặng
 * nhất 860 KB** — còn dư gần 5 lần.
 *
 * 🔴 **Trần số dòng là thứ TRƯỚC ĐÂY KHÔNG TỒN TẠI.** `08_ACCEPTANCE_CRITERIA`
 * §C xếp SEC-12 (*"upload file có 100.000 dòng"*) vào nhóm **phải xanh** và ghi
 * thẳng *"hiện chưa có giới hạn số dòng"*. Giới hạn dung lượng **không thay thế
 * được** nó: một sheet toàn chữ nén rất tốt, nên 4 MB `.xlsx` vẫn chứa được hàng
 * trăm nghìn dòng — mà mỗi dòng là một lượt `buildRow` + một lượt dò trùng trên
 * toàn bộ hồ sơ đã có. Chủ dự án chốt **1.000 dòng** (**D-138**): sổ lớp đông
 * nhất của giáo xứ là **75 dòng**, và gộp cả 19 lớp cũng chỉ ~900.
 *
 * File thuần, không import gì từ tầng server ⇒ cùng một con số dùng được ở cả
 * Server Action lẫn biểu mẫu phía trình duyệt, và kiểm được bằng unit test.
 */

/** D-137 — trần của ứng dụng. Đặt **dưới** trần ~4,5 MB của nền tảng. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Nhãn hiện ra màn hình. Một chỗ duy nhất để mã và câu chữ không lệch nhau. */
export const MAX_UPLOAD_LABEL = "4 MB";

/** D-138 — trần số dòng đọc được trong một file. */
export const MAX_IMPORT_ROWS = 1000;

/**
 * `1.000` — dấu chấm phân nhóm nghìn theo cách viết tiếng Việt.
 *
 * ⚠️ Tự chèn dấu chứ **không** dùng `toLocaleString("vi-VN")`: kết quả của hàm
 * ấy phụ thuộc vào việc môi trường chạy có đủ dữ liệu ICU hay không, và khi
 * thiếu nó lặng lẽ trả về `1,000` — dấu phẩy, tức cách viết tiếng Anh — ngay
 * giữa một câu tiếng Việt. Một câu chữ ra màn hình không được đổi theo môi trường.
 */
export function formatRowCount(rows: number): string {
  return rows.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/**
 * Câu từ chối file quá nặng — SEC-10.
 *
 * Nói ra **cả ba** thứ người dùng cần: file của họ nặng bao nhiêu, trần là bao
 * nhiêu, và **việc phải làm**. Sổ lớp thật nặng chưa tới 1 MB nên một file 4 MB
 * gần như chắc chắn mang theo ảnh hoặc sheet phụ — đó mới là chỗ để xử lý, chứ
 * không phải chia nhỏ danh sách em.
 */
export function uploadTooLargeText(bytes: number): string {
  return (
    `File nặng ${formatMegabytes(bytes)}, vượt quá giới hạn ${MAX_UPLOAD_LABEL} cho một lần tải lên. ` +
    "Sổ lớp thật của giáo xứ nặng chưa tới 1 MB, nên file này nhiều khả năng có kèm ảnh hoặc " +
    "nhiều sheet phụ. Hãy xoá bớt sheet không cần rồi lưu lại, hoặc tách theo lớp — mỗi lớp một file."
  );
}

/**
 * Câu từ chối file quá nhiều dòng — SEC-12.
 *
 * Đặt **sau** khi đọc file xong chứ không phải trước: số dòng chỉ biết được sau
 * khi `parseWorkbook` chọn xong sheet giàu nhất. Đổi lại, câu nói được ra **con
 * số thật** thay vì một lời cảnh báo chung chung.
 */
export function tooManyRowsText(rows: number): string {
  return (
    `File có ${formatRowCount(rows)} dòng, vượt quá giới hạn ${formatRowCount(MAX_IMPORT_ROWS)} dòng ` +
    "cho một lần nhập. Hãy tách theo lớp — mỗi sổ lớp một file, đúng cách giáo xứ đang làm. " +
    "Sổ lớp đông nhất hiện nay chỉ có 75 dòng."
  );
}

/**
 * Kiểm dung lượng trước khi gửi — dùng ở **cả hai** phía.
 *
 * Phía trình duyệt nó là thứ duy nhất chặn được trang lỗi tiếng Anh của nền
 * tảng (file 4,5 MB trở lên không bao giờ tới được mã máy chủ). Phía máy chủ nó
 * là hàng rào thật, vì người gọi thẳng Server Action không chạy qua biểu mẫu.
 */
export function checkUploadSize(bytes: number): string | null {
  return bytes > MAX_UPLOAD_BYTES ? uploadTooLargeText(bytes) : null;
}
