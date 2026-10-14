import Link from "next/link";
import { Phone, Plus } from "lucide-react";
import { getAcademicYearView } from "@/lib/academic-year/view";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DataTableColumnToggle } from "@/components/ui/data-table-column-toggle";
import { Drawer, drawerHref } from "@/components/ui/drawer";
import { FacetFilter } from "@/components/ui/facet-filter";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { Select } from "@/components/ui/select";
import { Toolbar, ToolbarSummary } from "@/components/ui/toolbar";
import { BranchChip } from "@/components/theme/branch-chip";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { themeKeyFromSectorCode } from "@/lib/theme/sector-palette";
import { StudentMobileFilters } from "@/features/students/components/student-mobile-filters";
import { StudentCreationWizard } from "@/features/students/components/student-creation-wizard";
import { studentStatusLabel } from "@/features/students/student-status";
import {
  hasActiveStudentFilter, parseStudentCriteria, studentListHref,
  STUDENT_PAGE_SIZES, STUDENT_STATUS_FILTER_LABELS, STUDENT_STATUS_FILTERS,
} from "@/features/students/student-directory";
import { getStudentsPageData, type StudentListItem } from "@/features/students/server/queries";

export default async function StudentsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const view = await getAcademicYearView();
  const creating = params.new === "1";
  const creatingGuardian = params.new === "guardian";
  const data = await getStudentsPageData(
    parseStudentCriteria(view.readOnly && params.status === undefined && params.statusMode !== "facet" ? { ...params, status: "all" } : params),
    { loadCreationOptions: creating },
  );
  const { criteria, students, classes, sectors, canWrite,
    page, pageSize, totalItems, feeScope, context } = data;
  const defaultStatus = view.readOnly ? "all" : "active";
  const filtered = hasActiveStudentFilter(criteria, defaultStatus);
  const listHref = studentListHref(criteria, page, defaultStatus);
  const listParams = new URLSearchParams(listHref.split("?")[1]);
  const createHref = drawerHref("/students", listParams, { new: "1" });
  // Shared machines: only column keys are persisted, separately for each account.
  const tableId = `students-${context.profileId}`;
  const columns: DataTableColumn<StudentListItem>[] = [
    {
      key: "name", header: "Tên thánh & Họ tên", sortKey: feeScope ? undefined : "name",
      cell: item => <span className="block min-w-0 py-2 font-medium md:py-0">
        <span className="hidden md:inline">{item.saintName} </span><span className="break-words">{item.fullName}</span>
        <span className="mt-1 block text-xs font-normal text-ink-muted md:hidden">{item.className ?? "Chưa xếp lớp"}</span>
        {item.status !== "active" ? <span className="shrink-0 text-2xs font-normal md:hidden">{studentStatusLabel(item.status)}</span> : null}
        {item.hardshipFlag ? <span className="text-2xs md:hidden" aria-label="Hoàn cảnh khó khăn">★</span> : null}
      </span>,
      className: "leading-4 md:leading-normal md:min-w-56 [&>a]:block md:[&>a]:inline-flex md:[&>a]:min-h-11 [&>a]:items-center",

    },
    {
      key: "class", header: "Lớp", sortKey: feeScope ? undefined : "class", hideable: true,
      cell: item => <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{item.className ?? "Chưa xếp lớp"}</span>
        {item.sectorName ? <BranchChip themeKey={themeKeyFromSectorCode(item.sectorCode)} branchName={item.sectorName} /> : null}
      </span>,
    },
    { key: "guardian", header: "Giám hộ", hideable: true, cell: item => item.guardianName },
    {
      key: "phone", header: "Điện thoại", label: "Liên lạc", hideable: true,
      className: "[&>div]:flex [&>div]:min-h-11 [&>div]:items-center [&>div]:gap-2 [&>div>span:first-child]:hidden",
      cell: item => /\d/.test(item.guardianPhone)
        ? <a href={`tel:${item.guardianPhone.replace(/[^+\d]/g, "")}`} className="relative z-[1] inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-surface-muted text-theme-accent-text md:bg-transparent md:underline md:underline-offset-4" aria-label={`Gọi ${item.guardianName}: ${item.guardianPhone}`}><Phone className="h-4 w-4 md:hidden" aria-hidden="true" /><span className="hidden md:inline">{item.guardianPhone}</span></a>
        : <span className="hidden text-ink-muted md:inline">Chưa có SĐT</span>,

    },
    {
      key: "status", header: "Trạng thái", hideable: true,
      cell: item => <span className="inline-flex flex-wrap gap-1">
        <Badge variant={item.status === "active" ? "success" : "secondary"}>{studentStatusLabel(item.status)}</Badge>
        {item.hardshipFlag ? <Badge variant="warning">Hoàn cảnh</Badge> : null}
      </span>,
    },
  ];
  const statusSummary = criteria.statuses.length
    ? criteria.statuses.map(status => STUDENT_STATUS_FILTER_LABELS[status]).join(", ")
    : "Tất cả trạng thái";

  return (
    <PageContainer className="space-y-3">
      <PageHeader title="Thiếu nhi" className="flex-row items-center justify-between" action={canWrite ?
        <Link href={createHref} className={buttonVariants()}><Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /><span className="sr-only sm:not-sr-only">Thêm thiếu nhi</span></Link> : undefined} />
      {feeScope ? <p className="rounded-md border border-line bg-surface-muted px-3 py-2 text-sm text-ink-muted">
        Chế độ chỉ xem theo quyền Thủ quỹ: tên em, lớp, ngành và liên lạc phụ huynh. Liên hệ Thư ký khi cần chỉnh sửa.
      </p> : null}
      <StudentMobileFilters data={data} open={params.filters === "1" && !creating && !creatingGuardian} defaultStatus={defaultStatus} />
      <Toolbar label="Lọc danh sách thiếu nhi" action="/students" className="relative hidden md:sticky md:flex md:py-0"
        search={{ label: "Tìm theo tên thiếu nhi, mã hoặc số điện thoại giám hộ", defaultValue: criteria.search, placeholder: "Tên, mã hoặc SĐT…" }}
        keepParams={{ sort: criteria.sort, dir: criteria.direction, size: String(pageSize), statusMode: feeScope ? undefined : "facet" }}
        trailing={<DataTableColumnToggle tableId={tableId} desktopOnly className="hidden md:block" columns={columns.filter(column => column.hideable).map(column => ({ key: column.key, label: String(column.header) }))} />}>
        {feeScope ? <>
          <label className="min-w-0"><span className="sr-only">Ngành</span><Select name="sector" className="w-32" defaultValue={criteria.sectorId} key={criteria.sectorId}>
            <option value="all">Tất cả ngành</option>{sectors.map(sector => <option key={sector.id} value={sector.id}>{sector.name}</option>)}
          </Select></label>
          <label className="min-w-0"><span className="sr-only">Lớp</span><Select name="class" className="w-32" defaultValue={criteria.classId} key={criteria.classId}>
            <option value="all">Tất cả lớp</option><option value="none">Chưa xếp lớp</option>{classes.map(item => <option key={item.id} value={item.id}>{item.displayName}</option>)}
          </Select></label>
          <label className="min-w-0"><span className="sr-only">Trạng thái hồ sơ</span><Select name="status" className="w-40" defaultValue={criteria.status} key={criteria.status}>
            {STUDENT_STATUS_FILTERS.map(status => <option key={status} value={status}>{STUDENT_STATUS_FILTER_LABELS[status]}</option>)}
          </Select></label>
        </> : <>
          <FacetFilter fullWidthBelowXl name="sector" label="Ngành" options={sectors.map(sector => ({ value: sector.id, label: sector.name }))} selected={criteria.sectorIds} />
          <FacetFilter fullWidthBelowXl name="class" label="Lớp" options={[{ value: "none", label: "Chưa xếp lớp" }, ...classes.map(item => ({ value: item.id, label: item.displayName }))]} selected={criteria.classIds} />
          <FacetFilter fullWidthBelowXl name="status" label="Trạng thái" options={STUDENT_STATUS_FILTERS.filter(status => status !== "all").map(status => ({ value: status, label: STUDENT_STATUS_FILTER_LABELS[status] }))} selected={criteria.statuses} align="end" />
        </>}
      </Toolbar>
      <div className="space-y-2">
        <ToolbarSummary resetHref={filtered ? "/students" : undefined} resetLabel="Xoá bộ lọc">{totalItems} hồ sơ<span className={filtered ? "hidden md:inline" : undefined}> · {statusSummary}</span></ToolbarSummary>
        <DataTable tableId={tableId} caption="Danh sách thiếu nhi" hideCaption density="compact"
          columns={columns} rows={students} getRowKey={item => item.id} minWidth="880px"
          stickyHeader maxHeightClassName="md:max-h-[70vh]"
          className="[&_tbody_tr]:gap-y-0 [&_tbody_tr]:py-1"
          rowHref={feeScope ? undefined : item => `/students/${item.id}`}
          mobileRow={{ titleKey: "name", trailingKey: "phone" }}
          sort={feeScope ? undefined : { key: criteria.sort, direction: criteria.direction,
            buildHref: (key, direction) => studentListHref({ ...criteria, sort: key === "class" ? "class" : "name", direction }, 1, defaultStatus) }}
          empty={<EmptyState bare variant="no-data"
            title={filtered ? "Không có em nào khớp bộ lọc" : "Chưa có hồ sơ thiếu nhi"}
            description={filtered ? "Thử bỏ bớt bộ lọc hoặc gõ ít chữ hơn ở ô tìm kiếm." : "Chưa có hồ sơ thiếu nhi nào trong phạm vi của bạn."} />}
          footer={<PaginationFooter action="/students" page={page} pageSize={pageSize} totalItems={totalItems} itemLabel="thiếu nhi" pageSizes={STUDENT_PAGE_SIZES}
            keepParams={Array.from(listParams, ([name, value]) => ({ name, value }))}
            buildHref={target => studentListHref(criteria, target, defaultStatus)} />} />
      </div>
      <Drawer open={canWrite && (creating || creatingGuardian)} title={creatingGuardian ? "Thêm người giám hộ" : "Thêm thiếu nhi"} closeHref={listHref}>
        <StudentCreationWizard data={data} listHref={listHref} createGuardian={creatingGuardian}
          step={typeof params.step === "string" ? params.step : undefined}
          guardianId={typeof params.guardian === "string" ? params.guardian : undefined} />
      </Drawer>
    </PageContainer>
  );
}
