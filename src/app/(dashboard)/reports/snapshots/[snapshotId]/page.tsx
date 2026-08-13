import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { FormMessage } from "@/components/ui/form-message";
import { formatDateTimeVi, formatDateVi } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { getReportSnapshotForView, reportsRouteContext } from "@/features/reports/server/queries";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * TB-06 bước 3 — xem lại một bản chốt **trên trình duyệt** (AC-B12).
 *
 * 🔴 Trước trang này, cách duy nhất để biết bên trong một bản chốt có gì là
 * **tải file về và mở ra** — trên máy 360px của giáo lý viên đứng lớp thì đó
 * gần như là không xem được. Kho lưu 5 năm mà chỉ đọc được bằng Excel.
 *
 * Số liệu lấy từ `payload_json`, **không tính lại** (D-51): trang này phải hiện
 * đúng con số của ngày chốt kể cả khi buổi điểm danh nguồn đã bị xoá.
 *
 * `notFound()` cho cả UUID sai lẫn bản ngoài phạm vi — 404 chứ không 403, vì
 * 403 tự nó nói ra rằng bản chốt ấy **tồn tại** (AC-A07).
 */
export default async function ReportSnapshotPage({
  params,
}: {
  params: Promise<{ snapshotId: string }>;
}) {
  await reportsRouteContext();
  const { snapshotId } = await params;
  if (!UUID_PATTERN.test(snapshotId)) notFound();

  const snapshot = await getReportSnapshotForView(snapshotId);
  if (!snapshot) notFound();

  const columns = snapshot.headers.map((header, index) => ({
    key: `col-${index}`,
    header,
    numeric: index > 0,
    cell: (row: Array<string | number | null>) => row[index] ?? "—",
  }));

  return (
    <PageContainer>
      <PageHeader
        title={snapshot.title}
        description={`${snapshot.scopeLabel ?? ""} · ${formatDateVi(snapshot.periodStart)} – ${formatDateVi(snapshot.periodEnd)}`}
        backHref="/reports/snapshots"
        backLabel="Về kho bản chốt"
        action={
          <div className="flex flex-wrap gap-2">
            <a
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              href={`/reports/snapshots/${snapshotId}/export?format=xlsx`}
            >
              Tải Excel
            </a>
            <a
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              href={`/reports/snapshots/${snapshotId}/export?format=pdf`}
            >
              Tải PDF
            </a>
          </div>
        }
      />

      {/* Băng-rôn bất biến — TB-06 bước 3. Đây là điều phân biệt một bản chốt
          với một lượt xem báo cáo, và nó phải nằm TRÊN bảng số. */}
      <FormMessage tone="info">
        Bản chốt lúc {formatDateTimeVi(snapshot.generatedAt)}
        {snapshot.generatedByName ? ` bởi ${snapshot.generatedByName}` : ""} — số liệu không đổi kể cả
        khi dữ liệu nguồn thay đổi về sau.
      </FormMessage>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle as="h2">Số liệu đã chốt</CardTitle>
          <CardDescription>
            {snapshot.academicYearCode ? `Năm học ${snapshot.academicYearCode} · ` : ""}
            {snapshot.rows.length} dòng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {snapshot.headers.length === 0 ? (
            // F09 — cùng ca mà route tải file trả 422: một bản chốt hình dạng lạ
            // không có cột nào. Nói ra thay vì hiện một bảng trống không giải thích.
            <p className="text-sm text-ink-muted">
              Bản chốt này không có dữ liệu bảng nên không hiển thị và không xuất được.
            </p>
          ) : (
            <DataTable
              caption={`Số liệu của bản chốt ${snapshot.title}.`}
              hideCaption
              columns={columns}
              rows={snapshot.rows}
              getRowKey={(_row, index) => `row-${index}`}
              minWidthClassName="min-w-[640px]"
            />
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle as="h2">Mã kiểm tra</CardTitle>
          <CardDescription>
            Chuỗi này tính từ chính số liệu và bộ lọc lúc chốt. Hai bản có cùng mã là hai bản giống nhau từng ô.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="break-all font-mono text-xs text-ink">{snapshot.checksum}</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
