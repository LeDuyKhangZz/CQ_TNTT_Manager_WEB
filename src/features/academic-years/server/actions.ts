"use server";

import { addYears, format } from "date-fns";
import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  academicYearIdSchema,
  academicYearInputSchema,
  attendanceSettingsSchema,
  updateClassSchema,
  type AcademicYearInput,
  type AttendanceSettingsInput,
  type UpdateClassInput,
} from "../schemas";
import { requireAcademicWrite, requireSetCurrentYear } from "./permissions";

export type AcademicActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function failure(error: unknown): AcademicActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể lưu dữ liệu năm học. Vui lòng thử lại." };
}

export async function createAcademicYear(input: AcademicYearInput): Promise<AcademicActionResult<{ id: string }>> {
  try {
    const actor = await requireAcademicWrite();
    const parsed = academicYearInputSchema.parse(input);
    const supabase = await createClient();
    const retentionUntil = format(addYears(new Date(`${parsed.endDate}T00:00:00Z`), 5), "yyyy-MM-dd");
    const { data, error } = await supabase.from("academic_years").insert({
      code: parsed.code,
      name: parsed.name,
      start_date: parsed.startDate,
      end_date: parsed.endDate,
      retention_until: retentionUntil,
      top5_enabled: parsed.top5Enabled,
      attendance_lock_days: parsed.attendanceLockDays,
      attendance_edit_lease_minutes: parsed.attendanceEditLeaseMinutes,
      status: "draft",
      updated_by: actor.profileId,
    }).select("id").single();
    if (error || !data) throw new AppError(error?.code === "23505" ? "CONFLICT" : "VALIDATION_ERROR");
    revalidatePath("/admin");
    return { ok: true, data: { id: (data as { id: string }).id } };
  } catch (error) {
    return failure(error);
  }
}

export async function setCurrentAcademicYear(input: string): Promise<AcademicActionResult> {
  try {
    await requireSetCurrentYear();
    const academicYearId = academicYearIdSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.rpc("set_current_academic_year", {
      target_academic_year_id: academicYearId,
    });
    if (error) throw new AppError(error.code === "P0002" ? "RESOURCE_NOT_FOUND" : "CONFLICT");
    revalidatePath("/admin");
    revalidatePath("/classes");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function generateDefaultClasses(input: string): Promise<AcademicActionResult<{ inserted: number }>> {
  try {
    await requireAcademicWrite();
    const academicYearId = academicYearIdSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("generate_default_classes", {
      target_academic_year_id: academicYearId,
    });
    if (error) throw new AppError(error.code === "P0002" ? "RESOURCE_NOT_FOUND" : "CONFLICT");
    revalidatePath("/admin");
    revalidatePath("/classes");
    return { ok: true, data: { inserted: data ?? 0 } };
  } catch (error) {
    return failure(error);
  }
}

export async function updateClass(input: UpdateClassInput): Promise<AcademicActionResult> {
  try {
    const actor = await requireAcademicWrite();
    const parsed = updateClassSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.from("classes").update({
      status: parsed.status,
      meeting_location: parsed.meetingLocation || null,
      notes: parsed.notes || null,
      updated_by: actor.profileId,
    }).eq("id", parsed.id);
    if (error) throw new AppError("VALIDATION_ERROR");
    revalidatePath("/admin");
    revalidatePath("/classes");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function updateAttendanceSettings(
  input: AttendanceSettingsInput,
): Promise<AcademicActionResult> {
  try {
    const actor = await requireAcademicWrite();
    const parsed = attendanceSettingsSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase
      .from("academic_years")
      .update({
        attendance_lock_days: parsed.attendanceLockDays,
        attendance_edit_lease_minutes: parsed.attendanceEditLeaseMinutes,
        attendance_warning_consecutive_absences: parsed.warningConsecutiveAbsences,
        attendance_warning_consecutive_sundays: parsed.warningConsecutiveSundays,
        // UI nhập phần trăm cho dễ đọc; DB lưu tỷ lệ 0..1.
        attendance_warning_rate_threshold: parsed.warningRatePercent / 100,
        updated_by: actor.profileId,
      })
      .eq("id", parsed.academicYearId);
    if (error) throw new AppError(error.code === "42501" ? "FORBIDDEN" : "VALIDATION_ERROR");
    revalidatePath("/admin");
    revalidatePath("/attendance");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function updateAttendanceSettingsFromForm(formData: FormData): Promise<void> {
  await updateAttendanceSettings({
    academicYearId: String(formData.get("academicYearId") ?? ""),
    attendanceLockDays: Number(formData.get("attendanceLockDays") ?? 3),
    attendanceEditLeaseMinutes: Number(formData.get("attendanceEditLeaseMinutes") ?? 15),
    warningConsecutiveAbsences: Number(formData.get("warningConsecutiveAbsences") ?? 3),
    warningConsecutiveSundays: Number(formData.get("warningConsecutiveSundays") ?? 3),
    warningRatePercent: Number(formData.get("warningRatePercent") ?? 80),
  });
}

export async function createAcademicYearFromForm(formData: FormData): Promise<void> {
  await createAcademicYear({
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    top5Enabled: formData.get("top5Enabled") === "on",
    attendanceLockDays: Number(formData.get("attendanceLockDays") ?? 3),
    attendanceEditLeaseMinutes: Number(formData.get("attendanceEditLeaseMinutes") ?? 15),
  });
}

export async function setCurrentAcademicYearFromForm(formData: FormData): Promise<void> {
  await setCurrentAcademicYear(String(formData.get("academicYearId") ?? ""));
}

export async function generateDefaultClassesFromForm(formData: FormData): Promise<void> {
  await generateDefaultClasses(String(formData.get("academicYearId") ?? ""));
}
