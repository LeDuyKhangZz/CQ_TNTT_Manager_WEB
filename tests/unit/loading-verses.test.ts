import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { parseLoiChua } from "@/lib/loading/verses";

/**
 * Kho câu Lời Chúa — kế hoạch 17 §3.6/§3.7.
 *
 * Bài cuối cùng đọc **chính tệp thật** chứ không đọc chuỗi tự chế: chủ dự án điền
 * `LoiChua.md` bằng bảng Markdown, không phải bằng định dạng mỗi câu một dòng mà
 * kế hoạch đề nghị. Một bộ kiểm chỉ dựng dữ liệu giả sẽ xanh trong khi màn hình
 * chờ ngoài đời không hiện được câu nào.
 */
describe("parseLoiChua", () => {
  it("tệp rỗng trả về danh sách rỗng", () => {
    expect(parseLoiChua("")).toEqual([]);
    expect(parseLoiChua("\n\n   \n")).toEqual([]);
  });

  it("bỏ tiêu đề `#` và dòng trắng", () => {
    const verses = parseLoiChua(`# Lời Chúa\n\n> ghi chú\n\n"Thầy là đường." — Ga 14,6\n`);
    expect(verses).toEqual([{ text: "Thầy là đường.", source: "Ga 14,6" }]);
  });

  it("chấp nhận gạch đầu dòng và câu không có nguồn", () => {
    const verses = parseLoiChua(`- "Anh em là muối cho đời." — Mt 5,13\n- Hãy yêu thương nhau.\n`);
    expect(verses).toEqual([
      { text: "Anh em là muối cho đời.", source: "Mt 5,13" },
      { text: "Hãy yêu thương nhau.", source: null },
    ]);
  });

  it("cắt ở dấu gạch CUỐI CÙNG, không phải dấu đầu tiên", () => {
    const verses = parseLoiChua(`Ta muốn tình yêu — sấm ngôn của ĐỨC CHÚA — Hs 6,6\n`);
    expect(verses).toEqual([
      { text: "Ta muốn tình yêu — sấm ngôn của ĐỨC CHÚA", source: "Hs 6,6" },
    ]);
  });

  it("đọc bảng Markdown: cột 1 là nguồn, cột 2 là nội dung, KHÔNG lấy hàng tiêu đề", () => {
    const verses = parseLoiChua(
      [
        "| Sách - Chương:Câu | Nội Dung Lời Chúa |",
        "| ----------------- | ----------------- |",
        "| St 1:1 | Lúc khởi đầu, Thiên Chúa sáng tạo trời đất. |",
        "| Ga 14:6 | Thầy là đường, là sự thật và là sự sống. |",
      ].join("\n"),
    );

    expect(verses).toEqual([
      { text: "Lúc khởi đầu, Thiên Chúa sáng tạo trời đất.", source: "St 1:1" },
      { text: "Thầy là đường, là sự thật và là sự sống.", source: "Ga 14:6" },
    ]);
  });

  it("bảng đổi nhãn cột vẫn đọc được — nhận diện hàng tiêu đề bằng dòng kẻ, không bằng chữ", () => {
    const verses = parseLoiChua(
      ["| Nguồn | Câu |", "| :--- | :--- |", "| Tv 23:1 | CHÚA là Mục Tử chăn dắt tôi. |"].join("\n"),
    );
    expect(verses).toEqual([{ text: "CHÚA là Mục Tử chăn dắt tôi.", source: "Tv 23:1" }]);
  });

  it("bảng một cột: cột duy nhất là nội dung, không có nguồn", () => {
    const verses = parseLoiChua(["| Câu |", "| --- |", "| Hãy vui luôn trong niềm vui. |"].join("\n"));
    expect(verses).toEqual([{ text: "Hãy vui luôn trong niềm vui.", source: null }]);
  });

  it("đọc được KHO CÂU THẬT của chủ dự án", () => {
    const raw = readFileSync(path.join(process.cwd(), "src/content/LoiChua.md"), "utf8");
    const verses = parseLoiChua(raw);

    // 145 câu lúc chuyển sang định dạng §3.6. Cận dưới chứ không phải bằng đúng:
    // chủ dự án thêm câu là chuyện được khuyến khích, không phải chuyện làm đỏ test.
    expect(verses.length).toBeGreaterThanOrEqual(145);
    expect(verses.every((verse) => verse.text.length > 0)).toBe(true);
    // Tiêu đề `#`, khối ghi chú `>` và nhãn cột của bảng cũ đều không được lọt vào.
    expect(verses.some((verse) => verse.text.includes("Nội Dung"))).toBe(false);
    expect(verses.some((verse) => verse.text.startsWith("Mỗi dòng dưới đây"))).toBe(false);
    // Mọi câu đều còn nguyên nguồn trích sau khi chuyển định dạng — mất nguồn là
    // mất đúng thứ phân biệt "câu Lời Chúa" với "một dòng chữ".
    expect(verses.filter((verse) => verse.source === null)).toEqual([]);
    expect(verses[0]).toEqual({
      source: "St 1:1",
      text: "Lúc khởi đầu, Thiên Chúa sáng tạo trời đất.",
    });
  });
});
