"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { isAcademicYearWritable } from "@/features/academic-years/year-lifecycle";
import { requireRouteAccess } from "@/lib/auth/guards";
import type { AuthContext } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";
import {
  classifyTeachingPlanDbError,
  describeZodIssues,
  TEACHING_PLAN_CLOSED_YEAR_MESSAGE,
} from "../db-errors";
import { checkTeachingMaterialFile } from "../material-limits";
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
import { canManageTeachingClass, canReadTeachingClass } from "./permissions";
import { TEACHING_MATERIAL_BUCKET } from "../constants";

export type TeachingPlanActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: AppErrorCode;
      message: string;
      /**
       * D-146 — lượt lưu bị từ chối **vì bản đang giữ đã cũ**, chứ không vì
       * quyền hay dữ liệu sai.
       *
       * Cần một cờ riêng chứ không so `code === "CONFLICT"`: mã ấy còn dùng cho
       * "ngày này đã có một mục" và cho nhánh mặc định của `failure()`. Chỉ đúng
       * ca này mới hiện nút *"Tải lại mục này"* — mời tải lại trang khi lỗi là
       * trùng ngày thì tải bao nhiêu lần cũng vẫn hỏng y hệt.
       *
       * Cờ nằm ở **module này**, không thêm mã mới vào `src/lib/errors` dùng
       * chung — tầng ấy `07` §2 để dành làm cùng M07.
       */
      stale?: boolean;
    };

/**
 * 🔴 **`ZodError` không còn bị nuốt** — M06-A / TB-03.
 *
 * Bản cũ chỉ giữ `message` của `AppError`, nên mọi lỗi validation rơi vào câu
 * *"Không thể lưu giáo án. Vui lòng thử lại."* — một câu **hứa rằng thử lại sẽ
 * được**, trong khi bấm lại y hệt thì hỏng y hệt. Câu đúng đã nằm sẵn trong
 * `schemas.ts` từ Phase 4 và chưa từng ra tới màn hình.
 */
function failure(error: unknown): TeachingPlanActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  if (error instanceof z.ZodError) {
    return { ok: false, code: "VALIDATION_ERROR", message: describeZodIssues(error.issues) };
  }
  return { ok: false, code: "CONFLICT", message: "Không thể lưu giáo án. Vui lòng thử lại." };
}

/** Xem `db-errors.ts` — bản cũ gán cứng một câu về "ngày" cho **mọi** `23505`. */
function mapDatabaseError(error: { code?: string; message?: string; details?: string } | null): AppError {
  const { appCode, message } = classifyTeachingPlanDbError(error ?? null);
  return new AppError(appCode, message);
}

function revalidateTeachingPlan(classId: string) {
  revalidatePath("/teaching-plan");
  revalidatePath(`/teaching-plan/${classId}`);
}

/**
 * Nợ #14 / D-96 — guard gọi **NGOÀI `try`**, và bằng `requireRouteAccess`.
 *
 * Hai lỗi cùng lúc ở bản cũ, đúng hình dạng đã trả ở `attendance` (M05-A):
 * (1) `requireAuthContext` chỉ hỏi *"đã đăng nhập chưa"*, nên luật `ROUTE_RULES`
 * của `/teaching-plan` chỉ được thi hành ở tầng trang, không ở tầng action;
 * (2) nó nằm **trong** `try`, mà `redirect()` của Next báo hiệu bằng cách
 * **ném** — nên `catch` nuốt mất, và người vừa hết phiên đăng nhập đọc
 * *"Không thể lưu giáo án. Vui lòng thử lại."* rồi thử lại mãi thay vì được
 * đưa về `/login`.
 *
 * ⚠️ Bài học M12-A: **đọc cả hàm bọc, đừng chỉ grep tên hàm.** Ở module này
 * `requireAuthContext` nằm trong ba hàm bọc `requireManage*`, nên grep tên hàm
 * ở tầng action trả về 0 kết quả cho bốn trong bảy thao tác.
 */
async function teachingPlanRouteContext(pathname = "/teaching-plan") {
  return requireRouteAccess(pathname);
}

/**
 * Nợ #18 — **câu tiếng Việt** cho hàng rào năm học đã đóng.
 *
 * Hàng rào thật nằm ở RLS (`20260805000100`), và nó từ chối bằng cách **lọc dòng
 * trong im lặng**: một lượt UPDATE hợp lệ về cú pháp trả về 0 dòng, không lỗi,
 * không mã. Nếu chỉ dựa vào đó thì người dùng bấm Lưu và **không thấy gì xảy
 * ra**. Chốt chặn ở tầng ứng dụng không thay thế RLS — nó chỉ nói ra lý do.
 *
 * 🔴 Hai ngoại lệ cố ý:
 *   1. **Super Admin đi qua** (D-117) — đúng bằng `app.writable_academic_year_ids()`,
 *      nếu không thì tầng này chặn đúng thứ RLS cho phép.
 *   2. **Không đọc được trạng thái thì KHÔNG chặn.** Đoán "đã đóng" từ một ô
 *      trống là biến một lỗi đọc thành một lời từ chối sai; cứ để RLS trả lời.
 */
function assertWritableYear(context: AuthContext, status: string | null | undefined) {
  if (context.role === "super_admin") return;
  if (status && !isAcademicYearWritable(status)) {
    throw new AppError("FORBIDDEN", TEACHING_PLAN_CLOSED_YEAR_MESSAGE);
  }
}

async function requireManageClass(context: AuthContext, classId: string) {
  const supabase = await createClient();
  if (!(await canManageTeachingClass(context, supabase, classId))) throw new AppError("FORBIDDEN");
  const { data: classRow } = await supabase
    .from("classes")
    .select("academic_year_id, academic_years(status)")
    .eq("id", classId)
    .maybeSingle();
  if (!classRow) throw new AppError("RESOURCE_NOT_FOUND");
  assertWritableYear(context, classRow.academic_years?.status);
  return { supabase, academicYearId: classRow.academic_year_id };
}

async function requireManagePlan(context: AuthContext, planId: string) {
  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("teaching_plans")
    .select("id, class_id, academic_years(status)")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) throw new AppError("RESOURCE_NOT_FOUND");
  if (!(await canManageTeachingClass(context, supabase, plan.class_id))) throw new AppError("FORBIDDEN");
  assertWritableYear(context, plan.academic_years?.status);
  return { supabase, classId: plan.class_id };
}

async function requireManageItem(context: AuthContext, itemId: string) {
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("teaching_plan_items")
    .select("id, teaching_plan_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) throw new AppError("RESOURCE_NOT_FOUND");
  const { data: plan } = await supabase
    .from("teaching_plans")
    .select("class_id, academic_years(status)")
    .eq("id", item.teaching_plan_id)
    .maybeSingle();
  if (!plan) throw new AppError("RESOURCE_NOT_FOUND");
  if (!(await canManageTeachingClass(context, supabase, plan.class_id))) throw new AppError("FORBIDDEN");
  assertWritableYear(context, plan.academic_years?.status);
  return { supabase, classId: plan.class_id, planId: item.teaching_plan_id };
}

export async function ensureTeachingPlan(
  input: EnsureTeachingPlanInput,
): Promise<TeachingPlanActionResult<{ id: string }>> {
  const context = await teachingPlanRouteContext();
  try {
    const parsed = ensureTeachingPlanSchema.parse(input);
    const { supabase, academicYearId } = await requireManageClass(context, parsed.classId);
    const { data: existing } = await supabase
      .from("teaching_plans")
      .select("id")
      .eq("class_id", parsed.classId)
      .maybeSingle();
    if (existing) return { ok: true, data: { id: existing.id } };

    const { data, error } = await supabase
      .from("teaching_plans")
      .insert({
        class_id: parsed.classId,
        academic_year_id: academicYearId,
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
  const context = await teachingPlanRouteContext();
  try {
    const parsed = updateTeachingPlanTitleSchema.parse(input);
    const { supabase, classId } = await requireManagePlan(context, parsed.planId);
    // SW-04 — đếm dòng thật sự đổi. Từ M06-B cả hai policy ghi của bảng này đều
    // có thể **lọc dòng trong im lặng** (D-144 siết vai trò, nợ #18 chặn năm đã
    // đóng); không `.select()` thì lượt lưu bị RLS chặn vẫn báo thành công.
    const { data: renamed, error } = await supabase
      .from("teaching_plans")
      .update({ title: parsed.title, updated_by: context.profileId })
      .eq("id", parsed.planId)
      .select("id");
    if (error) throw mapDatabaseError(error);
    if (!renamed || renamed.length === 0) {
      throw new AppError("FORBIDDEN", TEACHING_PLAN_CLOSED_YEAR_MESSAGE);
    }
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
  const context = await teachingPlanRouteContext();
  try {
    const parsed = teachingPlanItemInputSchema.parse(input);
    const { supabase, classId } = await requireManagePlan(context, parsed.teachingPlanId);
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
  const context = await teachingPlanRouteContext();
  try {
    const parsed = updateTeachingPlanItemSchema.parse(input);
    const { supabase, classId, planId } = await requireManageItem(context, parsed.itemId);
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
    /**
     * 🔴 **D-146 / TB-M06-01 / BR-M06-13 — chống ghi đè mù.**
     *
     * Bản cũ ghi đè cả 12 trường **chỉ theo `id`**. Hai Giáo lý viên cùng mở một
     * mục thì người lưu sau xoá sạch thay đổi của người lưu trước: không cảnh
     * báo, và **không có cách nào lấy lại** — `teaching_plan_items` không có bảng
     * lịch sử (chủ dự án đã cân nhắc và loại phương án B: thêm bảng revisions).
     *
     * Điều kiện `updated_at = <phiên bản client đang giữ>` biến lượt ghi thành
     * một phép so-rồi-đổi nguyên tử ở tầng cơ sở dữ liệu. Trigger
     * `teaching_plan_items_set_updated_at` đẩy mốc này sau **mỗi** lượt sửa, nên
     * người thứ hai không khớp và không ghi được dòng nào.
     */
    const { data: updated, error } = await supabase
      .from("teaching_plan_items")
      .update(payload)
      .eq("id", parsed.itemId)
      .eq("updated_at", parsed.expectedUpdatedAt)
      .select("id");
    if (error) throw mapDatabaseError(error);
    /**
     * 🔴 **0 dòng có BA nguyên nhân, và nói sai nguyên nhân còn tệ hơn im lặng.**
     *
     * Một câu *"người khác vừa cập nhật"* dán cho mọi ca sẽ bảo người dùng đi
     * tải lại trang — vô ích khi sự thật là năm học đã đóng hoặc mục vừa bị xoá.
     * Nên phải đọc lại rồi mới trả lời:
     *
     *   · không còn dòng nào  ⇒ mục đã bị xoá;
     *   · `updated_at` đã khác ⇒ đúng là có người lưu trước mình (D-146);
     *   · `updated_at` **vẫn khớp** ⇒ phiên bản không phải thủ phạm. Chính RLS
     *     lọc dòng trong im lặng — hàng rào năm học (nợ #18) hoặc quyền vừa đổi
     *     (D-144). Chốt chặn phía trên đã bắt phần lớn ca này; nhánh đây là lưới
     *     cuối cho lúc hai tầng lệch nhau.
     */
    if (!updated || updated.length === 0) {
      const { data: current } = await supabase
        .from("teaching_plan_items")
        .select("updated_at")
        .eq("id", parsed.itemId)
        .maybeSingle();
      if (!current) throw new AppError("RESOURCE_NOT_FOUND", "Mục giáo án này đã bị xóa.");
      if (current.updated_at !== parsed.expectedUpdatedAt) {
        return {
          ok: false,
          code: "CONFLICT",
          stale: true,
          message:
            "Mục này vừa được người khác cập nhật. Hãy chép lại phần bạn đang gõ, " +
            "bấm “Tải lại mục này” để xem bản mới nhất, rồi nhập lại — lưu đè bây " +
            "giờ sẽ xóa mất công của họ.",
        };
      }
      throw new AppError("FORBIDDEN", TEACHING_PLAN_CLOSED_YEAR_MESSAGE);
    }
    revalidateTeachingPlan(classId);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteTeachingPlanItem(itemId: string): Promise<TeachingPlanActionResult> {
  const context = await teachingPlanRouteContext();
  try {
    const parsed = teachingPlanItemIdSchema.parse(itemId);
    const { supabase, classId } = await requireManageItem(context, parsed);
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
  const context = await teachingPlanRouteContext();
  try {
    const itemId = teachingPlanItemIdSchema.parse(formData.get("itemId"));
    const file = formData.get("file");
    if (!(file instanceof File)) throw new AppError("VALIDATION_ERROR", "Chưa chọn tệp nào.");
    // Cùng một hàm với biểu mẫu phía trình duyệt ⇒ hai phía không thể lệch câu
    // chữ lẫn con số. Kiểm ở đây mới là hàng rào (AGENTS.md §5).
    const rejected = checkTeachingMaterialFile(file);
    if (rejected) throw new AppError("VALIDATION_ERROR", rejected);
    const originalName = file.name.trim().slice(0, 255);

    const { supabase, classId } = await requireManageItem(context, itemId);
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
  const context = await teachingPlanRouteContext();
  try {
    const parsed = teachingPlanItemIdSchema.parse(itemId);
    const { supabase, classId } = await requireManageItem(context, parsed);
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
  const context = await teachingPlanRouteContext();
  try {
    const parsed = teachingPlanItemIdSchema.parse(itemId);
    const supabase = await createClient();
    const { data: item } = await supabase
      .from("teaching_plan_items")
      .select("material_path, material_name, teaching_plans(class_id)")
      .eq("id", parsed)
      .maybeSingle();
    if (!item?.material_path || !item.material_name) throw new AppError("RESOURCE_NOT_FOUND");

    // TB-M06-04 / TB-06 — kiểm quyền tường minh **trước khi** chạm Storage API.
    // Đây là action duy nhất của module từng dựa hoàn toàn vào RLS (`docs/11` §7).
    const classId = item.teaching_plans?.class_id;
    if (!classId) throw new AppError("RESOURCE_NOT_FOUND");
    if (!(await canReadTeachingClass(context, supabase, classId))) throw new AppError("FORBIDDEN");

    const { data, error } = await supabase.storage
      .from(TEACHING_MATERIAL_BUCKET)
      .createSignedUrl(item.material_path, 60, { download: item.material_name });
    if (error || !data?.signedUrl) throw new AppError("FORBIDDEN");
    return { ok: true, data: { url: data.signedUrl, name: item.material_name } };
  } catch (error) {
    return failure(error);
  }
}
