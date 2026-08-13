/**
 * M08-A — dịch lỗi của module Chuyển lớp sang **mã nghiệp vụ + câu tiếng Việt**.
 *
 * Đóng phần trừ điểm mà `03_AUDIT_RESULTS` tiêu chí 6 nêu: *"lỗi Zod bị nuốt
 * thành thông điệp `CONFLICT` chung (`actions.ts:14-17`); `23514` gộp nhiều
 * nguyên nhân khác nhau vào một câu tiếng Việt (`actions.ts:23-25`)"*.
 *
 * 🔴 **Con số ở đây lớn hơn hai câu bị gộp.** RPC của module ném ra **mười một**
 * tên luật khác nhau (`20260722000700_promotions.sql`, 14 lời `raise exception`),
 * và bản cũ ánh xạ chúng qua đúng **năm** mã `SQLSTATE`, trong đó riêng `23514`
 * gánh **sáu** tên luật và trả về một câu duy nhất *"Lớp đích hoặc trạng thái
 * chuyển lớp không hợp lệ."*. Người dùng đọc câu đó khi:
 *
 *   - ghi danh đã đóng (`ENROLLMENT_NOT_OPEN`) — không sửa được bằng cách chọn
 *     lại lớp đích, mà câu cũ chỉ thẳng vào ô lớp đích;
 *   - đề xuất Dự trưởng ở một cấp không cho (`TRAINEE_PROPOSAL_INVALID`);
 *   - lớp đích sai cấp hoặc sai năm (`PROMOTION_TARGET_INVALID`) — **ca duy nhất**
 *     câu cũ nói đúng;
 *   - trạng thái đề xuất ngoài bốn giá trị (`PROMOTION_STATUS_INVALID`).
 *
 * Cùng khuôn `assessments/db-errors.ts` (M07-A) và `teaching-plans/db-errors.ts`
 * (M06-A), và **không** đụng một dòng nào của `src/lib/errors`.
 */

import type { AppErrorCode } from "@/lib/errors";

export interface DbErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}

export interface PromotionFailure {
  appCode: AppErrorCode;
  message: string;
}

/**
 * Tên luật do `raise exception` của migration ném ra.
 *
 * ⚠️ **Thứ tự là bắt buộc, không phải ngẫu nhiên** — phép dò là `includes`, và
 * `PROMOTION_ALREADY_APPROVED` chứa nguyên chuỗi… không, nhưng
 * `PROMOTION_STATUS_INVALID` và `PROMOTION_TARGET_INVALID` thì không lồng nhau.
 * Chỗ **thật sự** phải cẩn thận là `ENROLLMENT_NOT_OPEN` ↔ `ENROLLMENT_NOT_FOUND`:
 * hai tên khác nhau hoàn toàn, nhưng cả hai cùng chứa `ENROLLMENT_NOT_`. Giữ
 * nguyên tên đầy đủ trong mảng là đủ; đừng rút gọn về tiền tố.
 */
const RULE_MESSAGES: ReadonlyArray<readonly [string, PromotionFailure]> = [
  [
    "ENROLLMENT_NOT_FOUND",
    {
      appCode: "RESOURCE_NOT_FOUND",
      message: "Không tìm thấy hồ sơ ghi danh này. Có thể nó vừa thay đổi — hãy tải lại trang.",
    },
  ],
  [
    // 🔴 BR-M08-04. Câu cũ (`23514`) chỉ thẳng vào ô "Lớp đích", nhưng lớp đích
    // không phải chỗ hỏng: ghi danh đã kết thúc thì **không có** đề xuất nào hợp
    // lệ cả. Người dùng đọc câu cũ sẽ đổi lớp đích và bấm lại, hỏng y hệt.
    "ENROLLMENT_NOT_OPEN",
    {
      appCode: "CONFLICT",
      message:
        "Ghi danh của em này không còn mở nên không đề xuất chuyển lớp được. "
        + "Hãy tải lại trang để xem trạng thái mới nhất.",
    },
  ],
  [
    "PROMOTION_REVIEW_NOT_FOUND",
    {
      appCode: "RESOURCE_NOT_FOUND",
      message: "Không tìm thấy đề xuất này. Có thể nó vừa được xử lý — hãy tải lại trang.",
    },
  ],
  [
    // BR-M08-10. Chỉ cấp có `can_propose_trainee` mới đề xuất Dự trưởng được, và
    // đề xuất ấy không được kèm lớp đích.
    "TRAINEE_PROPOSAL_INVALID",
    {
      appCode: "VALIDATION_ERROR",
      message:
        "Chỉ lớp cuối cùng của ngành Hiệp Sĩ mới đề xuất vào Dự trưởng được, và đề xuất "
        + "Dự trưởng không chọn lớp đích — hệ thống tự xếp lớp khi duyệt.",
    },
  ],
  [
    // BR-M08-05/06/07 — ca duy nhất mà câu cũ nói đúng.
    "PROMOTION_TARGET_INVALID",
    {
      appCode: "VALIDATION_ERROR",
      message:
        "Lớp đích không hợp lệ: phải là lớp đang hoạt động của năm học kế tiếp, "
        + "đúng cấp lên lớp (hoặc đúng cấp cũ nếu là học lại).",
    },
  ],
  [
    "PROMOTION_STATUS_INVALID",
    {
      appCode: "VALIDATION_ERROR",
      message: "Trạng thái đề xuất không hợp lệ. Hãy tải lại trang rồi chọn lại.",
    },
  ],
  [
    "PROMOTION_DECISION_INVALID",
    {
      appCode: "VALIDATION_ERROR",
      message: "Quyết định duyệt không hợp lệ. Hãy tải lại trang rồi thử lại.",
    },
  ],
  [
    // BR-M08-01 + BR-M08-14. Đã duyệt thì đề xuất khoá lại — nói ra **vì sao**
    // thay vì "Đề xuất này đã được xử lý", câu vừa mơ hồ vừa không chỉ đường.
    "PROMOTION_ALREADY_APPROVED",
    {
      appCode: "CONFLICT",
      message:
        "Đề xuất của em này đã được duyệt nên không sửa được nữa. "
        + "Ghi danh mới đã được tạo cho năm học sau.",
    },
  ],
  [
    // BR-M08-15.
    "PROMOTION_ALREADY_REVIEWED",
    {
      appCode: "CONFLICT",
      message: "Đề xuất này đã được xử lý rồi. Hãy tải lại trang để xem kết quả.",
    },
  ],
  [
    // 🔴 Nợ #18 / D-160 — M08-B. Hàng rào nằm **trong hai RPC** chứ không trong
    // policy (bảng chỉ có `grant select`), và nó hỏi **cả hai** năm học: năm nguồn
    // vì duyệt đóng ghi danh cũ, năm đích vì duyệt tạo ghi danh mới. Câu chữ phải
    // nói ra cả hai vế, nếu không người dùng đi mở đúng một nửa số năm cần mở.
    "ACADEMIC_YEAR_CLOSED",
    {
      appCode: "CONFLICT",
      message:
        "Năm học liên quan đã đóng nên không xử lý chuyển lớp được. "
        + "Đề xuất cần năm học hiện tại của em còn mở; duyệt thì cần cả năm học của lớp đích còn mở.",
    },
  ],
  [
    // BR-M08-20 / D-158 — M08-B. Chiều ngược lại của luật này (đóng ghi danh ở
    // trang Lớp) có câu riêng ở `enrollments/enrollment-feedback.ts`.
    "ENROLLMENT_HAS_PENDING_PROMOTION",
    {
      appCode: "CONFLICT",
      message:
        "Ghi danh này đang có đề xuất chuyển lớp chờ duyệt nên chưa đóng được. "
        + "Hãy duyệt hoặc từ chối đề xuất trước.",
    },
  ],
  [
    // BR-M08-18 / AC-16 vế ba — M08-B. Chỉ đường **một bước** của D-159 ném mã
    // này; đường hai bước bị chặn sớm hơn, ở `reviewPromotion`, với một câu nêu
    // đích danh từng bí tích còn thiếu.
    "PROMOTION_NOTE_REQUIRED",
    {
      appCode: "VALIDATION_ERROR",
      message:
        "Em này còn thiếu bí tích của lớp cuối ngành. Hãy điền ô \"Ghi chú đại diện\" "
        + "trước khi chuyển lớp — cảnh báo bí tích không chặn việc lên lớp, nhưng quyết "
        + "định phải để lại lý do.",
    },
  ],
  [
    "PROMOTION_EVENT_APPEND_ONLY",
    {
      appCode: "FORBIDDEN",
      message: "Nhật ký quyết định chuyển lớp không sửa và không xoá được.",
    },
  ],
  [
    "FORBIDDEN",
    {
      appCode: "FORBIDDEN",
      message: "Bạn không có quyền thực hiện thao tác này.",
    },
  ],
];

export function classifyPromotionDbError(error: DbErrorLike | null): PromotionFailure {
  const haystack = `${error?.message ?? ""} ${error?.details ?? ""}`;

  for (const [needle, failure] of RULE_MESSAGES) {
    if (haystack.includes(needle)) return failure;
  }

  switch (error?.code) {
    case "42501":
      return { appCode: "FORBIDDEN", message: "Bạn không có quyền thực hiện thao tác này." };
    case "23505":
      return {
        appCode: "CONFLICT",
        message: "Đề xuất này vừa được người khác cập nhật. Hãy tải lại trang.",
      };
    case "23503":
    case "P0002":
      return { appCode: "RESOURCE_NOT_FOUND", message: "Không tìm thấy dữ liệu liên quan." };
    case "23514":
    case "22023":
    case "22P02":
      return { appCode: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." };
    default:
      return { appCode: "CONFLICT", message: "Không xử lý được chuyển lớp. Vui lòng thử lại." };
  }
}

/* ========================================================================== */

/** Tên trường hiện ra màn hình — đúng nhãn người dùng đang nhìn thấy. */
const FIELD_LABELS: Readonly<Record<string, string>> = {
  sourceEnrollmentId: "Thiếu nhi",
  proposedStatus: "Đề xuất",
  targetClassId: "Lớp đích",
  proposeTrainee: "Đề xuất Dự trưởng",
  note: "Ghi chú",
  reviewId: "Đề xuất",
  decision: "Quyết định",
};

/** Hình dạng tối thiểu của một `ZodIssue` — không phụ thuộc phiên bản zod. */
export interface ZodIssueLike {
  code?: string;
  path?: ReadonlyArray<string | number>;
  message?: string;
  maximum?: number | bigint;
  minimum?: number | bigint;
}

function labelOf(path: ReadonlyArray<string | number> | undefined): string | null {
  for (let index = (path?.length ?? 0) - 1; index >= 0; index -= 1) {
    const part = path?.[index];
    if (typeof part === "string" && FIELD_LABELS[part]) return FIELD_LABELS[part];
  }
  return null;
}

/**
 * Câu do `schemas.ts` tự viết được giữ **nguyên văn** — chúng là câu hay nhất
 * đang có (*"Vui lòng chọn lớp đích."*, *"Đề xuất Dự trưởng không chọn lớp
 * đích."*) và trước M08-A **chưa từng hiện ra một lần nào**, vì `failure()` cũ
 * đổi mọi `ZodError` thành *"Không thể xử lý chuyển lớp. Vui lòng thử lại."*.
 *
 * Dấu hiệu phân biệt giống M07-A: câu tự viết là tiếng Việt có dấu, câu zod sinh
 * ra là tiếng Anh thuần ASCII. `superRefine` của module này dùng `code: "custom"`
 * cho cả ba câu, nhưng kiểm theo `code` sẽ bỏ sót nếu mai kia có ai viết câu
 * tiếng Việt vào tham số thứ hai của `.max()` — nên kiểm theo chữ.
 */
function isHandWrittenVietnamese(message: string | undefined): message is string {
  if (typeof message !== "string") return false;
  for (const character of message) {
    if ((character.codePointAt(0) ?? 0) > 127) return true;
  }
  return false;
}

export function describePromotionZodIssue(issue: ZodIssueLike): string {
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
        : `${label} không được vượt quá ${issue.maximum} ký tự.`;
    case "invalid_type":
      return `Chưa chọn ${label}.`;
    default:
      return `${label} không đúng định dạng.`;
  }
}

/** Gộp `issues` thành **một** câu cho `FormMessage`. */
export function describePromotionZodIssues(issues: readonly ZodIssueLike[]): string {
  const messages: string[] = [];
  for (const issue of issues) {
    const text = describePromotionZodIssue(issue);
    if (!messages.includes(text)) messages.push(text);
  }
  if (messages.length === 0) return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
  if (messages.length <= 3) return messages.join(" ");
  return `${messages.slice(0, 3).join(" ")} (và ${messages.length - 3} lỗi khác)`;
}
