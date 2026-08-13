import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkTeachingMaterialFile,
  TEACHING_MATERIAL_MAX_BYTES,
  TEACHING_MATERIAL_MAX_LABEL,
  TEACHING_MATERIAL_MAX_MB,
} from "../../src/features/teaching-plans/material-limits";
import { MAX_UPLOAD_BYTES } from "../../src/features/imports/limits";

const PDF = { name: "giao-an.pdf", size: 120_000, type: "application/pdf" };

describe("trần dung lượng tài liệu giáo án (M06-A · #10 · BR-M06-16)", () => {
  it("nhận tệp PDF bình thường", () => {
    expect(checkTeachingMaterialFile(PDF)).toBeNull();
  });

  it("nhận tệp đúng bằng trần", () => {
    expect(checkTeachingMaterialFile({ ...PDF, size: TEACHING_MATERIAL_MAX_BYTES })).toBeNull();
  });

  it("chặn tệp lớn hơn trần một byte", () => {
    const message = checkTeachingMaterialFile({ ...PDF, size: TEACHING_MATERIAL_MAX_BYTES + 1 });
    expect(message).not.toBeNull();
    expect(message).toContain(TEACHING_MATERIAL_MAX_LABEL);
  });

  it("câu từ chối nói ra dung lượng THẬT của tệp, không chỉ trần", () => {
    // Người dùng không sửa được thứ họ không đo được: "quá lớn" thì họ phải
    // đoán, "5,0 MB / trần 4 MB" thì họ biết phải giảm bao nhiêu.
    const message = checkTeachingMaterialFile({ ...PDF, size: 5 * 1024 * 1024 });
    expect(message).toContain("5,0 MB");
  });

  it("chặn tệp rỗng", () => {
    expect(checkTeachingMaterialFile({ ...PDF, size: 0 })).toContain("rỗng");
  });

  it("chặn định dạng ngoài allowlist", () => {
    const message = checkTeachingMaterialFile({ name: "x.exe", size: 10, type: "application/x-msdownload" });
    expect(message).toContain("Chỉ nhận");
  });

  it("chặn tệp không có tên", () => {
    expect(checkTeachingMaterialFile({ ...PDF, name: "   " })).not.toBeNull();
  });

  /**
   * 🔴 **Bài canh quan trọng nhất của file này.**
   *
   * Trần nghiệp vụ phải nằm **dưới** trần thân request của nền tảng, nếu không
   * ứng dụng lại hứa một thứ không thể xảy ra: tệp vượt `bodySizeLimit` chết ở
   * tầng hạ tầng bằng trang lỗi tiếng Anh, **trước khi** câu tiếng Việt trong
   * Server Action kịp chạy. Đây đúng là lỗi M06 mang từ Phase 4 (trần 5 MB >
   * nền tảng 4,5 MB) và là bẫy M12-C đã ghi lại.
   *
   * Đọc thẳng `next.config.mjs` chứ không chép lại con số: một bài test chép
   * tay sẽ vẫn xanh sau khi ai đó hạ `bodySizeLimit` xuống 2mb.
   */
  it("trần nghiệp vụ nằm dưới bodySizeLimit của next.config.mjs", () => {
    const config = readFileSync(join(process.cwd(), "next.config.mjs"), "utf8");
    const matched = config.match(/bodySizeLimit:\s*"([\d.]+)mb"/);
    expect(matched, "không đọc được bodySizeLimit trong next.config.mjs").not.toBeNull();
    const platformBytes = Number(matched![1]) * 1024 * 1024;
    expect(TEACHING_MATERIAL_MAX_BYTES).toBeLessThan(platformBytes);
  });

  it("dùng chung con số với trần của luồng nhập Excel (D-137)", () => {
    // Hai luồng cùng đi qua Server Action nên cùng một trần nền tảng. Để hai
    // con số khác nhau là mở đường cho đúng lỗi vừa sửa quay lại ở luồng kia.
    expect(TEACHING_MATERIAL_MAX_BYTES).toBe(MAX_UPLOAD_BYTES);
    expect(TEACHING_MATERIAL_MAX_MB).toBe(4);
  });
});
