export const TEACHING_ITEM_TYPES = ["lesson", "assessment"] as const;

export type TeachingItemType = (typeof TEACHING_ITEM_TYPES)[number];

export const TEACHING_ITEM_TYPE_LABELS: Readonly<Record<TeachingItemType, string>> = {
  lesson: "Bài học",
  assessment: "Kiểm tra",
};

export const TEACHING_MATERIAL_BUCKET = "teaching-materials";

/**
 * 🔴 Trần dung lượng **đã dời sang `material-limits.ts`** cùng con số mới (M06-A).
 * Nó không còn là một hằng số trơ: cả trình duyệt lẫn máy chủ nay gọi chung một
 * hàm kiểm, và lý do phải hạ 5 MB xuống 4 MB được ghi ở chính file ấy.
 */
export const TEACHING_MATERIAL_ACCEPT = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
] as const;

/**
 * Giá trị cho thuộc tính `accept` của ô chọn tệp — **phần đuôi**, không phải
 * MIME.
 *
 * Danh sách MIME ở trên là allowlist của **máy chủ** và phải giữ nguyên dạng ấy.
 * Nhưng đưa thẳng nó vào `accept` thì dòng chú thích dưới ô hiện ra nguyên một
 * mảng `application/vnd.openxmlformats-officedocument.presentationml.presentation`
 * — đúng kỹ thuật, vô nghĩa với Giáo lý viên. Phần đuôi vừa đọc được vừa lọc
 * chính xác hơn trong hộp thoại chọn tệp của Windows.
 */
export const TEACHING_MATERIAL_ACCEPT_ATTR =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt";
