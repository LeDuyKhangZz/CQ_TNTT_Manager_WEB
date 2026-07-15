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
});
