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

  const { data: currentYear } = await supabase
    .from("academic_years")
    .select("id, code")
    .eq("status", "current")
    .maybeSingle();

  // Không có năm học hiện hành thì mọi thống kê theo năm đều vô nghĩa; trả về
  // khung rỗng để trang hướng dẫn sang /admin thay vì hiện số 0 gây hiểu nhầm.
  if (!currentYear) {
    const { data: notificationRows } = await supabase
      .from("notification_recipients")
      .select("read_at, notifications(id, title, published_at)")
      .order("delivered_at", { ascending: false })
      .limit(5);
    return {
      audience: context.audience,
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
    { data: summary },
    { data: atRiskRows },
    { data: upcomingRows },
    { data: celebrationRows },
    { count: incompleteCount },
    { data: planRows },
    { data: notificationRows },
  ] = await Promise.all([
    supabase.from("v_dashboard_summary").select("*").eq("academic_year_id", currentYear.id).maybeSingle(),
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
    supabase
      .from("notification_recipients")
      .select("read_at, notifications(id, title, published_at)")
      .order("delivered_at", { ascending: false })
      .limit(5),
  ]);

  return {
    audience: context.audience,
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
