import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import type { AppAudience } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";
import type { PortalDataStatus } from "@/features/portal/status";
import type { AssessmentKind, AttendanceScoreComponent, CommentVisibility, LeaderboardSourceType } from "../constants";
import {
  canCommentClass,
  canGradeClass,
  canLockGradebook,
  canManageLeaderboard,
  canModerateComment,
  getVisibleResultClassIds,
} from "./permissions";

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
  /**
   * M07-B · **TB-M07-01 bước 1 / AC-01-01 · AC-01-02** — cột này đã có **điểm
   * thật** chưa?
   *
   * 🔴 Đếm dòng có `score is not null`, **không** đếm số dòng `assessment_scores`.
   * Đó chính là chỗ lỗi cũ nằm: trước M07-A biểu mẫu ghi cả roster nên cột nào
   * cũng lập tức có 50 dòng rỗng, và câu lỗi người dùng đọc được là *"Cột đã có
   * điểm"* trong khi họ **chưa nhập điểm nào**.
   *
   * Giao diện dùng con số này để chọn giữa hai nút khác hẳn nhau về hậu quả:
   * **"Xóa cột"** (mất hẳn) và **"Ẩn cột"** (giữ lịch sử). Không đọc thêm truy
   * vấn nào — bảng điểm vốn đã tải toàn bộ ô điểm của lớp.
   */
  scoredCount: number;
}

export interface GradebookStudent {
  enrollmentId: string;
  studentId: string;
  saintName: string;
  fullName: string;
  weightedAverage: number | null;
  scores: Record<string, { score: number | null; suggestedScore: number | null; isManualOverride: boolean; note: string | null }>;
  comments: Array<{
    id: string;
    visibility: CommentVisibility;
    content: string;
    commentDate: string;
    authorName: string;
    /**
     * M07-B · **BR-M07-33 / D-152** — người đang xem có được **sửa hoặc xóa**
     * đúng nhận xét này không: tác giả · Giáo lý viên đại diện lớp · nhóm cấp
     * xứ đoàn.
     *
     * Tính theo **từng dòng**, không theo cả trang, vì đúng một màn hình sẽ có
     * cả nhận xét mình viết lẫn nhận xét người khác viết. Hàng rào thật nằm ở
     * `app.can_moderate_student_comment` trong policy — đây chỉ là nút.
     */
    canModerate: boolean;
  }>;
}

export interface GradebookLeaderboard {
  id: string;
  title: string;
  sourceType: LeaderboardSourceType;
  sourceAssessmentId: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  /**
   * M07-C · **TB-M07-06 / BR-M07-35** — bảng này đã **từng** công bố chưa?
   *
   * 🔴 Không suy ra được từ `isPublished`: một lượt "Ẩn khỏi cổng" đưa
   * `is_published` về `false` trong khi danh sách đã chốt vẫn còn nguyên. Giao
   * diện cần phân biệt ba trạng thái chứ không phải hai — **bản nháp** (xóa
   * được, chưa có gì để hiện), **đã chốt nhưng đang ẩn** (hiện lại được hoặc
   * chốt lại), **đang công bố**.
   */
  hasSnapshot: boolean;
  /** Số bản đã bị thay, đang nằm trong lịch sử (`leaderboard_snapshots`). */
  supersededCount: number;
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
  /**
   * M07-A · **TB-M07-09 / AC-09-01** — hệ số gợi ý khi tạo cột mới, lấy từ
   * `assessment_type_settings` của **năm học này**.
   *
   * 🔴 Trước đợt này con số nằm cứng trong `gradebook-editor.tsx` (`DEFAULT_WEIGHTS`),
   * nên **Quản trị viên hệ thống đổi hệ số mặc định của năm học thì giao diện
   * không đổi một chữ** — bảng cấu hình có thật, có màn hình, có policy từ Phase 5,
   * mà biểu mẫu tạo cột vẫn gợi ý số cũ. Giáo lý viên tin con số hiện sẵn nên hệ
   * số sai đi thẳng vào phép tính trung bình.
   *
   * ⚠️ Chỉ chứa các loại đang **bật** (`is_active`). Loại bị tắt không có khoá ở
   * đây và biểu mẫu rơi về hằng số cũ — cố ý: chặn tạo cột thuộc loại đã tắt là
   * một thay đổi nghiệp vụ, không thuộc phạm vi đợt này.
   */
  defaultWeights: Partial<Record<AssessmentKind, number>>;
  assessments: GradebookAssessment[];
  /**
   * M07-C · **nợ #21** — các cột đang bị ẩn (`is_active = false`).
   *
   * 🔴 M07-B biến `is_active` thành cột nghiệp vụ nhưng chỉ mở **một chiều**:
   * mọi truy vấn của module lọc `is_active = true`, nên cột vừa ẩn không còn bề
   * mặt nào để bấm vào và ẩn nhầm phải nhờ Quản trị viên hệ thống can thiệp
   * thẳng vào cơ sở dữ liệu. Danh sách này là đường quay lại.
   *
   * ⚠️ **Chỉ nhân sự đọc được, và điều đó là do RLS chứ không do đây.**
   * `assessments_select_scope` chỉ cho phụ huynh/thiếu nhi thấy dòng
   * `is_published and is_active` (M07-B), nên một phiên cổng phụ huynh gọi cùng
   * truy vấn này vẫn nhận mảng rỗng.
   */
  hiddenAssessments: GradebookAssessment[];
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
  /**
   * M07-A · **TB-M07-07 phương án A / AC-07-01** — hai con số làm rõ
   * `weightedAverage` được tính trên cái gì.
   *
   * 🔴 **Cả hai đều lấy từ những cột ĐÃ CÔNG BỐ, và đó là quyết định của chủ dự
   * án ngày 2026-08-05, không phải chỗ tôi tự chọn.** Biên bản audit F17 (64/75)
   * nêu đúng vấn đề: cổng phụ huynh tính trung bình chỉ trên **cột đã công bố**
   * (`queries.ts`), còn bảng điểm nội bộ tính trên **mọi** cột `is_active` qua
   * `v_student_weighted_average` ⇒ hai màn hình nói hai con số khác nhau và
   * không chỗ nào giải thích, nên phụ huynh chất vấn Giáo lý viên.
   *
   * `08_ACCEPTANCE_CRITERIA` AC-07-01 viết là *"tính trên 3/5 cột đã công bố"*,
   * trong đó **5 là tổng số cột của lớp** — nhưng đúng tài liệu ấy, AC-02-03 lại
   * đòi phụ huynh *"không thấy dấu vết cột tồn tại"*, và `07_IMPLEMENTATION_IMPACT`
   * §4 cấm tuyệt đối việc nới policy đọc của cổng. Ba câu ấy không thể cùng đúng:
   * `assessments_select_scope` chỉ cho phụ huynh thấy dòng `is_published`, nên
   * muốn có con số 5 phải mở thêm một cửa đọc mới — tức **nói cho phụ huynh biết
   * lớp còn 2 cột chưa công bố**. Chủ dự án chốt: không mở.
   *
   * Vậy nên `publishedCount` = số cột lớp **đã công bố** (phụ huynh vốn đã nhìn
   * thấy đủ chúng trong bảng ngay bên dưới, kể cả cột chưa có điểm), và
   * `scoredCount` = số cột trong đó em ấy **có điểm** — đúng mẫu số của phép
   * trung bình. Không con số nào rò rỉ sự tồn tại của cột nội bộ.
   */
  publishedCount: number;
  scoredCount: number;
  assessments: PublishedResultAssessment[];
  comments: Array<{ id: string; content: string; commentDate: string; authorName: string }>;
  leaderboards: PublishedResultLeaderboard[];
}

async function getOwnedStudentDirectory(
  profileId: string,
  audience: AppAudience | null,
): Promise<{ status: Extract<PortalDataStatus, "not_linked" | "no_children" | "ok">; studentIds: string[] }> {
  const supabase = await createClient();
  const [{ data: guardian, error: guardianError }, { data: selfStudent, error: selfError }] = await Promise.all([
    supabase.from("guardians").select("id").eq("profile_id", profileId).maybeSingle(),
    supabase.from("students").select("id").eq("profile_id", profileId).maybeSingle(),
  ]);
  if (guardianError) throw guardianError;
  if (selfError) throw selfError;

  const ids = new Set<string>();
  if (audience !== "guardian" && selfStudent) ids.add(selfStudent.id);
  if (guardian) {
    const { data: children, error: childrenError } = await supabase
      .from("students")
      .select("id")
      .eq("guardian_id", guardian.id);
    if (childrenError) throw childrenError;
    for (const child of children ?? []) ids.add(child.id);
  }

  if (ids.size > 0) return { status: "ok", studentIds: [...ids] };
  if (audience === "guardian" && guardian) return { status: "no_children", studentIds: [] };
  return { status: "not_linked", studentIds: [] };
}

async function getPublishedPortalResults(
  profileId: string,
  audience: AppAudience | null,
  academicYearId: string,
): Promise<{
  status: PortalDataStatus;
  results: PublishedPortalResult[];
}> {
  const supabase = await createClient();
  const ownership = await getOwnedStudentDirectory(profileId, audience);
  if (ownership.studentIds.length === 0) return { status: ownership.status, results: [] };
  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id, student_id, class_id, students(saint_name, full_name), classes(display_name, academic_years(code))")
    .eq("academic_year_id", academicYearId)
    .in("student_id", ownership.studentIds);
  if (enrollmentError) throw enrollmentError;
  const enrollments = (enrollmentData ?? []) as unknown as Array<{
    id: string;
    student_id: string;
    class_id: string;
    students: { saint_name: string; full_name: string } | null;
    classes: { display_name: string; academic_years: { code: string } | null } | null;
  }>;
  const classIds = [...new Set(enrollments.map((item) => item.class_id))];
  const enrollmentIds = enrollments.map((item) => item.id);
  if (classIds.length === 0) return { status: "no_enrollment", results: [] };

  const [assessmentResult, scoreResult, commentResult, leaderboardResult] = await Promise.all([
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
  if (assessmentResult.error) throw assessmentResult.error;
  if (scoreResult.error) throw scoreResult.error;
  if (commentResult.error) throw commentResult.error;
  if (leaderboardResult.error) throw leaderboardResult.error;

  const assessments = assessmentResult.data;
  const scores = scoreResult.data;
  const comments = commentResult.data;
  const leaderboards = leaderboardResult.data;

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

  const results = enrollments.map((enrollment) => {
    const scoreMap = scoresByEnrollment.get(enrollment.id) ?? new Map();
    const published = (assessments ?? []).filter((assessment) => assessment.class_id === enrollment.class_id);
    let weightedTotal = 0;
    let weightTotal = 0;
    let scoredCount = 0;
    const portalAssessments = published.map((assessment) => {
      const score = scoreMap.get(assessment.id) ?? null;
      const weight = Number(assessment.weight);
      if (score !== null) {
        weightedTotal += score * weight;
        weightTotal += weight;
        scoredCount += 1;
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
      publishedCount: published.length,
      scoredCount,
      assessments: portalAssessments,
      comments: commentsByEnrollment.get(enrollment.id) ?? [],
      leaderboards: leaderboardByClass.get(enrollment.class_id) ?? [],
    };
  }).sort((left, right) => left.studentName.localeCompare(right.studentName, "vi"));

  const hasPublishedData = results.some(
    (result) => result.assessments.length > 0 || result.comments.length > 0 || result.leaderboards.length > 0,
  );
  return { status: hasPublishedData ? "ok" : "no_data", results };
}

export async function getResultsPageData(): Promise<{
  audience: AppAudience | null;
  year: { id: string; code: string } | null;
  classes: ResultHubClass[];
  portal: PublishedPortalResult[];
  portalStatus: PortalDataStatus;
}> {
  const context = await requireRouteAccess("/results");
  const supabase = await createClient();
  const { data: year, error: yearError } = await supabase
    .from("academic_years")
    .select("id, code")
    .eq("status", "current")
    .maybeSingle();
  if (yearError) throw yearError;
  if (!year) {
    return { audience: context.audience, year, classes: [], portal: [], portalStatus: "no_data" };
  }
  const portalDirectory = await getPublishedPortalResults(context.profileId, context.audience, year.id);
  if (context.role === "guardian" || context.role === "student") {
    return {
      audience: context.audience,
      year,
      classes: [],
      portal: portalDirectory.results,
      portalStatus: portalDirectory.status,
    };
  }

  const visible = await getVisibleResultClassIds(context, supabase);
  if (visible !== null && visible.size === 0) {
    return { audience: context.audience, year, classes: [], portal: portalDirectory.results, portalStatus: portalDirectory.status };
  }
  let classQuery = supabase
    .from("classes")
    .select("id, display_name")
    .eq("academic_year_id", year.id)
    .eq("status", "active")
    .order("display_name");
  if (visible !== null) classQuery = classQuery.in("id", [...visible]);
  const { data: classes, error: classError } = await classQuery;
  if (classError) throw classError;
  const classIds = (classes ?? []).map((item) => item.id);
  if (classIds.length === 0) {
    return { audience: context.audience, year, classes: [], portal: portalDirectory.results, portalStatus: portalDirectory.status };
  }

  const [assessmentResult, lockResult] = await Promise.all([
    supabase.from("assessments").select("id, class_id").in("class_id", classIds).eq("is_active", true),
    supabase.from("gradebook_locks").select("class_id, is_locked").in("class_id", classIds),
  ]);
  if (assessmentResult.error) throw assessmentResult.error;
  if (lockResult.error) throw lockResult.error;
  const assessments = assessmentResult.data;
  const locks = lockResult.data;
  const assessmentCount = new Map<string, number>();
  for (const item of assessments ?? []) assessmentCount.set(item.class_id, (assessmentCount.get(item.class_id) ?? 0) + 1);
  const lockMap = new Map((locks ?? []).map((item) => [item.class_id, item.is_locked] as const));
  const gradeability = await Promise.all((classes ?? []).map((item) => canGradeClass(context, supabase, item.id)));

  return {
    audience: context.audience,
    year,
    portal: portalDirectory.results,
    portalStatus: portalDirectory.status,
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
  const [{ data: assessments }, { data: enrollments }, { data: scores }, { data: averages }, { data: lock }, { data: comments }, { data: leaderboards }, { data: typeSettings }] = await Promise.all([
    // M07-C · nợ #21 — **bỏ bộ lọc `is_active`**, rồi tách hai danh sách bên
    // dưới. Một truy vấn thay vì hai: bảng này mỗi lớp chỉ vài dòng, và tách ở
    // đây thì hai danh sách chắc chắn cùng một lượt đọc, không lệch nhau khi có
    // người vừa ẩn một cột giữa hai truy vấn.
    supabase
      .from("assessments")
      .select("id, kind, title, assessment_date, weight, max_score, attendance_component, is_published, is_active")
      .eq("class_id", classId)
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
      .select("id, enrollment_id, visibility, content, comment_date, author_profile_id, profiles!student_comments_author_profile_id_fkey(display_name)")
      .eq("class_id", classId)
      .order("comment_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("leaderboards")
      .select("id, title, source_type, source_assessment_id, is_published, published_at, leaderboard_entries(enrollment_id, rank, score, saint_name_snapshot, full_name_snapshot), leaderboard_snapshots(id)")
      .eq("class_id", classId)
      .order("created_at", { ascending: false }),
    supabase
      .from("assessment_type_settings")
      .select("kind, default_weight")
      .eq("academic_year_id", classRow.academic_year_id)
      .eq("is_active", true),
  ]);

  const defaultWeights: Partial<Record<AssessmentKind, number>> = {};
  for (const setting of typeSettings ?? []) defaultWeights[setting.kind] = Number(setting.default_weight);

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
      canModerate: canModerateComment(context, classId, comment.author_profile_id),
    });
    commentsByEnrollment.set(comment.enrollment_id, list);
  }

  /**
   * M07-B · TB-M07-01 — đếm **điểm thật** của từng cột, từ chính mảng ô điểm đã
   * tải. Ô rỗng không được tính; đó là toàn bộ điểm khác nhau giữa "xóa được" và
   * "chỉ ẩn được".
   */
  const scoredCountByAssessment = new Map<string, number>();
  for (const item of scores ?? []) {
    if (item.score === null) continue;
    scoredCountByAssessment.set(item.assessment_id, (scoredCountByAssessment.get(item.assessment_id) ?? 0) + 1);
  }

  // M07-C · nợ #21 — một lần dựng, hai danh sách. `isActive` đứng **ngoài**
  // `GradebookAssessment`: mỗi danh sách đã tự nói ra trạng thái của mình, và
  // để cờ ấy lọt vào kiểu chung là mời mọc một nhánh `if (isActive)` thứ hai ở
  // tầng giao diện.
  const assessmentRows = (assessments ?? []).map((item) => ({
    isActive: item.is_active,
    assessment: {
      id: item.id,
      kind: item.kind,
      title: item.title,
      assessmentDate: item.assessment_date,
      weight: Number(item.weight),
      maxScore: Number(item.max_score),
      attendanceComponent: item.attendance_component,
      isPublished: item.is_published,
      scoredCount: scoredCountByAssessment.get(item.id) ?? 0,
    },
  }));

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
    // M07-B · D-74 + D-151. Phép tính cũ liệt kê tay năm vai trò và **không
    // kiểm lớp** — xem `canLockGradebook` để biết ba tầng đã lệch nhau ra sao.
    canLock: canLockGradebook(context, classId),
    canUnlock: context.role === "super_admin",
    canManageTop5,
    top5Enabled: classRow.academic_years.top5_enabled,
    isLocked: lock?.is_locked ?? false,
    lockedAt: lock?.locked_at ?? null,
    defaultWeights,
    assessments: assessmentRows.filter((row) => row.isActive).map((row) => row.assessment),
    hiddenAssessments: assessmentRows.filter((row) => !row.isActive).map((row) => row.assessment),
    students: studentRows,
    leaderboards: (leaderboards ?? []).map((leaderboard) => ({
      id: leaderboard.id,
      title: leaderboard.title,
      sourceType: leaderboard.source_type,
      sourceAssessmentId: leaderboard.source_assessment_id,
      isPublished: leaderboard.is_published,
      publishedAt: leaderboard.published_at,
      // `published_at` không bao giờ bị xóa đi, kể cả sau khi ẩn — nên nó là
      // phép thử đúng cho "đã từng chốt danh sách", còn `is_published` chỉ nói
      // được "đang hiện hay không".
      hasSnapshot: leaderboard.published_at !== null,
      supersededCount: leaderboard.leaderboard_snapshots.length,
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
