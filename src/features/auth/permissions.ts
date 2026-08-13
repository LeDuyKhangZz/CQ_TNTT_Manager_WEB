import { GLOBAL_ROLES, type AppRole } from "@/lib/permissions/roles";

export function canManageAccounts(role: AppRole | null): boolean {
  return role === "super_admin";
}

/**
 * Ai được thấy TRƯỜNG NHẠY CẢM của hồ sơ GLV trên trang chi tiết `/staff/[id]`
 * (ngày sinh, địa chỉ, email, trạng thái tài khoản) — AC-01.7.
 *
 * Chủ dự án chốt 2026-07-24: CHỈ vai trò quản trị/toàn xứ đoàn — trùng đúng
 * `GLOBAL_ROLES` (= `app.can_global_read()` phía DB). Đồng nghiệp cùng lớp và
 * thành viên cùng Ban đọc được DÒNG hồ sơ qua RLS (`can_access_staff`, kể cả
 * nhánh D-100 "cùng Ban"), nhưng KHÔNG được thấy các trường này ở đây: trang chi
 * tiết không được trở thành một mặt lộ thông tin riêng tư mới trên máy dùng chung.
 * Ẩn nút không phải authorization — nên trang KHÔNG select các trường đó vào
 * payload khi người xem không đạt điều kiện, chứ không chỉ giấu trên giao diện.
 */
export function canReadStaffSensitive(role: AppRole | null): boolean {
  return role !== null && GLOBAL_ROLES.includes(role);
}

/**
 * Trùng ĐÚNG `app.can_global_read()` phía DB — **sáu** vai trò, KHÔNG có Thủ quỹ.
 *
 * `GLOBAL_ROLES` ở TypeScript có bảy tên vì nó là "nhóm vai trò toàn xứ đoàn"
 * theo nghĩa tổ chức. Nhưng RLS `role_assignments_select_self_or_global` đọc
 * `app.can_global_read()`, và hàm đó không tính Thủ quỹ. Nếu dùng `GLOBAL_ROLES`
 * để quyết định "có hiện cảnh báo chưa gán vai trò không" thì Thủ quỹ được xếp
 * vào nhóm ĐƯỢC thấy, nhưng truy vấn của họ trả về 0 dòng ⇒ mọi tài khoản đều
 * trông như "đã gán vai trò". Không phải lỗ hổng (đóng chặt là hướng an toàn),
 * mà là một lời nói dối im lặng trên màn hình. Danh sách này giữ hai tầng khớp nhau.
 */
const DB_GLOBAL_READ_ROLES: readonly AppRole[] = [
  "super_admin",
  "parish_priest",
  "chaplain",
  "group_leader",
  "deputy_group_leader",
  "secretary",
];

/**
 * D-110 (chủ dự án chốt 2026-07-24) — mức hiển thị tình trạng tài khoản của
 * NGƯỜI KHÁC trên `/staff`:
 *
 *   · `full`     chỉ Super Admin — thấy tên đăng nhập
 *   · `warning`  vai trò đọc-toàn-cục khác — chỉ thấy cảnh báo "chưa gán vai trò"
 *   · `basic`    còn lại — chỉ biết có/không có tài khoản
 *
 * Tên đăng nhập là thứ người ta gõ vào ô đầu tiên của màn hình đăng nhập; rải nó
 * lên một danh sách mở trên máy dùng chung là nửa bộ thông tin cần để thử mật khẩu.
 */
export function staffAccountVisibility(role: AppRole | null): "full" | "warning" | "basic" {
  if (role === "super_admin") return "full";
  if (role !== null && DB_GLOBAL_READ_ROLES.includes(role)) return "warning";
  return "basic";
}
