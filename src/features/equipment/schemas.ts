import { z } from "zod";
import { EQUIPMENT_CONDITIONS } from "./constants";

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

export type EquipmentItemInput = z.infer<typeof equipmentItemInputSchema>;
export type EquipmentItemUpdateInput = z.infer<typeof equipmentItemUpdateSchema>;
export type BorrowEquipmentInput = z.infer<typeof borrowEquipmentSchema>;
export type ReturnEquipmentInput = z.infer<typeof returnEquipmentSchema>;
