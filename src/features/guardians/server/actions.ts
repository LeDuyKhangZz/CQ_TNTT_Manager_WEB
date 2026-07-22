"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { requireStudentWrite } from "@/features/students/server/permissions";
import {
  createGuardianSchema,
  updateGuardianSchema,
  type CreateGuardianInput,
  type UpdateGuardianInput,
} from "../schemas";

type GuardianActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function fail(error: unknown): GuardianActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể lưu dữ liệu phụ huynh. Vui lòng thử lại." };
}

export async function createGuardian(
  input: CreateGuardianInput,
): Promise<GuardianActionResult<{ id: string }>> {
  try {
    const actor = await requireStudentWrite();
    const parsed = createGuardianSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("guardians")
      .insert({
        full_name: parsed.fullName,
        phone: parsed.phone,
        address: parsed.address,
        status: parsed.status,
        updated_by: actor.profileId,
      })
      .select("id")
      .single();
    if (error || !data) throw new AppError(error?.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR");
    revalidatePath("/students");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateGuardian(input: UpdateGuardianInput): Promise<GuardianActionResult> {
  try {
    const actor = await requireStudentWrite();
    const parsed = updateGuardianSchema.parse(input);
    const { id, ...changes } = parsed;
    const payload = {
      ...(changes.fullName !== undefined ? { full_name: changes.fullName } : {}),
      ...(changes.phone !== undefined ? { phone: changes.phone } : {}),
      ...(changes.address !== undefined ? { address: changes.address } : {}),
      ...(changes.status !== undefined ? { status: changes.status } : {}),
      updated_by: actor.profileId,
    };
    const supabase = await createClient();
    const { error } = await supabase.from("guardians").update(payload).eq("id", id);
    if (error) throw new AppError("VALIDATION_ERROR");
    revalidatePath("/students");
    revalidatePath(`/students`);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

export async function createGuardianFromForm(formData: FormData): Promise<void> {
  await createGuardian({
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    status: "active",
  } as CreateGuardianInput);
}
