import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { canViewSensitive, canWriteStudents } from "./permissions";

export interface StudentListItem {
  id: string;
  studentCode: string;
  saintName: string;
  fullName: string;
  status: string;
  hardshipFlag: boolean;
  guardianName: string;
  guardianPhone: string;
}

export interface GuardianOption {
  id: string;
  fullName: string;
  phone: string;
}

export async function getStudentsPageData() {
  const context = await requireRouteAccess("/students");
  const supabase = await createClient();
  const [studentsResult, guardiansResult] = await Promise.all([
    supabase
      .from("students")
      .select("id, student_code, saint_name, full_name, status, hardship_flag, guardians(full_name, phone)")
      .order("full_name"),
    supabase.from("guardians").select("id, full_name, phone").eq("status", "active").order("full_name"),
  ]);

  const rows = (studentsResult.data ?? []) as unknown as Array<{
    id: string;
    student_code: string;
    saint_name: string;
    full_name: string;
    status: string;
    hardship_flag: boolean;
    guardians: { full_name: string; phone: string } | null;
  }>;

  return {
    context,
    canWrite: canWriteStudents(context.role),
    students: rows.map((row): StudentListItem => ({
      id: row.id,
      studentCode: row.student_code,
      saintName: row.saint_name,
      fullName: row.full_name,
      status: row.status,
      hardshipFlag: row.hardship_flag,
      guardianName: row.guardians?.full_name ?? "—",
      guardianPhone: row.guardians?.phone ?? "—",
    })),
    guardians: (guardiansResult.data ?? []).map((item): GuardianOption => ({
      id: item.id,
      fullName: item.full_name,
      phone: item.phone,
    })),
  };
}

export interface StudentDetail {
  id: string;
  studentCode: string;
  saintName: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  patronFeastDate: string | null;
  address: string | null;
  phone: string | null;
  hardshipFlag: boolean;
  status: string;
  generalNotes: string | null;
  guardian: { id: string; fullName: string; phone: string; address: string | null } | null;
  health: {
    allergies: string | null;
    medicalConditions: string | null;
    medications: string | null;
    emergencyNotes: string | null;
  } | null;
  sacraments: Array<{
    id: string;
    sacramentType: string;
    sacramentName: string | null;
    sacramentDate: string | null;
    place: string | null;
    godparentName: string | null;
    registryNumber: string | null;
    notes: string | null;
  }>;
  enrollments: Array<{
    id: string;
    status: string;
    enrolledOn: string;
    endedOn: string | null;
    className: string;
    academicYearCode: string;
  }>;
}

export async function getStudentDetail(studentId: string): Promise<{
  context: Awaited<ReturnType<typeof requireRouteAccess>>;
  canWrite: boolean;
  canViewSensitive: boolean;
  student: StudentDetail | null;
}> {
  const context = await requireRouteAccess(`/students/${studentId}`);
  const supabase = await createClient();

  const { data } = await supabase
    .from("students")
    .select(
      "id, student_code, saint_name, full_name, gender, date_of_birth, patron_feast_date, address, phone, hardship_flag, status, general_notes, guardians(id, full_name, phone, address)",
    )
    .eq("id", studentId)
    .maybeSingle();

  if (!data) {
    return { context, canWrite: canWriteStudents(context.role), canViewSensitive: false, student: null };
  }

  const row = data as unknown as {
    id: string;
    student_code: string;
    saint_name: string;
    full_name: string;
    gender: string;
    date_of_birth: string;
    patron_feast_date: string | null;
    address: string | null;
    phone: string | null;
    hardship_flag: boolean;
    status: string;
    general_notes: string | null;
    guardians: { id: string; full_name: string; phone: string; address: string | null } | null;
  };

  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("id, status, enrolled_on, ended_on, classes(display_name), academic_years(code)")
    .eq("student_id", studentId)
    .order("enrolled_on", { ascending: false });
  const enrollments = ((enrollmentRows ?? []) as unknown as Array<{
    id: string;
    status: string;
    enrolled_on: string;
    ended_on: string | null;
    classes: { display_name: string } | null;
    academic_years: { code: string } | null;
  }>).map((item) => ({
    id: item.id,
    status: item.status,
    enrolledOn: item.enrolled_on,
    endedOn: item.ended_on,
    className: item.classes?.display_name ?? "—",
    academicYearCode: item.academic_years?.code ?? "—",
  }));

  const sensitive = canViewSensitive(context.role);
  let health: StudentDetail["health"] = null;
  let sacraments: StudentDetail["sacraments"] = [];

  if (sensitive) {
    const [healthResult, sacramentsResult] = await Promise.all([
      supabase
        .from("student_health_profiles")
        .select("allergies, medical_conditions, medications, emergency_notes")
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase
        .from("student_sacraments")
        .select("id, sacrament_type, sacrament_name, sacrament_date, place, godparent_name, registry_number, notes")
        .eq("student_id", studentId)
        .order("sacrament_date", { nullsFirst: false }),
    ]);
    if (healthResult.data) {
      health = {
        allergies: healthResult.data.allergies,
        medicalConditions: healthResult.data.medical_conditions,
        medications: healthResult.data.medications,
        emergencyNotes: healthResult.data.emergency_notes,
      };
    }
    sacraments = (sacramentsResult.data ?? []).map((item) => ({
      id: item.id,
      sacramentType: item.sacrament_type,
      sacramentName: item.sacrament_name,
      sacramentDate: item.sacrament_date,
      place: item.place,
      godparentName: item.godparent_name,
      registryNumber: item.registry_number,
      notes: item.notes,
    }));
  }

  return {
    context,
    canWrite: canWriteStudents(context.role),
    canViewSensitive: sensitive,
    student: {
      id: row.id,
      studentCode: row.student_code,
      saintName: row.saint_name,
      fullName: row.full_name,
      gender: row.gender,
      dateOfBirth: row.date_of_birth,
      patronFeastDate: row.patron_feast_date,
      address: row.address,
      phone: row.phone,
      hardshipFlag: row.hardship_flag,
      status: row.status,
      generalNotes: row.general_notes,
      guardian: row.guardians
        ? {
            id: row.guardians.id,
            fullName: row.guardians.full_name,
            phone: row.guardians.phone,
            address: row.guardians.address,
          }
        : null,
      health,
      sacraments,
      enrollments,
    },
  };
}
