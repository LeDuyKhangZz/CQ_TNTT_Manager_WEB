import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FormMessage } from "@/components/ui/form-message";

/**
 * Hàng rào chống hồi quy cho một lỗi thật bắt được khi chạy E2E của mục 0.8.
 *
 * `FormMessage` trả `null` khi không có nội dung. Nhưng bốn chỗ gọi ở hai màn
 * hình auth lại bọc câu lỗi trong `<span id="...">` để `aria-describedby` trỏ
 * vào, khiến `children` LUÔN truthy — dải lỗi rỗng lúc nào cũng dựng. Trước
 * Giai đoạn 2B nó vô hình; từ khi mục 0.5 thêm icon thì trang đăng nhập hiện
 * hai tam giác cảnh báo đỏ thường trực và trình đọc màn hình đọc "Lỗi:" hai lần
 * ngay khi tải trang.
 *
 * Cách chữa: `FormMessage` nhận thẳng prop `id`, chỗ gọi truyền câu lỗi làm
 * children. Ba khẳng định dưới đây khoá cả hai đầu của cách chữa đó.
 */

describe("FormMessage — dải lỗi rỗng (hồi quy 0.5)", () => {
  it("không dựng gì khi không có nội dung", () => {
    const { container } = render(<FormMessage>{undefined}</FormMessage>);
    expect(container).toBeEmptyDOMElement();
  });

  it("không dựng gì khi nội dung là chuỗi rỗng — lỗi chưa xảy ra vẫn là chưa có lỗi", () => {
    const { container } = render(<FormMessage>{""}</FormMessage>);
    expect(container).toBeEmptyDOMElement();
  });

  it("nhận `id` để aria-describedby trỏ thẳng vào, không cần bọc span", () => {
    render(<FormMessage id="username-error">Tên đăng nhập là bắt buộc.</FormMessage>);

    const message = screen.getByRole("alert");
    expect(message).toHaveAttribute("id", "username-error");
    expect(message).toHaveTextContent("Lỗi:");
    expect(message).toHaveTextContent("Tên đăng nhập là bắt buộc.");
  });

  it("bọc children trong phần tử vẫn dựng — nên chỗ gọi KHÔNG được bọc", () => {
    // Đây chính là hình dạng của lỗi cũ, giữ lại để nói rõ vì sao không bọc.
    const { container } = render(
      <FormMessage>
        <span id="username-error">{undefined}</span>
      </FormMessage>,
    );
    expect(container).not.toBeEmptyDOMElement();
  });
});
