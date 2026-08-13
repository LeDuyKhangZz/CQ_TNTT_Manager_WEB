import "server-only";

import { cache } from "react";
import { requireAuthContext, requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/types";
import type { AppAudience } from "@/lib/permissions/roles";
import {
  INBOX_PAGE_SIZE,
  parseInboxFilter,
  parseInboxPage,
  toInboxNotifications,
  type InboxFilter,
  type InboxNotification,
  type InboxRow,
} from "../inbox";
import type { NotificationTargetType } from "../constants";

export type { InboxNotification } from "../inbox";

export interface TargetOption {
  id: string;
  label: string;
}

export interface PublishOptions {
  canPublishGlobal: boolean;
  /**
   * M10-B / TB-M10-03 — mở đường vào cho phạm vi "Một người".
   *
   * Chức năng này đã có **đủ** ở cơ sở dữ liệu từ Phase 6 nhưng không có nút
   * bấm nào: `availableTargets` chưa bao giờ đẩy `"user"` vào danh sách. Nó
   * trôi vào vùng xám giữa *"đã làm"* và *"chưa làm"* suốt hai giai đoạn.
   * Bằng đúng `isGlobal` — khớp nhánh `else` của `app.can_publish_notification`.
   */
  canPublishUser: boolean;
  sectors: TargetOption[];
  classes: TargetOption[];
  committees: TargetOption[];
}

/** Một dòng của mục "Đã gửi" — AC-07-01. */
export interface SentNotification {
  id: string;
  title: string;
  publishedAt: string;
  targetType: NotificationTargetType;
  recipientCount: number;
  retractedAt: string | null;
  retractReason: string | null;
}

export interface NotificationsPageData {
  audience: AppAudience | null;
  inbox: InboxNotification[];
  unreadCount: number;
  /** Tổng số dòng hộp thư khớp bộ lọc — để dựng phân trang. */
  inboxTotal: number;
  filter: InboxFilter;
  page: number;
  sent: SentNotification[];
  publishOptions: PublishOptions;
}

/** Số dòng "Đã gửi" tải về. Đây là danh sách để rà lại, không phải kho lưu trữ. */
const SENT_PAGE_SIZE = 20;

const GLOBAL_WRITE_ROLES = ["super_admin", "group_leader", "deputy_group_leader", "secretary"];

/**
 * Chỉ đếm — dùng cho badge ở header. Tách khỏi truy vấn trang để layout không
 * phải tải cả hộp thư trên mọi route.
 *
 * 🔴 **CRIT-M10-01 — `profile_id` là điều kiện SỐNG CÒN, không phải tối ưu.**
 * Bản cũ không có nó vì tin rằng policy `notification_recipients_select_self`
 * đã lọc giúp. Policy ấy có mệnh đề `profile_id = auth.uid()` thật — nhưng nó
 * còn có `or app.can_global_read()` để phục vụ mục đích **quản trị**, nên với
 * 6 vai trò cấp xứ đoàn (Quản trị viên · Cha sở · Cha phó · Xứ đoàn trưởng ·
 * Phó Xứ đoàn · Thư ký) truy vấn này đếm **chưa đọc của cả xứ đoàn**: sau một
 * thông báo toàn hệ thống là "99+" và **không bao giờ về 0**.
 *
 * Sửa ở **truy vấn**, không sửa ở policy (`07` §4): nhánh `can_global_read`
 * vẫn cần cho màn hình quản trị sau này.
 *
 * `cache()` như `getAuthContext`: trang `/notifications` và cái chuông ở vỏ
 * cùng hỏi con số này trong một lượt dựng trang — bọc lại thì chỉ còn **một**
 * lượt đếm chạm cơ sở dữ liệu (TB-M10-01 bước 5).
 */
export const getUnreadNotificationCount = cache(async (profileId: string): Promise<number> => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notification_recipients")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    // M10-C — thông báo đã thu hồi thôi được tính là chưa đọc (D-166). Cờ nằm
    // ngay trên dòng người-nhận nên phép đếm ở vỏ ứng dụng — chạy trên **mọi**
    // trang — vẫn là một lượt đếm một bảng, không phải một phép nối.
    .is("notification_retracted_at", null)
    .is("read_at", null);
  return count ?? 0;
});

async function getPublishOptions(context: AuthContext): Promise<PublishOptions> {
  const supabase = await createClient();
  const isGlobal = context.role !== null && GLOBAL_WRITE_ROLES.includes(context.role);
  const isSectorLead = context.role === "sector_leader" || context.role === "sector_deputy";
  const isRepresentative = context.role === "class_representative";

  const options: PublishOptions = {
    canPublishGlobal: isGlobal,
    canPublishUser: isGlobal,
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

/**
 * Mục "Đã gửi" — AC-07-01, và là nơi đặt nút "Thu hồi" của D-166.
 *
 * Không cần nới quyền: policy `notifications_select_recipient` đã mở cho
 * `author_profile_id = auth.uid()` từ Phase 6, và M10-C giữ nguyên nhánh ấy
 * **chính vì** mục này — giấu bản đã thu hồi khỏi cả tác giả thì nhật ký thu
 * hồi không ai đọc được, tức là vô dụng.
 *
 * 🔴 **`.eq("author_profile_id", …)` là BR-M10-20 áp cho bảng thứ hai, và bản
 * nháp đầu của chính đợt C đã quên nó.** Cùng một policy có ba nhánh — tác giả,
 * **quyền đọc toàn cục**, người nhận — nên với 6 vai trò cấp xứ đoàn, mục nhan
 * đề *"Tôi đã gửi"* sẽ liệt kê thông báo **của cả xứ đoàn**, và bốn trong sáu
 * vai trò ấy còn bấm được nút "Thu hồi" trên đó. Đúng cái bẫy mà hai lỗi
 * CRITICAL của module này rơi vào, lặp lại trong lượt sửa chúng.
 *
 * Bài quét ở `tests/unit/notification-inbox.test.ts` nay canh **cả hai** bảng.
 */
async function getSentNotifications(profileId: string): Promise<SentNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, published_at, target_type, recipient_count, retracted_at, retract_reason")
    .eq("author_profile_id", profileId)
    .order("published_at", { ascending: false })
    .limit(SENT_PAGE_SIZE);
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    publishedAt: row.published_at,
    targetType: row.target_type as NotificationTargetType,
    recipientCount: row.recipient_count,
    retractedAt: row.retracted_at,
    retractReason: row.retract_reason,
  }));
}

export async function getNotificationsPageData(
  params: { filter?: string; page?: string } = {},
): Promise<NotificationsPageData> {
  const context = await requireRouteAccess("/notifications");
  const supabase = await createClient();
  const filter = parseInboxFilter(params.filter);
  const page = parseInboxPage(params.page);
  const from = (page - 1) * INBOX_PAGE_SIZE;

  const [rows, unreadCount, publishOptions] = await Promise.all([
    // 🔴 **CRIT-M10-02 — cùng một gốc rễ với CRIT-M10-01.** Thiếu `profile_id`
    // thì hộp thư *cá nhân* của 6 vai trò cấp xứ đoàn là "50 dòng người-nhận
    // mới nhất của **toàn hệ thống**": nội dung thư riêng của người khác nằm
    // trong đó, nhãn "Mới" lấy `read_at` **của người khác**, nút "Đánh dấu đã
    // đọc" bấm mãi không tắt (RPC chỉ đụng dòng của chính mình), và thông báo
    // thật sự dành cho họ **bị đẩy khỏi 50 dòng đầu** ⇒ bỏ lỡ thông báo.
    (filter === "unread"
      ? supabase
        .from("notification_recipients")
        .select(
          "notification_id, read_at, notification_retracted_at,"
          + " notifications(id, title, content, published_at, link_path, target_type)",
          { count: "exact" },
        )
        .eq("profile_id", context.profileId)
        // 🔴 Bộ lọc "Chưa đọc" phải dùng **cùng một định nghĩa** với con số trên
        // chuông, và chuông đã thôi đếm bản thu hồi (D-166). Thiếu dòng này thì
        // chuông nói "0" trong khi danh sách "Chưa đọc" vẫn còn dòng — người
        // dùng không có cách nào làm cho hai con số ấy khớp nhau.
        .is("notification_retracted_at", null)
        .is("read_at", null)
      : supabase
        .from("notification_recipients")
        .select(
          "notification_id, read_at, notification_retracted_at,"
          + " notifications(id, title, content, published_at, link_path, target_type)",
          { count: "exact" },
        )
        .eq("profile_id", context.profileId)
    )
      .order("delivered_at", { ascending: false })
      // 🔴 **`range` chứ không phải `limit` cứng.** Bản cũ lấy 50 dòng đầu và
      // hết: thông báo thứ 51 trở đi **biến mất hoàn toàn** mà không có gì trên
      // màn hình cho biết là còn nữa (`queries.ts:115` trước M10-C).
      .range(from, from + INBOX_PAGE_SIZE - 1),
    // Con số chưa đọc lấy từ **phép đếm thật**, không đếm trên trang đã tải:
    // đếm trên 50 dòng đầu thì người có 60 thông báo chưa đọc thấy "50".
    getUnreadNotificationCount(context.profileId),
    getPublishOptions(context),
  ]);
  if (rows.error) throw rows.error;

  const canPublish = publishOptions.canPublishGlobal
    || publishOptions.sectors.length > 0
    || publishOptions.classes.length > 0
    || publishOptions.committees.length > 0;

  return {
    audience: context.audience,
    inbox: toInboxNotifications((rows.data ?? []) as unknown as InboxRow[]),
    unreadCount,
    inboxTotal: rows.count ?? 0,
    filter,
    page,
    sent: canPublish ? await getSentNotifications(context.profileId) : [],
    publishOptions,
  };
}

/**
 * Đường **duy nhất** lấy số chưa đọc cho vỏ ứng dụng (TB-M10-01 bước 4).
 *
 * Bản cũ để hai đường song song — `NotificationBell` gọi thẳng
 * `getUnreadNotificationCount()` còn hàm này nằm chết. Hai đường thì lần sửa
 * sau chỉ sửa một, mà đây đúng là chỗ vừa phải sửa một lỗi bảo mật.
 */
export async function getHeaderNotificationState(): Promise<{ unreadCount: number }> {
  const context = await requireAuthContext();
  return { unreadCount: await getUnreadNotificationCount(context.profileId) };
}
