/**
 * Quyết định mặc định cho một dòng nhập, và điều kiện chặn ghi — M12-A,
 * **TO-BE 2 / BR-M12-31 · 32 · 33 / AC-18 · AC-19 · AC-20 / D-133**.
 *
 * 🔴 Đây là chỗ chữa lỗi CRITICAL 4.3. Trước đợt này mọi dòng — kể cả dòng trùng
 * **họ tên + ngày sinh + số điện thoại phụ huynh** với một em đã có hồ sơ — đều
 * mang `action = 'create'` (`actions.ts:149`), vì mã nguồn chép lại giá trị mặc
 * định của **cột trong cơ sở dữ liệu** rồi dùng nó làm mặc định của một **quyết
 * định nghiệp vụ**. Hệ quả: bấm thẳng "Ghi" là sinh hồ sơ trùng, mà hệ thống
 * **không có chức năng gộp** hai hồ sơ.
 *
 * Hai điều file này làm, và lý do chúng phải đi cùng nhau:
 *
 *   1. **Mặc định an toàn** — dòng trùng chắc chắn (`high`) hoặc nhiều khả năng
 *      trùng (`medium`) mặc định là **Ghép hồ sơ có sẵn**, không phải Tạo mới.
 *   2. **Bắt người quyết định** — mặc định vẫn chỉ là mặc định. Dòng `high` bị
 *      **chặn ghi** cho tới khi người duyệt tự bấm lưu quyết định của dòng đó,
 *      cùng khuôn với cách `commitBatch` đang chặn dòng thiếu giới tính. Nếu chỉ
 *      làm (1) mà không làm (2) thì máy quyết thay người: so khớp sai một dòng
 *      là em **mới** không có hồ sơ còn em **cũ** bị ghi danh nhầm lớp — sai
 *      hoàn toàn im lặng.
 *
 * 🔴 **Trạng thái hồ sơ đối chiếu quyết định "Ghép" có chạy được hay không.**
 * AC-20 đòi dò trùng cả hồ sơ **không** còn hoạt động (em nghỉ rồi quay lại phải
 * được ghép, không tạo mới). Nhưng trigger `enrollments_need_active_student` của
 * M03-C (BR-M03-N13) **từ chối ghi danh** cho em có `students.status <> 'active'`.
 * Nghĩa là mặc định "Ghép" vào một hồ sơ đã rút/lưu trữ là một mặc định **chắc
 * chắn hỏng**. Vì thế dòng đó cũng phải được người duyệt nhìn tận mắt: việc cần
 * làm là **khôi phục hồ sơ em ở trang Thiếu nhi trước**, không phải bấm Ghi lần
 * nữa.
 *
 * File thuần, không import gì từ tầng server ⇒ kiểm được bằng unit test thường.
 */

import { studentStatusLabel } from "@/features/students/student-status";
import type { DuplicateLevel } from "@/lib/students/duplicate";

export type RowAction = "create" | "merge" | "skip";

export interface RowIssue {
  field: string;
  message: string;
}

/**
 * Cảnh báo trùng **chưa được người duyệt xử lý**. Tên trường là thứ `commitBatch`
 * đọc để chặn, và `setRowAction` đọc để gỡ — cùng cơ chế `setRowGender` đang dùng
 * với trường `gender`, nên không cần thêm cột nào vào cơ sở dữ liệu.
 */
export const DUPLICATE_PENDING_FIELD = "duplicate_pending";
/** Cảnh báo trùng đã được người duyệt xem và quyết — vẫn hiện, nhưng hết chặn. */
export const DUPLICATE_FIELD = "duplicate";

export interface DuplicateSummary {
  level: DuplicateLevel;
  /** `students.id` của hồ sơ đối chiếu. */
  studentId: string;
  reason: string;
  /** `students.status` của hồ sơ đối chiếu — quyết định "Ghép" có chạy được không. */
  status: string;
}

export interface RowDecision {
  action: RowAction;
  /** Cảnh báo ghi vào `warnings_json`; `null` khi dòng không trùng với ai. */
  warning: RowIssue | null;
}

/** Hồ sơ đối chiếu phải đang sinh hoạt thì "Ghép" mới ghi danh được. */
export function canMergeInto(status: string): boolean {
  return status === "active";
}

/**
 * Mặc định của một dòng sau khi dò trùng.
 *
 * - `high` / `medium` + hồ sơ đối chiếu đang sinh hoạt ⇒ **Ghép**.
 * - `high` ⇒ luôn **chặn ghi** cho tới khi người duyệt xác nhận (BR-M12-32).
 * - hồ sơ đối chiếu **không** còn hoạt động mà mặc định lại là Ghép ⇒ cũng chặn,
 *   vì mặc định ấy chắc chắn bị trigger của M03-C từ chối.
 * - `low` (tên gần giống + trùng SĐT) giữ **Tạo mới**: mức này sinh ra để bắt lỗi
 *   gõ nhầm, ghép nhầm ở mức ấy tốn kém hơn tạo thừa một hồ sơ.
 */
export function decideDuplicateRow(duplicate: DuplicateSummary | null): RowDecision {
  if (!duplicate) return { action: "create", warning: null };

  const mergeable = canMergeInto(duplicate.status);
  const wantsMerge = duplicate.level === "high" || duplicate.level === "medium";
  const action: RowAction = wantsMerge ? "merge" : "create";
  const pending = duplicate.level === "high" || (wantsMerge && !mergeable);

  const notes = [`[${duplicate.level}] ${duplicate.reason}`];
  if (wantsMerge && !mergeable) {
    notes.push(
      `Hồ sơ đối chiếu đang ở trạng thái "${studentStatusLabel(duplicate.status)}" nên không ghi danh được. ` +
        "Hãy khôi phục hồ sơ em ở trang Thiếu nhi trước, hoặc chọn Tạo mới nếu đây là em khác.",
    );
  }
  if (pending) notes.push("Hãy chọn cách xử lý cho dòng này rồi bấm Lưu.");

  return {
    action,
    warning: {
      field: pending ? DUPLICATE_PENDING_FIELD : DUPLICATE_FIELD,
      message: notes.join(" "),
    },
  };
}

/** Dòng còn cảnh báo trùng chưa xử lý thì chưa ghi được. */
export function hasPendingDuplicate(warnings: readonly RowIssue[]): boolean {
  return warnings.some((issue) => issue.field === DUPLICATE_PENDING_FIELD);
}

/**
 * Người duyệt vừa lưu quyết định của dòng ⇒ cảnh báo **vẫn còn hiện** nhưng hết
 * chặn. Giữ lại câu chữ là có chủ ý: xoá đi thì người xem lại lần nhập ấy không
 * còn biết vì sao dòng này chọn "Ghép" mà dòng kia chọn "Tạo mới".
 */
export function resolveDuplicateWarnings(warnings: readonly RowIssue[]): RowIssue[] {
  return warnings.map((issue) =>
    issue.field === DUPLICATE_PENDING_FIELD ? { ...issue, field: DUPLICATE_FIELD } : issue,
  );
}

/** Câu chặn nêu **số dòng cụ thể**, tối đa 5 số — cùng khuôn câu chặn giới tính. */
export function pendingDuplicateMessage(rowNumbers: readonly number[]): string {
  const sample = rowNumbers
    .slice(0, 5)
    .map((rowNumber) => `#${rowNumber}`)
    .join(", ");
  return (
    `Còn ${rowNumbers.length} dòng nghi trùng chắc chắn chưa được xác nhận (${sample}` +
    `${rowNumbers.length > 5 ? "…" : ""}). ` +
    "Hãy mở từng dòng, chọn Ghép hồ sơ có sẵn hoặc Tạo mới rồi bấm Lưu, sau đó ghi lại."
  );
}
