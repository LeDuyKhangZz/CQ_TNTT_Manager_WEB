import { describe, expect, it } from "vitest";
import {
  canArchiveStudent,
  canDeleteSacrament,
  canViewSensitive,
  canWriteSensitive,
  canWriteStudents,
  mustPickClassOnCreate,
  readsFeeDirectory,
  SACRAMENT_DELETE_ROLES,
  STUDENT_ARCHIVE_ROLES,
  STUDENT_SENSITIVE_WRITE_ROLES,
  STUDENT_WRITE_ROLES,
} from "@/features/students/permissions";
import { APP_ROLES } from "@/lib/permissions/roles";

/**
 * D-63 / D-123 — Trưởng/Phó ngành ghi được hồ sơ thiếu nhi trong ngành mình.
 * **D-127 / D-128 / D-67** (M03-C) — ba cổng quyền còn lại của module.
 *
 * 🔴 Nhóm bài quan trọng nhất ở đây là nhóm **"các cổng quyền phải khác nhau"**.
 * Module này có **bốn** cổng, và không cái nào trùng cái nào:
 *
 *   · ghi hồ sơ (`STUDENT_WRITE_ROLES`, D-63)
 *   · ghi sức khoẻ/bí tích (`STUDENT_SENSITIVE_WRITE_ROLES`, D-127)
 *   · xoá bí tích (`SACRAMENT_DELETE_ROLES`, D-128)
 *   · lưu trữ hồ sơ (`STUDENT_ARCHIVE_ROLES`, `docs/05` §5)
 *
 * Gộp bất kỳ hai cái nào là hoặc mở một quyền chưa ai duyệt, hoặc để người dùng
 * bấm một nút rồi nhận "0 dòng được cập nhật" — đúng loại thất bại im lặng mà
 * M03-A đã đi diệt.
 */

describe("D-63 · ai ghi được hồ sơ thiếu nhi", () => {
  it("bốn vai trò ghi toàn xứ đoàn vẫn ghi được", () => {
    for (const role of ["super_admin", "group_leader", "deputy_group_leader", "secretary"] as const) {
      expect(canWriteStudents(role)).toBe(true);
    }
  });

  it("Trưởng ngành và Phó ngành nay ghi được", () => {
    expect(canWriteStudents("sector_leader")).toBe(true);
    expect(canWriteStudents("sector_deputy")).toBe(true);
  });

  it("Giáo lý viên và Dự trưởng vẫn KHÔNG ghi được (D-63 nêu rõ)", () => {
    for (const role of ["class_representative", "class_teacher", "trainee_assistant"] as const) {
      expect(canWriteStudents(role)).toBe(false);
    }
  });

  it("Cha sở, Cha phó và Thủ quỹ đọc chứ không ghi", () => {
    for (const role of ["parish_priest", "chaplain", "treasurer"] as const) {
      expect(canWriteStudents(role)).toBe(false);
    }
  });

  it("chưa đăng nhập / chưa có vai trò thì không ghi được gì", () => {
    expect(canWriteStudents(null)).toBe(false);
    expect(canWriteSensitive(null)).toBe(false);
  });

  it("không vai trò nào ngoài danh sách lọt qua", () => {
    const allowed = new Set<string>(STUDENT_WRITE_ROLES);
    for (const role of APP_ROLES) {
      expect(canWriteStudents(role)).toBe(allowed.has(role));
    }
  });
});

/**
 * 🔴 **Cập nhật M03-C: Q-M03-02 đã chốt = D-127.**
 *
 * Bản M03-B của nhóm bài này khẳng định "sức khoẻ và bí tích HẸP HƠN hồ sơ, và
 * là **tập con** của nó". Chủ dự án chốt 2026-07-28 theo đúng `docs/05` §3, và
 * quan hệ giữa hai danh sách đổi hẳn hình dạng: chúng **giao nhau** chứ không
 * lồng nhau nữa. Giáo lý viên ghi được sức khoẻ nhưng không sửa được ngày sinh;
 * Trưởng ngành làm được cả hai. Vì thế bài "tập con thật sự" bị **thay** chứ
 * không được sửa số cho hết đỏ — nó khẳng định một quan hệ nay không còn đúng.
 */
describe("🔴 D-127 · hai cổng quyền GIAO nhau, không lồng nhau", () => {
  it("vai trò ngành ghi được cả hồ sơ lẫn sức khoẻ/bí tích", () => {
    for (const role of ["sector_leader", "sector_deputy"] as const) {
      expect(canWriteStudents(role)).toBe(true);
      expect(canWriteSensitive(role)).toBe(true);
    }
  });

  it("Giáo lý viên ghi được sức khoẻ/bí tích nhưng KHÔNG sửa được hồ sơ", () => {
    for (const role of ["class_representative", "class_teacher"] as const) {
      expect(canWriteSensitive(role)).toBe(true);
      expect(canWriteStudents(role)).toBe(false);
    }
  });

  it("🔴 Dự trưởng phụ tá vẫn CHỈ ĐỌC — docs/05 §3 cho họ 👁📍", () => {
    expect(canWriteSensitive("trainee_assistant")).toBe(false);
    expect(canWriteStudents("trainee_assistant")).toBe(false);
    expect(canViewSensitive("trainee_assistant")).toBe(true);
  });

  it("danh sách ghi nhạy cảm đúng bằng bốn vai trò xứ đoàn + ngành + hai vai trò lớp", () => {
    expect([...STUDENT_SENSITIVE_WRITE_ROLES].sort()).toEqual(
      [
        "class_representative",
        "class_teacher",
        "deputy_group_leader",
        "group_leader",
        "secretary",
        "sector_deputy",
        "sector_leader",
        "super_admin",
      ].sort(),
    );
  });

  it("không danh sách nào là tập con của danh sách kia", () => {
    const sensitive = new Set<string>(STUDENT_SENSITIVE_WRITE_ROLES);
    const profile = new Set<string>(STUDENT_WRITE_ROLES);
    expect([...profile].some((role) => !sensitive.has(role))).toBe(false);
    expect([...sensitive].some((role) => !profile.has(role))).toBe(true);
  });

  it("ai ĐỌC được cũng phải là điều kiện cần để GHI", () => {
    for (const role of STUDENT_SENSITIVE_WRITE_ROLES) {
      expect(canViewSensitive(role)).toBe(true);
    }
  });

  it("Cha sở và Thủ quỹ đọc/không đọc như cũ, và tuyệt đối không ghi", () => {
    expect(canWriteSensitive("parish_priest")).toBe(false);
    expect(canWriteSensitive("treasurer")).toBe(false);
    expect(canWriteSensitive("guardian")).toBe(false);
  });
});

describe("D-128 · xoá bí tích hẹp hơn ghi một bậc", () => {
  it("chỉ bốn vai trò xứ đoàn xoá được", () => {
    expect([...SACRAMENT_DELETE_ROLES].sort()).toEqual(
      ["deputy_group_leader", "group_leader", "secretary", "super_admin"].sort(),
    );
  });

  it("🔴 người ghi được bí tích chưa chắc xoá được", () => {
    for (const role of ["sector_leader", "class_teacher", "class_representative"] as const) {
      expect(canWriteSensitive(role)).toBe(true);
      expect(canDeleteSacrament(role)).toBe(false);
    }
  });

  it("mọi vai trò xoá được đều ghi được — không có đường tắt", () => {
    for (const role of SACRAMENT_DELETE_ROLES) {
      expect(canWriteSensitive(role)).toBe(true);
    }
    expect(canDeleteSacrament(null)).toBe(false);
  });
});

describe("TB-F06 · lưu trữ hồ sơ hẹp hơn sửa hồ sơ (docs/05 §5)", () => {
  it("chỉ bốn vai trò xứ đoàn lưu trữ được", () => {
    expect([...STUDENT_ARCHIVE_ROLES].sort()).toEqual(
      ["deputy_group_leader", "group_leader", "secretary", "super_admin"].sort(),
    );
  });

  it("🔴 D-63 nới quyền SỬA hồ sơ cho vai trò ngành, KHÔNG nới quyền lưu trữ", () => {
    for (const role of ["sector_leader", "sector_deputy"] as const) {
      expect(canWriteStudents(role)).toBe(true);
      expect(canArchiveStudent(role)).toBe(false);
    }
  });
});

describe("D-67 · Thủ quỹ đi đường đọc riêng", () => {
  it("đúng một vai trò dùng cửa sổ hẹp", () => {
    for (const role of APP_ROLES) {
      expect(readsFeeDirectory(role)).toBe(role === "treasurer");
    }
    expect(readsFeeDirectory(null)).toBe(false);
  });

  it("Thủ quỹ đọc được nhưng KHÔNG ghi gì — D-67 nêu thẳng", () => {
    expect(canWriteStudents("treasurer")).toBe(false);
    expect(canWriteSensitive("treasurer")).toBe(false);
    expect(canArchiveStudent("treasurer")).toBe(false);
    expect(canDeleteSacrament("treasurer")).toBe(false);
  });
});

describe("D-123 · ai bắt buộc chọn lớp khi tạo hồ sơ", () => {
  it("Trưởng/Phó ngành bắt buộc — ngành của em suy ra từ lớp", () => {
    expect(mustPickClassOnCreate("sector_leader")).toBe(true);
    expect(mustPickClassOnCreate("sector_deputy")).toBe(true);
  });

  it("vai trò toàn xứ đoàn được tạo hồ sơ chưa xếp lớp", () => {
    for (const role of ["super_admin", "group_leader", "deputy_group_leader", "secretary"] as const) {
      expect(mustPickClassOnCreate(role)).toBe(false);
    }
  });

  it("chưa có vai trò thì không bị hỏi ô lớp (đã bị chặn từ trước đó)", () => {
    expect(mustPickClassOnCreate(null)).toBe(false);
  });
});
