export const PROMOTION_PROPOSAL_STATUSES = [
  "recommended_promote",
  "recommended_repeat",
  "temporarily_pause",
  "withdraw",
] as const;

export type PromotionProposalStatus = (typeof PROMOTION_PROPOSAL_STATUSES)[number];
export type PromotionFinalStatus = "pending" | "approved" | "rejected";

/**
 * Trần một lượt đề xuất hàng loạt — **M08-C, TO-BE 2 / AC-20**.
 *
 * `04_TO_BE_FLOWS` TO-BE 2 mục "Validation" chốt sẵn con số này
 * (`z.array(uuid).min(1).max(60)`), và nó vừa vặn với thực tế: lớp đông nhất của
 * xứ đoàn khoảng 50 em, nên 60 phủ trọn **một lớp** mà vẫn chặn một lượt gửi
 * hàng nghìn dòng do đường dẫn bị sửa tay.
 *
 * 🔴 Trần này **không** phải cỡ trang (`PROMOTION_PAGE_SIZE` = 25). Chủ dự án
 * chốt 2026-08-08: *"Chọn tất cả" lấy mọi em khớp bộ lọc, kể cả trang sau* — nên
 * hai con số cố ý khác nhau, và chỗ nào lẫn hai con số ấy là chỗ hoặc bỏ sót em
 * ở trang hai, hoặc gửi lên một danh sách vượt trần.
 */
export const PROMOTION_BATCH_LIMIT = 60;

export const PROMOTION_STATUS_LABELS: Record<PromotionProposalStatus | PromotionFinalStatus, string> = {
  pending: "Chờ duyệt",
  recommended_promote: "Đề nghị lên lớp",
  recommended_repeat: "Đề nghị học lại",
  temporarily_pause: "Tạm nghỉ",
  withdraw: "Rút học",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

