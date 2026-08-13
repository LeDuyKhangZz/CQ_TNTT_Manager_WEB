/**
 * Từ vựng bí tích dùng chung — **M08-B**.
 *
 * 🔴 Vì sao nó rời khỏi `features/students/student-status.ts`: từ đợt này module
 * **Chuyển lớp** cũng phải gọi tên bí tích (D-156/D-161 — cảnh báo bí tích ở lớp
 * cuối ngành). Có đúng hai đường đi:
 *
 *   1. `features/promotions` import thẳng từ `features/students` — tức dựng lại
 *      **đúng khuyết điểm** mà `07_IMPLEMENTATION_IMPACT` hạng mục 9 vừa bắt M08-A
 *      dọn (`hasGlobalResultWrite` mượn qua biên giới feature từ
 *      `features/assessments`, `03_AUDIT_RESULTS` tiêu chí 10 trừ điểm).
 *   2. Nâng phần **dùng chung** lên `src/lib/`, đúng chỗ M08-A đã đặt
 *      `GLOBAL_WRITE_ROLES` (`src/lib/permissions/roles.ts`).
 *
 * Chọn (2). `features/students/student-status.ts` **xuất lại** từ đây nên mọi lượt
 * import cũ không đổi một chữ, và **chỉ có một** bảng nhãn trong hệ thống — hai
 * bảng nhãn cho cùng một enum là một lỗi chờ sẵn: sửa một chỗ, chỗ kia vẫn nói
 * tên cũ và không gì báo là sai.
 *
 * Chuỗi nhãn giữ **nguyên văn** bản đang chạy, không nắn lại hoa/thường: đây là
 * chữ người dùng đang nhìn thấy ở hồ sơ thiếu nhi, và đổi nó nằm ngoài phạm vi
 * M08 (`AGENTS` §4).
 */

export const SACRAMENT_LABELS: Record<string, string> = {
  baptism: "Rửa tội",
  first_confession: "Xưng tội lần đầu",
  first_communion: "Rước lễ lần đầu",
  confirmation: "Thêm sức",
  profession: "Tuyên hứa",
  other: "Khác",
};

/**
 * BR-M03-25 — loại `other` bắt buộc có tên tự nhập, nên tên hiển thị lấy từ đó;
 * các loại còn lại lấy nhãn cố định. Tên tự nhập rỗng thì rơi về "Khác" thay vì in
 * một dòng trống không ai hiểu.
 */
export function sacramentLabel(type: string, name?: string | null): string {
  if (type === "other") return name?.trim() || SACRAMENT_LABELS.other;
  return SACRAMENT_LABELS[type] ?? type;
}

/** Danh sách nhãn cho một mảng mã bí tích, giữ nguyên thứ tự cơ sở dữ liệu trả về. */
export function sacramentLabelList(types: readonly string[]): string {
  return types.map((type) => sacramentLabel(type)).join(", ");
}
