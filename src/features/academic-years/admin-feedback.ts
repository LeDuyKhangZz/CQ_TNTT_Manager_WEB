/**
 * Câu chữ phản hồi của trang `/admin` — M02-A, TB-F12 / AC-M02-04, D-61.
 *
 * 🔴 Vì sao là MỘT file thuần (không đụng máy chủ, chỉ import một file thuần khác
 * cùng feature): trước đợt
 * này, cả bốn thao tác ghi của trang đều **im lặng như nhau** (5W-F01) — tạo năm
 * học trùng mã, đặt hiện hành thất bại, lưu cấu hình bị RLS chặn, và cả sự cố
 * production "sinh 0 lớp" đều không hiện một chữ nào. Toàn bộ từ điển thông báo
 * tiếng Việt (`APP_ERROR_MESSAGES_VI`) trở thành mã chết vì **không có đường đi
 * tới giao diện**.
 *
 * ⚠️ **Lệch có chủ ý so với D-61, và lý do là một lỗi đo được, không phải sở thích.**
 * D-61 xếp ba thao tác một-nút của trang này vào loại *biểu mẫu ngắn* và chỉ định
 * "chuyển hướng kèm mã kết quả, hiện dòng thông báo ở đầu trang". Cách đó **không
 * chạy được ở đây**: cả bốn biểu mẫu đều nằm trên `/admin` và phải chuyển hướng về
 * chính `/admin`, mà Next 15.5 khi `redirect()` về **đúng route đang đứng** thì đổi
 * thanh địa chỉ rồi bỏ luôn lượt dựng lại — `<main>` trắng vĩnh viễn, không lỗi máy
 * chủ, không lỗi trình duyệt. Đo ở đợt M02-A trên cùng một bản build: chuyển hướng
 * sang route KHÁC dựng xong sau 749 ms; về chính nó thì treo quá 120 giây, và
 * `RedirectType.push` chỉ làm nó thỉnh thoảng chạy chứ không chữa được.
 *
 * Nên đường đi nay là `useActionState`: biểu mẫu vẫn là `<form action={…}>` thật
 * (giữ chạy-không-JS của 09 §11), server action trả thẳng câu chữ về, và dòng
 * thông báo hiện **ngay tại chỗ vừa thao tác**. Giữ đúng điều D-61 thật sự đòi —
 * *mọi thao tác ghi phải nói ra kết quả* — bằng cơ chế chạy được.
 *
 * Để ở file riêng, không nằm trong trang, để **kiểm được bằng unit test** mà
 * không phải dựng cả trang Server Component.
 */

import { openWorkPhrases, type AcademicYearOpenWork } from "./year-lifecycle";

export const ACADEMIC_YEAR_STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  current: "Đang áp dụng",
  closed: "Đã đóng",
  archived: "Đã lưu trữ",
};

/** Nhãn tiếng Việt cho trạng thái năm học; giá trị lạ thì trả nguyên văn. */
export function academicYearStatusLabel(status: string): string {
  return ACADEMIC_YEAR_STATUS_LABELS[status] ?? status;
}

/** Trùng tập giá trị `tone` của `FormMessage` để chỗ gọi không phải dịch qua lại. */
export type FeedbackTone = "success" | "danger";
export interface AdminFeedback {
  tone: FeedbackTone;
  text: string;
}

/** Mã kết quả thành công. Đặt tên theo việc, không theo tên hàm. */
export type AdminDoneCode =
  | "year_created"
  | "current_set"
  | "settings_saved"
  | "milestone_saved"
  | "milestone_cleared"
  | "year_closed"
  | "year_closed_forced"
  | "year_archived";

/**
 * Mã thất bại. Hẹp có chủ ý: mỗi mã phải ứng với **một câu người dùng làm được
 * gì đó khác đi**, nếu không thì gộp vào `invalid`.
 */
export type AdminFailedCode =
  | "forbidden"
  | "not_found"
  | "year_code_taken"
  | "reference_data_missing"
  | "year_closed"
  | "no_change"
  | "year_not_current"
  | "year_code_mismatch"
  | "year_has_open_work"
  | "close_reason_required"
  | "year_not_closed"
  | "retention_not_reached"
  | "invalid";

const FAILURE_TEXT: Record<AdminFailedCode, string> = {
  forbidden:
    "Bạn không có quyền thực hiện thao tác này. Vòng đời năm học chỉ dành cho Quản trị viên hệ thống.",
  not_found: "Không tìm thấy năm học. Có thể nó vừa bị đổi ở một cửa sổ khác — hãy tải lại trang.",
  year_code_taken: "Mã năm học này đã tồn tại. Mỗi năm học chỉ có một mã.",
  // Câu này phải nói RA VIỆC PHẢI LÀM, vì đây đúng là tình huống đã gây sự cố
  // production: không lớp nào được tạo mà màn hình vẫn báo xong (5W-F02).
  reference_data_missing:
    "Chưa có danh mục lớp chuẩn trong hệ thống nên không tạo được lớp nào. Hãy nạp dữ liệu tham chiếu (5 ngành · 13 cấp · 19 mẫu lớp) rồi thử lại.",
  year_closed: "Năm học đã đóng nên không sinh lớp được nữa.",
  no_change:
    "Không có dòng nào được cập nhật. Bản ghi có thể không còn tồn tại, hoặc bạn không đủ quyền sửa nó.",
  // M02-C — sáu câu của vòng đời năm học. Mỗi câu phải nói ra VIỆC PHẢI LÀM TIẾP,
  // vì đây là những chỗ người dùng bị từ chối giữa một quy trình dài.
  year_not_current:
    "Chỉ năm học đang áp dụng mới đóng được. Năm nháp thì chưa từng chạy, còn năm đã đóng thì đóng lại sẽ xoá mất thời điểm chốt sổ thật.",
  year_code_mismatch:
    "Mã năm học gõ lại không khớp. Hãy gõ đúng mã của năm học bạn muốn đóng — đây là bước để chắc chắn không đóng nhầm năm.",
  close_reason_required:
    "Năm học còn việc tồn đọng nên phải ghi lý do chốt sổ. Không có lý do thì vài tháng sau không ai giải thích được vì sao năm học bị đóng khi còn việc dở.",
  year_not_closed: "Chỉ năm học đã đóng mới lưu trữ được. Hãy đóng năm học trước.",
  retention_not_reached:
    "Chưa tới hạn giữ dữ liệu nên chưa lưu trữ được. Dữ liệu của năm học phải được giữ 5 năm sau khi kết thúc.",
  year_has_open_work:
    "Năm học còn việc tồn đọng nên chưa đóng thẳng được. Hãy hoàn tất, hoặc ghi lý do để chốt sổ ngay.",
  invalid: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
};

const DONE_TEXT: Record<AdminDoneCode, string> = {
  year_created: "Đã tạo năm học nháp. Bước tiếp theo: sinh cơ cấu lớp chuẩn, rồi mới đặt hiện hành.",
  current_set: "Đã đặt năm học này thành hiện hành.",
  settings_saved: "Đã lưu cấu hình điểm danh.",
  // D-71 / D-115 — nói luôn mốc này DÙNG ĐỂ LÀM GÌ. Một dòng "Đã lưu" suông không
  // cho người dùng biết vì sao hệ thống hỏi ngày đó, nên lần sau họ vẫn để trống.
  milestone_saved:
    "Đã lưu mốc kết thúc học kỳ 1. Qua mốc này, lớp Dự trưởng sẽ hiện cảnh báo — hệ thống không tự đóng lớp.",
  milestone_cleared:
    "Đã xoá mốc kết thúc học kỳ 1. Lớp Dự trưởng sẽ không hiện cảnh báo nào cho tới khi khai báo lại.",
  // I7 — nói ra HỆ QUẢ, không phải "Đã đóng". Sau khi đóng, hệ thống **không còn
  // năm học hiện hành nào**, và đó là điều người dùng cần biết ngay lập tức chứ
  // không phải phát hiện ra khi thanh đầu trang hiện "Chưa đặt năm học".
  year_closed:
    "Đã chốt sổ năm học. Hệ thống hiện không còn năm học hiện hành — hãy đặt năm học mới thành hiện hành trước khi ghi danh hay điểm danh.",
  year_closed_forced:
    "Đã chốt sổ năm học kèm lý do, dù còn việc tồn đọng. Hệ thống hiện không còn năm học hiện hành — hãy đặt năm học mới thành hiện hành. Việc còn dở của năm vừa đóng từ nay chỉ Quản trị viên hệ thống sửa được.",
  year_archived: "Đã lưu trữ năm học. Dữ liệu vẫn còn nguyên, không xoá gì.",
};

export function failureFeedback(code: AdminFailedCode): AdminFeedback {
  return { tone: "danger", text: FAILURE_TEXT[code] ?? FAILURE_TEXT.invalid };
}

export function doneFeedback(code: AdminDoneCode): AdminFeedback {
  return { tone: "success", text: DONE_TEXT[code] };
}

/**
 * Câu từ chối khi năm học còn việc tồn đọng — **BR-M02-N05**.
 *
 * Phải nêu **con số thật** rồi mới nói việc phải làm, đúng khuôn D-113 đã dùng cho
 * "đặt hiện hành khi chưa đủ lớp". Một câu "còn việc tồn đọng" suông buộc người dùng
 * tự đi tìm xem còn việc gì, mà chỗ tìm thì nằm ở ba màn hình khác nhau.
 *
 * Không đọc được bảng kiểm (hình dạng lạ) thì rơi về câu chung — **không bịa số 0**.
 */
export function openWorkFeedback(work: AcademicYearOpenWork | null): AdminFeedback {
  const phrases = work ? openWorkPhrases(work) : [];
  if (phrases.length === 0) return failureFeedback("year_has_open_work");
  return {
    tone: "danger",
    text: `Năm học còn ${phrases.join(" · ")}. Hãy hoàn tất, hoặc ghi lý do rồi bấm lại để chốt sổ ngay.`,
  };
}

/**
 * Câu chữ sau khi sinh lớp — **chỗ sự cố production nằm** (5W-F02).
 *
 * Bản cũ chỉ có một con số trả về, mang cả hai nghĩa trái ngược: 0 vì "đã sinh
 * rồi" (đúng) và 0 vì "không có gì để sinh" (hỏng cấu hình). Ba nhánh dưới đây là
 * lý do RPC phải trả `{inserted, expected}` thay vì một số nguyên.
 */
export function generationFeedback(inserted: number, expected: number): AdminFeedback {
  if (inserted === 0) {
    return {
      tone: "success",
      text: `Năm học đã có đủ ${expected} lớp từ trước. Không tạo thêm lớp nào.`,
    };
  }
  if (inserted === expected) {
    return { tone: "success", text: `Đã tạo ${inserted}/${expected} lớp.` };
  }
  return {
    tone: "success",
    text: `Đã tạo thêm ${inserted} lớp; năm học nay có đủ ${expected}/${expected} lớp.`,
  };
}
