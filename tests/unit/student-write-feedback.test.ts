import { describe, expect, it } from "vitest";
import {
  GENDER_LABELS,
  genderLabel,
  SACRAMENT_LABELS,
  sacramentLabel,
  STUDENT_STATUS_LABELS,
  studentStatusLabel,
} from "@/features/students/student-status";
import {
  guardianCreatedFeedback,
  healthSavedFeedback,
  sacramentSavedFeedback,
  studentCreatedFeedback,
  studentFailureFeedback,
  studentSavedFeedback,
} from "@/features/students/student-feedback";
import {
  createStudentValuesFromForm,
  CREATE_STUDENT_INITIAL_STATE,
  EMPTY_CREATE_STUDENT_VALUES,
} from "@/features/students/create-student-form-state";

/**
 * M03-A · TB-F14 — kênh phản hồi cho hồ sơ thiếu nhi và người giám hộ.
 *
 * Bộ test này canh ba điều mà biên bản audit M03 nêu là gốc rễ của sáu luồng bị
 * chấm thấp:
 *
 *   1. **Câu thành công nói ra kết quả thật** — nêu tên em và mã `CQxxxx`
 *      (AC-F14-01). Một câu "Đã lưu" suông không phân biệt được với một câu thành
 *      công giả.
 *   2. **0 dòng là THẤT BẠI, không phải thành công** (BR-M03-N11 / SW-04).
 *   3. **Nội dung đã nhập không bị mất khi có lỗi** (AC-F14-03).
 */

describe("M03-A · nhãn tiếng Việt dùng chung (hết hai bản chép tay)", () => {
  it("bốn trạng thái hồ sơ đều có nhãn; giá trị lạ trả nguyên văn", () => {
    expect(Object.keys(STUDENT_STATUS_LABELS)).toHaveLength(4);
    expect(studentStatusLabel("archived")).toBe("Lưu trữ");
    expect(studentStatusLabel("temporarily_inactive")).toBe("Tạm nghỉ");
    expect(studentStatusLabel("gi_do")).toBe("gi_do");
  });

  it("giới tính có đủ ba giá trị của enum", () => {
    expect(Object.keys(GENDER_LABELS)).toEqual(["male", "female", "other"]);
    expect(genderLabel("female")).toBe("Nữ");
  });

  it("bí tích loại `other` lấy tên tự nhập (BR-M03-25), rỗng thì rơi về 'Khác'", () => {
    expect(Object.keys(SACRAMENT_LABELS)).toHaveLength(6);
    expect(sacramentLabel("baptism")).toBe("Rửa tội");
    expect(sacramentLabel("other", "Tuyên hứa Dự trưởng")).toBe("Tuyên hứa Dự trưởng");
    expect(sacramentLabel("other", "   ")).toBe("Khác");
    expect(sacramentLabel("other", null)).toBe("Khác");
  });
});

describe("M03-A · AC-F14-01 — câu thành công nêu kết quả thật", () => {
  it("tạo hồ sơ nêu TÊN EM và MÃ CQxxxx — mã do DB sinh nên người nhập không biết trước", () => {
    const feedback = studentCreatedFeedback("Maria Nguyễn Thị A", "CQ0042");
    expect(feedback.tone).toBe("success");
    expect(feedback.text).toContain("Maria Nguyễn Thị A");
    expect(feedback.text).toContain("CQ0042");
  });

  it("sửa hồ sơ nêu tên em", () => {
    expect(studentSavedFeedback("Giuse Trần Văn B").text).toContain("Giuse Trần Văn B");
  });

  it("lưu bí tích nêu đúng loại vừa lưu", () => {
    expect(sacramentSavedFeedback("Thêm sức").text).toContain("Thêm sức");
  });

  it("sức khỏe KHÔNG nhắc lại tên em — dữ liệu nhạy cảm, câu ngắn là đủ", () => {
    const feedback = healthSavedFeedback();
    expect(feedback.tone).toBe("success");
    expect(feedback.text).toBe("Đã lưu thông tin sức khỏe.");
  });

  it("tạo giám hộ chỉ đường sang việc tiếp theo, không chỉ báo 'đã lưu'", () => {
    const text = guardianCreatedFeedback("Nguyễn Văn C").text;
    expect(text).toContain("Nguyễn Văn C");
    expect(text).toContain("Thêm thiếu nhi");
  });
});

describe("M03-A · BR-M03-N11 — 0 dòng là thất bại", () => {
  it("`no_change` là câu LỖI và nêu đúng hai khả năng", () => {
    const feedback = studentFailureFeedback("no_change");
    expect(feedback.tone).toBe("danger");
    expect(feedback.text).toContain("Không có dòng nào được cập nhật");
    expect(feedback.text).toContain("không đủ quyền");
  });

  it("trùng loại bí tích có câu riêng — trước đợt này lỗi `23505` bị nuốt (AC-F08-02)", () => {
    const text = studentFailureFeedback("duplicate_sacrament").text;
    expect(text).toContain("Mỗi loại chỉ ghi một lần");
  });

  it("câu từ chối quyền nêu đủ danh sách được ghi hồ sơ, kể cả vai trò ngành (D-63)", () => {
    const text = studentFailureFeedback("forbidden").text;
    expect(text).toContain("Thư ký");
    expect(text).toContain("Xứ đoàn trưởng");
    // D-63/D-123 — Trưởng/Phó ngành nay ghi được hồ sơ trong ngành mình. Câu cũ
    // nói họ không có quyền, tức nói sai với chính người vừa được trao quyền.
    expect(text).toContain("Trưởng/Phó ngành");
  });

  /**
   * 🔴 **Cập nhật M03-C — D-127.** Bản M03-B của bài này canh điều ngược lại
   * ("không được nhắc vai trò ngành"), vì lúc ấy `student_health_*` còn là
   * `app.can_global_write()`. Sau D-127 danh sách rộng hơn danh sách ghi hồ sơ ở
   * một đầu, nên câu từ chối phải kể **đủ**: người vừa được trao quyền mà đọc
   * một câu nói họ không có quyền sẽ đi tìm nhầm loại quyền.
   */
  it("câu từ chối sức khoẻ/bí tích kể ĐÚNG danh sách sau D-127", () => {
    const text = studentFailureFeedback("forbidden_sensitive").text;
    expect(text).toContain("sức khoẻ và bí tích");
    expect(text).toContain("Trưởng/Phó ngành");
    expect(text).toContain("Giáo lý viên");
    // Phạm vi phải nằm trong câu: quyền này là ✅📍, không phải ✅.
    expect(text).toContain("phạm vi");
  });

  it("câu từ chối LƯU TRỮ nói rõ việc người dùng VẪN làm được", () => {
    const text = studentFailureFeedback("forbidden_archive").text;
    expect(text).toContain("Lưu trữ");
    // Không có câu này thì Trưởng ngành kết luận mình mất hết quyền với hồ sơ.
    expect(text).toContain("Tạm nghỉ");
  });

  it("câu từ chối XOÁ bí tích nói rõ họ vẫn SỬA được (D-128)", () => {
    const text = studentFailureFeedback("forbidden_delete_sacrament").text;
    expect(text).toContain("xoá");
    expect(text).toContain("sửa");
  });

  it("BR-M03-N12 — câu 'còn ghi danh mở' chỉ ra việc phải làm trước", () => {
    const text = studentFailureFeedback("open_enrollment").text;
    expect(text).toContain("ghi danh");
    expect(text).toContain("Đồng thời kết thúc ghi danh");
  });

  it("BR-M03-N13 — câu 'hồ sơ chưa đang sinh hoạt' chỉ đúng hai đường chữa", () => {
    const text = studentFailureFeedback("student_not_active").text;
    expect(text).toContain("Đang sinh hoạt");
    expect(text).toContain("Khôi phục");
  });

  it("câu cụ thể của server (lỗi Zod) được ưu tiên hơn câu mặc định", () => {
    expect(studentFailureFeedback("invalid", "Vui lòng nhập tên thánh.").text).toBe(
      "Vui lòng nhập tên thánh.",
    );
    expect(studentFailureFeedback("invalid", "  ").text).toContain("Dữ liệu không hợp lệ");
  });
});

describe("M03-A · AC-F14-03 — lỗi không được bắt gõ lại", () => {
  it("đọc lại đủ mười ô người dùng vừa gõ, kể cả ô lớp của M03-B", () => {
    const formData = new FormData();
    formData.set("guardianId", "guardian-1");
    formData.set("saintName", "Maria");
    formData.set("fullName", "Nguyễn Thị A");
    formData.set("gender", "female");
    formData.set("dateOfBirth", "2015-03-12");
    formData.set("patronFeastDate", "2015-08-15");
    formData.set("phone", "0900000000");
    formData.set("address", "123 Đường X");
    formData.set("hardshipFlag", "on");
    formData.set("classId", "class-1");

    expect(createStudentValuesFromForm(formData)).toEqual({
      guardianId: "guardian-1",
      saintName: "Maria",
      fullName: "Nguyễn Thị A",
      gender: "female",
      dateOfBirth: "2015-03-12",
      patronFeastDate: "2015-08-15",
      phone: "0900000000",
      address: "123 Đường X",
      hardshipFlag: true,
      classId: "class-1",
    });
  });

  // 🔴 Pha hai của cảnh báo trùng (TB-F13) gửi LẠI toàn bộ biểu mẫu. Ô lớp lọt
  // khỏi hàm đọc này thì người dùng bấm "Vẫn tạo hồ sơ mới" và em được tạo
  // **không có lớp** — im lặng, không ai thấy. Cùng họ với lỗi `key` thiếu ở ô
  // chọn mà M04-B đã bắt được.
  it("ô lớp sống sót qua pha cảnh báo trùng", () => {
    const formData = new FormData();
    formData.set("classId", "class-9");
    formData.set("confirmDuplicate", "1");
    expect(createStudentValuesFromForm(formData).classId).toBe("class-9");
  });

  it("ô trống về chuỗi rỗng, ô chọn có mặc định, ô đánh dấu chưa tick là false", () => {
    const values = createStudentValuesFromForm(new FormData());
    expect(values.gender).toBe("male");
    expect(values.fullName).toBe("");
    expect(values.hardshipFlag).toBe(false);
  });

  it("trạng thái ban đầu là biểu mẫu sạch, không có câu phản hồi nào", () => {
    expect(CREATE_STUDENT_INITIAL_STATE.feedback).toBeNull();
    expect(CREATE_STUDENT_INITIAL_STATE.values).toEqual(EMPTY_CREATE_STUDENT_VALUES);
  });
});
