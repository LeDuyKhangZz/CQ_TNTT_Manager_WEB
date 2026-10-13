import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, drawerHref } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { studentListHref, STUDENT_STATUS_FILTER_LABELS, STUDENT_STATUS_FILTERS } from "../student-directory";
import type { StudentsPageData } from "../server/queries";

export function StudentMobileFilters({ data, open, defaultStatus }: {
  data: StudentsPageData; open: boolean; defaultStatus: "all" | "active";
}) {
  const { criteria, feeScope, sectors, classes } = data;
  const closeHref = studentListHref(criteria, data.page, defaultStatus);
  const params = new URLSearchParams(closeHref.split("?")[1]);
  const groups = [
    {name:"sector",label:"Ngành",selected:criteria.sectorIds, options:sectors.map(item=>({value:item.id,label:item.name}))},
    {name:"class",label:"Lớp",selected:criteria.classIds, options:[{value:"none",label:"Chưa xếp lớp"},...classes.map(item=>({value:item.id,label:item.displayName}))]},
    {name:"status",label:"Trạng thái",selected:criteria.statuses, options:STUDENT_STATUS_FILTERS.filter(value=>value!=="all").map(value=>({value,label:STUDENT_STATUS_FILTER_LABELS[value]}))},
  ];
  const count = groups.reduce((total,group)=>total+group.selected.length,0);
  return <>
    <div className="space-y-2 md:hidden">
    <div className="flex gap-2">
      <form method="get" action="/students" role="search" className="flex min-w-0 flex-1 gap-1">
        {Array.from(params,([name,value])=>name !== "q" && name !== "page" ? <input key={name+value} type="hidden" name={name} value={value} /> : null)}
        <Input name="q" aria-label="Tìm theo tên thiếu nhi, mã hoặc số điện thoại giám hộ" placeholder="Tên, mã hoặc SĐT…" defaultValue={criteria.search} key={criteria.search} className="min-w-0" />
        <Button type="submit" variant="secondary" aria-label="Tìm thiếu nhi" className="w-11 shrink-0 px-0"><Search className="size-4" aria-hidden="true" /></Button>
      </form>
      <Link href={drawerHref("/students",params,{filters:"1"})} className={buttonVariants({variant:"outline",className:"shrink-0 px-3"})}>
        <SlidersHorizontal className="size-4" aria-hidden="true" />Lọc{count ? " ("+count+")" : ""}
      </Link>
    </div>
    <div className="flex flex-wrap gap-1" aria-label="Bộ lọc đang áp dụng">
      {groups.flatMap(group=>group.selected.map(value=>{
        const field = group.name === "sector" ? "sectorIds" : group.name === "class" ? "classIds" : "statuses";
        const next = {...criteria,[field]:group.selected.filter(item=>item!==value)};
        const label = group.options.find(item=>item.value===value)?.label ?? value;
        return <Link key={group.name+value} href={studentListHref(next,1,defaultStatus)} aria-label={"Bỏ lọc "+label}
          className="inline-flex min-h-11 items-center gap-1 rounded-md border border-line px-2 text-xs text-ink-muted">
          {label}<X className="size-3" aria-hidden="true" />
        </Link>;
      }))}
    </div>
    </div>
    <Drawer open={open} title="Lọc danh sách thiếu nhi" closeHref={closeHref}
      panelClassName="h-auto max-h-[85dvh] self-end rounded-t-xl">
      <form method="get" action="/students" className="space-y-4" aria-label="Lọc danh sách thiếu nhi">
        <input type="hidden" name="q" value={criteria.search} />
        <input type="hidden" name="size" value={criteria.pageSize} />
        <input type="hidden" name="sort" value={criteria.sort} />
        <input type="hidden" name="dir" value={criteria.direction} />
        {!feeScope ? <input type="hidden" name="statusMode" value="facet" /> : null}
        {groups.map(group=><fieldset key={group.name} className="space-y-2">
          <legend className="font-medium text-sm">{group.label}</legend>
          {feeScope ? <Select name={group.name} aria-label={group.label} defaultValue={group.selected[0] ?? "all"}>
            <option value="all">Tất cả</option>{group.options.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}
          </Select> : <div className="max-h-44 overflow-y-auto rounded-md border border-line px-3">
            {group.options.map(item=><Checkbox key={item.value} name={group.name} value={item.value} defaultChecked={group.selected.includes(item.value)} labelClassName="flex">{item.label}</Checkbox>)}
          </div>}
        </fieldset>)}
        {!feeScope ? <p className="text-xs text-ink-muted">Bỏ chọn hết một nhóm để xem tất cả trong nhóm đó.</p> : null}
        <div className="sticky bottom-0 bg-surface py-2"><Button type="submit" className="w-full">Áp dụng bộ lọc</Button></div>
      </form>
    </Drawer>
  </>;
}
