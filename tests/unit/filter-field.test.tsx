import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  FilterBar,
  FilterField,
  filterFieldLabelRowClassName,
  filterFieldLockedValueClassName,
} from "@/components/ui/filter-bar";
import { Select } from "@/components/ui/select";
import { SearchInputControl } from "@/components/ui/search-input";

/**
 * `FilterField` — Đợt E của kế hoạch `17` (§7.1), `09` §12 A2.
 *
 * 🔴 Bài kiểm này canh **hợp đồng hình học**, không chỉ canh render. Lý do: cái
 * `FilterField` sinh ra để chữa là *chiều cao*, mà chiều cao thì `jsdom` không
 * đo được. Thứ đo được — và đúng là thứ hỏng khi ai đó sửa ẩu — là **cấu trúc
 * ba tầng luôn có mặt**: hàng nhãn 20px + 6px, hàng control 44px, hàng gợi ý
 * 18px, **kể cả khi tầng đó rỗng**. Bỏ một tầng đi là dựng lại đúng cái lưới so
 * le ở hình 3 của chủ dự án.
 */

function rows(container: HTMLElement) {
  const field = container.firstElementChild as HTMLElement;
  return Array.from(field.children) as HTMLElement[];
}

describe("FilterField · ba tầng CỐ ĐỊNH", () => {
  it("đủ ba tầng theo đúng thứ tự nhãn → control → gợi ý", () => {
    const { container } = render(
      <FilterField label="Ngành" htmlFor="f-sector" helper="Chỉ ngành bạn xem được.">
        <Select id="f-sector" name="sector">
          <option value="all">Tất cả</option>
        </Select>
      </FilterField>,
    );

    const [labelRow, controlRow, helperRow] = rows(container);
    expect(labelRow.querySelector("label")).toHaveTextContent("Ngành");
    expect(controlRow.querySelector("select")).toBeInTheDocument();
    expect(helperRow.tagName).toBe("P");
    expect(helperRow).toHaveTextContent("Chỉ ngành bạn xem được.");
  });

  it("🔴 KHÔNG có gợi ý thì hàng gợi ý VẪN render và VẪN chiếm chỗ", () => {
    const { container } = render(
      <FilterField label="Lớp" htmlFor="f-class">
        <Select id="f-class" name="class">
          <option value="all">Tất cả</option>
        </Select>
      </FilterField>,
    );

    const [, , helperRow] = rows(container);
    // Đây chính là điều kiện làm các ô đứng thẳng hàng: ô có gợi ý và ô không
    // có gợi ý phải cao **bằng nhau**. Xoá hàng này đi là lưới so le trở lại.
    expect(helperRow).toBeInTheDocument();
    expect(helperRow.textContent).toBe("");
    expect(helperRow).toHaveClass("min-h-[18px]");
  });

  it("🔴 `hideLabel` giấu nhãn khỏi MẮT nhưng hàng nhãn vẫn giữ đúng 20px", () => {
    const { container } = render(
      <FilterField label="Tìm thiếu nhi theo tên" htmlFor="f-q" hideLabel>
        <SearchInputControl id="f-q" />
      </FilterField>,
    );

    const [labelRow] = rows(container);
    expect(labelRow).toHaveClass("h-5");
    // Nhãn vẫn có thật với trình đọc màn hình — `attendance.spec.ts` và
    // `attendance-editor-roster.test.tsx` tìm ô này bằng đúng chuỗi ấy.
    expect(screen.getByLabelText("Tìm thiếu nhi theo tên")).toBeInTheDocument();
    expect(labelRow.querySelector("label")).toHaveClass("sr-only");
  });

  it("ba tầng dùng đúng thang của `09` §5: 20px · 6px · 44px · 18px/13px", () => {
    const { container } = render(
      <FilterField label="Trạng thái" htmlFor="f-status" helper="x">
        <Select id="f-status" name="status">
          <option value="all">Tất cả</option>
        </Select>
      </FilterField>,
    );
    const [labelRow, controlRow, helperRow] = rows(container);

    expect(labelRow).toHaveClass("mb-1.5", "h-5");
    // `leading-5`: `Label` mặc định `leading-normal` = 14px × 1,5 = 21px, tràn
    // 1px khỏi hàng 20px và kéo lệch trở lại đúng thứ vừa chữa.
    expect(labelRow.querySelector("label")).toHaveClass("leading-5");
    expect(controlRow).toHaveClass("min-h-11");
    expect(helperRow).toHaveClass("min-h-[18px]", "text-xs", "text-ink-muted");
  });

  it("hằng hàng nhãn xuất ra khớp đúng thứ component dùng — hai bên không lệch", () => {
    const { container } = render(
      <FilterField label="a" htmlFor="f-a">
        <Select id="f-a" />
      </FilterField>,
    );
    const [labelRow] = rows(container);
    for (const token of filterFieldLabelRowClassName.split(" ")) {
      expect(labelRow).toHaveClass(token);
    }
  });
});

describe("FilterField · nối nhãn và gợi ý vào đúng control", () => {
  it("nhãn trỏ vào `htmlFor`, và gợi ý nối bằng `aria-describedby`", () => {
    render(
      <FilterField
        label="Tìm theo họ tên"
        htmlFor="f-staff"
        helper="Gõ không dấu cũng tìm được."
      >
        <SearchInputControl id="f-staff" name="q" />
      </FilterField>,
    );

    const input = screen.getByLabelText("Tìm theo họ tên");
    expect(input).toHaveAttribute("id", "f-staff");
    expect(input).toHaveAccessibleDescription("Gõ không dấu cũng tìm được.");
  });

  it("giữ `aria-describedby` sẵn có của chỗ gọi chứ không ghi đè", () => {
    render(
      <>
        <p id="ngoai">Câu mô tả có sẵn.</p>
        <FilterField label="Lớp" htmlFor="f-c" helper="Câu của FilterField.">
          <Select id="f-c" aria-describedby="ngoai" />
        </FilterField>
      </>,
    );
    const control = screen.getByLabelText("Lớp");
    expect(control.getAttribute("aria-describedby")).toBe("ngoai f-c-helper");
  });

  it("KHÔNG có gợi ý thì không gắn `aria-describedby` trỏ vào một thẻ rỗng", () => {
    render(
      <FilterField label="Lớp" htmlFor="f-c2">
        <Select id="f-c2" />
      </FilterField>,
    );
    expect(screen.getByLabelText("Lớp")).not.toHaveAttribute("aria-describedby");
  });

  it("🔴 `staticValue` KHÔNG dựng `<label for>` trỏ vào `<p>` — quan hệ ấy là giả", () => {
    // Trỏ `for` vào một phần tử không nhận-nhãn-được thì trình duyệt **âm thầm
    // bỏ qua**: không lỗi, không cảnh báo, chỉ là một quan hệ không tồn tại.
    render(
      <FilterField label="Kỳ báo cáo" htmlFor="f-locked" staticValue helper="Luôn là cả năm học.">
        <p id="f-locked" className={filterFieldLockedValueClassName}>
          Cả năm học
        </p>
      </FilterField>,
    );

    expect(document.querySelector("label[for='f-locked']")).toBeNull();
    expect(screen.getByText("Kỳ báo cáo").tagName).toBe("SPAN");
    expect(screen.getByText("Cả năm học")).toHaveAccessibleDescription("Luôn là cả năm học.");
  });

  it("🔴 `staticValue` KHÔNG đặt tên trợ năng cho giá trị — AC-B14 đòi đúng vế đó", () => {
    // Bản đầu của Đợt E gắn `aria-labelledby` cho `<p>` giá trị, và nó làm ĐỎ
    // 3 bài E2E trên cả ba viewport: `reports.spec.ts:279` đòi *"khi kỳ bị khoá
    // thì KHÔNG phần tử nào mang nhãn 'Kỳ báo cáo'"* — tức ô CHỌN đã biến mất.
    // Bài này canh để không ai vô tình gắn lại.
    render(
      <FilterField label="Kỳ báo cáo" htmlFor="f-locked2" staticValue>
        <p id="f-locked2" className={filterFieldLockedValueClassName}>
          Cả năm học
        </p>
      </FilterField>,
    );

    expect(screen.queryByLabelText("Kỳ báo cáo")).toBeNull();
    expect(screen.getByText("Cả năm học")).not.toHaveAttribute("aria-labelledby");
  });

  it("giá trị khoá cứng cao đúng `--control-height`, bằng ô chọn nó thay thế", () => {
    expect(filterFieldLockedValueClassName).toContain("h-control");
  });
});

describe("FilterField · sống được trong FilterBar thật", () => {
  it("nằm trong `<fieldset>` của FilterBar và gửi được bằng form GET", () => {
    render(
      <FilterBar legend="Lọc danh sách thiếu nhi" action="/students">
        <FilterField label="Ngành" htmlFor="s" helper="h">
          <Select id="s" name="sector" defaultValue="all">
            <option value="all">Tất cả ngành</option>
          </Select>
        </FilterField>
      </FilterBar>,
    );

    const group = screen.getByRole("group", { name: "Lọc danh sách thiếu nhi" });
    expect(group).toContainElement(screen.getByLabelText("Ngành"));
    expect(screen.getByLabelText("Ngành")).toHaveAttribute("name", "sector");
  });

  it("🔴 KHÔNG kéo ranh giới client vào một module Server Component đang dùng", async () => {
    // `filter-bar.tsx` được 6 trang Server Component import. Một chỉ thị
    // `"use client"` lọt vào đây (hoặc vào thứ nó import) là **chết trang** —
    // đúng cái đã sập thật ở `/account`, mục 0.7 — mà lint, typecheck và chính
    // bộ kiểm đơn vị này đều xanh. Chỉ có phép đọc thẳng tệp mới bắt được.
    // Đo **chỉ thị** chứ không đo chuỗi chữ: chỉ thị chỉ có tác dụng khi là câu
    // lệnh đầu tiên của tệp, và dò chuỗi con thì đỏ ngay ở chính chú thích này.
    const isClientModule = (source: string) => /^﻿?\s*(["'])use client\1\s*;?/.test(source);
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/components/ui/filter-bar.tsx", "utf8");
    expect(isClientModule(source)).toBe(false);
    // Nó chỉ được import từ ba module trung tính, cả ba đều không có chỉ thị ấy.
    for (const dep of ["./button", "./label", "@/lib/utils"]) {
      expect(source).toContain(`from "${dep}"`);
    }
    for (const dep of [
      "src/components/ui/button.tsx",
      "src/components/ui/label.tsx",
      "src/lib/utils.ts",
    ]) {
      expect(isClientModule(readFileSync(dep, "utf8"))).toBe(false);
    }
  });
});
