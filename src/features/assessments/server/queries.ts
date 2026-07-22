import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AssessmentKind, AttendanceScoreComponent, CommentVisibility, LeaderboardSourceType } from "../constants";
import { canCommentClass, canGradeClass, canManageLeaderboard, getVisibleResultClassIds } from "./permissions";

export interface ResultHubClass {
  id: string;
  displayName: string;
  assessmentCount: number;
  isLocked: boolean;
  canGrade: boolean;
}

export interface GradebookAssessment {
  id: string;
  kind: AssessmentKind;
  title: string;
  assessmentDate: string | null;
  weight: number;
  maxScore: number;
  attendanceComponent: AttendanceScoreComponent | null;
  isPublished: boolean;
}

export interface GradebookStudent {
  enrollmentId: string;
  studentId: string;
  saintName: string;
  fullName: string;
  weightedAverage: number | null;
  scores: Record<string, { score: number | null; suggestedScore: number | null; isManualOverride: boolean; note: string | null }>;
  comments: Array<{ id: string; visibility: CommentVisibility; content: string; commentDate: string; authorName: string }>;
}

export interface GradebookLeaderboard {
  id: string;
  title: string;
  sourceType: LeaderboardSourceType;
  sourceAssessmentId: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  entries: Array<{ enrollmentId: string; rank: number; score: number | null; saintName: string; fullName: string }>;
}

export interface GradebookDetail {
  classId: string;
  className: string;
  academicYearCode: string;
  yearStart: string;
  yearEnd: string;
  canGrade: boolean;
  canComment: boolean;
  canLock: boolean;
  canUnlock: boolean;
  canManageTop5: boolean;
  top5Enabled: boolean;
  isLocked: boolean;
  lockedAt: string | null;
  assessments: GradebookAssessment[];
  students: GradebookStudent[];
  leaderboards: GradebookLeaderboard[];
}

export interface PublishedResultAssessment {
  id: string;
  title: string;
  kind: AssessmentKind;
  score: number | null;
  maxScore: number;
  weight: number;
}

export interface PublishedResultLeaderboard {
  id: string;
  title: string;
  entries: Array<{ rank: number; score: number | null; saintName: string; fullName: string }>;
}

export interface PublishedPortalResult {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  className: string;
  academicYearCode: string;
  weightedAverage: number | null;
  assessments: PublishedResultAssessment[];
  comments: Array<{ id: string; content: string; commentDate: string; authorName: string }>;
  leaderboards: PublishedResultLeaderboard[];
}

async function getOwnedStudentIds(profileId: string): Promise<string[]> {
  const supabase = await createClient();
  const [{ data: guardian }, { data: selfStudent }] = await Promise.all([
    supabase.from("guardians").select("id").eq("profile_id", profileId).maybeSingle(),
    supabase.from("students").select("id").eq("profile_id", profileId).maybeSingle(),
  ]);
  const ids = new Set<string>();
  if (selfStudent) ids.add(selfStudent.id);
  if (guardian) {
    const { data: children } = await supabase.from("students").select("id").eq("guardian_id", guardian.id);
    for (const child of children ?? []) ids.add(child.id);
  }
  return [...ids];
}

async function getPublishedPortalResults(profileId: string, academicYearId: string): Promise<PublishedPortalResult[]> {
  const supabase = await createClient();
  const studentIds = await getOwnedStudentIds(profileId);
  if (studentIds.length === 0) return [];
  const { data: enrollmentData } = await supabase
    .from("enrollments")
    .select("id, student_id, class_id, students(saint_name, full_name), classes(display_name, academic_years(code))")
    .eq("academic_year_id", academicYearId)
    .in("student_id", studentIds);
  const enrollments = (enrollmentData ?? []) as unknown as Array<{
    id: string;
    student_id: string;
    class_id: string;
    students: { saint_name: string; full_name: string } | null;
    classes: { display_name: string; academic_years: { code: string } | null } | null;
  }>;
  const classIds = [...new Set(enrollments.map((item) => item.class_id))];
  const enrollmentIds = enrollments.map((item) => item.id);
  if (classIds.length === 0) return [];

  const [{ data: assessments }, { data: scores }, { data: comments }, { data: leaderboards }] = await Promise.all([
    supabase.from("assessments")
      .select("id, class_id, kind, title, weight, max_score")
      .in("class_id", classIds)
      .eq("is_active", true)
      .eq("is_published", true)
      .order("assessment_date", { ascending: true, nullsFirst: false })
      .order("created_at"),
    supabase.from("assessment_scores")
      .select("assessment_id, enrollment_id, score")
      .in("enrollment_id", enrollmentIds)
      .eq("assessment_published", true),
    supabase.from("student_comments")
      .select("id, enrollment_id, content, comment_date, profiles!student_comments_author_profile_id_fkey(display_name)")
      .in("enrollment_id", enrollmentIds)
      .eq("visibility", "student_visible")
      .order("comment_date", { ascending: false }),
    supabase.from("leaderboards")
      .select("id, class_id, title, leaderboard_entries(rank, score, saint_name_snapshot, full_name_snapshot)")
      .in("class_id", classIds)
      .eq("is_published", true)
      .order("published_at", { ascending: false }),
  ]);

  const assessmentById = new Map((assessments ?? []).map((item) => [item.id, item] as const));
  const scoresByEnrollment = new Map<string, Map<string, number | null>>();
  for (const score of scores ?? []) {
    if (!assessmentById.has(score.assessment_id)) continue;
    const map = scoresByEnrollment.get(score.enrollment_id) ?? new Map<string, number | null>();
    map.set(score.assessment_id, score.score === null ? null : Number(score.score));
    scoresByEnrollment.set(score.enrollment_id, map);
  }
  const commentsByEnrollment = new Map<string, PublishedPortalResult["comments"]>();
  for (const comment of comments ?? []) {
    const list = commentsByEnrollment.get(comment.enrollment_id) ?? [];
    list.push({
      id: comment.id,
      content: comment.content,
      commentDate: comment.comment_date,
      authorName: comment.profiles?.display_name ?? "Nhân sự lớp",
    });
    commentsByEnrollment.set(comment.enrollment_id, list);
  }
  const leaderboardByClass = new Map<string, PublishedResultLeaderboard[]>();
  for (const leaderboard of leaderboards ?? []) {
    const list = leaderboardByClass.get(leaderboard.class_id) ?? [];
    list.push({
      id: leaderboard.id,
      title: leaderboard.title,
      entries: leaderboard.leaderboard_entries
        .map((entry) => ({
          rank: entry.rank,
          score: entry.score === null ? null : Number(entry.score),
          saintName: entry.saint_name_snapshot,
          fullName: entry.full_name_snapshot,
        }))
        .sort((left, right) => left.rank - right.rank),
    });
    leaderboardByClass.set(leaderboard.class_id, list);
  }

  return enrollments.map((enrollment) => {
    const scoreMap = scoresByEnrollment.get(enrollment.id) ?? new Map();
    const published = (assessments ?? []).filter((assessment) => assessment.class_id === enrollment.class_id);
    let weightedTotal = 0;
    let weightTotal = 0;
    const portalAssessments = published.map((assessment) => {
      const score = scoreMap.get(assessment.id) ?? null;
      const weight = Number(assessment.weight);
      if (score !== null) {
        weightedTotal += score * weight;
        weightTotal += weight;
      }
      return {
        id: assessment.id,
        title: assessment.title,
        kind: assessment.kind,
        score,
        maxScore: Number(assessment.max_score),
        weight,
      };
    });
    return {
      enrollmentId: enrollment.id,
      studentId: enrollment.student_id,
      studentName: enrollment.students ? `${enrollment.students.saint_name} ${enrollment.students.full_name}`.trim() : "—",
      className: enrollment.classes?.display_name ?? "—",
      academicYearCode: enrollment.classes?.academic_years?.code ?? "—",
      weightedAverage: weightTotal > 0 ? Math.round((weightedTotal / weightTotal) * 100) / 100 : null,
      assessments: portalAssessments,
      comments: commentsByEnrollment.get(enrollment.id) ?? [],
      leaderboards: leaderboardByClass.get(enrollment.class_id) ?? [],
    };
  }).sort((left, right) => left.studentName.localeCompare(right.studentName, "vi"));
}

export async function getResultsPageData(): Promise<{
  audience: string | null;
  year: { id: string; code: string } | null;
  classes: ResultHubClass[];
  portal: PublishedPortalResult[];
}> {
  const context = await requireRouteAccess("/results");
  const supabase = await createClient();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id, code")
    .eq("status", "current")
    .maybeSingle();
  if (!year) {
    return { audience: context.audience, year, classes: [], portal: [] };
  }
  const portal = await getPublishedPortalResults(context.profileId, year.id);
  if (context.role === "guardian" || context.role === "student") {
    return { audience: context.audience, year, classes: [], portal };
  }

  const visible = await getVisibleResultClassIds(context, supabase);
  if (visible !== null && visible.size === 0) {
    return { audience: context.audience, year, classes: [], portal };
  }
  let classQuery = supabase
    .from("classes")
    .select("id, display_name")
    .eq("academic_year_id", year.id)
    .eq("status", "active")
    .order("display_name");
  if (visible !== null) classQuery = classQuery.in("id", [...visible]);
  const { data: classes } = await classQuery;
  const classIds = (classes ?? []).map((item) => item.id);
  if (classIds.length === 0) return { audience: context.audience, year, classes: [], portal };

  const [{ data: assessments }, { data: locks }] = await Promise.all([
    supabase.from("assessments").select("id, class_id").in("class_id", classIds).eq("is_active", true),
    supabase.from("gradebook_locks").select("class_id, is_locked").in("class_id", classIds),
  ]);
  const assessmentCount = new Map<string, number>();
  for (const item of assessments ?? []) assessmentCount.set(item.class_id, (assessmentCount.get(item.class_id) ?? 0) + 1);
  const lockMap = new Map((locks ?? []).map((item) => [item.class_id, item.is_locked] as const));
  const gradeability = await Promise.all((classes ?? []).map((item) => canGradeClass(context, supabase, item.id)));

  return {
    audience: context.audience,
    year,
    portal,
    classes: (classes ?? []).map((item, index) => ({
      id: item.id,
      displayName: item.display_name,
      assessmentCount: assessmentCount.get(item.id) ?? 0,
      isLocked: lockMap.get(item.id) ?? false,
      canGrade: gradeability[index] ?? false,
    })),
  };
}

export async function getGradebookDetail(classId: string): Promise<GradebookDetail | null> {
  const context = await requireRouteAccess(`/results/${classId}`);
  const supabase = await createClient();
  const { data: classRow } = await supabase
    .from("classes")
    .select("id, display_name, academic_year_id, academic_years(code, start_date, end_date, top5_enabled)")
    .eq("id", classId)
    .maybeSingle();
  if (!classRow?.academic_years) return null;

  const visible = await getVisibleResultClassIds(context, supabase);
  if (visible !== null && !visible.has(classId)) return null;
  const [canGrade, canComment, canManageTop5] = await Promise.all([
    canGradeClass(context, supabase, classId),
    canCommentClass(context, supabase, classId),
    canManageLeaderboard(context, supabase, classId),
  ]);
  const [{ data: assessments }, { data: enrollments }, { data: scores }, { data: averages }, { data: lock }, { data: comments }, { data: leaderboards }] = await Promise.all([
    supabase
      .from("assessments")
      .select("id, kind, title, assessment_date, weight, max_score, attendance_component, is_published")
      .eq("class_id", classId)
      .eq("is_active", true)
      .order("assessment_date", { ascending: true, nullsFirst: false })
      .order("created_at"),
    supabase
      .from("enrollments")
      .select("id, student_id, students(id, saint_name, full_name)")
      .eq("class_id", classId)
      .in("status", ["active", "paused"]),
    supabase
      .from("assessment_scores")
      .select("assessment_id, enrollment_id, score, system_suggested_score, is_manual_override, note")
      .eq("class_id", classId),
    supabase
      .from("v_student_weighted_average")
      .select("enrollment_id, weighted_average")
      .eq("class_id", classId),
    supabase
      .from("gradebook_locks")
      .select("is_locked, locked_at")
      .eq("class_id", classId)
      .maybeSingle(),
    supabase
      .from("student_comments")
      .select("id, enrollment_id, visibility, content, comment_date, profiles!student_comments_author_profile_id_fkey(display_name)")
      .eq("class_id", classId)
      .order("comment_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("leaderboards")
      .select("id, title, source_type, source_assessment_id, is_published, published_at, leaderboard_entries(enrollment_id, rank, score, saint_name_snapshot, full_name_snapshot)")
      .eq("class_id", classId)
      .order("created_at", { ascending: false }),
  ]);

  const scoresByEnrollment = new Map<string, GradebookStudent["scores"]>();
  for (const item of scores ?? []) {
    const map = scoresByEnrollment.get(item.enrollment_id) ?? {};
    map[item.assessment_id] = {
      score: item.score === null ? null : Number(item.score),
      suggestedScore: item.system_suggested_score === null ? null : Number(item.system_suggested_score),
      isManualOverride: item.is_manual_override,
      note: item.note,
    };
    scoresByEnrollment.set(item.enrollment_id, map);
  }
  const averageMap = new Map((averages ?? []).map((item) => [item.enrollment_id, item.weighted_average === null ? null : Number(item.weighted_average)] as const));
  const commentsByEnrollment = new Map<string, GradebookStudent["comments"]>();
  for (const comment of comments ?? []) {
    const list = commentsByEnrollment.get(comment.enrollment_id) ?? [];
    list.push({
      id: comment.id,
      visibility: comment.visibility,
      content: comment.content,
      commentDate: comment.comment_date,
      authorName: comment.profiles?.display_name ?? "Nhân sự lớp",
    });
    commentsByEnrollment.set(comment.enrollment_id, list);
  }
  const studentRows = (enrollments ?? []).flatMap((enrollment) => {
    const student = enrollment.students;
    return student ? [{
      enrollmentId: enrollment.id,
      studentId: student.id,
      saintName: student.saint_name,
      fullName: student.full_name,
      weightedAverage: averageMap.get(enrollment.id) ?? null,
      scores: scoresByEnrollment.get(enrollment.id) ?? {},
      comments: commentsByEnrollment.get(enrollment.id) ?? [],
    }] : [];
  }).sort((left, right) => `${left.saintName} ${left.fullName}`.localeCompare(`${right.saintName} ${right.fullName}`, "vi"));

  return {
    classId: classRow.id,
    className: classRow.display_name,
    academicYearCode: classRow.academic_years.code,
    yearStart: classRow.academic_years.start_date,
    yearEnd: classRow.academic_years.end_date,
    canGrade,
    canComment,
    canLock: context.role === "class_representative" || context.role === "super_admin" || context.role === "group_leader" || context.role === "deputy_group_leader" || context.role === "secretary",
    canUnlock: context.role === "super_admin",
    canManageTop5,
    top5Enabled: classRow.academic_years.top5_enabled,
    isLocked: lock?.is_locked ?? false,
    lockedAt: lock?.locked_at ?? null,
    assessments: (assessments ?? []).map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      assessmentDate: item.assessment_date,
      weight: Number(item.weight),
      maxScore: Number(item.max_score),
      attendanceComponent: item.attendance_component,
      isPublished: item.is_published,
    })),
    students: studentRows,
    leaderboards: (leaderboards ?? []).map((leaderboard) => ({
      id: leaderboard.id,
      title: leaderboard.title,
      sourceType: leaderboard.source_type,
      sourceAssessmentId: leaderboard.source_assessment_id,
      isPublished: leaderboard.is_published,
      publishedAt: leaderboard.published_at,
      entries: leaderboard.leaderboard_entries
        .map((entry) => ({
          enrollmentId: entry.enrollment_id,
          rank: entry.rank,
          score: entry.score === null ? null : Number(entry.score),
          saintName: entry.saint_name_snapshot,
          fullName: entry.full_name_snapshot,
        }))
        .sort((left, right) => left.rank - right.rank),
    })),
  };
}
