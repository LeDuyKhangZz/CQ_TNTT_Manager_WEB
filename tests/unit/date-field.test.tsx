import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateField, DateTimeField } from "@/components/ui/date-field";

/**
 * `P3-UI-001` Đợt C — `DateField` / `DateTimeField` (`17` §5, `09` §12 A2).
 *
 * Hai lời hứa được canh ở đây:
 *   1. **Người dùng luôn thấy dd/MM/yyyy**, dù trình duyệt đặt locale nào.
 *   2. **Máy chủ vẫn nhận ISO** ⇒ không server action nào phải sửa một dòng.
 */

function Field(props: React.ComponentProps<typeof DateField>) {
  return (
    <>
      <label htmlFor="dob">Ngày sinh</label>
      <DateField id="dob" name="dateOfBirth" {...props} />
    </>
  );
}

const hiddenValue = (name: string) =>
  (document.querySelector(`input[type="hidden"][name="${name}"]`) as HTMLInputElement | null)?.value;
const calendar = () => document.querySelector("[data-date-calendar]");

describe("DateField — hiển thị", () => {
  it("🔴 giá trị ISO của máy chủ hiện ra thành dd/MM/yyyy", () => {
    render(<Field defaultValue="2016-01-15" />);
    expect(screen.getByLabelText("Ngày sinh")).toHaveValue("15/01/2016");
  });

  it("ô trống thì gợi ý đúng dạng cần gõ", () => {
    render(<Field />);
    expect(screen.getByLabelText("Ngày sinh")).toHaveAttribute("placeholder", "dd/mm/yyyy");
  });

  it("chỉ MỘT phần tử mang nhãn — nút lịch không cướp tên", () => {
    render(<Field defaultValue="2016-01-15" />);
    expect(screen.getAllByLabelText("Ngày sinh")).toHaveLength(1);
  });
});

describe("DateField — giá trị gửi lên máy chủ", () => {
  it("ô ẩn mang ISO, không mang chuỗi người dùng nhìn thấy", () => {
    render(<Field defaultValue="2016-01-15" />);
    expect(hiddenValue("dateOfBirth")).toBe("2016-01-15");
  });

  it("gõ dd/MM/yyyy thì ô ẩn thành ISO", async () => {
    const user = userEvent.setup();
    render(<Field />);
    await user.type(screen.getByLabelText("Ngày sinh"), "15/01/2016");
    expect(hiddenValue("dateOfBirth")).toBe("2016-01-15");
  });

  it("🔴 gõ thẳng yyyy-MM-dd cũng nhận — bộ kiểm E2E gõ kiểu này", async () => {
    const user = userEvent.setup();
    render(<Field />);
    await user.type(screen.getByLabelText("Ngày sinh"), "2016-01-15");
    expect(hiddenValue("dateOfBirth")).toBe("2016-01-15");
  });

  it("rời ô thì chuẩn hoá lại phần chữ về dd/MM/yyyy", async () => {
    const user = userEvent.setup();
    render(<Field />);
    const field = screen.getByLabelText("Ngày sinh");
    await user.type(field, "5-9-2026");
    await user.tab();
    expect(field).toHaveValue("05/09/2026");
    expect(hiddenValue("dateOfBirth")).toBe("2026-09-05");
  });

  it("xoá trắng thì ô ẩn cũng trắng", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="2016-01-15" />);
    await user.clear(screen.getByLabelText("Ngày sinh"));
    expect(hiddenValue("dateOfBirth")).toBe("");
  });

  it("🔴 chuỗi không đọc được thì CHẶN gửi, không gửi lặng lẽ giá trị cũ", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="2016-01-15" />);
    const field = screen.getByLabelText("Ngày sinh") as HTMLInputElement;
    await user.clear(field);
    await user.type(field, "31/02/2016");
    expect(field.checkValidity()).toBe(false);
    expect(field).toHaveAttribute("aria-invalid", "true");
  });

  it("gõ dở dang thì KHÔNG xoá mất giá trị đang có", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="2016-01-15" />);
    const field = screen.getByLabelText("Ngày sinh");
    await user.type(field, "{Backspace}");
    // "15/01/201" chưa đọc được, nhưng ngày cũ vẫn còn nguyên.
    expect(hiddenValue("dateOfBirth")).toBe("2016-01-15");
  });
});

describe("DateField — lịch tự vẽ", () => {
  it("bấm nút lịch thì mở, tiêu đề nêu tháng và năm bằng tiếng Việt", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="2026-09-15" />);
    expect(calendar()).toBeNull();

    await user.click(document.querySelector("[data-date-trigger]") as HTMLElement);

    expect(calendar()).not.toBeNull();
    expect(screen.getByRole("dialog", { name: "Tháng 9 2026" })).toBeInTheDocument();
  });

  it("chọn một ngày thì cập nhật cả phần chữ lẫn ô ẩn rồi đóng lịch", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="2026-09-15" />);

    await user.click(document.querySelector("[data-date-trigger]") as HTMLElement);
    await user.click(document.querySelector('[data-date-cell="2026-09-03"]') as HTMLElement);

    expect(screen.getByLabelText("Ngày sinh")).toHaveValue("03/09/2026");
    expect(hiddenValue("dateOfBirth")).toBe("2026-09-03");
    expect(calendar()).toBeNull();
  });

  it("ngày ngoài min/max không bấm được", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="2026-09-15" min="2026-09-10" max="2026-09-20" />);

    await user.click(document.querySelector("[data-date-trigger]") as HTMLElement);

    expect(document.querySelector('[data-date-cell="2026-09-03"]')).toBeDisabled();
    expect(document.querySelector('[data-date-cell="2026-09-15"]')).not.toBeDisabled();
  });

  it("đi tới tháng trước và tháng sau", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="2026-09-15" />);

    await user.click(document.querySelector("[data-date-trigger]") as HTMLElement);
    await user.click(screen.getByRole("button", { name: "Tháng sau" }));
    expect(screen.getByRole("dialog", { name: "Tháng 10 2026" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tháng trước" }));
    await user.click(screen.getByRole("button", { name: "Tháng trước" }));
    expect(screen.getByRole("dialog", { name: "Tháng 8 2026" })).toBeInTheDocument();
  });

  it("Escape đóng lịch mà không đổi giá trị", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="2026-09-15" />);

    await user.click(document.querySelector("[data-date-trigger]") as HTMLElement);
    await user.keyboard("{Escape}");

    expect(calendar()).toBeNull();
    expect(hiddenValue("dateOfBirth")).toBe("2026-09-15");
  });
});

describe("DateField — hợp đồng với chỗ gọi", () => {
  it("ô có điều khiển thì cha vẫn là chủ giá trị", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = React.useState("2016-01-15");
      return (
        <>
          <Field value={value} onChange={(event) => setValue(event.target.value)} />
          <p>ISO: {value}</p>
        </>
      );
    }
    render(<Controlled />);

    await user.clear(screen.getByLabelText("Ngày sinh"));
    await user.type(screen.getByLabelText("Ngày sinh"), "20/03/2017");

    expect(screen.getByText("ISO: 2017-03-20")).toBeInTheDocument();
  });

  it("onChange nhận giá trị ISO, không nhận chuỗi hiển thị", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Field onChange={onChange} />);

    await user.type(screen.getByLabelText("Ngày sinh"), "15/01/2016");

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: "2016-01-15" }) }),
    );
  });

  it("ref trỏ vào ô nhập thật", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<DateField ref={ref} aria-label="Ngày" defaultValue="2016-01-15" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

describe("DateTimeField", () => {
  it("tách sẵn phần ngày và phần giờ từ giá trị máy chủ", () => {
    render(
      <>
        <label htmlFor="starts">Bắt đầu</label>
        <DateTimeField id="starts" name="startsAt" defaultValue="2026-10-03T19:00" />
      </>,
    );
    expect(screen.getByLabelText("Bắt đầu")).toHaveValue("03/10/2026");
    expect(screen.getByLabelText("Giờ")).toHaveValue("19:00");
    expect(hiddenValue("startsAt")).toBe("2026-10-03T19:00");
  });

  it("🔴 gõ nguyên chuỗi yyyy-MM-ddTHH:mm vẫn nhận — bộ kiểm E2E làm đúng thế", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="starts">Bắt đầu</label>
        <DateTimeField id="starts" name="startsAt" />
      </>,
    );

    await user.type(screen.getByLabelText("Bắt đầu"), "2026-10-03T19:00");

    expect(hiddenValue("startsAt")).toBe("2026-10-03T00:00");
  });

  it("đổi giờ thì giữ nguyên ngày", async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="starts">Bắt đầu</label>
        <DateTimeField id="starts" name="startsAt" defaultValue="2026-10-03T19:00" />
      </>,
    );

    await user.clear(screen.getByLabelText("Giờ"));
    await user.type(screen.getByLabelText("Giờ"), "07:30");

    expect(hiddenValue("startsAt")).toBe("2026-10-03T07:30");
  });
});
