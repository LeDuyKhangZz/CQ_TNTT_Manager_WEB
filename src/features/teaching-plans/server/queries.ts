import "server-only";

import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { requireRouteAccess } from "@/lib/auth/guards";
import { APP_TIME_ZONE } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { TeachingItemType } from "../constants";
import { canManageTeachingClass, getManageableTeachingClassIds } from "./permissions";

function personLabel(person: { saint_name: string | null; full_name: string } | null): string {
  if (!person) return "Chưa phân công";
  return person.saint_name ? `${person.saint_name} ${person.full_name}` : person.full_name;
}

export interface TeachingPlanHubClass {
  id: string;
  displayName: string;
  planId: string | null;
  planTitle: string | null;
  itemCount: number;
  canManage: boolean;
}

export interface TeachingPlanStaffOption {
  id: string;
  label: string;
  capacity: string;
  startsOn: string;
  endsOn: string | null;
}

export interface TeachingPlanItem {
  id: string;
  plannedDate: string;
  title: string;
  objectives: string | null;
  catechismContent: string | null;
  scriptureContent: string | null;
  game: string | null;
  song: string | null;
  homework: string | null;
  preparation: string | null;
  teacherStaffId: string | null;
  teacherName: string;
  itemType: TeachingItemType;
  note: string | null;
  materialName: string | null;
  materialMimeType: string | null;
  materialSize: number | null;
  /**
   * Phiên bản mục — **D-146 / TB-M06-01**. Biểu mẫu gửi lại nguyên văn để máy
   * chủ từ chối lượt lưu dựa trên một bản đã cũ. Xem `expectedUpdatedAtSchema`
   * về việc **không** được đưa chuỗi này qua `Date`.
   */
  updatedAt: string;
}

export interface TeachingPlanDetail {
  classId: string;
  className: string;
  academicYearCode: string;
  yearStart: string;
  yearEnd: string;
  planId: string | null;
  planTitle: string | null;
  canManage: boolean;
  staff: TeachingPlanStaffOption[];
  items: TeachingPlanItem[];
}

export interface WeekAheadTeachingItem {
  itemId: string;
  classId: string;
  className: string;
  plannedDate: string;
  title: string;
  preparation: string | null;
  itemType: TeachingItemType;
  teacherName: string | null;
}

export interface WeekAheadTeachingData {
  startDate: string;
  endDate: string;
  items: WeekAheadTeachingItem[];
  /**
   * RPC lỗi — M06-A, hạng mục **#11** (`06_UI_UX_RECOMMENDATIONS` §5).
   *
   * 🔴 Trước đợt này `catch` của RPC trả về **đúng cùng một hình dạng** với
   * "tuần này không có bài nào": `items: []`. Nên khi hàm hỏng thật, màn hình
   * nói *"Chưa có bài học hoặc bài kiểm tra trong khoảng này."* — một câu bình
   * thản, đúng ngữ pháp, và **sai**. Phụ huynh đọc câu ấy rồi cho con nghỉ, còn
   * Giáo lý viên không có lý do nào để báo hỏng. Một lỗi im lặng luôn tệ hơn
   * một lỗi ồn ào.
   */
  failed: boolean;
}

function isoDate(value: Date): string {
  return formatInTimeZone(value, APP_TIME_ZONE, "yyyy-MM-dd");
}

export async function getWeekAheadTeachingData(): Promise<WeekAheadTeachingData> {
  await requireRouteAccess("/teaching-plan");
  const supabase = await createClient();
  const today = isoDate(new Date());
  const { data: year } = await supabase
    .from("academic_years")
    .select("start_date, end_date")
    .eq("status", "current")
    .maybeSingle();
  const startDate = year && today < year.start_date ? year.start_date : today;
  const endDate = isoDate(addDays(new Date(`${startDate}T00:00:00Z`), 6));
  // Sau ngày bế giảng thì **cố ý** không gọi RPC (AC-14) — đây là "rỗng thật",
  // không phải hỏng.
  if (year && startDate > year.end_date) return { startDate, endDate, items: [], failed: false };

  const { data, error } = await supabase.rpc("get_week_ahead_teaching_items", {
    p_from: startDate,
    p_days: 7,
  });
  if (error) return { startDate, endDate, items: [], failed: true };
  return {
    startDate,
    endDate,
    failed: false,
    items: (data ?? []).map((item) => ({
      itemId: item.item_id,
      classId: item.class_id,
      className: item.class_name,
      plannedDate: item.planned_date,
      title: item.title,
      preparation: item.preparation,
      itemType: item.item_type,
      teacherName: item.teacher_name,
    })),
  };
}

export async function getTeachingPlanPageData(): Promise<{
  audience: string | null;
  year: { code: string; name: string } | null;
  classes: TeachingPlanHubClass[];
}> {
  const context = await requireRouteAccess("/teaching-plan");
  const supabase = await createClient();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id, code, name")
    .eq("status", "current")
    .maybeSingle();

  if (!year) return { audience: context.audience, year: null, classes: [] };

  // `classes` là danh mục học vụ có thể đọc rộng, nên không dùng riêng RLS của
  // bảng đó để quyết định UI portal. Guardian/student chỉ đi qua safe RPC.
  if (context.role === "guardian" || context.role === "student") {
    return {
      audience: context.audience,
      year: { code: year.code, name: year.name },
      classes: [],
    };
  }

  const { data: classRows } = await supabase
    .from("classes")
    .select("id, display_name")
    .eq("academic_year_id", year.id)
    .eq("status", "active")
    .order("display_name");
  const classes = classRows ?? [];
  if (classes.length === 0) {
    return { audience: context.audience, year: { code: year.code, name: year.name }, classes: [] };
  }

  const classIds = classes.map((item) => item.id);
  const [{ data: plans }, manageable] = await Promise.all([
    supabase
      .from("teaching_plans")
      .select("id, class_id, title, teaching_plan_items(id)")
      .in("class_id", classIds),
    getManageableTeachingClassIds(context, supabase),
  ]);
  const planByClass = new Map(
    (plans ?? []).map((plan) => [plan.class_id, plan] as const),
  );

  return {
    audience: context.audience,
    year: { code: year.code, name: year.name },
    classes: classes.map((classRow) => {
      const plan = planByClass.get(classRow.id);
      return {
        id: classRow.id,
        displayName: classRow.display_name,
        planId: plan?.id ?? null,
        planTitle: plan?.title ?? null,
        itemCount: plan?.teaching_plan_items.length ?? 0,
        canManage: manageable === null || manageable.has(classRow.id),
      };
    }),
  };
}

export async function getTeachingPlanDetail(classId: string): Promise<TeachingPlanDetail | null> {
  const context = await requireRouteAccess(`/teaching-plan/${classId}`);

  /**
   * TB-M06-05 / **TB-07** — phụ huynh và thiếu nhi nhận **404**, không nhận một
   * khung trang rỗng.
   *
   * `route-map.ts` khai báo `/teaching-plan` không giới hạn vai trò (đúng, vì
   * cổng cũng dùng địa chỉ ấy cho lịch 7 ngày), nên gõ thẳng
   * `/teaching-plan/{classId}` vẫn dựng ra trang quản trị: tiêu đề *"Giáo án
   * lớp Ấu 1A"*, hai nút đổi kiểu hiển thị, và dòng *"Giáo án chưa có bài dạy
   * hoặc bài kiểm tra."* — RLS đã lọc sạch dữ liệu nên **không rò rỉ gì**,
   * nhưng câu cuối là một lời nói dối: giáo án có đầy bài, chỉ là họ không được
   * xem. Bảng `classes` đọc được rộng nên tên lớp thì vẫn hiện.
   *
   * Chặn ở đây chứ không ở `route-map`: cùng một địa chỉ gốc phục vụ hai
   * audience, đúng ca mà M05-A gặp ở `/attendance` (TB-10).
   */
  if (context.audience !== "staff") return null;

  const supabase = await createClient();
  const { data: classRow } = await supabase
    .from("classes")
    .select("id, display_name, academic_years(code, start_date, end_date)")
    .eq("id", classId)
    .maybeSingle();
  if (!classRow || !classRow.academic_years) return null;

  const [{ data: plan }, { data: assignments }, canManage] = await Promise.all([
    supabase
      .from("teaching_plans")
      .select("id, title")
      .eq("class_id", classId)
      .maybeSingle(),
    supabase
      .from("class_staff_assignments")
      .select("capacity, starts_on, ends_on, staff_profiles(id, full_name, saint_name)")
      .eq("class_id", classId)
      .eq("is_active", true)
      .order("capacity"),
    canManageTeachingClass(context, supabase, classId),
  ]);

  let itemRows: Array<{
    id: string;
    planned_date: string;
    title: string;
    objectives: string | null;
    catechism_content: string | null;
    scripture_content: string | null;
    game: string | null;
    song: string | null;
    homework: string | null;
    preparation: string | null;
    teacher_staff_id: string | null;
    item_type: TeachingItemType;
    note: string | null;
    material_name: string | null;
    material_mime_type: string | null;
    material_size: number | null;
    updated_at: string;
    staff_profiles: { full_name: string; saint_name: string | null } | null;
  }> = [];
  if (plan) {
    const { data } = await supabase
      .from("teaching_plan_items")
      .select("id, planned_date, title, objectives, catechism_content, scripture_content, game, song, homework, preparation, teacher_staff_id, item_type, note, material_name, material_mime_type, material_size, updated_at, staff_profiles(full_name, saint_name)")
      .eq("teaching_plan_id", plan.id)
      .order("planned_date");
    itemRows = (data ?? []) as unknown as typeof itemRows;
  }

  return {
    classId: classRow.id,
    className: classRow.display_name,
    academicYearCode: classRow.academic_years.code,
    yearStart: classRow.academic_years.start_date,
    yearEnd: classRow.academic_years.end_date,
    planId: plan?.id ?? null,
    planTitle: plan?.title ?? null,
    canManage,
    staff: (assignments ?? []).flatMap((assignment) => {
      const staff = assignment.staff_profiles;
      return staff
        ? [{
            id: staff.id,
            label: personLabel(staff),
            capacity: assignment.capacity,
            startsOn: assignment.starts_on,
            endsOn: assignment.ends_on,
          }]
        : [];
    }),
    items: itemRows.map((item) => ({
      id: item.id,
      plannedDate: item.planned_date,
      title: item.title,
      objectives: item.objectives,
      catechismContent: item.catechism_content,
      scriptureContent: item.scripture_content,
      game: item.game,
      song: item.song,
      homework: item.homework,
      preparation: item.preparation,
      teacherStaffId: item.teacher_staff_id,
      teacherName: personLabel(item.staff_profiles),
      itemType: item.item_type,
      note: item.note,
      materialName: item.material_name,
      materialMimeType: item.material_mime_type,
      materialSize: item.material_size,
      updatedAt: item.updated_at,
    })),
  };
}
