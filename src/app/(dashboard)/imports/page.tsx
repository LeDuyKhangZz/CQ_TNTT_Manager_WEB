import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterBar, FilterField } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTimeVi } from "@/lib/dates";
import { ImportUploadForm } from "@/features/imports/components/import-upload-form";
import {
  BATCH_STATUS_FILTERS,
  BATCH_STATUS_FILTER_LABELS,
  batchListHref,
  hasActiveBatchFilter,
  parseBatchListCriteria,
  type BatchListCriteria,
} from "@/features/imports/batch-directory";
import {
  getCurrentAcademicYear,
  listBatches,
  listClassOptions,
  listImportYears,
  type BatchSummary,
} from "@/features/imports/server/queries";
import { requireImportPage } from "@/features/imports/server/permissions";

/**
 * M12-C / TO-BE 8 / NC-01. Server Action được gửi tới **chính route đang đứng**,
 * nên trần thời gian của trang này cũng là trần của `createDryRunBatch` — lượt
 * nặng nhất của module: đọc một workbook tới 4 MB, dựng từng dòng, rồi dò trùng
 * trên toàn bộ hồ sơ đã có. Mặc định của nền tảng ngắn hơn nhiều so với việc đó.
 * **60 giây là mức trần của gói Vercel Hobby** (`docs/12` §1) — đặt cao hơn thì
 * hỏng ở bước triển khai chứ không phải ở đây.
 */
export const maxDuration = 60;

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "outline" }> =
  {
    dry_run: { label: "Đã kiểm tra, chờ xác nhận", variant: "warning" },
    partially_committed: { label: "Ghi một phần — còn dòng lỗi", variant: "warning" },
    committed: { label: "Đã ghi vào hệ thống", variant: "success" },
    cancelled: { label: "Đã huỷ", variant: "outline" },
  };

const SOURCE_LABELS: Record<string, string> = {
  syll: "sheet SYLL",
  ds_dau_nam: "sheet DS_dau_nam",
  template: "file mẫu chuẩn",
};

function BatchCard({ batch }: { batch: BatchSummary }) {
  const status = STATUS_LABELS[batch.status] ?? { label: batch.status, variant: "outline" as const };

  return (
    <li>
      <Link
        href={`/imports/${batch.id}`}
        className="block rounded-lg border border-line-strong p-4 transition-colors hover:border-theme-primary hover:bg-theme-soft"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="break-all font-medium">{batch.filename}</p>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          {batch.totalRows} dòng · hợp lệ {batch.validRows} · cảnh báo {batch.warningRows} · lỗi{" "}
          {batch.errorRows}
          {batch.committedRows > 0 ? ` · đã ghi ${batch.committedRows}` : ""}
        </p>
        <p className="text-xs text-ink-muted">
          Nguồn: {SOURCE_LABELS[batch.sourceFormat] ?? batch.sourceFormat} · tải lên{" "}
          {formatDateTimeVi(batch.createdAt)}
          {/* TO-BE 7 — người tải lên. Không in dấu gạch vào chỗ chờ tên người
              (bài học nợ #13 của M09): tài khoản đã xoá thì nói ra điều đó. */}
          {batch.uploaderName ? ` bởi ${batch.uploaderName}` : " (người tải lên không còn tài khoản)"}
          {batch.cancelledAt ? ` · huỷ ${formatDateTimeVi(batch.cancelledAt)}` : ""}
          {batch.rawPurgedAt ? " · đã xoá dữ liệu thô" : ""}
        </p>
      </Link>
    </li>
  );
}

/** Câu mô tả phạm vi đang xem — một danh sách tự thu hẹp mà không nói gì là bài học D-108. */
function scopeText(criteria: BatchListCriteria, yearLabel: string | null): string {
  const parts: string[] = [];
  if (criteria.yearId === "all") parts.push("mọi năm học");
  else if (yearLabel) parts.push(`năm học ${yearLabel}`);
  if (criteria.status !== "all") parts.push(`trạng thái "${BATCH_STATUS_FILTER_LABELS[criteria.status]}"`);
  return parts.length > 0 ? `Đang xem ${parts.join(" · ")}.` : "";
}

export default async function ImportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireImportPage();
  const criteria = parseBatchListCriteria(await searchParams);
  const [year, years] = await Promise.all([getCurrentAcademicYear(), listImportYears()]);
  const [list, classOptions] = await Promise.all([
    listBatches(criteria, year?.id ?? null),
    year ? listClassOptions(year.id) : Promise.resolve([]),
  ]);
  const filtered = hasActiveBatchFilter(criteria);
  const selectedYear =
    criteria.yearId === "current"
      ? (year?.code ?? null)
      : criteria.yearId === "all"
        ? null
        : (years.find((item) => item.id === criteria.yearId)?.code ?? null);

  return (
    <PageContainer>
      <PageHeader
        title="Nhập dữ liệu Excel"
        description="Tải file lên để kiểm tra thử, xem trước kết quả rồi mới ghi vào hệ thống."
      />

      {!year ? (
        <EmptyState
          variant="no-data"
          title="Chưa có năm học hiện hành"
          description="Nhập dữ liệu luôn ghi danh vào năm học đang áp dụng, mà hiện chưa có năm nào ở trạng thái đó. Hãy đặt năm học hiện hành ở trang Quản trị trước."
          action={
            <Link
              href="/admin"
              className="inline-flex h-control min-h-control items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              Mở trang Quản trị
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tải file lên</CardTitle>
            </CardHeader>
            <CardContent>
              <ImportUploadForm yearCode={year.code} classOptions={classOptions} />
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Lần nhập gần đây</h2>

            {/*
              M12-B / TO-BE 7. Mặc định là **năm học hiện hành** (D-135): mọi lần
              nhập đều ghi danh vào năm đang chạy, nên lần nhập của năm cũ chỉ còn
              giá trị tra cứu. Phạm vi đang xem được nói thẳng ra bên dưới — một
              danh sách tự ẩn bớt mà im lặng thì người dùng tưởng dữ liệu mất.
            */}
            <FilterBar
              legend="Lọc danh sách lần nhập"
              action="/imports"
              resetHref={filtered ? "/imports" : undefined}
            >
              <FilterField
                label="Năm học"
                htmlFor="filter-batch-year"
                helper="Mặc định chỉ hiện lần nhập của năm học đang chạy."
              >
                <Select id="filter-batch-year" name="year" defaultValue={criteria.yearId}>
                  <option value="current">Năm học hiện hành</option>
                  <option value="all">Tất cả năm học</option>
                  {years.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} — {item.name}
                    </option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Trạng thái" htmlFor="filter-batch-status">
                <Select id="filter-batch-status" name="status" defaultValue={criteria.status}>
                  {BATCH_STATUS_FILTERS.map((value) => (
                    <option key={value} value={value}>
                      {BATCH_STATUS_FILTER_LABELS[value]}
                    </option>
                  ))}
                </Select>
              </FilterField>
            </FilterBar>

            {list.batches.length === 0 ? (
              <EmptyState
                variant="no-data"
                title={filtered ? "Không có lần nhập nào khớp bộ lọc" : "Chưa có lần nhập dữ liệu nào"}
                description={
                  filtered
                    ? `${scopeText(criteria, selectedYear)} Bỏ bớt bộ lọc để xem các lần nhập khác.`
                    : `Năm học ${year.code} chưa có lần nhập Excel nào. Tải một file lên để bắt đầu — bước tải lên chỉ kiểm tra, chưa ghi gì vào hệ thống.`
                }
                action={
                  filtered ? (
                    <Link href="/imports" className="text-sm font-medium underline underline-offset-4">
                      Xoá bộ lọc
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <>
                <p className="text-sm text-ink-muted">
                  {list.totalItems} lần nhập. {scopeText(criteria, selectedYear)}
                </p>
                <ul aria-label="Danh sách lần nhập" className="grid gap-3">
                  {list.batches.map((batch) => (
                    <BatchCard key={batch.id} batch={batch} />
                  ))}
                </ul>
              </>
            )}

            {list.totalItems > list.pageSize ? (
              <Pagination
                page={list.page}
                pageSize={list.pageSize}
                totalItems={list.totalItems}
                itemLabel="lần nhập"
                buildHref={(target) => batchListHref(criteria, target)}
              />
            ) : null}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
