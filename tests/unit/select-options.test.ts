import { describe, expect, it } from "vitest";
import React from "react";
import {
  collectSelectOptions,
  edgeEnabledIndex,
  findByTypeAhead,
  nextEnabledIndex,
} from "@/components/ui/select-options";

/**
 * `P3-UI-001` Đợt B — phần thuần logic của `Select` v2 (`17` §4).
 *
 * Bộ này đo cái mà widget **không** đo được bằng mắt: đọc children ra danh sách.
 * Nếu phép đọc sai thì tấm listbox hiển thị đúng nhưng gửi đi sai giá trị, và
 * đó là loại lỗi không ai thấy cho tới khi một hồ sơ ghi nhầm lớp.
 */

const option = (props: Record<string, unknown>, label?: string) =>
  React.createElement("option", props, label);

describe("collectSelectOptions", () => {
  it("đọc value và nhãn của option phẳng", () => {
    const items = collectSelectOptions([
      option({ value: "a", key: "a" }, "Ấu Nhi"),
      option({ value: "b", key: "b" }, "Thiếu Nhi"),
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ value: "a", label: "Ấu Nhi", disabled: false, group: null });
    expect(items[1]).toMatchObject({ value: "b", label: "Thiếu Nhi" });
  });

  it("🔴 option KHÔNG có value thì giá trị là phần chữ bên trong — đúng luật HTML", () => {
    // Bỏ qua điều này là sau hydration mọi `<option>Chưa chọn</option>` gửi đi
    // chuỗi rỗng, khác hẳn trước hydration.
    const items = collectSelectOptions([option({ key: "x" }, "Chưa chọn")]);
    expect(items[0].value).toBe("Chưa chọn");
  });

  it("nhận optgroup và gắn tên nhóm cho từng mục", () => {
    const items = collectSelectOptions(
      React.createElement(
        "optgroup",
        { label: "Ấu Nhi", key: "g" },
        option({ value: "a1", key: "a1" }, "Ấu 1A"),
        option({ value: "a2", key: "a2" }, "Ấu 1B"),
      ),
    );
    expect(items.map((item) => item.group)).toEqual(["Ấu Nhi", "Ấu Nhi"]);
    expect(items.map((item) => item.value)).toEqual(["a1", "a2"]);
  });

  it("optgroup disabled thì mọi mục con disabled theo", () => {
    const items = collectSelectOptions(
      React.createElement(
        "optgroup",
        { label: "Đã đóng", disabled: true, key: "g" },
        option({ value: "x", key: "x" }, "Lớp cũ"),
      ),
    );
    expect(items[0].disabled).toBe(true);
  });

  it("bỏ qua null/false và đi xuyên mảng lồng — đúng cách call site thật viết", () => {
    const items = collectSelectOptions([
      null,
      false,
      [option({ value: "a", key: "a" }, "A"), option({ value: "b", key: "b" }, "B")],
      undefined,
    ]);
    expect(items.map((item) => item.value)).toEqual(["a", "b"]);
  });

  it("dựng sẵn chuỗi bỏ dấu cho type-ahead", () => {
    const items = collectSelectOptions([option({ value: "1", key: "1" }, "Nghĩa Sĩ")]);
    expect(items[0].folded).toBe("nghia si");
  });
});

describe("findByTypeAhead", () => {
  const items = collectSelectOptions([
    option({ value: "1", key: "1" }, "Ấu Nhi"),
    option({ value: "2", key: "2" }, "Thiếu Nhi"),
    option({ value: "3", key: "3" }, "Nghĩa Sĩ"),
    option({ value: "4", key: "4" }, "Nghĩa Binh"),
  ]);

  it("gõ KHÔNG dấu vẫn tìm ra mục có dấu", () => {
    expect(findByTypeAhead(items, "au", -1)).toBe(0);
    expect(findByTypeAhead(items, "nghia", -1)).toBe(2);
  });

  it("gõ CÓ dấu cũng ra đúng mục ấy", () => {
    expect(findByTypeAhead(items, "Ấu", -1)).toBe(0);
  });

  it("quét vòng từ ngay sau vị trí hiện tại", () => {
    expect(findByTypeAhead(items, "nghia", 2)).toBe(3);
    expect(findByTypeAhead(items, "nghia", 3)).toBe(2);
  });

  it("không khớp thì trả -1, chuỗi rỗng cũng vậy", () => {
    expect(findByTypeAhead(items, "zzz", -1)).toBe(-1);
    expect(findByTypeAhead(items, "", -1)).toBe(-1);
  });

  it("bỏ qua mục disabled", () => {
    const withDisabled = collectSelectOptions([
      option({ value: "", disabled: true, key: "p" }, "Chọn ngành"),
      option({ value: "1", key: "1" }, "Chiên Con"),
    ]);
    expect(findByTypeAhead(withDisabled, "ch", -1)).toBe(1);
  });
});

describe("nextEnabledIndex · edgeEnabledIndex", () => {
  const items = collectSelectOptions([
    option({ value: "", disabled: true, key: "p" }, "Chọn lớp"),
    option({ value: "a", key: "a" }, "Ấu 1A"),
    option({ value: "b", disabled: true, key: "b" }, "Ấu 1B (đã đóng)"),
    option({ value: "c", key: "c" }, "Ấu 1C"),
  ]);

  it("nhảy qua mục disabled khi đi xuống", () => {
    expect(nextEnabledIndex(items, 1, 1)).toBe(3);
  });

  it("nhảy qua mục disabled khi đi lên", () => {
    expect(nextEnabledIndex(items, 3, -1)).toBe(1);
  });

  it("đứng ở mép thì ĐỨNG YÊN, không quay vòng", () => {
    // Quay vòng ở `↓` cuối danh sách là cái bẫy quen thuộc: người dùng giữ phím
    // để xuống cuối rồi bất ngờ nhảy về đầu.
    expect(nextEnabledIndex(items, 3, 1)).toBe(3);
    expect(nextEnabledIndex(items, 1, -1)).toBe(1);
  });

  it("Home/End bỏ qua dòng gợi ý disabled ở đầu", () => {
    expect(edgeEnabledIndex(items, 1)).toBe(1);
    expect(edgeEnabledIndex(items, -1)).toBe(3);
  });
});
