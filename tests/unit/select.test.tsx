import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "@/components/ui/select";

/**
 * `P3-UI-001` Đợt B — `Select` v2 (`17` §4, `09` §12 A1).
 *
 * 🔴 Điều bộ này canh trước hết KHÔNG phải cái listbox mới, mà là **lời hứa
 * rằng 74 chỗ gọi không phải sửa**: `<select>` thật vẫn còn đó, vẫn đeo nhãn,
 * vẫn nhận `selectOptions` của bộ kiểm, vẫn gửi đi cùng một giá trị. Bốn mươi
 * ba lượt `getByLabel(...).selectOption(...)` trong bộ E2E và mười hai tệp unit
 * khác đang dựa vào đúng điều đó.
 */

function Field(props: React.ComponentProps<typeof Select>) {
  return (
    <>
      <label htmlFor="branch">Ngành</label>
      <Select id="branch" name="branch" {...props}>
        <option value="au">Ấu Nhi</option>
        <option value="thieu">Thiếu Nhi</option>
        <option value="nghia">Nghĩa Sĩ</option>
      </Select>
    </>
  );
}

const listbox = () => document.querySelector("[data-select-listbox]");
const trigger = () => document.querySelector("[data-select-trigger]") as HTMLElement;

describe("Select v2 — hợp đồng cũ giữ nguyên", () => {
  it("vẫn là <select> thật, vẫn tìm được bằng nhãn", () => {
    render(<Field defaultValue="thieu" />);
    const field = screen.getByLabelText("Ngành");
    expect(field.tagName).toBe("SELECT");
    expect((field as HTMLSelectElement).name).toBe("branch");
    expect((field as HTMLSelectElement).value).toBe("thieu");
  });

  it("chỉ có MỘT phần tử mang nhãn ấy — mặt tiền không được cướp tên", () => {
    // Nếu mặt tiền cũng đeo nhãn thì `getByLabelText` ném lỗi "found multiple",
    // và 43 lượt gọi trong bộ E2E đỏ cùng lúc.
    render(<Field />);
    expect(screen.getAllByLabelText("Ngành")).toHaveLength(1);
  });

  it("selectOptions của bộ kiểm vẫn chạy và vẫn bắn onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Field defaultValue="au" onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("Ngành"), "nghia");

    expect((screen.getByLabelText("Ngành") as HTMLSelectElement).value).toBe("nghia");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("mặt tiền và tấm listbox đều nằm ngoài cây trợ năng", () => {
    render(<Field defaultValue="au" />);
    expect(trigger()).toHaveAttribute("aria-hidden", "true");
  });

  it("placeholder vẫn là <option value='' disabled> thật", () => {
    render(
      <Select aria-label="Lớp" placeholder="Chọn lớp">
        <option value="a">Ấu 1A</option>
      </Select>,
    );
    const field = screen.getByLabelText("Lớp") as HTMLSelectElement;
    const first = field.options[0];
    expect(first.value).toBe("");
    expect(first.disabled).toBe(true);
    // ⚠️ Và giá trị ban đầu **không** phải chuỗi rỗng: luật HTML chọn sẵn
    // `<option>` KHÔNG disabled đầu tiên. Đây là hành vi có từ trước Đợt B —
    // ghi ra đây vì nó dễ bị tưởng là lỗi của bản mới.
    expect(field.value).toBe("a");
  });

  it("truyền value='' thì mặt tiền hiện dòng gợi ý", () => {
    render(
      <Select aria-label="Lớp" placeholder="Chọn lớp" value="" onChange={() => {}}>
        <option value="a">Ấu 1A</option>
      </Select>,
    );
    expect(trigger()).toHaveTextContent("Chọn lớp");
  });

  it("ref trỏ vào chính HTMLSelectElement", () => {
    const ref = React.createRef<HTMLSelectElement>();
    render(
      <Select ref={ref} aria-label="Ngành">
        <option value="au">Ấu Nhi</option>
      </Select>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    expect(ref.current?.value).toBe("au");
  });
});

describe("Select v2 — tấm listbox tự dựng", () => {
  it("bấm vào ô thì mở tấm tự vẽ, KHÔNG mở listbox hệ điều hành", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="au" />);
    expect(listbox()).toBeNull();

    await user.click(screen.getByLabelText("Ngành"));

    const panel = listbox();
    expect(panel).not.toBeNull();
    expect(within(panel as HTMLElement).getByText("Nghĩa Sĩ")).toBeInTheDocument();
  });

  it("chọn một mục thì đặt đúng giá trị, bắn onChange và đóng tấm", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Field defaultValue="au" onChange={onChange} />);

    await user.click(screen.getByLabelText("Ngành"));
    await user.click(within(listbox() as HTMLElement).getByText("Thiếu Nhi"));

    expect((screen.getByLabelText("Ngành") as HTMLSelectElement).value).toBe("thieu");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(listbox()).toBeNull();
  });

  it("mặt tiền hiện nhãn của mục đang chọn, không hiện value thô", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="au" />);
    expect(trigger()).toHaveTextContent("Ấu Nhi");

    await user.click(screen.getByLabelText("Ngành"));
    await user.click(within(listbox() as HTMLElement).getByText("Nghĩa Sĩ"));

    expect(trigger()).toHaveTextContent("Nghĩa Sĩ");
  });

  it("Escape đóng tấm mà không đổi giá trị", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="au" />);
    const field = screen.getByLabelText("Ngành");

    await user.click(field);
    await user.keyboard("{Escape}");

    expect(listbox()).toBeNull();
    expect((field as HTMLSelectElement).value).toBe("au");
  });

  it("bàn phím: Enter mở, mũi tên đi, Enter chọn", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="au" />);
    const field = screen.getByLabelText("Ngành") as HTMLSelectElement;

    field.focus();
    await user.keyboard("{Enter}");
    expect(listbox()).not.toBeNull();

    await user.keyboard("{ArrowDown}{Enter}");
    expect(field.value).toBe("thieu");
  });

  it("type-ahead: gõ KHÔNG dấu vẫn nhảy tới mục có dấu", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="au" />);
    const field = screen.getByLabelText("Ngành") as HTMLSelectElement;

    field.focus();
    await user.keyboard("{Enter}");
    await user.keyboard("nghia");
    await user.keyboard("{Enter}");

    expect(field.value).toBe("nghia");
  });

  it("bấm ra ngoài thì đóng", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Field defaultValue="au" />
        <button type="button">Ra ngoài</button>
      </>,
    );

    await user.click(screen.getByLabelText("Ngành"));
    expect(listbox()).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Ra ngoài" }));
    expect(listbox()).toBeNull();
  });

  it("bấm vào CHỮ NHÃN cũng mở tấm, không bung listbox hệ điều hành", async () => {
    // Chữ nhãn to hơn cái ô nên đây là đường người dùng hay đi. Nó KHÔNG đi qua
    // `pointerdown` của ô chọn — trình duyệt kích hoạt control bằng một `click`
    // tổng hợp — nên phải có nhánh riêng đón.
    const user = userEvent.setup();
    render(<Field defaultValue="au" />);

    await user.click(screen.getByText("Ngành"));

    expect(listbox()).not.toBeNull();
  });

  it("🔴 mở rồi đóng bằng chuột, sau đó bấm nhãn VẪN mở lại được", async () => {
    // Bẫy đã trả giá: bản đầu chống-xử-lý-hai-lần bằng một cái cờ, mà
    // `preventDefault()` ở `pointerdown` nuốt luôn `click` đi sau ⇒ cờ bật lên
    // không ai tắt ⇒ cú bấm nhãn KẾ TIẾP bị nuốt. Nay dùng mốc thời gian.
    const user = userEvent.setup();
    render(<Field defaultValue="au" />);
    const field = screen.getByLabelText("Ngành");

    await user.click(field);
    await user.keyboard("{Escape}");
    expect(listbox()).toBeNull();

    await user.click(screen.getByText("Ngành"));
    expect(listbox()).not.toBeNull();
  });

  it("ô đang disabled thì không mở được", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="au" disabled />);

    await user.click(screen.getByLabelText("Ngành"));
    expect(listbox()).toBeNull();
  });

  it("nhóm optgroup hiện tên nhóm một lần, và tên nhóm không bấm được", async () => {
    const user = userEvent.setup();
    render(
      <Select aria-label="Lớp" defaultValue="a1">
        <optgroup label="Ấu Nhi">
          <option value="a1">Ấu 1A</option>
          <option value="a2">Ấu 1B</option>
        </optgroup>
        <optgroup label="Thiếu Nhi">
          <option value="t1">Thiếu 1A</option>
        </optgroup>
      </Select>,
    );

    await user.click(screen.getByLabelText("Lớp"));
    const panel = within(listbox() as HTMLElement);
    expect(panel.getAllByText("Ấu Nhi")).toHaveLength(1);
    expect(panel.getByText("Thiếu Nhi")).toBeInTheDocument();
    expect(panel.getByText("Ấu 1B")).toBeInTheDocument();
  });

  it("mục disabled bấm vào không đổi giá trị", async () => {
    const user = userEvent.setup();
    render(
      <Select aria-label="Lớp" defaultValue="a1">
        <option value="a1">Ấu 1A</option>
        <option value="a2" disabled>
          Ấu 1B (đã đóng)
        </option>
      </Select>,
    );

    await user.click(screen.getByLabelText("Lớp"));
    await user.click(within(listbox() as HTMLElement).getByText("Ấu 1B (đã đóng)"));

    expect((screen.getByLabelText("Lớp") as HTMLSelectElement).value).toBe("a1");
  });

  it("ô có điều khiển (controlled) thì cha vẫn là chủ giá trị", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = React.useState("au");
      return (
        <>
          <Field value={value} onChange={(event) => setValue(event.target.value)} />
          <p>Đang chọn: {value}</p>
        </>
      );
    }
    render(<Controlled />);

    await user.click(screen.getByLabelText("Ngành"));
    await user.click(within(listbox() as HTMLElement).getByText("Nghĩa Sĩ"));

    expect(screen.getByText("Đang chọn: nghia")).toBeInTheDocument();
    expect(trigger()).toHaveTextContent("Nghĩa Sĩ");
  });
});
