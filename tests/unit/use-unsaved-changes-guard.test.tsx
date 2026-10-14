import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useUnsavedChangesGuard } from "@/components/shared/use-unsaved-changes-guard";

function Editor({ dirty = true }: { dirty?: boolean }) {
  useUnsavedChangesGuard(dirty);
  return null;
}

function unloadIsBlocked() {
  return !window.dispatchEvent(new Event("beforeunload", { cancelable: true }));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("opt-in unsaved navigation protection", () => {
  it("only blocks unload while at least one dirty editor is mounted", () => {
    const view = render(<><Editor dirty={false} /><Editor /></>);
    expect(unloadIsBlocked()).toBe(true);
    view.rerender(<><Editor /><Editor /></>);
    expect(unloadIsBlocked()).toBe(true);
    view.rerender(<><Editor dirty={false} /><Editor /></>);
    expect(unloadIsBlocked()).toBe(true);
    view.rerender(<><Editor dirty={false} /><Editor dirty={false} /></>);
    expect(unloadIsBlocked()).toBe(false);
    view.unmount();
    expect(unloadIsBlocked()).toBe(false);
  });

  it("cancel prevents both a nested link handler and document loading capture", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const navigate = vi.fn();
    const loading = vi.fn();
    render(<><Editor /><a href="/elsewhere" onClick={navigate}><span>Leave</span></a></>);
    document.addEventListener("click", loading, true);
    try {
      expect(fireEvent.click(screen.getByText("Leave"))).toBe(false);
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(navigate).not.toHaveBeenCalled();
      expect(loading).not.toHaveBeenCalled();
      expect(unloadIsBlocked()).toBe(true);
    } finally {
      document.removeEventListener("click", loading, true);
    }
  });

  it("accept confirms once across editors and a native unload; the next turn guards again", () => {
    vi.useFakeTimers();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const navigate = vi.fn((event: React.MouseEvent) => {
      event.preventDefault();
      expect(unloadIsBlocked()).toBe(false);
    });
    render(<><Editor /><Editor /><a href="/elsewhere" onClick={navigate}>Leave</a></>);
    fireEvent.click(screen.getByText("Leave"));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    vi.runOnlyPendingTimers();
    expect(unloadIsBlocked()).toBe(true);
  });

  it.each([
    ["hash tab", "#gradebook-scores", {}, {}],
    ["same document", window.location.pathname + window.location.search, {}, {}],
    ["external", "https://example.org/elsewhere", {}, {}],
    ["new tab", "/elsewhere", { target: "_blank" }, {}],
    ["download", "/elsewhere", { download: true }, {}],
    ["export", "/results/class-1/export?format=xlsx", {}, {}],
    ["ctrl click", "/elsewhere", {}, { ctrlKey: true }],
    ["meta click", "/elsewhere", {}, { metaKey: true }],
    ["shift click", "/elsewhere", {}, { shiftKey: true }],
    ["alt click", "/elsewhere", {}, { altKey: true }],
    ["middle click", "/elsewhere", {}, { button: 1 }],
  ])("does not prompt for %s", (_label, href, attributes, event) => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const navigate = vi.fn((click: React.MouseEvent) => click.preventDefault());
    render(<><Editor /><a href={href} {...attributes} onClick={navigate}>Action</a></>);
    fireEvent.click(screen.getByText("Action"), event);
    expect(confirm).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(unloadIsBlocked()).toBe(true);
  });

  it("protects query-changing navigation but leaves form submission alone", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<><Editor /><a href="?year=another">Year</a><form onSubmit={submit}><button>Save</button></form></>);
    fireEvent.click(screen.getByText("Year"));
    expect(confirm).toHaveBeenCalledTimes(1);
    confirm.mockClear();
    fireEvent.click(screen.getByText("Save"));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(confirm).not.toHaveBeenCalled();
  });
});
