import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox, checkboxBoxClassName, checkboxMarkClassName } from "@/components/ui/checkbox";
import { SECTOR_PALETTE } from "@/lib/theme/sector-palette";

/**
 * `Checkbox` — Đợt D của kế hoạch `17` (§6), `09` §12 A2.
 *
 * Bài kiểm chia làm ba nhóm, và nhóm thứ ba mới là lý do tệp này tồn tại:
 *   1. Nó vẫn là `<input type="checkbox">` thật (hợp đồng với 585 bài E2E + form
 *      không cần JS).
 *   2. Trạng thái "một phần" nói đúng với trình đọc màn hình.
 *   3. 🔴 **Dấu tick không bao giờ hardcode màu trắng** — ngành Nghĩa Sĩ dùng chữ
 *      đậm. Đây là loại lỗi mà mắt người review không bắt được vì máy của họ đang
 *      xem ngành khác.
 */

describe("Checkbox · vẫn là ô tick thật", () => {
  it("render đúng một `input[type=checkbox]`, không dựng nút thay thế", () => {
    render(<Checkbox name="isActive">Ban đang hoạt động</Checkbox>);
    const box = screen.getByRole("checkbox", { name: "Ban đang hoạt động" });
    expect(box.tagName).toBe("INPUT");
    expect(box).toHaveAttribute("type", "checkbox");
    expect(box).toHaveAttribute("name", "isActive");
    // Không có phần tử thứ hai đóng vai ô tick — `promotion-board.test.tsx` đếm
    // `getAllByRole("checkbox")` và sẽ đỏ ngay nếu ai đó thêm một cái nữa.
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  });

  it("bấm vào CHỮ NHÃN cũng tick — vùng chạm là cả dòng, không phải ô 20px", async () => {
    const user = userEvent.setup();
    render(<Checkbox>Hoàn cảnh khó khăn</Checkbox>);

    await user.click(screen.getByText("Hoàn cảnh khó khăn"));
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("`defaultChecked` và `name` đi thẳng vào phần tử — form không cần JS vẫn gửi đúng", () => {
    render(
      <form aria-label="f">
        <Checkbox name="top5Enabled" defaultChecked>
          Bật Top 5
        </Checkbox>
      </form>,
    );
    const form = screen.getByRole("form", { name: "f" });
    expect(new FormData(form as HTMLFormElement).get("top5Enabled")).toBe("on");
  });

  it("nhãn bọc ngoài giữ vùng chạm 44px (`09` §10 điều cấm 7)", () => {
    render(<Checkbox id="c1">Còn sử dụng</Checkbox>);
    const label = screen.getByRole("checkbox").closest("label");
    // `responsive.spec.ts` đo đúng thẻ này chứ không đo chính ô tick.
    expect(label).toHaveClass("min-h-11");
    expect(label).toHaveAttribute("for", "c1");
  });

  it("disabled thì không tick được và con trỏ nói ra điều đó", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Checkbox disabled onChange={onChange}>
        Chọn tất cả
      </Checkbox>,
    );

    await user.click(screen.getByText("Chọn tất cả"));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByRole("checkbox").closest("label")).toHaveClass("cursor-not-allowed");
  });

  it("`labelClassName` của chỗ gọi thắng mặc định, không cộng dồn thành hai display", () => {
    render(<Checkbox labelClassName="flex gap-3 md:col-span-2">x</Checkbox>);
    const label = screen.getByRole("checkbox").closest("label");
    expect(label).toHaveClass("flex", "gap-3", "md:col-span-2");
    // twMerge phải bỏ `inline-flex`/`gap-2` mặc định — hai lớp display cùng lúc
    // thì cái nào thắng là do thứ tự trong file CSS, tức không đoán được.
    expect(label).not.toHaveClass("inline-flex");
    expect(label).not.toHaveClass("gap-2");
  });
});

describe("Checkbox · trạng thái một phần (indeterminate)", () => {
  it("nói `aria-checked=mixed` cho ô chọn-tất-cả đang dở dang", () => {
    render(<Checkbox indeterminate aria-label="Chọn tất cả dòng của trang này" />);
    const box = screen.getByRole("checkbox");
    expect(box).toHaveAttribute("aria-checked", "mixed");
    expect(box).toHaveAttribute("data-indeterminate", "true");
  });

  it("không bật thì KHÔNG để lại thuộc tính thừa — ô thường phải im lặng", () => {
    render(<Checkbox aria-label="Chọn dòng 3" />);
    const box = screen.getByRole("checkbox");
    expect(box).not.toHaveAttribute("aria-checked");
    expect(box).not.toHaveAttribute("data-indeterminate");
  });

  it("🔴 `aria-checked=mixed` KHÔNG làm hỏng phép đo `toBeChecked` của bộ kiểm sẵn có", async () => {
    // Bài này canh một rủi ro thật của cách cài đặt: nếu `toBeChecked()` đọc
    // `aria-checked` thay vì thuộc tính gốc thì mọi bài E2E/unit đang dùng
    // `.check()` + `toBeChecked()` sẽ đỏ hàng loạt mà không ai hiểu vì sao.
    const user = userEvent.setup();
    render(<Checkbox indeterminate aria-label="Chọn tất cả" />);
    const box = screen.getByRole("checkbox");
    expect(box).not.toBeChecked();
    await user.click(box);
    expect(box).toBeChecked();
  });
});

describe("🔴 Checkbox · dấu tick lấy màu từ token ngành, KHÔNG hardcode trắng", () => {
  /**
   * Vì sao bài này quan trọng hơn vẻ ngoài của nó: `09` §4.1 cho **Nghĩa Sĩ**
   * (và chỉ Nghĩa Sĩ) một `onPrimary` là **chữ đậm** thay vì trắng. Viết
   * `text-white` cho nhanh thì 5/6 ngành trông vẫn đúng, còn Nghĩa Sĩ được một
   * dấu tick trắng trên nền vàng — và người review đang xem ngành khác thì
   * không bao giờ thấy.
   */
  it("Nghĩa Sĩ thật sự KHÔNG dùng trắng — tiền đề của cả bài kiểm này", () => {
    const nghiaSi = Object.values(SECTOR_PALETTE).find(
      (tokens) => tokens.onPrimary.toUpperCase() !== "#FFFFFF",
    );
    expect(nghiaSi, "09 §4.1: phải có đúng một ngành dùng chữ đậm trên nền chính").toBeDefined();
    expect(nghiaSi?.onPrimary.toUpperCase()).toBe("#2E2A27");
  });

  it("cả hai dấu (tick và gạch) đều đeo `text-theme-on-primary`", () => {
    const { container } = render(<Checkbox indeterminate defaultChecked>x</Checkbox>);
    const marks = container.querySelectorAll("svg");
    expect(marks).toHaveLength(2);
    for (const mark of marks) {
      expect(mark.getAttribute("class")).toContain("text-theme-on-primary");
    }
    expect(checkboxMarkClassName).toContain("text-theme-on-primary");
  });

  it("không có một chuỗi màu trắng nào lọt vào component", () => {
    const { container } = render(<Checkbox defaultChecked>x</Checkbox>);
    const markup = container.innerHTML;
    for (const banned of ["text-white", "stroke-white", "bg-white", "#fff", "#FFFFFF"]) {
      expect(markup, `Checkbox không được hardcode "${banned}"`).not.toContain(banned);
    }
  });

  it("nền ô khi tick là `--theme-primary` — điểm theme #7, không phải màu rời", () => {
    expect(checkboxBoxClassName).toContain("checked:bg-theme-primary");
    expect(checkboxBoxClassName).toContain("data-[indeterminate=true]:bg-theme-primary");
    // Viền ô lúc chưa tick vẫn là token trung tính đạt 3:1 của `09` §6 — cùng
    // một viền với `Input`, không phải màu ngành.
    expect(checkboxBoxClassName).toContain("border-line-strong");
    expect(checkboxBoxClassName).not.toContain("border-border");
  });

  it("ô là 20×20 và bo 6px đúng `17` §6, không rơi về cỡ mặc định của hệ điều hành", () => {
    render(<Checkbox>x</Checkbox>);
    const box = screen.getByRole("checkbox");
    expect(box).toHaveClass("size-5", "appearance-none", "rounded-[6px]");
  });
});
