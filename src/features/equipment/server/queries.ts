import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EquipmentCondition, EquipmentLoanStatus } from "../constants";

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

export interface EquipmentLoanRow {
  id: string;
  equipmentItemId: string;
  itemName: string;
  quantity: number;
  borrowerName: string;
  borrowedAt: string;
  expectedReturnAt: string | null;
  returnedAt: string | null;
  restoredQuantity: number | null;
  borrowNote: string | null;
  returnNote: string | null;
  conditionOnReturn: EquipmentCondition | null;
  status: EquipmentLoanStatus;
}

export interface EquipmentBoardData {
  items: EquipmentItemRow[];
  loans: EquipmentLoanRow[];
  borrowerOptions: Array<{ id: string; displayName: string }>;
}

function staffName(staff: { saint_name: string | null; full_name: string } | null): string {
  if (!staff) return "—";
  return `${staff.saint_name ?? ""} ${staff.full_name}`.trim();
}

export async function getEquipmentBoard(committeeId: string): Promise<EquipmentBoardData> {
  const supabase = await createClient();
  const [{ data: itemData }, { data: loanData }, { data: memberData }] = await Promise.all([
    supabase
      .from("equipment_items")
      .select("*")
      .eq("committee_id", committeeId)
      .order("name"),
    supabase
      .from("equipment_loans")
      .select("*, equipment_items(name), staff_profiles(saint_name, full_name)")
      .eq("committee_id", committeeId)
      .order("borrowed_at", { ascending: false })
      .limit(50),
    supabase
      .from("committee_memberships")
      .select("staff_profile_id, staff_profiles(saint_name, full_name)")
      .eq("committee_id", committeeId)
      .eq("is_active", true),
  ]);

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
      borrowerName: staffName(loan.staff_profiles),
      borrowedAt: loan.borrowed_at,
      expectedReturnAt: loan.expected_return_at,
      returnedAt: loan.returned_at,
      restoredQuantity: loan.restored_quantity,
      borrowNote: loan.borrow_note,
      returnNote: loan.return_note,
      conditionOnReturn: loan.condition_on_return as EquipmentCondition | null,
      status: loan.status as EquipmentLoanStatus,
    })),
    borrowerOptions: (memberData ?? []).map((member) => ({
      id: member.staff_profile_id,
      displayName: staffName(member.staff_profiles),
    })),
  };
}
