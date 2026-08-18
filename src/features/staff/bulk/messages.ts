/**
 * Câu chữ của luồng nhập hàng loạt nhân sự — IMP-BULK-001.
 *
 * 🔴 File **thuần**, tách khỏi `server/actions.ts` vì một lý do kỹ thuật cứng:
 * mọi thứ export ra từ một tệp `"use server"` phải là **hàm async**. Một hằng
 * chuỗi nằm trong đó làm **chết cả trang** khi chạy thật, trong khi lint,
 * typecheck, unit test và build đều xanh — chỉ `use-server-exports.test.ts` và
 * E2E bắt được. Đây là bẫy đã có tiền lệ trong repo này.
 */

export const STAFF_BULK_FORBIDDEN_TEXT =
  "Bạn không có quyền nhập hàng loạt nhân sự. Việc này dành cho Xứ đoàn trưởng, Phó Xứ đoàn, Thư ký và Quản trị viên hệ thống.";
