import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * M14 A-07 — đường vào hồ sơ từng con.
 *
 * `/parent/children/<id>` là một route **mồ côi**: trang chạy được, dữ liệu thật,
 * nhưng không một `href` nào trong giao diện dẫn tới nó. Phụ huynh chỉ tới được
 * bằng deep-link trong thông báo. Khối này là đầu vào còn thiếu, và bài test dưới
 * đây là hàng rào để nó không lặng lẽ biến mất lần nữa.
 */

import { ChildrenLinks } from "@/features/portal/components/children-links";

const CHILDREN = [
  { id: "6f1e0d7a-0000-4000-8000-000000000001", label: "Maria Nguyễn Thị B" },
  { id: "6f1e0d7a-0000-4000-8000-000000000002", label: "Giuse Nguyễn Văn C" },
] as const;

describe("ChildrenLinks — M14 A-07", () => {
  it("mỗi con là một link thật tới đúng hồ sơ của em đó", () => {
    render(<ChildrenLinks students={CHILDREN} status="ok" />);

    for (const child of CHILDREN) {
      expect(screen.getByRole("link", { name: child.label })).toHaveAttribute(
        "href",
        `/parent/children/${child.id}`,
      );
    }
  });

  it("hàng bấm được cao ít nhất 44px (AGENTS §8)", () => {
    render(<ChildrenLinks students={CHILDREN} status="ok" />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.className).toContain("min-h-11");
    }
  });

  it("chưa gắn hồ sơ nào thì dùng trạng thái rỗng `not-linked`, không dựng link rỗng", () => {
    render(<ChildrenLinks students={[]} status="not_linked" />);

    expect(screen.queryByRole("link")).toBeNull();
    // Trạng thái rỗng phải nói được vì sao trống và làm gì tiếp (09 §9).
    expect(screen.getByRole("heading", { level: 3 }).textContent).toContain("chưa được gắn");
    expect(screen.getByText(/Ban quản trị Xứ đoàn/)).toBeInTheDocument();
  });

  it("phân biệt hồ sơ người giám hộ có thật nhưng chưa gắn con", () => {
    render(<ChildrenLinks students={[]} status="no_children" />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("chưa có thiếu nhi");
    expect(screen.getByText(/đã có hồ sơ người giám hộ/)).toBeInTheDocument();
  });

  it("🔴 không in id hồ sơ ra màn hình", () => {
    const { container } = render(<ChildrenLinks students={CHILDREN} status="ok" />);
    // Id nằm trong `href` là bắt buộc; nằm trong phần chữ nhìn thấy được thì
    // không — máy phòng học là máy dùng chung (cùng lý lẽ với breadcrumb ở 0.7).
    for (const child of CHILDREN) {
      expect(container.textContent).not.toContain(child.id);
    }
  });
});
