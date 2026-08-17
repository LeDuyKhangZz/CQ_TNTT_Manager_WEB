import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, Panel, panelClassName } from "@/components/ui/card";
import { tableScrollFrameClassName } from "@/components/ui/data-table";

/**
 * `Panel` — Đợt E của kế hoạch `17` (§7.2).
 *
 * Chín biến thể khối phẳng rải khắp `src/` gom về **hai** mẫu: `Card` (thẻ nổi,
 * có bóng, bo 16px) và `Panel` (khối phẳng trong thẻ, **không bóng**, bo 12px).
 *
 * 🔴 Bài kiểm canh cả **token** lẫn **hợp đồng**, không chỉ canh render — hai
 * thứ dễ trôi nhất khi sửa sau này là (a) ai đó thêm bóng cho `Panel` và biến
 * nó thành `Card` thứ hai, (b) ai đó thêm `"use client"` vào `card.tsx`.
 */

describe("Panel · token", () => {
  it("bo 12px, viền `--border`, nền trong suốt, padding 12px", () => {
    render(<Panel data-testid="p">x</Panel>);
    const panel = screen.getByTestId("p");
    expect(panel).toHaveClass("rounded-md", "border", "border-line", "bg-transparent", "p-3");
  });

  it("🔴 KHÔNG có bóng — bóng là thứ duy nhất phân biệt nó với `Card`", () => {
    render(<Panel data-testid="p">x</Panel>);
    const cls = screen.getByTestId("p").className;
    expect(cls).not.toContain("shadow");
    // Và `Card` thì phải có, nếu không hai mẫu lại hoá một.
    render(<Card data-testid="c">y</Card>);
    expect(screen.getByTestId("c")).toHaveClass("shadow-sm", "rounded-lg", "bg-surface");
  });

  it("nền trong suốt chứ KHÔNG `bg-surface`: nó nằm sẵn trên nền thẻ", () => {
    expect(panelClassName()).toContain("bg-transparent");
    expect(panelClassName()).not.toContain("bg-surface ");
  });

  it("variant `muted` là khối lõm `--bg-surface-muted`", () => {
    render(<Panel variant="muted" data-testid="p">x</Panel>);
    expect(screen.getByTestId("p")).toHaveClass("bg-surface-muted");
    expect(screen.getByTestId("p")).not.toHaveClass("bg-transparent");
  });

  it("chỉ hai mức padding, cộng một mức `none` cho khối tự lo lấy", () => {
    render(
      <>
        <Panel padding="md" data-testid="md">a</Panel>
        <Panel padding="none" data-testid="none">b</Panel>
      </>,
    );
    expect(screen.getByTestId("md")).toHaveClass("p-4");
    expect(screen.getByTestId("none").className).not.toMatch(/\bp-[0-9]/);
  });

  it("không đeo token cũ đã bỏ", () => {
    for (const banned of ["border-border", "bg-card", "rounded-lg"]) {
      expect(panelClassName({ variant: "muted", padding: "md" })).not.toContain(banned);
    }
  });
});

describe("Panel · hợp đồng", () => {
  it("🔴 `as` giữ đúng thẻ HTML của chỗ gọi — phần lớn khối này là mục danh sách", () => {
    // Ép `<li>` thành `<div>` là bỏ ngữ nghĩa danh sách: trình đọc màn hình hết
    // đọc "mục 3 trên 19". 9 chỗ gọi của Đợt E là `li`, 2 là `details`.
    render(
      <ul aria-label="ds">
        <Panel as="li">một</Panel>
      </ul>,
    );
    const items = screen.getByRole("list", { name: "ds" }).children;
    expect(items).toHaveLength(1);
    expect(items[0].tagName).toBe("LI");
    expect(items[0]).toHaveClass("rounded-md");
  });

  it("`as=\"details\"` giữ được hành vi đóng/mở gốc của trình duyệt", () => {
    render(
      <Panel as="details" variant="muted" padding="none" data-testid="d">
        <summary>Chi tiết</summary>
        <p>nội dung</p>
      </Panel>,
    );
    const details = screen.getByTestId("d") as HTMLDetailsElement;
    expect(details.tagName).toBe("DETAILS");
    expect(details.open).toBe(false);
  });

  it("`className` của chỗ gọi thắng mặc định qua twMerge, không cộng dồn", () => {
    render(<Panel padding="sm" className="p-4 bg-surface-muted" data-testid="p">x</Panel>);
    const panel = screen.getByTestId("p");
    expect(panel).toHaveClass("p-4", "bg-surface-muted");
    expect(panel).not.toHaveClass("p-3");
    expect(panel).not.toHaveClass("bg-transparent");
  });

  it("`panelClassName()` và `<Panel>` sinh ra cùng một chuỗi — một nguồn duy nhất", () => {
    render(<Panel variant="muted" padding="md" data-testid="p" />);
    for (const token of panelClassName({ variant: "muted", padding: "md" }).split(" ")) {
      expect(screen.getByTestId("p")).toHaveClass(token);
    }
  });

  it("chuyển tiếp thuộc tính thường (aria, id, data) xuống phần tử thật", () => {
    render(<Panel as="section" id="s1" aria-labelledby="h1" data-testid="p" />);
    const panel = screen.getByTestId("p");
    expect(panel).toHaveAttribute("id", "s1");
    expect(panel).toHaveAttribute("aria-labelledby", "h1");
  });
});

describe("Khung bảng dùng chung (V7)", () => {
  it("bảng dựng tay dùng lại ĐÚNG khung của `DataTable`, không chép gần đúng", () => {
    expect(tableScrollFrameClassName).toBe(
      "overflow-x-auto rounded-lg border border-line bg-surface",
    );
  });
});

/**
 * 🔴 Đo **chỉ thị** `"use client"`, không đo chuỗi chữ.
 *
 * Bản đầu của bài kiểm này dò chuỗi con và đỏ ngay ở chính đoạn chú thích giải
 * thích vì sao không được có `"use client"` — tức nó đo văn xuôi chứ không đo
 * mã. Chỉ thị chỉ có tác dụng khi là **câu lệnh đầu tiên** của tệp, nên đó đúng
 * là chỗ duy nhất cần nhìn.
 */
function hasUseClientDirective(source: string): boolean {
  return /^﻿?\s*(["'])use client\1\s*;?/.test(source);
}

describe("🔴 card.tsx phải sống được ở cả hai phía ranh giới RSC", () => {
  it("không có chỉ thị `use client`, và không import từ module có nó", async () => {
    // `Card` đang được rất nhiều Server Component dùng. Kéo ranh giới client vào
    // đây là chết trang — đã sập thật ở `/account` (mục 0.7) — trong khi lint,
    // typecheck và cả bộ kiểm đơn vị đều xanh. Chỉ phép đọc thẳng tệp mới bắt.
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/components/ui/card.tsx", "utf8");
    expect(hasUseClientDirective(source)).toBe(false);
    // Nó chỉ import `cn` — một hàm thuần, không có chỉ thị nào.
    expect(hasUseClientDirective(readFileSync("src/lib/utils.ts", "utf8"))).toBe(false);
    // Và không import gì khác từ thư mục `ui/` — mỗi import mới là một đường
    // để `"use client"` lẻn vào mà không ai nhìn thấy.
    expect(source).not.toMatch(/from "\.\//);
  });

  it("bài kiểm chỉ thị thật sự phân biệt được chỉ thị với văn xuôi", () => {
    expect(hasUseClientDirective('"use client";\nimport x from "y";')).toBe(true);
    expect(hasUseClientDirective("'use client';\n")).toBe(true);
    expect(hasUseClientDirective('/** nói về "use client" */\nimport x from "y";')).toBe(false);
  });

  it("data-table.tsx cũng vậy — hằng khung bảng đi được cả hai phía", async () => {
    const { readFileSync } = await import("node:fs");
    expect(hasUseClientDirective(readFileSync("src/components/ui/data-table.tsx", "utf8"))).toBe(
      false,
    );
  });
});
