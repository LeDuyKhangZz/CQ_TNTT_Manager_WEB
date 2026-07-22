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
  if (year && startDate > year.end_date) return { startDate, endDate, items: [] };

  const { data, error } = await supabase.rpc("get_week_ahead_teaching_items", {
    p_from: startDate,
    p_days: 7,
  });
  if (error) return { startDate, endDate, items: [] };
  return {
    startDate,
    endDate,
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
    staff_profiles: { full_name: string; saint_name: string | null } | null;
  }> = [];
  if (plan) {
    const { data } = await supabase
      .from("teaching_plan_items")
      .select("id, planned_date, title, objectives, catechism_content, scripture_content, game, song, homework, preparation, teacher_staff_id, item_type, note, material_name, material_mime_type, material_size, staff_profiles(full_name, saint_name)")
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
    })),
  };
}
