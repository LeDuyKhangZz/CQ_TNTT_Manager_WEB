export const EQUIPMENT_CONDITIONS = [
  "good",
  "needs_maintenance",
  "damaged",
  "lost",
  "retired",
] as const;
export type EquipmentCondition = (typeof EQUIPMENT_CONDITIONS)[number];

export const EQUIPMENT_CONDITION_LABELS: Readonly<Record<EquipmentCondition, string>> = {
  good: "Tốt",
  needs_maintenance: "Cần bảo trì",
  damaged: "Hư hỏng",
  lost: "Mất",
  retired: "Ngưng sử dụng",
};

export const EQUIPMENT_LOAN_STATUSES = ["borrowed", "returned"] as const;
export type EquipmentLoanStatus = (typeof EQUIPMENT_LOAN_STATUSES)[number];

export const EQUIPMENT_LOAN_STATUS_LABELS: Readonly<Record<EquipmentLoanStatus, string>> = {
  borrowed: "Đang mượn",
  returned: "Đã trả",
};

/** M09-B: hai việc khác hẳn nhau, trước đợt này dùng chung một con số. */
export const EQUIPMENT_LOAN_EVENT_KINDS = ["receive", "write_off"] as const;
export type EquipmentLoanEventKind = (typeof EQUIPMENT_LOAN_EVENT_KINDS)[number];

export const EQUIPMENT_LOAN_EVENT_LABELS: Readonly<Record<EquipmentLoanEventKind, string>> = {
  receive: "Nhận lại hàng",
  write_off: "Báo hỏng/mất",
};

/** Lý do đổi tổng kho ngoài phiếu mượn (TB-M09-04). */
export const EQUIPMENT_STOCK_ADJUSTMENT_REASONS = [
  "purchase",
  "found",
  "stocktake",
  "damaged",
] as const;
export type EquipmentStockAdjustmentReason =
  (typeof EQUIPMENT_STOCK_ADJUSTMENT_REASONS)[number];

export const EQUIPMENT_STOCK_ADJUSTMENT_REASON_LABELS: Readonly<
  Record<EquipmentStockAdjustmentReason, string>
> = {
  purchase: "Mua mới",
  found: "Tìm lại được",
  stocktake: "Kiểm kê",
  damaged: "Hỏng/mất khi trong kho",
};

/**
 * Lý do nào đi với chiều nào. Tách ra để ô chọn không mời người dùng ghép một
 * cặp vô nghĩa ("Mua mới" mà tổng kho lại giảm).
 */
export const EQUIPMENT_STOCK_INCREASE_REASONS: readonly EquipmentStockAdjustmentReason[] = [
  "purchase",
  "found",
  "stocktake",
];
export const EQUIPMENT_STOCK_DECREASE_REASONS: readonly EquipmentStockAdjustmentReason[] = [
  "damaged",
  "stocktake",
];
