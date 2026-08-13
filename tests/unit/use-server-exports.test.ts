// @vitest-environment node
/**
 * 🔴 **Một file `"use server"` chỉ được export HÀM ASYNC.**
 *
 * Bài này ra đời từ một lỗi thật của M06-B: thêm đúng một dòng
 * `export const TEACHING_PLAN_CLOSED_YEAR_MESSAGE = "…"` vào `actions.ts` làm
 * **chết cả trang** `/teaching-plan/[classId]` với
 * `A "use server" file can only export async functions, found string`.
 *
 * Điều đáng ghi lại không phải bản thân lỗi mà là **nó lọt qua cả bốn cửa
 * kiểm**: `npm run lint` · `npm run typecheck` · `npm test` · `npm run build`
 * đều xanh. Next chỉ dựng danh sách Server Action **lúc trang được dựng thật**,
 * nên bằng chứng duy nhất là một lượt chạy E2E — thứ đắt nhất và chạy sau cùng.
 * Đây là bản sinh đôi của bẫy `"use client"` mà dự án đã trả giá một lần.
 *
 * Phạm vi kiểm và giới hạn đã biết: bài này quét **văn bản**, không dựng cây cú
 * pháp. Nó bắt đúng hình dạng đã gây ra sự cố — `export const` gán một giá trị
 * không phải hàm async, và `export function` thiếu `async`. Nó **không** xét
 * `export { … }` gom cuối file; chỗ ấy phải nhờ mắt người. Một cửa chặn hẹp mà
 * chạy trong 20 mili giây vẫn hơn hẳn không có cửa nào.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(process.cwd(), "src");

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...walk(full));
    else if (/\.tsx?$/.test(entry)) found.push(full);
  }
  return found;
}

function isUseServerFile(source: string): boolean {
  return /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*|\s)*["']use server["']\s*;/.test(source);
}

/** Tên những export không hợp lệ trong một file `"use server"`. */
function illegalExports(source: string): string[] {
  const bad: string[] = [];
  // `export const X = <không phải async>` — đúng hình dạng đã gây sự cố.
  for (const match of source.matchAll(/^export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*(?::[^=]+)?=\s*(\S+)/gm)) {
    if (match[2] !== "async") bad.push(`${match[1]} (không phải hàm async)`);
  }
  // `export function` thiếu `async` cũng bị Next từ chối.
  for (const match of source.matchAll(/^export\s+function\s+([A-Za-z0-9_$]+)/gm)) {
    bad.push(`${match[1]} (hàm đồng bộ)`);
  }
  return bad;
}

describe('file "use server" chỉ export hàm async', () => {
  const files = walk(SRC).filter((file) => isUseServerFile(readFileSync(file, "utf8")));

  it("quét được đúng nhóm file Server Action của dự án", () => {
    // Không có file nào nghĩa là biểu thức nhận diện đã hỏng, và bài test sẽ
    // xanh vĩnh viễn mà không kiểm gì — đúng loại "xanh giả" cần chặn.
    expect(files.length).toBeGreaterThan(5);
  });

  /**
   * 🔴 Bài tự chứng minh. Một cửa chặn viết xong rồi xanh ngay có thể xanh vì
   * **không bắt được gì**; đây là mẫu đúng bằng dòng đã làm chết trang, cộng ba
   * mẫu hợp lệ để chắc chắn cửa không đóng nhầm.
   */
  it("bắt được đúng dòng đã làm chết trang, và không bắt nhầm dòng hợp lệ", () => {
    expect(illegalExports('export const MESSAGE = "Năm học đã đóng.";')).toHaveLength(1);
    expect(illegalExports("export function helper() {}")).toHaveLength(1);
    expect(illegalExports("export async function doThing() {}")).toEqual([]);
    expect(illegalExports("export const doThing = async () => {};")).toEqual([]);
    expect(illegalExports("export type Result = { ok: boolean };")).toEqual([]);
  });

  it("không file nào export một giá trị không phải hàm async", () => {
    const offenders = files.flatMap((file) => {
      const bad = illegalExports(readFileSync(file, "utf8"));
      return bad.length === 0 ? [] : [`${path.relative(SRC, file)}: ${bad.join(", ")}`];
    });
    expect(offenders).toEqual([]);
  });
});
