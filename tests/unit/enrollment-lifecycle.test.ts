import { describe, expect, it } from "vitest";
import {
  CLOSE_ENROLLMENT_REASONS,
  closeReasonConsequence,
  enrollmentStatusBadgeVariant,
  enrollmentStatusLabel,
  isCloseEnrollmentReason,
  isOpenEnrollmentStatus,
  OPEN_ENROLLMENT_STATUSES,
  rosterSummary,
} from "@/features/enrollments/enrollment-status";
import {
  closeEnrollmentSchema,
  enrollStudentSchema,
  pauseEnrollmentSchema,
} from "@/features/enrollments/schemas";
import {
  closedFeedback,
  enrollmentFailureFeedback,
  enrolledFeedback,
  pausedFeedback,
  resumedFeedback,
} from "@/features/enrollments/enrollment-feedback";

/**
 * M03-A · TB-F10 — vòng đời ghi danh.
 *
 * 🔴 Bộ test này canh đúng lỗi **CRITICAL F10**: `paused` bị hai tầng định nghĩa
 * trái ngược nhau, nên "Tạm nghỉ" **luôn thất bại im lặng**. Ba hàng rào, xếp theo
 * thứ tự lỗi từng đi qua:
 *
 *   1. `paused` **là trạng thái mở** — nếu nó lọt vào danh sách lý do kết thúc thì
 *      lỗi tái phát nguyên vẹn.
 *   2. Schema "kết thúc" **không có chỗ nào nhận `paused`**, và schema "tạm nghỉ"
 *      **không có ô ngày** ⇒ không còn cách nào gửi `ended_on` kèm `paused`.
 *   3. Câu phản hồi nói ra kết quả thật (TB-F14), vì lỗi cũ chỉ vô hình được nhờ
 *      việc không có kênh phản hồi nào.
 */

describe("M03-A · trạng thái ghi danh (BR-M03-N01, N02)", () => {
  it("chỉ `active` và `paused` là trạng thái MỞ — trùng khít partial unique index của DB", () => {
    expect([...OPEN_ENROLLMENT_STATUSES]).toEqual(["active", "paused"]);
    expect(isOpenEnrollmentStatus("active")).toBe(true);
    expect(isOpenEnrollmentStatus("paused")).toBe(true);
    for (const closed of ["completed", "withdrawn", "transferred", "repeating"]) {
      expect(isOpenEnrollmentStatus(closed)).toBe(false);
    }
  });

  it("🔴 `paused` KHÔNG nằm trong danh sách lý do kết thúc — đây chính là lỗi F10", () => {
    expect(CLOSE_ENROLLMENT_REASONS).not.toContain("paused");
    expect(isCloseEnrollmentReason("paused")).toBe(false);
    expect(CLOSE_ENROLLMENT_REASONS).toHaveLength(4);
  });

  it("nhãn là tiếng Việt; giá trị lạ trả nguyên văn thay vì bịa", () => {
    expect(enrollmentStatusLabel("paused")).toBe("Tạm nghỉ");
    expect(enrollmentStatusLabel("repeating")).toBe("Học lại");
    expect(enrollmentStatusLabel("con_gi_do")).toBe("con_gi_do");
  });

  it("huy hiệu phân biệt được ba nhóm, và luôn đi kèm chữ (điều cấm thứ 5)", () => {
    expect(enrollmentStatusBadgeVariant("active")).toBe("success");
    expect(enrollmentStatusBadgeVariant("paused")).toBe("warning");
    expect(enrollmentStatusBadgeVariant("withdrawn")).toBe("secondary");
  });
});

describe("M03-A · D-121 — sĩ số tách hai số", () => {
  it("không có em nào tạm nghỉ thì giữ câu ngắn", () => {
    const summary = rosterSummary(["active", "active", "active"]);
    expect(summary).toEqual({ total: 3, paused: 0, text: "Sĩ số đang sinh hoạt: 3" });
  });

  it("có em tạm nghỉ thì nói ra cả hai con số", () => {
    const summary = rosterSummary(["active", "paused", "active", "paused"]);
    expect(summary.total).toBe(4);
    expect(summary.paused).toBe(2);
    expect(summary.text).toBe("Sĩ số 4 · trong đó 2 tạm nghỉ");
  });

  it("ghi danh đã đóng KHÔNG được tính vào sĩ số", () => {
    const summary = rosterSummary(["active", "withdrawn", "completed", "transferred", "repeating"]);
    expect(summary.total).toBe(1);
    expect(summary.paused).toBe(0);
  });

  it("lớp rỗng không làm vỡ câu chữ", () => {
    expect(rosterSummary([]).text).toBe("Sĩ số đang sinh hoạt: 0");
  });
});

describe("M03-A · D-122 — hộp xác nhận nêu hậu quả bằng tên riêng", () => {
  it('lý do "Chuyển lớp" phải nói thẳng rằng hệ thống KHÔNG ghi danh em vào lớp mới', () => {
    const text = closeReasonConsequence("transferred", "Maria Nguyễn Thị A", "Ấu 1A");
    expect(text).toContain("Maria Nguyễn Thị A");
    expect(text).toContain("Ấu 1A");
    expect(text).toContain("CHỈ đóng ghi danh ở lớp hiện tại");
    expect(text).toContain("lớp mới");
  });

  it("các lý do còn lại nêu tên em, tên lớp và việc em rời sĩ số", () => {
    const text = closeReasonConsequence("withdrawn", "Giuse Trần Văn B", "Thiếu 2B");
    expect(text).toContain("Giuse Trần Văn B");
    expect(text).toContain("Thiếu 2B");
    expect(text).toContain("rời khỏi sĩ số");
    expect(text).not.toContain("CHỈ đóng ghi danh");
  });
});

describe("M03-A · schema (BR-M03-N01, N02)", () => {
  const uuid = "11111111-1111-4111-8111-111111111111";

  it('schema "tạm nghỉ" KHÔNG có ô ngày ⇒ không có cách nào gửi `ended_on` kèm `paused`', () => {
    const parsed = pauseEnrollmentSchema.parse({ enrollmentId: uuid, endedOn: "2026-07-28" });
    expect(parsed).toEqual({ enrollmentId: uuid });
    expect("endedOn" in parsed).toBe(false);
  });

  it("🔴 schema kết thúc TỪ CHỐI `paused` — hàng rào cuối ở tầng ứng dụng", () => {
    const result = closeEnrollmentSchema.safeParse({
      enrollmentId: uuid,
      status: "paused",
      endedOn: "2026-07-28",
    });
    expect(result.success).toBe(false);
  });

  it("kết thúc bắt buộc có ngày, và ngày phải đúng dạng yyyy-MM-dd", () => {
    expect(
      closeEnrollmentSchema.safeParse({ enrollmentId: uuid, status: "withdrawn" }).success,
    ).toBe(false);
    expect(
      closeEnrollmentSchema.safeParse({ enrollmentId: uuid, status: "withdrawn", endedOn: "28/07/2026" })
        .success,
    ).toBe(false);
    expect(
      closeEnrollmentSchema.safeParse({ enrollmentId: uuid, status: "withdrawn", endedOn: "2026-07-28" })
        .success,
    ).toBe(true);
  });

  it("cả bốn lý do đóng đều hợp lệ", () => {
    for (const reason of CLOSE_ENROLLMENT_REASONS) {
      const result = closeEnrollmentSchema.safeParse({
        enrollmentId: uuid,
        status: reason,
        endedOn: "2026-07-28",
      });
      expect(result.success).toBe(true);
    }
  });

  it("ghi danh từ chối id không phải UUID bằng câu tiếng Việt", () => {
    const result = enrollStudentSchema.safeParse({
      studentId: "khong-phai-uuid",
      classId: uuid,
      enrolledOn: "2026-07-28",
      notes: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Thiếu nhi không hợp lệ.");
  });
});

describe("M03-A · TB-F14 — câu phản hồi nói ra kết quả thật", () => {
  it("tạm nghỉ nêu CẢ HAI hệ quả trái trực giác: em vẫn thuộc lớp, và có đường quay lại", () => {
    const text = pausedFeedback("Maria Nguyễn Thị A").text;
    expect(text).toContain("Maria Nguyễn Thị A");
    expect(text).toContain("vẫn thuộc lớp");
    expect(text).toContain("Khôi phục");
  });

  it("khôi phục nói ra trạng thái mới", () => {
    expect(resumedFeedback("Giuse B").text).toContain("Đang học");
  });

  it('câu thành công của lý do "Chuyển lớp" vẫn nhắc việc còn phải làm', () => {
    expect(closedFeedback("Maria A", "transferred").text).toContain("lớp mới");
    expect(closedFeedback("Maria A", "withdrawn").text).not.toContain("lớp mới");
  });

  it("ghi danh nêu tên em và tên lớp", () => {
    const text = enrolledFeedback("Maria A", "Ấu 1A").text;
    expect(text).toContain("Maria A");
    expect(text).toContain("Ấu 1A");
  });

  it("⚠️ 0 dòng bị RLS chặn phải ra câu LỖI nêu đúng hai khả năng (BR-M03-N05)", () => {
    const feedback = enrollmentFailureFeedback("no_change");
    expect(feedback.tone).toBe("danger");
    expect(feedback.text).toContain("Không có dòng nào được cập nhật");
    expect(feedback.text).toContain("năm học đã đóng");
    expect(feedback.text).toContain("không đủ quyền");
  });

  it("câu cụ thể do server viết ra được ưu tiên hơn câu mặc định", () => {
    const feedback = enrollmentFailureFeedback("invalid", "Ngày không hợp lệ.");
    expect(feedback.text).toBe("Ngày không hợp lệ.");
  });

  it("chuỗi rỗng KHÔNG được coi là câu cụ thể — rơi về câu mặc định của mã lỗi", () => {
    expect(enrollmentFailureFeedback("duplicate", "   ").text).toContain("ghi danh đang mở");
  });

  it("câu từ chối quyền nêu đúng SÁU vai trò được ghi danh, không phải nhóm của cài đặt lớp", () => {
    const text = enrollmentFailureFeedback("forbidden").text;
    expect(text).toContain("Trưởng ngành");
    expect(text).toContain("Phó ngành");
  });
});
