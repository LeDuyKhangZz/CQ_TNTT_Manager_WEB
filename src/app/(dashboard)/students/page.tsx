import Link from "next/link";
import { Plus } from "lucide-react";
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
      cell: item => <span className="font-medium">{item.saintName} {item.fullName}</span>,
      className: "md:min-w-56 [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center",
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
      key: "phone", header: "Điện thoại", hideable: true,
      cell: item => /\d/.test(item.guardianPhone)
        ? <a href={`tel:${item.guardianPhone.replace(/[^+\d]/g, "")}`} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-sm text-theme-accent-text underline underline-offset-4" aria-label={`Gọi ${item.guardianName}: ${item.guardianPhone}`}>{item.guardianPhone}</a>
        : <span className="text-ink-muted">Chưa có SĐT</span>,
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
        <Link href={createHref} className={buttonVariants()}><Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />Thêm thiếu nhi</Link> : undefined} />
      {feeScope ? <p className="rounded-md border border-line bg-surface-muted px-3 py-2 text-sm text-ink-muted">
        Chế độ chỉ xem theo quyền Thủ quỹ: tên em, lớp, ngành và liên lạc phụ huynh. Hồ sơ chi tiết, ngày sinh, địa chỉ, sức khoẻ và bí tích không thuộc phạm vi Thủ quỹ.
      </p> : null}
      <Toolbar label="Lọc danh sách thiếu nhi" action="/students" className="relative md:sticky md:py-0"
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
        <ToolbarSummary resetHref={filtered ? "/students" : undefined} resetLabel="Xoá bộ lọc">{totalItems} hồ sơ · {statusSummary}</ToolbarSummary>
        <DataTable tableId={tableId} caption="Danh sách thiếu nhi" hideCaption density="compact"
          columns={columns} rows={students} getRowKey={item => item.id} minWidth="880px"
          stickyHeader maxHeightClassName="md:max-h-[70vh]"
          rowHref={feeScope ? undefined : item => `/students/${item.id}`}
          mobileRow={{ titleKey: "name", metaKeys: ["class", "guardian", "phone", "status"] }}
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
