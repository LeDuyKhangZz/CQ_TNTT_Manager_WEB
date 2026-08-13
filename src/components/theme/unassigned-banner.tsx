import { Alert } from "@/components/ui/alert";
import type { FallbackReason, ThemeContext } from "@/lib/theme/types";

/**
 * Dải chữ "vì sao màn hình của bạn không có màu ngành" — 10 §8, 12 §4.6, 13 §6.
 *
 * 🔴 Không được im lặng. Khi resolver rơi về mặc định trung tính, người dùng
 * thấy một giao diện đỏ–vàng giống hệt của Xứ đoàn trưởng và không hiểu vì sao
 * lớp mình biến mất. Bốn câu dưới đây là câu chữ đã duyệt ở 12 §4.6 — không
 * viết lại cho "mượt hơn": chúng nêu đúng người cần liên hệ.
 *
 * Câu thứ năm là bước 0 của R3 (10 §3): chưa có năm học `current` thì mọi phân
 * công đều vô nghĩa, và đó là việc của quản trị viên chứ không phải lỗi người dùng.
 */

/** `null` ⇒ lý do này không phải "chưa phân công", không hiện dải nào. */
export function unassignedMessage(reason: FallbackReason): string | null {
  switch (reason) {
    case "NO_ACTIVE_ASSIGNMENT":
      return "Hồ sơ của bạn chưa được phân công lớp. Liên hệ Thư ký Xứ đoàn.";
    case "NOT_ENROLLED_THIS_YEAR":
      return "Em chưa được xếp lớp cho năm học này.";
    case "PROFILE_NOT_LINKED":
      return "Tài khoản chưa được liên kết với hồ sơ. Liên hệ Quản trị viên.";
    case "NO_LINKED_CHILDREN":
      return "Tài khoản chưa được liên kết với hồ sơ thiếu nhi nào.";
    case "NO_CURRENT_ACADEMIC_YEAR":
      return "Chưa đặt năm học hiện hành. Liên hệ Quản trị viên.";
    default:
      // MULTI_BRANCH_NO_SELECTION có `ChildSwitcher` lo; CROSS_BRANCH_SCREEN là
      // cố ý; ARCHIVED_YEAR_VIEW có dải riêng; ROLE_CLASS_MISMATCH chỉ hiện cho
      // Super Admin (10 §8) nên không thuộc dải này.
      return null;
  }
}

export function UnassignedBanner({
  theme,
  className,
}: {
  theme: Pick<ThemeContext, "fallbackReason">;
  className?: string;
}) {
  const message = unassignedMessage(theme.fallbackReason);
  if (!message) return null;

  return (
    <Alert tone="warning" className={className}>
      {message}
    </Alert>
  );
}
