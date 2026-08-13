import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  EquipmentCondition,
  EquipmentLoanEventKind,
  EquipmentLoanStatus,
  EquipmentStockAdjustmentReason,
} from "../constants";

export interface EquipmentItemRow {
  id: string;
  assetCode: string;
  name: string;
  category: string | null;
  totalQuantity: number;
  availableQuantity: number;
  condition: EquipmentCondition;
  storageLocation: string | null;
  note: string | null;
  isActive: boolean;
}

export interface EquipmentLoanEventRow {
  id: string;
  loanId: string;
  kind: EquipmentLoanEventKind;
  quantity: number;
  condition: EquipmentCondition | null;
  note: string | null;
  createdAt: string;
}

export interface EquipmentLoanRow {
  id: string;
  equipmentItemId: string;
  itemName: string;
  quantity: number;
  /** Số cái người mượn còn giữ. Phiếu chỉ đóng khi về 0 (M09-B). */
  outstandingQuantity: number;
  /** Tổng số cái đã nhận lại kho, cộng dồn qua nhiều lần trả (M09-B). */
  restoredQuantity: number;
  borrowerName: string | null;
  borrowedAt: string;
  expectedReturnAt: string | null;
  returnedAt: string | null;
  borrowNote: string | null;
  returnNote: string | null;
  conditionOnReturn: EquipmentCondition | null;
  status: EquipmentLoanStatus;
  events: EquipmentLoanEventRow[];
}

export interface EquipmentStockAdjustmentRow {
  id: string;
  equipmentItemId: string;
  itemName: string;
  delta: number;
  reason: EquipmentStockAdjustmentReason;
  note: string | null;
  totalAfter: number;
  createdAt: string;
}

export interface EquipmentBoardData {
  items: EquipmentItemRow[];
  loans: EquipmentLoanRow[];
  borrowerOptions: Array<{ id: string; displayName: string; staffCode: string }>;
  adjustments: EquipmentStockAdjustmentRow[];
}

function staffName(staff: { saint_name: string | null; full_name: string } | null): string | null {
  if (!staff) return null;
  return `${staff.saint_name ?? ""} ${staff.full_name}`.trim() || null;
}

export async function getEquipmentBoard(committeeId: string): Promise<EquipmentBoardData> {
  const supabase = await createClient();
  const [
    { data: itemData },
    { data: loanData },
    { data: eventData },
    { data: adjustmentData },
    { data: borrowerData },
  ] = await Promise.all([
    supabase.from("equipment_items").select("*").eq("committee_id", committeeId).order("name"),
    supabase
      .from("equipment_loans")
      .select("*, equipment_items(name), staff_profiles(saint_name, full_name)")
      .eq("committee_id", committeeId)
      .order("borrowed_at", { ascending: false })
      .limit(50),
    supabase
      .from("equipment_loan_events")
      .select("*")
      .eq("committee_id", committeeId)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("equipment_stock_adjustments")
      .select("*, equipment_items(name)")
      .eq("committee_id", committeeId)
      .order("created_at", { ascending: false })
      .limit(20),
    // D-94 + D-97: cửa sổ hẹp CHỈ TÊN. Người chỉ có quyền đọc kho (Cha sở,
    // Thủ quỹ…) không thao tác được nên RPC trả 42501 — đó là câu trả lời đúng,
    // và trang vẫn phải dựng được với danh sách rỗng.
    supabase.rpc("list_equipment_borrower_options", { p_committee_id: committeeId }),
  ]);

  const eventsByLoan = new Map<string, EquipmentLoanEventRow[]>();
  for (const event of eventData ?? []) {
    const row: EquipmentLoanEventRow = {
      id: event.id,
      loanId: event.loan_id,
      kind: event.kind as EquipmentLoanEventKind,
      quantity: event.quantity,
      condition: event.condition as EquipmentCondition | null,
      note: event.note,
      createdAt: event.created_at,
    };
    const bucket = eventsByLoan.get(event.loan_id);
    if (bucket) bucket.push(row);
    else eventsByLoan.set(event.loan_id, [row]);
  }

  const borrowerOptions = (borrowerData ?? []).map((option) => ({
    id: option.staff_profile_id,
    displayName: option.display_name,
    staffCode: option.staff_code,
  }));
  // Tên người mượn đi qua RLS của `staff_profiles`, mà `app.can_access_staff`
  // chưa có nhánh "cùng Ban" (nợ #13) — một GLV lớp khác vừa được D-94 cho phép
  // mượn sẽ hiện trống. Tra lại từ chính danh sách vừa lấy, không nới thêm quyền.
  const nameByStaffId = new Map(borrowerOptions.map((option) => [option.id, option.displayName]));

  return {
    items: (itemData ?? []).map((item): EquipmentItemRow => ({
      id: item.id,
      assetCode: item.asset_code,
      name: item.name,
      category: item.category,
      totalQuantity: item.total_quantity,
      availableQuantity: item.available_quantity,
      condition: item.condition as EquipmentCondition,
      storageLocation: item.storage_location,
      note: item.note,
      isActive: item.is_active,
    })),
    loans: (loanData ?? []).map((loan): EquipmentLoanRow => ({
      id: loan.id,
      equipmentItemId: loan.equipment_item_id,
      itemName: loan.equipment_items?.name ?? "—",
      quantity: loan.quantity,
      outstandingQuantity: loan.outstanding_quantity,
      restoredQuantity: loan.restored_quantity,
      borrowerName:
        nameByStaffId.get(loan.borrower_staff_id) ?? staffName(loan.staff_profiles),
      borrowedAt: loan.borrowed_at,
      expectedReturnAt: loan.expected_return_at,
      returnedAt: loan.returned_at,
      borrowNote: loan.borrow_note,
      returnNote: loan.return_note,
      conditionOnReturn: loan.condition_on_return as EquipmentCondition | null,
      status: loan.status as EquipmentLoanStatus,
      events: eventsByLoan.get(loan.id) ?? [],
    })),
    borrowerOptions,
    adjustments: (adjustmentData ?? []).map((row): EquipmentStockAdjustmentRow => ({
      id: row.id,
      equipmentItemId: row.equipment_item_id,
      itemName: row.equipment_items?.name ?? "—",
      delta: row.delta,
      reason: row.reason as EquipmentStockAdjustmentReason,
      note: row.note,
      totalAfter: row.total_after,
      createdAt: row.created_at,
    })),
  };
}
