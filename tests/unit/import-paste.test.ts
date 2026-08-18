import { describe, expect, it } from "vitest";
import { ImportParseError } from "@/features/imports/parse";
import { MAX_PASTE_CHARS, parsePastedText } from "@/features/imports/paste";

/**
 * IMP-BULK-001 — đường **dán văn bản** của luồng nhập thiếu nhi.
 *
 * Bài kiểm canh đúng hai điều làm nên giá trị của đường này: (1) nó đọc được
 * đúng thứ người dùng dán — chép từ Excel (TAB) hoặc chép từ file hướng dẫn
 * (dấu `|`, có cả dòng kẻ Markdown); (2) khi khối dán sai, nó nói ra **sai cái
 * gì** thay vì trả một danh sách rỗng. Một khối dán hỏng mà im lặng là đúng thứ
 * lỗi CRITICAL 4.1 của đường tải file đã phải sửa.
 */

const TAB_BLOCK = [
  "Tên Thánh\tHọ và tên\tGiới tính\tNgày tháng năm sinh\tSĐT mẹ\tLớp",
  "Maria\tNguyễn Trúc Anh\tNữ\t04/12/2019\t0909123456\tẤu 1A",
  "Giuse\tLương Anh Minh\tNam\t30/12/2018\t0932797588\tẤu 1A",
].join("\n");

const MARKDOWN_BLOCK = [
  "| Tên Thánh | Họ và tên | Giới tính | Ngày tháng năm sinh | SĐT mẹ | Lớp |",
  "| --- | --- | --- | --- | --- | --- |",
  "| Maria | Nguyễn Trúc Anh | Nữ | 04/12/2019 | 0909123456 | Ấu 1A |",
].join("\n");

describe("parsePastedText", () => {
  it("đọc khối chép từ Excel (cột cách nhau bằng TAB)", () => {
    const parsed = parsePastedText(TAB_BLOCK);
    expect(parsed.layout).toBe("paste");
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].values.fullName).toBe("Nguyễn Trúc Anh");
    expect(parsed.rows[0].values.motherPhone).toBe("0909123456");
    expect(parsed.rows[0].values.className).toBe("Ấu 1A");
  });

  it("đọc khối bảng Markdown, bỏ qua dòng kẻ giữa tiêu đề và thân", () => {
    const parsed = parsePastedText(MARKDOWN_BLOCK);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].values.fullName).toBe("Nguyễn Trúc Anh");
    expect(parsed.rows[0].values.gender).toBe("Nữ");
  });

  /**
   * `rowNumber` là số dòng **trong khối dán**, kể cả dòng tiêu đề. Câu báo lỗi
   * của màn hình duyệt in chính con số này, nên nó phải trỏ đúng dòng người
   * dùng đang nhìn — lệch một dòng là bắt họ đi sửa nhầm em.
   */
  it("số dòng trỏ đúng dòng trong khối dán", () => {
    const parsed = parsePastedText(TAB_BLOCK);
    expect(parsed.rows.map((row) => row.rowNumber)).toEqual([2, 3]);
  });

  it("bỏ qua dòng trống và dòng không có tên", () => {
    const parsed = parsePastedText(
      ["Họ và tên | Ngày tháng năm sinh", "", "Nguyễn Trúc Anh | 04/12/2019", " | 05/05/2019"].join(
        "\n",
      ),
    );
    expect(parsed.rows).toHaveLength(1);
  });

  it("thiếu dòng tiêu đề thì nói ra, không trả danh sách rỗng", () => {
    expect(() => parsePastedText("Nguyễn Trúc Anh | 04/12/2019")).toThrow(ImportParseError);
    expect(() => parsePastedText("Nguyễn Trúc Anh | 04/12/2019")).toThrow(/dòng tiêu đề cột/);
  });

  it("chỉ có tên mà không có ngày sinh thì từ chối, kèm lý do", () => {
    expect(() =>
      parsePastedText(["Tên Thánh | Họ và tên", "Maria | Nguyễn Trúc Anh"].join("\n")),
    ).toThrow(/thiếu ngày sinh/);
  });

  it("chỉ có dòng tiêu đề thì cũng từ chối", () => {
    expect(() => parsePastedText("Họ và tên | Ngày tháng năm sinh")).toThrow(
      /Không tìm thấy dòng dữ liệu/,
    );
  });

  /**
   * Trần ký tự đứng cùng vai trò với trần 4 MB của đường tải file (D-137): chặn
   * **trước** khi parse, vì một khối dán khổng lồ treo Server Action y hệt một
   * file khổng lồ — mà văn bản dán thì không có dung lượng file để đo.
   */
  it("khối dán vượt trần ký tự bị chặn trước khi phân tích", () => {
    const huge = `Họ và tên | Ngày tháng năm sinh\n${"x".repeat(MAX_PASTE_CHARS)}`;
    expect(() => parsePastedText(huge)).toThrow(/vượt trần/);
  });
});
