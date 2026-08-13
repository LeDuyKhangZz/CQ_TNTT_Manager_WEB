import { describe, expect, it } from "vitest";
import {
  isIsoDate,
  isStaffAvailableOn,
  partitionTeachingStaff,
} from "../../src/features/teaching-plans/staff-availability";

const LAN = { id: "lan", label: "Maria Lan", startsOn: "2026-09-01", endsOn: "2026-10-31" };
const NAM = { id: "nam", label: "Giuse Nam", startsOn: "2026-09-01", endsOn: null };
const MUON = { id: "muon", label: "Anna Muộn", startsOn: "2026-11-15", endsOn: null };

describe("lọc người dạy theo ngày dự kiến (M06-A · TB-M06-03)", () => {
  it("nhận người còn trong nhiệm kỳ", () => {
    expect(isStaffAvailableOn(LAN, "2026-09-06")).toBe(true);
  });

  it("nhận đúng hai ngày biên", () => {
    expect(isStaffAvailableOn(LAN, "2026-09-01")).toBe(true);
    expect(isStaffAvailableOn(LAN, "2026-10-31")).toBe(true);
  });

  it("loại người đã hết nhiệm kỳ — đúng TB-05 của 08_ACCEPTANCE_CRITERIA", () => {
    expect(isStaffAvailableOn(LAN, "2026-11-05")).toBe(false);
  });

  it("loại người chưa tới ngày bắt đầu", () => {
    expect(isStaffAvailableOn(MUON, "2026-09-06")).toBe(false);
  });

  it("người chưa có ngày kết thúc thì luôn nhận", () => {
    expect(isStaffAvailableOn(NAM, "2027-05-30")).toBe(true);
  });

  it("ngày rỗng hoặc sai định dạng thì GIỮ cả danh sách", () => {
    // Ô người dạy trống trơn trong lúc người dùng còn đang gõ ngày trông như
    // "lớp này không có ai" — một lời nói dối tệ hơn hẳn việc hiện dư một lựa
    // chọn mà cơ sở dữ liệu sẽ từ chối bằng câu rõ ràng.
    expect(isStaffAvailableOn(MUON, "")).toBe(true);
    expect(isStaffAvailableOn(MUON, "06/09/2026")).toBe(true);
  });

  it("nhận ra ngày gõ dở, để màn hình không in 'Invalid Date'", () => {
    // `<input type="date">` trả chuỗi rỗng trong lúc người dùng còn đang gõ, và
    // `formatDateVi` gọi thẳng `new Date(value)`.
    expect(isIsoDate("2026-09-06")).toBe(true);
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate("2026-09")).toBe(false);
  });

  describe("giữ lại người ĐANG được chọn", () => {
    const staff = [LAN, NAM, MUON];

    it("không có ai được chọn thì chỉ trả danh sách hợp lệ", () => {
      const result = partitionTeachingStaff(staff, "2026-09-06", null);
      expect(result.available.map((p) => p.id)).toEqual(["lan", "nam"]);
      expect(result.keptSelected).toBeNull();
    });

    it("người được chọn vẫn hợp lệ thì không tách ra", () => {
      const result = partitionTeachingStaff(staff, "2026-09-06", "lan");
      expect(result.keptSelected).toBeNull();
    });

    /**
     * 🔴 Bài quan trọng nhất: đây là ca mà "chỉ lọc rồi thôi" gây ra một lỗi
     * NẶNG HƠN lỗi đang sửa. `<select>` mất giá trị đang giữ sẽ âm thầm nhảy về
     * lựa chọn đầu tiên, nên mở một mục cũ và chỉ đổi mỗi NGÀY cũng đủ để người
     * dạy bị thay bằng một cái tên chưa ai bấm vào — rồi lượt lưu ghi đè.
     */
    it("người được chọn hết nhiệm kỳ thì TÁCH RA, không biến mất", () => {
      const result = partitionTeachingStaff(staff, "2026-11-05", "lan");
      expect(result.available.map((p) => p.id)).toEqual(["nam"]);
      expect(result.keptSelected?.id).toBe("lan");
    });

    it("không ai phụ trách lớp vào ngày ấy thì danh sách rỗng", () => {
      const result = partitionTeachingStaff([LAN], "2026-11-05", null);
      expect(result.available).toHaveLength(0);
      expect(result.keptSelected).toBeNull();
    });
  });
});
