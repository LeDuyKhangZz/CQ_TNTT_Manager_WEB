import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { PromotionFinalStatus, PromotionProposalStatus } from "../constants";
import { canProposeForClass, canReviewSector } from "./permissions";

export interface PromotionTargetOption {
  id: string;
  displayName: string;
  academicYearCode: string;
  yearStart: string;
  gradeLevelId: string | null;
  classKind: "catechism" | "trainee";
}

export interface PromotionReviewItem {
  id: string;
  proposedStatus: PromotionProposalStatus;
  finalStatus: PromotionFinalStatus;
  proposedTargetClassId: string | null;
  approvedTargetClassId: string | null;
  proposeTrainee: boolean;
  representativeNote: string | null;
  reviewNote: string | null;
  proposedAt: string;
  reviewedAt: string | null;
  warningSnapshot: {
    weightedAverage?: number | null;
    massAttendanceScore?: number | null;
    catechismAttendanceScore?: number | null;
    warnConsecutiveAbsence?: boolean;
    warnConsecutiveSunday?: boolean;
    warnLowRate?: boolean;
  };
}

export interface PromotionRosterItem {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  yearCode: string;
  yearStart: string;
  gradeLevelId: string | null;
  nextGradeLevelId: string | null;
  sourceSectorId: string | null;
  canProposeTrainee: boolean;
  canPropose: boolean;
  canReview: boolean;
  review: PromotionReviewItem | null;
}

interface RawEnrollment {
  id: string;
  status: string;
  student_id: string;
  class_id: string;
  students: { saint_name: string; full_name: string } | null;
  classes: {
    display_name: string;
    academic_years: { code: string; start_date: string } | null;
    grade_levels: {
      id: string;
      next_grade_level_id: string | null;
      can_propose_trainee: boolean;
      sector_id: string;
    } | null;
  } | null;
}

function studentName(student: RawEnrollment["students"]): string {
  return student ? `${student.saint_name} ${student.full_name}`.trim() : "—";
}

export async function getPromotionsPageData(): Promise<{
  roster: PromotionRosterItem[];
  targets: PromotionTargetOption[];
}> {
  const context = await requireRouteAccess("/promotions");
  const supabase = await createClient();
  const [{ data: enrollmentData }, { data: reviewData }, { data: classData }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id, status, student_id, class_id, students(saint_name, full_name), classes(display_name, academic_years(code, start_date), grade_levels(id, next_grade_level_id, can_propose_trainee, sector_id))"),
    supabase.from("promotion_reviews").select("*").order("proposed_at", { ascending: false }),
    supabase
      .from("classes")
      .select("id, display_name, grade_level_id, class_kind, academic_years(code, start_date)")
      .eq("status", "active")
      .order("display_name"),
  ]);

  const reviews = new Map((reviewData ?? []).map((item) => [item.source_enrollment_id, item] as const));
  const rawEnrollments = ((enrollmentData ?? []) as unknown as RawEnrollment[])
    .filter((item) => ["active", "paused"].includes(item.status) || reviews.has(item.id));
  const permissions = await Promise.all(rawEnrollments.map(async (item) => ({
    propose: await canProposeForClass(context, supabase, item.class_id),
    review: canReviewSector(context, item.classes?.grade_levels?.sector_id ?? null),
  })));

  const roster = rawEnrollments.map((item, index): PromotionRosterItem => {
    const review = reviews.get(item.id);
    const grade = item.classes?.grade_levels;
    return {
      enrollmentId: item.id,
      studentId: item.student_id,
      studentName: studentName(item.students),
      classId: item.class_id,
      className: item.classes?.display_name ?? "—",
      yearCode: item.classes?.academic_years?.code ?? "—",
      yearStart: item.classes?.academic_years?.start_date ?? "",
      gradeLevelId: grade?.id ?? null,
      nextGradeLevelId: grade?.next_grade_level_id ?? null,
      sourceSectorId: grade?.sector_id ?? null,
      canProposeTrainee: grade?.can_propose_trainee ?? false,
      canPropose: permissions[index]?.propose ?? false,
      canReview: permissions[index]?.review ?? false,
      review: review ? {
        id: review.id,
        proposedStatus: review.proposed_status as PromotionProposalStatus,
        finalStatus: review.final_status as PromotionFinalStatus,
        proposedTargetClassId: review.proposed_target_class_id,
        approvedTargetClassId: review.approved_target_class_id,
        proposeTrainee: review.propose_trainee,
        representativeNote: review.representative_note,
        reviewNote: review.review_note,
        proposedAt: review.proposed_at,
        reviewedAt: review.reviewed_at,
        warningSnapshot: (review.warning_snapshot ?? {}) as PromotionReviewItem["warningSnapshot"],
      } : null,
    };
  }).sort((left, right) => `${left.className} ${left.studentName}`.localeCompare(`${right.className} ${right.studentName}`, "vi"));

  const targets = (classData ?? []).flatMap((item) => item.academic_years ? [{
    id: item.id,
    displayName: item.display_name,
    academicYearCode: item.academic_years.code,
    yearStart: item.academic_years.start_date,
    gradeLevelId: item.grade_level_id,
    classKind: item.class_kind,
  }] : []) as PromotionTargetOption[];
  return { roster, targets };
}
