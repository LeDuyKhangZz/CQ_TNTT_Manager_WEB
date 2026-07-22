import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  commitBatch,
  deleteBatch,
  setRowAction,
  setRowGender,
} from "@/features/imports/server/actions";
import { getBatchDetail, type BatchRow } from "@/features/imports/server/queries";
import { requireImportPage } from "@/features/imports/server/permissions";

const ROW_STATUS: Record<string, { label: string; variant: "secondary" | "outline" | "danger" }> = {
  valid: { label: "Hợp lệ", variant: "secondary" },
  warning: { label: "Cảnh báo", variant: "outline" },
  error: { label: "Lỗi", variant: "danger" },
  committed: { label: "Đã ghi", variant: "secondary" },
  skipped: { label: "Bỏ qua", variant: "outline" },
};

const ACTION_LABELS: Record<string, string> = {
  create: "Tạo mới",
  merge: "Ghép hồ sơ có sẵn",
  skip: "Bỏ qua",
};

async function commitAction(formData: FormData) {
  "use server";
  await commitBatch(String(formData.get("batchId") ?? ""));
}

async function discardAction(formData: FormData) {
  "use server";
  await deleteBatch(String(formData.get("batchId") ?? ""));
}

async function rowActionForm(formData: FormData) {
  "use server";
  const action = String(formData.get("action") ?? "create");
  if (action !== "create" && action !== "merge" && action !== "skip") return;
  await setRowAction(String(formData.get("rowId") ?? ""), action);
}

async function rowGenderForm(formData: FormData) {
  "use server";
  const gender = String(formData.get("gender") ?? "");
  if (gender !== "male" && gender !== "female" && gender !== "other") return;
  await setRowGender(String(formData.get("rowId") ?? ""), gender);
}

function RowCard({ row }: { row: BatchRow }) {
  const status = ROW_STATUS[row.status] ?? { label: row.status, variant: "outline" as const };
  const decided = row.status === "committed" || row.status === "skipped";

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            <span className="text-muted-foreground">#{row.rowNumber}</span> {row.fullName || "(chưa có tên)"}
          </p>
          {row.className ? (
            <p className="text-sm text-muted-foreground">Lớp: {row.className}</p>
          ) : null}
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {row.errors.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
          {row.errors.map((issue, index) => (
            <li key={`${issue.field}-${index}`}>{issue.message}</li>
          ))}
        </ul>
      ) : null}

      {row.warnings.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {row.warnings.map((issue, index) => (
            <li key={`${issue.field}-${index}`}>{issue.message}</li>
          ))}
        </ul>
      ) : null}

      {row.commitError ? (
        <p className="mt-2 text-sm text-destructive">Lỗi khi ghi: {row.commitError}</p>
      ) : null}

      {!decided && !row.gender && row.action === "create" ? (
        <form action={rowGenderForm} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="rowId" value={row.id} />
          <label className="text-sm font-medium" htmlFor={`gender-${row.id}`}>
            Giới tính:
          </label>
          <select
            id={`gender-${row.id}`}
            name="gender"
            defaultValue=""
            className="min-h-11 rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="" disabled>
              — Chọn —
            </option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Lưu giới tính
          </Button>
        </form>
      ) : null}

      {decided || row.status === "error" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Quyết định: {ACTION_LABELS[row.action] ?? row.action}
        </p>
      ) : (
        <form action={rowActionForm} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="rowId" value={row.id} />
          <label className="text-sm text-muted-foreground" htmlFor={`action-${row.id}`}>
            Xử lý:
          </label>
          <select
            id={`action-${row.id}`}
            name="action"
            defaultValue={row.action}
            className="min-h-11 rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="create">Tạo mới</option>
            <option value="merge" disabled={!row.matchedStudentId}>
              Ghép hồ sơ có sẵn
            </option>
            <option value="skip">Bỏ qua</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Lưu
          </Button>
        </form>
      )}
    </div>
  );
}

export default async function ImportBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  await requireImportPage();
  const { batchId } = await params;
  const batch = await getBatchDetail(batchId);
  if (!batch) notFound();

  const pending = batch.rows.filter((row) => row.status === "valid" || row.status === "warning");

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
            <p className="text-sm text-muted-foreground">
              {pending.length > 0
                ? `${pending.length} dòng sẽ được ghi. Dòng lỗi không được ghi; hãy sửa file rồi tải lại.`
                : "Không còn dòng nào chờ ghi."}
            </p>
            <div className="flex flex-wrap gap-2">
              {pending.length > 0 ? (
                <form action={commitAction}>
                  <input type="hidden" name="batchId" value={batch.id} />
                  <Button type="submit">Ghi {pending.length} dòng vào hệ thống</Button>
                </form>
              ) : null}
              <form action={discardAction}>
                <input type="hidden" name="batchId" value={batch.id} />
                <Button type="submit" variant="outline">
                  Xóa lần nhập này
                </Button>
              </form>
              <Link
                href="/imports"
                className="inline-flex h-11 min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
              >
                Quay lại
              </Link>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Chi tiết từng dòng</h3>
          <div className="grid gap-3">
            {batch.rows.map((row) => (
              <RowCard key={row.id} row={row} />
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
