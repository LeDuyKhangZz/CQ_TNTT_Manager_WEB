/**
 * Câu lỗi tiếng Việt cho `ZodError` của module thông báo — M10-C.
 *
 * Cùng khuôn `describeAssessmentZodIssues` của M07-A, và ra đời vì **cùng một
 * lỗi**: `failure()` chỉ giữ `message` của `AppError`, nên mọi câu chữ viết sẵn
 * trong `schemas.ts` bị nuốt thành một câu chung *"Không thể xử lý thông báo.
 * Vui lòng thử lại."* — một câu **mời người dùng thử lại đúng thứ vừa hỏng**.
 *
 * Tách khỏi `actions.ts` vì file ấy mang `"use server"`, mà file `"use server"`
 * **chỉ được export hàm async** (bài học M06-B, canh bằng
 * `tests/unit/use-server-exports.test.ts`).
 */

export interface ZodIssueLike {
  path: (string | number)[];
  message: string;
  code?: string;
}

/** Nhãn tiếng Việt của từng ô, để câu lỗi nói đúng chỗ người dùng phải sửa. */
const FIELD_LABELS: Readonly<Record<string, string>> = {
  title: "Tiêu đề",
  content: "Nội dung",
  targetType: "Phạm vi",
  targetId: "Đối tượng nhận",
  linkPath: "Liên kết kèm theo",
  reason: "Lý do thu hồi",
  notificationId: "Thông báo",
  requestId: "Mã yêu cầu",
  query: "Từ khoá tìm kiếm",
};

function describeIssue(issue: ZodIssueLike): string {
  // Câu do `schemas.ts` tự viết luôn cụ thể hơn câu sinh tự động của Zod —
  // dùng thẳng, đừng dịch lại.
  if (issue.message && !/^(Required|Invalid|String must|Expected)/.test(issue.message)) {
    return issue.message;
  }
  const field = issue.path.find((part) => typeof part === "string");
  const label = typeof field === "string" ? FIELD_LABELS[field] : undefined;
  return label
    ? `${label} không hợp lệ.`
    : "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
}

export function describeNotificationZodIssues(issues: readonly ZodIssueLike[]): string {
  const messages: string[] = [];
  for (const issue of issues) {
    const text = describeIssue(issue);
    if (!messages.includes(text)) messages.push(text);
  }
  if (messages.length === 0) return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
  if (messages.length <= 3) return messages.join(" ");
  return `${messages.slice(0, 3).join(" ")} (và ${messages.length - 3} lỗi khác)`;
}
