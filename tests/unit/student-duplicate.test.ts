import { describe, expect, it } from "vitest";
import {
  DUPLICATE_LEVEL_LABELS,
  duplicateWarningText,
  findStrongestDuplicate,
  findStudentDuplicates,
  nameSimilarity,
  type ExistingStudent,
} from "@/lib/students/duplicate";
import { findDuplicate } from "@/features/imports/dedup";
import type { NormalizedRow } from "@/features/imports/build-row";

/**
 * TB-F13 / AC-F13-01 · AC-F13-04 — **một định nghĩa "trùng" cho cả hai đường vào**.
 *
 * Nghịch lý mà đợt này chữa: cùng dữ liệu, cùng bảng, nhưng đường Nhập Excel có
 * dò trùng ba mức còn đường gõ tay không có gì (F13 — 29/75, thấp nhất module).
 * Nhóm bài cuối cùng dưới đây là hàng rào chống tái phát: nó chạy **cùng một cặp
 * dữ liệu** qua cả hai đường và đòi cùng một mức.
 */

const EXISTING: ExistingStudent[] = [
  {
    id: "s1",
    studentCode: "CQ0042",
    fullName: "Maria Nguyễn Thị A",
    dateOfBirth: "2015-03-12",
    guardianPhone: "0900000001",
    className: "Ấu 1A",
  },
  {
    id: "s2",
    studentCode: "CQ0100",
    fullName: "Trần Phạm Ngọc Hiếu",
    dateOfBirth: "2014-01-01",
    guardianPhone: "0900000002",
    className: null,
  },
];

describe("nameSimilarity", () => {
  it("cùng tên khác kiểu chữ và khác dấu vẫn là 1", () => {
    expect(nameSimilarity("Trần Ngọc Hiếu", "TRẦN NGỌC HIẾU")).toBe(1);
  });

  it("lệch một tiếng trong tên bốn chữ vẫn trên ngưỡng gõ nhầm", () => {
    expect(nameSimilarity("Trần Phạm Ngọc Hiếu", "Trần Phạm Ngọc Hiền")).toBeGreaterThanOrEqual(0.7);
  });

  it("hai tên không liên quan chấm rất thấp", () => {
    expect(nameSimilarity("Trần Ngọc Hiếu", "Nguyễn Văn Vinh")).toBeLessThan(0.3);
  });
});

describe("TB-F13 · ba mức cảnh báo", () => {
  it("high — trùng tên, ngày sinh và số điện thoại phụ huynh", () => {
    const [match] = findStudentDuplicates(
      { fullName: "Maria Nguyễn Thị A", dateOfBirth: "2015-03-12", guardianPhone: "0900000001" },
      EXISTING,
    );
    expect(match.level).toBe("high");
    expect(match.student.studentCode).toBe("CQ0042");
  });

  it("medium — trùng tên và ngày sinh, khác số điện thoại", () => {
    const [match] = findStudentDuplicates(
      { fullName: "maria nguyen thi a", dateOfBirth: "2015-03-12", guardianPhone: "0999999999" },
      EXISTING,
    );
    expect(match.level).toBe("medium");
  });

  it("low — tên gần giống VÀ trùng số điện thoại", () => {
    const [match] = findStudentDuplicates(
      { fullName: "Trần Phạm Ngọc Hiền", dateOfBirth: "2010-05-05", guardianPhone: "0900000002" },
      EXISTING,
    );
    expect(match.level).toBe("low");
  });

  it("tên gần giống mà KHÁC số điện thoại thì không cảnh báo", () => {
    // Hai em cùng họ khác tên là chuyện thường; cảnh báo ở đây là cảnh báo rác,
    // và cảnh báo rác dạy người dùng bấm qua mọi cảnh báo.
    expect(
      findStudentDuplicates(
        { fullName: "Trần Phạm Ngọc Hiền", dateOfBirth: "2010-05-05", guardianPhone: "0911111111" },
        EXISTING,
      ),
    ).toEqual([]);
  });

  it("trùng tên mà KHÁC ngày sinh thì không cảnh báo", () => {
    expect(
      findStudentDuplicates(
        { fullName: "Maria Nguyễn Thị A", dateOfBirth: "2016-03-12", guardianPhone: null },
        EXISTING,
      ),
    ).toEqual([]);
  });

  it("chưa nhập tên thì không có gì để so", () => {
    expect(
      findStudentDuplicates({ fullName: "   ", dateOfBirth: "2015-03-12", guardianPhone: null }, EXISTING),
    ).toEqual([]);
  });

  it("nhiều ứng viên thì mạnh đứng trước — người nhập đọc từ trên xuống", () => {
    const twins: ExistingStudent[] = [
      { ...EXISTING[0], id: "weak", studentCode: "CQ0500", guardianPhone: "0999999999" },
      { ...EXISTING[0], id: "strong", studentCode: "CQ0042" },
    ];
    const matches = findStudentDuplicates(
      { fullName: "Maria Nguyễn Thị A", dateOfBirth: "2015-03-12", guardianPhone: "0900000001" },
      twins,
    );
    expect(matches.map((item) => item.level)).toEqual(["high", "medium"]);
  });
});

describe("findStrongestDuplicate — một quyết định cho đường Excel", () => {
  it("chỉ trả về mức mạnh nhất", () => {
    const match = findStrongestDuplicate(
      { fullName: "Maria Nguyễn Thị A", dateOfBirth: "2015-03-12", guardianPhone: "0900000001" },
      EXISTING,
    );
    expect(match?.level).toBe("high");
  });

  it("không có gì trùng thì trả null", () => {
    expect(
      findStrongestDuplicate(
        { fullName: "Giuse Lê Văn Z", dateOfBirth: "2013-09-09", guardianPhone: null },
        EXISTING,
      ),
    ).toBeNull();
  });
});

/**
 * 🔴 AC-F13-04 — **hàng rào chống tái phát của chính lỗi F13**.
 *
 * Cùng một cặp dữ liệu, hai đường vào, phải ra **cùng một mức**. Bài này đỏ
 * nghĩa là ai đó vừa dựng lại bản chép tay thứ hai của luật "thế nào là trùng".
 */
describe("AC-F13-04 · đường Excel và đường gõ tay cho cùng một mức", () => {
  const row = {
    full_name: "Maria Nguyễn Thị A",
    date_of_birth: "2015-03-12",
    guardian_phone: "0900000001",
  } as unknown as NormalizedRow;

  it("cùng dữ liệu ⇒ cùng mức và cùng hồ sơ", () => {
    const fromExcel = findDuplicate(row, EXISTING);
    const fromForm = findStrongestDuplicate(
      { fullName: row.full_name, dateOfBirth: row.date_of_birth, guardianPhone: row.guardian_phone },
      EXISTING,
    );
    expect(fromExcel?.level).toBe(fromForm?.level);
    expect(fromExcel?.student.id).toBe(fromForm?.student.id);
  });
});

describe("câu chữ cảnh báo", () => {
  it("nêu SỐ hồ sơ chứ không nói chung chung", () => {
    expect(duplicateWarningText(1)).toContain("1 hồ sơ");
    expect(duplicateWarningText(3)).toContain("3 hồ sơ");
  });

  it("mỗi mức có nhãn tiếng Việt riêng", () => {
    expect(DUPLICATE_LEVEL_LABELS.high).not.toBe(DUPLICATE_LEVEL_LABELS.medium);
    expect(DUPLICATE_LEVEL_LABELS.low).toMatch(/\p{L}/u);
  });
});
