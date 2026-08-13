import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/filter-bar";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTimeVi } from "@/lib/dates";
import { BatchActions } from "@/features/imports/components/batch-actions";
import { BatchRowEditor } from "@/features/imports/components/batch-row-editor";
import {
  batchRowsHref,
  hasActiveRowFilter,
  parseBatchRowCriteria,
  ROW_STATUS_FILTERS,
  ROW_STATUS_FILTER_LABELS,
} from "@/features/imports/batch-directory";
import { getBatchDetail } from "@/features/imports/server/queries";
import { requireImportPage } from "@/features/imports/server/permissions";

/**
 * M12-C / TO-BE 8 / NC-01. Trần thời gian của trang cũng là trần của `commitBatch`
 * gửi từ trang này: ghi 1.000 dòng là **10 lượt gọi RPC nối đuôi nhau**, mỗi lượt
 * tạo tới 100 hồ sơ kèm phụ huynh, bí tích, sức khoẻ và ghi danh.
 *
 * ⚠️ 60 giây (trần gói Hobby) **không bảo đảm** ghi xong một file sát trần trong
 * một lượt — và điều đó chấp nhận được vì `commitBatch` chỉ lấy dòng còn ở trạng
 * thái `valid`/`warning`: bấm "Ghi" lần nữa là chạy tiếp từ chỗ dừng, không tạo
 * hồ sơ trùng (AC-05, pgTAP `011:164-168`).
 */
export const maxDuration = 60;

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "outline" }> =
  {
    dry_run: { label: "Đã kiểm tra, chờ xác nhận", variant: "warning" },
    partially_committed: { label: "Ghi một phần — còn dòng lỗi", variant: "warning" },
    committed: { label: "Đã ghi vào hệ thống", variant: "success" },
    cancelled: { label: "Đã huỷ", variant: "outline" },
  };

/** `#3, #17, #42…` — cùng khuôn câu chặn của `commitBatch`, tối đa 5 số. */
function sampleText(sample: readonly number[], total: number): string {
  return `${sample.map((rowNumber) => `#${rowNumber}`).join(", ")}${total > sample.length ? "…" : ""}`;
}

export default async function ImportBatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireImportPage();
  const { batchId } = await params;
  const criteria = parseBatchRowCriteria(await searchParams);
  const batch = await getBatchDetail(batchId, criteria);
  if (!batch) notFound();

  const status = STATUS_LABELS[batch.status] ?? { label: batch.status, variant: "outline" as const };
  const filtered = hasActiveRowFilter(criteria);

  return (
    <PageContainer>
      <PageHeader
        title={batch.filename}
        description={`${batch.totalRows} dòng · hợp lệ ${batch.validRows} · cảnh báo ${batch.warningRows} · lỗi ${batch.errorRows}`}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Xác nhận ghi vào hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <Badge variant={status.variant}>{status.label}</Badge>
              <span>Tải lên {formatDateTimeVi(batch.createdAt)}</span>
              {/* TO-BE 7 — ai tải lên. Tài khoản đã xoá để lại `null`, và nói
                  "không còn tài khoản" đúng hơn là in một dấu gạch. */}
              <span>· {batch.uploaderName ? `bởi ${batch.uploaderName}` : "người tải lên không còn tài khoản"}</span>
              {batch.cancelledAt ? <span>· Huỷ {formatDateTimeVi(batch.cancelledAt)}</span> : null}
            </div>

            {/*
              AC-19 / D-133 — nói TRƯỚC khi người dùng bấm Ghi rồi bị chặn. Câu
              chặn của Server Action là lưới cuối; để nó thành thông báo duy nhất
              là bắt người dùng đi tìm lý do sau khi đã thất bại một lượt.

              🔴 M12-B: con số này đếm trong CƠ SỞ DỮ LIỆU, không đếm trên trang
              dòng đang xem. Từ đợt này trang chỉ hiện 50 dòng, nên đếm theo trang
              sẽ báo "0 dòng chờ xác nhận" chỉ vì chúng nằm ở trang 4.
            */}
            {batch.undecidedCount > 0 ? (
              /* Nợ #5 — `border-warning/30` KHÔNG sinh ra lớp CSS nào (token màu
                 là `var()` trần nên Tailwind bỏ bổ ngữ độ mờ), tức dải cảnh báo
                 này chưa từng có viền vàng. Dùng token đặc. */
              <p className="rounded-md border border-warning bg-warning-subtle p-3 text-sm text-ink">
                <strong>{batch.undecidedCount} dòng</strong> nghi trùng chắc chắn với hồ sơ đã có (
                {sampleText(batch.undecidedSample, batch.undecidedCount)}). Hãy mở từng dòng, đối
                chiếu hồ sơ rồi bấm <em>Xác nhận dòng</em> — chưa xác nhận hết thì chưa ghi được.
              </p>
            ) : null}

            {batch.missingGenderCount > 0 ? (
              <p className="rounded-md border border-line-strong bg-surface-muted p-3 text-sm text-ink">
                <strong>{batch.missingGenderCount} dòng</strong> chưa có giới tính (
                {sampleText(batch.missingGenderSample, batch.missingGenderCount)}). Sổ SYLL của giáo
                xứ không có cột này nên phải chọn tay; đánh dấu nhiều dòng rồi bấm{" "}
                <em>Áp dụng Nam/Nữ cho dòng đang chọn</em> để điền nhanh. Hệ thống{" "}
                <strong>không tự đoán</strong> giới tính theo tên.
              </p>
            ) : null}

            <BatchActions
              batchId={batch.id}
              filename={batch.filename}
              status={batch.status}
              pendingRows={batch.pendingRows}
              totalRows={batch.totalRows}
              rawPurged={batch.rawPurgedAt !== null}
            />

            {/*
              TO-BE 5 / AC-22 — cây cầu tới Giáo lý viên lớp. Họ là người BIẾT
              dữ liệu còn thiếu (em nào Nam, em nào Nữ) nhưng `route-map.ts`
              không cho họ vào `/imports`, và điều đó đúng. Không có file này thì
              Thư ký phải chép tay từng dòng lỗi ra tin nhắn.

              Là route handler trả tệp, không phải trang: `next/link` sẽ điều
              hướng phía trình duyệt và làm hỏng lượt tải — cùng lý do với nút
              "Tải file mẫu" ở trang danh sách.
            */}
            <div className="flex flex-wrap items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href={`/imports/${batch.id}/errors`}
                download
                className="inline-flex h-control min-h-control items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
              >
                Tải file lỗi / kết quả
              </a>

              <Link
                href="/imports"
                className="inline-flex min-h-11 items-center text-sm font-medium text-ink underline underline-offset-4"
              >
                ← Danh sách lần nhập
              </Link>
            </div>

            <p className="text-xs text-ink-muted">
              File tải về có hai sheet: <strong>LOI</strong> liệt kê dòng còn lỗi hoặc cảnh báo để
              gửi cho Giáo lý viên lớp bổ sung, <strong>KET_QUA</strong> ghi dòng nào đã thành hồ sơ
              nào (mã thiếu nhi).
            </p>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Chi tiết từng dòng</h2>

          <FilterBar
            legend="Lọc dòng của lần nhập"
            action={`/imports/${batch.id}`}
            resetHref={filtered ? `/imports/${batch.id}` : undefined}
          >
            <div>
              <Label htmlFor="filter-row-status">Trạng thái dòng</Label>
              <Select
                id="filter-row-status"
                name="status"
                defaultValue={criteria.status}
                className="mt-1"
              >
                {ROW_STATUS_FILTERS.map((value) => (
                  <option key={value} value={value}>
                    {ROW_STATUS_FILTER_LABELS[value]}
                  </option>
                ))}
              </Select>
            </div>
          </FilterBar>

          {batch.rows.length === 0 ? (
            <EmptyState
              variant="no-data"
              title={filtered ? "Không có dòng nào khớp bộ lọc" : "Lần nhập này không có dòng nào"}
              description={
                filtered
                  ? `Lần nhập có ${batch.totalRows} dòng nhưng không dòng nào ở trạng thái "${ROW_STATUS_FILTER_LABELS[criteria.status]}". Bỏ lọc để xem tất cả.`
                  : "File tải lên không có dòng dữ liệu nào đọc được."
              }
              action={
                filtered ? (
                  <Link
                    href={`/imports/${batch.id}`}
                    className="text-sm font-medium underline underline-offset-4"
                  >
                    Xoá bộ lọc
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <BatchRowEditor
              batchId={batch.id}
              rows={batch.rows}
              batchCancelled={batch.status === "cancelled"}
            />
          )}

          {batch.filteredRows > batch.pageSize ? (
            <Pagination
              page={batch.page}
              pageSize={batch.pageSize}
              totalItems={batch.filteredRows}
              itemLabel="dòng"
              buildHref={(target) => batchRowsHref(batch.id, criteria, target)}
            />
          ) : null}
        </section>
      </div>
    </PageContainer>
  );
}
