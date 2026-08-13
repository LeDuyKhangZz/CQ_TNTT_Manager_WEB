import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/types";
import type { CommitteePosition } from "../constants";
import { canManageCommittees, canWriteCommitteeContent } from "./permissions";

export interface CommitteeSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  managesEquipment: boolean;
  isActive: boolean;
  sortOrder: number;
  memberCount: number;
  myPosition: CommitteePosition | null;
  /** TB-M09-06: tên Trưởng/Phó ban trên thẻ Ban. Rỗng khi RLS không cho đọc tên. */
  leaderNames: string[];
  deputyNames: string[];
}

export interface CommitteeMember {
  id: string;
  staffProfileId: string;
  displayName: string;
  position: CommitteePosition;
  startsOn: string;
  isSelf: boolean;
}

export interface CommitteeAnnouncement {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  authorName: string | null;
}

export interface CommitteeMeeting {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  note: string | null;
}

export interface CommitteeWeeklyPlan {
  id: string;
  weekStart: string;
  content: string | null;
  checklist: string[];
  /** TB-M09-01: khoá so sánh-và-đổi mà form gửi lại khi bấm Lưu. */
  updatedAt: string;
  /** `null` khi RLS không cho người đang xem đọc hồ sơ của người lưu. */
  savedByName: string | null;
}

export interface StaffOption {
  id: string;
  displayName: string;
  activeCommitteeCount: number;
}

export interface CommitteeDetail {
  committee: CommitteeSummary;
  members: CommitteeMember[];
  announcements: CommitteeAnnouncement[];
  meetings: CommitteeMeeting[];
  weeklyPlans: CommitteeWeeklyPlan[];
  staffOptions: StaffOption[];
  canManageMembers: boolean;
  canWriteContent: boolean;
}

function staffDisplayName(staff: { saint_name: string | null; full_name: string } | null): string {
  if (!staff) return "—";
  return `${staff.saint_name ?? ""} ${staff.full_name}`.trim();
}

async function getMyStaffProfileId(context: AuthContext): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("profile_id", context.profileId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getCommitteesPageData(): Promise<{
  committees: CommitteeSummary[];
  canManageCommittees: boolean;
}> {
  const context = await requireRouteAccess("/committees");
  const supabase = await createClient();
  const myStaffId = await getMyStaffProfileId(context);

  const [{ data: committeeData }, { data: membershipData }] = await Promise.all([
    supabase.from("committees").select("*").order("sort_order").order("name"),
    supabase
      .from("committee_memberships")
      // D-100 cho thành viên đọc tên nhau, nên thẻ Ban hiện được tên Trưởng/Phó.
      .select("id, committee_id, staff_profile_id, position, staff_profiles(saint_name, full_name)")
      .eq("is_active", true),
  ]);

  const memberships = membershipData ?? [];
  const committees = (committeeData ?? []).map((committee): CommitteeSummary => {
    const own = memberships.filter((item) => item.committee_id === committee.id);
    const namesByPosition = (position: CommitteePosition) =>
      own
        .filter((item) => item.position === position)
        .map((item) => staffDisplayName(item.staff_profiles))
        .filter((name) => name !== "—");
    return {
      id: committee.id,
      code: committee.code,
      name: committee.name,
      description: committee.description,
      managesEquipment: committee.manages_equipment,
      isActive: committee.is_active,
      sortOrder: committee.sort_order,
      memberCount: own.length,
      myPosition: (own.find((item) => item.staff_profile_id === myStaffId)?.position ?? null) as CommitteePosition | null,
      leaderNames: namesByPosition("leader"),
      deputyNames: namesByPosition("deputy"),
    };
  });

  return { committees, canManageCommittees: canManageCommittees(context) };
}

export async function getCommitteeDetail(committeeId: string): Promise<CommitteeDetail | null> {
  const context = await requireRouteAccess("/committees");
  const supabase = await createClient();
  const myStaffId = await getMyStaffProfileId(context);

  const { data: committee } = await supabase
    .from("committees")
    .select("*")
    .eq("id", committeeId)
    .maybeSingle();
  if (!committee) return null;

  const [{ data: memberData }, { data: announcementData }, { data: meetingData }, { data: planData }] =
    await Promise.all([
      supabase
        .from("committee_memberships")
        .select("id, staff_profile_id, position, starts_on, staff_profiles(saint_name, full_name)")
        .eq("committee_id", committeeId)
        .eq("is_active", true)
        .order("position"),
      supabase
        .from("committee_announcements")
        .select("id, title, content, published_at, staff_profiles(saint_name, full_name)")
        .eq("committee_id", committeeId)
        .order("published_at", { ascending: false })
        .limit(20),
      supabase
        .from("committee_meetings")
        .select("id, title, starts_at, ends_at, location, note")
        .eq("committee_id", committeeId)
        .order("starts_at", { ascending: false })
        .limit(20),
      supabase
        .from("committee_weekly_plans")
        .select("id, week_start, content, checklist_json, updated_at, updated_by, created_by")
        .eq("committee_id", committeeId)
        .order("week_start", { ascending: false })
        .limit(8),
    ]);

  // Tên người lưu bản tuần tra qua `staff_profiles`, KHÔNG qua `profiles`:
  // `profiles_select_self_or_global` chỉ cho chính chủ hoặc quyền toàn cục đọc,
  // nên một Trưởng ban thường sẽ luôn nhận null nếu đi đường đó. Không đọc được
  // thì bỏ tên đi, không hiện "—" — một dấu gạch ở chỗ chờ tên người là câu nói
  // sai về việc "không ai lưu bản này".
  const planRows = planData ?? [];
  const savedByIds = Array.from(
    new Set(planRows.map((row) => row.updated_by ?? row.created_by).filter((id): id is string => Boolean(id))),
  );
  const savedByName = new Map<string, string>();
  if (savedByIds.length > 0) {
    const { data: savers } = await supabase
      .from("staff_profiles")
      .select("profile_id, saint_name, full_name")
      .in("profile_id", savedByIds);
    for (const saver of savers ?? []) {
      if (saver.profile_id) savedByName.set(saver.profile_id, staffDisplayName(saver));
    }
  }

  const members = (memberData ?? []).map((item): CommitteeMember => ({
    id: item.id,
    staffProfileId: item.staff_profile_id,
    displayName: staffDisplayName(item.staff_profiles),
    position: item.position as CommitteePosition,
    startsOn: item.starts_on,
    isSelf: item.staff_profile_id === myStaffId,
  }));
  const myPosition = members.find((item) => item.isSelf)?.position ?? null;
  const manageMembers = canManageCommittees(context);

  // Danh sách nhân sự để thêm vào Ban chỉ cần cho người có quyền lập chức vụ;
  // kèm số Ban đang giữ để UI cảnh báo trước giới hạn hai Ban (D-47).
  let staffOptions: StaffOption[] = [];
  if (manageMembers) {
    const [{ data: staffData }, { data: activeMemberships }] = await Promise.all([
      supabase.from("staff_profiles").select("id, saint_name, full_name").order("full_name"),
      supabase.from("committee_memberships").select("staff_profile_id").eq("is_active", true),
    ]);
    const inCommittee = new Set(members.map((item) => item.staffProfileId));
    staffOptions = (staffData ?? [])
      .filter((staff) => !inCommittee.has(staff.id))
      .map((staff) => ({
        id: staff.id,
        displayName: staffDisplayName(staff),
        activeCommitteeCount: (activeMemberships ?? []).filter(
          (item) => item.staff_profile_id === staff.id,
        ).length,
      }));
  }

  return {
    committee: {
      id: committee.id,
      code: committee.code,
      name: committee.name,
      description: committee.description,
      managesEquipment: committee.manages_equipment,
      isActive: committee.is_active,
      sortOrder: committee.sort_order,
      memberCount: members.length,
      myPosition,
      leaderNames: members.filter((m) => m.position === "leader").map((m) => m.displayName),
      deputyNames: members.filter((m) => m.position === "deputy").map((m) => m.displayName),
    },
    members,
    announcements: (announcementData ?? []).map((item): CommitteeAnnouncement => ({
      id: item.id,
      title: item.title,
      content: item.content,
      publishedAt: item.published_at,
      authorName: item.staff_profiles ? staffDisplayName(item.staff_profiles) : null,
    })),
    meetings: (meetingData ?? []).map((item): CommitteeMeeting => ({
      id: item.id,
      title: item.title,
      startsAt: item.starts_at,
      endsAt: item.ends_at,
      location: item.location,
      note: item.note,
    })),
    weeklyPlans: planRows.map((item): CommitteeWeeklyPlan => ({
      id: item.id,
      weekStart: item.week_start,
      content: item.content,
      checklist: Array.isArray(item.checklist_json)
        ? (item.checklist_json as unknown[]).map((entry) => String(entry))
        : [],
      updatedAt: item.updated_at,
      savedByName: savedByName.get(item.updated_by ?? item.created_by) ?? null,
    })),
    staffOptions,
    canManageMembers: manageMembers,
    canWriteContent: canWriteCommitteeContent(context, myPosition),
  };
}
