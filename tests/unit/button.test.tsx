import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("render nội dung và mặc định type=button", () => {
    render(<Button>Lưu</Button>);
    const btn = screen.getByRole("button", { name: "Lưu" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("type", "button");
  });

  it("có thể bị disable", () => {
    render(<Button disabled>Không thể bấm</Button>);
    expect(screen.getByRole("button", { name: "Không thể bấm" })).toBeDisabled();
  });

  it("mọi size đều giữ min-h-control 44px — `sm` là nút HẸP NGANG, không phải nút thấp (09 §11)", () => {
    for (const size of ["sm", "md", "lg"] as const) {
      const { unmount } = render(<Button size={size}>Nút {size}</Button>);
      expect(screen.getByRole("button").className).toContain("min-h-control");
      unmount();
    }
  });
});

describe("Button pending (17 §8)", () => {
  it("pending: tự disabled + aria-busy, và nhãn VẪN là tên trợ năng của nút", () => {
    render(<Button pending>Lưu cấu hình</Button>);
    // Tên không được đổi trong lúc chờ — cả bộ E2E định vị nút bằng tên;
    // bản cũ đổi chữ thành "Đang lưu…" là đổi tên nút giữa chừng.
    const btn = screen.getByRole("button", { name: "Lưu cấu hình" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("không pending: không có aria-busy, không có spinner", () => {
    const { container } = render(<Button>Lưu</Button>);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-busy");
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("spinner nằm NGOÀI cây trợ năng, nhãn giữ nguyên chỗ để bề rộng không giật", () => {
    const { container } = render(<Button pending>Ghi danh</Button>);
    // Spinner: overlay tuyệt đối, aria-hidden — trình đọc màn hình chỉ nghe
    // tên nút + trạng thái busy, không nghe thêm một hình xoay vô nghĩa.
    const overlay = container.querySelector('[aria-hidden="true"]');
    expect(overlay).not.toBeNull();
    expect(overlay!.className).toContain("absolute");
    expect(overlay!.className).toContain("inset-0");
    expect(overlay!.querySelector(".animate-spin")).not.toBeNull();
    // Nhãn: vẫn render (chiếm đúng bề rộng cũ), chỉ ẩn bằng opacity — thứ
    // KHÔNG rút phần tử khỏi cây trợ năng như visibility/display.
    const label = screen.getByText("Ghi danh");
    expect(label.className).toContain("opacity-0");
    // Và nút có `relative` để overlay bám vào chính nó.
    expect(screen.getByRole("button").className).toContain("relative");
  });

  it("pending thắng cả onClick lẫn disabled do người gọi truyền", () => {
    render(
      <Button pending disabled={false}>
        Gửi
      </Button>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

/**
 * 🔴 Đo **chỉ thị** `"use client"`, không đo chuỗi chữ.
 *
 * Chỉ thị chỉ có tác dụng khi là **câu lệnh đầu tiên** của tệp — dò chuỗi con
 * thì đỏ ngay ở chính đoạn chú thích giải thích vì sao không được có nó
 * (panel.test.tsx đã trả giá đúng chỗ này).
 */
function hasUseClientDirective(source: string): boolean {
  return /^﻿?\s*(["'])use client\1\s*;?/.test(source);
}

describe("🔴 button.tsx phải sống được ở cả hai phía ranh giới RSC", () => {
  it("không có chỉ thị `use client`, và không import từ module có nó", async () => {
    // `Button` được rất nhiều Server Component render trực tiếp, và
    // `filter-bar.tsx` (không-client, 6 trang Server Component dùng) import
    // thẳng `./button`. Kéo ranh giới client vào đây là chết trang trong khi
    // lint, typecheck và cả bộ kiểm đơn vị đều xanh (đã sập thật ở `/account`,
    // mục 0.7). Chỉ phép đọc thẳng tệp mới bắt được.
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/components/ui/button.tsx", "utf8");
    expect(hasUseClientDirective(source)).toBe(false);
    // Nó chỉ import `cn` từ mã của dự án — một hàm thuần, không chỉ thị nào.
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
});
