"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  borrowEquipmentSchema,
  equipmentItemInputSchema,
  equipmentItemUpdateSchema,
  returnEquipmentSchema,
  type BorrowEquipmentInput,
  type EquipmentItemInput,
  type EquipmentItemUpdateInput,
  type ReturnEquipmentInput,
} from "../schemas";

export type EquipmentActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function failure(error: unknown): EquipmentActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể xử lý thao tác thiết bị. Vui lòng thử lại." };
}

/** Thông điệp tiếng Việt cho từng lỗi nghiệp vụ mà RPC ném ra (WF-13). */
function mapDatabaseError(error: { code?: string; message?: string } | null): AppError {
  const message = error?.message ?? "";
  if (message.includes("EQUIPMENT_NOT_ENOUGH")) {
    return new AppError("CAPACITY_CONFLICT", "Số lượng khả dụng không đủ để mượn.");
  }
  if (message.includes("EQUIPMENT_QUANTITY_INVALID")) {
    return new AppError("VALIDATION_ERROR", "Số lượng mượn phải lớn hơn 0.");
  }
  if (message.includes("EQUIPMENT_RESTORED_INVALID")) {
    return new AppError("VALIDATION_ERROR", "Số lượng trả không được vượt quá số đã mượn.");
  }
  if (message.includes("EQUIPMENT_ITEM_INACTIVE")) {
    return new AppError("VALIDATION_ERROR", "Thiết bị này đã ngưng sử dụng.");
  }
  if (message.includes("EQUIPMENT_COMMITTEE_INVALID")) {
    return new AppError("VALIDATION_ERROR", "Chỉ Ban Kỹ thuật mới quản lý kho thiết bị.");
  }
  if (message.includes("EQUIPMENT_AVAILABLE_READONLY")) {
    return new AppError("VALIDATION_ERROR", "Số lượng khả dụng chỉ thay đổi qua thao tác mượn/trả.");
  }
  if (error?.code === "42501") return new AppError("FORBIDDEN");
  if (error?.code === "P0002" || error?.code === "23503") return new AppError("RESOURCE_NOT_FOUND");
  if (error?.code === "23505") return new AppError("CONFLICT", "Mã thiết bị này đã tồn tại.");
  if (error?.code === "23514") return new AppError("VALIDATION_ERROR");
  return new AppError("CONFLICT");
}

export async function createEquipmentItem(
  input: EquipmentItemInput,
): Promise<EquipmentActionResult<{ id: string }>> {
  try {
    const parsed = equipmentItemInputSchema.parse(input);
    const context = await requireAuthContext("/committees");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("equipment_items")
      .insert({
        committee_id: parsed.committeeId,
        asset_code: parsed.assetCode,
        name: parsed.name,
        category: parsed.category ?? null,
        total_quantity: parsed.totalQuantity,
        available_quantity: parsed.totalQuantity,
        storage_location: parsed.storageLocation ?? null,
        note: parsed.note ?? null,
        updated_by: context.profileId,
      })
      .select("id")
      .single();
    if (error || !data) throw mapDatabaseError(error);
    revalidatePath(`/committees/${parsed.committeeId}`);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function updateEquipmentItem(
  input: EquipmentItemUpdateInput,
): Promise<EquipmentActionResult> {
  try {
    const parsed = equipmentItemUpdateSchema.parse(input);
    const context = await requireAuthContext("/committees");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("equipment_items")
      .update({
        name: parsed.name,
        category: parsed.category ?? null,
        condition: parsed.condition,
        storage_location: parsed.storageLocation ?? null,
        note: parsed.note ?? null,
        is_active: parsed.isActive,
        updated_by: context.profileId,
      })
      .eq("id", parsed.equipmentItemId)
      .select("committee_id")
      .maybeSingle();
    if (error) throw mapDatabaseError(error);
    if (!data) throw new AppError("FORBIDDEN");
    revalidatePath(`/committees/${data.committee_id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function borrowEquipment(
  input: BorrowEquipmentInput,
): Promise<EquipmentActionResult<{ loanId: string }>> {
  try {
    const parsed = borrowEquipmentSchema.parse(input);
    await requireAuthContext("/committees");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("borrow_equipment", {
      p_equipment_item_id: parsed.equipmentItemId,
      p_quantity: parsed.quantity,
      p_borrower_staff_id: parsed.borrowerStaffId,
      p_expected_return_at: parsed.expectedReturnAt ?? undefined,
      p_note: parsed.note ?? undefined,
    });
    if (error || !data) throw mapDatabaseError(error);
    revalidatePath("/committees", "layout");
    return { ok: true, data: { loanId: data } };
  } catch (error) {
    return failure(error);
  }
}

export async function returnEquipment(
  input: ReturnEquipmentInput,
): Promise<EquipmentActionResult> {
  try {
    const parsed = returnEquipmentSchema.parse(input);
    await requireAuthContext("/committees");
    const supabase = await createClient();
    const { error } = await supabase.rpc("return_equipment", {
      p_loan_id: parsed.loanId,
      p_restored_quantity: parsed.restoredQuantity,
      p_condition: parsed.condition ?? undefined,
      p_note: parsed.note ?? undefined,
    });
    if (error) throw mapDatabaseError(error);
    revalidatePath("/committees", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}
