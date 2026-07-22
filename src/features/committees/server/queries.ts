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
  memberCount: number;
  myPosition: CommitteePosition | null;
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
      .select("id, committee_id, staff_profile_id, position")
      .eq("is_active", true),
  ]);

  const memberships = membershipData ?? [];
  const committees = (committeeData ?? []).map((committee): CommitteeSummary => ({
    id: committee.id,
    code: committee.code,
    name: committee.name,
    description: committee.description,
    managesEquipment: committee.manages_equipment,
    isActive: committee.is_active,
    memberCount: memberships.filter((item) => item.committee_id === committee.id).length,
    myPosition: (memberships.find(
      (item) => item.committee_id === committee.id && item.staff_profile_id === myStaffId,
    )?.position ?? null) as CommitteePosition | null,
  }));

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
        .select("id, week_start, content, checklist_json")
        .eq("committee_id", committeeId)
        .order("week_start", { ascending: false })
        .limit(8),
    ]);

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
      memberCount: members.length,
      myPosition,
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
    weeklyPlans: (planData ?? []).map((item): CommitteeWeeklyPlan => ({
      id: item.id,
      weekStart: item.week_start,
      content: item.content,
      checklist: Array.isArray(item.checklist_json)
        ? (item.checklist_json as unknown[]).map((entry) => String(entry))
        : [],
    })),
    staffOptions,
    canManageMembers: manageMembers,
    canWriteContent: canWriteCommitteeContent(context, myPosition),
  };
}
