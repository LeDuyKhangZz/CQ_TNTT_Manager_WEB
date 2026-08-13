import { describe, expect, it } from "vitest";
import {
  checkUploadSize,
  formatRowCount,
  MAX_IMPORT_ROWS,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  tooManyRowsText,
  uploadTooLargeText,
} from "@/features/imports/limits";

/**
 * M12-C — hai cái trần của luồng nhập Excel (TO-BE 8 / NC-01 / NC-02),
 * đóng **SEC-10** và **SEC-12**.
 *
 * 🔴 Bài quan trọng nhất ở đây là bài đầu tiên, và nó không kiểm một hành vi mà
 * kiểm một **con số**: trần của ứng dụng phải nằm **dưới** trần ~4,5 MB mà nền
 * tảng áp cho thân request. Trần cũ 5 MB nằm **trên** nó, nên câu tiếng Việt
 * `"File vượt quá 5MB."` chưa từng có cơ hội chạy cho đúng khoảng nó canh — file
 * 4,5–5 MB chết ở tầng hạ tầng bằng một trang lỗi tiếng Anh. Một con số sai kiểu
 * này không có bài test hành vi nào bắt được.
 */

/** Trần thân request của nền tảng triển khai (`docs/12` §1 — Vercel Hobby). */
const PLATFORM_BODY_LIMIT_BYTES = 4.5 * 1024 * 1024;

describe("D-137 · trần dung lượng", () => {
  it("nằm DƯỚI trần thân request của nền tảng", () => {
    expect(MAX_UPLOAD_BYTES).toBeLessThan(PLATFORM_BODY_LIMIT_BYTES);
  });

  it("vẫn rộng gấp nhiều lần file thật nặng nhất của giáo xứ (860 KB)", () => {
    expect(MAX_UPLOAD_BYTES).toBeGreaterThan(4 * 860 * 1024);
  });

  it("nhãn hiện ra màn hình khớp với con số thật", () => {
    expect(MAX_UPLOAD_LABEL).toBe("4 MB");
    expect(MAX_UPLOAD_BYTES).toBe(4 * 1024 * 1024);
  });

  it("file đúng bằng trần thì cho qua, hơn một byte thì chặn", () => {
    expect(checkUploadSize(MAX_UPLOAD_BYTES)).toBeNull();
    expect(checkUploadSize(MAX_UPLOAD_BYTES + 1)).not.toBeNull();
  });

  it("file thật của giáo xứ đi lọt", () => {
    expect(checkUploadSize(860 * 1024)).toBeNull();
  });

  it("câu từ chối nói ra cỡ file thật, cỡ trần, và việc phải làm", () => {
    const text = uploadTooLargeText(6 * 1024 * 1024);
    expect(text).toContain("6,0 MB");
    expect(text).toContain(MAX_UPLOAD_LABEL);
    expect(text).toContain("tách theo lớp");
    // SEC-16 cùng họ: câu ra màn hình không được mang thuật ngữ kỹ thuật.
    expect(text).not.toMatch(/bodySizeLimit|413|payload/i);
  });
});

describe("D-138 · trần số dòng", () => {
  it("đủ cho một file gộp cả xứ đoàn (~900 em)", () => {
    expect(MAX_IMPORT_ROWS).toBeGreaterThanOrEqual(1000);
  });

  it("câu từ chối nói ra số dòng thật và chỉ đúng cách chia file", () => {
    const text = tooManyRowsText(120_000);
    expect(text).toContain("120.000 dòng");
    expect(text).toContain("1.000 dòng");
    expect(text).toContain("mỗi sổ lớp một file");
  });
});

describe("formatRowCount", () => {
  /**
   * ⚠️ Bài này canh đúng cái bẫy đã tránh: `toLocaleString("vi-VN")` trả về
   * `1,000` khi môi trường thiếu dữ liệu ICU — dấu phẩy giữa một câu tiếng Việt.
   */
  it("dùng dấu chấm phân nhóm nghìn, không phụ thuộc môi trường", () => {
    expect(formatRowCount(1000)).toBe("1.000");
    expect(formatRowCount(999)).toBe("999");
    expect(formatRowCount(120_000)).toBe("120.000");
    expect(formatRowCount(1_234_567)).toBe("1.234.567");
  });
});
