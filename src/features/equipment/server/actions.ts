"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  adjustEquipmentStockSchema,
  borrowEquipmentSchema,
  equipmentItemInputSchema,
  equipmentItemUpdateSchema,
  receiveEquipmentSchema,
  returnEquipmentSchema,
  writeOffEquipmentSchema,
  type AdjustEquipmentStockInput,
  type BorrowEquipmentInput,
  type EquipmentItemInput,
  type EquipmentItemUpdateInput,
  type ReceiveEquipmentInput,
  type ReturnEquipmentInput,
  type WriteOffEquipmentInput,
} from "../schemas";

export type EquipmentActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

/**
 * 🔴 Guard gọi NGOÀI `try` (M09-A). `redirect()` của Next báo hiệu bằng cách ném
 * lỗi; để nó rơi vào `catch` là nuốt mất chuyển hướng. `requireRouteAccess` thay
 * `requireAuthContext` để luật `/committees` chỉ dành cho nhân sự được thi hành
 * ở cả tầng action, không chỉ ở tầng trang (BR-M09-62).
 */
async function guardEquipmentAction() {
  return requireRouteAccess("/committees");
}

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
    return new AppError("VALIDATION_ERROR", "Số lượng ghi nhận không được vượt quá số còn nợ.");
  }
  if (message.includes("EQUIPMENT_WRITE_OFF_NOTE_REQUIRED")) {
    return new AppError("VALIDATION_ERROR", "Vui lòng ghi rõ vì sao thiết bị hỏng hoặc mất.");
  }
  if (message.includes("EQUIPMENT_ADJUST_NOTE_REQUIRED")) {
    return new AppError("VALIDATION_ERROR", "Giảm tồn kho phải ghi rõ lý do cụ thể.");
  }
  if (message.includes("EQUIPMENT_ADJUST_INVALID")) {
    return new AppError("VALIDATION_ERROR", "Số lượng điều chỉnh phải khác 0.");
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
  if (message.includes("EQUIPMENT_TOTAL_READONLY")) {
    return new AppError("VALIDATION_ERROR", "Tổng số lượng chỉ thay đổi qua thao tác mượn/trả.");
  }
  if (message.includes("EQUIPMENT_STOCK_MISMATCH")) {
    return new AppError(
      "VALIDATION_ERROR",
      "Thiết bị mới phải có số lượng khả dụng bằng tổng số lượng.",
    );
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
  const context = await guardEquipmentAction();
  try {
    const parsed = equipmentItemInputSchema.parse(input);
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
  const context = await guardEquipmentAction();
  try {
    const parsed = equipmentItemUpdateSchema.parse(input);
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
  await guardEquipmentAction();
  try {
    const parsed = borrowEquipmentSchema.parse(input);
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

/**
 * ⚠️ Luồng CŨ, giữ lại cho tương thích ngược (RPC nay là vỏ bọc của
 * `receive_equipment` + `write_off_equipment`). Giao diện M09-B **không** gọi
 * hàm này nữa: nó gộp "mang về" với "mất vĩnh viễn" vào một con số, đúng cái
 * lỗi mà TB-M09-02 sinh ra để chữa.
 */
export async function returnEquipment(
  input: ReturnEquipmentInput,
): Promise<EquipmentActionResult> {
  await guardEquipmentAction();
  try {
    const parsed = returnEquipmentSchema.parse(input);
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

/** M09-B · AC-M09-25 — nhận lại n cái; phiếu chỉ đóng khi hết nợ. */
export async function receiveEquipment(
  input: ReceiveEquipmentInput,
): Promise<EquipmentActionResult> {
  await guardEquipmentAction();
  try {
    const parsed = receiveEquipmentSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.rpc("receive_equipment", {
      p_loan_id: parsed.loanId,
      p_quantity: parsed.quantity,
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

/** M09-B · AC-M09-26 — báo hỏng/mất: tổng kho giảm, không hoàn tác được. */
export async function writeOffEquipment(
  input: WriteOffEquipmentInput,
): Promise<EquipmentActionResult> {
  await guardEquipmentAction();
  try {
    const parsed = writeOffEquipmentSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.rpc("write_off_equipment", {
      p_loan_id: parsed.loanId,
      p_quantity: parsed.quantity,
      p_condition: parsed.condition,
      p_note: parsed.note,
    });
    if (error) throw mapDatabaseError(error);
    revalidatePath("/committees", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

/** M09-B · AC-M09-29 — đường hợp lệ DUY NHẤT để đổi tổng kho (TB-M09-04). */
export async function adjustEquipmentStock(
  input: AdjustEquipmentStockInput,
): Promise<EquipmentActionResult> {
  await guardEquipmentAction();
  try {
    const parsed = adjustEquipmentStockSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.rpc("adjust_equipment_stock", {
      p_equipment_item_id: parsed.equipmentItemId,
      p_delta: parsed.delta,
      p_reason: parsed.reason,
      p_note: parsed.note ?? undefined,
    });
    // `EQUIPMENT_NOT_ENOUGH` ở đây không phải "mượn quá kho" mà là "giảm quá số
    // đang nằm trong kho" — dùng chung câu chữ là nói sai với người dùng.
    if (error?.message?.includes("EQUIPMENT_NOT_ENOUGH")) {
      throw new AppError(
        "CAPACITY_CONFLICT",
        "Không giảm được quá số lượng đang có trong kho. Phần đang có người mượn phải chờ nhận lại hoặc báo hỏng/mất.",
      );
    }
    if (error) throw mapDatabaseError(error);
    revalidatePath("/committees", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}
