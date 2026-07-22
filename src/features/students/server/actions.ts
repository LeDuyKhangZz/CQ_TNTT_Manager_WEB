"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { requireStudentWrite } from "./permissions";
import {
  createSacramentSchema,
  createStudentSchema,
  healthProfileSchema,
  updateStudentSchema,
  type CreateSacramentInput,
  type CreateStudentInput,
  type HealthProfileInput,
  type UpdateStudentInput,
} from "../schemas";

type StudentActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function fail(error: unknown): StudentActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể lưu dữ liệu thiếu nhi. Vui lòng thử lại." };
}

export async function createStudent(
  input: CreateStudentInput,
): Promise<StudentActionResult<{ id: string; studentCode: string }>> {
  try {
    const actor = await requireStudentWrite();
    const parsed = createStudentSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("students")
      .insert({
        guardian_id: parsed.guardianId,
        saint_name: parsed.saintName,
        full_name: parsed.fullName,
        gender: parsed.gender,
        date_of_birth: parsed.dateOfBirth,
        patron_feast_date: parsed.patronFeastDate,
        address: parsed.address,
        phone: parsed.phone,
        hardship_flag: parsed.hardshipFlag,
        general_notes: parsed.generalNotes,
        status: parsed.status,
        updated_by: actor.profileId,
      })
      .select("id, student_code")
      .single();
    if (error || !data) throw new AppError(error?.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR");
    revalidatePath("/students");
    return { ok: true, data: { id: data.id, studentCode: data.student_code } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateStudent(input: UpdateStudentInput): Promise<StudentActionResult> {
  try {
    const actor = await requireStudentWrite();
    const parsed = updateStudentSchema.parse(input);
    const { id, ...changes } = parsed;
    const payload = {
      ...(changes.guardianId !== undefined ? { guardian_id: changes.guardianId } : {}),
      ...(changes.saintName !== undefined ? { saint_name: changes.saintName } : {}),
      ...(changes.fullName !== undefined ? { full_name: changes.fullName } : {}),
      ...(changes.gender !== undefined ? { gender: changes.gender } : {}),
      ...(changes.dateOfBirth !== undefined ? { date_of_birth: changes.dateOfBirth } : {}),
      ...(changes.patronFeastDate !== undefined ? { patron_feast_date: changes.patronFeastDate } : {}),
      ...(changes.address !== undefined ? { address: changes.address } : {}),
      ...(changes.phone !== undefined ? { phone: changes.phone } : {}),
      ...(changes.hardshipFlag !== undefined ? { hardship_flag: changes.hardshipFlag } : {}),
      ...(changes.generalNotes !== undefined ? { general_notes: changes.generalNotes } : {}),
      ...(changes.status !== undefined ? { status: changes.status } : {}),
      updated_by: actor.profileId,
    };
    const supabase = await createClient();
    const { error } = await supabase.from("students").update(payload).eq("id", id);
    if (error) throw new AppError("VALIDATION_ERROR");
    revalidatePath("/students");
    revalidatePath(`/students/${id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

export async function saveHealthProfile(input: HealthProfileInput): Promise<StudentActionResult> {
  try {
    const actor = await requireStudentWrite();
    const parsed = healthProfileSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase
      .from("student_health_profiles")
      .upsert(
        {
          student_id: parsed.studentId,
          allergies: parsed.allergies,
          medical_conditions: parsed.medicalConditions,
          medications: parsed.medications,
          emergency_notes: parsed.emergencyNotes,
          updated_by: actor.profileId,
        },
        { onConflict: "student_id" },
      );
    if (error) throw new AppError("VALIDATION_ERROR");
    revalidatePath(`/students/${parsed.studentId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

export async function createSacrament(input: CreateSacramentInput): Promise<StudentActionResult> {
  try {
    const actor = await requireStudentWrite();
    const parsed = createSacramentSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.from("student_sacraments").insert({
      student_id: parsed.studentId,
      sacrament_type: parsed.sacramentType,
      sacrament_name: parsed.sacramentName,
      sacrament_date: parsed.sacramentDate,
      place: parsed.place,
      registry_number: parsed.registryNumber,
      godparent_name: parsed.godparentName,
      notes: parsed.notes,
      updated_by: actor.profileId,
    });
    if (error) throw new AppError(error.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR");
    revalidatePath(`/students/${parsed.studentId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

// --- FormData adapters for progressive-enhancement forms -------------------
export async function createStudentFromForm(formData: FormData): Promise<void> {
  await createStudent({
    guardianId: String(formData.get("guardianId") ?? ""),
    saintName: String(formData.get("saintName") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    gender: String(formData.get("gender") ?? "male"),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    patronFeastDate: String(formData.get("patronFeastDate") ?? ""),
    address: String(formData.get("address") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    hardshipFlag: formData.get("hardshipFlag") === "on",
    generalNotes: String(formData.get("generalNotes") ?? ""),
    status: "active",
  } as unknown as CreateStudentInput);
}

export async function updateStudentFromForm(formData: FormData): Promise<void> {
  await updateStudent({
    id: String(formData.get("id") ?? ""),
    saintName: String(formData.get("saintName") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    gender: String(formData.get("gender") ?? "male"),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    patronFeastDate: String(formData.get("patronFeastDate") ?? ""),
    address: String(formData.get("address") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    hardshipFlag: formData.get("hardshipFlag") === "on",
    generalNotes: String(formData.get("generalNotes") ?? ""),
    status: String(formData.get("status") ?? "active"),
  } as unknown as UpdateStudentInput);
}

export async function saveHealthProfileFromForm(formData: FormData): Promise<void> {
  await saveHealthProfile({
    studentId: String(formData.get("studentId") ?? ""),
    allergies: String(formData.get("allergies") ?? ""),
    medicalConditions: String(formData.get("medicalConditions") ?? ""),
    medications: String(formData.get("medications") ?? ""),
    emergencyNotes: String(formData.get("emergencyNotes") ?? ""),
  } as unknown as HealthProfileInput);
}

export async function createSacramentFromForm(formData: FormData): Promise<void> {
  await createSacrament({
    studentId: String(formData.get("studentId") ?? ""),
    sacramentType: String(formData.get("sacramentType") ?? "baptism"),
    sacramentName: String(formData.get("sacramentName") ?? ""),
    sacramentDate: String(formData.get("sacramentDate") ?? ""),
    place: String(formData.get("place") ?? ""),
    registryNumber: String(formData.get("registryNumber") ?? ""),
    godparentName: String(formData.get("godparentName") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  } as unknown as CreateSacramentInput);
}
