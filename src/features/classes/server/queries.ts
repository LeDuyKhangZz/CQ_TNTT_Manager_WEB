import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { canManageEnrollments } from "@/features/enrollments/permissions";

const OPEN_STATUSES = new Set(["active", "paused"]);

function staffLabel(staff: { saint_name: string | null; full_name: string } | null): string {
  if (!staff) return "—";
  return staff.saint_name ? `${staff.saint_name} ${staff.full_name}` : staff.full_name;
}

export interface ClassCard {
  id: string;
  displayName: string;
  sectionCode: string | null;
  classKind: string;
  studentCount: number;
  representative: string;
  staffCount: number;
}

export interface SectorGroup {
  sectorId: string;
  name: string;
  shortName: string;
  classes: ClassCard[];
}

interface RawClassRow {
  id: string;
  display_name: string;
  section_code: string | null;
  class_kind: string;
  status: string;
  grade_levels: { sort_order: number; sectors: { id: string; name: string; short_name: string; sort_order: number } | null } | null;
  class_staff_assignments: Array<{ capacity: string; is_active: boolean; staff_profiles: { full_name: string; saint_name: string | null } | null }>;
  enrollments: Array<{ status: string }>;
}

function toCard(row: RawClassRow): ClassCard {
  const activeStaff = row.class_staff_assignments.filter((item) => item.is_active);
  const representative = activeStaff.find((item) => item.capacity === "representative");
  return {
    id: row.id,
    displayName: row.display_name,
    sectionCode: row.section_code,
    classKind: row.class_kind,
    studentCount: row.enrollments.filter((item) => OPEN_STATUSES.has(item.status)).length,
    representative: representative ? staffLabel(representative.staff_profiles) : "Chưa có",
    staffCount: activeStaff.length,
  };
}

export async function getClassesPageData() {
  const context = await requireRouteAccess("/classes");
  const supabase = await createClient();

  const { data: year } = await supabase
    .from("academic_years")
    .select("id, code, name")
    .eq("status", "current")
    .maybeSingle();

  if (!year) {
    return { context, year: null, sectors: [] as SectorGroup[], trainees: [] as ClassCard[] };
  }

  const { data } = await supabase
    .from("classes")
    .select(
      "id, display_name, section_code, class_kind, status, grade_levels(sort_order, sectors(id, name, short_name, sort_order)), class_staff_assignments(capacity, is_active, staff_profiles(full_name, saint_name)), enrollments(status)",
    )
    .eq("academic_year_id", year.id)
    .order("display_name");

  const rows = (data ?? []) as unknown as RawClassRow[];
  const sectorMap = new Map<string, SectorGroup & { sortOrder: number }>();
  const trainees: ClassCard[] = [];

  for (const row of rows) {
    if (row.class_kind === "trainee" || !row.grade_levels?.sectors) {
      trainees.push(toCard(row));
      continue;
    }
    const sector = row.grade_levels.sectors;
    if (!sectorMap.has(sector.id)) {
      sectorMap.set(sector.id, { sectorId: sector.id, name: sector.name, shortName: sector.short_name, sortOrder: sector.sort_order, classes: [] });
    }
    sectorMap.get(sector.id)!.classes.push(toCard(row));
  }

  const sectors = [...sectorMap.values()]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((group): SectorGroup => ({
      sectorId: group.sectorId,
      name: group.name,
      shortName: group.shortName,
      classes: group.classes,
    }));

  return { context, year, sectors, trainees };
}

export interface ClassDetail {
  id: string;
  displayName: string;
  classKind: string;
  sectorName: string | null;
  academicYearId: string;
  academicYearCode: string;
  team: Array<{ id: string; capacity: string; name: string; startsOn: string }>;
  roster: Array<{ enrollmentId: string; studentId: string; studentCode: string; saintName: string; fullName: string; status: string }>;
  availableStudents: Array<{ id: string; studentCode: string; label: string }>;
}

export async function getClassDetail(classId: string): Promise<{
  context: Awaited<ReturnType<typeof requireRouteAccess>>;
  canManage: boolean;
  classDetail: ClassDetail | null;
}> {
  const context = await requireRouteAccess(`/classes/${classId}`);
  const canManage = canManageEnrollments(context.role);
  const supabase = await createClient();

  const { data } = await supabase
    .from("classes")
    .select(
      "id, display_name, class_kind, academic_year_id, academic_years(code), grade_levels(sectors(name)), class_staff_assignments(id, capacity, starts_on, is_active, staff_profiles(full_name, saint_name)), enrollments(id, status, students(id, student_code, saint_name, full_name))",
    )
    .eq("id", classId)
    .maybeSingle();

  if (!data) return { context, canManage, classDetail: null };

  const row = data as unknown as {
    id: string;
    display_name: string;
    class_kind: string;
    academic_year_id: string;
    academic_years: { code: string } | null;
    grade_levels: { sectors: { name: string } | null } | null;
    class_staff_assignments: Array<{ id: string; capacity: string; starts_on: string; is_active: boolean; staff_profiles: { full_name: string; saint_name: string | null } | null }>;
    enrollments: Array<{ id: string; status: string; students: { id: string; student_code: string; saint_name: string; full_name: string } | null }>;
  };

  const roster = row.enrollments
    .filter((item) => OPEN_STATUSES.has(item.status) && item.students)
    .map((item) => ({
      enrollmentId: item.id,
      studentId: item.students!.id,
      studentCode: item.students!.student_code,
      saintName: item.students!.saint_name,
      fullName: item.students!.full_name,
      status: item.status,
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "vi"));

  let availableStudents: ClassDetail["availableStudents"] = [];
  if (canManage) {
    const [openResult, studentsResult] = await Promise.all([
      supabase
        .from("enrollments")
        .select("student_id, status")
        .eq("academic_year_id", row.academic_year_id)
        .in("status", ["active", "paused"]),
      supabase.from("students").select("id, student_code, saint_name, full_name").eq("status", "active").order("full_name"),
    ]);
    const enrolled = new Set((openResult.data ?? []).map((item) => item.student_id));
    availableStudents = (studentsResult.data ?? [])
      .filter((item) => !enrolled.has(item.id))
      .map((item) => ({ id: item.id, studentCode: item.student_code, label: `${item.saint_name} ${item.full_name}` }));
  }

  return {
    context,
    canManage,
    classDetail: {
      id: row.id,
      displayName: row.display_name,
      classKind: row.class_kind,
      sectorName: row.grade_levels?.sectors?.name ?? null,
      academicYearId: row.academic_year_id,
      academicYearCode: row.academic_years?.code ?? "",
      team: row.class_staff_assignments
        .filter((item) => item.is_active)
        .map((item) => ({ id: item.id, capacity: item.capacity, name: staffLabel(item.staff_profiles), startsOn: item.starts_on })),
      roster,
      availableStudents,
    },
  };
}
