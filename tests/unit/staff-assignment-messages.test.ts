import { describe, expect, it } from "vitest";
import { assignmentErrorMessage } from "@/features/staff/assignment-messages";
import { transferClassStaffSchema } from "@/features/staff/schemas";

const CONTEXT = {
  staffName: "Anh Giuse Trần Văn B",
  targetClassName: "Ấu 1A",
  currentClassName: "Thiếu 2B",
  startsOn: "2026-09-01",
};

describe("assignmentErrorMessage — AC-01.4 nêu tên thay vì câu gộp", () => {
  it("phân biệt HAI ràng buộc 23505 khác nhau bằng tên index", () => {
    // Cùng mã lỗi, khác hẳn việc phải làm tiếp — đọc nhầm là chỉ sai người.
    const perStaff = assignmentErrorMessage(
      { code: "23505", message: 'duplicate key value violates unique constraint "class_staff_one_active_class_per_staff_idx"' },
      CONTEXT,
    );
    expect(perStaff).toContain("Anh Giuse Trần Văn B");
    expect(perStaff).toContain("Thiếu 2B");
    expect(perStaff).toContain("kết thúc phân công cũ");

    const perClass = assignmentErrorMessage(
      { code: "23505", message: 'duplicate key value violates unique constraint "class_staff_one_active_representative_idx"' },
      CONTEXT,
    );
    expect(perClass).toContain("Ấu 1A");
    expect(perClass).toContain("Giáo lý viên đại diện");
    expect(perClass).not.toContain("Thiếu 2B");
  });

  it("không bao giờ trả câu gộp cũ khi đã biết lý do", () => {
    const generic = "Không lưu được phân công (người này đã có lớp đang phục vụ, hoặc dữ liệu chưa đúng).";
    for (const raw of [
      "CLASS_NOT_ACTIVE",
      "ROLE_CAPACITY_MISMATCH",
      "ACTIVE_CLASS_ROLE_EXISTS",
      "INVALID_END_DATE",
      "INVALID_EFFECTIVE_DATE",
      "SAME_CLASS",
      "ACTIVE_CLASS_ASSIGNMENT_REQUIRED",
    ]) {
      const message = assignmentErrorMessage({ code: "23514", message: raw }, CONTEXT);
      expect(message).not.toBe(generic);
      expect(message.length).toBeGreaterThan(20);
    }
  });

  it("nêu lớp không hoạt động bằng tên lớp", () => {
    expect(assignmentErrorMessage({ code: "23514", message: "CLASS_NOT_ACTIVE" }, CONTEXT))
      .toBe("Lớp Ấu 1A không còn hoạt động, không nhận thêm phân công.");
  });

  it("nêu ngày bắt đầu thật khi ngày kết thúc/hiệu lực sai (AC-03.2)", () => {
    expect(assignmentErrorMessage({ code: "23514", message: "INVALID_END_DATE" }, CONTEXT))
      .toBe("Ngày kết thúc không được trước ngày bắt đầu (01/09/2026).");
    expect(assignmentErrorMessage({ code: "23514", message: "INVALID_EFFECTIVE_DATE" }, CONTEXT))
      .toContain("01/09/2026");
  });

  it("thiếu quyền nói đúng là thiếu quyền, không đổ cho dữ liệu", () => {
    expect(assignmentErrorMessage({ code: "42501", message: "FORBIDDEN" }, CONTEXT))
      .toBe("Bạn không có quyền thực hiện thao tác này.");
  });

  it("phân công đã kết thúc bảo người dùng tải lại trang", () => {
    expect(assignmentErrorMessage({ code: "P0002", message: "ASSIGNMENT_NOT_FOUND" }, CONTEXT))
      .toContain("tải lại trang");
  });

  it("chỉ đường sang Chuyển lớp khi vai trò lớp còn hiệu lực", () => {
    // Đây đúng là tình huống D-105 sinh ra để giải, nên câu lỗi phải nói ra lối đó.
    expect(assignmentErrorMessage({ code: "23514", message: "ACTIVE_CLASS_ROLE_EXISTS" }, CONTEXT))
      .toContain("Chuyển lớp");
  });

  it("thiếu tên lớp/tên người vẫn ra câu đọc được, không ra 'undefined'", () => {
    const message = assignmentErrorMessage(
      { code: "23514", message: "CLASS_NOT_ACTIVE" },
      { staffName: "", targetClassName: null, currentClassName: null, startsOn: null },
    );
    expect(message).not.toContain("undefined");
    expect(message).not.toContain("null");
    expect(message).toContain("Lớp đã chọn");
  });

  it("lỗi lạ rơi về câu chung, không ném", () => {
    expect(assignmentErrorMessage({ code: "XX000", message: "boom" }, CONTEXT)).toContain("kiểm tra lại");
    expect(assignmentErrorMessage(null, CONTEXT)).toContain("kiểm tra lại");
  });
});

describe("transferClassStaffSchema — D-105", () => {
  const valid = {
    assignmentId: "00000000-0000-4000-8000-000000000001",
    newClassId: "00000000-0000-4000-8000-000000000002",
    capacity: "member",
    effectiveOn: "2026-11-01",
  };

  it("nhận payload hợp lệ", () => {
    expect(transferClassStaffSchema.safeParse(valid).success).toBe(true);
  });

  it("KHÔNG có trường vai trò — trần vai trò D-102 nằm ở hình dạng dữ liệu", () => {
    const parsed = transferClassStaffSchema.parse({ ...valid, role: "super_admin" } as never);
    expect(Object.keys(parsed)).toEqual(["assignmentId", "newClassId", "capacity", "effectiveOn"]);
    expect(parsed).not.toHaveProperty("role");
  });

  it("chặn id sai định dạng và ngày sai định dạng", () => {
    expect(transferClassStaffSchema.safeParse({ ...valid, newClassId: "bad" }).success).toBe(false);
    expect(transferClassStaffSchema.safeParse({ ...valid, effectiveOn: "01/11/2026" }).success).toBe(false);
  });

  it("chỉ nhận ba vai trò trong lớp", () => {
    expect(transferClassStaffSchema.safeParse({ ...valid, capacity: "class_teacher" }).success).toBe(false);
    for (const capacity of ["representative", "member", "trainee"]) {
      expect(transferClassStaffSchema.safeParse({ ...valid, capacity }).success).toBe(true);
    }
  });
});
