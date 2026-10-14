import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { ActionSheet } from "@/components/ui/task-sheet";

describe("Task sheet progressive enhancement", () => {
  it("retains draft and returns focus after Escape", () => {
    render(<ActionSheet title="Thêm nhân sự"><label>Tên<input defaultValue="" /></label></ActionSheet>);
    const trigger = screen.getByRole("button", { name: "Thêm nhân sự" });
    fireEvent.click(trigger);
    fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "Nguyễn An" } });
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).not.toBe("hidden");
    fireEvent.click(trigger);
    expect(screen.getByLabelText("Tên")).toHaveValue("Nguyễn An");
  });

  it("preserves native form edits made before hydration", async () => {
    const element = <ActionSheet title="Nhập hồ sơ"><label>Tên<input defaultValue="" /></label><textarea defaultValue="" /><select defaultValue="a"><option value="a">A</option><option value="b">B</option></select></ActionSheet>;
    const container = document.createElement("div"); document.body.appendChild(container);
    container.innerHTML = renderToString(element);
    const details = container.querySelector("details")!;
    const input = container.querySelector("input")!;
    const textarea = container.querySelector("textarea")!;
    const select = container.querySelector("select")!;
    details.open = true; input.value = "Nhập trước"; textarea.value = "Ghi chú"; select.value = "b"; input.focus();
    const recoverable = vi.fn();
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => { root = hydrateRoot(container, element, { onRecoverableError: recoverable }); });
    expect(container.querySelector("input")).toBe(input); expect(input.value).toBe("Nhập trước");
    expect(container.querySelector("textarea")).toBe(textarea); expect(textarea.value).toBe("Ghi chú");
    expect(container.querySelector("select")).toBe(select); expect(select.value).toBe("b");
    expect(screen.getByRole("dialog", { name: "Nhập hồ sơ" })).toBeVisible();
    expect(recoverable).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(container.querySelector("summary")).toHaveFocus();
    await act(async () => root!.unmount()); container.remove();
  });
});
