import "server-only";

import { requireAuthContext, requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/types";
import type { NotificationTargetType } from "../constants";

export interface InboxNotification {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  linkPath: string | null;
  readAt: string | null;
  targetType: NotificationTargetType;
}

export interface TargetOption {
  id: string;
  label: string;
}

export interface PublishOptions {
  canPublishGlobal: boolean;
  sectors: TargetOption[];
  classes: TargetOption[];
  committees: TargetOption[];
}

export interface NotificationsPageData {
  inbox: InboxNotification[];
  unreadCount: number;
  publishOptions: PublishOptions;
}

const GLOBAL_WRITE_ROLES = ["super_admin", "group_leader", "deputy_group_leader", "secretary"];

/**
 * Chỉ đếm — dùng cho badge ở header. Tách khỏi truy vấn trang để layout không
 * phải tải cả hộp thư trên mọi route.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notification_recipients")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}

async function getPublishOptions(context: AuthContext): Promise<PublishOptions> {
  const supabase = await createClient();
  const isGlobal = context.role !== null && GLOBAL_WRITE_ROLES.includes(context.role);
  const isSectorLead = context.role === "sector_leader" || context.role === "sector_deputy";
  const isRepresentative = context.role === "class_representative";

  const options: PublishOptions = {
    canPublishGlobal: isGlobal,
    sectors: [],
    classes: [],
    committees: [],
  };

  if (isGlobal || isSectorLead) {
    const { data } = await supabase.from("sectors").select("id, name").order("sort_order");
    options.sectors = (data ?? [])
      .filter((sector) => isGlobal || sector.id === context.sectorId)
      .map((sector) => ({ id: sector.id, label: sector.name }));
  }

  if (isGlobal || isSectorLead || isRepresentative) {
    const { data } = await supabase
      .from("classes")
      .select("id, display_name, grade_levels(sector_id)")
      .eq("status", "active")
      .order("display_name");
    options.classes = (data ?? [])
      .filter((item) => {
        if (isGlobal) return true;
        if (isSectorLead) return item.grade_levels?.sector_id === context.sectorId;
        return item.id === context.classId;
      })
      .map((item) => ({ id: item.id, label: item.display_name }));
  }

  // RLS `committees` đã giới hạn về đúng Ban của mình; chỉ Trưởng/Phó ban mới
  // publish được nên lọc thêm theo chức vụ.
  const { data: membershipData } = await supabase
    .from("committee_memberships")
    .select("committee_id, position, staff_profiles!inner(profile_id), committees(name)")
    .eq("is_active", true);
  options.committees = (membershipData ?? [])
    .filter((item) =>
      isGlobal
      || (item.staff_profiles?.profile_id === context.profileId
        && (item.position === "leader" || item.position === "deputy")))
    .map((item) => ({ id: item.committee_id, label: item.committees?.name ?? "Ban" }));

  if (isGlobal) {
    const { data } = await supabase.from("committees").select("id, name").order("sort_order");
    options.committees = (data ?? []).map((item) => ({ id: item.id, label: item.name }));
  }

  return options;
}

export async function getNotificationsPageData(): Promise<NotificationsPageData> {
  const context = await requireRouteAccess("/notifications");
  const supabase = await createClient();

  const { data } = await supabase
    .from("notification_recipients")
    .select("read_at, notifications(id, title, content, published_at, link_path, target_type)")
    .order("delivered_at", { ascending: false })
    .limit(50);

  const inbox = (data ?? []).flatMap((row): InboxNotification[] => {
    const notification = row.notifications;
    if (!notification) return [];
    return [{
      id: notification.id,
      title: notification.title,
      content: notification.content,
      publishedAt: notification.published_at,
      linkPath: notification.link_path,
      readAt: row.read_at,
      targetType: notification.target_type as NotificationTargetType,
    }];
  });

  return {
    inbox,
    unreadCount: inbox.filter((item) => item.readAt === null).length,
    publishOptions: await getPublishOptions(context),
  };
}

/** Dùng ở layout: cần auth nhưng không ràng buộc route cụ thể. */
export async function getHeaderNotificationState(): Promise<{ unreadCount: number }> {
  await requireAuthContext();
  return { unreadCount: await getUnreadNotificationCount() };
}
