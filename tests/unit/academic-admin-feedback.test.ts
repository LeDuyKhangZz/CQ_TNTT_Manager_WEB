import { describe, expect, it } from "vitest";
import {
  academicYearStatusLabel,
  doneFeedback,
  failureFeedback,
  generationFeedback,
  openWorkFeedback,
  ACADEMIC_YEAR_STATUS_LABELS,
} from "@/features/academic-years/admin-feedback";
import {
  classifyAcademicYearDbError,
  parseGenerateClassesResult,
  parseOpenWork,
  parseOpenWorkFromMessage,
} from "@/features/academic-years/db-errors";
import { createYearValuesFromForm } from "@/features/academic-years/create-year-form-state";
import { classFailureFeedback, classSavedFeedback } from "@/features/classes/class-feedback";

/**
 * M02-A — TB-F02 / TB-F12, AC-M02-01 · AC-M02-02 · AC-M02-04.
 *
 * Bộ test này canh đúng thứ đã gây sự cố production: **một con số 0 mang hai
 * nghĩa trái ngược**. "Đã có đủ lớp từ trước" và "không tạo được lớp nào" phải
 * ra hai câu khác hẳn nhau, nếu không người vận hành lại tin rằng cơ cấu lớp đã
 * sẵn sàng trong khi hệ thống đang rỗng.
 */

describe("nhãn trạng thái năm học", () => {
  it("dịch cả bốn trạng thái sang tiếng Việt", () => {
    expect(Object.keys(ACADEMIC_YEAR_STATUS_LABELS).sort()).toEqual([
      "archived",
      "closed",
      "current",
      "draft",
    ]);
    expect(academicYearStatusLabel("draft")).toBe("Nháp");
    expect(academicYearStatusLabel("current")).toBe("Đang áp dụng");
    expect(academicYearStatusLabel("closed")).toBe("Đã đóng");
    expect(academicYearStatusLabel("archived")).toBe("Đã lưu trữ");
  });

  it("giá trị lạ thì trả nguyên văn, không in chuỗi rỗng", () => {
    expect(academicYearStatusLabel("locked")).toBe("locked");
  });
});

describe("thông báo sau khi sinh lớp", () => {
  it("vừa tạo đủ thì nói ĐÃ TẠO kèm số lượng", () => {
    expect(generationFeedback(19, 19)).toEqual({ tone: "success", text: "Đã tạo 19/19 lớp." });
  });

  it("đã có sẵn thì nói ĐÃ CÓ TỪ TRƯỚC — không được lẫn với vừa tạo", () => {
    const feedback = generationFeedback(0, 19);
    expect(feedback.tone).toBe("success");
    expect(feedback.text).toContain("đã có đủ 19 lớp từ trước");
    expect(feedback.text).not.toContain("Đã tạo 0");
  });

  it("tạo bù phần còn thiếu thì nói rõ tạo THÊM bao nhiêu", () => {
    const feedback = generationFeedback(4, 19);
    expect(feedback.text).toContain("Đã tạo thêm 4 lớp");
    expect(feedback.text).toContain("19/19");
  });
});

describe("thông báo thất bại", () => {
  it("thiếu danh mục lớp chuẩn thì nói ra VIỆC PHẢI LÀM, không chỉ 'có lỗi'", () => {
    const feedback = failureFeedback("reference_data_missing");
    expect(feedback.tone).toBe("danger");
    expect(feedback.text).toContain("danh mục lớp chuẩn");
    expect(feedback.text).toContain("không tạo được lớp nào");
  });

  it("năm học đã đóng có câu riêng", () => {
    expect(failureFeedback("year_closed").text).toContain("đã đóng");
  });

  it("trùng mã năm học có câu riêng", () => {
    expect(failureFeedback("year_code_taken").text).toContain("đã tồn tại");
  });

  it("no-op im lặng cũng là thất bại, không phải thành công (SW-04)", () => {
    const feedback = failureFeedback("no_change");
    expect(feedback.tone).toBe("danger");
    expect(feedback.text).toContain("Không có dòng nào được cập nhật");
  });

  it("năm thao tác thành công có năm câu khác nhau", () => {
    const texts = ["year_created", "current_set", "settings_saved", "milestone_saved", "milestone_cleared"].map(
      (code) => doneFeedback(code as "year_created").text,
    );
    expect(new Set(texts).size).toBe(5);
    expect(texts[0]).toContain("sinh cơ cấu lớp chuẩn");
  });

  /**
   * D-71 / D-115 — lưu mốc và XOÁ mốc là hai kết quả khác nhau, và cả hai phải nói
   * ra mốc này dùng để làm gì. Một dòng "Đã lưu" suông không cho người dùng biết vì
   * sao hệ thống hỏi ngày đó, nên lần sau họ vẫn để trống.
   */
  it("lưu mốc học kỳ 1 nói rõ hệ thống CHỈ cảnh báo, không tự đóng lớp", () => {
    const feedback = doneFeedback("milestone_saved");
    expect(feedback.tone).toBe("success");
    expect(feedback.text).toContain("Dự trưởng");
    expect(feedback.text).toContain("không tự đóng lớp");
  });

  it("xoá mốc học kỳ 1 nói rõ hệ quả: không còn cảnh báo nào", () => {
    expect(doneFeedback("milestone_cleared").text).toContain("không hiện cảnh báo");
  });
});

describe("phân loại lỗi cơ sở dữ liệu", () => {
  it("hai luật nghiệp vụ cùng mã 23514 vẫn phải tách được nhau", () => {
    expect(
      classifyAcademicYearDbError({ code: "23514", message: "CLASS_TEMPLATES_EMPTY" }),
    ).toEqual({ appCode: "REFERENCE_DATA_MISSING", failed: "reference_data_missing" });
    expect(
      classifyAcademicYearDbError({ code: "23514", message: "ACADEMIC_YEAR_CLOSED" }),
    ).toEqual({ appCode: "VALIDATION_ERROR", failed: "year_closed" });
  });

  it("không đủ quyền, không tìm thấy và trùng mã đi đúng ba đường khác nhau", () => {
    expect(classifyAcademicYearDbError({ code: "42501" }).appCode).toBe("FORBIDDEN");
    expect(classifyAcademicYearDbError({ code: "P0002" }).appCode).toBe("RESOURCE_NOT_FOUND");
    expect(classifyAcademicYearDbError({ code: "23505" }).failed).toBe("year_code_taken");
  });

  it("lỗi không nhận ra thì về VALIDATION_ERROR, không phải CONFLICT", () => {
    // 🔴 Bản cũ gán mọi lỗi lạ thành CONFLICT nên lỗi nhập liệu hiện ra là
    // "Thao tác bị xung đột. Vui lòng thử lại." — dẫn người dùng đi thử lại
    // đúng thứ vừa hỏng (5W-F01).
    expect(classifyAcademicYearDbError({ code: "42P01" }).appCode).toBe("VALIDATION_ERROR");
    expect(classifyAcademicYearDbError({}).failed).toBe("invalid");
  });
});

describe("đọc kết quả sinh lớp", () => {
  it("đọc đủ ba con số", () => {
    expect(
      parseGenerateClassesResult({ inserted: 19, expected: 19, already_present: 0 }),
    ).toEqual({ inserted: 19, expected: 19, alreadyPresent: 0 });
  });

  it("hình dạng lạ là THẤT BẠI, không được coi là 'đã tạo 0 lớp'", () => {
    expect(parseGenerateClassesResult(null)).toBeNull();
    expect(parseGenerateClassesResult(19)).toBeNull();
    expect(parseGenerateClassesResult({ inserted: 19 })).toBeNull();
    expect(parseGenerateClassesResult({ inserted: "nhiều", expected: 19 })).toBeNull();
  });
});

describe("giữ lại dữ liệu đã gõ ở biểu mẫu tạo năm học", () => {
  it("đọc đủ tám ô, kể cả ô đánh dấu và mốc học kỳ 1", () => {
    const formData = new FormData();
    formData.set("code", "2030-2031");
    formData.set("name", "Năm học 2030–2031");
    formData.set("startDate", "2030-09-01");
    formData.set("endDate", "2031-05-31");
    formData.set("semester1EndDate", "2031-01-15");
    formData.set("top5Enabled", "on");
    formData.set("attendanceLockDays", "5");
    formData.set("attendanceEditLeaseMinutes", "20");

    expect(createYearValuesFromForm(formData)).toEqual({
      code: "2030-2031",
      name: "Năm học 2030–2031",
      startDate: "2030-09-01",
      endDate: "2031-05-31",
      semester1EndDate: "2031-01-15",
      top5Enabled: true,
      attendanceLockDays: "5",
      attendanceEditLeaseMinutes: "20",
    });
  });

  it("ô trống về mặc định của biểu mẫu, không thành chuỗi 'null'", () => {
    const values = createYearValuesFromForm(new FormData());
    expect(values.code).toBe("");
    expect(values.top5Enabled).toBe(false);
    expect(values.attendanceLockDays).toBe("3");
    expect(values.attendanceEditLeaseMinutes).toBe("15");
    // D-116 — mốc học kỳ 1 để trống được; chuỗi rỗng, không phải "null".
    expect(values.semester1EndDate).toBe("");
  });
});

/**
 * M02-C — I7 / TB-F09 / D-73 · D-117 · D-120.
 *
 * Sáu tên luật mới của vòng đời năm học **cùng mang mã `23514`** (trừ mã gõ lại sai),
 * nên đây chính là chỗ dễ gộp nhầm nhất: "còn việc tồn đọng" và "chưa tới hạn lưu
 * trữ" là hai câu trả lời hoàn toàn khác nhau cho người dùng.
 */
describe("phân loại lỗi vòng đời năm học (M02-C)", () => {
  it("sáu tên luật cùng mã 23514 vẫn tách được nhau", () => {
    const cases: Array<[string, string]> = [
      ["YEAR_HAS_OPEN_WORK: {\"open_enrollments\": 1}", "year_has_open_work"],
      ["CLOSE_REASON_REQUIRED: đóng khi còn việc tồn đọng phải ghi lý do", "close_reason_required"],
      ["ACADEMIC_YEAR_NOT_CURRENT: chỉ năm học đang áp dụng mới đóng được", "year_not_current"],
      ["ACADEMIC_YEAR_NOT_CLOSED: chỉ năm học đã đóng mới lưu trữ được", "year_not_closed"],
      ["RETENTION_NOT_REACHED: hạn giữ dữ liệu tới 2032-05-31", "retention_not_reached"],
    ];
    for (const [message, failed] of cases) {
      expect(classifyAcademicYearDbError({ code: "23514", message }).failed).toBe(failed);
    }
    // Gõ lại sai mã dùng mã SQL khác (22023) — cùng khuôn `NAME_MISMATCH` của M04-B.
    expect(
      classifyAcademicYearDbError({ code: "22023", message: "YEAR_CODE_MISMATCH" }).failed,
    ).toBe("year_code_mismatch");
  });

  it("mỗi câu từ chối nói ra VIỆC PHẢI LÀM TIẾP", () => {
    expect(failureFeedback("year_code_mismatch").text).toContain("gõ đúng mã");
    expect(failureFeedback("close_reason_required").text).toContain("ghi lý do");
    expect(failureFeedback("year_not_closed").text).toContain("đóng năm học trước");
    expect(failureFeedback("retention_not_reached").text).toContain("5 năm");
    expect(failureFeedback("year_not_current").text).toContain("đang áp dụng");
  });

  it("chốt sổ xong phải nói HỆ QUẢ: hết năm học hiện hành", () => {
    // Không nói ra thì người dùng chỉ phát hiện khi thanh đầu trang đổi thành
    // "Chưa đặt năm học" — và họ sẽ tưởng hệ thống hỏng.
    expect(doneFeedback("year_closed").text).toContain("không còn năm học hiện hành");
    const forced = doneFeedback("year_closed_forced");
    expect(forced.text).toContain("kèm lý do");
    // D-117 — ai còn sửa được việc dở của năm vừa đóng.
    expect(forced.text).toContain("Quản trị viên hệ thống");
  });

  it("lưu trữ nói rõ dữ liệu KHÔNG bị xoá", () => {
    expect(doneFeedback("year_archived").text).toContain("không xoá");
  });
});

describe("câu từ chối chốt sổ nêu con số thật (BR-M02-N05)", () => {
  it("nêu đúng các mục còn tồn đọng, cùng khuôn D-113", () => {
    const feedback = openWorkFeedback({
      openEnrollments: 37,
      unlockedGradebooks: 0,
      openSessions: 2,
    });
    expect(feedback.tone).toBe("danger");
    expect(feedback.text).toContain("37 ghi danh đang mở");
    expect(feedback.text).toContain("2 buổi điểm danh chưa chốt");
    expect(feedback.text).not.toContain("0 bảng điểm");
    expect(feedback.text).toContain("ghi lý do");
  });

  it("không đọc được bảng kiểm thì rơi về câu chung, KHÔNG bịa số 0", () => {
    const feedback = openWorkFeedback(null);
    expect(feedback.tone).toBe("danger");
    expect(feedback.text).not.toContain("0");
  });
});

describe("đọc bảng kiểm chốt sổ", () => {
  it("đọc đủ ba con số", () => {
    expect(
      parseOpenWork({ open_enrollments: 3, unlocked_gradebooks: 1, open_sessions: 0 }),
    ).toEqual({ openEnrollments: 3, unlockedGradebooks: 1, openSessions: 0 });
  });

  it("hình dạng lạ là 'không biết', không phải 'đã xong'", () => {
    expect(parseOpenWork(null)).toBeNull();
    expect(parseOpenWork({ open_enrollments: 3 })).toBeNull();
    expect(parseOpenWork({ open_enrollments: "ba", unlocked_gradebooks: 0, open_sessions: 0 })).toBeNull();
  });

  it("bóc được bảng kiểm ra khỏi thông điệp lỗi của RPC", () => {
    // RPC nhúng chính bảng kiểm nó vừa đếm (sau khi khoá dòng) vào thông điệp lỗi,
    // nên con số hiện ra cho người dùng đúng bằng con số lúc bị từ chối.
    const message =
      'YEAR_HAS_OPEN_WORK: {"open_enrollments" : 37, "unlocked_gradebooks" : 2, "open_sessions" : 5}';
    expect(parseOpenWorkFromMessage(message)).toEqual({
      openEnrollments: 37,
      unlockedGradebooks: 2,
      openSessions: 5,
    });
  });

  it("thông điệp không có JSON thì trả null thay vì ném lỗi", () => {
    expect(parseOpenWorkFromMessage("YEAR_HAS_OPEN_WORK")).toBeNull();
    expect(parseOpenWorkFromMessage(null)).toBeNull();
    expect(parseOpenWorkFromMessage("YEAR_HAS_OPEN_WORK: {hỏng}")).toBeNull();
  });
});

describe("câu chữ của màn hình Cài đặt lớp (I6)", () => {
  it("người bị từ chối được nói đúng nhóm quyền — KHÔNG phải quyền năm học", () => {
    // Dùng lại từ điển của `/admin` sẽ nói "Vòng đời năm học chỉ dành cho Quản trị
    // viên hệ thống", khiến người dùng đi tìm sai thứ: sửa lớp là bốn vai trò ghi
    // toàn xứ đoàn, không phải chỉ Super Admin (D-112 không nói về lớp).
    const feedback = classFailureFeedback("forbidden");
    expect(feedback.text).toContain("Thư ký");
    expect(feedback.text).not.toContain("Vòng đời năm học");
  });

  it("RLS chặn (0 dòng, không lỗi) là THẤT BẠI — SW-04 / AC-M02-10", () => {
    const feedback = classFailureFeedback("no_change");
    expect(feedback.tone).toBe("danger");
    expect(feedback.text).toContain("Không có dòng nào được cập nhật");
  });

  it("năm học đã đóng có câu riêng, không lẫn với 'không đủ quyền'", () => {
    expect(classFailureFeedback("year_closed").text).toContain("đã đóng");
  });

  it("câu thành công NÊU RA trạng thái vừa lưu, không phải 'Đã lưu' suông", () => {
    expect(classSavedFeedback("Đã đóng").text).toContain("Đã đóng");
  });
});
