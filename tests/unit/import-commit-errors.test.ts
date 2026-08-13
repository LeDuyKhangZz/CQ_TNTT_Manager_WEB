import { describe, expect, it } from "vitest";
import { commitErrorText } from "@/features/imports/commit-errors";

/**
 * M12-A — AC-26 / SEC-16: người nhập dữ liệu không bao giờ được nhìn thấy
 * `sqlerrm`, tên bảng, tên cột hay tên ràng buộc.
 *
 * Bài canh quan trọng nhất là bài cuối: **mã lạ cũng không được lọt ra**. Một
 * bảng ánh xạ đầy đủ tới đâu cũng sẽ gặp mã chưa biết (mỗi module sau của Giai
 * đoạn 2B đều thêm trigger mới), nên nhánh mặc định mới là thứ giữ lời hứa.
 */
describe("commitErrorText", () => {
  it("dòng không lỗi thì không có câu nào", () => {
    expect(commitErrorText(null)).toBeNull();
    expect(commitErrorText("")).toBeNull();
    expect(commitErrorText("   ")).toBeNull();
  });

  it("STUDENT_NOT_ACTIVE (M03-C) nói rõ phải khôi phục hồ sơ trước", () => {
    const text = commitErrorText("STUDENT_NOT_ACTIVE");
    expect(text).toContain("không còn sinh hoạt");
    expect(text).toContain("khôi phục");
  });

  it("mã kèm phần mô tả sau dấu hai chấm vẫn nhận ra", () => {
    expect(commitErrorText("CLASS_NOT_ACTIVE: lớp đã đóng")).toBe(
      commitErrorText("CLASS_NOT_ACTIVE"),
    );
  });

  it("GUARDIAN_PHONE_REQUIRED giải thích vì sao cần số điện thoại", () => {
    expect(commitErrorText("GUARDIAN_PHONE_REQUIRED")).toContain("số điện thoại");
  });

  it("lỗi trùng khoá của Postgres ra câu tiếng Việt, không lộ tên ràng buộc", () => {
    const text = commitErrorText(
      'duplicate key value violates unique constraint "enrollments_one_open_idx"',
    );
    expect(text).not.toContain("enrollments_one_open_idx");
    expect(text).not.toContain("constraint");
    expect(text).toContain("đã tồn tại");
  });

  it("lỗi CHECK không lộ tên bảng", () => {
    const text = commitErrorText(
      'new row for relation "students" violates check constraint "students_phone_check"',
    );
    expect(text).not.toContain("students");
    expect(text).toContain("không hợp lệ");
  });

  it("cột NOT NULL ra câu chỉ đúng ô phải sửa", () => {
    const text = commitErrorText('null value in column "gender" violates not-null constraint');
    expect(text).not.toContain("gender");
    expect(text).toContain("giới tính");
  });

  it("mã LẠ vẫn ra tiếng Việt và không chứa một chữ nào của câu gốc", () => {
    const raw = 'ERROR: relation "public.some_internal_table" does not exist at character 42';
    const text = commitErrorText(raw);
    expect(text).not.toContain("some_internal_table");
    expect(text).not.toContain("ERROR");
    expect(text).toContain("Không ghi được dòng này");
  });
});
