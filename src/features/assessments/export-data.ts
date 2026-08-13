import { safeSpreadsheetText } from "@/lib/exports/spreadsheet";
import type { GradebookDetail } from "./server/queries";

export { safeSpreadsheetText };

/**
 * M07-A · **TB-M07-08 / BR-M07-36 / S-10** — làm sạch **mọi** ô văn bản do người
 * dùng nhập, không riêng tên thiếu nhi.
 *
 * 🔴 **Lỗ hổng có thật, và 5-Whys của biên bản audit gọi đúng nguyên nhân gốc:**
 * lúc viết, *"dữ liệu do người dùng nhập"* được hiểu là **tên thiếu nhi** (đến
 * từ file import), còn **tiêu đề cột điểm** thì "do Giáo lý viên tự đặt nên tin
 * được". Tiêu đề cột là một ô văn bản tự do dài 120 ký tự — đặt tên cột là
 * `=1+1` hoàn toàn hợp lệ và không có gì chặn.
 *
 * ⚠️ **Vì sao vẫn phải làm dù rủi ro với `.xlsx` là thấp** (ExcelJS ghi ô chuỗi,
 * Excel không tự diễn giải): (a) `AGENTS` §5 xếp đây vào **kiểm soát bắt buộc**,
 * và đang bị áp dụng **nửa vời** — nửa vời còn tệ hơn không có, vì bảng kiểm ghi
 * là "đã có"; (b) tệp bảng điểm được gửi cho ngành/xứ đoàn và người nhận thường
 * *"Save as CSV"*, lúc đó khai thác được thật.
 *
 * 🔴 **Bọc CẢ Ô, không bọc riêng biến.** `04_TO_BE_FLOWS` bước 1–2 viết là *"bọc
 * `detail.className`"*, nhưng dấu nháy đơn của `safeSpreadsheetText` chỉ có tác
 * dụng khi nó đứng ở **đầu ô**: `BẢNG ĐIỂM '=cmd` là một dấu nháy nằm giữa
 * chuỗi, tức **không vô hiệu hoá gì cả**. Nên hàm này bọc chuỗi cuối cùng sẽ
 * được ghi vào ô — đúng chữ của **BR-M07-36** (*"mọi ô bảng tính…"*).
 *
 * 🔴 **`title`/`subtitle` sinh ở đây chứ không ở route, và đó là điều 5-Whys thứ
 * 5 đòi:** *"test viết theo hàm chứ không theo bề mặt tấn công"*. Route là API
 * handler, unit test không với tới; kéo hai ô ấy về đây thì cả ba bề mặt (tiêu
 * đề trang · tiêu đề cột · giá trị) nằm gọn trong một hàm thuần và có bài kiểm.
 * Mốc thời gian *"Xuất lúc …"* **cố ý không** nằm trong `subtitle`: nó làm bài
 * kiểm phụ thuộc đồng hồ, mà phần route ghép thêm luôn bắt đầu bằng chữ
 * `"Năm học "` nên đầu ô vẫn an toàn.
 */
export interface GradebookExportData {
  /** Ô A1 — đã làm sạch. */
  title: string;
  /** Ô A2 — đã làm sạch, **chưa** kèm mốc "Xuất lúc". */
  subtitle: string;
  headers: string[];
  rows: Array<Array<string | number | null>>;
}

export function buildGradebookExportData(detail: GradebookDetail): GradebookExportData {
  const headers = [
    "Tên thánh",
    "Họ tên",
    ...detail.assessments.map((item) => safeSpreadsheetText(`${item.title} (HS ${item.weight})`)),
    "Trung bình",
  ];
  const rows = detail.students.map((student) => [
    safeSpreadsheetText(student.saintName),
    safeSpreadsheetText(student.fullName),
    ...detail.assessments.map((assessment) => student.scores[assessment.id]?.score ?? null),
    student.weightedAverage,
  ]);
  return {
    title: safeSpreadsheetText(`BẢNG ĐIỂM ${detail.className.toUpperCase()}`),
    subtitle: safeSpreadsheetText(`Năm học ${detail.academicYearCode}`),
    headers,
    rows,
  };
}
