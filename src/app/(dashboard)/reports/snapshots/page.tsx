import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar, FilterField } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { formatDateTimeVi, formatDateVi } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  REPORT_SCOPES,
  REPORT_SCOPE_LABELS,
  REPORT_TYPES,
  REPORT_TYPE_LABELS,
} from "@/features/reports/filters";
import {
  hasActiveSnapshotFilter,
  parseSnapshotCriteria,
  snapshotListHref,
} from "@/features/reports/snapshot-directory";
import {
  getSnapshotDirectoryData,
  reportsRouteContext,
  type ReportSnapshotListItem,
} from "@/features/reports/server/queries";

/**
 * TB-06 — kho bản chốt (`03_AUDIT_RESULTS` M11-F11, 50/75).
 *
 * 🔴 Trước trang này, kho 5 năm chỉ có **một** đường vào: 20 dòng mới nhất nằm
 * dưới cùng trang `/reports`, không lọc, không phân trang, và tiêu đề chỉ gồm
 * loại + khoảng ngày. Hai bản chốt cùng tháng của hai lớp khác nhau hiện ra
 * **giống hệt nhau** — muốn biết bản nào của lớp nào thì phải tải cả hai về mở
 * ra xem. Bản cũ hơn 20 dòng thì không có đường vào nào cả.
 *
 * Bộ lọc và phân trang là `<form method="get">` + `<Link>` thật ⇒ chạy được
 * không cần JavaScript và chép được đường dẫn trang 3 (`09` §11).
 */
export default async function ReportSnapshotsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await reportsRouteContext();
  const criteria = parseSnapshotCriteria(await searchParams);
  const { items, page, pageSize, totalItems, years } = await getSnapshotDirectoryData(criteria);
  const filtered = hasActiveSnapshotFilter(criteria);

  const columns = [
    {
      key: "title",
      header: "Báo cáo",
      cell: (row: ReportSnapshotListItem) => (
        <div className="min-w-0">
          <Link href={`/reports/snapshots/${row.id}`} className="font-medium hover:underline">
            {REPORT_TYPE_LABELS[row.reportType]}
          </Link>
          <p className="text-xs text-ink-muted">
            {formatDateVi(row.periodStart)} – {formatDateVi(row.periodEnd)}
            {row.academicYearCode ? ` · Năm học ${row.academicYearCode}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "scope",
      header: "Phạm vi",
      cell: (row: ReportSnapshotListItem) => row.scopeLabel,
    },
    {
      key: "actor",
      header: "Người chốt",
      hideBelowSm: true,
      cell: (row: ReportSnapshotListItem) => (
        <div>
          <p>{row.generatedByName ?? "—"}</p>
          <p className="text-xs text-ink-muted">{formatDateTimeVi(row.generatedAt)}</p>
        </div>
      ),
    },
    {
      key: "checksum",
      header: "Mã kiểm tra",
      hideBelowSm: true,
      cell: (row: ReportSnapshotListItem) => (
        <span className="font-mono text-xs">{row.checksum.slice(0, 12)}…</span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      cell: (row: ReportSnapshotListItem) => (
        <div className="flex flex-wrap gap-2">
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href={`/reports/snapshots/${row.id}`}
          >
            Xem
          </Link>
          <a
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href={`/reports/snapshots/${row.id}/export?format=xlsx`}
          >
            Excel
          </a>
          {/* F12 (`04_TO_BE_FLOWS` §6) — route đã hỗ trợ PDF từ Phase 6, chỉ
              chưa có nút nào gọi nó. */}
          <a
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href={`/reports/snapshots/${row.id}/export?format=pdf`}
          >
            PDF
          </a>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Báo cáo đã chốt"
        description="Bản chốt giữ nguyên số liệu tại thời điểm chốt, kể cả khi dữ liệu nguồn thay đổi về sau."
        backHref="/reports"
        backLabel="Về trang Báo cáo"
      />

      <FilterBar
        legend="Lọc kho bản chốt"
        action="/reports/snapshots"
        resetHref={filtered ? "/reports/snapshots" : undefined}
      >
        <FilterField label="Năm học" htmlFor="filter-year">
          <Select id="filter-year" name="year" defaultValue={criteria.academicYearId ?? "all"}>
            <option value="all">Tất cả năm học</option>
            {years.map((year) => (
              <option key={year.id} value={year.id}>{year.code}</option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Loại báo cáo" htmlFor="filter-report-type">
          <Select id="filter-report-type" name="reportType" defaultValue={criteria.reportType ?? "all"}>
            <option value="all">Tất cả loại</option>
            {REPORT_TYPES.map((value) => (
              <option key={value} value={value}>{REPORT_TYPE_LABELS[value]}</option>
            ))}
          </Select>
        </FilterField>
        <FilterField
          label="Phạm vi"
          htmlFor="filter-scope-type"
          helper="Bản chốt giữ nguyên phạm vi lúc chốt, không lọc lại theo quyền hiện tại."
        >
          <Select id="filter-scope-type" name="scopeType" defaultValue={criteria.scopeType ?? "all"}>
            <option value="all">Mọi phạm vi</option>
            {REPORT_SCOPES.map((value) => (
              <option key={value} value={value}>{REPORT_SCOPE_LABELS[value]}</option>
            ))}
          </Select>
        </FilterField>
      </FilterBar>

      {items.length === 0 ? (
        <EmptyState
          variant={filtered ? "no-data" : "not-linked"}
          title={filtered ? "Không có bản chốt nào khớp bộ lọc" : "Chưa có báo cáo nào được chốt"}
          description={
            filtered
              ? "Hãy nới bộ lọc — bỏ chọn năm học hoặc loại báo cáo — rồi thử lại."
              : "Khi một báo cáo được chốt, bản đó sẽ nằm lại đây suốt 5 năm và không đổi theo dữ liệu nguồn."
          }
          action={
            <Link className={cn(buttonVariants({ variant: "outline" }))} href="/reports">
              Về trang Báo cáo
            </Link>
          }
        />
      ) : (
        <>
          <DataTable
            caption={`Bản chốt ${totalItems > 0 ? `(${totalItems} bản)` : ""} — cột Người chốt và Mã kiểm tra ẩn trên màn hình hẹp.`}
            columns={columns}
            rows={items}
            getRowKey={(row) => row.id}
            minWidthClassName="min-w-[720px]"
          />
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            buildHref={(target) => snapshotListHref(criteria, target)}
            itemLabel="bản chốt"
            className="mt-4"
          />
        </>
      )}
    </PageContainer>
  );
}
