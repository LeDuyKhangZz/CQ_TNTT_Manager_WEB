export const PROMOTION_PROPOSAL_STATUSES = [
  "recommended_promote",
  "recommended_repeat",
  "temporarily_pause",
  "withdraw",
] as const;

export type PromotionProposalStatus = (typeof PROMOTION_PROPOSAL_STATUSES)[number];
export type PromotionFinalStatus = "pending" | "approved" | "rejected";

export const PROMOTION_STATUS_LABELS: Record<PromotionProposalStatus | PromotionFinalStatus, string> = {
  pending: "Chờ duyệt",
  recommended_promote: "Đề nghị lên lớp",
  recommended_repeat: "Đề nghị học lại",
  temporarily_pause: "Tạm nghỉ",
  withdraw: "Rút học",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

