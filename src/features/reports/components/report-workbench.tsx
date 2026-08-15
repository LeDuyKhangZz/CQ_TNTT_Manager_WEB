"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { DateField } from "@/components/ui/date-field";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDateTimeVi, formatDateVi } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  REPORT_PERIODS,
  REPORT_PERIOD_LABELS,
  REPORT_SCOPE_LABELS,
  REPORT_TYPES,
  REPORT_TYPE_LABELS,
  reportEmptyMessage,
  reportFilterToSearchParams,
  type ReportPeriod,
  type ReportScope,
  type ReportType,
} from "../filters";
import { createReportSnapshot } from "../server/actions";
import type { ReportRow, ReportsPageData } from "../server/queries";
import { useGlobalLoading, useGlobalPending } from "@/components/loading/loading-provider";

type Message = { tone: "success" | "danger"; text: string } | null;

/** Tiêu đề của trạng thái rỗng — mỗi lý do một câu, không gộp (TB-04 bước 4). */
const EMPTY_TITLES: Readonly<Record<ReportsPageData["reason"], string>> = {
  out_of_scope: "Phạm vi này nằm ngoài phần bạn phụ trách",
  no_finalized_session: "Chưa có buổi điểm danh nào được chốt",
  empty: "Chưa có số liệu trong khoảng thời gian này",
};

export function ReportWorkbench({
  data,
  filterWarning,
}: {
  data: ReportsPageData;
  filterWarning: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useGlobalPending(pending);
  // Lọc báo cáo là một lần đổi route do MÃ LỆNH gây ra, không đi qua bộ bắt click
  // của `LoadingProvider` — phải tự báo (`17` §3.4).
  const { beginNavigation } = useGlobalLoading();
  const [message, setMessage] = useState<Message>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>(data.filter.reportType);
  const [periodType, setPeriodType] = useState<ReportPeriod>(data.filter.periodType);
  const [scopeType, setScopeType] = useState<ReportScope>(data.filter.scopeType);

  // 🔴 D-171 — báo cáo "Kết quả học tập" LUÔN là cả năm học, và ô chọn kỳ biến
  // mất thay vì đứng đó nói dối. Ép ở đây **và** ở máy chủ: một ô chọn ẩn đi
  // không phải một hàng rào (`AGENTS` §5), chỉ là không mời người dùng chọn một
  // thứ hệ thống sẽ lặng lẽ bỏ qua.
  const periodLocked = reportType === "results";
  const effectivePeriodType: ReportPeriod = periodLocked ? "year" : periodType;

  // Gõ tay `?scopeType=sector` vào thanh địa chỉ là chuyện làm được, và khi ấy
  // giá trị đang chọn có thể nằm ngoài danh sách trang cho phép. Một ô chọn có
  // `value` không khớp lựa chọn nào sẽ hiện **ô trống** — người dùng đọc là
  // "hỏng" chứ không đọc ra "ngoài phạm vi", trong khi bảng bên dưới đã nói
  // đúng lý do rồi. Giữ giá trị ấy lại trong danh sách để hai chỗ không nói
  // ngược nhau.
  const scopeTypeOptions = data.availableScopeTypes.includes(scopeType)
    ? data.availableScopeTypes
    : [...data.availableScopeTypes, scopeType];

  const scopeOptions = scopeType === "sector"
    ? data.sectors.map((sector) => ({ id: sector.id, label: sector.name }))
    : scopeType === "class"
      ? data.classes.map((item) => ({ id: item.id, label: item.name }))
      : [];
  // Chỉ có đúng một lựa chọn thì ô chọn là một thao tác thừa: hiện nhãn tĩnh và
  // gửi kèm giá trị (TB-04 bước 1).
  const lockedScopeOption = scopeType !== "global" && scopeOptions.length === 1
    ? scopeOptions[0]
    : null;

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = reportFilterToSearchParams({
      reportType,
      periodType: effectivePeriodType,
      anchorDate: String(formData.get("anchorDate") ?? data.filter.anchorDate),
      scopeType,
      scopeId: scopeType === "global" ? null : String(formData.get("scopeId") ?? "") || null,
    });
    beginNavigation();
    router.push(`/reports?${params.toString()}`);
  }

  function snapshot() {
    setConfirmOpen(false);
    setMessage(null);
    startTransition(async () => {
      const result = await createReportSnapshot(data.filter);
      setMessage(result.ok
        ? { tone: "success", text: "Đã chốt báo cáo. Bản chốt không đổi khi dữ liệu thay đổi về sau." }
        : { tone: "danger", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  const exportParams = reportFilterToSearchParams(data.filter);
  const periodRange = `${formatDateVi(data.from)} – ${formatDateVi(data.to)}`;

  const columns = data.headers.map((header, index) => ({
    key: `col-${index}`,
    header,
    numeric: index > 0,
    cell: (row: ReportRow) => (index === 0 ? row.className : row.values[index - 1] ?? "—"),
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle as="h2">Bộ lọc</CardTitle>
          <CardDescription>File tải về và bản chốt dùng đúng bộ lọc đang hiển thị.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={applyFilter} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Label htmlFor="report-type">Loại báo cáo</Label>
              <Select
                id="report-type"
                className="mt-1"
                value={reportType}
                onChange={(event) => setReportType(event.target.value as ReportType)}
              >
                {REPORT_TYPES.map((value) => (
                  <option key={value} value={value}>{REPORT_TYPE_LABELS[value]}</option>
                ))}
              </Select>
            </div>
            {periodLocked ? (
              <div>
                <span className="text-sm font-medium text-ink">Kỳ báo cáo</span>
                <p className="mt-1 flex h-control items-center rounded-md border border-line bg-surface-muted px-3 text-sm text-ink">
                  {REPORT_PERIOD_LABELS.year}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Báo cáo Kết quả học tập luôn tính cho cả năm học.
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="period-type">Kỳ báo cáo</Label>
                <Select
                  id="period-type"
                  className="mt-1"
                  value={periodType}
                  onChange={(event) => setPeriodType(event.target.value as ReportPeriod)}
                >
                  {REPORT_PERIODS.map((value) => (
                    <option key={value} value={value}>{REPORT_PERIOD_LABELS[value]}</option>
                  ))}
                </Select>
              </div>
            )}
            {periodLocked ? (
              // Ngày trong kỳ không còn nghĩa gì khi kỳ là cả năm học, nhưng giá
              // trị vẫn phải đi theo biểu mẫu: bỏ hẳn là mất mốc khi người dùng
              // đổi ngược về "Chuyên cần".
              <input type="hidden" name="anchorDate" value={data.filter.anchorDate} />
            ) : (
              <div>
                <Label htmlFor="anchor-date">Ngày trong kỳ</Label>
                <DateField
                  id="anchor-date"
                  name="anchorDate"
                  className="mt-1"
                  defaultValue={data.filter.anchorDate}
                />
              </div>
            )}
            <div>
              <Label htmlFor="scope-type">Phạm vi</Label>
              <Select
                id="scope-type"
                className="mt-1"
                value={scopeType}
                onChange={(event) => setScopeType(event.target.value as ReportScope)}
              >
                {scopeTypeOptions.map((value) => (
                  <option key={value} value={value}>{REPORT_SCOPE_LABELS[value]}</option>
                ))}
              </Select>
            </div>
            {scopeType !== "global" && lockedScopeOption ? (
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-ink">{scopeType === "sector" ? "Ngành" : "Lớp"}</span>
                <p className="mt-1 flex h-control items-center rounded-md border border-line bg-surface-muted px-3 text-sm text-ink">
                  {lockedScopeOption.label}
                </p>
                <input type="hidden" name="scopeId" value={lockedScopeOption.id} />
              </div>
            ) : null}
            {scopeType !== "global" && !lockedScopeOption ? (
              <div className="md:col-span-2">
                <Label htmlFor="scope-id">Chọn {scopeType === "sector" ? "ngành" : "lớp"}</Label>
                <Select
                  id="scope-id"
                  name="scopeId"
                  required
                  defaultValue={data.filter.scopeId ?? ""}
                  placeholder="Chọn phạm vi"
                  className="mt-1"
                >
                  {scopeOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </Select>
              </div>
            ) : null}
            <div className="md:col-span-2 xl:col-span-4">
              <Button type="submit">Xem báo cáo</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* `role="status"` chứ không `alert`: đây là việc đã được xử lý xong và
          báo lại, không phải một lỗi đang chặn người dùng (TB-04 bước 3). */}
      {filterWarning ? <FormMessage tone="info">{filterWarning}</FormMessage> : null}
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle as="h2">{data.title}</CardTitle>
              <CardDescription>
                {data.academicYear ? `Năm học ${data.academicYear.code} · ` : ""}
                {periodRange}
                {data.filter.reportType === "results" ? " (kết quả tính cho cả năm học)" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                href={`/reports/export?${exportParams.toString()}&format=xlsx`}
              >
                Tải Excel
              </a>
              <a
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                href={`/reports/export?${exportParams.toString()}&format=pdf`}
              >
                Tải PDF
              </a>
              {/* Vai trò không bao giờ chốt được (Cha sở · Cha phó · Thủ quỹ)
                  thì không thấy nút. Người chốt được nhưng đang đứng ở phạm vi
                  rộng hơn phần mình phụ trách thì thấy nút vô hiệu KÈM LÝ DO —
                  ẩn nút với họ là giấu mất chức năng họ vào trang để dùng. */}
              {data.canSnapshotAnyScope ? (
                <Button
                  size="sm"
                  disabled={pending || !data.canSnapshot || data.rows.length === 0}
                  aria-busy={pending}
                  aria-describedby={data.canSnapshot ? undefined : "snapshot-scope-hint"}
                  onClick={() => setConfirmOpen(true)}
                >
                  {pending ? "Đang chốt…" : "Chốt báo cáo"}
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.canSnapshotAnyScope && !data.canSnapshot ? (
            <p id="snapshot-scope-hint" className="mb-3 text-sm text-ink-muted">
              Bạn chỉ chốt được báo cáo trong phạm vi lớp hoặc ngành mình phụ trách.
            </p>
          ) : null}

          {/* AC-B15 — số dòng kết quả được thông báo qua vùng `aria-live`. Đổi
              bộ lọc là một lượt dựng lại trang, nên người dùng trình đọc màn
              hình không có cách nào biết kết quả đã đổi nếu không có dòng này. */}
          <p aria-live="polite" className="mb-3 text-sm text-ink-muted">
            Đang xem: {REPORT_TYPE_LABELS[data.filter.reportType]} · {REPORT_PERIOD_LABELS[data.filter.periodType]}
            {" "}({periodRange}) · {data.scopeLabel} · <strong>{data.rows.length} dòng</strong>.
          </p>

          {data.rows.length === 0 ? (
            <EmptyState
              variant={data.reason === "out_of_scope" ? "out-of-scope" : "no-data"}
              title={EMPTY_TITLES[data.reason]}
              description={`${data.scopeLabel} — ${reportEmptyMessage(data.reason)}`}
            />
          ) : (
            <DataTable
              caption={`${data.title} · ${data.scopeLabel} · ${periodRange}.`}
              columns={columns}
              rows={data.rows}
              getRowKey={(row) => row.classId}
              minWidthClassName="min-w-[640px]"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle as="h2">Báo cáo đã chốt</CardTitle>
              <CardDescription>Bản chốt giữ nguyên số liệu và bộ lọc tại thời điểm chốt.</CardDescription>
            </div>
            {/* TB-06 — kho 5 năm có cửa vào riêng, có lọc và phân trang. */}
            <Link
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              href="/reports/snapshots"
            >
              Mở kho bản chốt
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.snapshots.length === 0 ? (
            <p className="text-sm text-ink-muted">Chưa có báo cáo nào được chốt.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.snapshots.map((snapshotRow) => (
                <li key={snapshotRow.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/reports/snapshots/${snapshotRow.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {snapshotRow.title}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      Chốt lúc {formatDateTimeVi(snapshotRow.generatedAt)} · mã kiểm tra{" "}
                      {snapshotRow.checksum.slice(0, 12)}…
                    </p>
                  </div>
                  <a
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    href={`/reports/snapshots/${snapshotRow.id}/export?format=xlsx`}
                  >
                    Tải bản chốt
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 🔴 AC-B09 / D-172 — hộp xác nhận trước một thao tác KHÔNG LÙI ĐƯỢC.
          `report_snapshots` chỉ có `grant select, insert`: bản chốt sai nằm lại
          vĩnh viễn, kể cả Quản trị viên hệ thống cũng không xoá được. Hộp nêu
          hậu quả bằng TÊN RIÊNG (`11` §5): loại · kỳ · khoảng ngày · phạm vi ·
          số dòng — và nếu đã có bản trùng thì nói ra ngày và tên người chốt. */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={snapshot}
        pending={pending}
        tone="primary"
        title="Chốt báo cáo?"
        confirmLabel="Chốt báo cáo"
        consequence={
          <span className="space-y-2 block">
            <span className="block">
              Chốt <strong>{REPORT_TYPE_LABELS[data.filter.reportType]}</strong>
              {" · "}kỳ <strong>{REPORT_PERIOD_LABELS[data.filter.periodType]}</strong> ({periodRange})
              {" · "}phạm vi <strong>{data.scopeLabel}</strong>
              {" · "}<strong>{data.rows.length} dòng</strong>.
            </span>
            <span className="block">Bản chốt không sửa và không xoá được.</span>
            {data.duplicate ? (
              <span className="block font-medium text-danger">
                Đã có {data.duplicate.count} bản chốt trùng loại, trùng phạm vi và trùng kỳ.
                Bản gần nhất chốt lúc {formatDateTimeVi(data.duplicate.generatedAt)}
                {data.duplicate.generatedByName ? ` bởi ${data.duplicate.generatedByName}` : ""}.
                Chốt tiếp sẽ tạo thêm một bản nữa, không thay thế bản cũ.
              </span>
            ) : null}
          </span>
        }
      />
    </div>
  );
}
