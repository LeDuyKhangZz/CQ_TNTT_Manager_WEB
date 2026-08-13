"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  committeeAnnouncementInputSchema,
  committeeContentIdSchema,
  committeeInputSchema,
  committeeMeetingInputSchema,
  committeeMembershipEndSchema,
  committeeMembershipInputSchema,
  committeeMembershipPositionSchema,
  committeeUpdateSchema,
  committeeWeeklyPlanInputSchema,
  WEEKLY_PLAN_EMPTY_MESSAGE,
  type CommitteeAnnouncementInput,
  type CommitteeInput,
  type CommitteeMeetingInput,
  type CommitteeMembershipInput,
  type CommitteeMembershipPositionInput,
  type CommitteeUpdateInput,
  type CommitteeWeeklyPlanInput,
} from "../schemas";

export type CommitteeActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * 🔴 Guard gọi NGOÀI `try`. `redirect()` của Next báo hiệu bằng cách **ném lỗi**;
 * gọi nó bên trong `try` thì `catch` nuốt mất tín hiệu chuyển hướng và người
 * dùng nhận một câu lỗi vô nghĩa thay vì được đưa tới `/login` hay
 * `/access-denied`. Đây cũng là lý do mọi action dưới đây tách guard ra trước.
 *
 * `requireRouteAccess` thay cho `requireAuthContext` (BR-M09-62): bản cũ chỉ hỏi
 * "đã đăng nhập chưa", nên `ROUTE_RULES` khai `/committees` chỉ dành cho nhân sự
 * mà luật đó **chưa từng được thi hành ở tầng action** — đúng hình dạng lỗi A-03
 * của M14. RLS vẫn là hàng rào cuối, nhưng hàng rào không được chỉ có một lớp.
 */
async function guardCommitteeAction() {
  return requireRouteAccess("/committees");
}

function failure(error: unknown): CommitteeActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể xử lý yêu cầu. Vui lòng thử lại." };
}

const WEEKLY_PLAN_CONFLICT_MESSAGE =
  "Bản tuần này vừa được người khác cập nhật. Tải lại trang để xem bản mới nhất.";
const WEEKLY_PLAN_APPEARED_MESSAGE =
  "Tuần này vừa có người tạo bản công việc. Tải lại trang để xem bản mới nhất.";
const WEEKLY_PLAN_GONE_MESSAGE = "Bản công việc tuần này vừa bị xóa. Tải lại trang để soạn bản mới.";

function mapDatabaseError(error: { code?: string; message?: string } | null): AppError {
  if (error?.code === "42501") return new AppError("FORBIDDEN");
  if (error?.code === "P0002" || error?.code === "23503") return new AppError("RESOURCE_NOT_FOUND");
  if (error?.message?.includes("COMMITTEE_LIMIT_EXCEEDED")) {
    return new AppError("CAPACITY_CONFLICT", "Mỗi nhân sự chỉ tham gia tối đa hai Ban đang hoạt động.");
  }
  if (error?.message?.includes("COMMITTEE_NOT_ACTIVE")) {
    return new AppError("VALIDATION_ERROR", "Ban này đã ngưng hoạt động.");
  }
  // D-78. Phải đứng TRƯỚC nhánh 23505 chung, nếu không người dùng nhận
  // "Dữ liệu này đã tồn tại." — đúng về kỹ thuật, vô dụng với người đang thao tác.
  if (error?.message?.includes("committee_memberships_one_active_leader_idx")) {
    return new AppError(
      "CONFLICT",
      "Ban này đã có Trưởng ban. Hãy đổi chức vụ của Trưởng ban hiện tại trước khi bổ nhiệm người mới.",
    );
  }
  if (error?.message?.includes("committee_weekly_plan_not_empty")) {
    return new AppError("VALIDATION_ERROR", WEEKLY_PLAN_EMPTY_MESSAGE);
  }
  if (error?.code === "23505") {
    return new AppError("CONFLICT", "Dữ liệu này đã tồn tại.");
  }
  if (error?.code === "23514") {
    return new AppError("VALIDATION_ERROR", "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.");
  }
  return new AppError("CONFLICT");
}

function refreshCommittee(committeeId?: string) {
  revalidatePath("/committees");
  if (committeeId) revalidatePath(`/committees/${committeeId}`);
}

export async function createCommittee(input: CommitteeInput): Promise<CommitteeActionResult<{ id: string }>> {
  const context = await guardCommitteeAction();
  try {
    const parsed = committeeInputSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("committees")
      .insert({
        code: parsed.code,
        name: parsed.name,
        description: parsed.description ?? null,
        updated_by: context.profileId,
      })
      .select("id")
      .single();
    if (error || !data) throw mapDatabaseError(error);
    refreshCommittee();
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}

/**
 * TB-M09-06 — sửa Ban. Dùng policy `committees_update_global_write` (đang bỏ
 * không): chỉ global-write sửa được, RLS là hàng rào cuối. `code` không nằm
 * trong payload nên không đường nào đổi được khoá nghiệp vụ; `manages_equipment`
 * cũng vậy — đổi cờ giữ kho là việc riêng, không lẫn vào form sửa tên.
 */
export async function updateCommittee(input: CommitteeUpdateInput): Promise<CommitteeActionResult> {
  const context = await guardCommitteeAction();
  try {
    const parsed = committeeUpdateSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("committees")
      .update({
        name: parsed.name,
        description: parsed.description ?? null,
        is_active: parsed.isActive,
        sort_order: parsed.sortOrder,
        updated_by: context.profileId,
      })
      .eq("id", parsed.id)
      .select("id")
      .maybeSingle();
    if (error) throw mapDatabaseError(error);
    // Không dòng nào đổi ⇒ RLS chặn (không phải global-write) hoặc Ban không tồn tại.
    if (!data) throw new AppError("FORBIDDEN");
    refreshCommittee(parsed.id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function addCommitteeMember(
  input: CommitteeMembershipInput,
): Promise<CommitteeActionResult<{ id: string }>> {
  const context = await guardCommitteeAction();
  try {
    const parsed = committeeMembershipInputSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("committee_memberships")
      .insert({
        committee_id: parsed.committeeId,
        staff_profile_id: parsed.staffProfileId,
        position: parsed.position,
        updated_by: context.profileId,
      })
      .select("id")
      .single();
    if (error || !data) throw mapDatabaseError(error);
    refreshCommittee(parsed.committeeId);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function updateCommitteeMemberPosition(
  input: CommitteeMembershipPositionInput,
): Promise<CommitteeActionResult> {
  const context = await guardCommitteeAction();
  try {
    const parsed = committeeMembershipPositionSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("committee_memberships")
      .update({ position: parsed.position, updated_by: context.profileId })
      .eq("id", parsed.membershipId)
      .select("committee_id")
      .maybeSingle();
    if (error) throw mapDatabaseError(error);
    if (!data) throw new AppError("FORBIDDEN");
    refreshCommittee(data.committee_id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Không xóa chức vụ: kết thúc nhiệm kỳ để giữ lịch sử (docs/02 §11.2).
 *
 * TB-M09-05: KHÔNG gửi `ends_on`. Trigger `committee_memberships_set_end_date`
 * đặt `ends_on = current_date` bằng đồng hồ của DB — cùng mốc với `starts_on`.
 * Bản cũ gửi ngày UTC tính ở trình duyệt, lệch múi giờ có thể cho ends_on nhỏ
 * hơn starts_on và vi phạm CHECK date_order (23514).
 */
export async function endCommitteeMembership(
  input: { membershipId: string },
): Promise<CommitteeActionResult> {
  const context = await guardCommitteeAction();
  try {
    const parsed = committeeMembershipEndSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("committee_memberships")
      .update({
        is_active: false,
        updated_by: context.profileId,
      })
      .eq("id", parsed.membershipId)
      .select("committee_id")
      .maybeSingle();
    if (error) throw mapDatabaseError(error);
    if (!data) throw new AppError("FORBIDDEN");
    refreshCommittee(data.committee_id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function publishCommitteeAnnouncement(
  input: CommitteeAnnouncementInput,
): Promise<CommitteeActionResult<{ id: string }>> {
  const context = await guardCommitteeAction();
  try {
    const parsed = committeeAnnouncementInputSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("committee_announcements")
      .insert({
        committee_id: parsed.committeeId,
        title: parsed.title,
        content: parsed.content,
        // Trigger ghi đè bằng phiên đăng nhập; gửi lên chỉ để thỏa policy.
        created_by: context.profileId,
      })
      .select("id")
      .single();
    if (error || !data) throw mapDatabaseError(error);
    refreshCommittee(parsed.committeeId);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteCommitteeAnnouncement(
  input: { id: string },
): Promise<CommitteeActionResult> {
  return deleteCommitteeContent("committee_announcements", input);
}

/**
 * TB-M09-06 — có `id` ⇒ sửa buổi họp đang có (policy
 * `committee_meetings_update_leaders`); vắng ⇒ tạo mới. Tách hẳn hai đường thay
 * vì upsert mù: upsert ghi đè cả `created_by`, mất dấu vết người đặt lịch ban đầu.
 */
export async function saveCommitteeMeeting(
  input: CommitteeMeetingInput,
): Promise<CommitteeActionResult<{ id: string }>> {
  const context = await guardCommitteeAction();
  try {
    const parsed = committeeMeetingInputSchema.parse(input);
    const supabase = await createClient();

    if (parsed.id) {
      const { data, error } = await supabase
        .from("committee_meetings")
        .update({
          title: parsed.title,
          starts_at: parsed.startsAt,
          ends_at: parsed.endsAt ?? null,
          location: parsed.location ?? null,
          note: parsed.note ?? null,
          updated_by: context.profileId,
        })
        .eq("id", parsed.id)
        .eq("committee_id", parsed.committeeId)
        .select("id")
        .maybeSingle();
      if (error) throw mapDatabaseError(error);
      // Không dòng nào đổi ⇒ RLS chặn (không phải Trưởng/Phó Ban) hoặc lịch đã bị xóa.
      if (!data) throw new AppError("FORBIDDEN");
      refreshCommittee(parsed.committeeId);
      return { ok: true, data: { id: data.id } };
    }

    const { data, error } = await supabase
      .from("committee_meetings")
      .insert({
        committee_id: parsed.committeeId,
        title: parsed.title,
        starts_at: parsed.startsAt,
        ends_at: parsed.endsAt ?? null,
        location: parsed.location ?? null,
        note: parsed.note ?? null,
        created_by: context.profileId,
      })
      .select("id")
      .single();
    if (error || !data) throw mapDatabaseError(error);
    refreshCommittee(parsed.committeeId);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteCommitteeMeeting(input: { id: string }): Promise<CommitteeActionResult> {
  return deleteCommitteeContent("committee_meetings", input);
}

/**
 * 🔴 TB-M09-01 — vì sao KHÔNG còn `upsert`.
 *
 * Bản cũ gọi `upsert(..., { onConflict: "committee_id,week_start" })` với payload
 * dựng từ một form **luôn mở ra trống**. Hệ quả đo được ở audit F11: mỗi lần bấm
 * Lưu cho một tuần đã có bản là nội dung cũ bị thay bằng rỗng, không cảnh báo,
 * không lịch sử — và `created_by` cũng bị ghi đè thành người bấm gần nhất, nên
 * đến cả dấu vết "ai là người soạn đầu tiên" cũng mất.
 *
 * Đường mới tách hẳn hai việc:
 *  - chưa có bản  → INSERT, `created_by` là người tạo;
 *  - đã có bản    → UPDATE **có so sánh-và-đổi** trên `updated_at`, và không đụng
 *                   tới `created_by`.
 *
 * So sánh nằm ngay trong mệnh đề `WHERE` của câu UPDATE chứ không phải một phép
 * `if` ở tầng ứng dụng: đọc rồi mới ghi là để hở đúng khoảng thời gian mà bài
 * toán "hai người cùng sửa một tuần" cần đóng.
 */
export async function saveCommitteeWeeklyPlan(
  input: CommitteeWeeklyPlanInput,
): Promise<CommitteeActionResult<{ id: string }>> {
  const context = await guardCommitteeAction();
  try {
    const parsed = committeeWeeklyPlanInputSchema.parse(input);
    const supabase = await createClient();

    const { data: existing, error: readError } = await supabase
      .from("committee_weekly_plans")
      .select("id, updated_at")
      .eq("committee_id", parsed.committeeId)
      .eq("week_start", parsed.weekStart)
      .maybeSingle();
    if (readError) throw mapDatabaseError(readError);

    if (!existing) {
      // Form mở ra trên một bản vừa bị người khác xóa: đừng lặng lẽ tạo lại bản
      // mới mang tên người đang bấm, vì họ tưởng mình đang sửa bản của Ban.
      if (parsed.expectedUpdatedAt) {
        throw new AppError("RESOURCE_NOT_FOUND", WEEKLY_PLAN_GONE_MESSAGE);
      }
      const { data, error } = await supabase
        .from("committee_weekly_plans")
        .insert({
          committee_id: parsed.committeeId,
          week_start: parsed.weekStart,
          content: parsed.content ?? null,
          checklist_json: parsed.checklist,
          created_by: context.profileId,
          updated_by: context.profileId,
        })
        .select("id")
        .single();
      if (error || !data) throw mapDatabaseError(error);
      refreshCommittee(parsed.committeeId);
      return { ok: true, data: { id: data.id } };
    }

    // Người dùng mở form khi tuần này còn trống, người khác vừa tạo bản trong lúc
    // đó. Ghi đè ở đây là đúng cái lỗi vừa sửa, chỉ đổi thủ phạm.
    if (!parsed.expectedUpdatedAt) {
      throw new AppError("CONFLICT", WEEKLY_PLAN_APPEARED_MESSAGE);
    }

    const { data: updated, error: updateError } = await supabase
      .from("committee_weekly_plans")
      .update({
        content: parsed.content ?? null,
        checklist_json: parsed.checklist,
        updated_by: context.profileId,
      })
      .eq("id", existing.id)
      .eq("updated_at", parsed.expectedUpdatedAt)
      .select("id")
      .maybeSingle();
    if (updateError) throw mapDatabaseError(updateError);
    if (!updated) throw await weeklyPlanWriteFailure(supabase, existing.id, parsed.expectedUpdatedAt);

    refreshCommittee(parsed.committeeId);
    return { ok: true, data: { id: updated.id } };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Câu UPDATE không trả về dòng nào có ba nguyên nhân khác hẳn nhau, và nói nhầm
 * nguyên nhân là đẩy người dùng đi sai đường: "tải lại trang" chữa được xung đột
 * nhưng vô ích khi họ thiếu quyền.
 */
async function weeklyPlanWriteFailure(
  supabase: ServerClient,
  planId: string,
  expectedUpdatedAt: string,
): Promise<AppError> {
  const { data } = await supabase
    .from("committee_weekly_plans")
    .select("updated_at")
    .eq("id", planId)
    .maybeSingle();
  if (!data) return new AppError("RESOURCE_NOT_FOUND", WEEKLY_PLAN_GONE_MESSAGE);
  if (data.updated_at !== expectedUpdatedAt) {
    return new AppError("CONFLICT", WEEKLY_PLAN_CONFLICT_MESSAGE);
  }
  // Bản vẫn y nguyên nhưng câu UPDATE không chạm được vào nó ⇒ policy chặn.
  return new AppError("FORBIDDEN");
}

export async function deleteCommitteeWeeklyPlan(
  input: { id: string },
): Promise<CommitteeActionResult> {
  return deleteCommitteeContent("committee_weekly_plans", input);
}

async function deleteCommitteeContent(
  table: "committee_announcements" | "committee_meetings" | "committee_weekly_plans",
  input: { id: string },
): Promise<CommitteeActionResult> {
  await guardCommitteeAction();
  try {
    const parsed = committeeContentIdSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq("id", parsed.id)
      .select("committee_id")
      .maybeSingle();
    if (error) throw mapDatabaseError(error);
    if (!data) throw new AppError("FORBIDDEN");
    refreshCommittee(data.committee_id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}
