import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TabNav } from "@/components/ui/tab-nav";
import { EntityHeader } from "@/components/layout/entity-header";
import { Section } from "@/components/ui/section";
import { FactChip } from "@/components/ui/fact-chip";
import { ChartCard } from "@/components/ui/chart-card";
import { Wizard } from "@/components/ui/wizard";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import { DataSkeleton } from "@/components/ui/skeleton";
import { SECTOR_PALETTE } from "@/lib/theme/sector-palette";

describe("R2 shared primitives", () => {
  it("tabs are bookmarkable links with one current page, not incomplete ARIA tabs", () => {
    render(<TabNav label="Hồ sơ" activeKey="history" items={[{key:"info",label:"Thông tin",href:"/students/1"},{key:"history",label:"Lịch sử",href:"/students/1?tab=history"}]}/>);
    expect(screen.getByRole("link",{name:"Lịch sử"})).toHaveAttribute("aria-current","page");
    expect(screen.getByRole("link",{name:"Thông tin"})).toHaveAttribute("href","/students/1");
    expect(screen.queryByRole("tab")).toBeNull();
  });
  it("entity heading and flat section retain a meaningful heading hierarchy", () => {
    render(<><EntityHeader title="Ấu 1" backHref="/classes" facts={<FactChip label="Sĩ số" value={25}/>}/><Section id="team" title="Giáo lý viên"><p>An</p></Section></>);
    expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Ấu 1");
    expect(screen.getByRole("region",{name:"Giáo lý viên"})).toContainElement(screen.getByRole("heading",{level:2}));
    expect(screen.getByText("Sĩ số:")).toBeVisible();
  });
  it("chart includes an equivalent table and zero is a real value", () => {
    const {container}=render(<ChartCard title="Sĩ số" data={[{label:"Ấu",value:0,themeKey:"AU_NHI"}]} valueLabel="Số em" emptyMessage="Chưa có dữ liệu"/>);
    expect(within(screen.getByRole("table",{name:"Sĩ số"})).getByRole("cell")).toHaveTextContent("0");
    expect(container.querySelector("rect")).toHaveAttribute("fill",SECTOR_PALETTE.AU_NHI.primary);
    expect(screen.queryByText("Chưa có dữ liệu")).toBeNull();
  });
  it.each(["empty","loading","error"])("chart %s state never exposes stale data", state => {
    render(<ChartCard title="Sĩ số" data={state === "empty" ? [] : [{label:"Old",value:3}]} loading={state === "loading"} error={state === "error" ? "Mất kết nối" : undefined} valueLabel="Số em" emptyMessage="Chưa có dữ liệu"/>);
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText(state === "empty" ? "Chưa có dữ liệu" : state === "error" ? "Mất kết nối" : "Đang tải Sĩ số")).toBeInTheDocument();
  });
  it("wizard submits native fields, only revisits prior steps and summarizes at the end", () => {
    const {container}=render(<Wizard label="Tạo hồ sơ" activeId="review" action="/review" method="get" steps={[{id:"name",title:"Tên",href:"/name"},{id:"review",title:"Kiểm tra"}]} fields={[{name:"draft",value:"abc"}]} summary={<p>Bản xem lại</p>}><input name="confirm" defaultValue="yes"/></Wizard>);
    const form=container.querySelector("form")!;
    expect(form).toHaveAttribute("method","get");
    expect(new FormData(form).get("draft")).toBe("abc");
    expect(new FormData(form).get("step")).toBe("review");
    expect(screen.getByRole("link",{name:"1. Tên"})).toHaveAttribute("href","/name");
    expect(screen.getByText("Bản xem lại")).toBeVisible();
  });
  it("required wizard steps cannot be skipped even when a caller supplies a skip URL", () => {
    render(<Wizard label="Tạo" activeId="name" action="/next" steps={[{id:"name",title:"Tên"},{id:"review",title:"Kiểm tra",href:"/review"}]} skipHref="/skip" summary={<p>Bản xem lại</p>}>Nội dung</Wizard>);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText("Bản xem lại")).toBeNull();
  });
  it("page size form preserves repeated facets and drops the old page", () => {
    const {container}=render(<PaginationFooter action="/students" page={2} pageSize={25} totalItems={200} selectedCount={3} keepParams={[{name:"sector",value:"a"},{name:"sector",value:"b"},{name:"page",value:"2"}]} buildHref={page=>`/students?page=${page}`}/>);
    fireEvent.change(screen.getByRole("combobox"),{target:{value:"50"}});
    const data=new FormData(container.querySelector("form")!);
    expect(data.getAll("sector")).toEqual(["a","b"]);
    expect(data.has("page")).toBe(false);
    expect(data.get("size")).toBe("50");
    expect(screen.getByRole("status")).toHaveTextContent("Đã chọn 3 mục");
  });
  it("row menu preserves disabled permissions and renders real navigation", () => {
    const {container}=render(<RowActionMenu name="An" items={[{key:"view",label:"Xem hồ sơ",href:"/students/1"},{key:"edit",label:"Sửa",href:"/students/1/edit",disabled:true}]}/>);
    container.querySelector("details")!.open=true;
    expect(screen.getByRole("menuitem",{name:"Xem hồ sơ"})).toHaveAttribute("href","/students/1");
    expect(screen.getByRole("menuitem",{name:"Sửa"})).toBeDisabled();
  });
  it("data loading has one named status and does not pretend to be interactive rows", () => {
    render(<DataSkeleton rows={3}/>);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
