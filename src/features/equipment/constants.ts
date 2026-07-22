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
