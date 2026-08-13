import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AppAudience } from "@/lib/permissions/roles";

export interface DashboardKpis {
  academicYearCode: string | null;
  studentCount: number;
  staffCount: number;
  classCount: number;
  massRate: number | null;
  catechismRate: number | null;
  warnedStudentCount: number;
  lastSessionDate: string | null;
}

export interface AtRiskStudent {
  studentId: string;
  displayName: string;
  className: string | null;
  catechismAbsenceStreak: number;
  sundayAbsenceStreak: number;
  weightedAverage: number | null;
  reasons: string[];
}

export interface UpcomingItem {
  id: string;
  className: string;
  plannedDate: string;
  title: string;
  isAssessment: boolean;
}

export interface Celebration {
  studentId: string;
  displayName: string;
  kind: "birthday" | "patron_feast";
  nextOccurrence: string;
}

export interface CommitteeTask {
  committeeName: string;
  weekStart: string;
  checklist: string[];
}

export interface DashboardData {
  audience: AppAudience | null;
  /**
   * D-170 — người này đọc được **số gộp** nhưng không đọc được danh sách tên.
   *
   * Hiện chỉ đúng với Thủ quỹ. Cần một cờ riêng chứ không suy từ `audience` vì
   * họ vẫn là `staff`: nếu không nói ra, thẻ "Cần quan tâm" sẽ hiện tiêu đề
   * *"12 em đang có cảnh báo"* ngay trên một danh sách rỗng kèm câu *"Không có
   * em nào cần lưu ý trong phạm vi của bạn"* — hai câu nói ngược nhau trong
   * cùng một thẻ, đúng thứ bệnh của module này.
   */
  aggregateOnly: boolean;
  /**
   * F05 — chỉ Quản trị viên hệ thống vào được `/admin`. Thẻ "chưa có năm học"
   * từng dẫn **mọi** vai trò tới đó, tức màn hình đầu tiên sau khi đăng nhập
   * mời người dùng đi vào một trang chắc chắn từ chối họ.
   */
  canOpenAdmin: boolean;
  /**
   * N-2 — có truy vấn nào của trang này hỏng không.
   *
   * Bảy truy vấn dưới đây từng bỏ qua `error` của Supabase hoàn toàn, nên một
   * mục hỏng và một mục rỗng hiện ra **giống hệt nhau**. Với trang mà ai cũng
   * đổ vào ngay sau khi đăng nhập, đó là cách nhanh nhất để một sự cố thật bị
   * đọc thành "xứ đoàn chưa có dữ liệu".
   */
  hasLoadError: boolean;
  kpis: DashboardKpis | null;
  atRisk: AtRiskStudent[];
  upcoming: UpcomingItem[];
  celebrations: Celebration[];
  incompleteProfileCount: number;
  committeeTasks: CommitteeTask[];
  latestNotifications: Array<{ id: string; title: string; publishedAt: string; readAt: string | null }>;
}

function riskReasons(row: {
  warn_consecutive_absence: boolean | null;
  warn_consecutive_sunday: boolean | null;
  warn_low_rate: boolean | null;
  warn_low_average: boolean | null;
}): string[] {
  return [
    row.warn_consecutive_absence ? "vắng giáo lý liên tiếp" : null,
    row.warn_consecutive_sunday ? "vắng lễ Chúa nhật liên tiếp" : null,
    row.warn_low_rate ? "tỷ lệ chuyên cần thấp" : null,
    row.warn_low_average ? "trung bình dưới 5" : null,
  ].filter((value): value is string => value !== null);
}

export async function getDashboardData(): Promise<DashboardData> {
  const context = await requireRouteAccess("/dashboard");
  const supabase = await createClient();
  const aggregateOnly = context.role === "treasurer";

  const { data: currentYear } = await supabase
    .from("academic_years")
    .select("id, code")
    .eq("status", "current")
    .maybeSingle();

  // Không có năm học hiện hành thì mọi thống kê theo năm đều vô nghĩa; trả về
  // khung rỗng để trang hướng dẫn sang /admin thay vì hiện số 0 gây hiểu nhầm.
  if (!currentYear) {
    // 🔴 M10-A · BR-M10-20 — xem ghi chú ở nhánh chính bên dưới.
    const { data: notificationRows, error: notificationError } = await supabase
      .from("notification_recipients")
      .select("read_at, notifications(id, title, published_at)")
      .eq("profile_id", context.profileId)
      .order("delivered_at", { ascending: false })
      .limit(5);
    return {
      audience: context.audience,
      aggregateOnly,
      canOpenAdmin: context.role === "super_admin",
      hasLoadError: notificationError !== null,
      kpis: null,
      atRisk: [],
      upcoming: [],
      celebrations: [],
      incompleteProfileCount: 0,
      committeeTasks: [],
      latestNotifications: (notificationRows ?? []).flatMap((row) => row.notifications ? [{
        id: row.notifications.id,
        title: row.notifications.title,
        publishedAt: row.notifications.published_at,
        readAt: row.read_at,
      }] : []),
    };
  }

  const [
    { data: summary, error: summaryError },
    { data: atRiskRows, error: atRiskError },
    { data: upcomingRows, error: upcomingError },
    { data: celebrationRows, error: celebrationError },
    { count: incompleteCount, error: incompleteError },
    { data: planRows, error: planError },
    { data: notificationRows, error: notificationError },
  ] = await Promise.all([
    // 🔴 D-170 — Thủ quỹ đi qua cửa sổ hẹp, không đi qua view.
    //
    // `v_dashboard_summary` là `security_invoker`, nên ba trong bốn con số của
    // nó bị RLS của bảng gốc cắt về **0** với Thủ quỹ, và ô "Lớp" thì bị mệnh đề
    // phạm vi viết tay trong view cắt về **0** nốt (D-169). Đo trên cơ sở dữ liệu
    // thật ngày 2026-08-12: `0 · 0 · 0 · null`. Đó không phải "chưa biết", đó là
    // **nói sai** — trang tổng quan báo với một chức việc cấp xứ đoàn rằng xứ
    // đoàn có 0 thiếu nhi.
    //
    // Không sửa view: xem lời giải thích dài ở migration `20260812000100`. Tóm
    // tắt: sửa view chỉ nới được đúng ô "Lớp" và sẽ dựng lại đúng cái bệnh
    // "bốn số cạnh nhau nói hai chuyện" mà D-169 vừa chữa hôm qua.
    aggregateOnly
      ? supabase.rpc("dashboard_summary_for_treasurer", { p_academic_year_id: currentYear.id })
        .maybeSingle()
      : supabase.from("v_dashboard_summary").select("*").eq("academic_year_id", currentYear.id).maybeSingle(),
    supabase
      .from("v_students_at_risk")
      .select("*")
      .eq("academic_year_id", currentYear.id)
      .limit(10),
    supabase
      .from("v_upcoming_teaching_items")
      .select("*")
      .eq("academic_year_id", currentYear.id)
      .order("planned_date")
      .limit(8),
    supabase.from("v_upcoming_celebrations").select("*").order("next_occurrence").limit(10),
    supabase.from("v_incomplete_student_profiles").select("student_id", { count: "exact", head: true }),
    supabase
      .from("committee_weekly_plans")
      .select("week_start, checklist_json, committees(name)")
      .order("week_start", { ascending: false })
      .limit(3),
    // 🔴 **M10-A · BR-M10-20 — CHỖ THỨ BA mắc đúng lỗi của hai luồng CRITICAL,
    // và nó KHÔNG nằm trong phạm vi audit M10.** Bài quét mã nguồn
    // `tests/unit/notification-inbox.test.ts` tìm ra nó.
    //
    // `03_AUDIT_RESULTS.md` §4.1 đã dặn trước: *"mọi truy vấn 'của tôi' trong
    // repo cần được rà xem có dựa vào RLS để lọc thay vì lọc tường minh không"*.
    // Đây đúng là một cái. Hậu quả ở đây **nặng hơn** hộp thư: `/dashboard` là
    // trang mọi người đổ vào ngay sau khi đăng nhập, nên với 6 vai trò cấp xứ
    // đoàn, ô *"Thông báo mới nhất"* của trang chủ hiện **5 dòng người-nhận mới
    // nhất của toàn hệ thống** — kể cả tiêu đề thư riêng gửi cho người khác.
    //
    // Ô này thuộc M11 (Báo cáo & Dashboard, module 13/14) theo `11` §3. Sửa ở
    // đây vì nó là **rò rỉ cùng loại** với thứ M10-A sinh ra để đóng, chỉ tốn
    // một dòng, và chỉ **siết** phạm vi dữ liệu trả về. Đã bàn giao cho M11.
    supabase
      .from("notification_recipients")
      .select("read_at, notifications(id, title, published_at)")
      .eq("profile_id", context.profileId)
      .order("delivered_at", { ascending: false })
      .limit(5),
  ]);

  // N-2 — gom lỗi của cả bảy truy vấn thành MỘT câu ở đầu trang. Không đếm
  // riêng từng mục: người dùng không sửa được mục nào cả, thứ họ cần biết là
  // "trang này đang thiếu, đừng tin con số" chứ không phải tên bảng nào hỏng.
  const loadErrors = [
    summaryError, atRiskError, upcomingError, celebrationError,
    incompleteError, planError, notificationError,
  ].filter((error) => error !== null);
  if (loadErrors.length > 0) {
    console.error("[dashboard] truy vấn hỏng", loadErrors.map((error) => error.message));
  }

  return {
    audience: context.audience,
    aggregateOnly,
    canOpenAdmin: context.role === "super_admin",
    hasLoadError: loadErrors.length > 0,
    kpis: {
      academicYearCode: currentYear.code,
      studentCount: summary?.student_count ?? 0,
      staffCount: summary?.staff_count ?? 0,
      classCount: summary?.class_count ?? 0,
      massRate: summary?.mass_rate ?? null,
      catechismRate: summary?.catechism_rate ?? null,
      warnedStudentCount: summary?.warned_student_count ?? 0,
      lastSessionDate: summary?.last_session_date ?? null,
    },
    atRisk: (atRiskRows ?? []).map((row): AtRiskStudent => ({
      studentId: row.student_id ?? "",
      displayName: `${row.saint_name ?? ""} ${row.full_name ?? ""}`.trim(),
      className: row.class_name,
      catechismAbsenceStreak: row.catechism_absence_streak ?? 0,
      sundayAbsenceStreak: row.sunday_absence_streak ?? 0,
      weightedAverage: row.weighted_average,
      reasons: riskReasons(row),
    })),
    upcoming: (upcomingRows ?? []).map((row): UpcomingItem => ({
      id: row.id ?? "",
      className: row.class_name ?? "—",
      plannedDate: row.planned_date ?? "",
      title: row.title ?? "",
      isAssessment: row.is_assessment ?? false,
    })),
    celebrations: (celebrationRows ?? []).map((row): Celebration => ({
      studentId: row.student_id ?? "",
      displayName: `${row.saint_name ?? ""} ${row.full_name ?? ""}`.trim(),
      kind: row.kind === "patron_feast" ? "patron_feast" : "birthday",
      nextOccurrence: row.next_occurrence ?? "",
    })),
    incompleteProfileCount: incompleteCount ?? 0,
    committeeTasks: (planRows ?? []).map((row): CommitteeTask => ({
      committeeName: row.committees?.name ?? "Ban",
      weekStart: row.week_start,
      checklist: Array.isArray(row.checklist_json)
        ? (row.checklist_json as unknown[]).map((entry) => String(entry))
        : [],
    })),
    latestNotifications: (notificationRows ?? []).flatMap((row) => row.notifications ? [{
      id: row.notifications.id,
      title: row.notifications.title,
      publishedAt: row.notifications.published_at,
      readAt: row.read_at,
    }] : []),
  };
}
