"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  committeeAnnouncementInputSchema,
  committeeContentIdSchema,
  committeeInputSchema,
  committeeMeetingInputSchema,
  committeeMembershipEndSchema,
  committeeMembershipInputSchema,
  committeeMembershipPositionSchema,
  committeeWeeklyPlanInputSchema,
  type CommitteeAnnouncementInput,
  type CommitteeInput,
  type CommitteeMeetingInput,
  type CommitteeMembershipInput,
  type CommitteeMembershipPositionInput,
  type CommitteeWeeklyPlanInput,
} from "../schemas";

export type CommitteeActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function failure(error: unknown): CommitteeActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể xử lý yêu cầu. Vui lòng thử lại." };
}

function mapDatabaseError(error: { code?: string; message?: string } | null): AppError {
  if (error?.code === "42501") return new AppError("FORBIDDEN");
  if (error?.code === "P0002" || error?.code === "23503") return new AppError("RESOURCE_NOT_FOUND");
  if (error?.message?.includes("COMMITTEE_LIMIT_EXCEEDED")) {
    return new AppError("CAPACITY_CONFLICT", "Mỗi nhân sự chỉ tham gia tối đa hai Ban đang hoạt động.");
  }
  if (error?.message?.includes("COMMITTEE_NOT_ACTIVE")) {
    return new AppError("VALIDATION_ERROR", "Ban này đã ngưng hoạt động.");
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
  try {
    const parsed = committeeInputSchema.parse(input);
    const context = await requireAuthContext("/committees");
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

export async function addCommitteeMember(
  input: CommitteeMembershipInput,
): Promise<CommitteeActionResult<{ id: string }>> {
  try {
    const parsed = committeeMembershipInputSchema.parse(input);
    const context = await requireAuthContext("/committees");
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
  try {
    const parsed = committeeMembershipPositionSchema.parse(input);
    const context = await requireAuthContext("/committees");
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

/** Không xóa chức vụ: kết thúc nhiệm kỳ để giữ lịch sử (docs/02 §11.2). */
export async function endCommitteeMembership(
  input: { membershipId: string },
): Promise<CommitteeActionResult> {
  try {
    const parsed = committeeMembershipEndSchema.parse(input);
    const context = await requireAuthContext("/committees");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("committee_memberships")
      .update({
        is_active: false,
        ends_on: new Date().toISOString().slice(0, 10),
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
  try {
    const parsed = committeeAnnouncementInputSchema.parse(input);
    const context = await requireAuthContext("/committees");
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

export async function saveCommitteeMeeting(
  input: CommitteeMeetingInput,
): Promise<CommitteeActionResult<{ id: string }>> {
  try {
    const parsed = committeeMeetingInputSchema.parse(input);
    const context = await requireAuthContext("/committees");
    const supabase = await createClient();
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

export async function saveCommitteeWeeklyPlan(
  input: CommitteeWeeklyPlanInput,
): Promise<CommitteeActionResult<{ id: string }>> {
  try {
    const parsed = committeeWeeklyPlanInputSchema.parse(input);
    const context = await requireAuthContext("/committees");
    const supabase = await createClient();
    // Một Ban chỉ có một bản công việc cho mỗi tuần; sửa lại tuần cũ là upsert.
    const { data, error } = await supabase
      .from("committee_weekly_plans")
      .upsert(
        {
          committee_id: parsed.committeeId,
          week_start: parsed.weekStart,
          content: parsed.content ?? null,
          checklist_json: parsed.checklist,
          created_by: context.profileId,
          updated_by: context.profileId,
        },
        { onConflict: "committee_id,week_start" },
      )
      .select("id")
      .single();
    if (error || !data) throw mapDatabaseError(error);
    refreshCommittee(parsed.committeeId);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return failure(error);
  }
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
  try {
    const parsed = committeeContentIdSchema.parse(input);
    await requireAuthContext("/committees");
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
