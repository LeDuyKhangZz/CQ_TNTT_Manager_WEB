/**
 * Dịch lỗi của module Giáo án sang **mã nghiệp vụ + câu tiếng Việt** — M06-A,
 * phần **cục bộ** của hạng mục #2 (`07_IMPLEMENTATION_IMPACT` §1) / **TB-M06-02**.
 *
 * 🔴 **Phần dùng chung toàn hệ thống CỐ Ý chưa làm ở đây.** `04_TO_BE_FLOWS`
 * TB-M06-02 đề nghị thêm `AppErrorDetail`/`fieldErrors` vào `src/lib/errors`, và
 * biên bản audit §"5 Whys" kết luận nguyên nhân gốc là **cross-module**, không
 * riêng M06. `07` §2 khuyên làm tầng ấy **cùng lúc với M07** để khỏi sửa hai
 * lần. Nên đợt này chỉ đóng phần nằm gọn trong module — đủ để đóng **TB-03** và
 * **TB-04** của `08_ACCEPTANCE_CRITERIA` — và không đụng một dòng nào của
 * `src/lib/errors`.
 *
 * Hai lỗ hổng được đóng ở đây, cả hai đều làm hệ thống **nuốt mất câu trả lời
 * đã có sẵn**:
 *
 *   1. `failure()` chỉ giữ `message` khi lỗi là `AppError`, nên **mọi** `ZodError`
 *      rơi vào nhánh mặc định *"Không thể lưu giáo án. Vui lòng thử lại."* —
 *      kể cả câu `"Bài học phải có người dạy."` đã được viết rất kỹ trong
 *      `schemas.ts` từ Phase 4 và **chưa từng hiện ra màn hình một lần nào**.
 *   2. `mapDatabaseError` gán cứng *"Ngày này đã có một mục giáo án."* cho **mọi**
 *      mã `23505`. Hai người cùng bấm "Tạo giáo án" cho một lớp thì người sau
 *      đọc một câu về "ngày" trong khi họ **không hề nhập ngày nào** — biểu mẫu
 *      tạo giáo án chỉ có đúng một ô tên.
 *
 * Hàm thuần, không import runtime nào ngoài kiểu, để kiểm được bằng unit test.
 */

import type { AppErrorCode } from "@/lib/errors";

/**
 * Nợ #18 — câu tiếng Việt cho hàng rào năm học đã đóng (M06-B).
 *
 * 🔴 **Hằng số này nằm ở đây chứ KHÔNG nằm trong `server/actions.ts`, và đó là
 * bắt buộc.** Một file mang `"use server"` **chỉ được export hàm async**; thêm
 * một `export const` chuỗi vào đó làm cả trang `/teaching-plan/[classId]` chết
 * bằng `A "use server" file can only export async functions, found string`.
 *
 * Cái bẫy nằm ở chỗ **không một cửa kiểm nào bắt được**: `lint` · `typecheck` ·
 * `test` · `build` đều xanh, lỗi chỉ nổ khi trang được dựng thật. Đây là bản
 * sinh đôi của bẫy `"use client"` mà dự án đã trả giá một lần.
 */
export const TEACHING_PLAN_CLOSED_YEAR_MESSAGE =
  "Năm học của lớp này đã đóng nên giáo án chỉ còn để đọc. Muốn sửa thì Quản trị " +
  "viên hệ thống phải mở lại năm học trước.";

export interface DbErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}

export interface TeachingPlanFailure {
  appCode: AppErrorCode;
  message: string;
}

/**
 * Quy ước mã lỗi của repo: tên luật nghiệp vụ nằm trong **thông điệp**, không
 * phải trong mã số SQL — bốn luật dưới đây đều mang chung mã `23514`, nên đọc
 * mã số thì không phân biệt được chúng.
 */
const RULE_MESSAGES: ReadonlyArray<readonly [string, TeachingPlanFailure]> = [
  [
    "TEACHING_PLAN_DATE_OUTSIDE_YEAR",
    {
      appCode: "VALIDATION_ERROR",
      message: "Ngày dự kiến phải nằm trong năm học của lớp. Hãy chọn lại ngày.",
    },
  ],
  [
    "TEACHING_PLAN_TEACHER_OUT_OF_CLASS",
    {
      appCode: "VALIDATION_ERROR",
      message:
        "Người dạy không thuộc đội ngũ lớp vào ngày này. Hãy chọn người khác, " +
        "hoặc cập nhật phân công đội ngũ lớp ở trang Nhân sự trước.",
    },
  ],
  [
    "TEACHING_PLAN_ITEM_CANNOT_MOVE",
    {
      appCode: "VALIDATION_ERROR",
      message: "Không chuyển được một mục sang giáo án của lớp khác.",
    },
  ],
  [
    "TEACHING_PLAN_NOT_FOUND",
    { appCode: "RESOURCE_NOT_FOUND", message: "Không tìm thấy giáo án của lớp này." },
  ],
];

/**
 * Tên ràng buộc `unique`/`check` do Postgres nhét vào thông điệp lỗi.
 * `teaching_plans_class_id_key` là tên Postgres tự đặt cho `class_id ... unique`.
 */
const CONSTRAINT_MESSAGES: ReadonlyArray<readonly [string, TeachingPlanFailure]> = [
  [
    "teaching_plan_items_one_per_date",
    { appCode: "CONFLICT", message: "Ngày này đã có một mục giáo án. Mỗi ngày chỉ có một mục." },
  ],
  [
    "teaching_plans_class_id_key",
    {
      appCode: "CONFLICT",
      message:
        "Lớp này đã có kế hoạch giảng dạy — có thể vừa có người khác tạo. " +
        "Hãy tải lại trang để xem kế hoạch đang có.",
    },
  ],
  [
    "teaching_plan_lesson_has_teacher",
    { appCode: "VALIDATION_ERROR", message: "Bài học phải có người dạy." },
  ],
];

export function classifyTeachingPlanDbError(error: DbErrorLike | null): TeachingPlanFailure {
  const haystack = `${error?.message ?? ""} ${error?.details ?? ""}`;

  for (const [needle, failure] of RULE_MESSAGES) {
    if (haystack.includes(needle)) return failure;
  }
  for (const [needle, failure] of CONSTRAINT_MESSAGES) {
    if (haystack.includes(needle)) return failure;
  }

  switch (error?.code) {
    case "42501":
      return { appCode: "FORBIDDEN", message: "Bạn không có quyền sửa giáo án của lớp này." };
    case "23505":
      return { appCode: "CONFLICT", message: "Dữ liệu này đã tồn tại. Hãy tải lại trang rồi thử lại." };
    case "23503":
      return { appCode: "RESOURCE_NOT_FOUND", message: "Không tìm thấy dữ liệu liên quan." };
    default:
      return { appCode: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." };
  }
}

/* ========================================================================== */

/** Tên trường hiện ra màn hình — đúng nhãn người dùng đang nhìn thấy. */
const FIELD_LABELS: Readonly<Record<string, string>> = {
  plannedDate: "Ngày dự kiến",
  title: "Tên bài / tên bài kiểm tra",
  teacherStaffId: "Người dạy",
  itemType: "Loại mục",
  objectives: "Mục tiêu",
  catechismContent: "Nội dung giáo lý",
  scriptureContent: "Lời Chúa",
  game: "Trò chơi",
  song: "Bài hát",
  homework: "Bài tập về nhà",
  preparation: "Chuẩn bị",
  note: "Ghi chú nội bộ",
  classId: "Lớp",
  planId: "Giáo án",
  teachingPlanId: "Giáo án",
  itemId: "Mục giáo án",
};

/** Hình dạng tối thiểu của một `ZodIssue` — không phụ thuộc phiên bản zod. */
export interface ZodIssueLike {
  code?: string;
  path?: ReadonlyArray<string | number>;
  message?: string;
  maximum?: number | bigint;
}

function labelOf(path: ReadonlyArray<string | number> | undefined): string | null {
  const first = path?.find((part) => typeof part === "string");
  return typeof first === "string" ? (FIELD_LABELS[first] ?? null) : null;
}

/**
 * Một `ZodIssue` thành một câu tiếng Việt **gọi tên trường bị sai**.
 *
 * Thông điệp `custom` do chính `schemas.ts` viết được giữ nguyên văn — đó là
 * câu nghiệp vụ đã cân nhắc kỹ (*"Bài học phải có người dạy."*), không việc gì
 * phải diễn đạt lại. Các mã còn lại thì zod sinh câu **tiếng Anh** (*"String
 * must contain at least 1 character(s)"*), nên phải tự viết.
 */
export function describeZodIssue(issue: ZodIssueLike): string {
  if (issue.code === "custom" && issue.message) return issue.message;

  const label = labelOf(issue.path);
  if (!label) return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";

  switch (issue.code) {
    case "too_small":
      return `Chưa nhập ${label}.`;
    case "too_big":
      return issue.maximum === undefined
        ? `${label} dài quá giới hạn cho phép.`
        : `${label} dài quá ${issue.maximum} ký tự.`;
    case "invalid_type":
      return `Chưa nhập ${label}.`;
    default:
      return `${label} không đúng định dạng.`;
  }
}

/**
 * Gộp danh sách `issues` thành **một** câu cho `FormMessage`.
 *
 * Lấy tối đa ba câu: một biểu mẫu 12 trường điền sai hết thì một dải chữ dài
 * bằng cả màn hình không giúp gì hơn ba câu đầu, mà lại đẩy nút "Lưu" ra khỏi
 * tầm nhìn. Số còn lại được **đếm ra** chứ không giấu đi.
 */
export function describeZodIssues(issues: readonly ZodIssueLike[]): string {
  const messages: string[] = [];
  for (const issue of issues) {
    const text = describeZodIssue(issue);
    if (!messages.includes(text)) messages.push(text);
  }
  if (messages.length === 0) return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
  if (messages.length <= 3) return messages.join(" ");
  return `${messages.slice(0, 3).join(" ")} (và ${messages.length - 3} lỗi khác)`;
}
