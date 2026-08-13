import { z } from "zod";

/**
 * Ranh giới trắng cho việc sửa lớp — M02-B, TB-F08 / AC-M02-10, R6.
 *
 * Chuyển nguyên văn từ `academic-years/schemas.ts` sang đúng feature của nó (I6).
 * Lớp không phải là năm học: `updateClass` ghi vào bảng `classes` với nhóm quyền
 * **bốn vai trò ghi toàn xứ đoàn**, còn năm học từ D-112 chỉ còn Super Admin — để
 * hai thứ trong cùng một file là mời gọi trộn lẫn hai nhóm quyền đó.
 *
 * 🔴 Danh sách trắng ba trường là **ràng buộc bảo mật**, không phải tiện lợi (R6):
 * `academic_year_id`, `grade_level_id`, `section_code` và `display_name` xác định
 * lớp này **là lớp nào** trong cơ cấu 19 lớp chuẩn. Cho sửa chúng qua biểu mẫu là
 * cho phép biến "Ấu 1A của năm 2026-2027" thành một lớp khác hẳn mà mọi ghi danh,
 * điểm danh và bảng điểm đã trỏ vào vẫn bám nguyên — đúng chỗ `unique
 * (academic_year_id, grade_level_id, section_code)` sẽ vỡ. Zod `object` mặc định
 * **cắt bỏ** khoá lạ, nên gửi thêm trường cũng không đi qua được.
 */
export const updateClassSchema = z.object({
  id: z.string().uuid("Lớp không hợp lệ."),
  status: z.enum(["active", "inactive", "closed"]),
  meetingLocation: z.string().trim().max(200, "Phòng sinh hoạt tối đa 200 ký tự.").nullable(),
  notes: z.string().trim().max(1000, "Ghi chú tối đa 1000 ký tự.").nullable(),
});

export type UpdateClassInput = z.infer<typeof updateClassSchema>;
