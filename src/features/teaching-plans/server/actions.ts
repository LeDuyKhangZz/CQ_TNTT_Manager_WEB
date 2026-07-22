"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  ensureTeachingPlanSchema,
  teachingPlanItemIdSchema,
  teachingPlanItemInputSchema,
  updateTeachingPlanItemSchema,
  updateTeachingPlanTitleSchema,
  type EnsureTeachingPlanInput,
  type TeachingPlanItemInput,
  type UpdateTeachingPlanItemInput,
  type UpdateTeachingPlanTitleInput,
} from "../schemas";
import { canManageTeachingClass } from "./permissions";
import {
  TEACHING_MATERIAL_ACCEPT,
  TEACHING_MATERIAL_BUCKET,
  TEACHING_MATERIAL_MAX_BYTES,
} from "../constants";

export type TeachingPlanActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function failure(error: unknown): TeachingPlanActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể lưu giáo án. Vui lòng thử lại." };
}

function mapDatabaseError(error: { code?: string; message?: string } | null): AppError {
  if (error?.code === "42501") return new AppError("FORBIDDEN");
  if (error?.code === "23505") return new AppError("CONFLICT", "Ngày này đã có một mục giáo án.");
  if (error?.code === "23503") return new AppError("RESOURCE_NOT_FOUND");
  return new AppError("VALIDATION_ERROR");
}

function revalidateTeachingPlan(classId: string) {
  revalidatePath("/teaching-plan");
  revalidatePath(`/teaching-plan/${classId}`);
}

async function requireManageClass(classId: string) {
  const context = await requireAuthContext(`/teaching-plan/${classId}`);
  const supabase = await createClient();
  if (!(await canManageTeachingClass(context, supabase, classId))) throw new AppError("FORBIDDEN");
  return { context, supabase };
}

async function requireManagePlan(planId: string) {
  const context = await requireAuthContext("/teaching-plan");
  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("teaching_plans")
    .select("id, class_id")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) throw new AppError("RESOURCE_NOT_FOUND");
  if (!(await canManageTeachingClass(context, supabase, plan.class_id))) throw new AppError("FORBIDDEN");
  return { context, supabase, classId: plan.class_id };
}

async function requireManageItem(itemId: string) {
  const context = await requireAuthContext("/teaching-plan");
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("teaching_plan_items")
    .select("id, teaching_plan_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) throw new AppError("RESOURCE_NOT_FOUND");
  const { data: plan } = await supabase
    .from("teaching_plans")
    .select("class_id")
    .eq("id", item.teaching_plan_id)
    .maybeSingle();
  if (!plan) throw new AppError("RESOURCE_NOT_FOUND");
  if (!(await canManageTeachingClass(context, supabase, plan.class_id))) throw new AppError("FORBIDDEN");
  return { context, supabase, classId: plan.class_id, planId: item.teaching_plan_id };
}

export async function ensureTeachingPlan(
  input: EnsureTeachingPlanInput,
): Promise<TeachingPlanActionResult<{ id: string }>> {
  try {
    const parsed = ensureTeachingPlanSchema.parse(input);
    const { context, supabase } = await requireManageClass(parsed.classId);
    const { data: existing } = await supabase
      .from("teaching_plans")
      .select("id")
      .eq("class_id", parsed.classId)
      .maybeSingle();
    if (existing) return { ok: true, data: { id: existing.id } };

    const { data: classRow } = await supabase
      .from("classes")
      .select("academic_year_id")
      .eq("id", parsed.classId)
      .maybeSingle();
    if (!classRow) throw new AppError("RESOURCE_NOT_FOUND");

    const { data, error } = await supabase
      .from("teaching_plans")
      .insert({
        class_id: parsed.classId,
        academic_year_id: classRow.academic_year_id,
        title: parsed.title,
        updated_by: context.profileId,
      })
      .select("id")
      .single();
    if (error || !data) throw mapDatabaseError(error);
    revalidateTeachingPlan(parsed.classId);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function updateTeachingPlanTitle(
  input: UpdateTeachingPlanTitleInput,
): Promise<TeachingPlanActionResult> {
  try {
    const parsed = updateTeachingPlanTitleSchema.parse(input);
    const { context, supabase, classId } = await requireManagePlan(parsed.planId);
    const { error } = await supabase
      .from("teaching_plans")
      .update({ title: parsed.title, updated_by: context.profileId })
      .eq("id", parsed.planId);
    if (error) throw mapDatabaseError(error);
    revalidateTeachingPlan(classId);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

function itemPayload(input: z.infer<typeof teachingPlanItemInputSchema>, profileId: string) {
  return {
    teaching_plan_id: input.teachingPlanId,
    planned_date: input.plannedDate,
    title: input.title,
    objectives: input.objectives ?? null,
    catechism_content: input.catechismContent ?? null,
    scripture_content: input.scriptureContent ?? null,
    game: input.game ?? null,
    song: input.song ?? null,
    homework: input.homework ?? null,
    preparation: input.preparation ?? null,
    teacher_staff_id: input.teacherStaffId ?? null,
    item_type: input.itemType,
    note: input.note ?? null,
    updated_by: profileId,
  };
}

export async function createTeachingPlanItem(
  input: TeachingPlanItemInput,
): Promise<TeachingPlanActionResult<{ id: string }>> {
  try {
    const parsed = teachingPlanItemInputSchema.parse(input);
    const { context, supabase, classId } = await requireManagePlan(parsed.teachingPlanId);
    const { data, error } = await supabase
      .from("teaching_plan_items")
      .insert(itemPayload(parsed, context.profileId))
      .select("id")
      .single();
    if (error || !data) throw mapDatabaseError(error);
    revalidateTeachingPlan(classId);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function updateTeachingPlanItem(
  input: UpdateTeachingPlanItemInput,
): Promise<TeachingPlanActionResult> {
  try {
    const parsed = updateTeachingPlanItemSchema.parse(input);
    const { context, supabase, classId, planId } = await requireManageItem(parsed.itemId);
    if (planId !== parsed.teachingPlanId) throw new AppError("VALIDATION_ERROR");
    const mapped = itemPayload(parsed, context.profileId);
    const payload = {
      planned_date: mapped.planned_date,
      title: mapped.title,
      objectives: mapped.objectives,
      catechism_content: mapped.catechism_content,
      scripture_content: mapped.scripture_content,
      game: mapped.game,
      song: mapped.song,
      homework: mapped.homework,
      preparation: mapped.preparation,
      teacher_staff_id: mapped.teacher_staff_id,
      item_type: mapped.item_type,
      note: mapped.note,
      updated_by: mapped.updated_by,
    };
    const { error } = await supabase
      .from("teaching_plan_items")
      .update(payload)
      .eq("id", parsed.itemId);
    if (error) throw mapDatabaseError(error);
    revalidateTeachingPlan(classId);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteTeachingPlanItem(itemId: string): Promise<TeachingPlanActionResult> {
  try {
    const parsed = teachingPlanItemIdSchema.parse(itemId);
    const { supabase, classId } = await requireManageItem(parsed);
    const { data: item } = await supabase
      .from("teaching_plan_items")
      .select("material_path")
      .eq("id", parsed)
      .maybeSingle();
    if (item?.material_path) {
      const { error: storageError } = await supabase.storage
        .from(TEACHING_MATERIAL_BUCKET)
        .remove([item.material_path]);
      if (storageError) throw new AppError("CONFLICT", "Không thể dọn tài liệu trước khi xóa mục giáo án.");
    }
    const { error } = await supabase.from("teaching_plan_items").delete().eq("id", parsed);
    if (error) throw mapDatabaseError(error);
    revalidateTeachingPlan(classId);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

function safeStorageName(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-120);
  return normalized || "tai-lieu";
}

export async function uploadTeachingMaterial(formData: FormData): Promise<TeachingPlanActionResult> {
  try {
    const itemId = teachingPlanItemIdSchema.parse(formData.get("itemId"));
    const file = formData.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > TEACHING_MATERIAL_MAX_BYTES) {
      throw new AppError("VALIDATION_ERROR", "Tệp phải có dung lượng từ 1 byte đến 5 MB.");
    }
    if (!TEACHING_MATERIAL_ACCEPT.includes(file.type as (typeof TEACHING_MATERIAL_ACCEPT)[number])) {
      throw new AppError("VALIDATION_ERROR", "Chỉ nhận PDF, Office, ảnh hoặc tệp văn bản.");
    }
    const originalName = file.name.trim().slice(0, 255);
    if (!originalName) throw new AppError("VALIDATION_ERROR");

    const { context, supabase, classId } = await requireManageItem(itemId);
    const { data: current } = await supabase
      .from("teaching_plan_items")
      .select("material_path")
      .eq("id", itemId)
      .maybeSingle();
    const path = `${classId}/${itemId}/${randomUUID()}-${safeStorageName(originalName)}`;
    const { error: uploadError } = await supabase.storage
      .from(TEACHING_MATERIAL_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
    if (uploadError) throw new AppError("CONFLICT", "Không thể tải tệp lên kho riêng tư.");

    const { error: updateError } = await supabase
      .from("teaching_plan_items")
      .update({
        material_path: path,
        material_name: originalName,
        material_mime_type: file.type,
        material_size: file.size,
        updated_by: context.profileId,
      })
      .eq("id", itemId);
    if (updateError) {
      await supabase.storage.from(TEACHING_MATERIAL_BUCKET).remove([path]);
      throw mapDatabaseError(updateError);
    }
    if (current?.material_path && current.material_path !== path) {
      await supabase.storage.from(TEACHING_MATERIAL_BUCKET).remove([current.material_path]);
    }
    revalidateTeachingPlan(classId);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function removeTeachingMaterial(itemId: string): Promise<TeachingPlanActionResult> {
  try {
    const parsed = teachingPlanItemIdSchema.parse(itemId);
    const { context, supabase, classId } = await requireManageItem(parsed);
    const { data: item } = await supabase
      .from("teaching_plan_items")
      .select("material_path")
      .eq("id", parsed)
      .maybeSingle();
    if (!item?.material_path) return { ok: true, data: undefined };
    const { error } = await supabase
      .from("teaching_plan_items")
      .update({
        material_path: null,
        material_name: null,
        material_mime_type: null,
        material_size: null,
        updated_by: context.profileId,
      })
      .eq("id", parsed);
    if (error) throw mapDatabaseError(error);
    await supabase.storage.from(TEACHING_MATERIAL_BUCKET).remove([item.material_path]);
    revalidateTeachingPlan(classId);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function createTeachingMaterialUrl(
  itemId: string,
): Promise<TeachingPlanActionResult<{ url: string; name: string }>> {
  try {
    const parsed = teachingPlanItemIdSchema.parse(itemId);
    await requireAuthContext("/teaching-plan");
    const supabase = await createClient();
    const { data: item } = await supabase
      .from("teaching_plan_items")
      .select("material_path, material_name")
      .eq("id", parsed)
      .maybeSingle();
    if (!item?.material_path || !item.material_name) throw new AppError("RESOURCE_NOT_FOUND");
    const { data, error } = await supabase.storage
      .from(TEACHING_MATERIAL_BUCKET)
      .createSignedUrl(item.material_path, 60, { download: item.material_name });
    if (error || !data?.signedUrl) throw new AppError("FORBIDDEN");
    return { ok: true, data: { url: data.signedUrl, name: item.material_name } };
  } catch (error) {
    return failure(error);
  }
}
