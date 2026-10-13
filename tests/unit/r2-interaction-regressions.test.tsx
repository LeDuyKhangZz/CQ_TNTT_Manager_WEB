import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FacetFilter } from "@/components/ui/facet-filter";
import { Toolbar } from "@/components/ui/toolbar";
import { Dialog } from "@/components/ui/dialog";

const options = [{ value: "au", label: "Ấu Nhi" }, { value: "thieu", label: "Thiếu Nhi" }];

describe("R2 applied filters", () => {
  it("URL updates replace checkbox drafts and the submitted FormData", () => {
    const view = (selected: string[]) => <form><FacetFilter name="sector" label="Ngành" options={options} selected={selected} /></form>;
    const { container, rerender } = render(view(["au"]));
    const boxes = container.querySelectorAll<HTMLInputElement>("input");
    fireEvent.click(boxes[1]);
    expect(new FormData(container.querySelector("form")!).getAll("sector")).toEqual(["au", "thieu"]);
    rerender(view([]));
    expect(new FormData(container.querySelector("form")!).getAll("sector")).toEqual([]);
    rerender(view(["thieu"]));
    expect(new FormData(container.querySelector("form")!).getAll("sector")).toEqual(["thieu"]);
  });

  it("a new applied search resets the draft but a same-value render preserves it", () => {
    const view = (q: string) => <Toolbar label="Lọc" search={{label:"Tìm tên", defaultValue:q}} />;
    const { rerender } = render(view("An"));
    fireEvent.change(screen.getByRole("searchbox"), {target:{value:"Bình"}});
    rerender(view("An"));
    expect(screen.getByRole("searchbox")).toHaveValue("Bình");
    rerender(view(""));
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });
});

describe("R2 nested overlays", () => {
  it("Escape closes only the inner modal and retains the parent's scroll lock", () => {
    const outerClose = vi.fn();
    function Fixture() {
      const [inner, setInner] = React.useState(false);
      return <Dialog open title="Cha" onClose={outerClose}>
        <button onClick={() => setInner(true)}>Mở con</button>
        <Dialog open={inner} title="Con" onClose={() => setInner(false)}><input aria-label="Tên" /></Dialog>
      </Dialog>;
    }
    const { unmount } = render(<Fixture />);
    fireEvent.click(screen.getByText("Mở con"));
    fireEvent.keyDown(document, {key:"Escape"});
    expect(screen.queryByRole("dialog", {name:"Con"})).not.toBeInTheDocument();
    expect(outerClose).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, {key:"Escape"});
    expect(outerClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("Escape cancels an open facet before dismissing its containing modal", () => {
    const close = vi.fn();
    const { container } = render(<Dialog open title="Cha" onClose={close}><FacetFilter name="sector" label="Ngành" options={options} /></Dialog>);
    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    fireEvent.keyDown(document, {key:"Escape"});
    expect(details.open).toBe(false);
    expect(close).not.toHaveBeenCalled();
    fireEvent.keyDown(document, {key:"Escape"});
    expect(close).toHaveBeenCalledTimes(1);
  });
});
