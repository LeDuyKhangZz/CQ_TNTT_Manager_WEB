"use client";

import { useState, type FormEventHandler } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { foldVietnamese } from "@/lib/text/fold-vietnamese";
import { cn } from "@/lib/utils";
import { COMMITTEE_POSITIONS, COMMITTEE_POSITION_LABELS, MAX_ACTIVE_COMMITTEES_PER_STAFF } from "../constants";
import type { StaffOption } from "../server/queries";

export function CommitteeMemberForm({ staff, pending, onSubmit }: {
  staff: StaffOption[]; pending: boolean; onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("all");
  const [classId, setClassId] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const sectors = [...new Map(staff.filter(item => item.sectorId).map(item => [item.sectorId!, item.sectorName!])).entries()];
  const classes = [...new Map(staff.filter(item => item.classId && (sector === "all" || item.sectorId === sector)).map(item => [item.classId!, item.className!])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "vi", { numeric: true }));
  const visible = staff.filter(item =>
    (sector === "all" || (sector === "unassigned" ? !item.classId : item.sectorId === sector)) &&
    (classId === "all" || (classId === "unassigned" ? !item.classId : item.classId === classId)) &&
    foldVietnamese(item.displayName).includes(foldVietnamese(search)));
  const selected = staff.find(item => item.id === selectedId && item.activeCommitteeCount < MAX_ACTIVE_COMMITTEES_PER_STAFF);
  const filtered = search !== "" || sector !== "all" || classId !== "all";

  function clearFilters() { setSearch(""); setSector("all"); setClassId("all"); }

  return <form onSubmit={onSubmit} onReset={() => { setSelectedId(""); clearFilters(); }} className="flex max-h-[calc(94dvh-10rem)] flex-col gap-3 md:max-h-[calc(100dvh-9rem)]" autoComplete="off">
    <input type="hidden" name="staffProfileId" value={selected?.id ?? ""} />
    <fieldset className="min-w-0 shrink-0 space-y-3">
      <legend className="sr-only">Chọn nhân sự</legend>
      <div className="space-y-2">
        <Label htmlFor="committee-person-query">Tìm theo tên</Label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-ink-muted" />
          <Input id="committee-person-query" type="search" name="person-query" autoComplete="off" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nhập tên, có dấu hoặc không dấu" className="pl-10" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 space-y-2"><Label htmlFor="committee-person-sector">Ngành</Label>
          <Select id="committee-person-sector" value={sector} onChange={event => { setSector(event.target.value); setClassId("all"); }}>
            <option value="all">Mọi ngành</option>
            {sectors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            <option value="unassigned">Chưa phân lớp</option>
          </Select>
        </div>
        <div className="min-w-0 space-y-2"><Label htmlFor="committee-person-class">Lớp</Label>
          <Select id="committee-person-class" value={classId} onChange={event => setClassId(event.target.value)} disabled={sector === "unassigned"}>
            <option value="all">Tất cả lớp</option>
            {classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            {sector === "all" ? <option value="unassigned">Chưa phân lớp</option> : null}
          </Select>
        </div>
      </div>
    </fieldset>
    <div className="flex shrink-0 items-center justify-between gap-3">
      <p role="status" className="text-sm text-ink-muted">{visible.length} nhân sự{filtered ? " khớp bộ lọc" : " có thể tra cứu"}</p>
      {filtered ? <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>Xóa bộ lọc</Button> : null}
    </div>
    <div role="radiogroup" aria-label="Nhân sự để thêm vào Ban" className="flex min-h-24 min-w-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain rounded-lg border border-line bg-surface-muted p-2">
        {visible.length === 0 ? <p className="p-4 text-sm text-ink-muted">{staff.length ? "Không tìm thấy nhân sự phù hợp. Thử tên khác hoặc xóa bộ lọc." : "Không còn nhân sự ngoài Ban để thêm."}</p> : visible.map(item => {
          const unavailable = item.activeCommitteeCount >= MAX_ACTIVE_COMMITTEES_PER_STAFF;
          return <label key={item.id} className={cn("flex min-h-11 items-start gap-3 rounded-md border border-line bg-surface p-3 focus-within:ring-2 focus-within:ring-theme-ring", unavailable ? "cursor-not-allowed text-ink-muted" : "cursor-pointer hover:border-theme-primary", selected?.id === item.id && "border-theme-primary bg-theme-tint")}>
            <input type="radio" name="committee-person-choice" value={item.id} checked={selected?.id === item.id} onChange={() => setSelectedId(item.id)} disabled={pending || unavailable} className="mt-1 h-4 w-4 shrink-0 accent-[var(--theme-primary)]" aria-label={item.displayName} />
            <span className="min-w-0 space-y-1">
              <span className="block break-words text-sm font-semibold">{item.displayName}</span>
              <span className="block text-xs text-ink-muted">{item.className ? `${item.className}${item.sectorName ? ` · ${item.sectorName}` : ""}` : "Chưa phân lớp"}</span>
              {unavailable ? <span className="block text-xs text-warning">Đã đủ hai Ban</span> : null}
            </span>
          </label>;
        })}
      </div>
    </div>
    <div className="shrink-0 space-y-3 border-t border-line pt-3">
      <p className="text-sm" aria-live="polite">{selected ? <>Đã chọn: <strong>{selected.displayName}</strong>{!visible.some(item => item.id === selected.id) ? <span className="block text-xs text-ink-muted">Người đã chọn đang nằm ngoài bộ lọc hiện tại.</span> : null}</> : "Chọn một nhân sự trong danh sách để tiếp tục."}</p>
      <div className="space-y-2"><Label htmlFor="add-position">Chức vụ</Label>
        <Select id="add-position" name="position" defaultValue="member">
          {COMMITTEE_POSITIONS.map(position => <option key={position} value={position}>{COMMITTEE_POSITION_LABELS[position]}</option>)}
        </Select>
      </div>
      <Button type="submit" pending={pending} disabled={!selected || pending} className="w-full">Thêm vào Ban</Button>
    </div>
  </form>;
}
