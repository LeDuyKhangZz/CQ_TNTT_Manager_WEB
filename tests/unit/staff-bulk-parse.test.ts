import { describe, expect, it } from "vitest";
import {
  MAX_STAFF_ROWS,
  parseFormationLevel,
  parseStaffCapacity,
  parseStaffComponent,
  parseStaffText,
  parseStaffTitle,
  StaffParseError,
} from "@/features/staff/bulk/parse";

/**
 * IMP-BULK-001 — nhập hàng loạt huynh trưởng / dự trưởng.
 *
 * Trọng tâm của bộ này là **những chỗ hệ thống từ chối đoán**. Xứ đoàn có ~90
 * nhân sự và mỗi năm phân công lại toàn bộ, nên cám dỗ "đoán cho nhanh" rất
 * lớn — mà mỗi lần đoán sai là một dòng ghi vào hồ sơ của một người thật.
 */

const CLASSES = new Map([
  ["au1a", "class-au-1a"],
  ["chiencon1", "class-cc-1"],
]);

function block(...lines: string[]): string {
  return [
    "Danh xưng | Tên Thánh | Họ và tên | SĐT | Ngày sinh | Cấp | Lớp | Vai trò",
    ...lines,
  ].join("\n");
}

describe("parseStaffText", () => {
  it("đọc một dòng đầy đủ và chuẩn hoá số điện thoại, ngày sinh, cấp", () => {
    const [row] = parseStaffText(
      block("Chị | Maria | Trần Bình An | +84931342624 | 07/10/2004 | 2 | Ấu 1A | GLV đại diện"),
      CLASSES,
    );
    expect(row.normalized).toMatchObject({
      title: "chi",
      saintName: "Maria",
      fullName: "Trần Bình An",
      phone: "0931342624",
      dateOfBirth: "2004-10-07",
      formationLevel: "ii",
      classId: "class-au-1a",
      capacity: "representative",
    });
    expect(row.errors).toHaveLength(0);
  });

  it("bí danh tên lớp: 'AU 1 A' vẫn ra đúng lớp Ấu 1A", () => {
    const [row] = parseStaffText(
      block("Anh | Giuse | Trần Văn B | 0909123456 | | 1 | AU 1 A | GLV lớp"),
      CLASSES,
    );
    expect(row.normalized.classId).toBe("class-au-1a");
    expect(row.errors).toHaveLength(0);
  });

  /**
   * 🔴 IMP-BULK-002 — ĐẢO NGƯỢC luật cũ (bài này trước đây tên là *"thiếu số điện
   * thoại là LỖI"*). `staff_profiles.phone` nay cho phép trống, và chủ dự án chốt
   * 2026-08-19: sổ thiếu số của 48/117 người, chặn nghĩa là cả Ban Trợ tá không
   * tồn tại trong hệ thống. Vẫn phải là **cảnh báo**, không được im lặng: người
   * nhập cần biết mình vừa tạo một hồ sơ không có cách nào liên lạc.
   */
  it("thiếu số điện thoại là CẢNH BÁO, không chặn dòng", () => {
    const [row] = parseStaffText(block("Anh | Giuse | Trần Văn B | | | 1 | Ấu 1A | GLV lớp"), CLASSES);
    expect(row.errors.map((issue) => issue.field)).not.toContain("phone");
    expect(row.warnings.map((issue) => issue.field)).toContain("phone");
    expect(row.normalized.phone).toBeNull();
  });

  /**
   * Số GÕ SAI khác số KHÔNG CÓ, và câu cảnh báo phải phân biệt được hai chuyện
   * ấy: bỏ đi một số gõ nhầm mà không nói gì thì người nhập tưởng đã có số liên lạc.
   */
  it("số điện thoại sai định dạng bị bỏ, kèm cảnh báo nói rõ là sai dạng", () => {
    const [row] = parseStaffText(
      block("Anh | Giuse | Trần Văn B | 12345 | | 1 | Ấu 1A | GLV lớp"),
      CLASSES,
    );
    expect(row.errors.map((issue) => issue.field)).not.toContain("phone");
    expect(row.normalized.phone).toBeNull();
    const warning = row.warnings.find((issue) => issue.field === "phone");
    expect(warning?.message).toContain("không đúng dạng");
  });

  it("tên lớp không khớp năm học đã chọn là lỗi, và câu lỗi nhắc đúng chữ người dùng gõ", () => {
    const [row] = parseStaffText(
      block("Anh | Giuse | Trần Văn B | 0909123456 | | 1 | Nghĩa 9 | GLV lớp"),
      CLASSES,
    );
    expect(row.errors[0].message).toContain('"Nghĩa 9"');
  });

  /**
   * Không có lớp thì **vẫn tạo hồ sơ** — cảnh báo, không phải lỗi. Trợ tá và
   * nhân sự Ban Điều hành không đứng lớp nào, mà hồ sơ của họ vẫn phải có.
   */
  it("không ghi lớp thì chỉ cảnh báo, hồ sơ vẫn tạo được", () => {
    const [row] = parseStaffText(block("Anh | Giuse | Trần Văn B | 0909123456"), CLASSES);
    expect(row.errors).toHaveLength(0);
    expect(row.warnings.map((issue) => issue.field)).toContain("className");
    expect(row.normalized.classId).toBeNull();
  });

  it("bỏ qua dòng kẻ Markdown và dòng không có tên", () => {
    const rows = parseStaffText(
      [
        "| Danh xưng | Họ và tên | SĐT |",
        "| --- | --- | --- |",
        "| Chị | Trần Bình An | 0931342624 |",
        "| | | |",
      ].join("\n"),
      CLASSES,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].normalized.fullName).toBe("Trần Bình An");
  });

  it("thiếu dòng tiêu đề thì nói ra", () => {
    expect(() => parseStaffText("Chị | Trần Bình An | 0931342624", CLASSES)).toThrow(
      StaffParseError,
    );
  });

  it("vượt trần số dòng thì chặn kèm con số", () => {
    const many = Array.from(
      { length: MAX_STAFF_ROWS + 1 },
      (_, index) => `Anh | Giuse | Người ${index} | 0909123456`,
    );
    expect(() => parseStaffText(block(...many), CLASSES)).toThrow(
      new RegExp(String(MAX_STAFF_ROWS)),
    );
  });
});

describe("parseStaffTitle", () => {
  it("cột Danh xưng nói thẳng thì dùng", () => {
    expect(parseStaffTitle("Chị", "")).toBe("chi");
    expect(parseStaffTitle("Dì", "")).toBe("di");
    expect(parseStaffTitle("Thầy", "")).toBe("thay");
  });

  it("suy từ Thành phần khi thành phần ấy TỰ NÓ xác định danh xưng", () => {
    expect(parseStaffTitle("", "Nữ tu")).toBe("so");
    expect(parseStaffTitle("", "Linh mục")).toBe("cha");
    expect(parseStaffTitle("", "Chủng sinh")).toBe("thay");
  });

  /**
   * 🔴 "Huynh trưởng" **không** cho biết Anh hay Chị. Đoán bừa là ghi sai danh
   * xưng vào hồ sơ của một người thật, nên phải rơi về `other` và để người nhập
   * sửa — bản thân việc rơi về `other` cũng sinh một cảnh báo ở `buildStaffRow`.
   */
  it("KHÔNG đoán Anh/Chị từ 'Huynh trưởng'", () => {
    expect(parseStaffTitle("", "Huynh trưởng")).toBe("other");
    expect(parseStaffTitle("", "Dự trưởng")).toBe("other");
  });
});

describe("parseStaffCapacity", () => {
  it("đọc vai trò ghi thẳng", () => {
    expect(parseStaffCapacity("GLV đại diện", "")).toBe("representative");
    expect(parseStaffCapacity("GLV lớp", "")).toBe("member");
    expect(parseStaffCapacity("Dự trưởng", "")).toBe("trainee");
  });

  it("suy Dự trưởng từ Thành phần", () => {
    expect(parseStaffCapacity("", "Dự trưởng mới")).toBe("trainee");
    expect(parseStaffCapacity("", "Huynh trưởng")).toBe("member");
  });

  /**
   * 🔴 Mỗi lớp chỉ được **một** GLV đại diện
   * (`class_staff_one_active_representative_idx`). Tự suy ra `representative` là
   * một lượt ghi hỏng chắc chắn — và nếu lọt, nó cướp chỗ đại diện của người
   * khác. Vai trò này chỉ đến từ chữ người dùng gõ.
   */
  it("KHÔNG BAO GIỜ tự suy ra 'GLV đại diện' từ Thành phần", () => {
    expect(parseStaffCapacity("", "Huynh trưởng - Trưởng ngành Ấu")).toBe("member");
    expect(parseStaffCapacity("", "Xứ đoàn trưởng")).toBe("member");
  });
});

describe("parseFormationLevel", () => {
  it("đọc cấp bằng số lẫn bằng chữ số La Mã", () => {
    expect(parseFormationLevel("1")).toBe("i");
    expect(parseFormationLevel("II")).toBe("ii");
    expect(parseFormationLevel("cấp 3")).toBe("iii");
    expect(parseFormationLevel("đặc cách")).toBe("special");
  });

  it("trống hoặc không nhận ra thì là 'none', không đoán", () => {
    expect(parseFormationLevel("")).toBe("none");
    expect(parseFormationLevel(null)).toBe("none");
    expect(parseFormationLevel("chưa học")).toBe("none");
  });
});

/**
 * STAFF-COMP-001 — cột "Thành phần" nay ĐI VÀO cơ sở dữ liệu, và nó quyết định
 * tiền tố mã hồ sơ. Trước đợt này nó được đọc rồi vứt đi, nên đọc sai cũng
 * không ai thấy; giờ đọc sai là cấp mã sai cho một người thật.
 */
describe("parseStaffComponent", () => {
  it("đọc đúng sáu thành phần có thật trong sổ của xứ đoàn", () => {
    expect(parseStaffComponent("Huynh trưởng")).toBe("huynh_truong");
    expect(parseStaffComponent("Dự trưởng")).toBe("du_truong");
    expect(parseStaffComponent("Nữ tu")).toBe("nu_tu");
    expect(parseStaffComponent("Chủng sinh")).toBe("chung_sinh");
    expect(parseStaffComponent("Linh mục")).toBe("linh_muc");
    expect(parseStaffComponent("Trợ tá")).toBe("tro_ta");
  });

  it("khớp theo CHỨA CHỮ, vì ô trong sổ là văn bản gõ tay", () => {
    // Cả bốn chuỗi này đều có thật trong `NHAP_LIEU_HANG_LOAT.md`.
    expect(parseStaffComponent("Huynh trưởng/ Phó ngành Ấu")).toBe("huynh_truong");
    expect(parseStaffComponent("Huynh trưởng Trưởng ngành Thiếu")).toBe("huynh_truong");
    expect(parseStaffComponent("Sổ DỰ TRƯỞNG 1")).toBe("du_truong");
    expect(parseStaffComponent("Dự trưởng mới")).toBe("du_truong");
  });

  it("Trợ tá thắng mọi nhánh khác — đây là giá trị đổi tiền tố mã", () => {
    expect(parseStaffComponent("Trợ tá (nguyên Huynh trưởng)")).toBe("tro_ta");
  });

  it("trống thì đọc cột Vai trò, nhưng chỉ để nhận ra Dự trưởng", () => {
    expect(parseStaffComponent("", "Dự trưởng")).toBe("du_truong");
    expect(parseStaffComponent("", "GLV lớp")).toBe("khac");
    expect(parseStaffComponent("", "GLV đại diện")).toBe("khac");
  });

  it("không nhận ra thì là 'khac' — KHÔNG lấy 'huynh trưởng' làm mặc định", () => {
    expect(parseStaffComponent("")).toBe("khac");
    expect(parseStaffComponent(null)).toBe("khac");
    expect(parseStaffComponent("Ban điều hành")).toBe("khac");
  });

  it("khối dán không có cột Thành phần vẫn ghi được, và ra 'khac'", () => {
    const [row] = parseStaffText(
      block("Chị | Maria | Trần Bình An | 0931342624 | 07/10/2004 | 2 | Ấu 1A | GLV lớp"),
      CLASSES,
    );
    expect(row.normalized.component).toBe("khac");
    expect(row.normalized.componentLabel).toBeNull();
  });

  it("giữ nguyên văn ô Thành phần để bảng xem trước đối chiếu được", () => {
    const [row] = parseStaffText(
      [
        "Danh xưng | Tên Thánh | Họ và tên | SĐT | Lớp | Vai trò | Thành phần",
        "  | Maria | Phan Thị Kim Hạnh |  |  |  | Trợ tá",
      ].join("\n"),
      CLASSES,
    );
    expect(row.normalized.component).toBe("tro_ta");
    expect(row.normalized.componentLabel).toBe("Trợ tá");
    // Không có lớp thì chỉ tạo hồ sơ — đúng hình dạng của cả Ban Trợ tá.
    expect(row.normalized.classId).toBeNull();
    expect(row.errors).toHaveLength(0);
  });
});
