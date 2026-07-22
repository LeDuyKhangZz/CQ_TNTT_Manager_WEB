"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  endEnrollmentSchema,
  enrollStudentSchema,
  type EndEnrollmentInput,
  type EnrollStudentInput,
} from "../schemas";
import { ENROLLMENT_WRITE_ROLES } from "../permissions";

type EnrollmentResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function fail(error: unknown): EnrollmentResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể lưu ghi danh. Vui lòng thử lại." };
}

async function requireEnrollmentWrite() {
  const context = await requireAuthContext("/classes");
  if (!context.role || !ENROLLMENT_WRITE_ROLES.includes(context.role)) throw new AppError("FORBIDDEN");
  return context;
}

export async function enrollStudent(input: EnrollStudentInput): Promise<EnrollmentResult<{ id: string }>> {
  try {
    const actor = await requireEnrollmentWrite();
    const parsed = enrollStudentSchema.parse(input);
    const supabase = await createClient();

    const { data: classRow, error: classError } = await supabase
      .from("classes")
      .select("id, academic_year_id, status")
      .eq("id", parsed.classId)
      .maybeSingle();
    if (classError || !classRow) throw new AppError("RESOURCE_NOT_FOUND");
    if (classRow.status !== "active") throw new AppError("VALIDATION_ERROR");

    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        student_id: parsed.studentId,
        class_id: parsed.classId,
        academic_year_id: classRow.academic_year_id,
        enrolled_on: parsed.enrolledOn,
        notes: parsed.notes,
        updated_by: actor.profileId,
      })
      .select("id")
      .single();
    if (error || !data) {
      if (error?.code === "23505") throw new AppError("DUPLICATE_ENROLLMENT");
      if (error?.code === "42501") throw new AppError("FORBIDDEN");
      throw new AppError("VALIDATION_ERROR");
    }
    revalidatePath("/classes");
    revalidatePath(`/classes/${parsed.classId}`);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function endEnrollment(input: EndEnrollmentInput): Promise<EnrollmentResult> {
  try {
    const actor = await requireEnrollmentWrite();
    const parsed = endEnrollmentSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase
      .from("enrollments")
      .update({ status: parsed.status, ended_on: parsed.endedOn, updated_by: actor.profileId })
      .eq("id", parsed.enrollmentId);
    if (error) throw new AppError(error.code === "42501" ? "FORBIDDEN" : "VALIDATION_ERROR");
    revalidatePath("/classes");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

export async function enrollStudentFromForm(formData: FormData): Promise<void> {
  await enrollStudent({
    studentId: String(formData.get("studentId") ?? ""),
    classId: String(formData.get("classId") ?? ""),
    enrolledOn: String(formData.get("enrolledOn") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  } as unknown as EnrollStudentInput);
}

export async function endEnrollmentFromForm(formData: FormData): Promise<void> {
  await endEnrollment({
    enrollmentId: String(formData.get("enrollmentId") ?? ""),
    status: String(formData.get("status") ?? "withdrawn"),
    endedOn: String(formData.get("endedOn") ?? ""),
  } as unknown as EndEnrollmentInput);
}
