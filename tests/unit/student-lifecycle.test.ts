import { describe, expect, it } from "vitest";
import {
  CLOSING_STUDENT_STATUSES,
  isClosingStudentStatus,
  STUDENT_CLOSE_REASONS,
  STUDENT_STATUS_CHOICES,
  studentStatusConsequence,
  studentStatusSavedText,
} from "@/features/students/student-lifecycle";
import { CLOSE_ENROLLMENT_REASONS } from "@/features/enrollments/enrollment-status";
import {
  guardianChangeConsequence,
  guardianChangedFeedback,
  sacramentDeletedFeedback,
} from "@/features/students/student-feedback";

/**
 * M03-C — TB-F06 / TB-F12, và tiêu chí nghiệm thu chung `11` §5:
 * *"thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng**"*.
 *
 * Nhóm bài ở đây canh đúng chữ "tên riêng": mọi câu xác nhận phải chứa **tên em**
 * và **tên lớp thật**, không phải "Bạn có chắc không?". Đây là loại lỗi mà
 * typecheck không bao giờ bắt được — câu chữ vẫn là `string` hợp lệ khi nó rỗng
 * nghĩa.
 */

const NAME = "Maria Phạm Thị Hạnh";
const CLASS_NAME = "Ấu 1A";

describe("TB-F06 · hai trạng thái đóng hồ sơ", () => {
  it("đúng hai trạng thái bắt buộc đóng ghi danh", () => {
    expect([...CLOSING_STUDENT_STATUSES]).toEqual(["withdrawn", "archived"]);
  });

  it("`temporarily_inactive` KHÔNG phải trạng thái đóng — D-130", () => {
    expect(isClosingStudentStatus("temporarily_inactive")).toBe(false);
    expect(isClosingStudentStatus("active")).toBe(false);
    expect(isClosingStudentStatus("archived")).toBe(true);
    expect(isClosingStudentStatus("withdrawn")).toBe(true);
  });

  it("ô chọn có đủ bốn trạng thái của `student_status`", () => {
    expect([...STUDENT_STATUS_CHOICES]).toEqual([
      "active",
      "temporarily_inactive",
      "withdrawn",
      "archived",
    ]);
  });

  /**
   * 🔴 Lý do có bài này: hai bản chép tay của một danh sách là hình dạng của lỗi
   * F10 — nơi `paused` được định nghĩa ngược nhau ở hai tầng.
   */
  it("lý do kết thúc dùng LẠI danh sách của M03-A, không chép tay", () => {
    expect(STUDENT_CLOSE_REASONS).toBe(CLOSE_ENROLLMENT_REASONS);
  });
});

describe("🔴 `11` §5 · hộp xác nhận nêu hậu quả bằng TÊN RIÊNG", () => {
  it("lưu trữ: nêu tên em, tên lớp, lý do và hệ quả sĩ số", () => {
    const text = studentStatusConsequence("archived", NAME, CLASS_NAME, "withdrawn");
    expect(text).toContain(NAME);
    expect(text).toContain(CLASS_NAME);
    expect(text).toContain("Đã rút");
    expect(text).toContain("rời khỏi sĩ số lớp");
  });

  /**
   * 🔴 **S-11** — hệ quả duy nhất người dùng KHÔNG suy ra được từ màn hình: đóng
   * ghi danh là cắt luôn `app.class_scoped_student_ids()`, nên Giáo lý viên lớp
   * cũ mất quyền đọc hồ sơ và sức khoẻ của em ngay lập tức. Không nói ra thì họ
   * sẽ báo "hệ thống mất hồ sơ của em".
   */
  it("lưu trữ: nói ra hệ quả PHÂN QUYỀN cho Giáo lý viên lớp cũ", () => {
    const text = studentStatusConsequence("archived", NAME, CLASS_NAME);
    expect(text).toContain("Giáo lý viên");
    expect(text).toContain("sức khoẻ");
  });

  it("rút hồ sơ: KHÔNG nhắc hệ quả phân quyền — đó là chuyện riêng của lưu trữ", () => {
    const text = studentStatusConsequence("withdrawn", NAME, CLASS_NAME);
    expect(text).toContain(CLASS_NAME);
    expect(text).not.toContain("Giáo lý viên");
  });

  it("D-130: tạm nghỉ nói rõ em GIỮ chỗ và vẫn nằm trong sĩ số", () => {
    const text = studentStatusConsequence("temporarily_inactive", NAME, CLASS_NAME);
    expect(text).toContain("giữ nguyên chỗ");
    expect(text).toContain("sĩ số");
    expect(text).not.toContain("rời khỏi");
  });

  it("D-130: về đang sinh hoạt thì nói rõ ghi danh được KHÔI PHỤC", () => {
    const text = studentStatusConsequence("active", NAME, CLASS_NAME);
    expect(text).toContain("khôi phục");
    expect(text).toContain(CLASS_NAME);
  });

  it("em chưa có lớp: câu vẫn có nghĩa, không để lại chỗ trống", () => {
    for (const status of STUDENT_STATUS_CHOICES) {
      const text = studentStatusConsequence(status, NAME, null);
      expect(text).toContain(NAME);
      expect(text).not.toContain("null");
      expect(text).not.toContain("undefined");
    }
  });

  it("lý do kết thúc hiện ra bằng nhãn tiếng Việt, không phải giá trị enum", () => {
    const text = studentStatusConsequence("withdrawn", NAME, CLASS_NAME, "transferred");
    expect(text).toContain("Chuyển lớp");
    expect(text).not.toContain("transferred");
  });
});

describe("D-61 · câu SAU khi ghi phải nói kết quả THẬT", () => {
  it("mỗi kết cục của ghi danh có một câu riêng", () => {
    expect(studentStatusSavedText("archived", NAME, CLASS_NAME, "closed")).toContain(
      "không còn trong sĩ số",
    );
    expect(studentStatusSavedText("temporarily_inactive", NAME, CLASS_NAME, "paused")).toContain(
      "Tạm nghỉ",
    );
    expect(studentStatusSavedText("active", NAME, CLASS_NAME, "resumed")).toContain("khôi phục");
  });

  /**
   * `enrollmentAction` do cơ sở dữ liệu trả về chứ không do giao diện đoán: chỉ
   * `set_student_status` mới biết em có ghi danh mở hay không tại đúng thời điểm
   * ghi. Câu "không lớp nào thay đổi" là câu cho ca ấy.
   */
  it("không có ghi danh nào mở thì nói thẳng, không im lặng", () => {
    const text = studentStatusSavedText("archived", NAME, null, "none");
    expect(text).toContain(NAME);
    expect(text).toContain("không có ghi danh nào đang mở");
  });

  it("câu xác nhận và câu kết quả KHÁC nhau — một cái 'sẽ', một cái 'đã'", () => {
    const before = studentStatusConsequence("archived", NAME, CLASS_NAME);
    const after = studentStatusSavedText("archived", NAME, CLASS_NAME, "closed");
    expect(after).not.toBe(before);
    expect(after.startsWith("Đã ")).toBe(true);
  });
});

describe("🔴 TB-F12 / AC-F12-02 · đổi người giám hộ là thao tác đổi QUYỀN ĐỌC", () => {
  it("hộp xác nhận nêu đủ BA cái tên: em, người mất quyền, người được quyền", () => {
    const text = guardianChangeConsequence(NAME, "Bà Trần Thị B", "Ông Nguyễn Văn C");
    expect(text).toContain(NAME);
    expect(text).toContain("Bà Trần Thị B");
    expect(text).toContain("Ông Nguyễn Văn C");
    expect(text).toContain("KHÔNG còn xem được");
  });

  it("em chưa có phụ huynh cũ thì câu vẫn đúng, không dựng ra một người không tồn tại", () => {
    const text = guardianChangeConsequence(NAME, null, "Ông Nguyễn Văn C");
    expect(text).toContain("chưa gắn với phụ huynh nào");
    expect(text).not.toContain("null");
  });

  it("câu thành công nhắc lại hệ quả — người dùng bấm xong là rời trang", () => {
    const text = guardianChangedFeedback(NAME, "Ông Nguyễn Văn C").text;
    expect(text).toContain("cổng phụ huynh");
    expect(guardianChangedFeedback(NAME, "Ông Nguyễn Văn C").tone).toBe("success");
  });
});

describe("D-128 · câu sau khi xoá bí tích", () => {
  it("nêu đúng loại bí tích vừa xoá", () => {
    expect(sacramentDeletedFeedback("Rửa tội").text).toContain("Rửa tội");
    expect(sacramentDeletedFeedback("Rửa tội").tone).toBe("success");
  });
});
