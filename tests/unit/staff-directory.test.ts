import { describe, expect, it } from "vitest";
import {
  DEFAULT_SERVICE_FILTER,
  STAFF_PAGE_SIZE,
  formationLabel,
  paginateStaff,
  parsePage,
  parseServiceFilter,
  selectStaff,
  serviceLabel,
  staffAccountBadge,
  staffDisplayName,
  type StaffDirectoryItem,
} from "@/features/staff/staff-directory";

/**
 * M04-B / TB-M04-04 + D-108 + D-110 — hàng rào cho danh sách `/staff`.
 *
 * Đây là ĐẶC TẢ của phép lọc: nếu về sau đẩy nó xuống SQL cho nhanh thì bộ test
 * này là thứ bản SQL mới phải làm xanh lại. Ba nhóm bài, mỗi nhóm chốt một điều
 * mà audit đã ghi là hỏng:
 *
 *   · M04-F01/AC-M04-06 — không tìm được người, và trình độ huấn luyện in `NONE`
 *   · D-108 — danh sách trộn lẫn người đang phục vụ với người đã nghỉ nhiều năm
 *   · D-110 — ba mức hiển thị tài khoản mà chủ dự án chốt 2026-07-24
 */

function staff(overrides: Partial<StaffDirectoryItem> & { id: string }): StaffDirectoryItem {
  return {
    staffCode: "GLV900",
    title: "anh",
    saintName: null,
    fullName: "Nguyễn Văn A",
    phone: "0900000000",
    formationLevel: "none",
    serviceStatus: "active",
    assignment: null,
    ...overrides,
  };
}

const AU_1A = { id: "csa-1", capacity: "member", classId: "class-au-1a", className: "Ấu 1A" };
const THIEU_2B = { id: "csa-2", capacity: "representative", classId: "class-thieu-2b", className: "Thiếu 2B" };

const PEOPLE: StaffDirectoryItem[] = [
  staff({ id: "1", staffCode: "GLV901", fullName: "Trần Xuân Đoàn", saintName: "Gioan", phone: "0901000001", assignment: AU_1A }),
  staff({ id: "2", staffCode: "GLV902", fullName: "Lê Phó Đoàn", phone: "0901000002", serviceStatus: "paused" }),
  staff({ id: "3", staffCode: "GLV903", fullName: "Đặng Thị Mai", phone: "0901000003", serviceStatus: "inactive", assignment: THIEU_2B }),
  staff({ id: "4", staffCode: "GLV904", fullName: "Hoàng Văn Bảo", phone: "0901000004", formationLevel: "iii" }),
];

describe("tìm kiếm nhân sự", () => {
  it("gõ KHÔNG DẤU vẫn tìm được — người dùng thật gõ 'tran' chứ không phải 'Trần'", () => {
    const { matched } = selectStaff(PEOPLE, { search: "tran", classId: "all", service: "all" });
    expect(matched.map((item) => item.id)).toEqual(["1"]);
  });

  it("tìm được cả khi tên nhập vào ở dạng Unicode PHÂN RÃ (tệp Excel xuất từ máy Mac)", () => {
    const decomposed = "Trần Xuân Đoàn".normalize("NFD");
    const { matched } = selectStaff(PEOPLE, { search: decomposed, classId: "all", service: "all" });
    expect(matched.map((item) => item.id)).toEqual(["1"]);
  });

  it("tìm được theo mã GLV, tên thánh và số điện thoại", () => {
    for (const needle of ["GLV903", "gioan", "0901000004"]) {
      const { matched } = selectStaff(PEOPLE, { search: needle, classId: "all", service: "all" });
      expect(matched.length, needle).toBe(1);
    }
  });

  it("ô tìm kiếm rỗng không lọc bớt ai", () => {
    const { matched } = selectStaff(PEOPLE, { search: "   ", classId: "all", service: "all" });
    expect(matched).toHaveLength(PEOPLE.length);
  });
});

describe("lọc theo lớp", () => {
  it("lọc đúng một lớp", () => {
    const { matched } = selectStaff(PEOPLE, { search: "", classId: "class-au-1a", service: "all" });
    expect(matched.map((item) => item.id)).toEqual(["1"]);
  });

  it("'Chưa phân lớp' chỉ trả người không có phân công đang hiệu lực", () => {
    const { matched } = selectStaff(PEOPLE, { search: "", classId: "none", service: "all" });
    expect(matched.map((item) => item.id)).toEqual(["2", "4"]);
  });
});

describe("D-108 — mặc định ẩn người Đã nghỉ", () => {
  it("mặc định là 'serving' và GỒM CẢ người tạm nghỉ", () => {
    expect(DEFAULT_SERVICE_FILTER).toBe("serving");
    const { matched } = selectStaff(PEOPLE, { search: "", classId: "all", service: "serving" });
    expect(matched.map((item) => item.id)).toEqual(["1", "2", "4"]);
  });

  it("đếm ĐÚNG số người đang bị ẩn để màn hình nói ra được", () => {
    const { hiddenByService } = selectStaff(PEOPLE, { search: "", classId: "all", service: "serving" });
    expect(hiddenByService).toBe(1);
  });

  it("số người bị ẩn tính SAU khi đã áp tìm kiếm và lọc lớp, không phải trên toàn bảng", () => {
    // Lọc lớp Thiếu 2B còn đúng một người, mà người đó lại là người đã nghỉ.
    const { matched, hiddenByService } = selectStaff(PEOPLE, {
      search: "",
      classId: "class-thieu-2b",
      service: "serving",
    });
    expect(matched).toHaveLength(0);
    expect(hiddenByService).toBe(1);
  });

  it("'Tất cả' thì không ẩn ai và không báo ẩn ai", () => {
    const { matched, hiddenByService } = selectStaff(PEOPLE, { search: "", classId: "all", service: "all" });
    expect(matched).toHaveLength(4);
    expect(hiddenByService).toBe(0);
  });

  it("giá trị lạ trên thanh địa chỉ rơi về mặc định, không làm trống danh sách", () => {
    expect(parseServiceFilter("rác")).toBe("serving");
    expect(parseServiceFilter(undefined)).toBe("serving");
    expect(parseServiceFilter("inactive")).toBe("inactive");
  });
});

describe("phân trang", () => {
  const many = Array.from({ length: 23 }, (_, index) => staff({ id: String(index) }));

  it("cắt đúng cỡ trang và đếm đúng số trang", () => {
    const first = paginateStaff(many, 1);
    expect(first.items).toHaveLength(STAFF_PAGE_SIZE);
    expect(first.pageCount).toBe(3);
    expect(first.total).toBe(23);
  });

  it("trang cuối lấy phần dư", () => {
    expect(paginateStaff(many, 3).items).toHaveLength(3);
  });

  it("số trang vượt khung bị kẹp lại thay vì trả danh sách rỗng", () => {
    expect(paginateStaff(many, 99).page).toBe(3);
    expect(paginateStaff(many, 0).page).toBe(1);
  });

  it("tham số `page` rác trên thanh địa chỉ về 1", () => {
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("-3")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("2")).toBe(2);
  });
});

describe("nhãn tiếng Việt (AC-M04-06)", () => {
  it("trình độ huấn luyện KHÔNG bao giờ hiện ra chữ NONE", () => {
    expect(formationLabel("none")).toBe("Chưa qua huấn luyện");
    expect(formationLabel("i")).toBe("Cấp I");
    expect(formationLabel("special")).toBe("Đặc biệt");
  });

  it("trạng thái phục vụ hiện bằng tiếng Việt", () => {
    expect(serviceLabel("paused")).toBe("Tạm nghỉ");
    expect(serviceLabel("inactive")).toBe("Đã nghỉ");
  });

  it("giá trị lạ hiện nguyên văn thay vì `undefined`", () => {
    expect(formationLabel("xyz")).toBe("xyz");
    expect(serviceLabel("xyz")).toBe("xyz");
  });

  it("ghép danh xưng + tên thánh + họ tên, bỏ phần trống", () => {
    expect(staffDisplayName({ title: "chi", saintName: "Maria", fullName: "Lê Thị B" })).toBe("Chị Maria Lê Thị B");
    expect(staffDisplayName({ title: "anh", saintName: null, fullName: "Trần Văn A" })).toBe("Anh Trần Văn A");
  });
});

describe("D-110 — ba mức hiển thị tài khoản", () => {
  const withAccount = { hasAccount: true, username: "GLV045", hasActiveRole: true };

  it("Super Admin thấy tên đăng nhập", () => {
    expect(staffAccountBadge(withAccount, "full").text).toBe("Đã có GLV045");
  });

  it("vai trò quản trị xứ đoàn khác KHÔNG thấy tên đăng nhập", () => {
    expect(staffAccountBadge(withAccount, "warning").text).toBe("Đã có tài khoản");
  });

  it("người còn lại cũng chỉ thấy có/không", () => {
    expect(staffAccountBadge(withAccount, "basic").text).toBe("Đã có tài khoản");
  });

  it("cảnh báo zombie hiện cho cả 'full' lẫn 'warning'", () => {
    const zombie = { hasAccount: true, username: "GLV046", hasActiveRole: false };
    expect(staffAccountBadge(zombie, "full").text).toBe("⚠ Chưa gán vai trò");
    expect(staffAccountBadge(zombie, "warning").text).toBe("⚠ Chưa gán vai trò");
    expect(staffAccountBadge(zombie, "full").tone).toBe("warning");
  });

  it("mức 'basic' KHÔNG suy ra cảnh báo từ dữ liệu nó không đọc được", () => {
    // `hasActiveRole` là `null` ở mức này; hiện "⚠ Chưa gán vai trò" sẽ là bịa.
    const unknown = { hasAccount: true, username: null, hasActiveRole: null };
    expect(staffAccountBadge(unknown, "basic").text).toBe("Đã có tài khoản");
  });

  it("chưa có tài khoản thì mức nào cũng nói y như nhau", () => {
    const none = { hasAccount: false, username: null, hasActiveRole: null };
    for (const level of ["full", "warning", "basic"] as const) {
      expect(staffAccountBadge(none, level).text, level).toBe("Chưa có tài khoản");
    }
  });
});
