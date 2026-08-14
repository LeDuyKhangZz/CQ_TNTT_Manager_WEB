/**
 * Đọc kho câu Lời Chúa — `17_UI_POLISH_PLAN.md` §3.6.
 *
 * 🔴 File này là hàm THUẦN, cố ý **không** `server-only`: nó phải chạy được trong
 * `vitest` (jsdom) để bộ kiểm bám vào chính cái parser mà máy chủ dùng, chứ không
 * phải một bản chép thứ hai. Phần chạm đĩa nằm ở `assets.ts`.
 *
 * ⚠️ CHẤP NHẬN HAI ĐỊNH DẠNG, và đó là một quyết định có lý do:
 * kế hoạch 17 §3.6 đề nghị mỗi câu một dòng, nhưng chủ dự án điền `LoiChua.md`
 * bằng **bảng Markdown hai cột** (`| Sách - Chương:Câu | Nội Dung Lời Chúa |`).
 * Bắt chủ dự án sửa lại 145 dòng cho khớp một định dạng do máy chọn là đi ngược
 * yêu cầu *"muốn thêm câu thì thêm dòng mới, không cần đụng code"*. Nên parser
 * nhận cả hai, và người điền viết kiểu nào cũng đúng.
 */

export type LoiChuaVerse = {
  /** Nội dung câu. Không bao giờ rỗng. */
  text: string;
  /** Nguồn trích (`Ga 14,6`). `null` khi người điền không ghi. */
  source: string | null;
};

/** Dòng kẻ của bảng Markdown: `| --- | :--- |`. Chỉ gồm `-`, `:`, khoảng trắng. */
function isTableDivider(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return false;
  return /^\|[\s:|-]+\|?$/.test(trimmed) && trimmed.includes("-");
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|");
}

/** Tách `| a | b |` thành `["a", "b"]`. Bỏ ô rỗng ở hai đầu do dấu `|` biên. */
function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

/** Gỡ ngoặc kép/nháy đơn bao ngoài — người điền hay bọc câu trong dấu ngoặc. */
function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  const pairs: ReadonlyArray<readonly [string, string]> = [
    ['"', '"'],
    ["“", "”"],
    ["'", "'"],
    ["‘", "’"],
  ];
  for (const [open, close] of pairs) {
    if (trimmed.length >= 2 && trimmed.startsWith(open) && trimmed.endsWith(close)) {
      return trimmed.slice(1, -1).trim();
    }
  }
  return trimmed;
}

/**
 * Tách phần nguồn ra khỏi câu ở định dạng một-dòng: phần sau dấu `—` (hoặc `--`)
 * **cuối cùng** là nguồn trích. Dùng dấu cuối cùng chứ không phải dấu đầu tiên vì
 * chính nội dung câu cũng có thể chứa gạch ngang.
 */
function splitLineVerse(line: string): LoiChuaVerse | null {
  const withoutBullet = line.trim().replace(/^[-*+]\s+/, "");
  // `.*` THAM (greedy) chứ không lười: nó đẩy điểm cắt về dấu gạch **cuối cùng**.
  // Chính nội dung câu cũng có gạch ngang ("Ta là Đấng — sấm ngôn của ĐỨC CHÚA"),
  // cắt ở dấu đầu tiên là biến nửa câu thành tên sách.
  const match = withoutBullet.match(/^(.*)\s+(?:—|--)\s*(.*)$/);

  if (match) {
    const text = stripWrappingQuotes(match[1]);
    const source = match[2].trim();
    if (!text) return null;
    return { text, source: source || null };
  }

  const text = stripWrappingQuotes(withoutBullet);
  return text ? { text, source: null } : null;
}

/**
 * Đọc nội dung `LoiChua.md` thành danh sách câu.
 *
 * File rỗng, hoặc chỉ có tiêu đề/bảng trống → trả `[]`. Overlay khi đó chỉ hiện
 * ảnh, **không** hiện khung chữ trống — xem `loading-overlay.tsx`.
 */
export function parseLoiChua(raw: string): LoiChuaVerse[] {
  const lines = raw.split(/\r?\n/);
  const verses: LoiChuaVerse[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;
    if (trimmed.startsWith(">")) continue;
    if (isTableDivider(trimmed)) continue;

    if (isTableRow(trimmed)) {
      // Hàng tiêu đề của bảng Markdown là hàng **đứng ngay trên dòng kẻ**. Nhận
      // diện bằng cấu trúc chứ không bằng cách dò chữ "Nội Dung Lời Chúa": chủ
      // dự án đổi nhãn cột thì bảng vẫn phải đọc được.
      const next = lines[index + 1];
      if (next !== undefined && isTableDivider(next)) continue;

      const cells = splitTableRow(trimmed).filter((cell) => cell.length > 0);
      if (cells.length === 0) continue;

      // Quy ước theo đúng file hiện có: cột 1 = nguồn, cột 2 = nội dung.
      // Bảng một cột thì cột duy nhất là nội dung, không có nguồn.
      if (cells.length === 1) {
        const text = stripWrappingQuotes(cells[0]);
        if (text) verses.push({ text, source: null });
        continue;
      }

      const text = stripWrappingQuotes(cells[1]);
      const source = cells[0];
      if (text) verses.push({ text, source: source || null });
      continue;
    }

    const verse = splitLineVerse(trimmed);
    if (verse) verses.push(verse);
  }

  return verses;
}
