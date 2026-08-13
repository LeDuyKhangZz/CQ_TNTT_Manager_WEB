/**
 * M07-A — dịch lỗi của module Bảng điểm sang **mã nghiệp vụ + câu tiếng Việt**.
 *
 * Đóng phần trừ điểm mà `03_AUDIT_RESULTS` §"Trừ điểm chung nhiều luồng" xếp đầu
 * bảng: *"`ZodError` bị nuốt thành 'Không thể lưu bảng điểm. Vui lòng thử lại.'"*
 * — ảnh hưởng **sáu** luồng F02 · F03 · F06 · F09 · F13 · F15.
 *
 * 🔴 **Câu cũ không chỉ vô dụng, nó nói sai.** *"Vui lòng thử lại"* là một lời
 * hứa rằng bấm lại sẽ được; với lỗi validation thì bấm lại **hỏng y hệt**, và
 * người dùng không có cách nào biết ô nào sai. Câu đúng đã nằm sẵn trong
 * `schemas.ts` từ Phase 5 (*"Điểm chuyên cần phải chọn Thánh lễ hoặc Giáo lý."*,
 * *"Hệ số phải lớn hơn 0."*, *"Vui lòng chọn cột điểm nguồn."*) và **chưa từng
 * hiện ra màn hình một lần nào**.
 *
 * ⚠️ **Phần dùng chung toàn hệ thống vẫn CỐ Ý chưa làm.** M06-A đã ghi rằng
 * `AppErrorDetail`/`fieldErrors` ở `src/lib/errors` nên làm *"cùng lúc với M07"*.
 * Nhưng `07_IMPLEMENTATION_IMPACT` của **chính M07** không liệt kê hạng mục ấy,
 * và `src/lib/errors` đỡ **cả 14 module** — sửa nó là mở rộng phạm vi ra ngoài
 * đợt đã chốt (`AGENTS` §4). Nên đợt này đóng phần nằm gọn trong module, đúng
 * khuôn `teaching-plans/db-errors.ts`, và **không** đụng một dòng nào của
 * `src/lib/errors`.
 */

import type { AppErrorCode } from "@/lib/errors";

export interface DbErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}

export interface AssessmentFailure {
  appCode: AppErrorCode;
  message: string;
}

/**
 * Tên luật do `raise exception` của migration ném ra.
 *
 * 🔴 **Thứ tự trong mảng là bắt buộc, không phải ngẫu nhiên.** Phép dò là
 * `includes`, mà `ATTENDANCE_ASSESSMENT_NOT_FOUND` **chứa** nguyên chuỗi
 * `ASSESSMENT_NOT_FOUND`: để sau thì mọi lỗi "không tìm thấy cột chuyên cần"
 * đọc thành câu của cột điểm thường, và người dùng đi tìm sai chỗ.
 */
const RULE_MESSAGES: ReadonlyArray<readonly [string, AssessmentFailure]> = [
  [
    // M07-B · TB-M07-01 / AC-01-02. 🔴 Câu này thay cho câu cũ *"Cột đã có điểm
    // nên không thể xóa. Hãy giữ lại để bảo toàn lịch sử."* — câu ấy **nói dối
    // trong ca thường gặp nhất**: trước M07-A biểu mẫu ghi cả roster nên cột nào
    // cũng có 50 dòng rỗng, và người dùng đọc "đã có điểm" khi chưa nhập gì.
    // Nay phép thử đếm đúng dòng `score is not null`, và câu trả lời chỉ ra
    // đường đi tiếp thay vì bảo người ta chịu thua.
    "ASSESSMENT_HAS_SCORES",
    {
      appCode: "CONFLICT",
      message: "Cột này đã có điểm. Bạn có thể ẩn cột thay vì xóa.",
    },
  ],
  [
    "ASSESSMENT_IS_LEADERBOARD_SOURCE",
    {
      appCode: "CONFLICT",
      message:
        "Cột này đang là nguồn của một bảng Top 5. Hãy xóa bảng Top 5 đó trước, "
        + "hoặc ẩn cột thay vì xóa.",
    },
  ],
  [
    // M07-C · D-154. Công bố một cột đã ẩn là thao tác **không có kết quả nhìn
    // thấy được**: cột ẩn đã biến khỏi bảng điểm, bản xuất, trung bình và cổng
    // phụ huynh từ M07-B (BR-M07-28). Đổi cờ rồi im lặng thì người dùng đi tìm
    // xem điểm hiện ra ở đâu — nên trả lời thẳng, kèm việc phải làm trước.
    "ASSESSMENT_INACTIVE",
    {
      appCode: "CONFLICT",
      message:
        "Cột này đang bị ẩn nên công bố không có tác dụng. Hãy hiện lại cột ở mục "
        + "“Cột đã ẩn”, rồi công bố.",
    },
  ],
  [
    // Nợ #18. Cùng câu chữ với `attendance` (M05-A) và `teaching-plans` (M06-B)
    // — ba module nói ba câu khác nhau cho cùng một hàng rào là cách chắc chắn
    // nhất để người dùng tưởng đó là ba lỗi khác nhau.
    "ACADEMIC_YEAR_CLOSED",
    {
      appCode: "FORBIDDEN",
      message: "Năm học này đã đóng nên không ghi thêm được. Hãy chuyển sang năm học đang áp dụng.",
    },
  ],
  [
    "ATTENDANCE_ASSESSMENT_NOT_FOUND",
    {
      appCode: "RESOURCE_NOT_FOUND",
      message: "Không tìm thấy cột điểm chuyên cần này. Có thể nó vừa bị xóa — hãy tải lại trang.",
    },
  ],
  [
    "ASSESSMENT_OR_ENROLLMENT_NOT_FOUND",
    {
      appCode: "RESOURCE_NOT_FOUND",
      message: "Không tìm thấy cột điểm hoặc thiếu nhi tương ứng. Hãy tải lại trang.",
    },
  ],
  [
    "ASSESSMENT_SCORE_NOT_FOUND",
    {
      appCode: "RESOURCE_NOT_FOUND",
      message: "Ô điểm này chưa từng được lưu nên không có gì để đặt lại.",
    },
  ],
  [
    "ASSESSMENT_NOT_FOUND",
    {
      appCode: "RESOURCE_NOT_FOUND",
      message: "Không tìm thấy cột điểm này. Có thể nó vừa bị xóa — hãy tải lại trang.",
    },
  ],
  [
    "ASSESSMENT_ENROLLMENT_MISMATCH",
    {
      appCode: "VALIDATION_ERROR",
      message: "Có thiếu nhi không thuộc lớp của cột điểm này. Hãy tải lại trang rồi nhập lại.",
    },
  ],
  [
    "ASSESSMENT_DATE_OUTSIDE_YEAR",
    {
      appCode: "VALIDATION_ERROR",
      message: "Ngày kiểm tra phải nằm trong năm học của lớp. Hãy chọn lại ngày.",
    },
  ],
  [
    "ASSESSMENT_KIND_DISABLED",
    {
      appCode: "VALIDATION_ERROR",
      message: "Loại cột điểm này đã bị tắt cho năm học hiện tại.",
    },
  ],
  [
    "SCORE_OUT_OF_RANGE",
    { appCode: "VALIDATION_ERROR", message: "Điểm phải nằm trong khoảng 0 đến 10." },
  ],
  [
    "SCORE_EXCEEDS_MAX",
    { appCode: "VALIDATION_ERROR", message: "Điểm vượt quá điểm tối đa của cột này." },
  ],
  [
    "CLASS_YEAR_MISMATCH",
    { appCode: "VALIDATION_ERROR", message: "Cột điểm không khớp năm học của lớp." },
  ],
  [
    "COMMENT_ENROLLMENT_IMMUTABLE",
    { appCode: "VALIDATION_ERROR", message: "Không chuyển được một nhận xét sang thiếu nhi khác." },
  ],
  [
    "GRADEBOOK_NOT_LOCKED",
    { appCode: "CONFLICT", message: "Bảng điểm này đang mở, không cần mở khóa." },
  ],
  [
    "GRADEBOOK_LOCKED",
    {
      appCode: "GRADEBOOK_LOCKED",
      message: "Bảng điểm đã bị khóa. Chỉ Quản trị viên hệ thống mở lại được.",
    },
  ],
  [
    "LEADERBOARD_ALREADY_PUBLISHED",
    { appCode: "CONFLICT", message: "Bảng Top 5 này đã được công bố rồi." },
  ],
  [
    "LEADERBOARD_ASSESSMENT_MISMATCH",
    { appCode: "VALIDATION_ERROR", message: "Cột điểm nguồn không thuộc lớp này." },
  ],
  [
    "LEADERBOARD_ENROLLMENT_MISMATCH",
    { appCode: "VALIDATION_ERROR", message: "Danh sách điểm thi đua có thiếu nhi không thuộc lớp này." },
  ],
  [
    "LEADERBOARD_NO_DATA",
    {
      appCode: "VALIDATION_ERROR",
      message: "Chưa đủ dữ liệu để xếp hạng — nguồn đã chọn chưa có điểm nào.",
    },
  ],
  [
    // M07-C · D-155. Lưới an toàn của đường "Hiện lại bản đang có": bật cờ công
    // bố trên một bảng chưa từng chốt sẽ cho cổng phụ huynh một bảng Top 5 rỗng.
    // Đặt **trước** `LEADERBOARD_NOT_FOUND` vì hai tên bắt đầu giống nhau và
    // phép dò là `includes` — xem ghi chú đầu mảng.
    "LEADERBOARD_NOT_SNAPSHOTTED",
    {
      appCode: "CONFLICT",
      message: "Bảng Top 5 này chưa từng chốt danh sách nên chưa có gì để hiện lại.",
    },
  ],
  [
    "LEADERBOARD_SNAPSHOT_APPEND_ONLY",
    {
      appCode: "FORBIDDEN",
      message: "Lịch sử Top 5 chỉ ghi thêm, không ai sửa hoặc xóa được — kể cả Quản trị viên hệ thống.",
    },
  ],
  [
    "LEADERBOARD_NOT_FOUND",
    { appCode: "RESOURCE_NOT_FOUND", message: "Không tìm thấy bảng Top 5 này." },
  ],
  [
    "LEADERBOARD_PUBLISHED",
    { appCode: "CONFLICT", message: "Bảng Top 5 đã công bố nên không sửa được nữa." },
  ],
  [
    "CUSTOM_SCORES_REQUIRED",
    { appCode: "VALIDATION_ERROR", message: "Đợt thi đua phải nhập điểm cho từng thiếu nhi." },
  ],
  [
    "CUSTOM_SCORE_INVALID",
    { appCode: "VALIDATION_ERROR", message: "Có ô điểm thi đua không hợp lệ." },
  ],
  [
    "TOP5_DISABLED",
    {
      appCode: "FORBIDDEN",
      message: "Quản trị viên hệ thống chưa bật tính năng Top 5 cho năm học này.",
    },
  ],
  [
    "ENROLLMENT_NOT_FOUND",
    { appCode: "RESOURCE_NOT_FOUND", message: "Không tìm thấy hồ sơ ghi danh của thiếu nhi này." },
  ],
  [
    "CLASS_NOT_FOUND",
    { appCode: "RESOURCE_NOT_FOUND", message: "Không tìm thấy lớp này." },
  ],
];

/** Tên ràng buộc do Postgres nhét vào thông điệp lỗi. */
const CONSTRAINT_MESSAGES: ReadonlyArray<readonly [string, AssessmentFailure]> = [
  [
    "assessment_scores_assessment_id_enrollment_id_key",
    {
      appCode: "CONFLICT",
      message: "Ô điểm này vừa được người khác lưu. Hãy tải lại trang để xem giá trị mới nhất.",
    },
  ],
  [
    "assessments_attendance_component",
    {
      appCode: "VALIDATION_ERROR",
      message: "Chỉ cột chuyên cần mới có thành phần Thánh lễ / Giáo lý.",
    },
  ],
  [
    "leaderboard_source_assessment",
    { appCode: "VALIDATION_ERROR", message: "Nguồn Top 5 và cột điểm nguồn không khớp nhau." },
  ],
];

export function classifyAssessmentDbError(error: DbErrorLike | null): AssessmentFailure {
  const haystack = `${error?.message ?? ""} ${error?.details ?? ""}`;

  for (const [needle, failure] of RULE_MESSAGES) {
    if (haystack.includes(needle)) return failure;
  }
  for (const [needle, failure] of CONSTRAINT_MESSAGES) {
    if (haystack.includes(needle)) return failure;
  }

  switch (error?.code) {
    case "42501":
      return { appCode: "FORBIDDEN", message: "Bạn không có quyền thao tác trên bảng điểm của lớp này." };
    case "23505":
      return { appCode: "CONFLICT", message: "Dữ liệu này đã tồn tại. Hãy tải lại trang rồi thử lại." };
    case "23503":
    case "P0002":
      return { appCode: "RESOURCE_NOT_FOUND", message: "Không tìm thấy dữ liệu liên quan." };
    case "23514":
    case "22023":
    case "22P02":
      return { appCode: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." };
    default:
      return { appCode: "CONFLICT", message: "Không thể lưu bảng điểm. Vui lòng thử lại." };
  }
}

/* ========================================================================== */

/** Tên trường hiện ra màn hình — đúng nhãn người dùng đang nhìn thấy. */
const FIELD_LABELS: Readonly<Record<string, string>> = {
  classId: "Lớp",
  assessmentId: "Cột điểm",
  kind: "Loại cột điểm",
  title: "Tên",
  assessmentDate: "Ngày kiểm tra",
  weight: "Hệ số",
  attendanceComponent: "Thành phần điểm danh",
  enrollmentId: "Thiếu nhi",
  scores: "Bảng điểm",
  score: "Điểm",
  note: "Ghi chú",
  visibility: "Mức hiển thị",
  content: "Nội dung nhận xét",
  published: "Trạng thái công bố",
  leaderboardId: "Bảng Top 5",
  sourceType: "Nguồn Top 5",
  sourceAssessmentId: "Cột điểm nguồn",
  customScores: "Điểm thi đua",
};

/** Hình dạng tối thiểu của một `ZodIssue` — không phụ thuộc phiên bản zod. */
export interface ZodIssueLike {
  code?: string;
  path?: ReadonlyArray<string | number>;
  message?: string;
  maximum?: number | bigint;
  minimum?: number | bigint;
}

/**
 * 🔴 Lấy đoạn chuỗi **CUỐI** của đường dẫn, không lấy đoạn đầu như
 * `teaching-plans/db-errors.ts`.
 *
 * Module này có mảng lồng: một ô điểm sai nằm ở `scores[7].score`. Lấy đoạn đầu
 * ra `"scores"` ⇒ câu *"Bảng điểm không đúng định dạng."*, đúng mà vô dụng.
 * Lấy đoạn cuối ra `"score"` ⇒ *"Điểm không đúng định dạng."*
 */
function labelOf(path: ReadonlyArray<string | number> | undefined): string | null {
  for (let index = (path?.length ?? 0) - 1; index >= 0; index -= 1) {
    const part = path?.[index];
    if (typeof part === "string" && FIELD_LABELS[part]) return FIELD_LABELS[part];
  }
  return null;
}

/**
 * 🔴 **Câu do `schemas.ts` tự viết được giữ NGUYÊN VĂN, và cách nhận ra chúng
 * khác với module Giáo án.**
 *
 * Ở `teaching-plans` mọi câu tự viết đều đi qua `ctx.addIssue({ code: "custom" })`
 * nên nhận ra bằng `code`. Ở đây phần lớn câu hay nhất lại nằm ở tham số thứ hai
 * của `.min(1, "…")` / `.positive("…")` — zod giữ nguyên `code: "too_small"`, nên
 * **kiểm `code === "custom"` sẽ bỏ sót đúng những câu đáng giá nhất**
 * (*"Vui lòng nhập tên cột điểm."*, *"Hệ số phải lớn hơn 0."*).
 *
 * Dấu hiệu phân biệt dùng ở đây: **câu tự viết là tiếng Việt có dấu**, còn câu
 * zod sinh ra là tiếng Anh thuần ASCII (*"String must contain at least 1
 * character(s)"*). Nếu một ngày có ai viết câu tự đặt bằng ASCII thuần, hàm rơi
 * về câu dựng theo nhãn trường — vẫn tiếng Việt, vẫn đúng, chỉ kém cụ thể hơn.
 */
function isHandWrittenVietnamese(message: string | undefined): message is string {
  if (typeof message !== "string") return false;
  for (const character of message) {
    if ((character.codePointAt(0) ?? 0) > 127) return true;
  }
  return false;
}

export function describeAssessmentZodIssue(issue: ZodIssueLike): string {
  if (isHandWrittenVietnamese(issue.message)) return issue.message;

  const label = labelOf(issue.path);
  if (!label) return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";

  switch (issue.code) {
    case "too_small":
      return issue.minimum === undefined
        ? `Chưa nhập ${label}.`
        : `${label} phải từ ${issue.minimum} trở lên.`;
    case "too_big":
      return issue.maximum === undefined
        ? `${label} vượt quá giới hạn cho phép.`
        : `${label} không được vượt quá ${issue.maximum}.`;
    case "invalid_type":
      return `Chưa nhập ${label}.`;
    default:
      return `${label} không đúng định dạng.`;
  }
}

/**
 * Gộp `issues` thành **một** câu cho `FormMessage`.
 *
 * Tối đa ba câu: một cột 50 em nhập sai hàng loạt thì một dải chữ dài bằng cả
 * màn hình không giúp gì hơn ba câu đầu, mà lại đẩy nút "Lưu điểm" ra khỏi tầm
 * nhìn trên máy 360px. Số còn lại được **đếm ra** chứ không giấu đi.
 */
export function describeAssessmentZodIssues(issues: readonly ZodIssueLike[]): string {
  const messages: string[] = [];
  for (const issue of issues) {
    const text = describeAssessmentZodIssue(issue);
    if (!messages.includes(text)) messages.push(text);
  }
  if (messages.length === 0) return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
  if (messages.length <= 3) return messages.join(" ");
  return `${messages.slice(0, 3).join(" ")} (và ${messages.length - 3} lỗi khác)`;
}
