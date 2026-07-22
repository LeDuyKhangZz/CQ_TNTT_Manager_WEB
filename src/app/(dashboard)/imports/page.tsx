import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { createDryRunBatch } from "@/features/imports/server/actions";
import {
  getCurrentAcademicYear,
  listBatches,
  listClassOptions,
  type BatchSummary,
} from "@/features/imports/server/queries";
import { requireImportPage } from "@/features/imports/server/permissions";

const STATUS_LABELS: Record<string, string> = {
  dry_run: "Đã kiểm tra, chờ xác nhận",
  partially_committed: "Ghi một phần — còn dòng lỗi",
  committed: "Đã ghi vào hệ thống",
  cancelled: "Đã hủy",
};

async function uploadAction(formData: FormData) {
  "use server";
  await createDryRunBatch(formData);
}

function BatchRow({ batch }: { batch: BatchSummary }) {
  return (
    <Link
      href={`/imports/${batch.id}`}
      className="block rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium break-all">{batch.filename}</p>
        <Badge variant={batch.status === "committed" ? "secondary" : "outline"}>
          {STATUS_LABELS[batch.status] ?? batch.status}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {batch.totalRows} dòng · hợp lệ {batch.validRows} · cảnh báo {batch.warningRows} · lỗi{" "}
        {batch.errorRows}
        {batch.committedRows > 0 ? ` · đã ghi ${batch.committedRows}` : ""}
      </p>
      <p className="text-xs text-muted-foreground">
        Nguồn: {batch.sourceFormat === "syll" ? "sheet SYLL" : batch.sourceFormat === "ds_dau_nam" ? "sheet DS_dau_nam" : "file mẫu chuẩn"}
      </p>
    </Link>
  );
}

export default async function ImportsPage() {
  await requireImportPage();
  const [year, batches] = await Promise.all([getCurrentAcademicYear(), listBatches()]);
  const classOptions = year ? await listClassOptions(year.id) : [];

  return (
    <PageContainer>
      <PageHeader
        title="Nhập dữ liệu Excel"
        description="Tải file lên để kiểm tra thử, xem trước kết quả rồi mới ghi vào hệ thống."
      />

      {!year ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              Chưa có năm học hiện hành. Vào trang Quản trị để đặt năm học trước khi nhập dữ liệu.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tải file lên</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Dữ liệu sẽ được ghi danh vào năm học <strong>{year.code}</strong>. Hệ thống đọc được
                file mẫu chuẩn, sheet <strong>SYLL</strong> hoặc sheet <strong>DS_dau_nam</strong> của
                sổ lớp. Bước tải lên chỉ kiểm tra, chưa ghi gì vào hệ thống.
              </p>

              <form action={uploadAction} className="space-y-3">
                <input
                  type="file"
                  name="file"
                  required
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="block w-full rounded-md border border-input bg-background p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
                />

                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="classId">
                    Lớp đích (nếu file không có cột lớp)
                  </label>
                  <select
                    id="classId"
                    name="classId"
                    defaultValue=""
                    className="block w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
                  >
                    <option value="">— Lấy theo cột lớp trong file —</option>
                    {classOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.displayName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Sổ lớp Chiên Con không có cột lớp — hãy chọn lớp ở đây. Dòng nào đã ghi lớp
                    trong file thì vẫn ưu tiên giá trị trong file.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit">Kiểm tra file</Button>
                  {/* This is a file download served by a route handler, not a
                      page: next/link would client-navigate and break it. */}
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                  <a
                    href="/imports/template"
                    download
                    className="inline-flex h-11 min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
                  >
                    Tải file mẫu
                  </a>
                </div>
              </form>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Lần nhập gần đây</h3>
            {batches.length === 0 ? (
              <Card>
                <CardContent className="py-6">
                  <p className="text-sm text-muted-foreground">Chưa có lần nhập dữ liệu nào.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {batches.map((batch) => (
                  <BatchRow key={batch.id} batch={batch} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
