import "server-only";

import { requireRouteAccess } from "@/lib/auth/guards";
import { hasGlobalWrite } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAcademicYear } from "@/features/academic-years/server/queries";
import type { PromotionFinalStatus, PromotionProposalStatus } from "../constants";
import { batchCandidatesOf, type PromotionBatchCandidate } from "../batch-proposal";
import {
  buildClassProgress,
  clampPromotionPage,
  filterPromotionRows,
  PROMOTION_PAGE_SIZE,
  type PromotionBoardCriteria,
  type PromotionClassProgress,
} from "../promotion-directory";
import type { PromotionWarningSnapshot } from "../sacrament-warning";
import { sortPromotionEvents, type PromotionEventType, type PromotionReviewEvent } from "../review-journal";
import { canReviewSector, getRepresentativeClassIds } from "./permissions";

export interface PromotionTargetOption {
  id: string;
  displayName: string;
  academicYearCode: string;
  yearStart: string;
  gradeLevelId: string | null;
  sectionCode: string | null;
  classKind: "catechism" | "trainee";
}

export interface PromotionClassOption {
  id: string;
  displayName: string;
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
  /**
   * **M08-C, hạng mục 8** — tên người đề xuất / người duyệt, lấy từ cửa sổ hẹp
   * `list_promotion_actor_names`. `null` khi tài khoản đã bị xoá hoặc không nằm
   * trong phạm vi cửa sổ; giao diện in vai trò thay cho một dấu gạch trống.
   */
  proposedByName: string | null;
  reviewedByName: string | null;
  warningSnapshot: PromotionWarningSnapshot;
  /** D-157 — nhật ký quyết định, đã sắp theo thứ tự kể chuyện. */
  events: PromotionReviewEvent[];
}

export interface PromotionRosterItem {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  /** Nhánh A/B của lớp NGUỒN — BR-M08-X2 cần nó để chọn lớp đích mặc định. */
  sectionCode: string | null;
  yearCode: string;
  yearStart: string;
  gradeLevelId: string | null;
  nextGradeLevelId: string | null;
  sourceSectorId: string | null;
  canProposeTrainee: boolean;
  canPropose: boolean;
  canReview: boolean;
  /**
   * **D-159** — bốn vai trò cấp xứ đoàn thấy một nút *"Chuyển lớp"* thay cho hai
   * biểu mẫu. Chỉ quyết định **hiện nút**; hàng rào thật là `app.can_global_write()`
   * bên trong `public.promote_enrollment_now` (`AGENTS` §5).
   */
  canTransferDirectly: boolean;
  /** Ghi danh còn mở (`active`/`paused`) — dùng để đếm sĩ số lớp. */
  enrollmentOpen: boolean;
  finalStatus: PromotionFinalStatus | null;
  review: PromotionReviewItem | null;
}

export interface PromotionsPageData {
  yearCode: string | null;
  roster: PromotionRosterItem[];
  progress: PromotionClassProgress[];
  classOptions: PromotionClassOption[];
  targets: PromotionTargetOption[];
  page: number;
  pageSize: number;
  totalItems: number;
  /**
   * **M08-C / AC-20** — mọi em **khớp bộ lọc** mà đề xuất hàng loạt áp được, kể
   * cả em ở trang sau (chủ dự án chốt 2026-08-08).
   *
   * 🔴 Nó **không** là `roster.filter(...)`: `roster` đã bị cắt về đúng 25 dòng
   * của trang đang xem, nên dựng danh sách chọn từ đó là bỏ quên em thứ 26 trở
   * đi — đúng thứ quyết định trên vừa bác. Danh sách này lấy từ tập **đã lọc,
   * chưa cắt trang**, và **không tốn thêm một truy vấn nào** vì tập ấy đã nằm
   * sẵn trong bộ nhớ ở bước lọc.
   */
  selectable: PromotionBatchCandidate[];
  /** `classId` trên URL không nằm trong phạm vi đọc được — TO-BE 1 "Validation". */
  unknownClassFilter: boolean;
}

interface RawEnrollment {
  id: string;
  status: string;
  student_id: string;
  class_id: string;
  students: { saint_name: string; full_name: string } | null;
  classes: {
    display_name: string;
    section_code: string | null;
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

const OPEN_ENROLLMENT_STATUSES = ["active", "paused"];

/**
 * Dữ liệu trang `/promotions` — **M08-A, TO-BE 1 / AC-12 / AC-13**.
 *
 * 🔴 **Bản cũ là lỗi `CRITICAL` duy nhất của module** (M08-F01, 38/75): nó gọi
 * `canProposeForClass` — hai truy vấn — **cho từng ghi danh** trong một
 * `Promise.all`, và đọc **mọi năm học** không phân trang. Với ~900 em đó là
 * ~1.800 lượt đi về cơ sở dữ liệu cho một lượt mở trang.
 *
 * Bản này dùng **4–6 lượt gọi cố định**, không phụ thuộc số dòng (AC-13 đòi ≤ 6):
 *
 *   1. `getCurrentAcademicYear()` — `React.cache`, vỏ ứng dụng đã gọi rồi nên
 *      thường tốn **0**.
 *   2. `classes` đang hoạt động của **mọi** năm — vừa là bộ chọn lớp, vừa là danh
 *      sách lớp đích (lớp đích thuộc năm SAU, nên không lọc theo năm được).
 *   3. `enrollments` của năm hiện hành.
 *   4. `promotion_reviews` của năm hiện hành.
 *   5. `list_promotion_actor_names` — cửa sổ hẹp tên người đề xuất/người duyệt
 *      (**M08-C**, hạng mục 8).
 *   6+7. `staff_profiles` + `class_staff_assignments` — **chỉ với người không
 *      thuộc cấp xứ đoàn ghi được**, và **một lần cho cả trang** thay cho hai
 *      lần mỗi dòng.
 *
 * ⚠️ **M08-C đưa trang này chạm đúng trần 6 của AC-13** (bản M08-A dùng 3–5).
 * Ai thêm một thứ cần đọc nữa vào trang phải **gộp vào một trong các lượt đang
 * có**, không được thêm lượt thứ bảy.
 *
 * ⚠️ Lọc và cắt trang làm trong Node chứ không trong SQL — lý do đo được ghi ở
 * `filterPromotionRows`. RLS vẫn là hàng rào thật (`04_TO_BE_FLOWS` TO-BE 1 mục
 * "Permission"): với Trưởng ngành, `enrollments_select_scope` đã thu danh sách
 * về đúng ngành của họ trước khi một dòng nào tới được đây.
 *
 * **BR-M08-14 — chỉ ghi danh của năm học hiện hành.** Bản cũ đọc mọi năm
 * (BR-M08-Y3), nên đề xuất đã duyệt của các năm trước cứ tích tụ mãi trên cùng
 * một màn hình với việc đang phải làm.
 */
export async function getPromotionsPageData(
  criteria: PromotionBoardCriteria,
): Promise<PromotionsPageData> {
  const context = await requireRouteAccess("/promotions");
  const supabase = await createClient();
  const year = await getCurrentAcademicYear();

  if (!year) {
    return {
      yearCode: null,
      roster: [],
      progress: [],
      classOptions: [],
      targets: [],
      page: 1,
      pageSize: PROMOTION_PAGE_SIZE,
      totalItems: 0,
      selectable: [],
      unknownClassFilter: false,
    };
  }

  const [
    { data: classData },
    { data: enrollmentData },
    { data: reviewData },
    { data: actorData },
    representativeClassIds,
  ] = await Promise.all([
      supabase
        .from("classes")
        .select("id, display_name, grade_level_id, section_code, class_kind, academic_years(code, start_date)")
        .eq("status", "active")
        .order("display_name"),
      supabase
        .from("enrollments")
        .select("id, status, student_id, class_id, students(saint_name, full_name), classes(display_name, section_code, academic_years(code, start_date), grade_levels(id, next_grade_level_id, can_propose_trainee, sector_id))")
        .eq("academic_year_id", year.id),
      // 🔴 Nhật ký D-157 đi **kèm trong chính lượt gọi này**, không thành một
      // truy vấn thứ sáu. AC-13 cho trần **6** lượt gọi và bản M08-A đã dùng tới
      // 5 với người không thuộc cấp xứ đoàn — thêm một lượt nữa là chạm trần, tức
      // hạng mục kế tiếp cần đọc thêm bất cứ thứ gì sẽ **vượt**. PostgREST nhúng
      // được vì `promotion_review_events.review_id` là khoá ngoại về bảng này.
      supabase
        .from("promotion_reviews")
        .select("*, promotion_review_events(event_no, event_type, note, actor_id, occurred_at)")
        .eq("source_academic_year_id", year.id)
        .order("proposed_at", { ascending: false }),
      // 🔴 **Lượt gọi thứ sáu, và nó chạm ĐÚNG TRẦN AC-13** ("số truy vấn ≤ 6,
      // không phụ thuộc số dòng"). Đếm cho người **không** thuộc cấp xứ đoàn ghi
      // được — ca tốn nhất: năm học (thường 0 nhờ `React.cache`) · lớp · ghi danh
      // · đề xuất · **tên người** · hai lượt tra phân công = 6 lượt thật. Hạng
      // mục nào sau này cần đọc thêm bất cứ thứ gì trên trang này sẽ **vượt
      // trần**, và phải gộp vào một trong sáu lượt đang có chứ không thêm lượt
      // thứ bảy.
      //
      // Không nhúng được `profiles(display_name)` vào lượt gọi `promotion_reviews`
      // ở trên: `profiles_select_self_or_global` đóng cửa với chính hai vai trò
      // dùng trang này, nên phép nhúng sẽ trả `null` **trong im lặng**. Xem
      // migration `20260808000100`.
      supabase.rpc("list_promotion_actor_names", { p_academic_year_id: year.id }),
      getRepresentativeClassIds(context, supabase),
    ]);

  const reviews = new Map((reviewData ?? []).map((item) => [item.source_enrollment_id, item] as const));
  const actorNames = new Map(
    (actorData ?? []).map((item) => [item.profile_id, item.display_name] as const),
  );
  const actorNameOf = (profileId: string | null): string | null =>
    (profileId ? actorNames.get(profileId) ?? null : null);

  // Giữ ghi danh còn mở, cộng những ghi danh đã đóng mà CÓ đề xuất — sau khi
  // duyệt "lên lớp", ghi danh nguồn thành `completed`, và mất nó khỏi bảng là
  // người duyệt không còn thấy việc mình vừa làm.
  const rows = ((enrollmentData ?? []) as unknown as RawEnrollment[])
    .filter((item) => OPEN_ENROLLMENT_STATUSES.includes(item.status) || reviews.has(item.id))
    .map((item): PromotionRosterItem => {
      const review = reviews.get(item.id);
      const grade = item.classes?.grade_levels;
      return {
        enrollmentId: item.id,
        studentId: item.student_id,
        studentName: studentName(item.students),
        classId: item.class_id,
        className: item.classes?.display_name ?? "—",
        sectionCode: item.classes?.section_code ?? null,
        yearCode: item.classes?.academic_years?.code ?? "—",
        yearStart: item.classes?.academic_years?.start_date ?? "",
        gradeLevelId: grade?.id ?? null,
        nextGradeLevelId: grade?.next_grade_level_id ?? null,
        sourceSectorId: grade?.sector_id ?? null,
        canProposeTrainee: grade?.can_propose_trainee ?? false,
        canPropose: representativeClassIds === null || representativeClassIds.has(item.class_id),
        canReview: canReviewSector(context, grade?.sector_id ?? null),
        canTransferDirectly: hasGlobalWrite(context.role),
        enrollmentOpen: OPEN_ENROLLMENT_STATUSES.includes(item.status),
        finalStatus: (review?.final_status as PromotionFinalStatus | undefined) ?? null,
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
          proposedByName: actorNameOf(review.proposed_by),
          reviewedByName: actorNameOf(review.reviewed_by),
          warningSnapshot: (review.warning_snapshot ?? {}) as PromotionWarningSnapshot,
          events: sortPromotionEvents(
            (review.promotion_review_events ?? []).map((event) => ({
              eventNo: event.event_no,
              eventType: event.event_type as PromotionEventType,
              note: event.note,
              actorId: event.actor_id,
              actorName: actorNameOf(event.actor_id),
              occurredAt: event.occurred_at,
            })),
          ),
        } : null,
      };
    })
    .sort((left, right) =>
      `${left.className} ${left.studentName}`.localeCompare(
        `${right.className} ${right.studentName}`,
        "vi",
      ),
    );

  // Bảng tiến độ đếm trên **cả phạm vi**, cố ý dựng TRƯỚC khi lọc — bài học
  // M12-B: một phép đếm chạy sau bộ lọc sẽ nói "đã xong" trong khi chưa.
  const progress = buildClassProgress(rows);

  const classOptions: PromotionClassOption[] = progress.map((entry) => ({
    id: entry.classId,
    displayName: entry.className,
  }));

  // TO-BE 1 "Validation": `classId` lạ thì **hiện lại bộ chọn kèm thông báo,
  // không `throw`**. Lạ ở đây gồm cả lớp có thật nhưng người xem không đọc được
  // — và câu trả lời phải giống hệt nhau ở hai ca, nếu không đường dẫn trở thành
  // một cái máy dò xem lớp nào tồn tại.
  const unknownClassFilter =
    criteria.classId !== "all" && !classOptions.some((option) => option.id === criteria.classId);
  const effectiveCriteria: PromotionBoardCriteria = unknownClassFilter
    ? { ...criteria, classId: "all" }
    : criteria;

  const filtered = filterPromotionRows(rows, effectiveCriteria);
  const page = clampPromotionPage(effectiveCriteria.page, filtered.length);
  const from = (page - 1) * PROMOTION_PAGE_SIZE;

  const targets = (classData ?? []).flatMap((item) => item.academic_years ? [{
    id: item.id,
    displayName: item.display_name,
    academicYearCode: item.academic_years.code,
    yearStart: item.academic_years.start_date,
    gradeLevelId: item.grade_level_id,
    sectionCode: item.section_code,
    classKind: item.class_kind,
  }] : []) as PromotionTargetOption[];

  return {
    yearCode: year.code,
    roster: filtered.slice(from, from + PROMOTION_PAGE_SIZE),
    progress,
    classOptions,
    targets,
    page,
    pageSize: PROMOTION_PAGE_SIZE,
    totalItems: filtered.length,
    // AC-20 — dựng từ `filtered` (đã lọc, **chưa cắt trang**), không từ `roster`.
    selectable: batchCandidatesOf(filtered),
    unknownClassFilter,
  };
}
