import { describe, expect, it } from "vitest";
import {
  duplicateWarningText,
  findDuplicateSuspects,
  type DuplicateCandidate,
} from "@/features/staff/staff-duplicates";

/**
 * M04-B / TB-M04-03 — chống trùng hồ sơ (AC-M04-05).
 *
 * Hai phía của cùng một hàng rào, và bộ test phải canh CẢ HAI:
 *   · bắt được trùng thật (bấm đúp vì 5W-05, hoặc hai người cùng nhập một sổ)
 *   · KHÔNG báo bừa — gia đình dùng chung số điện thoại và hai GLV trùng họ tên
 *     đều là chuyện bình thường, nên cảnh báo sai làm người ta bấm bỏ qua theo
 *     phản xạ và hàng rào coi như không tồn tại.
 */

function candidate(overrides: Partial<DuplicateCandidate> & { id: string }): DuplicateCandidate {
  return {
    staffCode: "GLV900",
    fullName: "Nguyễn Văn A",
    saintName: null,
    phone: "0901234567",
    dateOfBirth: null,
    serviceStatus: "active",
    ...overrides,
  };
}

describe("trùng số điện thoại", () => {
  it("bắt được trùng số điện thoại", () => {
    const found = findDuplicateSuspects([candidate({ id: "1" })], {
      fullName: "Người Khác Hẳn",
      phone: "0901234567",
      dateOfBirth: null,
    });
    expect(found).toHaveLength(1);
    expect(found[0].reason).toBe("phone");
  });

  it("bỏ qua khác biệt về định dạng: dấu cách, gạch nối, và đầu số +84", () => {
    for (const typed of ["0901 234 567", "0901-234-567", "+84901234567"]) {
      const found = findDuplicateSuspects([candidate({ id: "1" })], {
        fullName: "Người Khác Hẳn",
        phone: typed,
        dateOfBirth: null,
      });
      expect(found, typed).toHaveLength(1);
    }
  });

  it("số điện thoại khác thì im lặng", () => {
    const found = findDuplicateSuspects([candidate({ id: "1" })], {
      fullName: "Người Khác Hẳn",
      phone: "0909999999",
      dateOfBirth: null,
    });
    expect(found).toHaveLength(0);
  });
});

describe("trùng họ tên + ngày sinh", () => {
  const existing = candidate({
    id: "1",
    fullName: "Trần Xuân Đoàn",
    phone: "0900000001",
    dateOfBirth: "1998-03-12",
  });

  it("cùng tên và cùng ngày sinh ⇒ nghi trùng", () => {
    const found = findDuplicateSuspects([existing], {
      fullName: "Trần Xuân Đoàn",
      phone: "0900000002",
      dateOfBirth: "1998-03-12",
    });
    expect(found).toHaveLength(1);
    expect(found[0].reason).toBe("name-and-birthday");
  });

  it("khác dấu/hoa-thường/khoảng trắng thừa vẫn coi là cùng một tên", () => {
    const found = findDuplicateSuspects([existing], {
      fullName: "  tran  xuan doan ",
      phone: "0900000002",
      dateOfBirth: "1998-03-12",
    });
    expect(found).toHaveLength(1);
  });

  it("🔴 TRÙNG TÊN THÔI thì KHÔNG báo — hai GLV cùng tên là chuyện bình thường", () => {
    const found = findDuplicateSuspects([existing], {
      fullName: "Trần Xuân Đoàn",
      phone: "0900000002",
      dateOfBirth: "2001-07-30",
    });
    expect(found).toHaveLength(0);
  });

  it("🔴 HAI HỒ SƠ CÙNG BỎ TRỐNG ngày sinh KHÔNG phải bằng chứng trùng", () => {
    // Nếu coi null === null là "cùng ngày sinh" thì mọi người trùng tên mà chưa
    // điền ngày sinh đều bị báo trùng — cảnh báo sẽ kêu suốt và mất tác dụng.
    const noBirthday = candidate({ id: "1", fullName: "Trần Xuân Đoàn", phone: "0900000001" });
    const found = findDuplicateSuspects([noBirthday], {
      fullName: "Trần Xuân Đoàn",
      phone: "0900000002",
      dateOfBirth: null,
    });
    expect(found).toHaveLength(0);
  });
});

describe("gộp kết quả", () => {
  it("một hồ sơ chỉ xuất hiện MỘT lần dù khớp cả hai luật", () => {
    const both = candidate({ id: "1", fullName: "Trần Xuân Đoàn", phone: "0901234567", dateOfBirth: "1998-03-12" });
    const found = findDuplicateSuspects([both], {
      fullName: "Trần Xuân Đoàn",
      phone: "0901234567",
      dateOfBirth: "1998-03-12",
    });
    expect(found).toHaveLength(1);
    // Số điện thoại là dấu hiệu mạnh hơn nên được nêu làm lý do.
    expect(found[0].reason).toBe("phone");
  });

  it("nhiều hồ sơ nghi trùng thì trả về hết, không cắt bớt", () => {
    const found = findDuplicateSuspects(
      [candidate({ id: "1" }), candidate({ id: "2", staffCode: "GLV901" })],
      { fullName: "Ai Đó", phone: "0901234567", dateOfBirth: null },
    );
    expect(found.map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("danh sách rỗng thì không có gì để nghi", () => {
    expect(findDuplicateSuspects([], { fullName: "A", phone: "0900000000", dateOfBirth: null })).toEqual([]);
  });
});

describe("câu cảnh báo", () => {
  it("nêu ĐÚNG số hồ sơ nghi trùng, không nói chung chung", () => {
    expect(duplicateWarningText(1)).toBe("Đã có 1 hồ sơ trông giống người này.");
    expect(duplicateWarningText(3)).toBe("Đã có 3 hồ sơ trông giống người này.");
  });
});
