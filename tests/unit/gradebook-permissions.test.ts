import { describe, expect, it } from "vitest";
import { canLockGradebook, canModerateComment } from "@/features/assessments/gradebook-permissions";
import type { AuthContext } from "@/lib/auth/types";
import type { AppRole } from "@/lib/permissions/roles";

/**
 * M07-B — **D-74 + D-151** (ai khóa được bảng điểm) và **D-152** (ai sửa/xóa
 * được một nhận xét).
 *
 * ⚠️ Hai hàm này chỉ quyết định **hiện nút hay không**. Hàng rào thật nằm ở
 * `app.can_lock_gradebook` và `app.can_moderate_student_comment`, kiểm bằng JWT
 * thật ở pgTAP `044`. Bài dưới đây canh cho gương soi **không lệch** với cơ sở
 * dữ liệu — chính chỗ lệch ấy là lỗi mà đợt này đi chữa.
 */

const CLASS_A = "class-a";
const CLASS_B = "class-b";

function contextOf(role: AppRole | null, classId: string | null = null, profileId = "me"): AuthContext {
  return {
    userId: "user-1",
    profileId,
    role,
    audience: "staff",
    classId,
    sectorId: null,
    academicYearId: "year-1",
    mustChangePassword: false,
  } as AuthContext;
}

describe("D-74 + D-151 — quyền khóa bảng điểm", () => {
  it("Giáo lý viên đại diện khóa được bảng điểm LỚP MÌNH", () => {
    expect(canLockGradebook(contextOf("class_representative", CLASS_A), CLASS_A)).toBe(true);
  });

  it("D-74 nới thêm: Giáo lý viên lớp cũng khóa được", () => {
    expect(canLockGradebook(contextOf("class_teacher", CLASS_A), CLASS_A)).toBe(true);
  });

  /**
   * 🔴 Đây là lỗi thật của phép tính cũ, không phải ca biên: nó liệt kê tay năm
   * vai trò và **không kiểm lớp**, nên đại diện lớp A nhìn thấy nút "Khóa bảng
   * điểm" trên bảng điểm lớp B.
   */
  it("nhưng KHÔNG khóa được bảng điểm lớp khác", () => {
    expect(canLockGradebook(contextOf("class_representative", CLASS_A), CLASS_B)).toBe(false);
    expect(canLockGradebook(contextOf("class_teacher", CLASS_A), CLASS_B)).toBe(false);
  });

  it("SIẾT — ba vai trò cấp xứ đoàn mất quyền khóa", () => {
    for (const role of ["group_leader", "deputy_group_leader", "secretary"] as const) {
      expect(canLockGradebook(contextOf(role), CLASS_A)).toBe(false);
    }
  });

  it("SIẾT — Dự trưởng phụ tá không khóa được, dù năm học cho họ chấm điểm", () => {
    expect(canLockGradebook(contextOf("trainee_assistant", CLASS_A), CLASS_A)).toBe(false);
  });

  it("D-151 — Super Admin khóa được mọi lớp, làm đường thoát vận hành", () => {
    expect(canLockGradebook(contextOf("super_admin"), CLASS_A)).toBe(true);
    expect(canLockGradebook(contextOf("super_admin", CLASS_B), CLASS_A)).toBe(true);
  });

  it("phụ huynh, thiếu nhi và phiên chưa có vai trò đều không khóa được", () => {
    expect(canLockGradebook(contextOf("guardian"), CLASS_A)).toBe(false);
    expect(canLockGradebook(contextOf("student"), CLASS_A)).toBe(false);
    expect(canLockGradebook(contextOf(null), CLASS_A)).toBe(false);
  });
});

describe("D-152 — quyền sửa/xóa nhận xét", () => {
  it("tác giả luôn sửa/xóa được bài của chính mình", () => {
    expect(canModerateComment(contextOf("class_teacher", CLASS_A, "me"), CLASS_A, "me")).toBe(true);
  });

  it("SIẾT — Giáo lý viên lớp KHÔNG đụng được bài của đồng nghiệp", () => {
    expect(canModerateComment(contextOf("class_teacher", CLASS_A, "me"), CLASS_A, "someone-else")).toBe(false);
  });

  it("SIẾT — Dự trưởng phụ tá cũng không, dù năm học cho họ nhận xét", () => {
    expect(canModerateComment(contextOf("trainee_assistant", CLASS_A, "me"), CLASS_A, "someone-else")).toBe(false);
  });

  it("D-152 — Giáo lý viên đại diện xử lý được bài của người khác TRONG LỚP MÌNH", () => {
    expect(canModerateComment(contextOf("class_representative", CLASS_A, "me"), CLASS_A, "someone-else")).toBe(true);
  });

  it("nhưng không phải lớp khác — quyền đi theo lớp, không đi theo chức danh", () => {
    expect(canModerateComment(contextOf("class_representative", CLASS_A, "me"), CLASS_B, "someone-else")).toBe(false);
  });

  it("nhóm cấp xứ đoàn giữ nguyên quyền, ở mọi lớp", () => {
    for (const role of ["super_admin", "group_leader", "deputy_group_leader", "secretary"] as const) {
      expect(canModerateComment(contextOf(role, null, "me"), CLASS_A, "someone-else")).toBe(true);
    }
  });

  /**
   * Ca biên có thật: cột `author_profile_id` là `not null` ở cơ sở dữ liệu,
   * nhưng đường đọc của giao diện có thể trả `null` khi RLS che mất dòng hồ sơ
   * người viết. `null` **không được** khớp với "tác giả là tôi" — nếu không thì
   * mất một dòng dữ liệu là mở quyền cho cả lớp.
   */
  it("tác giả không đọc được thì KHÔNG được coi là chính mình", () => {
    expect(canModerateComment(contextOf("class_teacher", CLASS_A, "me"), CLASS_A, null)).toBe(false);
  });
});
