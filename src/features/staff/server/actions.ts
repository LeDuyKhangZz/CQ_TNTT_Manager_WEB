"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/permissions/roles";
import {
  assignStaffSchema,
  createStaffSchema,
  endStaffAssignmentSchema,
  updateStaffSchema,
  type AssignStaffInput,
  type CreateStaffInput,
  type UpdateStaffInput,
} from "../schemas";

type StaffActionResult<T = undefined> = { ok: true; data: T } | { ok: false; code: AppErrorCode; message: string };
const STAFF_WRITE_ROLES: readonly AppRole[] = ["super_admin", "group_leader", "deputy_group_leader", "secretary"];

async function requireStaffWrite() {
  const context = await requireAuthContext("/staff");
  if (!context.role || !STAFF_WRITE_ROLES.includes(context.role)) throw new AppError("FORBIDDEN");
  return context;
}

function fail(error: unknown): StaffActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể lưu dữ liệu nhân sự. Vui lòng thử lại." };
}

export async function createStaff(input: CreateStaffInput): Promise<StaffActionResult<{ id: string; staffCode: string }>> {
  try {
    const actor = await requireStaffWrite();
    const parsed = createStaffSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase.from("staff_profiles").insert({
      title: parsed.title,
      saint_name: parsed.saintName || null,
      full_name: parsed.fullName,
      date_of_birth: parsed.dateOfBirth || null,
      phone: parsed.phone,
      email: parsed.email || null,
      address: parsed.address || null,
      formation_level: parsed.formationLevel,
      service_status: parsed.serviceStatus,
      updated_by: actor.profileId,
    }).select("id, staff_code").single();
    if (error || !data) throw new AppError(error?.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR");
    revalidatePath("/staff");
    return { ok: true, data: { id: data.id, staffCode: data.staff_code } };
  } catch (error) { return fail(error); }
}

export async function updateStaff(input: UpdateStaffInput): Promise<StaffActionResult> {
  try {
    const actor = await requireStaffWrite();
    const parsed = updateStaffSchema.parse(input);
    const { id, ...changes } = parsed;
    const payload = {
      ...(changes.title !== undefined ? { title: changes.title } : {}),
      ...(changes.saintName !== undefined ? { saint_name: changes.saintName || null } : {}),
      ...(changes.fullName !== undefined ? { full_name: changes.fullName } : {}),
      ...(changes.dateOfBirth !== undefined ? { date_of_birth: changes.dateOfBirth || null } : {}),
      ...(changes.phone !== undefined ? { phone: changes.phone } : {}),
      ...(changes.email !== undefined ? { email: changes.email || null } : {}),
      ...(changes.address !== undefined ? { address: changes.address || null } : {}),
      ...(changes.formationLevel !== undefined ? { formation_level: changes.formationLevel } : {}),
      ...(changes.serviceStatus !== undefined ? { service_status: changes.serviceStatus } : {}),
      updated_by: actor.profileId,
    };
    const supabase = await createClient();
    const { error } = await supabase.from("staff_profiles").update(payload).eq("id", id);
    if (error) throw new AppError("VALIDATION_ERROR");
    revalidatePath("/staff");
    return { ok: true, data: undefined };
  } catch (error) { return fail(error); }
}

export async function assignStaffToClass(input: AssignStaffInput): Promise<StaffActionResult<{ id: string }>> {
  try {
    const actor = await requireStaffWrite();
    const parsed = assignStaffSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase.from("class_staff_assignments").insert({
      staff_profile_id: parsed.staffProfileId,
      class_id: parsed.classId,
      capacity: parsed.capacity,
      starts_on: parsed.startsOn,
      updated_by: actor.profileId,
    }).select("id").single();
    if (error || !data) throw new AppError(error?.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR");
    revalidatePath("/staff");
    revalidatePath("/classes");
    return { ok: true, data: { id: data.id } };
  } catch (error) { return fail(error); }
}

export async function endClassStaffAssignment(assignmentIdInput: string, endsOnInput: string): Promise<StaffActionResult> {
  try {
    await requireStaffWrite();
    const parsed = endStaffAssignmentSchema.parse({ assignmentId: assignmentIdInput, endsOn: endsOnInput });
    const supabase = await createClient();
    const { error } = await supabase.rpc("end_class_staff_assignment", {
      target_assignment_id: parsed.assignmentId,
      target_ends_on: parsed.endsOn,
    });
    if (error) throw new AppError(error.code === "P0002" ? "RESOURCE_NOT_FOUND" : "VALIDATION_ERROR");
    revalidatePath("/staff");
    revalidatePath("/classes");
    return { ok: true, data: undefined };
  } catch (error) { return fail(error); }
}

export async function createStaffFromForm(formData: FormData): Promise<void> {
  await createStaff({
    title: String(formData.get("title")),
    saintName: String(formData.get("saintName") ?? "") || null,
    fullName: String(formData.get("fullName") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? "") || null,
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? "") || null,
    address: String(formData.get("address") ?? "") || null,
    formationLevel: String(formData.get("formationLevel")),
    serviceStatus: "active",
  } as CreateStaffInput);
}

export async function assignStaffFromForm(formData: FormData): Promise<void> {
  await assignStaffToClass({
    staffProfileId: String(formData.get("staffProfileId") ?? ""),
    classId: String(formData.get("classId") ?? ""),
    capacity: String(formData.get("capacity")),
    startsOn: String(formData.get("startsOn") ?? ""),
  } as AssignStaffInput);
}

export async function endStaffAssignmentFromForm(formData: FormData): Promise<void> {
  await endClassStaffAssignment(String(formData.get("assignmentId") ?? ""), String(formData.get("endsOn") ?? ""));
}
