import { z } from "zod";
import { EQUIPMENT_CONDITIONS, EQUIPMENT_STOCK_ADJUSTMENT_REASONS } from "./constants";

export const equipmentItemInputSchema = z.object({
  committeeId: z.string().uuid(),
  assetCode: z.string().trim().min(1, "Vui lòng nhập mã thiết bị.").max(50),
  name: z.string().trim().min(1, "Vui lòng nhập tên thiết bị.").max(200),
  category: z.string().trim().max(100).nullable().optional(),
  totalQuantity: z.coerce.number().int().min(0).max(100000),
  storageLocation: z.string().trim().max(200).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});

export const equipmentItemUpdateSchema = z.object({
  equipmentItemId: z.string().uuid(),
  name: z.string().trim().min(1, "Vui lòng nhập tên thiết bị.").max(200),
  category: z.string().trim().max(100).nullable().optional(),
  condition: z.enum(EQUIPMENT_CONDITIONS),
  storageLocation: z.string().trim().max(200).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean(),
});

export const borrowEquipmentSchema = z.object({
  equipmentItemId: z.string().uuid(),
  quantity: z.coerce.number().int().positive("Số lượng mượn phải lớn hơn 0.").max(100000),
  borrowerStaffId: z.string().uuid("Vui lòng chọn người mượn."),
  expectedReturnAt: z.string().datetime({ offset: true }).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});

export const returnEquipmentSchema = z.object({
  loanId: z.string().uuid(),
  restoredQuantity: z.coerce.number().int().min(0).max(100000),
  condition: z.enum(EQUIPMENT_CONDITIONS).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});

/** M09-B · TB-M09-02 PA A — nhận lại hàng: không bao giờ đụng tổng kho. */
export const receiveEquipmentSchema = z.object({
  loanId: z.string().uuid(),
  quantity: z.coerce.number().int().positive("Số lượng nhận lại phải lớn hơn 0.").max(100000),
  condition: z.enum(EQUIPMENT_CONDITIONS).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});

/**
 * M09-B · TB-M09-02 PA A — báo hỏng/mất: TRỪ tổng kho, không hoàn tác được.
 * Ghi chú BẮT BUỘC (`04_TO_BE_FLOWS.md`); DB kiểm lại bằng
 * `EQUIPMENT_WRITE_OFF_NOTE_REQUIRED` để hai tầng nói cùng một điều.
 */
export const writeOffEquipmentSchema = z.object({
  loanId: z.string().uuid(),
  quantity: z.coerce.number().int().positive("Số lượng hỏng/mất phải lớn hơn 0.").max(100000),
  condition: z.enum(EQUIPMENT_CONDITIONS),
  note: z.string().trim().min(1, "Vui lòng ghi rõ vì sao thiết bị hỏng hoặc mất.").max(1000),
});

/**
 * M09-B · TB-M09-04 — đổi tổng kho ngoài phiếu mượn.
 * `delta` khác 0; chiều giảm bắt buộc có ghi chú (D-98).
 */
export const adjustEquipmentStockSchema = z
  .object({
    equipmentItemId: z.string().uuid(),
    delta: z.coerce
      .number()
      .int()
      .refine((value) => value !== 0, "Số lượng điều chỉnh phải khác 0.")
      .refine((value) => Math.abs(value) <= 100000, "Số lượng điều chỉnh quá lớn."),
    reason: z.enum(EQUIPMENT_STOCK_ADJUSTMENT_REASONS),
    note: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((value) => value.delta > 0 || Boolean(value.note), {
    path: ["note"],
    message: "Giảm tồn kho phải ghi rõ lý do cụ thể.",
  });

export type EquipmentItemInput = z.infer<typeof equipmentItemInputSchema>;
export type EquipmentItemUpdateInput = z.infer<typeof equipmentItemUpdateSchema>;
export type BorrowEquipmentInput = z.infer<typeof borrowEquipmentSchema>;
export type ReturnEquipmentInput = z.infer<typeof returnEquipmentSchema>;
export type ReceiveEquipmentInput = z.infer<typeof receiveEquipmentSchema>;
export type WriteOffEquipmentInput = z.infer<typeof writeOffEquipmentSchema>;
export type AdjustEquipmentStockInput = z.infer<typeof adjustEquipmentStockSchema>;
